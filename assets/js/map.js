/*
 * Work map: plots every <article class="project" data-area="…"> as a point in a
 * t-SNE-style scatter, clustered by area. You shouldn't need to edit this file:
 * add, remove or re-group projects in index.html and the map follows.
 */
(function () {
  'use strict';

  // ---- Settings you might want to tweak ----
  var BACKGROUND_POINTS = 26; // faint points around each cluster
  var OUTLIERS = 8;           // faint points scattered between clusters
  var SEED = 11;              // change for a different (but stable) layout
  var DURATION = 1600;        // ms for the points to settle on page load

  var container = document.getElementById('work-map');
  var projects = Array.prototype.slice.call(document.querySelectorAll('.project[data-area]'));
  if (!container || !projects.length) return;

  var svg = container.querySelector('svg');
  var tip = container.querySelector('.map__tip');
  var NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Seeded random numbers so the layout is the same on every visit.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rand = mulberry32(SEED);
  function gauss() {
    var u = 0;
    while (!u) u = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function make(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  // ---- Layout, in normalised 0..1 coordinates ----
  var areas = [];
  projects.forEach(function (p) {
    if (areas.indexOf(p.dataset.area) === -1) areas.push(p.dataset.area);
  });

  var clusters = areas.map(function (name, i) {
    var n = areas.length;
    var angle = -Math.PI * 0.75 + (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.35;
    var r = n === 1 ? 0 : 0.92 + rand() * 0.16;
    return {
      name: name,
      colour: 'var(--area-' + ((i % 6) + 1) + ')',
      x: 0.5 + Math.cos(angle) * 0.3 * r,
      y: 0.55 + Math.sin(angle) * 0.26 * r,
      sx: 0.06 + rand() * 0.025,
      sy: 0.045 + rand() * 0.02,
      rot: rand() * Math.PI
    };
  });

  function sampleAround(c, spread) {
    var gx = gauss() * c.sx * spread;
    var gy = gauss() * c.sy * spread;
    var cos = Math.cos(c.rot), sin = Math.sin(c.rot);
    return {
      x: clamp(c.x + gx * cos - gy * sin, 0.03, 0.97),
      y: clamp(c.y + gx * sin + gy * cos, 0.06, 0.97)
    };
  }

  var points = [];
  clusters.forEach(function (c, ai) {
    for (var k = 0; k < BACKGROUND_POINTS; k++) {
      var p = sampleAround(c, 1);
      points.push({ x: p.x, y: p.y, area: ai, kind: 'dot' });
    }
  });
  for (var o = 0; o < OUTLIERS; o++) {
    points.push({
      x: 0.06 + rand() * 0.88, y: 0.1 + rand() * 0.84,
      area: Math.floor(rand() * clusters.length), kind: 'dot', outlier: true
    });
  }

  var featured = [];
  projects.forEach(function (el) {
    var ai = areas.indexOf(el.dataset.area);
    var c = clusters[ai];
    var p, tries = 0;
    // Keep featured points in the same cluster from sitting on top of each other.
    do {
      p = sampleAround(c, 0.5);
      tries++;
    } while (tries < 30 && featured.some(function (f) {
      return Math.hypot(f.x - p.x, f.y - p.y) < 0.07;
    }));
    var title = el.querySelector('h3');
    if (!el.id) el.id = 'project-' + (featured.length + 1);
    el.style.setProperty('--c', c.colour);
    var pt = { x: p.x, y: p.y, area: ai, kind: 'feat', el: el, title: title ? title.textContent.trim() : el.id };
    featured.push(pt);
    points.push(pt);
  });

  // Start every point somewhere random; they drift into their clusters.
  points.forEach(function (pt) {
    pt.sx = rand();
    pt.sy = rand();
    pt.delay = rand() * 350;
  });

  // ---- Build the SVG ----
  var dotLayer = make('g', {});
  var labelLayer = make('g', { 'aria-hidden': 'true' });
  var featLayer = make('g', {});
  svg.appendChild(dotLayer);
  svg.appendChild(labelLayer);
  svg.appendChild(featLayer);

  points.forEach(function (pt) {
    if (pt.kind === 'dot') {
      pt.node = make('circle', { r: 3.5, class: 'dot' + (pt.outlier ? ' is-outlier' : '') });
      pt.node.style.setProperty('--c', clusters[pt.area].colour);
      dotLayer.appendChild(pt.node);
    } else {
      var link = make('a', {
        href: '#' + pt.el.id,
        class: 'feat',
        'aria-label': pt.title + ' (' + clusters[pt.area].name + ')'
      });
      link.appendChild(make('circle', { r: 20, class: 'feat__hit' }));
      link.appendChild(make('circle', { r: 12, class: 'feat__ring' }));
      var dot = make('circle', { r: 7, class: 'feat__dot' });
      dot.style.setProperty('--c', clusters[pt.area].colour);
      link.appendChild(dot);
      pt.node = link;
      featLayer.appendChild(link);
      bindTip(pt);
    }
  });

  clusters.forEach(function (c) {
    c.label = make('text', { class: 'map__label' });
    c.label.textContent = c.name;
    labelLayer.appendChild(c.label);
  });

  // ---- Rendering ----
  var W = 0, H = 0;
  function measure() {
    W = container.clientWidth;
    H = Math.round(W * (W < 520 ? 1.08 : 0.74));
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    points.forEach(function (pt) {
      if (pt.kind === 'dot') pt.node.setAttribute('r', W < 520 ? 3 : 3.5);
    });
  }

  function place(pt, k) {
    var x = (pt.sx + (pt.x - pt.sx) * k) * W;
    var y = (pt.sy + (pt.y - pt.sy) * k) * H;
    pt.px = x; pt.py = y;
    if (pt.kind === 'dot') {
      pt.node.setAttribute('cx', x.toFixed(1));
      pt.node.setAttribute('cy', y.toFixed(1));
    } else {
      pt.node.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
    }
  }

  function placeLabels() {
    clusters.forEach(function (c, ai) {
      var top = Infinity, sum = 0, n = 0;
      points.forEach(function (pt) {
        if (pt.area !== ai || pt.outlier) return;
        top = Math.min(top, pt.y * H);
        sum += pt.x * W; n++;
      });
      var half = c.label.getComputedTextLength() / 2 + 6;
      var x = clamp(sum / n, half, W - half);
      c.label.setAttribute('x', x.toFixed(1));
      c.label.setAttribute('y', Math.max(18, top - 14).toFixed(1));
    });
  }

  var settled = false;
  function settle() {
    settled = true;
    points.forEach(function (pt) { place(pt, 1); });
    placeLabels();
    container.classList.add('is-settled');
  }

  function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

  function animate() {
    var start = null;
    var span = DURATION - 350;
    function frame(now) {
      if (settled) return;
      if (start === null) start = now;
      var elapsed = now - start;
      points.forEach(function (pt) {
        place(pt, easeOut(clamp((elapsed - pt.delay) / span, 0, 1)));
      });
      if (elapsed < DURATION) {
        requestAnimationFrame(frame);
      } else {
        settle();
      }
    }
    requestAnimationFrame(frame);
    // Animation frames can be throttled (background tabs, power saving), so
    // make sure the map always ends up in its final layout.
    setTimeout(function () { if (!settled) settle(); }, DURATION + 400);
  }

  // ---- Tooltip and highlighting ----
  function bindTip(pt) {
    function show() {
      tip.textContent = pt.title;
      tip.hidden = false;
      tip.style.left = pt.px + 'px';
      tip.style.top = pt.py + 'px';
      tip.classList.toggle('is-below', pt.py < 70);
      points.forEach(function (other) {
        if (other.area !== pt.area) other.node.classList.add('is-dim');
      });
    }
    function hide() {
      tip.hidden = true;
      points.forEach(function (other) { other.node.classList.remove('is-dim'); });
    }
    pt.node.addEventListener('mouseenter', show);
    pt.node.addEventListener('mouseleave', hide);
    pt.node.addEventListener('focus', show);
    pt.node.addEventListener('blur', hide);
  }

  // ---- Go ----
  measure();
  if (reduceMotion) {
    settle();
  } else {
    points.forEach(function (pt) { place(pt, 0); });
    animate();
  }

  // Label widths depend on the web font, so re-measure once it has loaded.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      if (settled) placeLabels();
    });
  }

  if ('ResizeObserver' in window) {
    var lastWidth = W;
    new ResizeObserver(function () {
      if (container.clientWidth === lastWidth) return;
      lastWidth = container.clientWidth;
      measure();
      if (settled) settle();
    }).observe(container);
  }
})();
