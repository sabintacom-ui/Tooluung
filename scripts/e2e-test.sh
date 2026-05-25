#!/usr/bin/env bash
# E2E smoke test for sibermas-YT pipeline.
# Prereq: `npm run dev` running on localhost:3000, Supabase reachable, SSH worker up.
set -euo pipefail

BASE="${BASE:-http://localhost:3000}"
ADMIN_TOKEN="${ADMIN_API_TOKEN:-$(grep -E '^ADMIN_API_TOKEN=' .env.local | cut -d= -f2-)}"
WORKER_SECRET="${WORKER_SECRET:-$(grep -E '^WORKER_SECRET=' .env.local | cut -d= -f2-)}"
CHANNEL_ID="${CHANNEL_ID:-c419026c-6c5a-4999-98c4-bd64131d5d72}"
TEMPLATE_ID="${TEMPLATE_ID:-5f93c244-4a7a-40df-bfd3-011a311bf286}"
TOPIC="${TOPIC:-Pengenalan Sibermas UIN SAIZU untuk Mahasiswa Baru}"

bold() { printf "\n\033[1;36m▶ %s\033[0m\n" "$*"; }
dim()  { printf "\033[2m%s\033[0m\n" "$*"; }
ok()   { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }
err()  { printf "\033[1;31m✗ %s\033[0m\n" "$*"; }

if [[ -z "$ADMIN_TOKEN" || -z "$WORKER_SECRET" ]]; then
  err "ADMIN_API_TOKEN or WORKER_SECRET missing"; exit 1
fi

bold "1. Health check"
HEALTH=$(curl -sS "$BASE/api/health")
echo "$HEALTH" | head -c 400; echo
if echo "$HEALTH" | grep -q '"ok":true'; then ok "Health OK"; else err "Health not all-OK (continuing anyway)"; fi

bold "2. POST /api/pipeline/start"
START_BODY=$(cat <<JSON
{"channelId":"$CHANNEL_ID","templateId":"$TEMPLATE_ID","topic":"$TOPIC","keywords":["sibermas","uin saizu","mahasiswa"],"targetAudience":"mahasiswa baru","notes":"Sambutan singkat untuk pengenalan kampus"}
JSON
)
START=$(curl -sS -X POST "$BASE/api/pipeline/start" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d "$START_BODY")
echo "$START" | head -c 600; echo
JOB_ID=$(echo "$START" | sed -nE 's/.*"jobId":"([^"]+)".*/\1/p')
CONTENT_ID=$(echo "$START" | sed -nE 's/.*"contentId":"([^"]+)".*/\1/p')
if [[ -z "$JOB_ID" ]]; then err "No jobId returned"; exit 1; fi
ok "JOB_ID=$JOB_ID"
ok "CONTENT_ID=$CONTENT_ID"

bold "3. Trigger pipeline (loop up to 8 times)"
for i in 1 2 3 4 5 6 7 8; do
  dim "  trigger #$i"
  TRIG=$(curl -sS -X POST "$BASE/api/pipeline/trigger" \
    -H "x-gas-secret: $WORKER_SECRET")
  echo "    $TRIG" | head -c 300; echo
  sleep 1
  STAT=$(curl -sS "$BASE/api/pipeline/status?id=$JOB_ID" \
    -H "x-admin-token: $ADMIN_TOKEN")
  echo "    status: $(echo "$STAT" | head -c 350)"
  if echo "$STAT" | grep -q '"status":"completed"'; then ok "Job completed"; break; fi
  if echo "$STAT" | grep -q '"status":"failed"'; then err "Job failed"; break; fi
  sleep 1
done

bold "4. Final status & assets"
curl -sS "$BASE/api/pipeline/status?id=$JOB_ID" -H "x-admin-token: $ADMIN_TOKEN" | head -c 1200; echo

bold "5. Recent jobs"
curl -sS "$BASE/api/pipeline/recent?channelId=$CHANNEL_ID" -H "x-admin-token: $ADMIN_TOKEN" | head -c 800; echo

echo
ok "E2E run complete (review output above)"
