/*
 * Hero chart: an illustrative "ratchet" run. Each dot is one experiment round
 * in which an agent proposes a change to a model. A change is kept only if it
 * beats the current best (blue step line); everything else is reverted (grey).
 * Start (0%), end (+9.5%) and round count (425) match the real run; the path
 * between them is generated from a seed. "Replay the run" draws a new path.
 */
(function () {
  'use strict';

  var ROUNDS = 425;
  var FINAL = 9.5;
  var DURATION = 2400;
  var START_DELAY = 450;

  var host = document.getElementById('ratchet');
  if (!host) return;
  var svg = host.querySelector('svg');
  var replay = document.getElementById('replay');
  var NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function make(tag, attrs, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  // ---- Geometry ----
  var W = 640, H = 400, padL = 6, padR = 46, padT = 18, padB = 8;
  var yMin = -7, yMax = 11.5;
  function x(i) { return padL + (i / (ROUNDS - 1)) * (W - padL - padR); }
  function y(v) {
    v = Math.max(yMin, Math.min(yMax, v));
    return padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT - padB);
  }

  // ---- Static frame ----
  [-5, 0, 5, 10].forEach(function (t) {
    svg.appendChild(make('line', { x1: 0, x2: W - padR + 8, y1: y(t), y2: y(t), 'class': t === 0 ? 'zero' : 'grid' }));
    svg.appendChild(make('text', { x: W - padR + 14, y: y(t) + 4, 'class': 'tick' }, (t > 0 ? '+' : '') + t + '%'));
  });
  svg.appendChild(make('text', { x: 4, y: H - 14, 'class': 'tick' }, 'Round 1'));
  svg.appendChild(make('text', { x: x(ROUNDS - 1), y: H - 14, 'class': 'tick', 'text-anchor': 'end' }, 'Round 425'));

  var dotLayer = make('g', {});
  svg.appendChild(dotLayer);
  var line = make('path', { 'class': 'best' });
  svg.appendChild(line);
  var endLabel = make('text', { x: x(ROUNDS - 1), y: y(FINAL) - 32, 'class': 'end-label', 'text-anchor': 'end' }, '+9.5%');
  var endSub = make('text', { x: x(ROUNDS - 1), y: y(FINAL) - 14, 'class': 'end-sub', 'text-anchor': 'end' }, 'Recall@20%, kept changes only');
  svg.appendChild(endLabel);
  svg.appendChild(endSub);

  var rounds = [], dots = [];

  // ---- Simulate a run: proposals scatter around the best; gains get rarer ----
  function simulate(seed) {
    var rand = mulberry32(seed);
    function gauss() {
      var u = 0;
      while (!u) u = rand();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
    }
    var best = 0, out = [];
    for (var i = 0; i < ROUNDS; i++) {
      var progress = i / ROUNDS;
      var delta = gauss() * (1.5 - 0.5 * progress) - 1.5 - 0.9 * progress;
      var kept = delta > 0.08;
      var value = best + delta;
      if (kept) best = value;
      out.push({ v: value, kept: kept, best: best });
    }
    var scale = FINAL / best;
    out.forEach(function (r) { r.v *= scale; r.best *= scale; });
    return out;
  }

  function build(seed) {
    rounds = simulate(seed);
    while (dotLayer.firstChild) dotLayer.removeChild(dotLayer.firstChild);
    dots = rounds.map(function (r, i) {
      var c = make('circle', {
        cx: x(i).toFixed(1),
        cy: y(r.v).toFixed(1),
        r: r.kept ? 3.6 : 2.1,
        'class': r.kept ? 'dot--kept' : 'dot--reverted'
      });
      dotLayer.appendChild(c);
      return c;
    });
  }

  function pathUpTo(n) {
    var d = 'M' + x(0).toFixed(1) + ' ' + y(0).toFixed(1);
    var prev = 0;
    for (var i = 0; i < n; i++) {
      var b = rounds[i].best;
      if (b !== prev) { d += 'H' + x(i).toFixed(1) + 'V' + y(b).toFixed(1); prev = b; }
    }
    return d + 'H' + x(Math.max(0, n - 1)).toFixed(1);
  }

  var shown = -1;
  function show(n) {
    if (n === shown) return;
    for (var i = 0; i < dots.length; i++) dots[i].style.opacity = i < n ? '' : '0';
    line.setAttribute('d', pathUpTo(n));
    var done = n >= ROUNDS;
    endLabel.style.opacity = done ? '' : '0';
    endSub.style.opacity = done ? '' : '0';
    shown = n;
  }

  var running = false;
  function play(delay, done) {
    shown = -1;
    show(0);
    running = true;
    var t0 = null;
    function frame(t) {
      if (t0 === null) t0 = t + delay;
      var p = Math.max(0, Math.min(1, (t - t0) / DURATION));
      var eased = 1 - Math.pow(1 - p, 2.2);
      show(Math.round(eased * ROUNDS));
      if (p < 1) requestAnimationFrame(frame);
      else { running = false; if (done) done(); }
    }
    requestAnimationFrame(frame);
  }

  var seed = 7;
  build(seed);

  if (replay) {
    replay.hidden = false;
    replay.addEventListener('click', function () {
      if (running) return;
      seed += 1;
      build(seed);
      if (reduceMotion) { shown = -1; show(ROUNDS); return; }
      replay.disabled = true;
      play(0, function () { replay.disabled = false; replay.focus({ preventScroll: true }); });
    });
  }

  if (reduceMotion || !('IntersectionObserver' in window)) { show(ROUNDS); return; }

  show(0);
  var io = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    if (replay) replay.disabled = true;
    play(START_DELAY, function () { if (replay) replay.disabled = false; });
  }, { threshold: 0.3 });
  io.observe(host);
})();
