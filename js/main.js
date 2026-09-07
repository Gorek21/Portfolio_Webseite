// ============================================================
// NAV — STAGGERED MENU
// ============================================================
const nav     = document.getElementById('nav');
const burger  = document.getElementById('navBurger');
const overlay = document.getElementById('navOverlay');

let menuOpen = false;

function openMenu() {
  menuOpen = true;
  burger.classList.add('active');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  menuOpen = false;
  burger.classList.remove('active');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

burger.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());

overlay.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    closeMenu();
    // Nav-Link geklickt → Hero-Snap für 2 s sperren, damit der
    // programmatische Smooth-Scroll nicht vom Snap abgefangen wird
    window._navScrollLock = Date.now();
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menuOpen) closeMenu();
});

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ============================================================
// HERO — MULTILINGUAL TYPING (WELCOME PHASE)
// ============================================================
const langWords = [
  'Willkommen',   // Deutsch
  'Welcome',      // Englisch
  'Witaj',        // Polnisch
  'Bienvenue',    // Französisch
  '欢迎',          // Chinesisch
  'Bienvenido',   // Spanisch
  'ようこそ',       // Japanisch
];

let langIdx = 0, langChar = 0, langDel = false;
const langEl = document.getElementById('heroLangText');

function typeLang() {
  if (!langEl) return;
  const word = langWords[langIdx];
  if (!langDel) {
    langEl.textContent = word.slice(0, ++langChar);
    if (langChar === word.length) {
      langDel = true;
      setTimeout(typeLang, 1600);
      return;
    }
  } else {
    langEl.textContent = word.slice(0, --langChar);
    if (langChar === 0) {
      langDel = false;
      langIdx = (langIdx + 1) % langWords.length;
    }
  }
  setTimeout(typeLang, langDel ? 50 : 80);
}
setTimeout(typeLang, 400);

