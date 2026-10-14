#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本地预览 / 验证服务器（仅标准库）。

  python serve.py [port]      # 默认 8090

职责：
  1) 从 dist/ 提供静态文件；若存在 .gz 副本且客户端接受 gzip，则原样返回
     （模拟 nginx gzip_static 的传输效果）。
  2) 把 /api/v1/* 与 /data/* 反向代理到原站 https://radar.huixiang17.cn，
     使优化版前端跑在"同一套后端契约"上，用于功能等价验证。
  3) 按 nginx.conf.example 的建议下发安全响应头与缓存策略（本机 dogfooding）。

注意：这是开发验证服务器，不是生产服务器。
"""
import gzip
import http.client
import json
import ssl
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
UPSTREAM_HOST = "radar.huixiang17.cn"
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Content-Security-Policy": (
        "default-src 'self'; script-src 'self'; "
        "style-src 'self'; style-src-attr 'unsafe-inline'; "
        "img-src 'self' data:; font-src 'self'; connect-src 'self'; "
        "object-src 'none'; base-uri 'none'; form-action 'self'; "
        "frame-ancestors 'none'"
    ),
}
PROXY_PREFIXES = ("/api/v1/", "/data/")
STATIC = {
    "/": ("index.html", "no-cache"),
}


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "radar-optdev/1.0"

    # ---------------------------------------------------------- helpers
    def _send(self, status, headers, body, compress_ok=True):
        enc = self.headers.get("Accept-Encoding", "")
        use_gzip = compress_ok and "gzip" in enc
        payload = gzip.compress(body, 9) if use_gzip else body
        self.send_response(status)
        for k, v in headers:
            self.send_header(k, v)
        for k, v in SECURITY_HEADERS.items():
            if k not in dict(headers):
                self.send_header(k, v)
        if use_gzip:
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Vary", "Accept-Encoding")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(payload)

    def _cache_for(self, path):
        if path.startswith("/assets/"):
            return "public, max-age=31536000, immutable"
        return "no-cache"

    # ---------------------------------------------------------- static
    def _serve_static(self, path):
        if path == "/":
            rel, _ = STATIC["/"]
        else:
            rel = path.lstrip("/")
        target = (DIST / rel).resolve()
        if not str(target).startswith(str(DIST.resolve())) or not target.is_file():
            # 尝试 /data、快照等未代理路径的兜底
            self.send_error(404, "Not Found")
            return
        body = target.read_bytes()
        ctype = {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".svg": "image/svg+xml",
            ".txt": "text/plain; charset=utf-8",
        }.get(target.suffix, "application/octet-stream")
        self._send(200, [("Content-Type", ctype),
                         ("Cache-Control", self._cache_for(path))], body)

    # ---------------------------------------------------------- proxy
    def _proxy(self):
        parts = urlsplit(self.path)
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None
        conn = http.client.HTTPSConnection(UPSTREAM_HOST, timeout=20,
                                           context=ssl.create_default_context())
        headers = {"Host": UPSTREAM_HOST, "Accept-Encoding": "identity"}
        if self.headers.get("Content-Type"):
            headers["Content-Type"] = self.headers["Content-Type"]
        try:
            conn.request(self.command, self.path, body=body, headers=headers)
            resp = conn.getresponse()
            data = resp.read()
            keep = [(k, v) for k, v in resp.getheaders()
                    if k.lower() in ("content-type", "cache-control", "etag",
                                     "last-modified", "location")
                    or k.lower().startswith("x-")]
            # 上游安全头交给本机策略覆盖，避免重复下发
            keep = [(k, v) for k, v in keep
                    if k.lower() not in {h.lower() for h in SECURITY_HEADERS}]
            if resp.getheader("Content-Encoding") == "identity" or not resp.getheader("Content-Encoding"):
                self._send(resp.status, keep, data)
            else:
                # 上游已压缩的响应原样透传
                self.send_response(resp.status)
                for k, v in keep:
                    self.send_header(k, v)
                self.send_header("Content-Encoding", resp.getheader("Content-Encoding"))
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                if self.command != "HEAD":
                    self.wfile.write(data)
        except Exception as exc:  # noqa: BLE001 - 验证服务器需要把上游错误显式化
            err = json.dumps({"error": {"message": f"proxy: {exc}"}},
                             ensure_ascii=False).encode("utf-8")
            self._send(502, [("Content-Type", "application/json; charset=utf-8")], err)
        finally:
            conn.close()

    # ---------------------------------------------------------- verbs
    def do_GET(self):
        path = urlsplit(self.path).path
        if path.startswith(PROXY_PREFIXES):
            self._proxy()
        else:
            self._serve_static(path)

    def do_HEAD(self):
        self.do_GET()

    def do_POST(self):
        self._proxy()

    def do_PUT(self):
        self._proxy()

    def do_PATCH(self):
        self._proxy()

    def do_DELETE(self):
        self._proxy()

    def log_message(self, fmt, *args):
        sys.stderr.write("[serve] " + (fmt % args) + "\n")


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8090
    if not (DIST / "index.html").is_file():
        print("dist/ 不存在，请先运行: python build.py", file=sys.stderr)
        sys.exit(1)
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"[serve] http://127.0.0.1:{port}/  (dist + /api/v1,/data 代理到 {UPSTREAM_HOST})")
    srv.serve_forever()


if __name__ == "__main__":
    main()
