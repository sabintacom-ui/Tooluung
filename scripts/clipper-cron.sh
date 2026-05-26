#!/bin/bash
# Clipper auto-discover + queue + process pipeline
# Runs daily via systemd user timer
set -uo pipefail

LOG_FILE="/home/rizqunaid/sibermas-worker/logs/clipper-cron.log"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Load env
if [ ! -f /home/rizqunaid/sibermas-yt/.env.production ]; then
  log "ERROR: .env.production not found"
  exit 1
fi
set -a
. /home/rizqunaid/sibermas-yt/.env.production
set +a

API_BASE="http://127.0.0.1:3100"
ADMIN_TOKEN="${ADMIN_API_TOKEN:?missing}"
WSECRET="${WORKER_SECRET:?missing}"

# Tunable: 1 source per run × 2 clips/source = 2 Shorts/day (matches YouTube quota safety)
DISCOVER_TOP_N="${CLIPPER_CRON_TOP_N:-1}"
NUM_CLIPS="${CLIPPER_CRON_NUM_CLIPS:-2}"
MAX_TRIGGER_LOOPS="${CLIPPER_CRON_MAX_TRIGGER_LOOPS:-25}"

log "==== Clipper cron START ===="
log "config: topN=$DISCOVER_TOP_N numClips=$NUM_CLIPS maxLoops=$MAX_TRIGGER_LOOPS"

# Step 1: Discover + auto-scan top N sources
log "Discover + auto-scan trending dakwah..."
DISCOVER_RESULT=$(curl -s -X POST "$API_BASE/api/clipper/discover" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d "{\"autoScan\":true,\"topN\":$DISCOVER_TOP_N,\"maxItems\":25,\"minDuration\":600}" \
  --max-time 300)

if [ -z "$DISCOVER_RESULT" ]; then
  log "ERROR: discover returned empty"
  exit 2
fi

# Parse scanned source IDs
SOURCE_IDS=$(echo "$DISCOVER_RESULT" | python3 -c '
import sys, json
try:
  d = json.load(sys.stdin)
  if not d.get("ok"):
    print("ERR:" + str(d.get("error","")), file=sys.stderr)
    sys.exit(1)
  for s in d.get("scanned", []):
    sid = s.get("source_id")
    if sid:
      print(sid)
except Exception as e:
  print("ERR:" + str(e), file=sys.stderr)
  sys.exit(1)
' 2>&1)

if [ -z "$SOURCE_IDS" ]; then
  log "WARN: no sources auto-scanned (maybe no relevant trending today)"
  log "discover output: $(echo "$DISCOVER_RESULT" | head -c 500)"
  log "==== Clipper cron END (no work) ===="
  exit 0
fi

log "Scanned sources: $(echo "$SOURCE_IDS" | wc -l)"

# Step 2: Plan clips for each source
JOB_IDS=()
while IFS= read -r SID; do
  [ -z "$SID" ] && continue
  log "Plan $NUM_CLIPS clips for source $SID"
  PLAN=$(curl -s -X POST "$API_BASE/api/clipper/clip" \
    -H "Content-Type: application/json" \
    -H "x-admin-token: $ADMIN_TOKEN" \
    -d "{\"sourceId\":\"$SID\",\"mode\":\"auto\",\"numClips\":$NUM_CLIPS,\"minDuration\":30,\"maxDuration\":60}" \
    --max-time 120)
  N_JOBS=$(echo "$PLAN" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(len(d.get("jobs",[]))) if d.get("ok") else print(0)' 2>/dev/null || echo 0)
  log "  → $N_JOBS jobs queued"
done <<< "$SOURCE_IDS"

# Step 3: Trigger pipeline loop
log "Trigger pipeline loop (max $MAX_TRIGGER_LOOPS iterations)..."
PROCESSED_COUNT=0
NOOP_COUNT=0
for i in $(seq 1 "$MAX_TRIGGER_LOOPS"); do
  RESP=$(curl -s -X POST "$API_BASE/api/clipper/trigger" \
    -H "x-worker-secret: $WSECRET" \
    --max-time 540)
  PROC=$(echo "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("processed",False))' 2>/dev/null || echo "False")
  if [ "$PROC" = "True" ]; then
    PROCESSED_COUNT=$((PROCESSED_COUNT+1))
    JOB_INFO=$(echo "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); j=d.get("job",{}) or {}; print(f"{j.get(\"id\",\"-\")[:8]} {j.get(\"status\",\"-\")} step={j.get(\"current_step\",\"-\")} steps={j.get(\"steps_completed\",[])}")' 2>/dev/null || echo "?")
    log "  [$i] processed: $JOB_INFO"
    NOOP_COUNT=0
  else
    NOOP_COUNT=$((NOOP_COUNT+1))
    log "  [$i] no pending jobs"
    if [ "$NOOP_COUNT" -ge 2 ]; then
      log "Two consecutive no-ops, exiting loop"
      break
    fi
  fi
  sleep 1
done

log "==== Clipper cron END (processed=$PROCESSED_COUNT) ===="
