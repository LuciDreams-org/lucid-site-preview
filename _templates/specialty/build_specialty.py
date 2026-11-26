#!/usr/bin/env python3
"""Render a specialty page from a content JSON file.

Usage (from repo root):  python3 _templates/specialty/build_specialty.py _templates/specialty/orthopedics.json
Shell (head tracking, nav, footer) is taken from the existing specialty/<slug>.html, so it is always current.
For a NEW specialty (folder page) pass --new and a shell file with --shell (copy of any specialty page).
Never edit nav, footer or tracking by hand. Run `python3 -I` ASCII checks afterwards (see README).
"""
import json, re, sys, html, pathlib

E = lambda s: html.escape(s, quote=False)
CSS = (pathlib.Path(__file__).with_name('specialty.css')).read_text()

def jl(o):
    return '<script type="application/ld+json">\n' + json.dumps(o, ensure_ascii=True, separators=(',', ':')) + '\n</script>'

def main_html(c):
    s = c['specialty']
    pains = ''.join(
        f'      <div class="scard"><h3>{E(p["title"])}</h3><p>{E(p["problem"])}</p>'
        f'<p class="how"><strong>How Lucid handles it:</strong> {E(p["how"])}</p></div>\n' for p in c['pains'])
    handle = ''.join(
        f'      <div class="scard"><div class="ck-lg" aria-hidden="true">&#10003;</div><p>{E(x)}</p></div>\n' for x in c['handle'])
    faq = ''.join(f'      <details><summary>{E(q["q"])}</summary><p>{E(q["a"])}</p></details>\n' for q in c['faq'])
    quote = ''
    if c.get('testimonial'):
        t = c['testimonial']
        quote = f'''<section class="spec-prose">
  <div class="wrap"><div class="prose">
<div class="sec-head center"><h2>What owners say</h2></div>
<figure class="spec-quote"><blockquote>{E(t["text"])}</blockquote><figcaption>{E(t["by"])}</figcaption></figure>
  </div></div>
</section>
'''
    else:
        quote = '<!-- GATE:testimonial -->\n'
    def links(items):
        return '<ul>' + ''.join(f'<li><a href="{u}">{E(n)}</a></li>' for n, u in items) + '</ul>'
    rel = ''
    if c.get('related_specialties'):
        rel += '<h3>Other specialties</h3>' + links(c['related_specialties'])
    if c.get('related_guides'):
        rel += '<h3>Guides</h3>' + links(c['related_guides'])
    return f'''<main>
<section class="spec-hero">
  <div class="wrap">
    <a class="spec-eyebrow" href="/#industries">Specialties</a>
    <h1>{E(c["h1_plain"])}<span class="grad"> {E(c["h1_grad"])}</span></h1>
    <p class="spec-sub">{E(c["sub"])}</p>
    <div class="spec-hero-cta">
      <a href="/pricing" class="btn btn-primary">Get Started</a>
      <a href="/pricing" class="btn btn-ghost">See your price</a>
    </div>
    <p class="cta-note"><span class="ri">&#10003; Free 30-min consult</span> <span class="ri">&#10003; Month-to-month, cancel anytime</span></p>
  </div>
</section>

<section class="spec-handle">
  <div class="wrap">
    <div class="sec-head center"><span class="eyebrow">Built for your specialty</span><h2>What Lucid handles for <span class="grad">{E(s)}</span></h2></div>
    <div class="spec-cards">
{handle}    </div>
  </div>
</section>

<section class="spec-pains">
  <div class="wrap">
    <div class="sec-head center"><span class="eyebrow">The real problems</span><h2>Money problems we see in <span class="grad">{E(c["pains_audience"])}</span></h2></div>
    <div class="pain-grid">
{pains}    </div>
  </div>
</section>

<section class="spec-why">
  <div class="wrap">
    <div class="sec-head center"><h2>Why practices like yours <span class="grad">choose Lucid</span></h2></div>
    <div class="spec-value">
      <div class="scard"><div class="ic" aria-hidden="true">&#9889;</div><h3>Real-time bookkeeping</h3><p>Reconciled books, with separate books for each entity and a combined owner view.</p></div>
      <div class="scard"><div class="ic" aria-hidden="true">&#128104;&#8205;&#9877;&#65039;</div><h3>A dedicated CPA</h3><p>A dedicated CPA and account manager, with 24/7 support in a shared Slack channel.</p></div>
      <div class="scard"><div class="ic" aria-hidden="true">&#128737;&#65039;</div><h3>HIPAA and SOC 2 aligned</h3><p>HIPAA aligned handling, with a Business Associate Agreement available.</p></div>
      <div class="scard"><div class="ic" aria-hidden="true">&#128184;</div><h3>Credits only if found</h3><p>Tax credit work with the paperwork handled. If no credits can be claimed, you pay $0.</p></div>
    </div>
  </div>
</section>

<section class="spec-prose spec-price">
  <div class="wrap"><div class="prose">
<div class="sec-head center"><h2>What {E(c["price_audience"])} costs with <span class="grad">Lucid</span></h2></div>
<div class="price-box">
<p>Lucid starts from $130 a month. Use the pricing page calculator to see your price. Terms are month to month and there is no setup fee.</p>
<p><a href="/pricing">See Lucid pricing</a> and use the calculator to estimate your cost.</p>
</div>
  </div></div>
</section>
{quote}
<section class="spec-faq" id="faq">
  <div class="wrap">
    <div class="sec-head center"><span class="eyebrow teal">Questions, answered</span><h2>{E(c["faq_title"])}</h2></div>
    <div class="faq">
{faq}    </div>
  </div>
</section>

<section class="spec-prose">
  <div class="wrap"><div class="prose spec-links">
<details><summary>Related pages and guides</summary>
{rel}
</details>
  </div></div>
</section>

<section class="spec-cta">
  <div class="wrap">
    <h2>Talk to <span class="grad">Lucid</span></h2>
    <p>{E(c["cta"])}</p>
    <div class="spec-hero-cta">
      <a href="/pricing" class="btn btn-primary">Get Started</a>
      <a href="/pricing" class="btn btn-ghost">Talk to an Expert</a>
    </div>
  </div>
</section>
'''

