import sys
from pathlib import Path
from urllib.parse import parse_qs

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.main import app as fastapi_app
from backend.app.data_engine.state import db_store

if not db_store.initialized:
    db_store.initialize(count=3500)

class VercelPathMiddleware:
    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            qs_bytes = scope.get("query_string", b"")
            qs = parse_qs(qs_bytes.decode("utf-8", "ignore"))

            if "__path" in qs:
                raw_subpath = qs["__path"][0]
                if not raw_subpath or raw_subpath == "/":
                    resolved_path = "/"
                elif raw_subpath.startswith("/"):
                    resolved_path = raw_subpath
                else:
                    resolved_path = "/" + raw_subpath

                scope["path"] = resolved_path
                scope["raw_path"] = resolved_path.encode()

                # Clean __path from query string so endpoints don't get polluted
                cleaned_pairs = [p for p in qs_bytes.split(b"&") if not p.startswith(b"__path=")]
                scope["query_string"] = b"&".join(cleaned_pairs)

        await self.asgi_app(scope, receive, send)

app = VercelPathMiddleware(fastapi_app)
