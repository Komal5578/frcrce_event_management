#!/usr/bin/env bash
# Run frontend + backend together. Output shows in the terminal (prefixed) and is
# also appended to .logs/frontend.log and .logs/backend.log. Ctrl+C stops both.
cd "$(dirname "$0")" || exit 1
mkdir -p .logs

pids=()
trap 'kill "${pids[@]}" 2>/dev/null; wait 2>/dev/null; exit 0' INT TERM EXIT

run() { # name, dir, command...
  local name=$1 dir=$2; shift 2
  (cd "$dir" && "$@" 2>&1) | tee -a ".logs/$name.log" | sed -u "s/^/[$name] /" &
  pids+=($!)
}

echo "=== $(date '+%F %T') start ===" | tee -a .logs/frontend.log .logs/backend.log >/dev/null

run frontend frontend npm run dev

# A backend (e.g. the docker-compose one) may already own :8000; reuse it instead of failing with "address in use".
if curl -fs -o /dev/null http://localhost:8000/api/health; then
  echo "[backend] already running on :8000, reusing it" | tee -a .logs/backend.log
else
  run backend backend .venv/bin/uvicorn app.main:app --reload --port 8000
fi

wait
