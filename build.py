#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
雷达原型前端构建脚本（零第三方依赖，Python 3.10+）。

产出 dist/：
  assets/app.<hash>.js   —— 14 个 ES 模块按拓扑序打包为单文件（保留 type=module 语义）
  assets/app.<hash>.css  —— 7 个样式表按 HTML 中的顺序合并 + 安全瘦身（去注释）
  index.html             —— 重写为单 CSS + modulepreload + 哈希入口
  *.gz                   —— 预压缩副本（配合 nginx gzip_static / gzip_vary）
  robots.txt, .well-known/security.txt, favicon.svg, data/policies.json

设计原则：
  1) 不做 JS 语法级压缩（本机无 Node/Terser，正则压缩有破坏模板字符串的风险）；
     体积主要收益来自「合并请求 + gzip + 长缓存」。
  2) 导入/导出改写时对每个导入名做静态校验，缺一个就构建立即失败。
  3) 打包产物必须仍能被无头浏览器启动验证（见 verify 步骤）。
"""
import gzip
import hashlib
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
DIST = ROOT / "dist"
ENTRY = "app.js"

# ----------------------------------------------------------------- 解析规则
IMPORT_RE = re.compile(r"import\s*\{([^{}]*)\}\s*from\s*['\"]([^'\"]+)['\"]\s*;?")
BAD_IMPORT_RE = re.compile(r"^\s*import\s+(?!\{)", re.M)          # default/bare import：不支持
EXPORT_DECL_RE = re.compile(
    r"^export\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)", re.M)
EXPORT_LIST_RE = re.compile(r"^\s*export\s*(\{|default)", re.M)     # export {...}/default：不支持


def die(msg: str):
    print(f"[build] FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def key_of(rel: str) -> str:
    return "__m_" + re.sub(r"\W", "_", rel)


def norm_rel(base_dir: str, spec: str) -> str:
    parts = (base_dir.split("/") if base_dir else [])
    for seg in spec.replace("\\", "/").split("/"):
        if seg in ("", "."):
            continue
        if seg == "..":
            if parts:
                parts.pop()
        else:
            parts.append(seg)
    return "/".join(parts)


def parse_names(clause: str):
    names = []
    for item in clause.split(","):
        item = item.strip()
        if not item:
            continue
        m = re.fullmatch(r"([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?", item)
        if not m:
            die(f"无法解析导入项: {item!r}")
        names.append((m.group(1), m.group(2) or m.group(1)))
    return names


def load_module(rel: str, modules: dict):
    if rel in modules:
        return
    path = SRC / rel
    if not path.is_file():
        die(f"缺少模块文件: {rel}")
    text = path.read_text(encoding="utf-8")
    if BAD_IMPORT_RE.search(text):
        die(f"{rel}: 含 default/bare import，构建器暂不支持")
    if EXPORT_LIST_RE.search(text):
        die(f"{rel}: 含 export {{}}/export default，构建器暂不支持")
    imports = [(norm_rel(str(Path(rel).parent), m.group(2)), m.group(1))
               for m in IMPORT_RE.finditer(text)]
    exports = EXPORT_DECL_RE.findall(text)
    modules[rel] = {"text": text, "imports": [i[0] for i in imports],
                    "import_clauses": imports, "exports": exports}
    for dep, _ in imports:
        load_module(dep, modules)


def topo_order(entry: str, modules: dict):
    order, state = [], {}

    def visit(rel):
        st = state.get(rel, 0)
        if st == 1:
            die(f"检测到循环依赖: {rel}")
        if st == 2:
            return
        state[rel] = 1
        for dep in modules[rel]["imports"]:
            visit(dep)
        state[rel] = 2
        order.append(rel)

    visit(entry)
    return order


def rewrite_imports(rel: str, modules: dict) -> str:
    text = modules[rel]["text"]

    def repl(m):
        target = norm_rel(str(Path(rel).parent), m.group(2))
        if target not in modules:
            die(f"{rel}: 未解析的依赖 {m.group(2)}")
        names = parse_names(m.group(1))
        missing = [orig for orig, _ in names if orig not in modules[target]["exports"]]
        if missing:
            die(f"{rel} -> {target}: 导出缺失 {missing}（实际导出: {modules[target]['exports']}）")
        binding = ", ".join(orig if orig == alias else f"{orig}: {alias}" for orig, alias in names)
        return f"const {{{binding}}} = {key_of(target)};"

    return IMPORT_RE.sub(repl, text)


def bundle_js(entry: str, modules: dict, order: list) -> str:
    parts = ["/* 政策补贴雷达 · 单文件产物（由 build.py 从 src/ 模块打包，勿手改） */"]
    for rel in order:
        if rel == entry:
            continue
        body = rewrite_imports(rel, modules)
        body = re.sub(r"^export\s+", "", body, flags=re.M)
        exports = modules[rel]["exports"]
        head = f"\n/* ===== {rel} ===== */\n"
        if exports:
            parts.append(head + f"const {key_of(rel)} = (() => {{\n{body}\nreturn {{{', '.join(exports)}}};\n}})();")
        else:
            parts.append(head + f"(() => {{\n{body}}})();")
    entry_body = rewrite_imports(entry, modules)
    parts.append(f"\n/* ===== {entry}（入口，保留顶层 await） ===== */\n{entry_body}")
    bundle = "\n".join(parts) + "\n"
    if re.search(r"^\s*import\s", bundle, re.M) or re.search(r"^\s*export\s", bundle, re.M):
        die("打包结果仍含 import/export 语句")
    return bundle


# ----------------------------------------------------------------- CSS 处理
def strip_css_comments(text: str) -> str:
    out, i, n, mode = [], 0, len(text), None
    while i < n:
        c = text[i]
        if mode:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(text[i + 1]); i += 2; continue
            if c == mode:
                mode = None
            i += 1
            continue
        if c in "'\"":
            mode = c; out.append(c); i += 1; continue
        if text.startswith("/*", i):
            j = text.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if text[i:i+4].lower() == "url(":
            j = i + 4
            q = None
            while j < n:
                ch = text[j]
                if q:
                    if ch == "\\":
                        j += 2; continue
                    if ch == q:
                        q = None
                elif ch in "'\"":
                    q = ch
                elif ch == ")":
                    break
                j += 1
            out.append(text[i:j + 1]); i = j + 1; continue
        out.append(c); i += 1
    return "".join(out)


def minify_css(text: str) -> str:
    lines = [ln.rstrip() for ln in strip_css_comments(text).splitlines()]
    return "\n".join(ln for ln in lines if ln.strip()) + "\n"


# ----------------------------------------------------------------- 产物输出
def sha8(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:8]


def emit(path: Path, data: bytes, also_gzip=True):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    if also_gzip and len(data) > 256:
        gz = path.with_suffix(path.suffix + ".gz")
        with gzip.GzipFile(gz, "wb", compresslevel=9, mtime=0) as f:
            f.write(data)


def main():
    if not SRC.is_dir():
        die("未找到 src/")

    # ---- 1. 解析 JS 模块图
    modules: dict = {}
    load_module(ENTRY, modules)
    order = topo_order(ENTRY, modules)
    bundle = bundle_js(ENTRY, modules, order)
    js_bytes = bundle.encode("utf-8")

    # ---- 2. 合并 CSS（顺序严格按 index.html 中的出现顺序）
    html = (SRC / "index.html").read_text(encoding="utf-8")
    css_hrefs = re.findall(r'<link rel="stylesheet" href="([^"]+)">', html)
    if not css_hrefs:
        die("index.html 未找到样式表引用")
    css_merged = ""
    for href in css_hrefs:
        css_path = SRC / href.lstrip("/")
        if not css_path.is_file():
            die(f"缺少样式表 {href}")
        css_merged += f"/* ===== {href.lstrip('/')} ===== */\n" + \
            minify_css(css_path.read_text(encoding="utf-8")) + "\n"
    css_bytes = css_merged.encode("utf-8")

    # ---- 3. 哈希文件名
    js_name = f"app.{sha8(js_bytes)}.js"
    css_name = f"app.{sha8(css_bytes)}.css"

    # ---- 4. 重写 HTML（资源引用一律用相对路径，兼容 GitHub Pages 的 /<repo>/ 子路径）
    new_html = re.sub(
        r'(?:<link rel="stylesheet" href="[^"]+">)+',
        f'<link rel="stylesheet" href="assets/{css_name}">',
        html, count=1)
    if new_html == html:
        die("HTML 样式表替换失败")
    new_html = new_html.replace(
        '<script type="module" src="/app.js"></script>',
        f'<link rel="modulepreload" href="assets/{js_name}">'
        f'<script type="module" src="assets/{js_name}"></script>')
    if f'assets/{js_name}' not in new_html:
        die("HTML 入口脚本替换失败")
    html_bytes = new_html.encode("utf-8")

    # ---- 5. 输出 dist
    if DIST.exists():
        shutil.rmtree(DIST)
    (DIST / "assets").mkdir(parents=True)
    emit(DIST / "assets" / js_name, js_bytes)
    emit(DIST / "assets" / css_name, css_bytes)
    emit(DIST / "index.html", html_bytes)

    for extra in ["favicon.svg", "robots.txt", ".well-known/security.txt"]:
        s = SRC / extra
        if s.is_file():
            emit(DIST / extra, s.read_bytes(), also_gzip=False)

    # data 目录整树发布（policies/sources/快照/附件全部随包，运行时零外链依赖）
    for f in sorted((SRC / "data").rglob("*")):
        if f.is_file():
            also_gz = f.suffix in (".json", ".html", ".txt", ".svg")
            emit(DIST / f.relative_to(SRC), f.read_bytes(), also_gzip=also_gz)

    # ---- 6. 体积对照报告
    orig_js = sum(p.stat().st_size for p in SRC.rglob("*") if p.suffix in (".js", ".mjs"))
    orig_css = sum(p.stat().st_size for p in SRC.glob("*.css"))

    def gzsize(b: bytes) -> int:
        return len(gzip.compress(b, 9))

    print("[build] OK")
    print(f"  模块数: {len(order)}  (拓扑序: {', '.join(order)})")
    print(f"  JS   : 原 {orig_js} B / {len(modules)} 文件  ->  {len(js_bytes)} B 单文件 "
          f"(gzip {gzsize(js_bytes)} B)")
    print(f"  CSS  : 原 {orig_css} B / {len(css_hrefs)} 文件  ->  {len(css_bytes)} B 单文件 "
          f"(gzip {gzsize(css_bytes)} B)")
    print(f"  HTML : {len(html_bytes)} B (gzip {gzsize(html_bytes)} B)")
    print(f"  产物: {DIST}")


if __name__ == "__main__":
    main()
