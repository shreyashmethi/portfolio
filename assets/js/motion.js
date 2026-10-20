/*
 * Page motion. Adds .motion to <html> so the hidden start states in style.css
 * only apply when this script runs; without it, the page is fully visible.
 *  - Hero: the name rises out of its line masks, then lede, actions, facts, chart.
 *  - Sections: parts arrive in reading order once, as they enter the viewport.
 *  - Fragments: the gate checklist ticks through; the claims flow runs while visible.
 *  - Header: takes a tone step once the page has scrolled.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  // Header tone step
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (!hasIO) return;
  root.classList.add('motion');

  // ---- Hero load sequence ----
  document.querySelectorAll('.hero__name .line > span').forEach(function (el, i) { el.style.setProperty('--i', i); });
  document.querySelectorAll('[data-hero]').forEach(function (el, i) { el.style.setProperty('--i', i); });
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('is-loaded'); }); });

  // ---- Section entrances, staggered in reading order within each block ----
  document.querySelectorAll('[data-reveal="list"]').forEach(function (list) {
    Array.prototype.forEach.call(list.children, function (c, i) { c.style.setProperty('--i', i); });
  });
  document.querySelectorAll('.project, .section__head, .contact__inner').forEach(function (group) {
    var parts = group.matches('[data-reveal]') ? [group] : group.querySelectorAll(':scope > [data-reveal]');
    Array.prototype.forEach.call(parts, function (el, i) { el.style.setProperty('--d', (i * 120) + 'ms'); });
  });

  // A fully clipped element never reports an intersection, so mask reveals
  // ("open") are triggered by a sentinel: their parent's position.
  var reveal = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target.__reveal || e.target;
      el.classList.add('is-in');
      reveal.unobserve(e.target);
      var gates = el.querySelector('[data-gates]');
      if (gates) runGates(gates);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    if (el.getAttribute('data-reveal') === 'open') {
      var sentinel = document.createElement('span');
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.className = 'reveal-sentinel';
      el.parentNode.insertBefore(sentinel, el);
      sentinel.__reveal = el;
      reveal.observe(sentinel);
    } else {
      reveal.observe(el);
    }
  });

  // ---- Gate checklist: ticks through once, then shows the verdict ----
  function runGates(el) {
    var items = el.querySelectorAll('li');
    if (reduce) {
      items.forEach(function (li) { li.classList.add('is-done'); });
      el.classList.add('is-verdict');
      return;
    }
    items.forEach(function (li, i) {
      setTimeout(function () { li.classList.add('is-done'); }, 700 + i * 380);
    });
    setTimeout(function () { el.classList.add('is-verdict'); }, 700 + items.length * 380 + 200);
  }

  // ---- Claims flow: a run advances step by step, holds at review, loops while visible ----
  var flow = document.querySelector('[data-flow]');
  if (flow) {
    var steps = flow.querySelectorAll('li');
    var reviewIndex = 3;
    var timer = null, idx = -1, visible = false;

    var paint = function () {
      steps.forEach(function (s, i) {
        s.classList.toggle('is-done', i < idx);
        s.classList.toggle('is-active', i === idx);
      });
    };
    var tick = function () {
      if (!visible) return;
      idx = idx >= steps.length ? -1 : idx + 1;
      paint();
      var wait = idx === reviewIndex ? 2200 : idx === steps.length ? 1600 : 750;
      timer = setTimeout(tick, wait);
    };

    if (reduce) {
      idx = reviewIndex; paint();
    } else {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        clearTimeout(timer);
        if (visible) timer = setTimeout(tick, 600);
      }, { threshold: 0.4 }).observe(flow);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { clearTimeout(timer); }
        else if (visible) { timer = setTimeout(tick, 400); }
      });
    }
  }
})();
