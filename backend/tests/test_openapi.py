"""OpenAPI schema completeness and validity test (API-06)."""

from fastapi.routing import APIRoute

from app.main import app

PUBLIC = {
    ("POST", "/api/auth/login"),
    ("POST", "/api/auth/demo-login"),
    ("GET", "/api/health"),
}


def test_openapi_completeness(client):
    resp = client.get("/openapi.json")
    assert resp.status_code == 200
    schema = resp.json()

    assert "paths" in schema
    paths = schema["paths"]

    seen_operation_ids = set()

    for route in app.routes:
        if not isinstance(route, APIRoute):
            continue

        route_path = route.path
        assert route_path in paths, f"Path {route_path} not found in OpenAPI schema"
        path_item = paths[route_path]

        for method in route.methods:
            m = method.lower()
            if m not in path_item:
                continue

            op = path_item[m]

            # 1. Non-empty summary
            assert op.get("summary"), f"Route {method} {route_path} missing summary"

            # 2. Non-empty tags
            assert op.get("tags"), f"Route {method} {route_path} missing tags"

            # 3. 2xx response defined
            responses = op.get("responses", {})
            has_2xx = any(str(code).startswith("2") for code in responses)
            assert has_2xx, f"Route {method} {route_path} missing 2xx response"

            # 4. 401 & 403 responses defined for non-public routes
            if (method, route_path) not in PUBLIC:
                assert "401" in responses, f"Route {method} {route_path} missing 401 response"
                assert "403" in responses, f"Route {method} {route_path} missing 403 response"

            # 5. Unique operationId
            op_id = op.get("operationId")
            assert op_id, f"Route {method} {route_path} missing operationId"
            assert op_id not in seen_operation_ids, f"Duplicate operationId: {op_id}"
            seen_operation_ids.add(op_id)
