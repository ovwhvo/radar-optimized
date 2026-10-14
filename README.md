# 政策补贴雷达 · 优化版本

基于对 <https://radar.huixiang17.cn/> 的逆向分析（源码抓取 + 静态应用分析 + HTTP 探测 + 无头浏览器运行验证）构建。
问题清单与改进依据见同仓库的《政策补贴雷达-问题总结与改进措施.md》。

## 目录

```
radar-optimized/
├── src/                 # 优化后的源码（从原站抓取 + 3 处代码级修复，见下）
├── build.py             # 零依赖构建：模块打包、CSS 合并、内容哈希、预压缩
├── serve.py             # 本地预览：静态托管 + /api/v1、/data 反代回原站（验证用）
├── nginx.conf.example   # 生产建议配置：修重复头、补安全头、压缩与缓存
├── dist/                # 构建产物（直接可部署）
└── verify/              # 等价性验证的原始日志与页面快照
```

## 快速开始

```bash
python build.py      # 生成 dist/（内容哈希 + .gz 预压缩副本 + data 整树）
python serve.py 8090 # 本地预览 http://127.0.0.1:8090/（纯静态，无任何上游依赖）
```

部署时把 `dist/` 放到任意静态托管即可（**不需要任何后端、不需要 API key、不依赖原站**），并可按 `nginx.conf.example` 优化响应头、压缩与缓存。

## 独立化（零原站运行时依赖，2026-10-14 起）

原站的 3 个 POST 接口（`/discover` 检索、`/analyze` 核对、`/assistant` 问答）已在 `src/local-api.js` 中**于浏览器内重写实现**，`/health` `/sources` 本地生成/随包镜像，13 个官方快照与附件（约 1.2 MB）全部抓取随包发布：

| 原站端点 | 本地实现 | 等价性 |
|---|---|---|
| `POST /discover` | 词典规则引擎（地区/主题词典 + 加权打分 + 词干白名单） | 4 组参考问题的候选集合与顺序逐项一致 |
| `POST /analyze` | 资格初筛引擎（结构化 in/lte 条件 + 专项自报 + SHA-256 指纹） | 7 组参考（含 met/unmet/missing/verify 全状态）逐字段一致，**指纹与原站完全相同** |
| `POST /assistant` | 确定性模板问答（explain/materials/steps/review/forms） | explain 与 unsupported 的回答、证据、限制逐字一致 |
| `GET /health` `/sources` | 本地生成 / `data/sources.json` 静态镜像 | 字段一致（health 的 baseUrl 指向当前站点） |

- 等价性测试页 `tests/api-equivalence.html`（对拍 `tests/reference/` 原站 2026-10-14 捕获）：**678 通过 / 0 失败 / 1 软警告**（唯一警告是未识别分词片段的措辞差异，不影响候选结果）。
- 无头浏览器净流量日志实测：**原站域名出现 0 次、外部请求 0 个**（`verify/net-local.json`）。
- 页脚保留「原站出处」链接（仅为标注来源，运行时不加载）。

## 随处访问（三种方式，功能一致）

| 方式 | 入口 | 说明 |
|---|---|---|
| **本地** | `python serve.py 8090` | 全功能 |
| **GitHub Pages** | `https://ovwhvo.github.io/radar-optimized/` | 全功能（检索/核对/问答均为浏览器内本地实现，无需后端） |
| **GitHub Codespaces** | 仓库 → Code → Create codespace，转发 8090 端口 | 全功能 |

## 相对原站的改动

### 代码级（src/，共 3 处）

| 位置 | 改动 | 对应问题 |
|---|---|---|
| `app.js initialize()` | `Promise.all` → 关键依赖（政策数据）单独拉取，档案/记录/健康检查/来源/反馈改 `Promise.allSettled`，任一失败只降级提示不阻断启动 | 单点失败拖垮首屏 |
| `app.js` 记录搜索框 | 每键 `render()` → `requestAnimationFrame` 合帧渲染（`scheduleRender`） | 高频输入下的全量重渲染 |
| `utils.js` | 删除从未被引用的 `api()`（与 `api.js request()` 重复且无超时、无结构化错误） | 死代码/双实现漂移 |

