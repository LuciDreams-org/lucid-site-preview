/* ============================================================
   Lucid — interactions: pricing calculator, testimonials, nav
   ============================================================ */

/* ---------- Mobile nav ---------- */
(function () {
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () { links.classList.toggle('open'); });
  }
})();

/* ---------- Testimonial carousel (centered feature) ---------- */
(function () {
  var dots = document.getElementById('testiDots');
  if (!dots) return;
  var data = [
    { q: "Lucid has been phenomenal across my portfolio of nine healthcare businesses. Smart technology, a team that actually understands medicine, and books I finally trust.", name: "Dr. Frank McCormick, M.D.", role: "Sigma Orthopedics", img: "https://i.pravatar.cc/120?img=12" },
    { q: "Running a nationwide behavioral health network, I needed finance that scales. Lucid gives me real-time clarity across every single location.", name: "Samantha Hewett", role: "CEO, Ascend Behavioral Health", img: "https://i.pravatar.cc/120?img=45" },
    { q: "Wow, you guys are lightning fast. The responsiveness is unreal — honestly, CFOs for life for me.", name: "Erin Fitzgerald", role: "Terraway", img: "https://i.pravatar.cc/120?img=32" },
    { q: "It feels like having a full finance team on demand. My accountant's jaw about dropped when he saw October was already up to date.", name: "Giorgio Riccio", role: "Founder, Lumino Technologies", img: "https://i.pravatar.cc/120?img=15" }
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

  // Per-tab configuration. price() returns base monthly price.
  var TABS = [
    {
      id: 'bookkeeping', label: 'Bookkeeping',
      best: 'For practices that want accurate monthly books, closed and reviewed by a dedicated expert.',
      sliderLabel: 'Monthly spending', min: 0, max: 200000, step: 1000, value: 20000,
      saveFactor: 8,
      price: function (v) { return v <= 20000 ? 150 : v <= 50000 ? 300 : v <= 100000 ? 500 : v <= 200000 ? 800 : 1000; }
    },
    {
      id: 'taxes', label: 'Taxes',
      best: 'For practices seeking year-round tax planning plus on-time federal, state, and personal filings.',
      sliderLabel: 'Annual practice revenue', min: 50000, max: 3000000, step: 50000, value: 500000,
      saveFactor: 6,
      price: function (v) { return v <= 250000 ? 200 : v <= 500000 ? 350 : v <= 1000000 ? 600 : v <= 2000000 ? 900 : 1200; }
    },
    {
      id: 'cfo', label: 'CFO Services',
      best: 'For practices seeking to analyze performance, forecast, and discover key insights.',
      sliderLabel: 'Your monthly expenses', min: 0, max: 300000, step: 5000, value: 50000,
      saveFactor: 12,
      price: function (v) { return v <= 50000 ? 150 : v <= 100000 ? 300 : v <= 250000 ? 600 : 900; }
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
          '<div class="found"><small>Total credits found for practices</small>$50,711</div>' +
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
      '<div class="toggle-row">' +
        '<div class="seg" data-cycle>' +
          '<button class="active" data-cycle-val="monthly">Monthly</button>' +
          '<button data-cycle-val="yearly">Yearly</button>' +
        '</div>' +
        '<span class="save-pill">💡 2 months free on yearly</span>' +
      '</div>' +
      '<div class="calc-split">' +
        '<div>' +
          '<div class="slider-label"><span>' + t.sliderLabel + '</span><b data-amount></b></div>' +
          '<input type="range" min="' + t.min + '" max="' + t.max + '" step="' + t.step + '" value="' + t.value + '" data-slider />' +
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
    var cycleBtns = panel.querySelectorAll('[data-cycle] button');
    var cycle = 'monthly';

    function update() {
      var v = +slider.value;
      amount.textContent = fmt(v) + (v >= t.max ? '+' : '');
      var base = t.price(v);
      if (cycle === 'yearly') {
        var eff = Math.round(base * 10 / 12 / 5) * 5; // 2 months free, rounded to $5
        priceEl.textContent = fmt(eff);
        wasEl.textContent = fmt(base) + '/mo';
        savingEl.textContent = 'You save ' + fmt(base * 2 + base * t.saveFactor) + '/yr';
      } else {
        priceEl.textContent = fmt(base);
        wasEl.textContent = '';
        savingEl.textContent = 'You save ' + fmt(base * t.saveFactor) + '/yr vs. a traditional CPA';
      }
    }
    slider.addEventListener('input', update);
    cycleBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        cycleBtns.forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        cycle = b.dataset.cycleVal;
        update();
      });
    });
    update();
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
      p.classList.toggle('active', p.dataset.panel === btn.dataset.tab);
    });
  });
})();
