/* Tahy odhalují skutečné obrysy lokálního písma; bez JS zůstává text. */
(function () {
  var word = document.querySelector('.hero-handwriting');
  var script = document.currentScript;
  if (!word || !script || word.textContent.trim() !== 'fešák.') return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  var text = word.textContent;
  var observer, finishTimer;
  var frame;
  var played = false;
  var controller = new AbortController();
  var timeout = setTimeout(function () { controller.abort(); }, 1500);
  word.classList.add('is-preparing');

  function finish() {
    played = true;
    clearTimeout(finishTimer);
    cancelAnimationFrame(frame);
    word.classList.remove('is-preparing', 'is-writing');
    word.classList.add('is-written');
    if (observer) observer.disconnect();
  }

  function write() {
    if (played) return;
    if (reduced.matches) { finish(); return; }
    played = true;
    word.classList.remove('is-preparing');
    word.classList.add('is-writing');
    if (observer) observer.disconnect();
    var duration = Number(word.firstElementChild.getAttribute('data-pen-duration'));
    var strokes = Array.from(word.querySelectorAll('.pen-stroke')).map(function (stroke) {
      return {
        path:stroke,
        delay:Number(stroke.getAttribute('data-pen-delay')),
        time:Number(stroke.getAttribute('data-pen-time')),
        length:Number(stroke.getAttribute('stroke-dasharray'))
      };
    });
    var started = performance.now();
    function draw(now) {
      var elapsed = (now - started) / 1000;
      strokes.forEach(function (stroke) {
        var progress = Math.max(0, Math.min(1, (elapsed - stroke.delay) / stroke.time));
        if (progress === 0) return;
        var eased = progress * progress * (3 - 2 * progress);
        stroke.path.setAttribute('opacity', '1');
        stroke.path.setAttribute('stroke-dashoffset', stroke.length * (1 - eased));
      });
      if (elapsed < duration) frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    finishTimer = setTimeout(finish, duration * 1000 + 100);
  }

  fetch(new URL('fesak-tahy.svg', script.src), { signal:controller.signal })
    .then(function (response) {
      if (!response.ok) throw new Error('SVG unavailable');
      return response.text();
    }).then(function (source) {
      clearTimeout(timeout);
      var parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
      var svg = parsed.documentElement;
      if (svg.localName !== 'svg' || parsed.querySelector('parsererror')) throw new Error('Invalid SVG');
      var title = word.closest('h1');
      title.setAttribute('aria-label', word.previousElementSibling.textContent.trim() + ' ' + text);
      word.setAttribute('aria-hidden', 'true');
      word.replaceChildren(document.importNode(svg, true));
      if (!('IntersectionObserver' in window)) { write(); return; }
      observer = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) write();
      }, { threshold:0.25 });
      observer.observe(word);
    }).catch(function () {
      clearTimeout(timeout);
      if (word.querySelector('svg')) finish();
      else word.classList.remove('is-preparing');
    });

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) finish();
  });
  reduced.addEventListener('change', function (event) {
    if (event.matches) finish();
  });
})();
