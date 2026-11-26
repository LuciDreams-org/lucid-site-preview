#!/usr/bin/env python3
"""Generic builder: question articles (Markdown + front matter) -> guides/<slug>/index.html.

Usage: python3 -I _templates/guides/build_question.py [files...]
Default: every question-*.md in CONTENT_DIR. Stdlib only.

The page shell (head tracking, nav, hero, CTA band, footer, scripts) is taken from an
existing built guide (SHELL_PAGE), so nav/footer/tracking stay current on every rebuild.
Related-guides block always lists all question-*.md articles found in CONTENT_DIR.
"""
import glob
import html
import json
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONTENT_DIR = os.environ.get(
    "QUESTION_CONTENT_DIR",
    "/home/shared/company-agent/Projects/keyword-research/content-build")
SHELL_PAGE = os.path.join(REPO, "guides", "best-accounting-for-medical-practices", "index.html")
SITE = "https://www.lucid.now"
DATE = "2026-11-26"
WARNINGS = []

EXTRA_CSS = """.spec-prose{padding:30px 0;}
.spec-prose .prose{max-width:860px;margin:0 auto;padding:0 16px;overflow-wrap:anywhere;}
.spec-links summary{cursor:pointer;font-weight:700;color:var(--ink);padding:6px 0;}
.spec-links ul{list-style:none;padding:0;margin:12px 0 0;display:flex;flex-wrap:wrap;gap:8px;}
.spec-links li{margin:0;}
.spec-links li a{display:inline-block;background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 14px;font-size:.9rem;text-decoration:none;}
.guide table{max-width:none;}
@media (max-width:640px){.guide{padding:24px 0 4px;}.guide h2{font-size:1.3rem;margin:26px 0 10px;}.spec-faq .faq details{padding:14px 0;}.spec-faq .faq summary{font-size:1rem;}.spec-prose{padding:20px 0;}}
"""


# ---------------------------------------------------------------- front matter
def parse_front(text):
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    if not m:
        raise ValueError("no front matter")
    fm, key = {}, None
    for line in m.group(1).split("\n"):
        if re.match(r"^\s+- ", line) and key:
            fm.setdefault(key, []).append(line.strip()[2:].strip().strip('"'))
            continue
        mm = re.match(r"^([A-Za-z_]+):\s*(.*)$", line)
        if mm:
            key, val = mm.group(1), mm.group(2).strip()
            if val == "":
                fm[key] = []
            else:
                fm[key] = val.strip('"') if val[0] == '"' else val
    return fm, text[m.end():]


# ---------------------------------------------------------------- inline
URL_RE = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)|(https?://[^\s<>\")]+)")


def rewrite_href(u):
    u = u.strip()
    if u.startswith(SITE):
        u = u[len(SITE):] or "/"
    if u.startswith("/guides/") and "#" not in u and "?" not in u and not u.endswith("/") \
            and not re.search(r"\.[a-z]+$", u):
        u += "/"
    return u


def emph(escaped):
    escaped = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", escaped)
    escaped = re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)
    return escaped


def esc(s):
    return html.escape(s, quote=True)


def link_html(label_html, href):
    href = rewrite_href(href)
    rel = "" if href.startswith("/") or href.startswith("#") else ' rel="noopener"'
    return '<a href="%s"%s>%s</a>' % (esc(href), rel, label_html)


def inline(text):
    out, pos = [], 0
    for m in URL_RE.finditer(text):
        out.append(emph(esc(text[pos:m.start()])))
        if m.group(3):
            url = m.group(3)
            trail = ""
            while url and url[-1] in ".,;:!?":
                trail = url[-1] + trail
                url = url[:-1]
            out.append(link_html(esc(url), url) + esc(trail))
        else:
            out.append(link_html(emph(esc(m.group(1))), m.group(2)))
        pos = m.end()
    out.append(emph(esc(text[pos:])))
    return "".join(out)


def plain(text):
    """Markdown inline -> plain text (links keep their label, bare URLs stay as is)."""
    t = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r"\1", text)
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"\1", t)
    t = re.sub(r"`([^`]+)`", r"\1", t)
    t = re.sub(r"https://www\.lucid\.now(/[^\s]*)?", lambda m: "https://www.lucid.now" + (m.group(1) or "/"), t)
    return re.sub(r"\s+", " ", t).strip()


def slugify(t):
    s = re.sub(r"[^a-z0-9]+", "-", plain(t).lower()).strip("-")
    return s or "section"


