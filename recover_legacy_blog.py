#!/usr/bin/env python3
"""
One-off recovery of legacy blog articles that existed on the old Unicorn site
and are still indexed by Google, but which SEObot has since renamed/removed (so
they are NOT in the current REST API feed). We pull their original content from
the Wayback Machine and save it as JSON in legacy_blog/, in the SAME shape as a
SEObot article. build_blog.py then merges legacy_blog/*.json with the live feed,
so these URLs stay alive at their exact old paths in the pages, listing + sitemap.

Run once (re-runnable): python3 recover_legacy_blog.py
"""
import os, re, json, urllib.request
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.abspath(__file__))
LEGACY_DIR = os.path.join(ROOT, "legacy_blog")

# slug -> best Wayback snapshot (status 200) of the original Unicorn page.
SNAPSHOTS = {
    "ai-fueling-startup-growth": "20260606021024",
    "essential-metrics": "20260714042121",
    "preparing-for-economic-challenges-building-resilient-financial-plans-with-ai": "20260420055357",
    "real-time-financial-insights-boost-startup-growth-with-ai": "20260714040138",
}

def fetch_raw(ts, slug):
    # Prefer a pre-fetched local copy (Wayback's raw replay is slow/flaky);
    # fall back to fetching directly if it is not present.
    local = os.path.join("/tmp/wb_pages", f"{slug}.html")
    if os.path.exists(local):
        with open(local, encoding="utf-8", errors="replace") as f:
            return f.read()
    url = f"http://web.archive.org/web/{ts}id_/https://www.lucid.now/blog/{slug}/"
    req = urllib.request.Request(url, headers={"User-Agent": "lucid-legacy-recovery/1.0"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read().decode("utf-8", "replace")

def extract(html, slug):
    soup = BeautifulSoup(html, "html.parser")

    h1 = soup.find("h1", class_="post-title")
    headline = h1.get_text(strip=True) if h1 else slug.replace("-", " ").title()

    md = soup.find("meta", attrs={"name": "description"})
    desc = md["content"].strip() if md and md.get("content") else ""

    og = soup.find("meta", attrs={"property": "og:image"})
    image = og["content"].strip() if og and og.get("content") else ""

    # Published date from JSON-LD if present.
    published = ""
    for s in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            data = json.loads(s.string or "{}")
            for obj in (data if isinstance(data, list) else [data]):
                if isinstance(obj, dict) and obj.get("datePublished"):
                    published = obj["datePublished"]; break
        except Exception:
            pass
        if published:
            break

    body = soup.find("div", class_=lambda c: c and "post-body" in c.split())
    if not body:
        raise SystemExit(f"ERROR: could not find post-body for {slug}")
    # Strip non-content: scripts/styles, related-posts, share widgets, nav.
    for el in body.find_all(["script", "style", "noscript", "iframe"]):
        el.decompose()
    for el in body.find_all(class_=lambda c: c and any(
            k in " ".join(c.split()) for k in ("read-more", "more-posts", "share", "post-nav"))):
        el.decompose()
    body_html = body.decode_contents().strip()
    # Drop a leading <h1> if the body duplicates the title.
    body_html = re.sub(r"^\s*<h1\b[^>]*>.*?</h1>", "", body_html, count=1, flags=re.DOTALL).strip()

    words = len(re.sub(r"<[^>]+>", " ", body_html).split())
    reading = max(1, round(words / 200))

    return {
        "id": "legacy-" + slug,
        "slug": slug,
        "headline": headline,
        "metaDescription": desc,
        "html": body_html,
        "image": image,
        "readingTime": reading,
        "publishedAt": published,
        "category": {"title": "Insights"},
        "published": True,
        "deleted": False,
        "legacy": True,
    }

def main():
    os.makedirs(LEGACY_DIR, exist_ok=True)
    for slug, ts in SNAPSHOTS.items():
        print(f"Recovering {slug} (snapshot {ts})...")
        art = extract(fetch_raw(ts, slug), slug)
        with open(os.path.join(LEGACY_DIR, f"{slug}.json"), "w", encoding="utf-8") as f:
            json.dump(art, f, ensure_ascii=False, indent=2)
        print(f"  ok: \"{art['headline']}\" ({len(art['html'])} chars body, {art['readingTime']} min)")
    print(f"\nDone. {len(SNAPSHOTS)} legacy articles saved to legacy_blog/.")
    print("Now run build_blog.py — it merges legacy_blog/*.json into the site.")

if __name__ == "__main__":
    main()
