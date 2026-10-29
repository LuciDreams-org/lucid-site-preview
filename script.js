/* ============================================================
   Lucid - interactions: pricing calculator, testimonials, nav
   ============================================================ */

/* ---------- Progressive-enhancement flag ---------- */
document.documentElement.classList.add('js');

/* ---------- Mobile nav ---------- */
(function () {
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      toggle.textContent = open ? '✕' : '☰';
    });
  }
})();

/* ---------- Reveal on scroll (respects reduced-motion) ---------- */
(function () {
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- Testimonial carousel (centered feature) ---------- */
(function () {
  var dots = document.getElementById('testiDots');
  if (!dots) return;
  var data = [
    { q: "Sigma Orthopedics is Dr. McCormick's orthopedic practice within a broader portfolio of <b>nine healthcare businesses</b>. With elite training from <b>Harvard University and the University of Pennsylvania</b>, service as a <b>U.S. Navy flight surgeon</b>, and experience treating teams like the <b>Chicago Bulls and New England Patriots</b>.", name: "Dr. Frank McCormick, M.D.", role: "Founder, Sigma", img: "assets/img/avatar-12.webp?v=4" },
    { q: "Runs Nanoom Medical Group, a <b>multi-entity medical organization</b> spanning primary care, cosmetic surgery, and an IPA across <b>California and Maryland</b> - consolidated with Lucid.", name: "Edwin Choi", role: "Nanoom Medical Group", img: "assets/img/nanoom.svg" },
    { q: "The owner of Ascend Behavioral Health Network, a <b>nationwide network of behavioral health facilities</b> focused on delivering accessible, affordable, and high-quality mental health and substance use care across <b>multiple locations</b>. She is also the owner of <b>Archangel Centers</b>, where she leads primary mental health and substance use treatment for adolescents and adults.", name: "Samantha Hewett", role: "Ascend Behavioral Health", img: "assets/img/avatar-45.webp?v=4" },
    { q: "Founder of Modern Thyroid Clinic in Austin, a <b>nationally recognized thyroid specialist, TEDx speaker, and author</b> scaling patient-first endocrine care.", name: "McCall McPherson, PA‑C", role: "Founder, Modern Thyroid Clinic", img: "assets/img/mccall.webp?v=4" },
    { q: "Founder of Skin MD, a <b>fast-growing dermatology and medical-aesthetics practice</b> - with Lucid keeping the finances clean as she scales.", name: "Dr. Tracie Swayden", role: "Founder, Skin MD", img: "assets/img/tracie.webp?v=4" },
    { q: "Terraway is an innovative health and food tech startup led by Erin Fitzgerald. It received a <b>White House Champion of Change Award</b> and was named to <b>Crain's Chicago 40 Under 40</b>. <b>\"Wow, you guys are lightning fast. Sometime you will have to show me behind the scenes what you do and how you do it! CFOs for life for me.\"</b>", name: "Erin Fitzgerald", role: "Business Owner, Terraway", img: "assets/img/fitzgerald.webp?v=4" },
    { q: "Lumino is a next-gen fintech platform that transforms how businesses get paid, build wealth, and give back. Managing <b>over $200M in payments</b>. <b>\"Just want to say props to the whole Lucid team. We pulled up the Lucid platform in a meeting with a VC and they were extremely impressed. His jaw just about dropped when he saw October was even up to date. Thank you!\"</b>", name: "Giorgio Riccio", role: "Founder, Lumino Technologies", img: "assets/img/giorgio.jpg?v=1" },
    { q: "Founder of Restorative Resilience Counseling, a <b>trauma-focused private counseling practice</b> built on steady, people-first care.", name: "Victoria Hudson", role: "Founder, Restorative Resilience Counseling", img: "assets/img/victoria.webp?v=4" },
    { q: "Founder of AmarilloMD, a <b>direct-care medical practice</b>, and a <b>published physician</b> focused on accessible, transparent care.", name: "Dr. Deb Moore, M.D.", role: "Founder, AmarilloMD", img: "assets/img/amarillo.webp?v=4" },
    { q: "Founder of T1D Screening Queen, an <b>early type-1 diabetes screening practice</b> and advocacy effort expanding access across South Florida.", name: "Lauri Deane", role: "Founder, T1D Screening Queen", img: "assets/img/t1d.webp?v=4" },
    { q: "Founder of AR Health Solutions, an independent health practice getting <b>clean, real-time books from day one</b> with Lucid.", name: "Alex Alcantar", role: "Founder, AR Health Solutions", img: "assets/img/arhealth.svg" }
  ];
  var q = document.getElementById('tqQuote');
  var name = document.getElementById('tqName');
  var role = document.getElementById('tqRole');
  var img = document.getElementById('tqImg');
  var i = 0, timer;

  function render(n) {
    i = n;
    var d = data[n];
    q.innerHTML = "<span class=\"tq-text\">" + d.q + "</span>";
    name.textContent = d.name;
    role.textContent = d.role;
    img.src = d.img;
    Array.prototype.forEach.call(dots.children, function (b, idx) {
      b.classList.toggle('active', idx === n);
    });
  }
  function next() { render((i + 1) % data.length); }

  data.forEach(function (_, idx) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Show testimonial ' + (idx + 1));
    b.addEventListener('click', function () { render(idx); reset(); });
    dots.appendChild(b);
  });
  function reset() { clearInterval(timer); timer = setInterval(next, 6000); }
  data.forEach(function(d){var im=new Image();im.decoding="async";im.src=d.img;});
  render(0); reset();
})();

/* ---------- Pricing calculator ---------- */
(function () {
  var mount = document.getElementById('calcMount') || document.getElementById('calcMountFull');
  if (!mount) return;

  var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };

  // Animate a number from 0 up to target (used on the price + tax-credits figures)
  function countUp(el, target, prefix, suffix) {
    prefix = prefix || ''; suffix = suffix || '';
    var dur = 650, t0 = null, from = 0;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(from + (target - from) * e).toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Per-tab configuration. price() returns base monthly price.
  var TABS = [
    {
      id: 'bookkeeping', label: 'Bookkeeping',
      best: 'For practices that want accurate monthly books, closed and reviewed by a dedicated expert.',
      staff: ['Dedicated Accountant (CPA)', 'Dedicated Account Manager'],
      platforms: ['Bookkeeping Platform', 'Reconciliation Platform'],
      other: ['24/7 Slack Support', 'Monthly financial reporting package', 'Month-to-month - no annual lock-in'],
      sliderLabel: 'Monthly spending', min: 0, max: 200000, step: 1000, value: 20000,
      saveFactor: 8,
      price: function (v) { return v <= 20000 ? 150 : v <= 50000 ? 250 : v <= 100000 ? 350 : v <= 150000 ? 450 : 550; }
    },
    { id: 'taxes', label: 'Taxes', taxCards: true },
    {
      id: 'cfo', label: 'CFO Services',
      best: 'For practices seeking to analyze performance, forecast, and discover key insights.',
      staff: ['Dedicated CFO', 'Dedicated Account Manager'],
      platforms: ['Full Access to the Lucid Cashflow Reporting &amp; Forecasting Platform'],
      other: ['24/7 Slack Support', 'Custom financial model with strategic insights', 'Budget vs. actuals variance analysis', 'Scenario planning model', 'Industry-specific KPI dashboard'],
      sliderLabel: 'Your Monthly Expenses', min: 0, max: 200000, step: 1000, value: 20000,
      saveFactor: 8,
      price: function (v) { return v <= 20000 ? 150 : v <= 50000 ? 250 : v <= 100000 ? 350 : v <= 150000 ? 450 : 550; }
    },
    { id: 'credits', label: 'Tax Credits', credits: true }
  ];

  // Build DOM
  var calc = document.createElement('div');
  calc.className = 'calc';

  var tabsEl = document.createElement('div');
  tabsEl.className = 'calc-tabs';
  TABS.forEach(function (t, idx) {
    var b = document.createElement('button');
    b.className = 'calc-tab' + (idx === 0 ? ' active' : '');
    b.textContent = t.label;
    b.dataset.tab = t.id;
    tabsEl.appendChild(b);
  });

  var body = document.createElement('div');
  body.className = 'calc-body';

  TABS.forEach(function (t, idx) {
    var panel = document.createElement('div');
    panel.className = 'calc-panel' + (idx === 0 ? ' active' : '');
    panel.dataset.panel = t.id;

    if (t.credits) {
      panel.innerHTML =
        '<div class="credits">' +
          '<div class="found"><small>Total credits found for practices</small><span class="found-row"><span class="found-check" aria-hidden="true">✓</span><span data-found>$50,711</span></span></div>' +
          '<p class="pledge">We only get paid if you do.</p>' +
          '<p>Our experts surface every credit your practice qualifies for and handle all the paperwork. ' +
          'If no credits can be claimed, you pay <strong>$0</strong>.</p>' +
          '<a href="pricing.html" class="btn btn-primary btn-lg" style="margin-top:8px;">Get started</a>' +
        '</div>';
      body.appendChild(panel);
      return;
    }

    // Taxes: two-card layout (Tax Essentials + Additional Services) - mirrors www.lucid.now
    if (t.taxCards) {
      panel.innerHTML =
        '<div class="plans tax-plans">' +
          '<div class="plan">' +
            '<h3>Tax Essentials</h3>' +
            '<p class="desc">For all types of entities, from LLCs to C-Corporations.</p>' +
            '<ul class="tax-essentials">' +
              '<li>Dedicated Tax Accountant</li>' +
              '<li>Dedicated Account Manager</li>' +
            '</ul>' +
            '<div class="price"><span class="plan-was">$200/mo</span> $150<small>/mo</small></div>' +
            '<a href="https://contact.lucid.now/zc/382?cta=PricingTaxEssentials" rel="noopener" class="btn btn-primary">Talk to Experts</a>' +
          '</div>' +
          '<div class="plan featured">' +
            '<span class="pop">Most popular</span>' +
            '<h3>Additional Services</h3>' +
            '<p class="desc">Add-on filings that are otherwise not available in the Essentials package.</p>' +
            '<ul class="addon-list">' +
              '<li><span class="addon-name">Foreign Bank Account - FBAR</span><b class="addon-price"><span class="ck-mini" aria-hidden="true">✓</span> $42/bank</b></li>' +
              '<li><span class="addon-name">Foreign Shareholders - 5472</span><b class="addon-price"><span class="ck-mini" aria-hidden="true">✓</span> $42/shareholder</b></li>' +
              '<li><span class="addon-name">Additional State Filings</span><b class="addon-price"><span class="ck-mini" aria-hidden="true">✓</span> $25/state</b></li>' +
              '<li><span class="addon-name">Foreign Subsidiaries - 5471</span><b class="addon-price"><span class="ck-mini" aria-hidden="true">✓</span> $125/subsidiary</b></li>' +
            '</ul>' +
            '<a href="https://contact.lucid.now/zc/382?cta=PricingTaxAddons" rel="noopener" class="btn btn-primary">Get Started</a>' +
          '</div>' +
        '</div>' +
        '<p class="tax-foot">*Displayed figures are the yearly cost apportioned over 12 months.</p>';
      body.appendChild(panel);
      return;
    }

    panel.innerHTML =
      '<p class="calc-best">' + t.best + '</p>' +
      '<ul class="calc-incl">' +
        (t.staff || []).map(function (f) { return '<li class="incl-staff"><span class="ck" aria-hidden="true">✓</span>' + f + '</li>'; }).join('') +
        (t.platforms || []).map(function (f) { return '<li class="incl-platform"><span class="ck" aria-hidden="true">✓</span>' + f + '</li>'; }).join('') +
        (t.other || []).map(function (f) { return '<li class="incl-other"><span class="ck" aria-hidden="true">✓</span>' + f + '</li>'; }).join('') +
      '</ul>' +
      '<div class="toggle-row">' +
        '<div class="seg" data-cycle>' +
          '<button data-cycle-val="monthly">Monthly</button>' +
          '<button class="active" data-cycle-val="yearly">Yearly</button>' +
        '</div>' +
        '<span class="save-pill">💡 2 months free</span>' +
      '</div>' +
      '<div class="calc-split">' +
        '<div>' +
          '<div class="slider-label"><span>' + t.sliderLabel + '</span><b data-amount></b></div>' +
          '<input type="range" min="' + t.min + '" max="' + t.max + '" step="' + t.step + '" value="' + t.value + '" data-slider aria-label="' + t.sliderLabel + '" />' +
          '<div class="range-ends"><span>' + fmt(t.min) + '</span><span>' + fmt(t.max) + '+</span></div>' +
        '</div>' +
        '<div class="calc-out">' +
          '<span class="limited">✨ Limited Time Offer</span>' +
          '<div class="was" data-was></div>' +
          '<div class="price"><span data-price></span><small>/mo</small></div>' +
          '<div class="saving" data-saving></div>' +
          '<a href="pricing.html" class="btn btn-primary">Get Started</a>' +
        '</div>' +
      '</div>';
    body.appendChild(panel);

    // wire up this panel
    var slider = panel.querySelector('[data-slider]');
    var amount = panel.querySelector('[data-amount]');
    var priceEl = panel.querySelector('[data-price]');
    var wasEl = panel.querySelector('[data-was]');
    var savingEl = panel.querySelector('[data-saving]');
    var smallEl = panel.querySelector('.price small');
    var ctaEl = panel.querySelector('.calc-out .btn');
    var outEl = panel.querySelector('.calc-out');
    var cycleBtns = panel.querySelectorAll('[data-cycle] button');
    var cycle = 'yearly';

    function update(animate) {
      var v = +slider.value;
      slider.style.setProperty('--fill', Math.round((v - t.min) / (t.max - t.min) * 100) + '%');
      amount.textContent = fmt(v) + (v >= t.max ? '+' : '');
      if (outEl) { outEl.classList.remove('flash'); void outEl.offsetWidth; outEl.classList.add('flash'); }
      // At the top of the range (>$200k etc.), show a custom quote instead of a price
      if (v >= t.max) {
        priceEl.textContent = 'Custom';
        if (smallEl) smallEl.textContent = ' quote';
        wasEl.textContent = '';
        savingEl.textContent = 'Tailored to your practice - let’s talk';
        if (ctaEl) ctaEl.textContent = 'Get a quote';
        return;
      }
      if (smallEl) smallEl.textContent = '/mo';
      if (ctaEl) ctaEl.textContent = 'Get Started';
      // Prices mirror www.lucid.now exactly (e.g. $20k: Monthly $300->$150 save $1,800; Yearly $250->$130 save $1,440)
      var base = t.price(v);
      if (cycle === 'yearly') {
        var yWas = Math.round(base * (5 / 3) / 5) * 5;   // 250 at base 150
        var yNow = Math.round(base * (13 / 15) / 5) * 5; // 130 at base 150
        if (animate) countUp(priceEl, yNow, '$'); else priceEl.textContent = fmt(yNow);
        wasEl.textContent = fmt(yWas) + '/mo';
        savingEl.textContent = 'You are saving ' + fmt((yWas - yNow) * 12) + '/yr';
      } else {
        var mWas = base * 2;                              // 300 at base 150
        if (animate) countUp(priceEl, base, '$'); else priceEl.textContent = fmt(base);
        wasEl.textContent = fmt(mWas) + '/mo';
        savingEl.textContent = 'You are saving ' + fmt((mWas - base) * 12) + '/yr';
      }
    }
    slider.addEventListener('input', function () { update(false); });
    cycleBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        cycleBtns.forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        cycle = b.dataset.cycleVal;
        update(true);
      });
    });
    panel._update = update;
    update(false); // instant on first render; count-up fires on tab/cycle/slider changes
  });

  calc.appendChild(tabsEl);
  calc.appendChild(body);
  mount.appendChild(calc);

  // tab switching
  tabsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.calc-tab');
    if (!btn) return;
    tabsEl.querySelectorAll('.calc-tab').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    body.querySelectorAll('.calc-panel').forEach(function (p) {
      var on = p.dataset.panel === btn.dataset.tab;
      p.classList.toggle('active', on);
      if (on) {
        if (p._update) p._update(true);
        var f = p.querySelector('[data-found]');
        if (f) countUp(f, 50711, '$');
      }
    });
  });
})();