// ============================================================
// HERO — SCROLL-EXPAND + FOTO FOKUS-SHIFT
// ============================================================
(function () {
  const heroWrap    = document.getElementById('hero');
  const glowWrap    = document.getElementById('heroGlowWrap');
  const box         = document.getElementById('heroBox');
  const heroWelcome = document.getElementById('heroWelcome');
  const heroMain    = document.getElementById('heroMain');
  const bg1         = document.getElementById('heroBg1');
  const bg2         = document.getElementById('heroBg2');
  const overlay     = document.getElementById('heroOverlay');
  if (!heroWrap || !box) return;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(v)    { return Math.max(0, Math.min(1, v)); }
  function ease(t)       { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }

  // ╔══════════════════════════════════════════════════════════╗
  // ║  AUTO-SNAP KONFIGURATION – hier zum Testen anpassen     ║
  // ╠══════════════════════════════════════════════════════════╣
  // ║  Alle Werte sind Scroll-Prozente (0.0 = ganz oben,      ║
  // ║  1.0 = Ende der Hero-Section).                          ║
  // ║                                                          ║
  // ║  SNAP_FROM  – ab diesem % löst der Auto-Scroll aus.     ║
  // ║               Kleiner = früher abspringen.              ║
  // ║                                                          ║
  // ║  SNAP_TO    – bis hierher scrollt er automatisch.       ║
  // ║               Größer = weiter springen (Übergang kürzer) ║
  // ║                                                          ║
  // ║  SNAP_SPEED – 'smooth' (weich) oder 'instant' (sofort)  ║
  // ╚══════════════════════════════════════════════════════════╝
  const SNAP_FROM  = 0.10;      // ← HIER anpassen
  const SNAP_TO    = 0.95;      // ← HIER anpassen
  const SNAP_SPEED = 'smooth';  // ← HIER anpassen

  // Zustandsmaschine für beide Richtungen
  // 'idle'          = vor der Zone (bereit für Snap nach unten)
  // 'snap-down'     = springt gerade nach unten
  // 'past'          = hinter der Zone (bereit für Snap nach oben)
  // 'snap-up'       = springt gerade nach oben
  let snapState  = 'idle';
  let lastRaw    = 0;    // zum Erkennen der Scroll-Richtung
  let lastSnapAt = 0;    // Zeitstempel des letzten Snaps
  const COOLDOWN = 1100; // ms – Wartezeit nach einem Snap bevor Gegenrichtung erlaubt

  function onHeroScroll() {
    const scrollable = heroWrap.offsetHeight - window.innerHeight;
    const raw        = clamp01(-heroWrap.getBoundingClientRect().top / scrollable);
    const dir        = raw - lastRaw; // > 0 = runter, < 0 = hoch
    lastRaw          = raw;
    const p          = ease(raw);

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // ── Box + Glow-Wrapper expand ───────────────────────────
    const initW = Math.round(vw * 0.80);   // 80 % der Viewport-Breite
    const initH = Math.round(vh * 0.70);   // 70 % der Viewport-Höhe

    // Wrapper bestimmt die Außengröße (inkl. 1.5px Glow-Rand)
    if (glowWrap) {
      glowWrap.style.width        = lerp(initW, vw, p) + 'px';
      glowWrap.style.height       = lerp(initH, vh, p) + 'px';
      glowWrap.style.borderRadius = lerp(30, 0, p) + 'px';
      // Glow-Expand-Opacity: blendet aus wenn Box fast voll ist
      glowWrap.style.setProperty('--glow-expand-opacity', Math.max(0, 1 - p * 3));
    }

    // Box folgt dem Wrapper (100 % Breite/Höhe per CSS); nur radius
    box.style.borderRadius = lerp(26, 0, p) + 'px';

    // ── Foto Fokus-Shift ────────────────────────────────────
    // Übergang beginnt bei 10% und endet bei 85%
    const fp = clamp01((raw - 0.10) / 0.75);
    const fe = ease(fp); // geglättet

    if (bg1 && bg2) {
      // Bild 1: zoomt leicht heraus (nah → etwas weiter) + wird unscharf
      const blur1 = fp * 3.5;                        // 0 → 3.5px
      const scale1 = lerp(1.10, 1.0, fe);            // 110% → 100%
      bg1.style.opacity   = 1 - fe;
      bg1.style.transform = `scale(${scale1})`;
      bg1.style.filter    = `blur(${blur1}px)`;

      // Bild 2: kommt scharf herein, leichter Zoom-Out
      const scale2 = lerp(1.06, 1.0, fe);            // 106% → 100%
      bg2.style.opacity   = fe;
      bg2.style.transform = `scale(${scale2})`;
      bg2.style.filter    = 'none';
    }

    // ── Overlay: dunkler wenn Text sichtbar ─────────────────
    if (overlay) {
      // Leichter beim kleinen Box (welcome-Phase), stärker bei vollem Screen
      const oDark = lerp(0.75, 1, p);
      overlay.style.opacity = oDark;
    }

    // ── Welcome: blendet früh aus (0–40%) ───────────────────
    const wOpacity = clamp01(1 - raw / 0.60);
    heroWelcome.style.opacity       = wOpacity;
    heroWelcome.style.pointerEvents = wOpacity < 0.05 ? 'none' : '';

    // ── Main content: blendet spät ein (68–100%) ────────────
    const mOpacity = clamp01((raw - 0.68) / 0.32);
    heroMain.style.opacity       = mOpacity;
    heroMain.style.pointerEvents = mOpacity < 0.05 ? 'none' : '';

    // ── Auto-Snap durch den Bildübergang (beide Richtungen) ──
    const snapDownY = heroWrap.offsetTop + SNAP_TO   * scrollable;
    const snapUpY   = heroWrap.offsetTop + SNAP_FROM * scrollable;
    const now       = Date.now();
    const cooled    = (now - lastSnapAt) > COOLDOWN; // Abkühlzeit abgelaufen?

    // Nav-Link-Sperre: kein Snap während programmatischem Scroll
    const navLocked = window._navScrollLock && (now - window._navScrollLock < 2000);
    if (navLocked) { lastRaw = raw; return; }

    // Nach UNTEN: User scrollt runter, trifft SNAP_FROM → springe zu SNAP_TO
    if (snapState === 'idle' && cooled && dir > 0.0005 && raw >= SNAP_FROM && raw < SNAP_TO) {
      snapState  = 'snap-down';
      lastSnapAt = now;
      window.scrollTo({ top: snapDownY, behavior: SNAP_SPEED });
    }
    if (snapState === 'snap-down' && raw >= SNAP_TO) {
      snapState = 'past';
    }

    // Nach OBEN: User scrollt hoch, trifft SNAP_TO → springe zurück zu SNAP_FROM
    // Abkühlzeit verhindert sofortigen Rückwärts-Snap nach Browser-Trägheit
    if (snapState === 'past' && cooled && dir < -0.0005 && raw <= SNAP_TO && raw > SNAP_FROM) {
      snapState  = 'snap-up';
      lastSnapAt = now;
      window.scrollTo({ top: snapUpY, behavior: SNAP_SPEED });
    }
    if (snapState === 'snap-up' && raw <= SNAP_FROM) {
      snapState = 'idle';
    }

    // Sicherheits-Reset bei Extrempositionen
    if (raw < SNAP_FROM * 0.4) snapState = 'idle';
    if (raw > SNAP_TO + 0.04)  snapState = 'past';
  }

  window.addEventListener('scroll', onHeroScroll, { passive: true });
  window.addEventListener('resize', onHeroScroll);
  onHeroScroll();

  // ── Border Glow: Maus-Proximity-Tracking ──────────────────
  // Leuchtet dort wo der Cursor nah am Rand ist.
  // Innen: Abstand zur nächsten Kante; Außen: euklidischer Abstand zur Ecke.
  const PROXIMITY_INSIDE  = 80;  // px – wie weit innen der Glow greift
  const PROXIMITY_OUTSIDE = 100; // px – wie weit außen der Glow greift

  document.addEventListener('mousemove', (e) => {
    if (!glowWrap) return;
    const r = glowWrap.getBoundingClientRect();

    // Mausposition in % relativ zum Wrapper
    const xPct = ((e.clientX - r.left) / r.width)  * 100;
    const yPct = ((e.clientY - r.top)  / r.height) * 100;

    const inside = e.clientX > r.left && e.clientX < r.right &&
                   e.clientY > r.top  && e.clientY < r.bottom;

    let intensity;
    if (inside) {
      // Abstand zur nächsten inneren Kante
      const edgeDist = Math.min(
        e.clientX - r.left, r.right  - e.clientX,
        e.clientY - r.top,  r.bottom - e.clientY
      );
      intensity = Math.max(0, 1 - edgeDist / PROXIMITY_INSIDE);
    } else {
      // Abstand zum nächsten Punkt auf dem Rand
      const nearX = Math.max(r.left, Math.min(r.right,  e.clientX));
      const nearY = Math.max(r.top,  Math.min(r.bottom, e.clientY));
      const dist  = Math.hypot(e.clientX - nearX, e.clientY - nearY);
      intensity   = Math.max(0, 1 - dist / PROXIMITY_OUTSIDE);
    }

    glowWrap.style.setProperty('--glow-x',         xPct.toFixed(2) + '%');
    glowWrap.style.setProperty('--glow-y',         yPct.toFixed(2) + '%');
    glowWrap.style.setProperty('--glow-intensity', intensity.toFixed(3));
  }, { passive: true });
})();

