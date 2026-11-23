/* Motion layer: Anime.js (intro, headings, counters) + Motion (reveals, scroll-linked).
   Everything is progressive enhancement: without JS, with reduced motion, or if a library fails to load,
   the page simply shows its content. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('mo')) return;                 // set in <head> unless reduced motion
  var A = window.AnimeLite, M = window.MotionLite;
  if (!A || !M) { root.classList.remove('mo'); return; }
  root.classList.add('mo-ready');

  var EASE = [0.22, 1, 0.36, 1];
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var done = function (el) { el.style.opacity = '1'; el.style.transform = ''; };

  // Items below the hero that fade and rise as they come into view (keep in sync with style.css)
  var REVEAL = [
    '.sec:not(.hero) .side .stick > :not(h2)', '.sec:not(.hero) .main > p', '.sec:not(.hero) .main > h3',
    '.sec:not(.hero) .main > ul.plain', '.sec:not(.hero) .main > .cap', '.sec:not(.hero) .main > figure',
    '.sec:not(.hero) .main > .embed', '.sec:not(.hero) .main > .ig-card',
    '.facts > div', '.vgrid > *', '.credits .row', '.steps li', '.timeline li', '.pages > a', '.contact-list li', '.chips li'
  ].join(',');

  // Anime.js builds the line elements a moment after the fonts are ready, so wait for them
  function splitLines(el) {
    var sp = A.splitText(el, { lines: { wrap: 'clip' } });
    return new Promise(function (res) {
      var n = 0;
      (function wait() { if (sp.lines.length || n++ > 40) res(sp); else requestAnimationFrame(wait); })();
    });
  }

  function fail(e) {
    root.classList.remove('mo');
    $('[style*="opacity"], [style*="transform"]').forEach(done);
    if (window.console) console.warn('motion disabled:', e);
  }

  function intro() {
    var h1 = document.querySelector('.hero h1');
    return splitLines(h1).then(function (split) {
      var tl = A.createTimeline({ defaults: { ease: 'outExpo', duration: 800 }, onComplete: function () { split.revert(); } });
      if (split.lines.length) split.lines.forEach(function (l) { l.style.transform = 'translateY(105%)'; });
      h1.style.opacity = '1';
      tl.add('.bar', { opacity: [0, 1], y: [-14, 0] }, 0)
        .add('.hero .kicker', { opacity: [0, 1] }, 80);
      if (split.lines.length) tl.add(split.lines, { y: ['105%', '0%'], delay: A.stagger(120) }, 160);
      tl.add('.hero .sub', { opacity: [0, 1], y: [18, 0] }, 520)
        .add('.hero .ctas a', { opacity: [0, 1], x: [-14, 0], delay: A.stagger(90) }, 680)
        .add('.portrait', { opacity: [0, 1], clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'], duration: 1300 }, 240)
        .add('.hero .hero-grid p.mono', { opacity: [0, 1] }, 600)
        .add('.hero .index .row', { opacity: [0, 1], y: [16, 0], delay: A.stagger(80) }, 680);
    });
  }

  function headings() {
    $('.sec:not(.hero) h2').forEach(function (h) {
      splitLines(h).catch(fail).then(function (split) {
        if (!split) return;
        if (!split.lines.length) { h.style.opacity = '1'; return; }
        split.lines.forEach(function (l) { l.style.transform = 'translateY(105%)'; });
        h.style.opacity = '1';
        h._split = split;
        M.inView(h, function () {
          h.dataset.rv = '1';
          A.animate(split.lines, { y: ['105%', '0%'], duration: 700, ease: 'outExpo', delay: A.stagger(90), onComplete: function () { split.revert(); } });
        }, { margin: '0px 0px -10% 0px' });
      });
    });
  }

  function reveals() {
    $(REVEAL).forEach(function (el) {
      var sibs = Array.prototype.filter.call(el.parentNode.children, function (n) { return n.matches(REVEAL); });
      var i = sibs.indexOf(el), grouped = /^(LI|A|DIV)$/.test(el.tagName) && sibs.length > 1;
      var delay = grouped ? Math.min(i, 5) * 0.05 : 0;
      M.inView(el, function () {
        el.dataset.rv = '1';
        var guard = setTimeout(function () { done(el); }, 1800);       // never leave content hidden
        M.animate(el, { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0px)'] }, { duration: 0.5, delay: delay, ease: EASE })
          .finished.then(function () { clearTimeout(guard); done(el); }, function () { done(el); });
      }, { margin: '0px 0px -8% 0px' });
    });
  }

  function counters() {
    $('.facts b').forEach(function (b) {
      var n = parseInt(b.textContent, 10);
      if (!/^\d+$/.test(b.textContent.trim())) return;
      M.inView(b, function () {
        var o = { v: 0 };
        A.animate(o, { v: n, duration: 1600, ease: 'outExpo', onUpdate: function () { b.textContent = Math.round(o.v); } });
      });
    });
  }

  // Header: tucks away when scrolling down, returns on the way up
  function header() {
    var bar = document.querySelector('.bar'), last = window.scrollY, tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        var y = window.scrollY, d = y - last;
        if (Math.abs(d) > 6) { bar.classList.toggle('bar-hide', d > 0 && y > 240 && !document.querySelector('.bar nav.open')); last = y; }
        tick = false;
      });
    }, { passive: true });
  }

  // Safety net: anything above the bottom of the screen that has not been revealed is shown at once
  function sweep() {
    $(REVEAL).forEach(function (el) {
      if (el.dataset.rv) return;
      if (el.getBoundingClientRect().top < window.innerHeight) { el.dataset.rv = '1'; done(el); }
    });
    $('.sec:not(.hero) h2').forEach(function (h) {
      if (h.dataset.rv || !h._split) return;
      if (h.getBoundingClientRect().top < window.innerHeight) { h.dataset.rv = '1'; h._split.revert(); }
    });
  }
  function safety() {
    var t;
    window.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(sweep, 450); }, { passive: true });
    setTimeout(sweep, 3500);
  }

  function start() {
    try { intro().catch(fail); headings(); reveals(); counters(); header(); safety(); }
    catch (e) { fail(e); }
  }
  var ready = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })]) : Promise.resolve();
  ready.then(start);
})();
