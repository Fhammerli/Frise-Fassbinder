/* Fassbinder Explorer — statistiques anonymes GoatCounter
 * Mesure uniquement les rubriques ouvertes et des seuils de durée active.
 * Aucun titre de film, nom, année, réponse ou identifiant n'est transmis.
 */
(function () {
  'use strict';

  const IDLE_AFTER_MS = 45 * 1000;
  const TICK_MS = 1000;
  const ACTIVE_THRESHOLDS = [
    { seconds: 30, event: 'duree-active-30s', title: 'Durée active : au moins 30 secondes' },
    { seconds: 60, event: 'duree-active-1min', title: 'Durée active : au moins 1 minute' },
    { seconds: 120, event: 'duree-active-2min', title: 'Durée active : au moins 2 minutes' },
    { seconds: 300, event: 'duree-active-5min', title: 'Durée active : au moins 5 minutes' },
    { seconds: 600, event: 'duree-active-10min', title: 'Durée active : au moins 10 minutes' },
    { seconds: 1200, event: 'duree-active-20min', title: 'Durée active : au moins 20 minutes' },
    { seconds: 1800, event: 'duree-active-30min', title: 'Durée active : au moins 30 minutes' }
  ];
  const SECTION_CONTROLS = {
    peopleIndexButton: ['entourage', 'Entourage'],
    filmIndexButton: ['films', 'Films'],
    quizOpen: ['quiz', 'Quiz'],
    flashOpen: ['flashcards', 'Flashcards'],
    sourcesButton: ['sources', 'Sources']
  };

  const pendingEvents = [];
  const recordedSections = new Set();
  const recordedThresholds = new Set();
  let activeSeconds = 0;
  let lastActivityAt = Date.now();
  let windowFocused = document.hasFocus();

  function goatCounterReady() {
    return Boolean(window.goatcounter && typeof window.goatcounter.count === 'function');
  }

  function sendEvent(path, title) {
    const payload = { path, title, event: true };
    if (!goatCounterReady()) {
      pendingEvents.push(payload);
      return;
    }
    try {
      window.goatcounter.count(payload);
    } catch (_) {
      // Les statistiques ne doivent jamais perturber le site.
    }
  }

  function flushPendingEvents() {
    if (!goatCounterReady()) return;
    while (pendingEvents.length) {
      const payload = pendingEvents.shift();
      try {
        window.goatcounter.count(payload);
      } catch (_) {
        pendingEvents.unshift(payload);
        return;
      }
    }
  }

  function recordSection(key, label) {
    if (recordedSections.has(key)) return;
    recordedSections.add(key);
    sendEvent('rubrique-' + key, 'Rubrique : ' + label);
  }

  function markActivity() {
    lastActivityAt = Date.now();
  }

  function isActiveNow() {
    return document.visibilityState === 'visible' &&
      windowFocused &&
      Date.now() - lastActivityAt < IDLE_AFTER_MS;
  }

  function updateActiveTime() {
    flushPendingEvents();
    if (!isActiveNow()) return;
    activeSeconds += TICK_MS / 1000;
    ACTIVE_THRESHOLDS.forEach(function (threshold) {
      if (activeSeconds < threshold.seconds || recordedThresholds.has(threshold.event)) return;
      recordedThresholds.add(threshold.event);
      sendEvent(threshold.event, threshold.title);
    });
  }

  function recordTimelineWhenReady() {
    if (!document.body.classList.contains('is-loading')) {
      recordSection('frise', 'Frise');
      return;
    }
    const observer = new MutationObserver(function () {
      if (document.body.classList.contains('is-loading')) return;
      observer.disconnect();
      recordSection('frise', 'Frise');
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  document.addEventListener('click', function (event) {
    markActivity();
    const control = event.target.closest('[id]');
    if (!control || !SECTION_CONTROLS[control.id]) return;
    recordSection.apply(null, SECTION_CONTROLS[control.id]);
  }, true);

  ['keydown', 'pointerdown', 'touchstart', 'scroll'].forEach(function (eventName) {
    window.addEventListener(eventName, markActivity, { passive: true });
  });
  window.addEventListener('focus', function () {
    windowFocused = true;
    markActivity();
  });
  window.addEventListener('blur', function () {
    windowFocused = false;
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') markActivity();
  });

  recordTimelineWhenReady();
  setInterval(updateActiveTime, TICK_MS);
  setInterval(flushPendingEvents, 2000);
})();
