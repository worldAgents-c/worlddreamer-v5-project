(() => {
  'use strict';
  const messages = {
    en: {
      sentenceEnd: '.', skip: 'Skip to content', home: 'World Agents home', navigation: 'Page navigation',
      language: 'Site language', simulation: 'Simulation', realWorld: 'Real world', results: 'Results', architecture: 'Architecture',
      tagline: "The world’s first open‑source unified World‑Action Model (WAM) for multi‑robot collaborative control.", resources: 'Project resources', report: 'Tech Report', code: 'Code',
      explore: 'Explore the demonstrations', simulationTitle: 'From intent to action',
      simulationIntro: 'Multi-Robot manipulation across collaborative tasks in',
      realTitle: 'Into the real world', realIntro: 'Collaborative manipulation on real robots, from coordinated placement to object retrieval and handover.',
      preparing: 'IN PREPARATION', comingSoon: 'COMING SOON', resultsTitle: 'Quantitative Results',
      resultsHeading: 'Results, with the full picture.', resultsIntro: 'Quantitative evaluations and experimental details will be released alongside the technical report.',
      reportForthcoming: 'REPORT FORTHCOMING', architectureTitle: 'Overall Architecture', figure: 'FIG. 01', overview: 'MODEL OVERVIEW',
      architectureHeading: 'A look inside WorldDreamer-V5-Lite', architectureIntro: 'The full architecture will be shared with the technical report.',
      architectureCaption: 'Architecture overview', inPreparation: 'In preparation', footer: 'Multi-agent control. More to come.', backToTop: 'Back to top',
      allCameras: 'ALL CAMERA VIEWS', taskDemo: 'Task demonstration', closeDialog: 'Close all camera views', synchronized: 'Complete, synchronized camera views',
      simulationRegion: 'Simulation demonstrations; hover to pause scrolling', simulationCarousel: 'Simulation carousel; scroll left or right',
      realRegion: 'Real-world demonstrations', realCarousel: 'Real-world carousel; scroll left or right',
      pauseScroll: 'Pause scroll', resumeScroll: 'Resume scroll', pauseSimulation: 'Pause simulation carousel scrolling', resumeSimulation: 'Resume simulation carousel scrolling',
      pauseReal: 'Pause real-world carousel scrolling', resumeReal: 'Resume real-world carousel scrolling',
      loading: 'Loading demonstration…', unavailable: 'Video unavailable', views: 'OVERVIEW · {count} VIEWS',
      simulationBadge: 'SIMULATION', realBadge: 'REAL WORLD', footage: 'FOOTAGE FORTHCOMING', allViews: 'All views ↗',
      cameraLabel: 'View all {count} camera views for {title}', pauseVideo: 'Pause {title} video', playVideo: 'Play {title} video',
      simulationVideo: '{title} simulation video', realVideo: '{title} real-world video',
      taskCount: '{count} TASKS', taskCountOne: '1 TASK', architectureAlt: 'WorldDreamer-V5-Lite model architecture', resultsAlt: 'WorldDreamer-V5-Lite quantitative results'
    },
    zh: {
      sentenceEnd: '。', skip: '跳转到正文', home: 'World Agents 首页', navigation: '页面导航',
      language: '网站语言', simulation: '仿真演示', realWorld: '真机演示', results: '量化结果', architecture: '总体架构',
      tagline: '世界上第一个面向多机器人协作控制的开源统一世界动作模型（WAM）。', resources: '项目资源', report: '技术报告', code: '代码',
      explore: '探索任务演示', simulationTitle: '从意图到行动', simulationIntro: '多机器人协作操作任务，基于',
      realTitle: '走进真实世界', realIntro: '真实机器人上的协作操作，涵盖协同放置、物品取出与传递。',
      preparing: '正在准备', comingSoon: '即将发布', resultsTitle: '量化结果',
      resultsHeading: '全面呈现实验结果', resultsIntro: '量化评估与实验细节将随技术报告一同发布。',
      reportForthcoming: '技术报告即将发布', architectureTitle: '总体架构', figure: '图 01', overview: '模型概览',
      architectureHeading: '了解 WorldDreamer-V5-Lite 的内部架构', architectureIntro: '完整架构将随技术报告一同公开。',
      architectureCaption: '架构概览', inPreparation: '正在准备', footer: '多智能体控制，更多内容即将发布。', backToTop: '返回顶部',
      allCameras: '全部相机视角', taskDemo: '任务演示', closeDialog: '关闭全部相机视角', synchronized: '完整、同步的相机视角',
      simulationRegion: '仿真演示；悬停可暂停滚动', simulationCarousel: '仿真视频带；可向左或向右滚动',
      realRegion: '真机演示', realCarousel: '真机视频带；可向左或向右滚动',
      pauseScroll: '暂停滚动', resumeScroll: '继续滚动', pauseSimulation: '暂停仿真视频带滚动', resumeSimulation: '继续仿真视频带滚动',
      pauseReal: '暂停真机视频带滚动', resumeReal: '继续真机视频带滚动',
      loading: '正在加载演示…', unavailable: '视频暂不可用', views: '总览 · {count} 个视角',
      simulationBadge: '仿真演示', realBadge: '真机演示', footage: '视频即将发布', allViews: '全部视角 ↗',
      cameraLabel: '查看“{title}”的全部 {count} 个相机视角', pauseVideo: '暂停“{title}”视频', playVideo: '播放“{title}”视频',
      simulationVideo: '“{title}”仿真视频', realVideo: '“{title}”真机视频',
      taskCount: '{count} 项任务', taskCountOne: '1 项任务', architectureAlt: 'WorldDreamer-V5-Lite 模型架构', resultsAlt: 'WorldDreamer-V5-Lite 量化结果'
    }
  };
  const storageKey = 'worlddreamer-v5-language';
  let language = 'en';
  try { if (window.localStorage.getItem(storageKey) === 'zh') language = 'zh'; } catch { /* Storage is optional. */ }
  const bindings = new Map();
  const t = (key, values = {}) => (messages[language][key] ?? messages.en[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
  const taskText = (task, field) => task.translations?.[language]?.[field] ?? task[field] ?? '';
  function render(el, attribute, value) {
    const text = typeof value === 'function' ? value() : t(value);
    if (attribute === 'textContent') el.textContent = text;
    else el.setAttribute(attribute, text);
  }
  function bind(el, value, attribute = 'textContent') {
    if (!bindings.has(el)) bindings.set(el, new Map());
    bindings.get(el).set(attribute, value);
    render(el, attribute, value);
    return el;
  }
  function applyLanguage(next) {
    language = next === 'zh' ? 'zh' : 'en';
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    bindings.forEach((attributes, el) => { if (el.isConnected) attributes.forEach((value, attribute) => render(el, attribute, value)); });
    document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
  }
  function init() {
    document.querySelectorAll('[data-i18n]').forEach(el => bind(el, el.getAttribute('data-i18n')));
    document.querySelectorAll('[data-i18n-aria]').forEach(el => bind(el, el.getAttribute('data-i18n-aria'), 'aria-label'));
    document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => {
      applyLanguage(button.dataset.language);
      try { window.localStorage.setItem(storageKey, language); } catch { /* Keep switching available when storage is blocked. */ }
    }));
    applyLanguage(language);
  }
  window.WORLD_DREAMER_I18N = { bind, t, taskText, init };
})();
