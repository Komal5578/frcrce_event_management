#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8000}"
COOKIE_JAR="$(mktemp)"

cleanup() {
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

echo "=== 1. Checking API Health at $BASE_URL/api/health ==="
HEALTH_RESP="$(curl -sS -f "$BASE_URL/api/health")"
echo "Health response: $HEALTH_RESP"
if ! echo "$HEALTH_RESP" | grep -q '"status"[[:space:]]*:[[:space:]]*"ok"'; then
  echo "ERROR: /api/health did not return status ok" >&2
  exit 1
fi

echo "=== 2. Logging in via Demo Login as Student ==="
LOGIN_RESP="$(curl -sS -f -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/demo-login" \
  -H "Content-Type: application/json" \
  -d '{"role":"student"}')"
echo "Login response: $LOGIN_RESP"
if ! grep -q "session" "$COOKIE_JAR"; then
  echo "ERROR: Session cookie not received from demo-login" >&2
  exit 1
fi

echo "=== 3. Querying Events List at $BASE_URL/api/events ==="
EVENTS_RESP="$(curl -sS -f -b "$COOKIE_JAR" "$BASE_URL/api/events")"
echo "Events response snippet: ${EVENTS_RESP:0:200}..."
if [ "$EVENTS_RESP" = "[]" ] || [ -z "$EVENTS_RESP" ]; then
  echo "ERROR: Expected non-empty events list, got: $EVENTS_RESP" >&2
  exit 1
fi

echo "=== SMOKE TEST PASSED ==="
