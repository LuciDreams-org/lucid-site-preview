#!/usr/bin/env bash
# Optimize assets + (optional) minify. Fonts are self-hosted; images are WebP.
# Drop new source images in assets/img/src/*.{jpg,png} -> auto-converted to WebP.
set -e
cd "$(dirname "$0")"
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
