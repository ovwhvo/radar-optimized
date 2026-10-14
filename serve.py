#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本地预览 / 验证服务器（仅标准库，纯静态，零外部依赖）。

  python serve.py [port]      # 默认 8090

职责：
  1) 从 dist/ 提供静态文件；若存在 .gz 副本且客户端接受 gzip，则原样返回
     （模拟 nginx gzip_static 的传输效果）。
  2) 按 nginx.conf.example 的建议下发安全响应头与缓存策略（本机 dogfooding）。

自 2026-10-14 起不再反代任何上游：检索/核对/问答已由 src/local-api.js
在浏览器内实现，/data 目录整树随包发布。本服务器只做静态托管。
"""
import gzip
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
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
CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".zip": "application/zip",
    ".pdf": "application/pdf",
}


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "radar-optdev/2.0"

    def _send(self, status, headers, body, compress_ok=True):
        enc = self.headers.get("Accept-Encoding", "")
        use_gzip = compress_ok and "gzip" in enc and len(body) > 256
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

    def _serve_static(self, path):
        rel = "index.html" if path == "/" else path.lstrip("/")
        target = (DIST / rel).resolve()
        if not str(target).startswith(str(DIST.resolve())) or not target.is_file():
            self._send(404, [("Content-Type", "text/plain; charset=utf-8")], b"404 Not Found")
            return
        cache = "public, max-age=31536000, immutable" if path.startswith("/assets/") else "no-cache"
        self._send(200, [
            ("Content-Type", CONTENT_TYPES.get(target.suffix, "application/octet-stream")),
            ("Cache-Control", cache),
        ], target.read_bytes())

    def do_GET(self):
        self._serve_static(urlsplit(self.path).path)

    def do_HEAD(self):
        self.do_GET()

    def log_message(self, fmt, *args):
        sys.stderr.write("[serve] " + (fmt % args) + "\n")


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8090
    if not (DIST / "index.html").is_file():
        print("dist/ 不存在，请先运行: python build.py", file=sys.stderr)
        sys.exit(1)
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"[serve] http://127.0.0.1:{port}/  (纯静态 dist，无任何上游依赖)")
    srv.serve_forever()


if __name__ == "__main__":
    main()