### 构建级（build.py）

- 14 个 ES 模块按拓扑序打包为 1 个 `app.<hash>.js`（消除 3 波 import 瀑布；导入名逐个静态校验，缺一即构建失败）
- 7 个 CSS 按 HTML 顺序合并为 1 个 `app.<hash>.css`（去注释瘦身，级联顺序不变）
- 内容哈希文件名 + `Cache-Control: public, max-age=31536000, immutable`
- 全部产物预生成 `.gz`（配合 `gzip_static`）
- `index.html` 增加 `modulepreload`
- 补 `robots.txt` 与 `.well-known/security.txt`（**联系邮箱是占位符，上线前必须替换**）

### 运维级（nginx.conf.example）

- 修复重复响应头（原站 `X-Content-Type-Options`、`Referrer-Policy` 各下发两次）
- 补 `Strict-Transport-Security`、`Permissions-Policy`、`Cross-Origin-Opener-Policy`、`Cross-Origin-Resource-Policy`
- `gzip_types` 显式包含 `application/javascript`（原站 JS 完全未压缩的根因）
- `etag on` + 分路径缓存策略（HTML/API `no-cache` 可回源验证；`/assets/` 一年强缓存）
- CSP 收紧：`style-src 'self'`，仅 `style-src-attr 'unsafe-inline'`（页面确有 `style=` 属性）

## 实测数据（2026-10-14，无头 Edge + curl）

| 指标 | 原站 | 优化版 | 变化 |
|---|---|---|---|
| 首屏网络请求 | 26 个（HTML 1 + CSS 7 + JS 14 + 数据 1 + API 2 + favicon 1） | 7 个（HTML 1 + CSS 1 + JS 1 + 数据 1 + API 2 + favicon 1） | **-73%** |
| 静态代码传输量（HTML+CSS+JS，按实际传输编码） | 217,579 B（JS 190,651 B **未压缩**） | 81,762 B（全部 gzip） | **-62%** |
| 二次访问静态资源 | 全量重下（no-cache 且无 ETag/Last-Modified） | 0 B（`/assets/` immutable 命中） | **-100%** |
| 安全响应头 | 缺 HSTS/Permissions-Policy/COOP/CORP；nosniff 与 Referrer-Policy 各重复 2 次 | 齐全且各出现 1 次 | 修复 |

## 功能等价验证（全部通过）

对比方式：无头 Edge 分别加载原站与 `serve.py` 托管的优化版，取 `<main>` 内容逐字符比较。

| 用例 | 结果 |
|---|---|
| 首页（home）渲染 | main 文本与原站**逐字符一致**（296 字符），应用完成启动（`aria-busy` 移除） |
| `#sources` 官方来源视图（数据来自 `/api/v1/sources` 代理） | 与原站**逐字符一致**（1446 字符） |
| `#records` 记录视图 | 与原站**逐字符一致**（124 字符） |
| 端到端搜索（提交表单 → `/api/v1/discover` → 渲染候选卡片） | 6 张政策卡片成功渲染，0 个 JS 错误 |
| 记录搜索框输入（`scheduleRender` 修复路径） | 输入正常、焦点保持 |
| 代理转发一致性 | 与原站 `/api/v1/discover` 响应逐字节一致（仅 `generatedAt` 时间戳不同） |

验证原始日志保存在 `verify/`（页面快照、控制台日志、接口响应对）。

## 已知边界

- 服务端（nginx 之后的 Node 应用）源码不可得，仅基于 OpenAPI 契约与黑盒探测；本仓库的改进覆盖前端与接入层。
- 未做 Node/Terser 语法级压缩（环境无 Node）；接入构建链后 JS gzip 还有进一步下降空间。
- `nginx.conf.example` 中的证书路径与上游端口需按实际环境修改。
- 本机 `serve.py` 是验证服务器，不可作为生产使用。