def build(cpath, shell=None, new=False):
    c = json.load(open(cpath))
    slug = c['slug']
    url = f'https://www.lucid.now/specialty/{slug}' + ('/' if new else '')
    out = pathlib.Path(f'specialty/{slug}/index.html' if new else f'specialty/{slug}.html')
    src = pathlib.Path(shell) if shell else out
    h = src.read_text()
    T, M, D = c['title'], c['meta'], c['date']
    sub = lambda pat, rep: re.subn(pat, lambda m: rep, h, count=1, flags=re.S)
    h = re.sub(r'<title>.*?</title>', lambda m: f'<title>{E(T)}</title>', h, count=1, flags=re.S)
    h = re.sub(r'<meta name="description"[^>]*>', lambda m: f'<meta name="description" content="{E(M)}" />', h, count=1)
    h = re.sub(r'<link rel="canonical"[^>]*>', lambda m: f'<link rel="canonical" href="{url}" />', h, count=1)
    h = re.sub(r'<meta property="og:title"[^>]*>', lambda m: f'<meta property="og:title" content="{E(T)}" />', h, count=1)
    h = re.sub(r'<meta property="og:description"[^>]*>', lambda m: f'<meta property="og:description" content="{E(M)}" />', h, count=1)
    h = re.sub(r'<meta property="og:url"[^>]*>', lambda m: f'<meta property="og:url" content="{url}" />', h, count=1)
    # drop old non-tracking JSON-LD and the old scoped style, add new
    h = re.sub(r'<script type="application/ld\+json">.*?</script>\s*', '', h, flags=re.S)
    h = re.sub(r'<style>(?:(?!</style>).)*\.spec-pains(?:(?!</style>).)*</style>\s*', '', h, flags=re.S)
    org = {"@type": "Organization", "name": "Lucid", "url": "https://www.lucid.now/"}
    schema = [
        {"@context": "https://schema.org", "@type": "Service", "name": c['h1'], "serviceType": c['service_type'], "provider": org, "areaServed": "US", "url": url, "description": M},
        {"@context": "https://schema.org", "@type": "ProfessionalService", "name": "Lucid", "url": url, "serviceType": c['service_type'], "areaServed": "US", "parentOrganization": org},
        {"@context": "https://schema.org", "@type": "WebPage", "name": T, "url": url, "description": M, "dateModified": D},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.lucid.now/"},
            {"@type": "ListItem", "position": 2, "name": "Medical practices", "item": "https://www.lucid.now/medical"},
            {"@type": "ListItem", "position": 3, "name": c['specialty'], "item": url}]},
        {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q['q'], "acceptedAnswer": {"@type": "Answer", "text": q['a']}} for q in c['faq']]},
    ]
    head_add = '\n'.join(jl(s) for s in schema) + '\n<style>\n' + CSS + '</style>\n'
    h = h.replace('</head>', head_add + '</head>', 1)
    i, j = h.index('<main>'), h.index('</main>')
    h = h[:i] + main_html(c).rstrip('\n') + '\n' + h[j:]
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(h)
    print('wrote', out)

if __name__ == '__main__':
    a = sys.argv[1:]
    new = '--new' in a
    shell = a[a.index('--shell') + 1] if '--shell' in a else None
    build(a[0], shell, new)
