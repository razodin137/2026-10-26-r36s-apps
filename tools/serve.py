#!/usr/bin/env python3
"""Serve the R36S shell for local development.

The shell is a static site, so any web server will do. This one adds the two
things a cartridge author wants while working:

* The catalog is rebuilt on every request, so a new folder in ``cartridges/``
  shows up in the menu without restarting the server.
* Nothing is cached, so a reload always shows the code you just saved.

Run it with ``python3 tools/serve.py`` and open the address it prints.
"""

from __future__ import annotations

import argparse
import functools
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from build_catalog import CATALOG_PATH, build  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
CATALOG_ROUTE = "/cartridges/catalog.json"
CATALOG_ALIAS = "/catalog.json"
CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
}


class R36SRequestHandler(SimpleHTTPRequestHandler):
    """A static file handler that keeps the cartridge catalog fresh."""

    def do_GET(self) -> None:
        path = self.path.split("?")[0]

        if path in ( CATALOG_ROUTE, CATALOG_ALIAS ):
            try:
                build()
            except ValueError as error:
                self.send_error(500, str(error))
                return

        if path == CATALOG_ALIAS:
            self.path = CATALOG_ROUTE

        super().do_GET()

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def guess_type(self, path: str) -> str:
        suffix = Path(path).suffix.lower()
        if suffix in CONTENT_TYPES:
            return CONTENT_TYPES[suffix]

        return super().guess_type(path)


def main() -> int:
    parser = argparse.ArgumentParser(description="Serve the R36S shell locally.")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on.")
    parser.add_argument("--host", default="127.0.0.1", help="Address to bind to.")
    arguments = parser.parse_args()

    handler = functools.partial(R36SRequestHandler, directory=str(ROOT))
    server = ThreadingHTTPServer((arguments.host, arguments.port), handler)

    print(f"R36S shell serving {ROOT}")
    print(f"  http://{arguments.host}:{arguments.port}/")
    print(f"  catalog: {CATALOG_PATH.relative_to(ROOT)}")
    print("Press Ctrl+C to stop.")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping.")
    finally:
        server.server_close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
