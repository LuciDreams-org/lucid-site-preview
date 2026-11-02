#!/usr/bin/env python3
"""
Generate the static Lucid blog from SEObot's REST API.

Fetches the SEObot article index + each article's full JSON, then writes one
static page per published article at blog/<slug>/index.html (so the live URL is
/blog/<slug>/ — identical to the old Unicorn-hosted paths). Also regenerates the
blog listing (blog.html) and the blog entries in sitemap.xml, and saves a raw
backup + manifest outside the deployed output.

Re-runnable: run it again to pick up new/updated articles. Safe: the API key is
read from the SEOBOT_API_KEY environment variable (never committed), and the
build aborts if the index is empty or a slug collides, so a failed sync can
never replace the live blog with nothing.

Usage:
    SEOBOT_API_KEY=xxxxxxxx python3 build_blog.py            # generate pages
    SEOBOT_API_KEY=xxxxxxxx python3 build_blog.py --export   # also write backup
    SEOBOT_API_KEY=xxxxxxxx python3 build_blog.py --limit 5  # test with N articles

After generating, run ./build.sh (or python3 inject_tracking.py) so the shared
GTM/PostHog/Meta/Crisp tracking is injected into the new pages too.
"""
import os
import re
import sys
import json
import html
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

CDN = "https://cdn.seobotai.com"
SITE = "https://www.lucid.now"
def _asset_ver():
    """Read the current ?v= cache-buster from index.html so blog pages match
    the rest of the site (build.sh bumps this across all pages on each build)."""
    try:
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "index.html"), encoding="utf-8") as f:
            m = re.search(r"styles\.css\?v=(\d+)", f.read())
            if m:
                return m.group(1)
    except Exception:
        pass
    return "1"
ROOT = os.path.dirname(os.path.abspath(__file__))
BLOG_DIR = os.path.join(ROOT, "blog")
EXPORT_DIR = os.path.join(ROOT, "_seobot_export")  # gitignored, not deployed
LEGACY_DIR = os.path.join(ROOT, "legacy_blog")      # archive-recovered articles
# Old indexed URLs (from Google Search Console "Not found 404") that SEObot
# renamed/re-pathed with no separate content to keep -> 301-style redirect to the
# current article so Google consolidates the ranking signal. Full paths from root.
REDIRECTS = {
    "/blog/how-ai-improves-financial-report/": "/blog/how-ai-improves-financial-report-accuracy/",
    "/blog/how-ai-tools-for-financial-resilience-in-startups/": "/blog/ai-tools-for-financial-resilience-in-startups/",
    "/blog/ai-anomaly-detection-use-cases-in-finance/": "/blog/ai-anomaly-detection-use-cases-finance/",
    "/blog/ai-simplifies-funding-compliance/": "/blog/how-ai-simplifies-funding-compliance/",
    "/post/best-tools-real-time-financial-dashboards/": "/blog/best-tools-real-time-financial-dashboards/",
    # Retired non-blog marketing pages Google still has indexed (GSC 404s) ->
    # closest relevant current page (content is gone; redirect preserves the signal).
    "/landing/": "/",
    "/tax-filings/": "/",
    "/slack-support/": "/",
    "/pricing-accounting/": "/pricing",
    "/rd-credits/": "/",
    "/real-time-ai-reporting-analysis-forecasting/": "/platform-cashflow",
    "/how-ai-improves-payment-terms-negotiation/": "/blog",
    "/thank-you/calendar-booking/": "/",
    # Old site used trailing-slash URLs; GitHub Pages serves these pages
    # extension-less, so the indexed /page/ forms 404. Redirect to the no-slash canonical.
    "/pricing/": "/pricing",
    "/privacy-policy/": "/privacy-policy",
    "/termsofservice/": "/termsofservice",
    "/data-processing-addendum/": "/data-processing-addendum",
    "/careers/": "/careers",
    "/contact/": "/contact",
    "/testimonials/": "/testimonials",
    "/blog/": "/blog",
    "/accounting/": "/",
    "/thank-you/confirmation/": "/",
}
ASSET_VER = _asset_ver()

# ---------------------------------------------------------------- HTTP helpers

