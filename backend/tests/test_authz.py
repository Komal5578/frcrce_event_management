"""Route-matrix authorization test (API-05).

Verifies that every APIRoute enforces:
1. 401 for anonymous callers
2. 403 for any role not in its declared x-roles
"""

import re

from fastapi.routing import APIRoute

from app.main import app

PUBLIC = {
    ("POST", "/api/auth/login"),
    ("POST", "/api/auth/demo-login"),
    ("GET", "/api/health"),
}

ALL_ROLES = ["student", "coordinator", "admin"]


def _format_path(path: str) -> str:
    """Replace path parameters like {event_id} with a dummy UUID."""
    return re.sub(r"\{[a-zA-Z_]+\}", "00000000-0000-0000-0000-000000000000", path)


def test_every_route_authorization_matrix(client, client_for):
    clients = {
        "student": client_for("student"),
        "coordinator": client_for("coordinator"),
        "admin": client_for("admin"),
    }

    for route in app.routes:
        if not isinstance(route, APIRoute):
            continue

        for method in route.methods:
            if (method, route.path) in PUBLIC:
                continue

            endpoint_url = _format_path(route.path)
            allowed_roles = set(route.openapi_extra.get("x-roles", [])) if route.openapi_extra else set()

            # 1. Anonymous caller must receive 401
            resp_anon = client.request(method, endpoint_url)
            assert resp_anon.status_code == 401, (
                f"Expected 401 for anonymous {method} {route.path}, got {resp_anon.status_code}: {resp_anon.text}"
            )
            assert resp_anon.json().get("code") == "UNAUTHENTICATED"

            # 2. Callers with disallowed roles must receive 403
            for role in ALL_ROLES:
                if role not in allowed_roles:
                    role_client = clients[role]
                    resp_role = role_client.request(method, endpoint_url)
                    assert resp_role.status_code == 403, (
                        f"Expected 403 for {role} {method} {route.path}, got {resp_role.status_code}: {resp_role.text}"
                    )
                    assert resp_role.json().get("code") == "NOT_ALLOWED"


def test_explicit_student_forbidden_routes(client_for):
    student_client = client_for("student")

    # CSV export
    resp = student_client.get("/api/reports/export.csv")
    assert resp.status_code == 403
    assert resp.json()["code"] == "NOT_ALLOWED"

    # Reports read
    resp = student_client.get("/api/reports")
    assert resp.status_code == 403
    assert resp.json()["code"] == "NOT_ALLOWED"

    # Admin bookings
    resp = student_client.get("/api/admin/bookings")
    assert resp.status_code == 403
    assert resp.json()["code"] == "NOT_ALLOWED"

    # Approvals review
    resp = student_client.post("/api/events/00000000-0000-0000-0000-000000000000/review", json={"action": "approve"})
    assert resp.status_code == 403
    assert resp.json()["code"] == "NOT_ALLOWED"

    # Coordinator draft create
    resp = student_client.post("/api/events/drafts", json={})
    assert resp.status_code == 403
    assert resp.json()["code"] == "NOT_ALLOWED"
