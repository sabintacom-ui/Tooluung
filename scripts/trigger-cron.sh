#!/usr/bin/env bash
# Auto-trigger sibermas-YT pipeline. Designed for systemd timer.
# Reads WORKER_SECRET from .env.production and calls /api/pipeline/trigger.
set -euo pipefail

APP_DIR="${APP_DIR:-/home/rizqunaid/sibermas-yt}"
ENV_FILE="$APP_DIR/.env.production"
BASE_URL="${BASE_URL:-https://sibermas.rizquna.id}"
LOG_DIR="${LOG_DIR:-/home/rizqunaid/sibermas-worker/logs}"
LOG_FILE="$LOG_DIR/trigger-cron.log"

mkdir -p "$LOG_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[$(date -Iseconds)] ERROR: $ENV_FILE not found" >> "$LOG_FILE"
  exit 1
fi

WORKER_SECRET="$(grep -E '^WORKER_SECRET=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\"' | tr -d \"'\" || true)"

if [[ -z "$WORKER_SECRET" ]]; then
  echo "[$(date -Iseconds)] ERROR: WORKER_SECRET empty in $ENV_FILE" >> "$LOG_FILE"
  exit 1
fi

TS="$(date -Iseconds)"
RESP="$(curl -sS -X POST "$BASE_URL/api/pipeline/trigger" \
  -H "x-worker-secret: $WORKER_SECRET" \
  -H "Content-Type: application/json" \
  --max-time 290 \
  -w '\nHTTP=%{http_code} TIME=%{time_total}s\n' 2>&1 || echo 'CURL_FAILED')"

echo "[$TS] $RESP" >> "$LOG_FILE"

# Trim log to keep last 500 lines (~50KB)
if [[ $(wc -l < "$LOG_FILE") -gt 500 ]]; then
  tail -500 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi
