/* ============================================================
   Lucid — interactions: pricing calculator, testimonials, nav
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
    { q: "Lucid has been phenomenal across my portfolio of nine healthcare businesses. Smart technology, a team that actually understands medicine, and books I finally trust.", name: "Dr. Frank McCormick, M.D.", role: "Sigma Orthopedics", img: "assets/img/avatar-12.webp" },
    { q: "Running a nationwide behavioral health network, I needed finance that scales. Lucid gives me real-time clarity across every single location.", name: "Samantha Hewett", role: "CEO, Ascend Behavioral Health", img: "assets/img/avatar-45.webp" },
    { q: "Wow, you guys are lightning fast. The responsiveness is unreal — honestly, CFOs for life for me.", name: "Erin Fitzgerald", role: "Terraway", img: "assets/img/avatar-32.webp" },
    { q: "It feels like having a full finance team on demand. My accountant's jaw about dropped when he saw October was already up to date.", name: "Aviv Farhi", role: "CEO, Showcase", img: "assets/img/real-farhi.webp" }
  ];
  var q = document.getElementById('tqQuote');
  var name = document.getElementById('tqName');
  var role = document.getElementById('tqRole');
  var img = document.getElementById('tqImg');
  var i = 0, timer;

  function render(n) {
    i = n;
    var d = data[n];
    q.textContent = d.q;
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
    {
      id: 'taxes', label: 'Taxes',
      best: 'For practices seeking year-round tax planning plus on-time federal, state, and personal filings.',
      staff: ['Dedicated Tax Accountant', 'Dedicated Account Manager'],
      platforms: ['Tax Filing Platform'],
      other: ['Federal, state &amp; personal filings', 'Additional state filings', 'Year-round tax planning', '24/7 Slack Support'],
      sliderLabel: 'Annual practice revenue', min: 100000, max: 3000000, step: 50000, value: 500000,
      saveFactor: 6,
      price: function (v) { return v <= 250000 ? 150 : v <= 500000 ? 250 : v <= 1000000 ? 400 : v <= 2000000 ? 600 : 800; }
    },
    {
      id: 'cfo', label: 'CFO Services',
      best: 'For practices seeking to analyze performance, forecast, and discover key insights.',
      staff: ['Dedicated CFO', 'Dedicated Account Manager'],
      platforms: ['Cashflow Reporting &amp; Forecasting Platform'],
      other: ['Real-time insights &amp; scenario planning', 'Budget vs. actuals &amp; forecasting', 'Board- &amp; investor-ready updates', '24/7 Slack Support'],
      sliderLabel: 'Your monthly expenses', min: 0, max: 300000, step: 10000, value: 50000,
      saveFactor: 12,
      price: function (v) { return v <= 50000 ? 150 : v <= 100000 ? 300 : v <= 150000 ? 450 : v <= 200000 ? 600 : v <= 250000 ? 750 : 900; }
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
        '<span class="save-pill">💡 2 months free on yearly</span>' +
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

/* ---------- CTA tracking: route all CTAs to the contact endpoint with a
   section+action identifier (mirrors www.lucid.now, e.g. ?cta=GetStartedFirstSection) ---------- */
(function () {
  var BASE = 'https://contact.lucid.now/zc/382?cta=';
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function action(txt) {
    var t = txt.trim().toLowerCase();
    if (t.indexOf('get a quote') > -1) return 'GetQuote';
    if (t.indexOf('get started') > -1) return 'GetStarted';
    if (t.indexOf('talk to an expert') > -1) return 'TalkToExpert';
    if (t === 'log in' || t.indexOf('log in') > -1) return 'Login';
    return null;
  }
  var page = ((location.pathname.split('/').pop() || 'index').replace('.html', '')) || 'index';
  document.querySelectorAll('a.btn, .nav-links a').forEach(function (a) {
    var act = action(a.textContent); if (!act) return;
    var sec;
    if (a.closest('header.nav')) sec = 'Header';
    else if (a.closest('.calc')) { var p = a.closest('.calc-panel'); sec = 'PricingTab' + cap(p && p.dataset.panel); }
    else if (a.closest('.hero')) sec = 'FirstSection';
    else if (a.closest('.cta-band')) sec = 'Bottom';
    else if (a.closest('#how')) sec = 'HowItWorks';
    else { var s = a.closest('section'); sec = cap((s && s.id) || 'Page'); }
    a.setAttribute('href', BASE + cap(page) + sec + act);
    a.setAttribute('rel', 'noopener');
  });
})();
