#!/usr/bin/env bash
# Optimize assets + (optional) minify. Fonts are self-hosted; images are WebP.
# Drop new source images in assets/img/src/*.{jpg,png} -> auto-converted to WebP.
set -e
cd "$(dirname "$0")"
# Re-inject tracking snippets (GTM/PostHog/Hotjar/Reddit/Crisp) from
# partials/head-tracking.html + partials/body-tracking.html into every page.
# Edit the partials, not the per-page TRACKING markers directly.
python3 inject_tracking.py
# Keep styles.css/script.js cache-busting version strings identical across
# every page, so navigating homepage -> inner page never re-downloads them
# under a different ?v= (was causing a double-download, fixed 2026-10-29).
ASSET_VER=$(date +%Y%m%d%H%M)
for f in *.html; do
  sed -i -E "s/(styles\.css\?v=)[0-9]+/\1${ASSET_VER}/g; s/(script\.js\?v=)[0-9]+/\1${ASSET_VER}/g" "$f"
done
echo "styles.css/script.js version synced to ${ASSET_VER} across $(ls *.html | wc -l) pages"
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
