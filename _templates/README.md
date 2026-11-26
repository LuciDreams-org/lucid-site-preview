# Keyword page template

`keyword-page.html` is a copy of a finished Lucid specialty page with every
editable spot marked `[[like this]]`. It is not published (folders that start
with an underscore are skipped by GitHub Pages), so copy it to a new file.

## Make a new keyword page
1. Pick a section folder (create a new one any time) and copy the template to
   `<section>/<slug>/index.html`. URL layout is `/<section>/<slug>/`: one level deep,
   lowercase, hyphenated, trailing slash, canonical with the trailing slash.
   Starter sections already exist: `compare/`, `guides/`, `resources/` (plus `blog/` and `specialty/`).
2. Replace every `[[...]]` placeholder. Search the file for `[[` before you commit.
3. Keep the hero buttons, nav, footer and the `TRACKING` marker blocks as they are.
4. Visible FAQ text and the FAQPage JSON-LD must match word for word.
   Check the JSON-LD parses (paste it into any JSON validator).
5. Add a row for the page to `sitemap.xml`.
6. Run `./build.sh --content-only` (never plain `./build.sh`, it rewrites every page),
   then `python3 inject_tracking.py` if the page is new.
7. Commit on a branch, open a PR, merge it yourself. Merging publishes in 1 to 2 minutes.

## Where things go
- Open to you: every folder (`blog/`, `specialty/`, `compare/`, `guides/`, `resources/`, `media/`,
  `_templates/` and any new section you create), plus `blog.html` and `sitemap.xml`.
- Locked: single top-level pages (new files at the site root such as `/something.html`).
  Ask Tomer or Erez for those.
- The three starter section hubs are `noindex` and not in the sitemap. Remove the noindex
  meta tag and add the URL to `sitemap.xml` when a hub has real content.
- Images: put them in `media/` and reference them as `/media/<file>`.
- Locked (needs Tomer or Erez to approve): home, pricing, nav/footer, `assets/`,
  `partials/`, `styles.css`, `script.js`, build and tracking scripts.
- Add page-specific CSS in a small `<style>` block inside the page, not in `styles.css`.

## Content rules
Say "Lucid". No em or en dashes. No client names, invented statistics or
testimonials. Lucid does bookkeeping, taxes, CFO services, cash flow reporting and
tax credits. It does not do clinical billing or claims submission.