# ---------------------------------------------------------------- body cleanup
def clean_body(body):
    body = re.split(r"^##\s+Needs verification before publishing\s*$", body, flags=re.M)[0]
    lines = [l for l in body.split("\n") if not re.match(r"^\s*Builder note\b", l)]
    return "\n".join(lines)


# ---------------------------------------------------------------- blocks
def split_row(line):
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [c.strip() for c in re.split(r"(?<!\\)\|", line)]


LIST_RE = re.compile(r"^(\s*)([-*]|\d+[.)])\s+(.*)$")


def render_list(items):
    """items: list of (indent, ordered, text). One level of nesting supported."""
    out, i = [], 0
    base = items[0][0]
    ordered = items[0][1]
    tag = "ol" if ordered else "ul"
    out.append("<%s>" % tag)
    while i < len(items):
        ind, o, txt = items[i]
        j = i + 1
        sub = []
        while j < len(items) and items[j][0] > base:
            sub.append(items[j])
            j += 1
        out.append("<li>" + inline(txt) + (render_list(sub) if sub else "") + "</li>")
        i = j
    out.append("</%s>" % tag)
    return "".join(out)


def parse_blocks(md):
    """Return list of block tuples: ('h',level,text) ('p',text) ('list',items) ('table',rows) ('hr',)"""
    lines = md.split("\n")
    blocks, i = [], 0
    while i < len(lines):
        ln = lines[i]
        if not ln.strip():
            i += 1
            continue
        m = re.match(r"^(#{1,4})\s+(.*?)\s*#*\s*$", ln)
        if m:
            blocks.append(("h", len(m.group(1)), m.group(2)))
            i += 1
            continue
        if re.match(r"^\s*(-{3,}|\*{3,}|_{3,})\s*$", ln):
            i += 1
            continue
        if ln.lstrip().startswith("|") and i + 1 < len(lines) and re.match(r"^\s*\|?[\s:|-]+\|[\s:|-]*$", lines[i + 1]):
            rows = [split_row(ln)]
            i += 2
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                rows.append(split_row(lines[i]))
                i += 1
            blocks.append(("table", rows))
            continue
        if LIST_RE.match(ln):
            items = []
            while i < len(lines):
                l2 = lines[i]
                lm = LIST_RE.match(l2)
                if lm:
                    items.append([len(lm.group(1).replace("\t", "    ")), bool(re.match(r"\d", lm.group(2))), lm.group(3)])
                    i += 1
                elif l2.strip() and l2.startswith("  ") and items:
                    items[-1][2] += " " + l2.strip()
                    i += 1
                elif not l2.strip() and i + 1 < len(lines) and LIST_RE.match(lines[i + 1]):
                    i += 1
                else:
                    break
            blocks.append(("list", [tuple(x) for x in items]))
            continue
        if ln.startswith(">"):
            WARNINGS.append("blockquote rendered as paragraph: " + ln[:50])
        para = [ln.strip().lstrip(">").strip()]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r"^(#{1,4}\s|\s*\|)", lines[i]) \
                and not LIST_RE.match(lines[i]):
            para.append(lines[i].strip())
            i += 1
        blocks.append(("p", " ".join(para)))
    return blocks


def render_table(rows, label):
    head, body = rows[0], rows[1:]
    n = len(head)
    style = ' style="min-width:0"' if n <= 2 else (' style="min-width:480px"' if n == 3 else "")
    h = "<thead><tr>" + "".join('<th scope="col">%s</th>' % inline(c) for c in head) + "</tr></thead>"
    b = "<tbody>" + "".join(
        "<tr>" + "".join("<td>%s</td>" % inline(c) for c in (r + [""] * n)[:n]) + "</tr>" for r in body) + "</tbody>"
    return '<div class="table-scroll" role="region" tabindex="0" aria-label="%s"><table%s>%s%s</table></div>' % (
        esc(label), style, h, b)


def render_blocks(blocks, used_ids):
    out, last_h = [], "Table"
    for b in blocks:
        if b[0] == "h":
            lvl, txt = b[1], b[2]
            if lvl == 1:
                continue
            lvl = min(max(lvl, 2), 3)
            sid, k = slugify(txt), 2
            base = sid
            while sid in used_ids:
                sid = "%s-%d" % (base, k)
                k += 1
            used_ids.add(sid)
            last_h = plain(txt)
            out.append('<h%d id="%s">%s</h%d>' % (lvl, sid, inline(txt), lvl))
        elif b[0] == "p":
            out.append("<p>%s</p>" % inline(b[1]))
        elif b[0] == "list":
            out.append(render_list(list(b[1])))
        elif b[0] == "table":
            out.append(render_table(b[1], last_h))
    return "\n".join(out)


