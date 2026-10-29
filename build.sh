#!/usr/bin/env bash
# Optimize assets + (optional) minify. Fonts are self-hosted; images are WebP.
# Drop new source images in assets/img/src/*.{jpg,png} -> auto-converted to WebP.
set -e
cd "$(dirname "$0")"
# Re-inject tracking snippets (GTM/PostHog/Hotjar/Reddit/Crisp) from
# partials/head-tracking.html + partials/body-tracking.html into every page.
# Edit the partials, not the per-page TRACKING markers directly.
python3 inject_tracking.py

# Guard: fail loudly if any page hardcodes a *different* lucid.now domain
# than the one this site actually deploys to (CNAME is the single source
# of truth). Catches the exact bug found 2026-10-29: 80 hardcoded
# new-main.lucid.now references (canonical/og/schema) left behind after
# the domain changed, silently serving the wrong URL in every <meta>/
# JSON-LD tag while the site itself worked fine. Re-run this after any
# domain change, not just once.
LIVE_DOMAIN=$(cat CNAME | tr -d '[:space:]')
# Subdomains that are *always* legitimately different from the site's own
# domain (third-party service endpoints, not canonical/content URLs).
ALLOWED_OTHER_DOMAINS="ingest.lucid.now"
mapfile -t BAD_DOMAIN_FILES < <(grep -rlE "[a-z0-9-]+\.lucid\.now" --include="*.html" . \
  | xargs grep -lE "[a-z0-9-]+\.lucid\.now" \
  | while read -r f; do
      grep -oE "[a-z0-9-]+\.lucid\.now" "$f" | grep -v "^${LIVE_DOMAIN}$" | grep -vFxf <(echo "$ALLOWED_OTHER_DOMAINS") > /dev/null && echo "$f"
    done)
if [ "${#BAD_DOMAIN_FILES[@]}" -gt 0 ]; then
  echo "BUILD FAILED: found hardcoded domain(s) other than '${LIVE_DOMAIN}' (from CNAME) in:"
  for f in "${BAD_DOMAIN_FILES[@]}"; do
    echo "  $f:"
    grep -onE "[a-z0-9-]+\.lucid\.now" "$f" | grep -v ":${LIVE_DOMAIN}$" | grep -vFxf <(echo "$ALLOWED_OTHER_DOMAINS" | sed 's/^/:/') | sed 's/^/    /'
  done
  echo "Fix these (sed -i \"s/<old-domain>/${LIVE_DOMAIN}/g\" <file>) before deploying."
  exit 1
fi
echo "domain check OK: all pages consistently reference ${LIVE_DOMAIN}"
# Keep styles.css/script.js cache-busting version strings identical across
# every page, so navigating homepage -> inner page never re-downloads them
# under a different ?v= (was causing a double-download, fixed 2026-10-29).
ASSET_VER=$(date +%Y%m%d%H%M)
mapfile -t ALL_HTML < <(find . -name "*.html" -not -path "./.git/*" -not -path "./partials/*")
for f in "${ALL_HTML[@]}"; do
  sed -i -E "s/(styles\.css\?v=)[0-9]+/\1${ASSET_VER}/g; s/(script\.js\?v=)[0-9]+/\1${ASSET_VER}/g" "$f"
done
echo "styles.css/script.js version synced to ${ASSET_VER} across ${#ALL_HTML[@]} pages"
if compgen -G "assets/img/src/*" > /dev/null; then
  for f in assets/img/src/*.{jpg,jpeg,png}; do
    [ -e "$f" ] || continue
    out="assets/img/$(basename "${f%.*}").webp"
    cwebp -quiet -q 72 "$f" -o "$out" && echo "webp: $out"
  done
fi
# Optional minify (kept off by default so source stays readable; Lighthouse shows ~0ms savings at this size)
if [ "$1" = "--min" ]; then
  npx --yes csso styles.css -o styles.css
  npx --yes terser script.js -c -m -o script.js
  echo "minified styles.css + script.js"
fi
echo "build complete."