/* ---------- Lite YouTube facade (no iframe until clicked) ---------- */
(function () {
  var nodes = document.querySelectorAll('.yt-lite');
  Array.prototype.forEach.call(nodes, function (el) {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    function load() {
      var id = el.getAttribute('data-id');
      var ifr = document.createElement('iframe');
      ifr.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      ifr.setAttribute('allowfullscreen', '');
      ifr.setAttribute('title', 'Lucid platform video');
      ifr.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      el.innerHTML = '';
      el.appendChild(ifr);
      el.classList.add('loaded');
    }
    el.addEventListener('click', load);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); load(); }
    });
  });
})();

/* ---------- Rotating hero word (Business / Medical Practice / Medical Group) ---------- */
(function () {
  var el = document.getElementById('rotWord');
  if (!el) return;
  var words = ['Business', 'Private Practice', 'Medical Group'];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var i = 0;
  setInterval(function () {
    el.classList.add('swap');
    setTimeout(function () {
      i = (i + 1) % words.length;
      el.textContent = words[i];
      el.classList.remove('swap');
    }, 300);
  }, 2200);
})();

/* ---------- Shared event logger: pushes to GTM dataLayer (GA4 picks it up
   via a Custom Event trigger) and to PostHog, so every tracked action is
   logged identically to both. ---------- */
