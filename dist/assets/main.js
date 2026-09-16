(() => {
  'use strict';
  const data = window.WORLD_DREAMER;
  if (!data) return;
  const { bind, t, taskText, init: initLanguage } = window.WORLD_DREAMER_I18N;
  const node = (tag, className, text) => { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; };
  const resourceKeys = ['report', 'code', 'huggingFace'];
  document.querySelectorAll('.resource').forEach((button, i) => {
    const href = data.resources[resourceKeys[i]];
    if (!href) return;
    try { if (!['https:', 'http:'].includes(new URL(href).protocol)) return; } catch { return; }
    const link = node('a', button.className);
    link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
    Array.from(button.children).forEach(child => { if (!child.classList.contains('resource-status')) link.append(child.cloneNode(true)); });
    button.replaceWith(link);
  });
  function card(task, index, type) {
    const figure = node('figure', 'demo-card');
    const stage = node('div', `video-stage${task.src ? '' : ' empty-stage'}`);
    if (task.src) {
      const video = document.createElement('video');
      video.src = task.previewSrc || task.src; if (task.poster) video.poster = task.poster;
      video.muted = true; video.defaultMuted = true; video.loop = true; video.playsInline = true; video.preload = 'metadata';
      video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); bind(video, () => t(type === 'simulation' ? 'simulationVideo' : 'realVideo', { title: taskText(task, 'title') }), 'aria-label');
      video.dataset.task = task.id;
      if (task.views > 1 && !task.previewSrc) { stage.classList.add('overview-stage'); stage.style.setProperty('--views', task.views); }
      const loading = bind(node('span', 'video-loading'), 'loading');
      video.addEventListener('loadeddata', () => { loading.hidden = true; });
      video.addEventListener('error', () => { loading.hidden = false; bind(loading, 'unavailable'); stage.classList.add('has-error'); });
      stage.append(video, loading, bind(node('span', 'video-badge'), () => t(task.views > 1 ? 'views' : type === 'simulation' ? 'simulationBadge' : 'realBadge', { count: task.views })));
      const control = node('button', 'video-control');
      control.type = 'button'; bind(control, () => t('pauseVideo', { title: taskText(task, 'title') }), 'aria-label'); control.setAttribute('aria-pressed', 'false');
      control.append(node('span', 'pause-icon'));
      stage.append(control);
    } else {
      stage.append(node('span', 'empty-corner'), node('span', 'placeholder-task-number', String(index + 1).padStart(2, '0')), bind(node('span', 'placeholder-task-label'), 'footage'), node('span', 'empty-corner'));
    }
    const caption = node('figcaption', 'card-caption');
    const text = node('div'); text.append(bind(node('h3'), () => taskText(task, 'title')), bind(node('p'), () => taskText(task, 'subtitle')));
    caption.append(text);
    if (task.src && task.views > 1) { const view = bind(node('button', 'all-views'), 'allViews'); view.type = 'button'; view.dataset.task = task.id; bind(view, () => t('cameraLabel', { count: task.views, title: taskText(task, 'title') }), 'aria-label'); caption.append(view); }
    else caption.append(node('span', 'card-number', String(index + 1).padStart(2, '0')));
    figure.append(stage, caption); return figure;
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const carousels = [];
  const videoStates = new Map();
  const lastPlayheads = new Map();
  const pausedTasks = new Set();
  const tasksById = new Map([...data.simulation, ...data.realWorld].map(task => [task.id, task]));
  const dialog = document.getElementById('video-dialog');
  const fullVideo = document.getElementById('dialog-video');
  let dialogOpener = null;
  let dialogActive = false;
  let isDocumentVisible = !document.hidden;
  let usingKeyboard = false;
  let lastPointerType = null;

  // Pointer-restored button focus must not hold a carousel still after a dialog closes.
  // Keyboard focus keeps its pause behavior so controls remain easy to reach.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    usingKeyboard = true;
    carousels.forEach(c => { c.focus = c.viewport.contains(document.activeElement); });
  }, true);
  document.addEventListener('pointerdown', event => {
    usingKeyboard = false;
    lastPointerType = event.pointerType;
    carousels.forEach(c => { c.focus = false; if (lastPointerType !== 'mouse') c.hover = false; });
  }, true);

  function updateVideo(video) {
    const state = videoStates.get(video);
    if (!state) return;
    const userPaused = pausedTasks.has(video.dataset.task);
    const playAllowed = state.visible && isDocumentVisible && !dialogActive && !userPaused && (!reducedMotion.matches || state.userStarted);
    const button = video.parentElement.querySelector('.video-control');
    button.classList.toggle('is-paused', !playAllowed || state.blocked);
    button.setAttribute('aria-pressed', String(userPaused));
    bind(button, () => t(playAllowed && !state.blocked ? 'pauseVideo' : 'playVideo', { title: taskText(tasksById.get(video.dataset.task), 'title') }), 'aria-label');
    if (!playAllowed) { if (!video.paused) lastPlayheads.set(video.dataset.task, video.currentTime); video.pause(); return; }
    if (video.paused && !state.pending && !state.blocked) {
      const playingCopy = Array.from(videoStates.keys()).find(other => other !== video && other.dataset.task === video.dataset.task && !other.paused);
      const resumeTime = playingCopy ? playingCopy.currentTime : lastPlayheads.get(video.dataset.task);
      if (Number.isFinite(resumeTime) && Math.abs(video.currentTime - resumeTime) > 0.15) { try { video.currentTime = resumeTime; } catch { /* Metadata may still be loading. */ } }
      state.pending = true;
      video.play().then(() => { state.blocked = false; }).catch(error => { state.blocked = error.name !== 'AbortError'; }).finally(() => { state.pending = false; updateVideo(video); });
    }
  }
  const updateAllVideos = () => videoStates.forEach((_, video) => updateVideo(video));
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => { const video = entry.target.querySelector('video'); const state = videoStates.get(video); if (state) { state.visible = entry.isIntersecting && entry.intersectionRatio > 0.1; updateVideo(video); } });
  }, { threshold: [0, 0.1, 0.25] }) : null;

  function openFullVideo(taskId, opener) {
    const task = tasksById.get(taskId);
    if (!task?.src || !dialog || typeof dialog.showModal !== 'function') { if (task?.src) window.open(task.src, '_blank', 'noopener'); return; }
    dialogOpener = opener;
    bind(document.getElementById('dialog-title'), () => taskText(task, 'title'));
    fullVideo.src = task.src; if (task.poster && !task.previewSrc) fullVideo.poster = task.poster; else fullVideo.removeAttribute('poster');
    fullVideo.muted = true; fullVideo.currentTime = 0;
    dialogActive = true; updateAllVideos();
    carousels.forEach(c => { c.dialog = true; c.pointer = false; });
    dialog.showModal(); document.body.classList.add('dialog-open');
    fullVideo.play().catch(() => { /* Native controls remain available. */ });
  }
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => {
    fullVideo.pause(); fullVideo.removeAttribute('src'); fullVideo.load();
    dialogActive = false; document.body.classList.remove('dialog-open');
    if (dialogOpener?.isConnected) dialogOpener.focus({ preventScroll: true });
    carousels.forEach(c => {
      c.dialog = false;
      c.pointer = false;
      c.cooldownUntil = 0;
      c.focus = usingKeyboard && c.viewport.contains(document.activeElement);
      c.hover = lastPointerType === 'mouse' && c.marquee.matches(':hover');
    });
    updateAllVideos();
  });

  [['simulation', data.simulation], ['real-world', data.realWorld]].forEach(([type, tasks]) => {
    const track = document.getElementById(`${type}-track`);
    if (!track) return; // Unreleased sections stay commented out until their content is ready.
    const group = node('div', 'marquee-group');
    tasks.forEach((task, i) => group.append(card(task, i, type)));
    track.append(group);
    // Two repeated groups make the wrap invisible. Duplicates are removed from keyboard and assistive navigation.
    for (let copy = 0; copy < 2; copy++) {
      const repeated = node('div', 'marquee-group'); repeated.setAttribute('aria-hidden', 'true'); repeated.dataset.repeat = 'true';
      tasks.forEach((task, i) => repeated.append(card(task, i, type)));
      repeated.querySelectorAll('button').forEach(button => { button.tabIndex = -1; });
      track.append(repeated);
    }
    const viewport = track.parentElement;
    const marquee = viewport.parentElement;
    const toggle = document.querySelector(`[data-motion-for="${type}"]`);
    const state = { viewport, marquee, group, manualPaused: reducedMotion.matches, hover: false, focus: false, pointer: false, dialog: false, inView: false, cooldownUntil: 0, width: 0, last: 0, position: 0 };
    carousels.push(state);
    function updateToggle() { toggle.setAttribute('aria-pressed', String(state.manualPaused)); bind(toggle.querySelector('.motion-label'), state.manualPaused ? 'resumeScroll' : 'pauseScroll'); bind(toggle, `${state.manualPaused ? 'resume' : 'pause'}${type === 'simulation' ? 'Simulation' : 'Real'}`, 'aria-label'); }
    function measure() { const oldWidth = state.width; state.width = group.getBoundingClientRect().width; state.position = oldWidth ? state.width + ((state.position % oldWidth) / oldWidth) * state.width : state.width; viewport.scrollLeft = state.position; }
    toggle.addEventListener('click', () => { state.manualPaused = !state.manualPaused; updateToggle(); });
    marquee.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { lastPointerType = 'mouse'; state.hover = true; } });
    marquee.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') state.hover = false; });
    viewport.addEventListener('focusin', () => { state.focus = usingKeyboard; });
    viewport.addEventListener('focusout', event => { if (!viewport.contains(event.relatedTarget)) state.focus = false; });
    viewport.addEventListener('pointerdown', () => { state.pointer = true; });
    window.addEventListener('pointerup', () => { if (state.pointer) { state.pointer = false; state.cooldownUntil = performance.now() + 2500; } });
    window.addEventListener('pointercancel', () => { state.pointer = false; state.cooldownUntil = performance.now() + 2500; });
    viewport.addEventListener('wheel', () => { state.cooldownUntil = performance.now() + 2000; }, { passive: true });
    viewport.addEventListener('scroll', () => {
      const value = viewport.scrollLeft;
      // Native scroll rounds to whole pixels; preserve the fractional accumulator during autoplay.
      if (Math.abs(value - state.position) > 2) state.position = value;
      if (state.width && !state.focus && !state.pointer) {
        if (state.position >= state.width * 2) { state.position -= state.width; viewport.scrollLeft = state.position; }
        else if (state.position < state.width * 0.1) { state.position += state.width; viewport.scrollLeft = state.position; }
      }
    }, { passive: true });
    viewport.addEventListener('keydown', event => {
      if (event.target !== viewport || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); state.manualPaused = true; updateToggle();
      if (event.key === 'Home') viewport.scrollLeft = 0;
      else if (event.key === 'End') viewport.scrollLeft = Math.max(0, state.width - viewport.clientWidth);
      else viewport.scrollLeft += (event.key === 'ArrowRight' ? 1 : -1) * Math.min(400, viewport.clientWidth * 0.8);
      state.position = viewport.scrollLeft;
    });
    track.addEventListener('click', event => {
      const view = event.target.closest('.all-views');
      if (view) { openFullVideo(view.dataset.task, view); return; }
      const control = event.target.closest('.video-control');
      if (!control) return;
      const video = control.parentElement.querySelector('video');
      const videoState = videoStates.get(video);
      const shouldStart = video.paused || videoState.blocked;
      if (shouldStart) pausedTasks.delete(video.dataset.task); else pausedTasks.add(video.dataset.task);
      videoStates.forEach((s, v) => { if (v.dataset.task === video.dataset.task) { s.userStarted = shouldStart; s.blocked = false; updateVideo(v); } });
    });
    track.querySelectorAll('video').forEach(video => {
      videoStates.set(video, { visible: !observer, userStarted: false, blocked: false, pending: false });
      if (observer) observer.observe(video.parentElement); else updateVideo(video);
    });
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(viewport); else window.addEventListener('resize', measure);
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => { state.inView = entries[0].isIntersecting; }).observe(marquee); else state.inView = true;
    measure(); updateToggle();
    reducedMotion.addEventListener('change', () => { state.manualPaused = reducedMotion.matches; updateToggle(); });
  });

  function tick(now) {
    carousels.forEach(state => {
      const dt = Math.min(now - (state.last || now), 50); state.last = now;
      if (!isDocumentVisible || !state.inView || state.manualPaused || state.hover || state.focus || state.pointer || state.dialog || now < state.cooldownUntil || !state.width) return;
      state.position += dt * 0.028;
      if (state.position >= state.width * 2) state.position -= state.width;
      state.viewport.scrollLeft = state.position;
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  document.addEventListener('visibilitychange', () => { isDocumentVisible = !document.hidden; if (!isDocumentVisible) fullVideo.pause(); updateAllVideos(); });
  reducedMotion.addEventListener('change', updateAllVideos);

  const architecture = document.getElementById('architecture-content');
  if (architecture && data.architecture.src) {
    const image = node('img', 'research-image'); image.src = data.architecture.src; bind(image, () => taskText(data.architecture, 'alt'), 'alt'); image.loading = 'lazy';
    architecture.querySelector('.placeholder-center').replaceWith(image);
    bind(architecture.querySelector('figcaption'), () => taskText(data.architecture, 'caption') || t('architectureAlt'));
    document.querySelector('#architecture .release-tag').hidden = true;
  }
  const container = document.getElementById('results-content');
  if (container && (data.results.image || data.results.table)) {
    container.className = 'released-results'; container.replaceChildren();
    if (data.results.image) { const image = node('img', 'research-image'); image.src = data.results.image; bind(image, () => taskText(data.results, 'alt'), 'alt'); image.loading = 'lazy'; container.append(image); }
    if (data.results.table) {
      const wrapper = node('div', 'data-table-wrap'); const table = node('table', 'data-table'); const head = node('thead'); const headings = node('tr');
      data.results.table.columns.forEach(label => { const th = node('th', '', label); th.scope = 'col'; headings.append(th); }); head.append(headings);
      const body = node('tbody'); data.results.table.rows.forEach(row => { const tr = node('tr'); row.forEach(value => tr.append(node('td', '', String(value)))); body.append(tr); });
      table.append(head, body); wrapper.append(table); container.append(wrapper);
    }
    if (data.results.note) container.append(bind(node('p', 'result-note'), () => taskText(data.results, 'note')));
    document.querySelector('#results .release-tag').hidden = true;
  }
  initLanguage();
})();
