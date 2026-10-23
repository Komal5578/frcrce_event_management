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

# ponytail: backend app doesn't exist until Phase 9; starts automatically once backend/app/main.py is there
if [ -f backend/app/main.py ]; then
  run backend backend uvicorn app.main:app --reload --port 8000
else
  echo "[backend] backend/app/main.py not found yet (Phase 9), skipping" | tee -a .logs/backend.log
fi

wait