function lucidTrackEvent(name, data) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(Object.assign({ event: name }, data));
  if (window.posthog && window.posthog.capture) window.posthog.capture(name, data);
}

/* ---------- CTA tracking: route all CTAs to the contact endpoint with a
   section+action identifier (mirrors www.lucid.now, e.g. ?cta=GetStartedFirstSection),
   preserves the visitor's original query params (utm_*, hsa_*, etc.) through
   the redirect, and logs a cta_click event to GTM/PostHog on every click. ---------- */
(function () {
  var BASE = 'https://contact.lucid.now/zc/382?cta=';
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  // "specialty-ophthalmology" / "Primary Care" -> "SpecialtyOphthalmology" / "PrimaryCare"
  function pascal(s) { return (s || '').split(/[^A-Za-z0-9]+/).map(cap).join(''); }
  function action(txt) {
    var t = txt.trim().toLowerCase();
    if (t.indexOf('get a quote') > -1) return 'GetQuote';
    if (t.indexOf('get my free estimate') > -1) return 'GetEstimate';
    if (t.indexOf('get started') > -1) return 'GetStarted';
    if (t.indexOf('talk to an expert') > -1 || t.indexOf('talk to experts') > -1) return 'TalkToExpert';
    if (t === 'log in' || t.indexOf('log in') > -1) return 'Login';
    return null;
  }
  var page = ((location.pathname.split('/').pop() || 'index').replace('.html', '')) || 'index';

  // Rewrites href + computes tracking data for one <a>. Called at page load for
  // everything already in the DOM, and lazily (via delegation below) for anything
  // added/rebuilt afterward - e.g. the Specialties-tab panel and pricing calculator
  // tabs rewrite their own innerHTML after this script runs, so a one-time
  // querySelectorAll alone would permanently miss those buttons.
  function wire(a) {
    if (a.__ctaWired) return a.__ctaData;
    var act = action(a.textContent); if (!act) { a.__ctaWired = true; return null; }
    // sec must be unique per visible button location on a page, so the same
    // button text in two places (e.g. header vs hero "Get Started") stays
    // distinguishable in PostHog/GA4 via cta_section + cta_id.
    var sec;
    if (a.closest('.nav-dd')) sec = 'HeaderSpecialtiesMenu'; // dropdown footer link (also the only CTA inside the mobile hamburger menu)
    else if (a.closest('header.nav')) sec = 'Header';
    else if (a.classList.contains('sticky-cta')) sec = 'StickyMobile';
    else if (a.closest('.calc')) { var p = a.closest('.calc-panel'); sec = 'PricingTab' + cap(p && p.dataset.panel); }
    else if (a.closest('#specPanel')) { var t = document.querySelector('#specTabs .active'); sec = 'SpecialtiesTab' + pascal(t ? t.textContent : ''); }
    else if (a.closest('.hero, .spec-hero')) sec = 'FirstSection';
    else if (a.closest('.cta-band, .spec-cta')) sec = 'Bottom';
    else if (a.closest('#how')) {
      var fc = a.closest('.feature-copy'), all = document.querySelectorAll('#how .feature-copy');
      var n = fc ? Array.prototype.indexOf.call(all, fc) + 1 : 0;
      sec = 'HowItWorks' + (n > 0 ? n : '');
    }
    else { var s = a.closest('section'); sec = pascal((s && (s.id || s.classList[0])) || 'Page'); }
    var generatedCta = pascal(page) + sec + act;
    var qs = location.search ? location.search.replace(/^\?/, '&') : '';
    var existingHref = a.getAttribute('href') || '';
    // CTAs that already hardcode a contact.lucid.now destination (their own ?cta= id)
    // keep that href and label as-is - only auto-generate+rewrite for everything else.
    var alreadyWired = existingHref.indexOf('https://contact.lucid.now/') === 0;
    var href = alreadyWired ? existingHref : (BASE + generatedCta + qs);
    var ctaMatch = alreadyWired && href.match(/[?&]cta=([^&]+)/);
    var cta = ctaMatch ? decodeURIComponent(ctaMatch[1]) : generatedCta;
    if (!alreadyWired) {
      a.setAttribute('href', href);
      a.setAttribute('rel', 'noopener');
    }
    a.__ctaWired = true;
    a.__ctaData = { text: a.textContent.trim(), sec: sec, act: act, cta: cta, href: href };
    return a.__ctaData;
  }

  document.querySelectorAll('a.btn, .nav-links a').forEach(wire);

  // Capturing-phase delegation: fires before the browser's own navigation, so
  // wiring a never-before-seen button here (first click on dynamically added
  // content) still rewrites its href in time for the click to follow it.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a.btn, .nav-links a');
    if (!a) return;
    var data = wire(a);
    if (!data) return;
    lucidTrackEvent('cta_click', {
      cta_text: data.text,
      cta_section: data.sec,
      cta_action: data.act,
      cta_id: data.cta,
      cta_destination: data.href
    });

    // Meta Pixel: fired directly here, next to the pixel's own init (now in
    // partials/head-tracking.html, not GTM) - see memory note on why GTM's
    // click-trigger path never delivered a network beacon for this. Skip the
    // delay for modifier-clicks/middle-click/target=_blank, which open a new
    // tab and don't unload this page.
    if (window.fbq) {
      window.fbq('trackCustom', 'ButtonLinkClick', {
        cta_text: data.text,
        cta_classes: a.className,
        cta_url: data.href,
        page_path: location.pathname
      });
      var opensNewTab = e.button === 1 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank';
      if (!opensNewTab && e.button === 0) {
        e.preventDefault();
        setTimeout(function () { location.href = data.href; }, 200);
      }
    }
  }, true);
})();

