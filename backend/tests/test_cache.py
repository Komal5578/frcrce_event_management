"""Response cache: hit/miss, per-session isolation, invalidation on write, and fail-open. No DB or Redis needed."""

import pytest
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from app import cache


class FakeRedis:
    def __init__(self) -> None:
        self.d: dict[str, bytes] = {}
        self.down = False

    def _check(self) -> None:
        if self.down:
            raise ConnectionError("redis down")

    async def get(self, k: str):
        self._check()
        return self.d.get(k)

    async def set(self, k: str, v: bytes, ex: int | None = None) -> None:
        self._check()
        self.d[k] = v

    async def incr(self, k: str) -> None:
        self._check()
        self.d[k] = str(int(self.d.get(k, b"0")) + 1).encode()


@pytest.fixture
def env(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(cache, "client", fake)
    calls = {"n": 0}
    app = FastAPI()
    app.add_middleware(cache.ResponseCache)

    @app.get("/api/things")
    def things():
        calls["n"] += 1
        return {"n": calls["n"]}

    @app.get("/api/boom")
    def boom():
        return JSONResponse({"code": "NOPE"}, status_code=403)

    @app.post("/api/things")
    def add():
        return {"ok": True}

    @app.post("/api/auth/login")
    def login():
        return {"ok": True}

    return TestClient(app), fake, calls


def test_second_read_is_a_hit_and_a_write_invalidates(env):
    c, _, calls = env
    c.cookies.set("session", "tok-a")
    assert c.get("/api/things").headers["x-cache"] == "MISS"
    r = c.get("/api/things")
    assert r.headers["x-cache"] == "HIT" and r.json() == {"n": 1} and calls["n"] == 1
    c.post("/api/things")
    r = c.get("/api/things")
    assert r.headers["x-cache"] == "MISS" and r.json() == {"n": 2}


def test_login_does_not_invalidate(env):
    c, _, calls = env
    c.cookies.set("session", "tok-a")
    c.get("/api/things")
    c.post("/api/auth/login")
    assert c.get("/api/things").headers["x-cache"] == "HIT" and calls["n"] == 1


def test_sessions_are_isolated_and_anonymous_is_never_cached(env):
    c, _, calls = env
    c.cookies.set("session", "tok-a")
    c.get("/api/things")
    c.cookies.clear()
    c.cookies.set("session", "tok-b")
    assert c.get("/api/things").headers["x-cache"] == "MISS"
    c.cookies.clear()
    assert "x-cache" not in c.get("/api/things").headers
    assert calls["n"] == 3


def test_errors_are_not_cached(env):
    c, fake, _ = env
    c.cookies.set("session", "tok-a")
    assert c.get("/api/boom").status_code == 403
    assert not [k for k in fake.d if k != cache.VERSION]


def test_fails_open_when_redis_is_down(env):
    c, fake, calls = env
    c.cookies.set("session", "tok-a")
    fake.down = True
    assert c.get("/api/things").json() == {"n": 1}
    assert c.post("/api/things").status_code == 200
    assert c.get("/api/things").json() == {"n": 2} and calls["n"] == 2