def _get(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": "lucid-blog-build/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

def fetch_index(key):
    data = json.loads(_get(f"{CDN}/{key}/system/base.json"))
    if not isinstance(data, list):
        raise SystemExit("ERROR: index is not a JSON array; aborting.")
    return data

def fetch_article(key, article_id):
    return json.loads(_get(f"{CDN}/{key}/blog/{article_id}.json"))

# ------------------------------------------------------------------- rendering

def esc(s):
    return html.escape(s or "", quote=True)

def fmt_date(iso):
    if not iso:
        return ""
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.strftime("%B %-d, %Y")
    except Exception:
        return ""

# Shared nav/footer, with ABSOLUTE paths (article pages live two levels deep).
NAV = """<a class="skip-link" href="#main">Skip to content</a><header class="nav"><div class="wrap nav-inner">
<a href="/" class="brand" aria-label="Lucid home"><img class="brand-logo" src="/assets/lucid-logo.webp?v=2" alt="Lucid" width="97" height="30" /></a>
<nav class="nav-links" id="navLinks" aria-label="Primary">
<a href="/#services">Services</a><a href="/platforms">Platforms</a><a href="/pricing">Pricing</a><a href="/#testimonials">Reviews</a><a href="/security">Security</a>
<div class="nav-dd"><button type="button" class="nav-dd-btn" aria-expanded="false" aria-haspopup="true">Specialties <span class="dd-caret" aria-hidden="true">&#9662;</span></button><div class="nav-dd-menu"><div class="nav-dd-inner"><div class="nav-dd-head">Built for your specialty</div><div class="nav-dd-grid" role="menu"><a class="dd-block" role="menuitem" href="/specialty/primary-care"><span class="dd-ico" aria-hidden="true">&#129658;</span><span class="dd-txt"><b>Primary Care</b><small>Family medicine</small></span></a><a class="dd-block" role="menuitem" href="/specialty/orthopedics"><span class="dd-ico" aria-hidden="true">&#129666;</span><span class="dd-txt"><b>Orthopedics</b><small>Sports medicine</small></span></a><a class="dd-block" role="menuitem" href="/specialty/dermatology"><span class="dd-ico" aria-hidden="true">&#129524;</span><span class="dd-txt"><b>Dermatology</b><small>Skin &amp; aesthetics</small></span></a><a class="dd-block" role="menuitem" href="/specialty/dental"><span class="dd-ico" aria-hidden="true">&#129463;</span><span class="dd-txt"><b>Dental</b><small>Dentistry &amp; oral health</small></span></a><a class="dd-block" role="menuitem" href="/specialty/medical-group"><span class="dd-ico" aria-hidden="true">&#127973;</span><span class="dd-txt"><b>Medical Group</b><small>Multi-location</small></span></a><a class="dd-block" role="menuitem" href="/specialty/ophthalmology"><span class="dd-ico" aria-hidden="true">&#128065;</span><span class="dd-txt"><b>Ophthalmology</b><small>Eye care</small></span></a><a class="dd-block" role="menuitem" href="/specialty/medical-spa"><span class="dd-ico" aria-hidden="true">&#128134;</span><span class="dd-txt"><b>Medical Spa</b><small>Aesthetics &amp; injectables</small></span></a><a class="dd-block" role="menuitem" href="/specialty/behavioral-health"><span class="dd-ico" aria-hidden="true">&#129504;</span><span class="dd-txt"><b>Behavioral Health</b><small>Mental health</small></span></a><a class="dd-block" role="menuitem" href="/specialty/physical-therapy"><span class="dd-ico" aria-hidden="true">&#127939;</span><span class="dd-txt"><b>Physical Therapy</b><small>Rehab &amp; recovery</small></span></a><a class="dd-block" role="menuitem" href="/specialty/nutrition-dietitian"><span class="dd-ico" aria-hidden="true">&#129361;</span><span class="dd-txt"><b>Nutrition</b><small>Dietitian</small></span></a><a class="dd-block" role="menuitem" href="/specialty/speech-therapy"><span class="dd-ico" aria-hidden="true">&#128483;</span><span class="dd-txt"><b>Speech Therapy</b><small>Language therapy</small></span></a></div><a class="dd-foot" href="/pricing"><span>Don't see your specialty? We support many more</span><b>Talk to an expert &rarr;</b></a></div></div></div>
</nav>
<div class="nav-cta"><a href="/pricing" class="btn btn-ghost">Talk to an Expert</a><a href="/pricing" class="btn btn-primary">Get Started</a>
<button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false" aria-controls="navLinks">&#9776;</button></div>
</div></header>"""

FOOTER = """<footer><div class="wrap"><div class="foot-grid">
<div><div class="brand"><img class="brand-logo" src="/assets/lucid-logo.webp?v=2" alt="Lucid" width="97" height="30" /></div><p style="max-width:280px;">One solution for all your practice finances - powered by real-time AI, backed by experts.</p></div>
<div><h3>Platforms</h3><ul><li><a href="/platform-cashflow">Cashflow Reporting &amp; Forecasting</a></li><li><a href="/platform-categorization">Categorization</a></li><li><a href="/platform-reconciliation">Reconciliation</a></li></ul></div>
<div><h3>Specialties</h3><ul><li><a href="/specialty/primary-care">Primary Care / Family Medicine</a></li><li><a href="/specialty/orthopedics">Orthopedics / Sports Medicine</a></li><li><a href="/specialty/dermatology">Dermatology</a></li><li><a href="/specialty/medical-group">Medical Group / Several Locations</a></li><li><a href="/specialty/ophthalmology">Ophthalmology / Eye Care</a></li><li><a href="/specialty/medical-spa">Medical Spa / Aesthetics</a></li><li><a href="/#industries">All specialties</a></li></ul></div>
<div><h3>Resources</h3><ul><li><a href="/termsofservice">Terms of Service</a></li><li><a href="/sla">Service Level Agreement</a></li><li><a href="/privacy-policy">Privacy Policy</a></li><li><a href="/data-processing-addendum">Data Processing Addendum</a></li><li><a href="/blog">Blog</a></li></ul></div>
<div><h3>Company</h3><ul><li><a href="/pricing">Pricing</a></li></ul></div>
</div><div class="foot-bottom"><span>&copy; 2023 Lucid. All rights reserved.</span><span>SOC 2 &amp; HIPAA aligned</span></div></div></footer>"""

H1_RE = re.compile(r"<h1\b[^>]*>.*?</h1>", re.DOTALL | re.IGNORECASE)

def render_article(a):
    slug = a["slug"]
    url = f"{SITE}/blog/{slug}/"
    headline = a.get("headline") or slug
    desc = a.get("metaDescription") or ""
    image = a.get("image") or ""
    reading = a.get("readingTime")
    published_at = a.get("publishedAt") or a.get("createdAt") or ""
    updated_at = a.get("updatedAt") or published_at
    category = (a.get("category") or {}).get("title") if isinstance(a.get("category"), dict) else None
    body = a.get("html") or ""
    # The SEObot body leads with its own <h1>; drop it so the styled header is the only h1.
    body = H1_RE.sub("", body, count=1).lstrip()
    # Canonicalize internal links to the www host (apex 301-redirects, adds a hop).
    body = body.replace("https://lucid.now", "https://www.lucid.now")

    meta_bits = []
    d = fmt_date(published_at)
    if d:
        meta_bits.append(f'<time datetime="{esc(published_at)}">{esc(d)}</time>')
    if reading:
        meta_bits.append(f"{int(reading)} min read")
    meta_row = " &middot; ".join(meta_bits)

    hero = f'<img class="article-hero" src="{esc(image)}" alt="{esc(headline)}" loading="eager" />' if image else ""
    eyebrow = f'<span class="article-eyebrow">{esc(category)}</span>' if category else '<span class="article-eyebrow">Insights</span>'

    schema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": headline,
        "description": desc,
        "image": image or f"{SITE}/assets/img/hero-woman.webp",
        "datePublished": published_at,
        "dateModified": updated_at,
        "mainEntityOfPage": {"@type": "WebPage", "@id": url},
        "author": {"@type": "Organization", "name": "Lucid"},
        "publisher": {
            "@type": "Organization",
            "name": "Lucid",
            "logo": {"@type": "ImageObject", "url": f"{SITE}/assets/lucid-logo.webp"},
        },
    }

    og_img = f'<meta property="og:image" content="{esc(image)}"/>' if image else ""
    tw_img = f'<meta name="twitter:image" content="{esc(image)}"/>' if image else ""

    return f"""<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>
<title>{esc(headline)} - Lucid</title>
<meta name="description" content="{esc(desc)}"/>
<link rel="canonical" href="{url}"/>
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"/><meta name="theme-color" content="#7C3AED"/>
<meta property="og:type" content="article"/>
<meta property="og:title" content="{esc(headline)}"/>
<meta property="og:description" content="{esc(desc)}"/>
<meta property="og:url" content="{url}"/>
{og_img}
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="{esc(headline)}"/>
<meta name="twitter:description" content="{esc(desc)}"/>
{tw_img}
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/inter-var.woff2" crossorigin/>
<link rel="stylesheet" href="/styles.css?v={ASSET_VER}"/>
<script type="application/ld+json">{json.dumps(schema)}</script>
</head><body>
{NAV}
<main id="main"><article class="article"><div class="wrap article-wrap">
<a class="article-back" href="/blog">&larr; All articles</a>
{eyebrow}
<h1 class="article-title">{esc(headline)}</h1>
<div class="article-meta">{meta_row}</div>
{hero}
<div class="article-body">
{body}
</div>
<div class="article-cta"><h3>Ready to simplify your practice finances?</h3><p>AI-powered bookkeeping, taxes, and CFO services built for medical &amp; private practices.</p><a href="/pricing" class="btn btn-primary btn-lg">Get Started</a></div>
</div></article></main>
{FOOTER}
<script src="/script.js?v={ASSET_VER}" defer></script></body></html>"""

