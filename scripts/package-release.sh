#!/usr/bin/env bash
# Packs a finished `next build` into one tarball that the server can unpack and run.
# Only what `next start` needs: the build output, the manifest/config files, and the
# on-server deploy script. No source, no node_modules, no build cache.
#
# public/ is NOT included by default: it is ~200 MB, changes rarely, and would eat the
# GitHub artifact quota. The deploy job ships it separately, only when it changed
# (see .github/workflows/deploy.yml). Set INCLUDE_PUBLIC=1 to bundle it anyway.
#
# Usage: scripts/package-release.sh [output.tgz]      (run after `npm run build`)
set -euo pipefail

OUT="${1:-release.tgz}"
[ -f .next/BUILD_ID ] || { echo "no .next/BUILD_ID - run 'npm run build' first" >&2; exit 1; }

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

cp -R .next "$STAGE/.next"
rm -rf "$STAGE/.next/cache" "$STAGE/.next/dev" "$STAGE/.next/diagnostics" "$STAGE/.next/turbopack"
rm -f "$STAGE"/.next/trace*

if [ "${INCLUDE_PUBLIC:-0}" = "1" ] && [ -d public ]; then cp -R public "$STAGE/public"; fi
for f in package.json package-lock.json next.config.mjs next.config.js postcss.config.mjs .env.production; do
  [ -f "$f" ] && cp "$f" "$STAGE/$f"
done

mkdir -p "$STAGE/deploy"
cp deploy/deploy-remote.sh "$STAGE/deploy/deploy-remote.sh"

{
  echo "commit: ${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo unknown)}"
  echo "built:  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "run:    ${GITHUB_RUN_ID:-local}"
} > "$STAGE/RELEASE"

tar -C "$STAGE" -czf "$OUT" .
echo "wrote $OUT ($(du -h "$OUT" | cut -f1)), $(tar -tzf "$OUT" | wc -l) entries"
