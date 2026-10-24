(function () {
  'use strict';

  var active = null;
  var ASSETS = {
    welcome: 'assets/ochazhok-illustrated-v2.webp',
    think: 'assets/ochazhok-illustrated-v2.webp',
    success: 'assets/ochazhok-illustrated-v2.webp'
  };
  var DEFAULT_TIP = 'Посмотри, что нужно получить в конце задания, и начни с одного действия. Здесь можно пробовать снова.';
  var DEFAULT_TEXT = 'Я рядом. Исследуй завод в своём темпе, а если понадобится — подскажу.';

  function mount(host) {
    if (typeof host === 'string') host = document.querySelector(host);
    if (!host || host.nodeType !== 1) return;
    if (active && active.host === host) return;
    destroy();

    var state = {
      host: host,
      scene: { id: '', title: 'На заводе', role: '', tip: DEFAULT_TIP },
      collapsed: false,
      tipIndex: 0,
      tween: null,
      timer: null,
      cleanups: [],
      observer: null,
      inView: true,
      visibilityObserver: null,
      motionOverride: null
    };
    active = state;
    host.innerHTML = '<section class="companion-card" aria-label="Очажок">' +
      '<header class="companion-header">' +
        '<img class="companion-mini" src="assets/ochazhok-illustrated-v2.webp" alt="" width="42" height="50">' +
        '<div class="companion-heading"><strong>Очажок рядом</strong></div>' +
        '<button class="companion-toggle" type="button" aria-expanded="true" aria-label="Свернуть напарника" title="Свернуть напарника"><span class="companion-toggle-label">Развернуть</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m7 14 5-5 5 5"/></svg></button>' +
      '</header>' +
      '<div class="companion-content">' +
        '<div class="companion-bubble"><span class="companion-scene">На заводе</span><p class="companion-speech" role="status" aria-live="polite" aria-atomic="true"></p></div>' +
        '<div class="companion-stage"><button class="companion-character" type="button" aria-label="Поговорить с Очажком" title="Поговорить с Очажком"><span class="companion-gesture"><span class="companion-breath"><img class="companion-image" src="assets/ochazhok-illustrated-v2.webp" alt="Очажок приветствует тебя" width="220" height="300" draggable="false"></span></span></button><span class="companion-floor" aria-hidden="true"></span></div>' +
        '<div class="companion-actions"><button class="companion-hint" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M9 18h6m-5 3h4M8.5 14.5a6 6 0 1 1 7 0c-.9.7-1.5 1.5-1.5 2.5h-4c0-1-.6-1.8-1.5-2.5Z"/></svg>Подскажи</button><span class="companion-action-note">Можно пробовать снова</span></div>' +
      '</div></section>';

    state.card = host.querySelector('.companion-card');
    state.content = host.querySelector('.companion-content');
    state.speech = host.querySelector('.companion-speech');
    state.sceneLabel = host.querySelector('.companion-scene');
    state.toggle = host.querySelector('.companion-toggle');
    state.image = host.querySelector('.companion-image');
    state.gesture = host.querySelector('.companion-gesture');
    state.media = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    function listen(target, event, fn) {
      target.addEventListener(event, fn);
      state.cleanups.push(function () { target.removeEventListener(event, fn); });
    }
    listen(state.toggle, 'click', function () {
      state.collapsed = !state.collapsed;
      state.card.classList.toggle('is-collapsed', state.collapsed);
      state.content.hidden = state.collapsed;
      state.toggle.setAttribute('aria-expanded', String(!state.collapsed));
      state.toggle.setAttribute('aria-label', state.collapsed ? 'Развернуть напарника' : 'Свернуть напарника');
      state.toggle.title = state.collapsed ? 'Развернуть напарника' : 'Свернуть напарника';
      syncMotion(state);
    });
    listen(host.querySelector('.companion-hint'), 'click', function () {
      react({ mood: 'think', text: state.scene.tip || DEFAULT_TIP });
    });
    listen(host.querySelector('.companion-character'), 'click', function () {
      var tips = [
        state.scene.tip || DEFAULT_TIP,
        'На участке «' + state.scene.title + '» начни с условия задачи. Выбери один шаг и проверь, что изменилось.',
        'Ты можешь вернуться к любому шагу. В задании «' + state.scene.title + '» спокойно пробуй разные решения.'
      ];
      react({ mood: 'welcome', text: tips[state.tipIndex % tips.length] });
      state.tipIndex += 1;
    });
    listen(document, 'ochakovo:coach', function (event) { react(event.detail || {}); });
    listen(document, 'ochakovo:motion', function (event) {
      if (event.detail && typeof event.detail.enabled === 'boolean') state.motionOverride = event.detail.enabled;
      syncMotion(state);
    });
    listen(document, 'visibilitychange', function () { syncMotion(state); });
    if (state.media) {
      var onMedia = function () { syncMotion(state); };
      if (state.media.addEventListener) listen(state.media, 'change', onMedia);
      else if (state.media.addListener) {
        state.media.addListener(onMedia);
        state.cleanups.push(function () { state.media.removeListener(onMedia); });
      }
    }
    if (window.MutationObserver && document.body) {
      state.observer = new MutationObserver(function () { syncMotion(state); });
      state.observer.observe(document.body, { attributes: true, attributeFilter: ['data-motion'] });
    }
    state.image.onerror = function () {
      var fallback = new URL(ASSETS.welcome, document.baseURI).href;
      if (state.image.src !== fallback) state.image.src = fallback;
    };
    state.speech.textContent = DEFAULT_TEXT;
    state.card.dataset.mood = 'welcome';
    if (window.IntersectionObserver) {
      state.visibilityObserver = new IntersectionObserver(function (entries) {
        state.inView = entries.some(function (entry) { return entry.isIntersecting; });
        syncMotion(state);
      });
      state.visibilityObserver.observe(state.card);
    }
    syncMotion(state);
  }

  function motionAllowed(state) {
    if (!state || state.collapsed || !state.inView || document.hidden) return false;
    if (document.body && document.body.dataset.motion === 'off') return false;
    if (state.media && state.media.matches) return false;
    if (state.motionOverride === false) return false;
    if (window.GameMotion && typeof window.GameMotion.enabled === 'function') {
      try { if (!window.GameMotion.enabled()) return false; } catch (_) { /* CSS and OS settings still apply. */ }
    }
    return true;
  }

  function stopGesture(state) {
    if (state.tween) { state.tween.kill(); state.tween = null; }
    if (state.timer) { clearTimeout(state.timer); state.timer = null; }
    state.gesture.classList.remove('is-gesturing-welcome', 'is-gesturing-think', 'is-gesturing-success');
    state.gesture.style.removeProperty('transform');
    state.gesture.style.removeProperty('will-change');
  }

  function syncMotion(state) {
    if (active !== state) return;
    var allowed = motionAllowed(state);
    state.card.dataset.paused = String(!allowed);
    if (!allowed) stopGesture(state);
  }

  function animateReaction(state, mood) {
    stopGesture(state);
    if (!motionAllowed(state)) return;
    var gsap = window.gsap;
    if (gsap && typeof gsap.fromTo === 'function') {
      var pose = mood === 'success' ? { y: -11, rotation: 3, scale: 1.025, duration: 0.26, ease: 'power2.out' } :
        mood === 'think' ? { y: 0, rotation: -4, scale: 1, duration: 0.32, ease: 'sine.inOut' } :
        { y: -3, rotation: 3, scale: 1.01, duration: 0.24, ease: 'sine.inOut' };
      state.gesture.style.willChange = 'transform';
      pose.repeat = 1;
      pose.yoyo = true;
      pose.overwrite = 'auto';
      pose.onComplete = function () {
        state.tween = null;
        state.gesture.style.removeProperty('transform');
        state.gesture.style.removeProperty('will-change');
      };
      state.tween = gsap.fromTo(state.gesture, { y: 0, rotation: 0, scale: 1 }, pose);
    } else {
      state.gesture.classList.add('is-gesturing-' + mood);
      state.timer = setTimeout(function () { stopGesture(state); }, 850);
    }
  }

  function setScene(scene) {
    var state = active;
    if (!state) return;
    scene = scene || {};
    state.scene = {
      id: String(scene.id || ''),
      title: String(scene.title || 'На заводе'),
      role: String(scene.role || ''),
      tip: String(scene.tip || DEFAULT_TIP)
    };
    state.tipIndex = 0;
    state.sceneLabel.textContent = state.scene.role || state.scene.title;
    state.sceneLabel.title = state.scene.title;
    react({ mood: 'welcome', text: DEFAULT_TEXT });
  }

  function react(reaction) {
    var state = active;
    if (!state) return;
    reaction = reaction || {};
    var mood = Object.prototype.hasOwnProperty.call(ASSETS, reaction.mood) ? reaction.mood : 'welcome';
    state.card.dataset.mood = mood;
    if (typeof reaction.text === 'string' && reaction.text.trim()) state.speech.textContent = reaction.text;
    var imageUrl = new URL(ASSETS[mood], document.baseURI).href;
    if (state.image.src !== imageUrl) state.image.src = imageUrl;
    state.image.alt = mood === 'success' ? 'Очажок радуется твоему успеху' : mood === 'think' ? 'Очажок задумался и помогает разобраться' : 'Очажок приветствует тебя';
    animateReaction(state, mood);
  }

  function destroy() {
    var state = active;
    if (!state) return;
    active = null;
    stopGesture(state);
    state.cleanups.forEach(function (cleanup) { cleanup(); });
    if (state.observer) state.observer.disconnect();
    if (state.visibilityObserver) state.visibilityObserver.disconnect();
    state.image.onerror = null;
    state.host.replaceChildren();
  }

  window.GameCompanion = { mount: mount, setScene: setScene, react: react, destroy: destroy };
}());
