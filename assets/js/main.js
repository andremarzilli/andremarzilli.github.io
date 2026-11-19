/* Andrea Marzilli — portfolio. No dependencies. */
(function () {
  'use strict';

  // Add ?draft to the address to show editor placeholders (elements with class "todo"), if any.
  if (/[?&]draft\b/.test(location.search)) document.body.classList.add('draft');

  // Mobile menu
  var btn = document.querySelector('.menu-btn'), nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } });
  }

  // Current section in the nav
  var links = {};
  document.querySelectorAll('#nav a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); });
          links[en.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  // Third-party embeds load only on click (no tracking, faster page)
  document.querySelectorAll('.embed[data-src]').forEach(function (box) {
    var b = box.querySelector('button');
    if (!b) return;
    b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = box.getAttribute('data-src');
      f.height = box.getAttribute('data-h') || '352';
      f.title = box.getAttribute('data-title') || 'Embedded player';
      f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
      f.loading = 'lazy';
      box.replaceChildren(f);
    });
  });

  // Light audio player: <div class="player" data-src="assets/audio/file.mp3" data-title="..." data-note="...">
  var ICON_PLAY = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 1l11 6-11 6z"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 1h4v12H2zM8 1h4v12H8z"/></svg>';
  var current = null;
  function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  document.querySelectorAll('.player').forEach(function (p) {
    var title = p.getAttribute('data-title') || 'Audio', note = p.getAttribute('data-note') || '';
    p.innerHTML = '<button class="pb" type="button" aria-label="Play ' + title.replace(/"/g, '') + '">' + ICON_PLAY + '</button>' +
      '<div class="ti">' + title + (note ? '<small>' + note + '</small>' : '') + '</div><div class="tm">0:00</div>' +
      '<div class="bar2" role="slider" aria-label="Position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><i></i></div>';
    var audio = new Audio(); audio.preload = 'none'; audio.src = p.getAttribute('data-src');
    var pb = p.querySelector('.pb'), tm = p.querySelector('.tm'), bar = p.querySelector('.bar2'), fill = bar.querySelector('i');
    pb.addEventListener('click', function () {
      if (audio.paused) {
        if (current && current !== audio) current.pause();
        current = audio; audio.play();
      } else audio.pause();
    });
    audio.addEventListener('play', function () { pb.innerHTML = ICON_PAUSE; });
    audio.addEventListener('pause', function () { pb.innerHTML = ICON_PLAY; });
    audio.addEventListener('ended', function () { pb.innerHTML = ICON_PLAY; fill.style.width = '0'; });
    audio.addEventListener('timeupdate', function () {
      var pct = audio.duration ? audio.currentTime / audio.duration * 100 : 0;
      fill.style.width = pct + '%'; bar.setAttribute('aria-valuenow', Math.round(pct));
      tm.textContent = fmt(audio.currentTime) + (audio.duration ? ' / ' + fmt(audio.duration) : '');
    });
    function seek(x) { var r = bar.getBoundingClientRect(); if (audio.duration) audio.currentTime = Math.min(1, Math.max(0, (x - r.left) / r.width)) * audio.duration; }
    bar.addEventListener('click', function (e) { seek(e.clientX); });
    bar.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') audio.currentTime += 5;
      if (e.key === 'ArrowLeft') audio.currentTime -= 5;
    });
  });
})();
