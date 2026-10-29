#!/usr/bin/env python3
"""Injects partials/head-tracking.html and partials/body-tracking.html into
every page's <head> and <body>, between TRACKING marker comments. Re-run
after editing a partial to refresh all pages from one source. Idempotent:
safe to run repeatedly, replaces only the marked region each time."""
import glob
import re

HEAD_START, HEAD_END = "<!-- TRACKING:HEAD:START -->", "<!-- TRACKING:HEAD:END -->"
BODY_START, BODY_END = "<!-- TRACKING:BODY:START -->", "<!-- TRACKING:BODY:END -->"

with open("partials/head-tracking.html") as f:
    head_partial = f.read().strip()
with open("partials/body-tracking.html") as f:
    body_partial = f.read().strip()

head_block = f"{HEAD_START}\n{head_partial}\n{HEAD_END}"
body_block = f"{BODY_START}\n{body_partial}\n{BODY_END}"

head_region_re = re.compile(re.escape(HEAD_START) + r".*?" + re.escape(HEAD_END), re.DOTALL)
body_region_re = re.compile(re.escape(BODY_START) + r".*?" + re.escape(BODY_END), re.DOTALL)

changed = []
for path in sorted(p for p in glob.glob("**/*.html", recursive=True) if not p.startswith("partials/")):
    with open(path) as f:
        html = f.read()
    original = html

    if HEAD_START in html:
        html = head_region_re.sub(head_block, html)
    else:
        html = re.sub(r"(<head>)", r"\1\n" + head_block, html, count=1)

    if BODY_START in html:
        html = body_region_re.sub(body_block, html)
    else:
        html = re.sub(r"(<body[^>]*>)", r"\1\n" + body_block, html, count=1)

    if html != original:
        with open(path, "w") as f:
            f.write(html)
        changed.append(path)

print(f"Injected tracking into {len(changed)} files:")
for p in changed:
    print(" -", p)
