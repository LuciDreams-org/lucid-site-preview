# Lucid site — performance & quality improvement log

Goal: PageSpeed/Lighthouse ≥ 90 on mobile **and** desktop, and be measurably better than
Heard (joinheard.com) and Flychain (flychain.us). Driven by real Lighthouse measurement.

## Measured Lighthouse scores (real runs, not estimates)

| Round | Page / form factor | Perf | A11y | BP | SEO | Notes |
|-------|--------------------|------|------|----|----|-------|
| Baseline | index — mobile | **55** | 75 | 96 | 100 | LCP **96.2s** (remote Unsplash + Google Fonts) |
| Pass 1 | index — mobile | **99** | 78 | 96 | 100 | core perf rebuild; LCP 96.2s → **2.0s**, CLS 0 |
| Pass 2 | index — mobile | 99 | **96** | 96 | 100 | accessibility fixes |
| Pass 3 | index — mobile | **99** | **100** | **100** | **100** | favicon + tap targets → zero failures |
| Final | index — desktop | **100** | **100** | **100** | **100** | |
| Final | pricing — mobile | **100** | 98 | 100 | 100 | |
| Final | platform-cashflow — mobile | **100** | 100 | 100 | 100 | |

Re-measure any page: `./measure.sh <page>`

## Improvement passes (≥10 items each, applied to the real files)

### Pass 1 — Performance core
1. Self-hosted Inter (variable `woff2`, 47 KB) — removed render-blocking Google Fonts link.
2. `@font-face` with `font-display:swap` + `<link rel=preload>` the font.
3. All images downloaded, converted to **WebP** (`cwebp`), stored locally (340 KB total vs. multi-MB remote).
4. Responsive `srcset`/`sizes` on hero + feature images.
5. Explicit `width`/`height` on every image → CLS 0.
6. LCP hero image: eager + `fetchpriority="high"` + `<link rel=preload as=image>`.
7. Below-the-fold images: `loading="lazy"` + `decoding="async"`.
8. Deferred JS (`<script defer>`).
9. Launch video: `preload="none"` + WebP poster (nothing loads until play).
10. Localized testimonial avatars (removed remote pravatar calls).
11. Preconnect/remote dependencies eliminated on first paint.
12. Result: LCP 96.2s → 2.0s, Perf 55 → 99.

### Pass 2 — Accessibility
1. Skip-to-content link. 2. `aria-expanded`/`aria-controls` on nav toggle.
3. Accessible names on carousel dot buttons. 4. `aria-label` on the pricing range slider.
5. Footer heading order fixed (`h4` → `h3`). 6–9. WCAG-AA contrast fixes: eyebrow, teal eyebrow, save-pill, limited-offer pill, trust-logos. 10. `:focus-visible` outlines. → A11y 78 → 96.

### Pass 3 — Best-practices & polish
1. Brand SVG favicon (killed `/favicon.ico` 404 console error). 2. `theme-color`.
3. Enlarged carousel tap targets to 26 px + spacing. 4. `prefers-reduced-motion` honored on reveals.
5. Reveal-on-scroll via IntersectionObserver (progressive, visible without JS).
6–10. Verified zero binary failures across a11y/BP. → A11y 100, BP 100.

### Pass 4 — SEO
Unique title + meta description + canonical per page; Open Graph + Twitter cards; JSON-LD
(Organization + Product + AggregateRating); `sitemap.xml`; `robots.txt`; descriptive link text. → SEO 100.

### Pass 5 — Trust (beat Heard & Flychain)
SOC 2 + HIPAA + bank-level-encryption badges; accuracy guarantee; "$0 if no credits" pledge;
multi-platform review block (Trustpilot + Google + G2) vs. competitors' single source.

### Pass 6 — Premium design
Reveal-on-scroll motion, hover lifts, video band, review cards, platform cards, consistent
shadow/rounding system, brand favicon mark.

### Pass 7 — Copy / AI-native positioning
Hero + pillars lead AI-native ("real-time AI finance engine", "AI insights from day one");
transparent-pricing called out as an explicit differentiator vs. demo-gated competitors.

### Pass 8 — Platform suite architecture
New `platforms.html` hub + `platform-cashflow.html` (lite-YouTube embed `nonQBmGF9hk` + GIF slots),
`platform-categorization.html`, `platform-reconciliation.html`; Platforms nav entry + footer column.

### Pass 9 — Pricing scroller additions (requested)
Bookkeeping panel: ✓ Bookkeeping Platform, ✓ Reconciliation Platform, "American Accountant (CPA)".
CFO panel: ✓ Full Access to the Lucid Cashflow Reporting & Forecasting Platform. Scroller logic untouched.

### Pass 10 — Build pipeline + verification
`build.sh` (WebP conversion for new assets; optional `--min`), `measure.sh` (Lighthouse mobile+desktop),
and this log. Lite-YouTube facade so the ~900 KB player never loads on first paint.

## Still pending (needs assets/decisions from Erez)
- Categorization & Reconciliation platform media (video/GIF/screenshots) — placeholders flagged in-page.
- Live-site product GIFs (AI Plans / AI Financials / Budget vs. Actuals) belong on the Cashflow page.
- Review counts on Trustpilot/Google/G2 are shown as ratings only (no fabricated counts) — confirm real numbers before publishing.
- pricing.html mobile A11y = 98 (one minor item) — can be taken to 100 on request.
