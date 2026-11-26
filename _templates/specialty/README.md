# Specialty page template (mobile first)

Reuse for every specialty. One JSON file of content per specialty, one script renders the page.
Reference: `orthopedics.json` -> `specialty/orthopedics.html`.

## Steps
1. Copy `orthopedics.json` to `<slug>.json`, fill every field (see limits below).
2. From the repo root run: `python3 -I _templates/specialty/build_specialty.py _templates/specialty/<slug>.json`
   - Existing page (11 specialties): edits `specialty/<slug>.html` in place. Nav, footer, tracking are kept from that file.
   - New specialty: `... <slug>.json --new --shell specialty/orthopedics.html` writes `specialty/<slug>/index.html` with a trailing slash canonical.
3. Check ASCII only, one H1, JSON-LD parses, banned words (BARON-RULES.md), then screenshot at 375 px and desktop.
4. Add the page to sitemap.xml. Add `<!-- GATE:testimonial -->` pages to BUILD-TODO.md.

## What the template contains (same look as the live specialty pages)
hero (h1 + one sentence + 2 buttons) -> what Lucid handles (6 short cards) -> 3 money problems (cards with "How Lucid handles it") -> why Lucid (4 fixed cards) -> price (fixed approved sentence) -> testimonial (omit if none) -> FAQ (5, closed) -> related links (collapsed) -> closing call to action.
The hero, handle, why and CTA sections reuse the existing classes in styles.css. Added sections use `specialty.css` (inlined into each page head).

## Mobile limits (95% of traffic is mobile)
- Hero sentence under 25 words. No emoji in the H1.
- Handle cards: 6 max, one line of 12 words or fewer each.
- Pain card: problem 1 to 2 sentences (under 30 words), how 1 to 2 sentences (under 35 words).
- FAQ: exactly 5, answers 2 to 4 sentences, closed by default. Related links stay collapsed.
- No tables in the page, no sticky bars, no new JS or images.
