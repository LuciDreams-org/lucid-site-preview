# Keyword page template

`keyword-page.html` is a copy of a finished Lucid specialty page with every
editable spot marked `[[like this]]`. It is not published (folders that start
with an underscore are skipped by GitHub Pages), so copy it to a new file.

## Make a new keyword page
1. Copy `_templates/keyword-page.html` to its new home, for example
   `specialty/<slug>.html` or `<new-folder>/<slug>.html`.
2. Replace every `[[...]]` placeholder. Search the file for `[[` before you commit.
3. Keep the hero buttons, nav, footer and the `TRACKING` marker blocks as they are.
4. Visible FAQ text and the FAQPage JSON-LD must match word for word.
   Check the JSON-LD parses (paste it into any JSON validator).
5. Add a row for the page to `sitemap.xml`.
6. Run `./build.sh --content-only` (never plain `./build.sh`, it rewrites every page),
   then `python3 inject_tracking.py` if the page is new.
7. Commit on a branch, open a PR, merge it yourself. Merging publishes in 1 to 2 minutes.

## Where things go
- Open to you: `blog/`, `blog.html`, `sitemap.xml`, `specialty/`, `media/`, any new
  folder, new files at the site root, `_templates/`.
- Images: put them in `media/` and reference them as `/media/<file>`.
- Locked (needs Tomer or Erez to approve): home, pricing, nav/footer, `assets/`,
  `partials/`, `styles.css`, `script.js`, build and tracking scripts.
- Add page-specific CSS in a small `<style>` block inside the page, not in `styles.css`.

## Content rules
Say "Lucid". No em or en dashes. No client names, invented statistics or
testimonials. Lucid does bookkeeping, taxes, CFO services, cash flow reporting and
tax credits. It does not do clinical billing or claims submission.
