'use strict';

// One composition, four independent images. No media playback or frame sequence.
(() => {
  const hero = document.querySelector('#home');
  const stage = hero.querySelector('.hero-stage');
  const art = hero.querySelector('.hero-art');
  const logo = hero.querySelector('.hero-logo');
  const left = hero.querySelector('.hero-hand-left');
  const right = hero.querySelector('.hero-hand-right');
  const chain = hero.querySelector('.hero-chain');
  const copy = document.querySelector('#hero-copy');
  const bar = document.querySelector('#hero-progress');
  const header = document.querySelector('#header');
  const mobile = matchMedia('(max-width: 899px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  // Positions sampled across the six-second reference; linear interpolation
  // preserves the slow, continuous approach without starting timed animations.
  const poses = [
    // progress, logo scale, logo center Y (%), left X (%), right X (%)
    [0,    1,     50, -52,   50],
    [.083, .99,   51, -46,   50],
    [.167, .91,   53, -41,   46],
    [.25,  .84,   56, -36,   39],
    [.333, .75,   61, -31,   32],
    [.417, .66,   64, -26,   27],
    [.5,   .58,   67, -22,   22],
    [.583, .51,   70, -18,   17],
    [.667, .43,   73, -15,   13],
    [.75,  .35,   76, -11,    9],
    [.833, .28,   77,  -7,    5],
    [.917, .19,   77,  -3,    2],
    [1,    .167,  77,   0,    0]
  ];
  const clamp = n => Math.max(0, Math.min(1, n));
  function poseAt(progress) {
    const index = Math.max(1, poses.findIndex(pose => pose[0] >= progress));
    const a = poses[index - 1], b = poses[index];
    const t = clamp((progress - a[0]) / (b[0] - a[0]));
    return a.map((value, i) => value + (b[i] - value) * t);
  }
  function render() {
    frame = 0;
    const bounds = hero.getBoundingClientRect();
    header.classList.toggle('scrolled', bounds.bottom <= header.offsetHeight);
    if (mobile.matches) {
      for (const image of [logo, left, right, chain]) image.removeAttribute('style');
      copy.style.opacity = '1';
      copy.style.transform = '';
      copy.style.pointerEvents = '';
      copy.inert = false;
      bar.style.transform = 'scaleX(0)';
      return;
    }
    const progress = reducedMotion.matches ? 1 : clamp(-bounds.top / Math.max(1, hero.offsetHeight - stage.offsetHeight));
    const [, scale, y, leftX, rightX] = poseAt(progress);
    // Fit the opening wordmark inside tall desktop/tablet viewports, then
    // converge to the shared artwork coordinates for the final chain pose.
    const openingFit = Math.min(1, stage.clientWidth * .86 / (art.offsetWidth * .72));
    const fittedScale = scale * (openingFit + (1 - openingFit) * progress);
    logo.style.top = `${y}%`;
    logo.style.transform = `translate(-50%, -50%) scale(${fittedScale})`;
    left.style.transform = `translate3d(${leftX}%, ${-6 * (1 - progress)}%, 0)`;
    right.style.transform = `translate3d(${rightX}%, ${-6 * (1 - progress)}%, 0)`;
    chain.style.opacity = String(clamp((progress - .91) / .09));
    const fade = reducedMotion.matches ? 1 : clamp(1 - progress * 6);
    copy.style.opacity = String(fade);
    copy.style.transform = `translateY(${-progress * 45}px)`;
    copy.style.pointerEvents = fade < .1 ? 'none' : '';
    copy.inert = fade < .1;
    bar.style.transform = `scaleX(${progress})`;
  }
  function schedule() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(render);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  mobile.addEventListener('change', schedule);
  reducedMotion.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else schedule();
  });
  render();
})();
