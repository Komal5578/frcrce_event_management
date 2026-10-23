"""Authentication router handling login, logout, session status, and demo login."""

from typing import Any, Literal

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict

from app import config
from app.auth import (
    clear_failures,
    create_session,
    delete_session,
    recent_failures,
    record_failure,
    verify_password,
)
from app.deps import current_actor, get_conn
from app.domain.actor import Actor
from app.errors import MSG, DomainError

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str
    password: str


class DemoLoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: Literal["coordinator", "student", "admin"]


@router.post("/login", summary="Sign in with email and password")
def login(
    req: LoginRequest,
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> Response:
    email = req.email.strip().lower()

    failures = recent_failures(conn, email, config.LOGIN_WINDOW_MINUTES)
    if failures >= config.LOGIN_MAX_FAILURES:
        record_failure(conn, email)
        return JSONResponse(
            {"code": "RATE_LIMITED", "message": MSG["RATE_LIMITED"]},
            status_code=429,
        )

    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, email, password_hash, name, role FROM profiles WHERE email = %s;",
            (email,),
        )
        profile = cur.fetchone()

    p_hash = profile["password_hash"] if profile else None
    valid = verify_password(req.password, p_hash)

    if not valid or not profile:
        record_failure(conn, email)
        return JSONResponse(
            {"code": "UNAUTHENTICATED", "message": MSG["UNAUTHENTICATED"]},
            status_code=401,
        )

    clear_failures(conn, email)
    token = create_session(conn, str(profile["id"]))

    res = JSONResponse({
        "id": str(profile["id"]),
        "email": profile["email"],
        "name": profile["name"],
        "role": profile["role"],
    })
    res.set_cookie(
        key="session",
        value=token,
        max_age=604800,
        httponly=True,
        samesite="lax",
        path="/",
        secure=config.COOKIE_SECURE,
    )
    return res


@router.post("/logout", summary="Log out and clear session cookie")
def logout(
    request: Request,
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> Response:
    token = request.cookies.get("session")
    if token:
        delete_session(conn, token)

    res = JSONResponse({"ok": True})
    res.delete_cookie("session", path="/")
    return res


@router.get("/me", summary="Get currently authenticated actor profile")
def me(actor: Actor = Depends(current_actor)) -> dict[str, Any]:
    return {
        "id": actor.id,
        "email": actor.email,
        "name": actor.name,
        "role": actor.role,
    }


@router.post("/demo-login", summary="Sign in as a demo user by role")
def demo_login(
    req: DemoLoginRequest,
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> Response:
    if not config.DEMO_LOGIN:
        raise HTTPException(status_code=404, detail="Demo login disabled")

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, email, name, role FROM profiles
            WHERE role = %s AND email LIKE %s
            ORDER BY id LIMIT 1;
            """,
            (req.role, "%@demo.college.test"),
        )
        profile = cur.fetchone()

    if not profile:
        raise DomainError("INTERNAL", f"Demo account for role {req.role} not found.")

    token = create_session(conn, str(profile["id"]))
    res = JSONResponse({
        "id": str(profile["id"]),
        "email": profile["email"],
        "name": profile["name"],
        "role": profile["role"],
    })
    res.set_cookie(
        key="session",
        value=token,
        max_age=604800,
        httponly=True,
        samesite="lax",
        path="/",
        secure=config.COOKIE_SECURE,
    )
    return res