// ============================================================
// SCROLL REVEAL
// ============================================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
  revealObserver.observe(el);
});

// ============================================================
// COUNTER ANIMATION
// ============================================================
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounters();
      counterObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const aboutSection = document.getElementById('about');
if (aboutSection) counterObserver.observe(aboutSection);

function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    const duration = 1500;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(ease * target);
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target;
    }
    requestAnimationFrame(update);
  });
}


// ============================================================
// HORIZONTAL EXPERIENCE TIMELINE
// ============================================================
(function () {
  const section = document.getElementById('experience');
  if (!section) return;

  const TOTAL_MONTHS = 56; // Jan 2022 → Sep 2026
  const LABEL_W = 148;     // must match $htl-label in SCSS

  // month offset from Jan 2022
  const JOBS = [
    { start: 0,  end: 20 }, // AboWind
    { start: 14, end: 36 }, // Dr. Schäfer
    { start: 36, end: 56 }, // Gerd Stroucken
    { start: 45, end: 56 }, // 100Marketing
  ];

  const wrapper = document.getElementById('htlWrapper');
  const needle  = document.getElementById('htlNeedle');
  const rows    = section.querySelectorAll('.htl__row:not(.htl__row--axis)');
  const cards   = section.querySelectorAll('.htl__card');

  let pinnedJob = -1;
  let scrollJob = 0;

  // Make section tall enough for scroll animation (sticky height + animation zone)
  function applyHeight() {
    section.style.height = (window.innerHeight * 2.2) + 'px';
  }
  applyHeight();
  window.addEventListener('resize', applyHeight);

  // Returns array of ALL job indices active at month m
  function jobsAtMonth(m) {
    return JOBS.reduce((acc, j, i) => {
      if (m >= j.start && m <= j.end) acc.push(i);
      return acc;
    }, []);
  }

  // activate accepts a single index OR an array of indices
  function activate(idxOrArr) {
    const active = new Set(Array.isArray(idxOrArr) ? idxOrArr : [idxOrArr]);
    rows.forEach((r, i)  => r.classList.toggle('is-active', active.has(i)));
    cards.forEach((c, i) => c.classList.toggle('is-active', active.has(i)));
  }

  function onScroll() {
    const scrollable = section.offsetHeight - window.innerHeight;
    const progress   = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / scrollable));

    const trackW = wrapper.offsetWidth - LABEL_W;
    needle.style.left = (LABEL_W + progress * trackW) + 'px';

    scrollJob = jobsAtMonth(progress * TOTAL_MONTHS);
    if (pinnedJob === -1) activate(scrollJob);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function bindEl(el, idx) {
    el.addEventListener('mouseenter', () => { if (pinnedJob === -1) activate(idx); });
    el.addEventListener('mouseleave', () => { if (pinnedJob === -1) activate(scrollJob); });
    el.addEventListener('click', () => {
      pinnedJob = (pinnedJob === idx) ? -1 : idx;
      activate(pinnedJob !== -1 ? pinnedJob : scrollJob);
    });
  }

  rows.forEach((r, i)  => bindEl(r, i));
  cards.forEach((c, i) => bindEl(c, i));
})();

// ============================================================
// GALLERY WALL — LIGHTBOX
// ============================================================
(function () {
  const lightbox = document.getElementById('galleryLightbox');
  const lbImg    = document.getElementById('galleryLbImg');
  const lbClose  = document.getElementById('galleryLbClose');
  if (!lightbox) return;

  function openLightbox(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.gallery__wall-item').forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (img) openLightbox(img.src, img.alt);
    });
  });

  document.querySelector('.gallery__lb-backdrop').addEventListener('click', closeLightbox);
  lbClose.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
})();

// ============================================================
// FOTO-SCHUTZ — Rechtsklick & Drag deaktiviert
// ============================================================
(function () {
  // Rechtsklick auf Bilder blockieren
  document.addEventListener('contextmenu', e => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });

  // Drag & Drop von Bildern blockieren
  document.addEventListener('dragstart', e => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });

  // Lightbox-Bild ebenfalls schützen
  const lbImg = document.getElementById('galleryLbImg');
  if (lbImg) {
    lbImg.addEventListener('contextmenu', e => e.preventDefault());
    lbImg.addEventListener('dragstart',   e => e.preventDefault());
  }
})();

