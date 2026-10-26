#!/usr/bin/env bash
# Lighthouse mobile + desktop for a page. Usage: ./measure.sh [page] [port]
set -e
PAGE="${1:-index.html}"; PORT="${2:-8099}"
python3 -m http.server "$PORT" >/tmp/lucid-srv.log 2>&1 &
SRV=$!; trap 'kill $SRV 2>/dev/null' EXIT; sleep 1
for FF in "mobile --screenEmulation.mobile" "desktop-preset"; do
  if [ "$FF" = "desktop-preset" ]; then FLAGS="--preset=desktop"; LBL=desktop; else FLAGS="--form-factor=mobile --screenEmulation.mobile"; LBL=mobile; fi
  npx --yes lighthouse "http://localhost:$PORT/$PAGE" $FLAGS \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=json --output-path="/tmp/lh-$LBL.json" --quiet \
    --chrome-flags="--headless=new --no-sandbox"
  node -e "const c=require('/tmp/lh-$LBL.json').categories;console.log('$LBL'.padEnd(8),['performance','accessibility','best-practices','seo'].map(k=>k[0].toUpperCase()+Math.round(c[k].score*100)).join(' '))"
done
