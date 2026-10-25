"""Redis response cache for authenticated GETs under /api.

Key = (session, path + query, data version). Any successful non-GET bumps the version, which invalidates every
cached read at once, so a user always reads their own write. Fails open: with no Redis, or if it errors, requests
go straight to Postgres.
"""

import hashlib

from redis.asyncio import Redis, from_url
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app import config

client: Redis | None = None  # opened in lifespan; tests inject a fake
VERSION = "ce:data-version"
NO_BUMP = {"/api/auth/login", "/api/auth/demo-login"}  # logging in changes no cached data
NO_CACHE = {"/api/health"}
MAX_BODY = 1_000_000


async def open_cache() -> None:
    global client
    if config.REDIS_URL:
        client = from_url(config.REDIS_URL, socket_connect_timeout=0.25, socket_timeout=0.25)


async def close_cache() -> None:
    global client
    if client is not None:
        await client.aclose()
        client = None


def _cookie(scope: Scope, name: str) -> str | None:
    for k, v in scope["headers"]:
        if k == b"cookie":
            for part in v.decode("latin-1").split(";"):
                n, _, val = part.strip().partition("=")
                if n == name:
                    return val
    return None


async def _bump() -> None:
    try:
        await client.incr(VERSION)  # type: ignore[union-attr]
    except Exception:
        pass  # cache is best effort; entries also expire after CACHE_TTL


class ResponseCache:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        path = scope.get("path", "")
        if scope["type"] != "http" or client is None or not path.startswith("/api/"):
            return await self.app(scope, receive, send)
        if scope["method"] != "GET":
            return await self._write(scope, receive, send, path)
        token = _cookie(scope, "session")
        if not token or path in NO_CACHE:
            return await self.app(scope, receive, send)
        try:
            ver = (await client.get(VERSION) or b"0").decode()
            raw = f"{token}|{path}|{scope['query_string'].decode()}"
            key = f"ce:{ver}:{hashlib.sha256(raw.encode()).hexdigest()}"
            hit = await client.get(key)
        except Exception:
            return await self.app(scope, receive, send)
        if hit:
            ctype, _, body = hit.partition(b"\n")
            await send({"type": "http.response.start", "status": 200, "headers": [
                (b"content-type", ctype), (b"content-length", str(len(body)).encode()), (b"x-cache", b"HIT")]})
            await send({"type": "http.response.body", "body": body})
            return

        status, headers, chunks = 0, [], []

        async def capture(msg: Message) -> None:
            nonlocal status, headers
            if msg["type"] == "http.response.start":
                status, headers = msg["status"], list(msg["headers"])
                msg = {**msg, "headers": [*headers, (b"x-cache", b"MISS")]}
            elif msg["type"] == "http.response.body":
                chunks.append(msg.get("body", b""))
            await send(msg)

        await self.app(scope, receive, capture)
        h = {k.lower(): v for k, v in headers}
        body = b"".join(chunks)
        if status == 200 and h.get(b"content-type", b"").startswith(b"application/json") \
                and b"set-cookie" not in h and len(body) <= MAX_BODY:
            try:
                await client.set(key, h[b"content-type"] + b"\n" + body, ex=config.CACHE_TTL)
            except Exception:
                pass

    async def _write(self, scope: Scope, receive: Receive, send: Send, path: str) -> None:
        bump = path not in NO_BUMP
        status = 0

        async def watch(msg: Message) -> None:
            nonlocal status
            if msg["type"] == "http.response.start":
                status = msg["status"]
                if bump and status < 400:
                    await _bump()  # before the client can read its next page
            await send(msg)

        await self.app(scope, receive, watch)
        if bump and status < 400:
            await _bump()  # again: the DB transaction may commit after the response has started
