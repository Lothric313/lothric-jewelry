'use strict';

// Smooth vertical wheel movement without changing touch, keyboard or drawer scrolling.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mousePointer = window.matchMedia('(pointer: fine)');
  let frame = 0;
  let target = window.scrollY;
  let writtenPosition = window.scrollY;
  let lastTime = 0;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    target = window.scrollY;
  }

  function animate(time) {
    const elapsed = lastTime ? Math.min(64, time - lastTime) : 16.7;
    lastTime = time;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    target = Math.max(0, Math.min(maxScroll, target));
    const distance = target - window.scrollY;
    const settled = Math.abs(distance) < 1;
    // A one-pixel minimum avoids getting stuck on browsers that round scroll offsets.
    const step = Math.sign(distance) * Math.min(Math.abs(distance), Math.max(1, Math.abs(distance) * (1 - Math.exp(-elapsed / 95))));
    writtenPosition = settled ? target : window.scrollY + step;
    // Explicit instant writes avoid restarting CSS smooth scrolling every frame.
    window.scrollTo({ top: writtenPosition, behavior: 'instant' });
    if (settled) { frame = 0; lastTime = 0; }
    else frame = requestAnimationFrame(animate);
  }

  function hasLocalScroller(element) {
    for (let node = element; node && node !== document.body; node = node.parentElement) {
      if (node.matches('textarea, input, select, [contenteditable="true"], dialog')) return true;
      const overflow = getComputedStyle(node).overflowY;
      if (/(auto|scroll)/.test(overflow) && node.scrollHeight > node.clientHeight + 1) return true;
    }
    return false;
  }

  window.addEventListener('wheel', event => {
    if (event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey || event.shiftKey ||
        reducedMotion.matches || !mousePointer.matches || document.querySelector('dialog[open]') ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY || hasLocalScroller(event.target)) return;

    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    // Reversing the wheel reverses motion immediately, even during a long burst.
    if (frame && Math.sign(event.deltaY) !== Math.sign(target - window.scrollY)) target = window.scrollY;
    const nextTarget = Math.max(0, Math.min(maxScroll, (frame ? target : window.scrollY) + event.deltaY * unit));
    if (!frame && nextTarget === window.scrollY) return;
    event.preventDefault();
    target = nextTarget;
    if (!frame) { lastTime = 0; frame = requestAnimationFrame(animate); }
  }, { passive: false });

  // New direct input cancels momentum so links, dragging and keyboard stay precise.
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(type => {
    document.addEventListener(type, stop, { capture: true, passive: true });
  });
  window.addEventListener('resize', stop, { passive: true });
  window.addEventListener('blur', stop);
  window.addEventListener('scroll', () => {
    // A scrollbar drag or external scroll takes precedence over wheel momentum.
    if (frame && Math.abs(window.scrollY - writtenPosition) > 2) stop();
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  reducedMotion.addEventListener('change', stop);
  mousePointer.addEventListener('change', stop);
})();