# ---------------------------------------------------------------- faq
def parse_faq(blocks):
    """FAQ blocks: a paragraph that is entirely **bold** is a question; following blocks are the answer."""
    faqs, cur = [], None
    for b in blocks:
        if b[0] == "p" and re.fullmatch(r"\*\*(.+?)\*\*", b[1].strip()):
            cur = {"q": re.fullmatch(r"\*\*(.+?)\*\*", b[1].strip()).group(1).strip(), "a": []}
            faqs.append(cur)
        elif b[0] == "p" and re.match(r"^\*\*([^*]+\?)\*\*\s+\S", b[1]):
            m = re.match(r"^\*\*([^*]+\?)\*\*\s+(.*)$", b[1])
            cur = {"q": m.group(1).strip(), "a": [("p", m.group(2))]}
            faqs.append(cur)
        elif b[0] == "h" and b[1] >= 3:
            cur = {"q": plain(b[2]), "a": []}
            faqs.append(cur)
        elif cur is not None:
            cur["a"].append(b)
        else:
            WARNINGS.append("FAQ text before first question ignored")
    return faqs


def block_plain(b):
    if b[0] == "p":
        return plain(b[1])
    if b[0] == "list":
        return " ".join(plain(x[2]) for x in b[1])
    if b[0] == "table":
        return " ".join(plain(" ".join(r)) for r in b[1])
    return ""


def render_faq(faqs):
    parts = []
    for f in faqs:
        ans = []
        for b in f["a"]:
            if b[0] == "p":
                ans.append("<p>%s</p>" % inline(b[1]))
            elif b[0] == "list":
                ans.append(render_list(list(b[1])))
            elif b[0] == "table":
                ans.append(render_table(b[1], f["q"]))
        parts.append("<details><summary>%s</summary>%s</details>" % (inline(f["q"]), "".join(ans)))
    return "".join(parts)


# ---------------------------------------------------------------- shell
def load_shell():
    s = open(SHELL_PAGE, encoding="utf-8").read()
    sh = {}
    sh["head_pre"] = s[:s.index("<title>")]
    chunk = s[s.index('<link rel="icon"'):s.index('<script type="application/ld+json">')]
    keep = [l for l in chunk.split("\n") if re.match(
        r'<(link rel="(icon|preload|stylesheet)"|meta name="theme-color"|meta property="og:image"|meta name="twitter:card")', l)]
    sh["head_keep"] = keep
    sh["style"] = re.search(r"<style>\n(.*?)</style>", s, re.S).group(1)
    sh["body_pre"] = s[s.index("<body>"):s.index("<main>")]
    hero = s[s.index("<main>"):s.index('<section class="guide">')]
    sh["hero"] = hero
    sh["tail"] = s[s.index('<section class="spec-cta">'):]
    return sh