/* ---------- Section-scroll tracking: tag the URL with ?section=<id> and log
   a section_scroll event whenever an in-page anchor link jumps to a section,
   so attribution/replay can see which on-page CTA path a visitor took. ---------- */
(function () {
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    a.addEventListener('click', function () {
      if (history && history.replaceState) {
        history.replaceState(null, '', location.pathname + '?section=' + id + '#' + id);
      }
      lucidTrackEvent('section_scroll', { section: id });
    });
  });
})();

/* ---------- Industries nav dropdown toggle ---------- */
(function(){
  var btns=document.querySelectorAll('.nav-dd-btn');
  if(!btns.length) return;
  btns.forEach(function(btn){
    btn.addEventListener('click',function(){
      var dd=btn.parentNode, open=dd.classList.toggle('open');
      btn.setAttribute('aria-expanded', open?'true':'false');
    });
  });
  document.addEventListener('click',function(e){
    document.querySelectorAll('.nav-dd.open').forEach(function(dd){
      if(!dd.contains(e.target)){ dd.classList.remove('open'); var b=dd.querySelector('.nav-dd-btn'); if(b) b.setAttribute('aria-expanded','false'); }
    });
  });
})();

/* ---------- Specialties we serve (tabbed landing section) ---------- */
(function(){
  var tabsEl=document.getElementById('specTabs'), panelEl=document.getElementById('specPanel');
  if(!tabsEl||!panelEl) return;
  var SPEC=[{"short": "Primary Care", "name": "Primary Care / Family Medicine", "icon": "🩺", "desc": "From capitation to fee-for-service, we keep your books clean across every payer - so you can focus on panels, not paperwork.", "href": "specialty-primary-care.html"}, {"short": "Orthopedics", "name": "Orthopedics / Sports Medicine", "icon": "🦴", "desc": "Surgical revenue, ASC splits, and implant costs - tracked precisely, with real-time margins across every procedure.", "href": "specialty-orthopedics.html"}, {"short": "Dermatology", "name": "Dermatology", "icon": "🧴", "desc": "Cosmetic vs. medical mix, product inventory, and injectables - categorized automatically, with clear profit by service line.", "href": "specialty-dermatology.html"}, {"short": "Medical Group", "name": "Medical Group / Several Locations", "icon": "🏥", "desc": "Multi-location, multi-entity, PC-MSO structures - consolidated dashboards and intercompany reconciliation in one place.", "href": "specialty-medical-group.html"}, {"short": "Ophthalmology", "name": "Ophthalmology / Eye Care", "icon": "👁️", "desc": "Optical retail, surgical, and exam revenue - separated cleanly, so you see the margin on every side of the practice.", "href": "specialty-ophthalmology.html"}, {"short": "Medical Spa", "name": "Medical Spa / Aesthetics", "icon": "💆", "desc": "Memberships, packages, retail, and injectables - deferred revenue and product costs handled right, automatically.", "href": "specialty-medical-spa.html"}, {"short": "Behavioral Health", "name": "Mental / Behavioral Health", "icon": "🧠", "desc": "Multi-clinician groups and insurance + private-pay mix - clean books and real-time clarity across every provider.", "href": "specialty-behavioral-health.html"}, {"short": "Physical Therapy", "name": "Physical Therapy", "icon": "🏃", "desc": "Visit-based revenue, authorizations, and multi-site PT - tracked in real time with clear per-location performance.", "href": "specialty-physical-therapy.html"}, {"short": "Nutrition", "name": "Nutrition / Dietitian", "icon": "🥗", "desc": "Private-pay packages, superbills, and telehealth - simple, accurate books built for a lean practice.", "href": "specialty-nutrition-dietitian.html"}, {"short": "Speech Therapy", "name": "Speech / Language Therapy", "icon": "🗣️", "desc": "Session-based billing, school contracts, and teletherapy - organized books so you can focus on clients.", "href": "specialty-speech-therapy.html"}, {"short": "Dental", "name": "Dentistry / Oral Health", "icon": "🦷", "desc": "From insurance claims to patient payment plans, we keep your books clean across every chair - so you can focus on smiles, not spreadsheets.", "href": "specialty-dental.html"}, {"short": "More", "name": "Many More Specialties", "icon": "➕", "desc": "Don't see your specialty? We support many more - concierge medicine, surgical groups, dental, veterinary, and beyond. If you run a practice, we can run your books.", "href": "pricing.html", "cta": "Talk to an expert about your practice"}];
  SPEC.forEach(function(s,i){
    var b=document.createElement('button');
    b.type='button'; b.textContent=s.short; b.setAttribute('role','tab');
    if(i===0) b.className='active';
    b.addEventListener('click',function(){ show(i); });
    tabsEl.appendChild(b);
  });
  function show(i){
    for(var j=0;j<tabsEl.children.length;j++){ tabsEl.children[j].classList.toggle('active', j===i); }
    var s=SPEC[i];
    panelEl.innerHTML='<h3><span class="spi" aria-hidden="true">'+s.icon+'</span>'+s.name+'</h3>'+
      '<p>'+s.desc+'</p>'+
      '<a class="btn btn-primary" href="pricing.html">Talk to an Expert</a>';
  }
  show(0);
})();

