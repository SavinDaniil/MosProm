(() => {
  'use strict';
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  try { paused = localStorage.getItem('ochakovo-motion-paused') === 'yes'; } catch {}
  const tracked = new Set();
  let entrance = null;
  const enabled = () => !paused && !media.matches;
  function sync() {
    const on = enabled();
    document.body.dataset.motion = on ? 'on' : 'off';
    document.body.dataset.tabActive = document.hidden ? 'no' : 'yes';
    const button = document.getElementById('motion-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(!on));
      button.title = on ? 'Приостановить анимации' : 'Движение выключено';
      button.innerHTML = (on ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 5 10 7-10 7Z"/></svg>') + '<span>Анимации</span>';
    }
    tracked.forEach(animation => {
      if (!animation || !animation.parent) { tracked.delete(animation); return; }
      if (animation.repeat && animation.repeat() === -1) on && !document.hidden ? animation.resume() : animation.pause();
      else if (!on) { animation.progress(1); animation.kill(); tracked.delete(animation); }
    });
    document.dispatchEvent(new CustomEvent('ochakovo:motion', {detail:{enabled:on && !document.hidden}}));
  }
  window.GameMotion = {
    enabled,
    track(animation) { if (animation) { tracked.add(animation); if (!enabled()) animation.repeat && animation.repeat() === -1 ? animation.pause() : animation.progress(1); } return animation; },
    coach(detail) { document.dispatchEvent(new CustomEvent('ochakovo:coach', {detail})); },
    enter(root) {
      if (entrance) entrance.kill();
      if (!enabled() || !window.gsap) return;
      const elements = [...root.children].filter(el => !el.classList.contains('back-link')).slice(0,3);
      entrance = gsap.fromTo(elements,{y:12,opacity:.65},{y:0,opacity:1,duration:.4,stagger:.045,ease:'power2.out',clearProps:'transform,opacity'});
    },
    toggle() { paused = !paused; try { localStorage.setItem('ochakovo-motion-paused',paused?'yes':'no'); } catch {} sync(); }
  };
  document.getElementById('motion-toggle')?.addEventListener('click',window.GameMotion.toggle);
  media.addEventListener('change',sync);
  document.addEventListener('visibilitychange',sync);
  sync();
})();
