#!/usr/bin/env bash
# Runs ON THE SERVER, as the app user, with the unpacked release directory as $1.
# Called by the GitHub Actions deploy job (through AWS SSM); can also be run by hand:
#
#   APP_DIR=/home/ubuntu/frontend PM2_PROCESS=frontend bash deploy-remote.sh /tmp/release
#
# Order matters: dependencies first (staged, so a failed install cannot damage the live
# node_modules), then swap the build, then restart and health-check. If the app does not
# answer afterwards, everything is put back and the script exits non-zero.
set -euo pipefail

REL="${1:?usage: deploy-remote.sh <unpacked-release-dir>}"
APP_DIR="${APP_DIR:?APP_DIR is required}"
PM2_PROCESS="${PM2_PROCESS:?PM2_PROCESS is required}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/}"
PM2="${PM2_BIN:-pm2}"
HEALTH_TRIES="${HEALTH_TRIES:-30}"
HEALTH_WAIT="${HEALTH_WAIT:-2}"
# public/ travels separately from the build (it is large and rarely changes). The deploy job
# passes a short-lived download link plus the git tree hash of public/; it is fetched only
# when that hash differs from the one recorded by the previous deploy.
PUBLIC_URL="${PUBLIC_URL:-}"
PUBLIC_HASH="${PUBLIC_HASH:-}"

# node / pm2 installed through nvm are not on PATH in a non-interactive shell.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then . "$NVM_DIR/nvm.sh" >/dev/null 2>&1 || true; fi

log() { echo "[deploy] $*"; }
CONFIG_FILES="package.json package-lock.json next.config.mjs next.config.js postcss.config.mjs .env.production"

cd "$APP_DIR"
[ -d "$REL/.next" ] || { log "release has no .next - refusing to deploy"; exit 1; }
[ -f "$REL/package-lock.json" ] || { log "release has no package-lock.json - refusing to deploy"; exit 1; }
if [ -f "$REL/RELEASE" ]; then sed 's/^/[deploy] /' "$REL/RELEASE"; fi

# 0. public/ - only when it changed since the last deploy.
public_changed=0
have_public="$(cat .deploy-public-hash 2>/dev/null || true)"
if [ -n "$PUBLIC_URL" ] && [ -n "$PUBLIC_HASH" ] && [ "$PUBLIC_HASH" != "$have_public" ]; then
  log "public/ changed - downloading"
  mkdir -p "$REL/public"
  curl -fsSL --retry 3 --retry-delay 2 -o "$REL/public.tgz" "$PUBLIC_URL"
  tar -xzf "$REL/public.tgz" -C "$REL/public"
  rm -f "$REL/public.tgz"
  public_changed=1
else
  log "public/ unchanged"
fi

# 1. Dependencies, only when the lockfile changed, installed into a staging dir first.
want="$(sha256sum "$REL/package-lock.json" | cut -d' ' -f1)"
have="$(cat .deploy-lock-hash 2>/dev/null || true)"
deps_swapped=0
if [ -d node_modules ] && [ "$want" = "$have" ]; then
  log "dependencies unchanged"
else
  log "lockfile changed - installing production dependencies"
  rm -rf .deploy-stage
  mkdir .deploy-stage
  cp "$REL/package.json" "$REL/package-lock.json" .deploy-stage/
  # --ignore-scripts: no package gets to run code during install on this machine.
  (cd .deploy-stage && npm ci --omit=dev --ignore-scripts --no-audit --no-fund)
  mkdir -p .deploy-stage/node_modules
  rm -rf node_modules.prev
  if [ -d node_modules ]; then mv node_modules node_modules.prev; fi
  mv .deploy-stage/node_modules node_modules
  rm -rf .deploy-stage
  deps_swapped=1
fi

# 2. Swap in the new build; keep the previous one for rollback.
log "swapping in the new build"
rm -rf .next.prev public.prev
if [ -d .next ]; then mv .next .next.prev; fi
mv "$REL/.next" .next
# Keep the image-optimizer cache warm across deploys.
if [ -d .next.prev/cache ]; then mv .next.prev/cache .next/cache; fi
if [ -d "$REL/public" ]; then
  if [ -d public ]; then mv public public.prev; fi
  mv "$REL/public" public
fi
for f in $CONFIG_FILES; do
  if [ -f "$REL/$f" ]; then
    if [ -f "$f" ]; then cp -p "$f" "$f.prev"; fi
    cp "$REL/$f" "$f"
  fi
done
echo "$want" > .deploy-lock-hash
if [ "$public_changed" = 1 ]; then echo "$PUBLIC_HASH" > .deploy-public-hash; fi

# 3. Restart and wait for the app to answer.
healthy() {
  local i
  for i in $(seq 1 "$HEALTH_TRIES"); do
    if curl -fsS -o /dev/null --max-time 5 "$HEALTH_URL"; then return 0; fi
    sleep "$HEALTH_WAIT"
  done
  return 1
}

log "restarting $PM2_PROCESS"
"$PM2" restart "$PM2_PROCESS" --update-env

if healthy; then
  log "healthy: $HEALTH_URL"
  rm -rf node_modules.prev
  log "done. previous build kept in .next.prev for a manual rollback"
  exit 0
fi

# 4. Rollback.
log "health check FAILED ($HEALTH_URL) - rolling back"
rm -rf .next
if [ -d .next.prev ]; then mv .next.prev .next; fi
if [ -d public.prev ]; then rm -rf public; mv public.prev public; fi
for f in $CONFIG_FILES; do
  if [ -f "$f.prev" ]; then mv "$f.prev" "$f"; fi
done
if [ "$deps_swapped" = 1 ] && [ -d node_modules.prev ]; then
  rm -rf node_modules
  mv node_modules.prev node_modules
fi
if [ -n "$have" ]; then echo "$have" > .deploy-lock-hash; else rm -f .deploy-lock-hash; fi
if [ "$public_changed" = 1 ]; then
  if [ -n "$have_public" ]; then echo "$have_public" > .deploy-public-hash; else rm -f .deploy-public-hash; fi
fi
"$PM2" restart "$PM2_PROCESS" --update-env || true
if healthy; then log "rolled back; previous version is serving again"; else log "previous version is NOT answering either - needs a human"; fi
exit 1