/* ---------- Mobile sticky CTA: reveal only after the hero buttons scroll away ---------- */
(function(){
  var cta = document.querySelector('.sticky-cta');
  var anchor = document.querySelector('.hero-actions');
  if(!cta || !anchor || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function(entries){
    cta.classList.toggle('show', !entries[0].isIntersecting);
  }, {threshold:0});
  io.observe(anchor);
})();

/* ---------- The Lucid Experience tabs (gif per tab) ---------- */
(function () {
  var tabs = document.querySelectorAll('.lx-tab');
  var img = document.getElementById('lxImg');
  var cap = document.getElementById('lxCap');
  if (!tabs.length || !img) return;
  var B = 'https://lucidreams.b-cdn.net/thelucidexperiancesection/';
  var DATA = [
    { src: 'aiplans.gif', alt: 'AI-generated financial plan', cap: 'Generate a full financial plan in seconds.' },
    { src: 'AIFinancials.gif', alt: 'AI financials dashboard', cap: 'Live dashboards for every number that matters.' },
    { src: 'Budget%20Vs%20Actuals.gif', alt: 'Budget vs actuals comparison', cap: 'See plan vs reality, month over month.' },
    { src: 'What-If%20Scenarios.gif', alt: 'What-if scenario planning', cap: 'Model new hires, expansion, and new locations.' },
    { src: 'Complete%20Template%20Library.gif', alt: 'Template library', cap: 'Board decks and investor updates, ready to go.' },
    { src: 'AI%20Conversation%20.gif', alt: 'AI conversation copilot', cap: 'Ask your finances anything - get an instant answer.' }
  ];
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var d = DATA[+t.dataset.lx]; if (!d) return;
      tabs.forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
      t.classList.add('active'); t.setAttribute('aria-selected', 'true');
      img.src = B + d.src; img.alt = d.alt; if (cap) cap.textContent = d.cap;
    });
  });
})();

/* ---------- Lazy-load autoplay videos on scroll-into-view ---------- */
(function () {
  var vids = document.querySelectorAll('video.lazy-video');
  if (!vids.length) return;
  function startVideo(v) {
    var src = v.querySelectorAll('source');
    src.forEach(function (s) { if (s.dataset.src) { s.src = s.dataset.src; delete s.dataset.src; } });
    v.load();
    v.play().catch(function () {});
  }
  if (!('IntersectionObserver' in window)) {
    vids.forEach(startVideo);
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { startVideo(e.target); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px 200px 0px', threshold: 0.01 });
  vids.forEach(function (v) { io.observe(v); });
})();