def build_one(path, sh, all_meta):
    text = open(path, encoding="utf-8").read()
    fm, body = parse_front(text)
    slug = fm["slug"].strip("/").split("/")[-1]
    title, desc = fm["title"], fm["meta_description"]
    url = "%s/guides/%s/" % (SITE, slug)
    body = clean_body(body)
    blocks = parse_blocks(body)

    # H1 + Updated line
    h1 = next((b[2] for b in blocks if b[0] == "h" and b[1] == 1), title)
    updated = fm.get("updated_line", "Updated November 26, 2026")
    blocks = [b for b in blocks if not (b[0] == "p" and re.match(r"^Updated [A-Z][a-z]+ \d{1,2}, \d{4}$", b[1].strip()))]

    # split around FAQ section
    fi = next((k for k, b in enumerate(blocks) if b[0] == "h" and b[1] == 2 and plain(b[2]).lower().startswith("faq")), None)
    if fi is None:
        pre, faq_blocks, post = blocks, [], []
    else:
        nj = next((k for k in range(fi + 1, len(blocks)) if blocks[k][0] == "h" and blocks[k][1] <= 2), len(blocks))
        pre, faq_blocks, post = blocks[:fi], blocks[fi + 1:nj], blocks[nj:]
    faqs = parse_faq(faq_blocks)
    used = set()
    pre_html = render_blocks(pre, used)
    post_html = render_blocks(post, used)

    # JSON-LD
    article = {"@context": "https://schema.org", "@type": "Article", "headline": title, "description": desc,
               "datePublished": DATE, "dateModified": DATE, "mainEntityOfPage": url,
               "publisher": {"@type": "Organization", "name": "Lucid", "url": SITE + "/"}}
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": "Guides", "item": SITE + "/guides/"},
        {"@type": "ListItem", "position": 3, "name": title, "item": url}]}
    faqld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": plain(f["q"]), "acceptedAnswer": {
            "@type": "Answer", "text": " ".join(t for t in (block_plain(b) for b in f["a"]) if t)}} for f in faqs]}

    def ld(o):
        return '<script type="application/ld+json">\n%s\n</script>' % json.dumps(o, ensure_ascii=True, separators=(",", ":"))

    head = [sh["head_pre"] + "<title>%s</title>" % esc(title),
            '<meta name="description" content="%s" />' % esc(desc),
            '<link rel="canonical" href="%s" />' % url]
    for l in sh["head_keep"]:
        head.append(l)
        if 'rel="icon"' in l:
            pass
    head.insert(len(head) - len(sh["head_keep"]) + 0, "")  # placeholder, removed below
    head.remove("")
    social = [
        '<meta property="og:type" content="article" />',
        '<meta property="og:title" content="%s" />' % esc(title),
        '<meta property="og:description" content="%s" />' % esc(desc),
        '<meta property="og:url" content="%s" />' % url,
        '<meta name="twitter:title" content="%s" />' % esc(title),
        '<meta name="twitter:description" content="%s" />' % esc(desc)]
    head += social
    head += [ld(article), ld(crumbs), "<style>\n" + sh["style"] + EXTRA_CSS + "</style>"]
    if faqs:
        head.append(ld(faqld))
    head.append("</head>")

    hero = sh["hero"]
    hero = re.sub(r"<h1>.*?</h1>", lambda m: "<h1>%s</h1>" % esc(h1), hero, count=1, flags=re.S)
    hero = re.sub(r'<p class="updated">.*?</p>', lambda m: '<p class="updated">%s</p>' % esc(updated), hero, count=1, flags=re.S)

    parts = [("\n".join(head)), sh["body_pre"] + hero.replace("<main>", "<main>", 1)]
    guide1 = ('<section class="guide"><div class="gwrap">\n'
              '<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/guides/">Guides</a> / %s</nav>\n%s\n</div></section>' % (esc(h1), pre_html))
    faq_sec = ""
    if faqs:
        faq_sec = ('<section class="spec-faq" id="faq"><div class="wrap"><div class="sec-head center"><span class="eyebrow teal">Questions, answered</span>'
                   '<h2>Frequently asked questions</h2></div>\n<div class="faq">%s</div></div></section>' % render_faq(faqs))
    guide2 = ""
    if post_html.strip():
        guide2 = '<section class="guide"><div class="gwrap">\n%s\n</div></section>' % post_html
    sibs = [m for m in all_meta if m["slug"] != slug]
    rel = ('<section class="spec-prose"><div class="wrap"><div class="prose spec-links">\n<details><summary>Related guides</summary>'
           '<ul>%s</ul></details>\n</div></div></section>' % "".join(
               '<li><a href="/guides/%s/">%s</a></li>' % (m["slug"], esc(m["title"])) for m in sibs))
    html_out = "\n".join([parts[0], parts[1] + guide1, faq_sec, guide2, rel, sh["tail"]])
    html_out = re.sub(r"\n{3,}", "\n\n", html_out)
    outdir = os.path.join(REPO, "guides", slug)
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(outdir, "index.html"), "w", encoding="utf-8") as fh:
        fh.write(html_out)
    nonascii = sorted({c for c in body if ord(c) > 127})
    if nonascii:
        WARNINGS.append("%s: non-ASCII in source: %s" % (slug, " ".join("U+%04X" % ord(c) for c in nonascii)))
    return slug, len(faqs)


def main():
    files = [a for a in sys.argv[1:]] or sorted(glob.glob(os.path.join(CONTENT_DIR, "question-*.md")))
    all_meta = []
    for p in sorted(glob.glob(os.path.join(CONTENT_DIR, "question-*.md"))):
        fm, _ = parse_front(open(p, encoding="utf-8").read())
        all_meta.append({"slug": fm["slug"].strip("/").split("/")[-1], "title": fm["title"]})
    sh = load_shell()
    for p in files:
        try:
            slug, nf = build_one(p, sh, all_meta)
            print("built guides/%s/index.html (%d faq)" % (slug, nf))
        except Exception as e:  # keep going, report
            print("FAILED %s: %s" % (p, e))
    for w in WARNINGS:
        print("WARN", w)


if __name__ == "__main__":
    main()
