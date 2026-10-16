#!/usr/bin/env bash
# CI tripwire. Runs BEFORE any npm/node code in the workflow, and is plain shell on
# purpose: its whole job is to stop a poisoned config or lifecycle script from executing
# on a runner (the deploy job's runner can assume an AWS role).
#
# It targets the attack shape that has already hit these repos: an obfuscated loader
# appended to a config file that Next/PostCSS executes on every build, hidden behind a
# long run of whitespace, plus package.json scripts rewired to run a helper first.
# It is a tripwire, not a scanner: it will not catch everything, and it should fail
# loudly and early when it does fire.
#
# Usage: scripts/ci-guard.sh [dir]     (default: current directory)
set -uo pipefail
cd "${1:-.}"

fail=0
bad() { echo "::error title=ci-guard::$*"; fail=1; }

# 1. Config files that code-execute during install/build.
shopt -s nullglob
configs=(next.config.* postcss.config.* tailwind.config.* eslint.config.* babel.config.* .babelrc*)
for f in "${configs[@]}"; do
  [ -f "$f" ] || continue
  if awk 'length($0) > 300 { found = 1 } END { exit !found }' "$f"; then
    bad "$f contains a line longer than 300 characters"
  fi
  if grep -qP '\S[ \t]{60,}\S' "$f"; then
    bad "$f has code sitting behind a long run of whitespace (payload hidden off-screen)"
  fi
  if grep -nE 'eval\(|new Function|child_process|execSync|spawnSync|\bspawn\(|node -e|createRequire|atob\(|fromCharCode' "$f"; then
    bad "$f contains a suspicious API (eval / child_process / createRequire / ...)"
  fi
done

# 2. package.json: no npm lifecycle scripts, and the entry scripts stay plain `next ...`.
if [ -f package.json ]; then
  if ! command -v jq >/dev/null 2>&1; then
    bad "jq is required by ci-guard but is not installed"
  else
    if jq -e '(.scripts // {}) | keys[] | select(test("^(pre|post)?(install|prepare|publish|prepack|postpack|uninstall|version|dependencies)$|^prepublishOnly$"))' package.json >/dev/null; then
      bad "package.json defines an npm lifecycle script (install/prepare/postinstall/...)"
    fi
    if jq -e '(.scripts // {}) | to_entries[] | select(.key | IN("dev","build","start")) | select(.value | test("^next (dev|build|start)( (-p|--port) [0-9]+)?( --turbopack)?$") | not)' package.json >/dev/null; then
      bad "package.json dev/build/start must be a plain 'next dev|build|start' command"
    fi
    if jq -e '(.scripts // {}) | to_entries[] | select(.value | test("curl|wget|node |bash |sh -c|eval|powershell"))' package.json >/dev/null; then
      bad "package.json has a script that shells out to curl/wget/node/bash/eval"
    fi
  fi
fi

# 3. Lockfile: every package must come from the public npm registry.
if [ -f package-lock.json ]; then
  # Tolerant of whitespace so a minified lockfile cannot slip past.
  offsite="$(grep -oE '"resolved"[[:space:]]*:[[:space:]]*"[^"]*"' package-lock.json | grep -vE '"https://registry\.npmjs\.org/' || true)"
  if [ -n "$offsite" ]; then
    echo "$offsite" | head -3
    bad "package-lock.json resolves a package from somewhere other than registry.npmjs.org"
  fi
  # Packages with install scripts only matter if scripts run; CI installs with --ignore-scripts.
  # Surface them anyway so a new one is noticed in review.
  if jq -e '[.packages // {} | to_entries[] | select(.value.hasInstallScript == true) | .key] | length > 0' package-lock.json >/dev/null 2>&1; then
    echo "::notice title=ci-guard::packages with install scripts (skipped by --ignore-scripts): $(jq -r '[.packages | to_entries[] | select(.value.hasInstallScript == true) | .key | sub("^node_modules/"; "")] | join(", ")' package-lock.json)"
  fi
fi

# 4. Stray build helpers the earlier compromise left behind.
for f in api.js temp_auto_push.bat temp_interactive_push.bat branch_structure.json; do
  [ -e "$f" ] && bad "unexpected file in the repo root: $f"
done

if [ "$fail" -ne 0 ]; then
  echo "ci-guard FAILED - nothing was installed or built." >&2
  exit 1
fi
echo "ci-guard passed"