def render_listing(articles):
    cards = []
    for a in articles:
        cat = (a.get("category") or {}).get("title") if isinstance(a.get("category"), dict) else "Insights"
        snippet = (a.get("metaDescription") or "").strip()
        if len(snippet) > 150:
            snippet = snippet[:147].rstrip() + "..."
        cards.append(
            f'<a class="blog-card" href="/blog/{esc(a["slug"])}/">'
            f'<span class="tag">{esc(cat or "Insights")}</span>'
            f'<h3>{esc(a.get("headline") or a["slug"])}</h3>'
            f'<p>{esc(snippet)}</p></a>'
        )
    return "\n".join(cards)

# -------------------------------------------------------------------- writers

def write_pages(articles):
    os.makedirs(BLOG_DIR, exist_ok=True)
    for a in articles:
        d = os.path.join(BLOG_DIR, a["slug"])
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
            f.write(render_article(a))

def update_listing(articles):
    path = os.path.join(ROOT, "blog.html")
    with open(path, encoding="utf-8") as f:
        html_doc = f.read()
    new_grid = f'<div class="blog-grid">\n{render_listing(articles)}\n</div>'
    html_doc, n = re.subn(r'<div class="blog-grid">.*?</div>', new_grid, html_doc, count=1, flags=re.DOTALL)
    if n != 1:
        raise SystemExit("ERROR: could not locate <div class=\"blog-grid\"> in blog.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html_doc)

def update_sitemap(articles):
    path = os.path.join(ROOT, "sitemap.xml")
    with open(path, encoding="utf-8") as f:
        xml = f.read()
    # Drop any existing /blog entries (listing + articles), then re-add fresh.
    xml = re.sub(r"\s*<url><loc>https://www\.lucid\.now/blog[^<]*</loc>.*?</url>", "", xml)
    entries = [f'  <url><loc>{SITE}/blog</loc><priority>0.5</priority></url>']
    for a in articles:
        entries.append(f'  <url><loc>{SITE}/blog/{a["slug"]}/</loc><priority>0.5</priority></url>')
    xml = xml.replace("</urlset>", "\n".join(entries) + "\n</urlset>")
    with open(path, "w", encoding="utf-8") as f:
        f.write(xml)

def load_legacy():
    """Archive-recovered articles (legacy_blog/*.json) that Google still indexes
    but SEObot no longer serves. Same shape as a SEObot article."""
    out = []
    if os.path.isdir(LEGACY_DIR):
        for fn in sorted(os.listdir(LEGACY_DIR)):
            if fn.endswith(".json"):
                with open(os.path.join(LEGACY_DIR, fn), encoding="utf-8") as f:
                    out.append(json.load(f))
    return out

def write_redirects():
    """Client-side 301-style redirect pages for old URLs with no content to keep
    (canonical -> successor so Google consolidates the ranking signal)."""
    for old, target in REDIRECTS.items():
        d = os.path.join(ROOT, old.strip("/"))
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
            f.write(f'<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>'
                    f'<title>Redirecting - Lucid</title>'
                    f'<link rel="canonical" href="{SITE}{target}"/>'
                    f'<meta http-equiv="refresh" content="0; url={target}"/>'
                    f'<meta name="robots" content="noindex, follow"/>'
                    f'<script>location.replace("{target}");</script>'
                    f'</head><body>Redirecting to <a href="{target}">{esc(target)}</a>&hellip;</body></html>')

def write_export(articles_raw):
    os.makedirs(os.path.join(EXPORT_DIR, "articles"), exist_ok=True)
    manifest = []
    for a in articles_raw:
        with open(os.path.join(EXPORT_DIR, "articles", f'{a["id"]}.json'), "w", encoding="utf-8") as f:
            json.dump(a, f, ensure_ascii=False, indent=2)
        manifest.append({"id": a["id"], "slug": a.get("slug"),
                         "url": f'/blog/{a.get("slug")}/',
                         "published": a.get("published"), "deleted": a.get("deleted")})
    with open(os.path.join(EXPORT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

# ----------------------------------------------------------------------- main

def main():
    key = os.environ.get("SEOBOT_API_KEY")
    if not key:
        sys.exit("ERROR: set SEOBOT_API_KEY (never commit it). Aborting.")

    export = "--export" in sys.argv
    limit = None
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])

    print("Fetching SEObot index...")
    index = fetch_index(key)
    if not index:
        sys.exit("ERROR: index is EMPTY. Refusing to wipe the live blog with nothing.")
    if limit:
        index = index[:limit]
    print(f"  {len(index)} articles in index")

    print("Fetching full articles...")
    ids = [a["id"] for a in index]
    raw = {}
    errors = []
    def grab(aid):
        try:
            return aid, fetch_article(key, aid)
        except Exception as e:
            return aid, e
    with ThreadPoolExecutor(max_workers=12) as ex:
        for aid, res in ex.map(grab, ids):
            if isinstance(res, Exception):
                errors.append((aid, str(res)))
            else:
                raw[aid] = res
    if errors:
        for aid, e in errors[:10]:
            print(f"  FAILED {aid}: {e}")
        sys.exit(f"ERROR: {len(errors)} article(s) failed to download. Aborting so the "
                 f"blog is never partially rebuilt.")

    # Keep only published, non-deleted; validate slugs.
    articles = []
    skipped = 0
    for aid in ids:
        a = raw[aid]
        if not a.get("published") or a.get("deleted") or not a.get("slug") or not a.get("html"):
            skipped += 1
            continue
        articles.append(a)

    # Merge archive-recovered legacy articles (old indexed URLs SEObot dropped).
    known = {a["slug"] for a in articles}
    legacy_added = 0
    for a in load_legacy():
        if a.get("slug") and a["slug"] not in known and a.get("published") and not a.get("deleted") and a.get("html"):
            articles.append(a)
            known.add(a["slug"])
            legacy_added += 1
    if legacy_added:
        print(f"  + {legacy_added} legacy (archive-recovered) articles merged")

    if not articles:
        sys.exit("ERROR: 0 publishable articles after filtering. Aborting.")

    seen = {}
    dups = []
    for a in articles:
        if a["slug"] in seen:
            dups.append(a["slug"])
        seen[a["slug"]] = True
    if dups:
        sys.exit(f"ERROR: duplicate slugs would collide: {sorted(set(dups))[:10]}")

    # Newest first for the listing.
    articles.sort(key=lambda a: a.get("publishedAt") or a.get("createdAt") or "", reverse=True)

    print(f"Generating {len(articles)} pages ({skipped} skipped: draft/deleted)...")
    write_pages(articles)
    write_redirects()
    update_listing(articles)
    update_sitemap(articles)
    if export:
        write_export([raw[aid] for aid in ids])
        print(f"  backup written to {EXPORT_DIR}/")

    print(f"DONE. {len(articles)} blog pages at /blog/<slug>/, listing + sitemap updated.")
    print("Next: run ./build.sh (injects tracking + syncs asset versions), then deploy.")

if __name__ == "__main__":
    main()
