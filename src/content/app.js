// 学情プラス — 新しい画面（学情のデータを裏で読み込み、独自の画面で表示する）
// 提出・回答などの操作は学情本来の画面をシート内で開いて行う（作り直さない）
(() => {
  const GX = globalThis.GX;
  if (!GX.isTop || !GX.isPortalMain()) return;

  // ===== アイコン（Material Icons, Apache License 2.0） =====
  const ICONS = {
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    task: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
    mail: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    school: 'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z',
    apps: 'M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z',
    refresh: 'M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
    settings: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    clock: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
    search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    open: 'M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
    calendar: 'M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z',
    doneAll: 'M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z',
    attach: 'M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z',
    alert: 'M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
    checkCircle: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    logout: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
    swap: 'M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z',
    book: 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z',
    list: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
    check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    forum: 'M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z',
    download: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
    info: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
    link: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
    event_busy: 'M9.31 17l2.44-2.44L14.19 17l1.06-1.06-2.44-2.44 2.44-2.44L14.19 10l-2.44 2.44L9.31 10l-1.06 1.06 2.44 2.44-2.44 2.44L9.31 17zM19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z',
    quiz: 'M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z',
    poll: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z',
  };
  ICONS.calendar_alt = ICONS.calendar;

  // ===== 小さな DOM ヘルパ（文字列は必ずテキストノードとして入れる） =====
  const h = (tag, props, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (k in e && typeof v !== 'string') e[k] = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat(Infinity)) {
      if (k == null || k === false) continue;
      e.append(k instanceof Node ? k : String(k));
    }
    return e;
  };
  const icon = (name) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', ICONS[name] || ICONS.info);
    svg.appendChild(p);
    return svg;
  };

  // ===== 状態 =====
  const S = {
    settings: null,
    view: 'home',
    data: { reports: null, notices: null, grades: null, news: null },
    errors: {},
    loading: new Set(),
    taskFilter: 'open', // open | todo | temp | done | all
    taskType: 'all',
    taskQuery: '',
    taskSort: 'deadline',
    noticeQuery: '',
    noticeGenre: 'all',
    noticeMode: 'unread', // unread | genre
    noticeSort: 'newest',
    noticeGenreHref: 'all',
    selected: new Set(),
    gradeYear: 'all',
    schOffset: 0,
    schKind: 'all',
    classTab: 'timetable',
    rishuTermHref: null,
    sy: { name: '', teacher: '', code: '', keyword: '', nendo: String(new Date().getMonth() < 3 ? new Date().getFullYear() - 1 : new Date().getFullYear()) },
    syResult: null,
    gradeSort: 'no',
    sim: {}, // 成績の見通し：評価待ち科目の仮の点数
    pins: {}, // ピン留めした連絡（この端末のみ）
    med: null, // 医学科モード：講義概要から読み取った内容（この端末のみ）
    medWeek: 0,
    medQuery: '',
  };
  let host, root, appEl, mainEl, railEl, bottomEl, timerEl, refreshBtn, oldViewport;

  // ===== 画面の切替（新UI ⇔ 旧画面） =====
  const MODE_KEY = 'gx-mode';
  const setViewport = (on) => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (on) {
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        document.head.appendChild(meta);
        oldViewport = null;
      } else if (oldViewport === undefined) oldViewport = meta.content;
      meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    } else if (meta) {
      if (oldViewport) meta.content = oldViewport;
      else meta.remove();
    }
  };

  let fab;
  const showFab = () => {
    if (fab) return (fab.style.display = 'block');
    fab = document.createElement('div');
    const r = fab.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      button{position:fixed;right:20px;bottom:20px;z-index:2147483000;display:flex;align-items:center;gap:8px;height:52px;padding:0 20px;border:0;border-radius:16px;background:#d3e3fd;color:#041e49;font:600 14px system-ui,-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.25);cursor:pointer}
      button:hover{box-shadow:0 4px 12px rgba(0,0,0,.3)}
      svg{width:20px;height:20px;fill:currentColor}`;
    r.append(style, h('button', { title: '学情プラスの新しい画面に切り替えます' }, icon('swap'), '新しい画面'));
    r.querySelector('button').addEventListener('click', () => {
      sessionStorage.setItem(MODE_KEY, 'new');
      if (/[?&]tabId=/.test(location.search)) location.href = '/campusweb/campusportal.do?page=main';
      else {
        fab.style.display = 'none';
        openNewUi();
      }
    });
    document.documentElement.appendChild(fab);
  };

  const toClassic = (tabId) => {
    sessionStorage.setItem(MODE_KEY, 'classic');
    if (tabId) {
      location.href = `/campusweb/campusportal.do?page=main&tabId=${encodeURIComponent(tabId)}`;
      return;
    }
    host.style.display = 'none';
    document.documentElement.style.overflow = '';
    setViewport(false);
    showFab();
  };

  // ===== 起動 =====
  const openNewUi = () => {
    if (!host) build();
    host.style.display = 'block';
    document.documentElement.style.overflow = 'hidden';
    setViewport(true);
    if (!S.data.reports) {
      loadCache();
      render();
      if (!S.loading.size) loadAll();
    }
  };

  const applyTheme = () => {
    const t = S.settings.theme;
    const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    appEl.classList.toggle('dark', dark);
  };

  const NAV = [
    { id: 'home', label: 'ホーム', icon: 'home' },
    { id: 'tasks', label: '課題', icon: 'task' },
    { id: 'notices', label: '連絡', icon: 'mail' },
    { id: 'calendar', label: '予定', icon: 'calendar' },
    { id: 'classes', label: '授業', icon: 'book' },
    { id: 'grades', label: '成績', icon: 'school' },
    { id: 'more', label: 'その他', icon: 'apps' },
  ];

  const build = () => {
    host = document.createElement('div');
    host.id = 'gakujo-plus';
    root = host.attachShadow({ mode: 'open' });
    root.append(h('style', {}, GX.APP_CSS));
    timerEl = h('button', { class: 'timer', title: 'クリックで今すぐ延長', onclick: onTimerClick });
    refreshBtn = h('button', { class: 'icon-btn', title: '最新の情報に更新', onclick: () => loadAll(true) }, icon('refresh'));
    const top = h(
      'header',
      { class: 'top' },
      h('div', { class: 'brand' }, h('div', { class: 'logo' }, '学'), '学情プラス', h('small', {}, '新潟大学 学務情報システム')),
      h('div', { class: 'spacer' }),
      timerEl,
      h('button', { class: 'icon-btn', title: '全体を検索（課題・連絡・科目・成績）', onclick: () => openSearch() }, icon('search')),
      refreshBtn,
      h('button', { class: 'icon-btn', title: '旧画面に切り替える', onclick: () => toClassic() }, icon('swap')),
      h('button', { class: 'icon-btn', title: '設定', onclick: openSettings }, icon('settings'))
    );
    railEl = h('nav', { class: 'rail' });
    bottomEl = h('nav', { class: 'bottom' });
    mainEl = h('main', { class: 'main' });
    appEl = h('div', { class: 'app' }, top, h('div', { class: 'body' }, railEl, mainEl), bottomEl);
    root.append(appEl);
    document.documentElement.appendChild(host);
    applyTheme();
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
    GX.timer?.onChange(renderTimer);
    renderTimer();
    setInterval(() => {
      renderTimer();
      if (!root.querySelector('.scrim')) render(); // 締切までの残り時間を更新
    }, 60000);
    render();
  };

  // ===== トップバーのタイマー =====
  const renderTimer = () => {
    if (!timerEl) return;
    const t = GX.timer;
    const remain = t?.remaining();
    timerEl.replaceChildren(icon('clock'));
    if (remain == null) {
      timerEl.append('—');
      return;
    }
    const s = S.settings;
    let auto = '';
    if (s.extendEnabled) {
      const left = t.budgetLeft();
      auto = left === null ? '・自動延長' : left > 0 ? `・自動延長あと${Math.ceil(left)}分` : '・自動延長終了';
    }
    timerEl.append(`残り${remain}分`, h('span', { class: 'hide-sm' }, auto));
    timerEl.classList.toggle('low', remain <= 5);
  };
  const onTimerClick = () => {
    if (GX.timer?.extendNow()) snack('ログイン時間を延長しました');
  };

  // ===== 表示の高速化：前回の内容をこのタブの中だけに一時保存（タブを閉じると消える） =====
  const CACHE_KEY = 'gx-cache-v1';
  const reviveDates = (k, v) => (typeof v === 'string' && ['date', 'start', 'end'].includes(k) && /^\d{4}-\d\d-\d\dT/.test(v) ? new Date(v) : v);
  const saveCache = () => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data: S.data }));
    } catch (e) {}
  };
  const loadCache = () => {
    try {
      const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null', reviveDates);
      if (!c || Date.now() - c.t > 30 * 60000) return false;
      Object.keys(S.data).forEach((k) => c.data[k] != null && (S.data[k] = c.data[k]));
      return true;
    } catch (e) {
      return false;
    }
  };
  const clearCache = () => {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (e) {}
  };

  // 学情本来の画面（提出・登録など）をシートで開いている間は、裏での読み込みを止める。
  // 学情は同時に保持できる画面の数に上限があり、裏で読み込むと開いている画面が無効になるおそれがあるため
  let classicOpen = 0;
  let pendingReload = false;
  const isBusy = () => classicOpen > 0;

  // ===== データ読み込み =====
  const loaders = {
    reports: GX.fetchReports,
    notices: GX.fetchUnreadNotices,
    grades: GX.fetchGrades,
    news: GX.fetchNews,
  };
  const loadOne = async (key) => {
    if (isBusy()) {
      pendingReload = true;
      return;
    }
    S.loading.add(key);
    try {
      S.data[key] = await loaders[key]();
      delete S.errors[key];
      saveCache();
    } catch (e) {
      S.errors[key] = e;
      if (e instanceof GX.AuthError) {
        clearCache();
        onAuthLost();
      }
    } finally {
      S.loading.delete(key);
      refreshBtn?.classList.toggle('spin', S.loading.size > 0);
      render();
    }
  };
  const loadAll = async (force) => {
    if (isBusy()) {
      pendingReload = true;
      return;
    }
    if (S.loading.size) return;
    refreshBtn?.classList.add('spin');
    await Promise.all(Object.keys(loaders).map(loadOne));
    // 裏での読み込みでサーバー側は延長済みなので、学情側の残り時間表示も揃える
    const remain = GX.timer?.remaining();
    if (remain != null && remain < 18) GX.timer.extendNow();
    if (force) snack('最新の情報に更新しました');
  };
  let authNotified = false;
  const onAuthLost = () => {
    if (authNotified) return;
    authNotified = true;
    openSheet({
      title: 'ログインが切れました',
      body: h(
        'div',
        {},
        h('p', {}, '一定時間操作がなかったため、学情からログアウトされました。もう一度ログインしてください。'),
        h('button', { class: 'btn filled', onclick: () => (location.href = '/campusweb/campusportal.do') }, 'ログイン画面へ')
      ),
    });
  };

  // ===== 描画 =====
  const render = () => {
    if (!mainEl) return;
    const badges = {
      tasks: openTasks().filter((r) => GX.until(r.end).level === 'urgent').length || 0,
      notices: S.data.notices?.total || 0,
    };
    const navItem = (n) =>
      h(
        'button',
        {
          class: 'nav-item' + (S.view === n.id ? ' active' : ''),
          onclick: () => {
            S.view = n.id;
            S.selected.clear();
            mainEl.scrollTop = 0;
            render();
          },
        },
        h('div', { class: 'pill' }, icon(n.icon), badges[n.id] ? h('span', { class: 'badge' }, badges[n.id] > 99 ? '99+' : badges[n.id]) : null),
        n.label
      );
    railEl.replaceChildren(...NAV.map(navItem));
    bottomEl.replaceChildren(...NAV.map(navItem));
    const scroll = mainEl.scrollTop;
    const views = { home: viewHome, tasks: viewTasks, notices: viewNotices, calendar: viewCalendar, classes: viewClasses, grades: viewGrades, more: viewMore };
    mainEl.replaceChildren(h('div', { class: 'content' }, views[S.view]()));
    mainEl.scrollTop = scroll;
  };

  const errorBox = (key, tabId) =>
    S.errors[key]
      ? h(
          'div',
          { class: 'error' },
          icon('alert'),
          h('div', { style: { flex: 1 } }, `読み込めませんでした：${S.errors[key].message}`),
          h('button', { class: 'btn text', onclick: () => loadOne(key) }, '再試行'),
          tabId ? h('button', { class: 'btn text', onclick: () => openTab(tabId) }, '旧画面で開く') : null
        )
      : null;
  const skeleton = (n = 4) => Array.from({ length: n }, () => h('div', { class: 'skeleton' }));
  const empty = (iconName, text) => h('div', { class: 'empty' }, icon(iconName), text);

  const openTasks = () =>
    (S.data.reports || []).filter((r) => r.status !== 'done' && (!r.end || r.end.getTime() > Date.now()));
  const typeIcon = (type) => (/小テスト/.test(type) ? 'quiz' : /アンケート/.test(type) ? 'poll' : 'task');
  const levelColor = { urgent: 'red', soon: 'amber', later: 'green', past: 'gray', none: 'gray' };

  // ----- ホーム -----
  const viewHome = () => {
    const now = new Date();
    const tasks = openTasks().sort((a, b) => (effectiveDue(a)?.getTime() ?? Infinity) - (effectiveDue(b)?.getTime() ?? Infinity));
    const urgent = tasks.filter((t) => GX.until(t.end).level === 'urgent').length;
    const g = S.data.grades;
    const sum = g ? GX.summarizeGrades(g.list) : null;
    const notices = S.data.notices;
    const stat = (label, iconName, value, unit, view, alert) =>
      h(
        'button',
        { class: 'stat' + (alert ? ' alert' : ''), onclick: () => ((S.view = view), render()) },
        h('div', { class: 'label' }, icon(iconName), label),
        h('div', { class: 'value' }, value ?? '—', unit ? h('small', {}, unit) : null)
      );
    return h(
      'div',
      {},
      h('h1', {}, `${now.getMonth() + 1}月${now.getDate()}日（${'日月火水木金土'[now.getDay()]}）`),
      h(
        'p',
        { class: 'sub' },
        urgent ? `24時間以内に締切の課題が${urgent}件あります。` : tasks.length ? `期限内の未提出の課題が${tasks.length}件あります。` : '期限内の未提出の課題はありません。'
      ),
      h(
        'div',
        { class: 'grid cols-4' },
        stat('未提出の課題', 'task', S.data.reports ? tasks.length : null, '件', 'tasks', urgent > 0),
        stat('未読の連絡', 'mail', notices ? notices.total : null, '件', 'notices'),
        stat('修得単位', 'school', g?.earnedTotal ?? null, '単位', 'grades'),
        stat('平均点', 'poll', sum?.weightedAvg != null ? sum.weightedAvg.toFixed(1) : null, '点', 'grades')
      ),
      S.data.reports ? h('section', { class: 'card outlined', style: { marginTop: '16px' } }, h('div', { class: 'card-head' }, h('h2', {}, '今週の締切')), weekStrip()) : null,
      h(
        'div',
        { class: 'grid cols-2', style: { marginTop: '16px' } },
        medTodayCard(),
        todayCard(),
        pinsCard(),
        h(
          'section',
          { class: 'card outlined' },
          h('div', { class: 'card-head' }, h('h2', {}, '締切が近い課題'), h('button', { class: 'btn text', onclick: () => ((S.view = 'tasks'), render()) }, 'すべて表示')),
          errorBox('reports', 'en'),
          S.data.reports == null && !S.errors.reports ? skeleton(3) : null,
          S.data.reports && !tasks.length ? empty('checkCircle', '期限内の未提出の課題はありません') : null,
          h('div', { class: 'list' }, tasks.slice(0, 5).map(taskListItem))
        ),
        h(
          'section',
          { class: 'card outlined' },
          h('div', { class: 'card-head' }, h('h2', {}, '未読の連絡'), h('button', { class: 'btn text', onclick: () => ((S.view = 'notices'), render()) }, 'すべて表示')),
          errorBox('notices', 'kj'),
          notices == null && !S.errors.notices ? skeleton(3) : null,
          notices && !notices.items.length ? empty('doneAll', '未読の連絡はありません') : null,
          h('div', { class: 'list' }, (notices?.items || []).slice(0, 5).map((n) => noticeItem(n, false)))
        ),
        h(
          'section',
          { class: 'card outlined' },
          h('div', { class: 'card-head' }, h('h2', {}, '授業の新着')),
          errorBox('news', 'rs'),
          S.data.news == null && !S.errors.news ? skeleton(3) : null,
          S.data.news && !S.data.news.length ? empty('info', '新着はありません') : null,
          h(
            'div',
            { class: 'list' },
            (S.data.news || []).slice(0, 6).map((n) =>
              h(
                'button',
                { class: 'item', onclick: () => openNews(n) },
                h('div', { class: 'lead ' + (n.kind === 'notice' ? '' : 'amber') }, icon(n.kind === 'notice' ? 'mail' : n.kind === 'quiz' ? 'quiz' : 'task')),
                h('div', { class: 'txt' }, h('div', { class: 't1' }, n.text), h('div', { class: 't2' }, n.date))
              )
            )
          )
        ),
        h(
          'section',
          { class: 'card outlined' },
          h('div', { class: 'card-head' }, h('h2', {}, 'よく使う機能'), null),
          h(
            'div',
            { class: 'tiles' },
            [
              ['予定・休講補講', 'calendar', () => (S.view = 'calendar')],
              ['時間割', 'list', () => ((S.view = 'classes'), (S.classTab = 'timetable'))],
              ['シラバス検索', 'search', () => ((S.view = 'classes'), (S.classTab = 'syllabus'))],
              ['出欠', 'check', () => ((S.view = 'classes'), (S.classTab = 'attendance'))],
            ].map(([label, ic, go]) =>
              h('button', { class: 'tile', onclick: () => (go(), (mainEl.scrollTop = 0), render()) }, h('div', { class: 'lead' }, icon(ic)), label)
            )
          )
        )
      )
    );
  };

  const taskListItem = (r) => {
    const u = GX.until(r.end);
    return h(
      'button',
      { class: 'item', onclick: () => r.main && openReportAction(r, r.main) },
      h('div', { class: `lead ${levelColor[u.level]}` }, icon(typeIcon(r.type))),
      h('div', { class: 'txt' }, h('div', { class: 't1' }, r.title), h('div', { class: 't2' }, myDue(r) ? `${r.course}・自分の締切 ${GX.fmtDate(myDue(r))}` : `${r.course}・${GX.fmtDate(r.end)}締切`)),
      h('div', { class: 'trail' }, h('span', { class: `chip ${(myDue(r) ? GX.until(myDue(r)) : u).level}` }, (myDue(r) ? GX.until(myDue(r)) : u).text), progressChip(r), r.status === 'temp' ? h('span', { class: 'chip blue' }, '一時保存') : null)
    );
  };

  // ----- 課題 -----
  const viewTasks = () => {
    const all = S.data.reports || [];
    const now = Date.now();
    const q = S.taskQuery.trim().toLowerCase();
    const types = [...new Set(all.map((r) => r.type).filter(Boolean))];
    let list = all.filter((r) => {
      const past = r.end && r.end.getTime() <= now;
      if (S.taskFilter === 'open' && (r.status === 'done' || past)) return false;
      if (S.taskFilter === 'todo' && r.status !== 'todo') return false;
      if (S.taskFilter === 'temp' && r.status !== 'temp') return false;
      if (S.taskFilter === 'done' && r.status !== 'done') return false;
      if (S.taskType !== 'all' && r.type !== S.taskType) return false;
      if (q && !`${r.title} ${r.course} ${r.code}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const sorters = {
      deadline: (a, b) => {
        const pa = a.end && a.end.getTime() <= now;
        const pb = b.end && b.end.getTime() <= now;
        if (pa !== pb) return pa ? 1 : -1;
        return pa ? b.end - a.end : (effectiveDue(a)?.getTime() ?? Infinity) - (effectiveDue(b)?.getTime() ?? Infinity);
      },
      newest: (a, b) => (b.start?.getTime() ?? 0) - (a.start?.getTime() ?? 0),
      course: (a, b) => a.code.localeCompare(b.code) || (a.end ?? 0) - (b.end ?? 0),
      title: (a, b) => a.title.localeCompare(b.title, 'ja'),
    };
    list = list.sort(sorters[S.taskSort]);
    const counts = {
      open: all.filter((r) => r.status !== 'done' && !(r.end && r.end.getTime() <= now)).length,
      todo: all.filter((r) => r.status === 'todo').length,
      temp: all.filter((r) => r.status === 'temp').length,
      done: all.filter((r) => r.status === 'done').length,
      all: all.length,
    };
    const fchip = (key, label, cur, set) =>
      h('button', { class: 'fchip' + (cur === key ? ' on' : ''), onclick: () => (set(key), render()) }, label);
    const exportable = openTasks().filter((r) => r.end);
    return h(
      'div',
      {},
      h('h1', {}, '課題'),
      h('p', { class: 'sub' }, 'レポート・小テスト・アンケート'),
      h(
        'div',
        { class: 'toolbar' },
        h(
          'label',
          { class: 'search' },
          icon('search'),
          h('input', {
            type: 'search',
            placeholder: '課題名・科目名で検索',
            value: S.taskQuery,
            oninput: (e) => {
              S.taskQuery = e.target.value;
              const pos = e.target.selectionStart;
              render();
              const inp = mainEl.querySelector('input[type="search"]');
              inp.focus();
              inp.setSelectionRange(pos, pos);
            },
          })
        ),
        h(
          'select',
          { onchange: (e) => ((S.taskSort = e.target.value), render()), title: '並べ替え' },
          [
            ['deadline', '締切が近い順'],
            ['newest', '新しい順'],
            ['course', '科目順'],
            ['title', 'タイトル順'],
          ].map(([v, l]) => h('option', { value: v, selected: S.taskSort === v }, l))
        ),
        h(
          'button',
          {
            class: 'btn tonal',
            disabled: !exportable.length,
            title: '期限内の未提出の課題の締切を .ics ファイルに書き出します（1日前に通知）',
            onclick: () => {
              GX.download('gakujo-deadlines.ics', GX.toIcs(exportable));
              snack(`${exportable.length}件の締切をカレンダー形式で書き出しました`);
            },
          },
          icon('calendar'),
          'カレンダーに追加'
        )
      ),
      h(
        'div',
        { class: 'filters' },
        fchip('open', `期限内の未提出 ${counts.open}`, S.taskFilter, (v) => (S.taskFilter = v)),
        fchip('todo', `未提出 ${counts.todo}`, S.taskFilter, (v) => (S.taskFilter = v)),
        fchip('temp', `一時保存 ${counts.temp}`, S.taskFilter, (v) => (S.taskFilter = v)),
        fchip('done', `提出済 ${counts.done}`, S.taskFilter, (v) => (S.taskFilter = v)),
        fchip('all', `すべて ${counts.all}`, S.taskFilter, (v) => (S.taskFilter = v))
      ),
      types.length > 1
        ? h(
            'div',
            { class: 'filters' },
            fchip('all', '全種別', S.taskType, (v) => (S.taskType = v)),
            types.map((t) => fchip(t, t, S.taskType, (v) => (S.taskType = v)))
          )
        : null,
      errorBox('reports', 'en'),
      S.data.reports == null && !S.errors.reports ? skeleton(5) : null,
      S.data.reports && !list.length ? empty('checkCircle', '該当する課題はありません') : null,
      list.map(taskCard)
    );
  };

  const statusChip = (r) =>
    ({
      todo: h('span', { class: 'chip red' }, '未提出'),
      temp: h('span', { class: 'chip blue' }, '一時保存'),
      done: h('span', { class: 'chip ok' }, '提出済'),
    })[r.status] || h('span', { class: 'chip' }, r.statusText || '—');

  const taskCard = (r) => {
    const u = GX.until(r.end);
    const active = r.status !== 'done' && u.level !== 'past';
    return h(
      'div',
      { class: `task ${active ? u.level : u.level === 'past' ? 'past' : ''}` },
      h(
        'div',
        { class: 'txt' },
        h('div', { class: 'course' }, `${r.type}・${r.course}（${r.code}）`),
        h('div', { class: 'title' }, r.title),
        h(
          'div',
          { class: 'meta' },
          statusChip(r),
          progressChip(r),
          active && u.text ? h('span', { class: `chip ${u.level}` }, u.text) : null,
          active && myDue(r) ? h('span', { class: `chip ${GX.until(myDue(r)).level}` }, `自分の締切 ${GX.fmtDate(myDue(r))}（${GX.until(myDue(r)).text}）`) : null,
          h('span', { class: 'note' }, `${GX.fmtDate(r.start)} 〜 ${GX.fmtDate(r.end)}`)
        ),
        myTask(r).memo ? h('div', { class: 'note', style: { marginTop: '6px', whiteSpace: 'pre-wrap' } }, `メモ：${myTask(r).memo.slice(0, 120)}`) : null
      ),
      h(
        'div',
        { class: 'actions' },
        r.actions
          .filter((a) => a.eventId !== 'delete' && !/取消/.test(a.label) && !a.disabled)
          .map((a) =>
            h(
              'button',
              { class: 'btn ' + (a.eventId === 'answer' ? 'filled' : 'outline'), onclick: () => openReportAction(r, a) },
              a.label
            )
          ),
        h('button', { class: 'btn text', onclick: () => editMyTask(r) }, '自分用メモ')
      )
    );
  };

  // 学情本来の提出・確認画面をシート内に開く（操作そのものは学情の画面で行う）
  const openReportAction = (r, a) => {
    const frame = h('iframe', { title: r.title });
    let first = true;
    frame.addEventListener('load', () => {
      if (!first) return;
      first = false;
      try {
        const doc = frame.contentDocument;
        const form = doc.forms.EnqKeyForm || doc.getElementById('enqKeyForm');
        if (!form) throw new Error('form not found');
        const set = (n, v) => form.querySelector(`[name="${n}"]`) && (form.querySelector(`[name="${n}"]`).value = v);
        set('_eventId', a.eventId);
        set('enqType', a.enqType);
        set('seqNo', a.seqNo);
        set('jikanwariNendo', a.jikanwariNendo);
        set('jikanwariShozokucd', a.jikanwariShozokucd);
        set('jikanwaricd', a.jikanwaricd);
        form.submit();
      } catch (e) {
        snack('提出画面を直接開けなかったため、一覧を表示しています');
      }
    });
    frame.src = GX.flowUrl(GX.FLOWS.reports);
    openSheet({
      title: `${a.label}：${r.title}`,
      body: frame,
      wide: true,
      flush: true,
      classic: true,
      onClose: () => setTimeout(() => loadOne('reports'), 0),
    });
  };

  const openClassicSheet = (title, url) => {
    openSheet({ title, body: h('iframe', { src: url, title }), wide: true, flush: true, classic: true });
  };

  // 学情の各タブ（休講補講・シラバス・履修など）を、新しい画面のまま シート内で開く。
  // 画面を移動しないので、閉じればそのまま新しい画面に戻る。
  const openTab = (tabId, label) => {
    if (tabId === 'home') return toClassic(); // 旧画面のHOMEだけは画面ごと切り替える
    const tab = GX.CLASSIC_TABS.find((t) => t.id === tabId);
    const title = label || tab?.label || '学情';
    const frame = h('iframe', { title });
    const menuBar = h('div', { class: 'filters', style: { padding: '10px 16px', margin: 0, flex: 'none', borderBottom: '1px solid var(--outline-v)' } });
    const body = h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } }, menuBar, h('div', { style: { flex: 1, minHeight: 0 } }, frame));
    const sheet = openSheet({ title, body, wide: true, flush: true, classic: true });
    menuBar.append(h('span', { class: 'note' }, '読み込み中…'));
    GX.fetchTabMenus(tabId)
      .then((menus) => {
        if (!menus.length) throw new Error('メニューが見つかりません');
        const show = (m) => {
          frame.src = m.url;
          sheet.setTitle(menus.length > 1 ? `${title}：${m.label}` : m.label);
          menuBar.querySelectorAll('.fchip').forEach((b) => b.classList.toggle('on', b.dataset.url === m.url));
        };
        menuBar.replaceChildren(
          ...menus.map((m) => h('button', { class: 'fchip', 'data-url': m.url, onclick: () => show(m) }, m.label))
        );
        if (menus.length === 1) menuBar.style.display = 'none';
        show(menus[0]);
      })
      .catch((e) => {
        if (e instanceof GX.AuthError) return onAuthLost();
        menuBar.replaceChildren(
          h('span', { class: 'note' }, `開けませんでした（${e.message}）。`),
          h('button', { class: 'btn text', onclick: () => toClassic(tabId) }, '旧画面に切り替えて開く')
        );
      });
  };

  // ----- 連絡 -----
  const noticeItem = (n, selectable, showUnread) => {
    const checked = S.selected.has(n.seqNo);
    return h(
      'div',
      { class: 'item' + (n.unread ? ' unread' : ''), style: { cursor: 'pointer' }, onclick: () => openNotice(n) },
      selectable
        ? h('input', {
            type: 'checkbox',
            class: 'check',
            checked,
            disabled: !n.unread,
            style: n.unread ? null : { visibility: 'hidden' },
            onclick: (e) => {
              e.stopPropagation();
              if (e.target.checked) S.selected.add(n.seqNo);
              else S.selected.delete(n.seqNo);
              render();
            },
            'aria-label': '選択',
          })
        : null,
      h('div', { class: 'lead' + (n.important ? ' red' : n.unread ? '' : ' gray') }, icon(n.important ? 'alert' : 'mail')),
      h(
        'div',
        { class: 'txt' },
        h('div', { class: 't1' }, n.title),
        h('div', { class: 't2' }, [n.genre, n.course, n.dept, n.sender].filter(Boolean).join('・'))
      ),
      h(
        'div',
        { class: 'trail' },
        n.date ? GX.fmtDate(n.date, false) : n.dateText,
        n.important ? h('span', { class: 'chip red' }, '重要') : null,
        showUnread && n.unread ? h('span', { class: 'chip blue' }, '未読') : null
      )
    );
  };

  // ジャンル別一覧（既読を含む）の読み込み。結果はこの画面を開いている間だけ保持
  const genreCache = new Map();
  let genreLoading = false;
  const loadGenres = async (genres) => {
    const need = genres.filter((g) => !genreCache.has(g.href));
    if (!need.length || genreLoading) return;
    genreLoading = true;
    render();
    try {
      for (const g of need) genreCache.set(g.href, await GX.fetchGenreNotices(g.href));
    } catch (e) {
      snack(`読み込めませんでした：${e.message}`);
      if (e instanceof GX.AuthError) onAuthLost();
    } finally {
      genreLoading = false;
      render();
    }
  };

  const NOTICE_SORTS = [
    ['newest', '新しい順'],
    ['oldest', '古い順'],
    ['genre', '種類順（種類ごとにまとめる）'],
    ['important', '重要を先頭に'],
    ['sender', '差出人順'],
  ];
  const sortNotices = (list) => {
    const t = (n) => n.date?.getTime() ?? 0;
    const by = {
      newest: (a, b) => t(b) - t(a),
      oldest: (a, b) => t(a) - t(b),
      genre: (a, b) => (a.genre || '').localeCompare(b.genre || '', 'ja') || t(b) - t(a),
      important: (a, b) => b.important - a.important || t(b) - t(a),
      sender: (a, b) => `${a.dept}${a.sender}`.localeCompare(`${b.dept}${b.sender}`, 'ja') || t(b) - t(a),
    };
    return [...list].sort(by[S.noticeSort] || by.newest);
  };

  const viewNotices = () => {
    const d = S.data.notices;
    const unreadItems = d?.items || [];
    const genreMode = S.noticeMode === 'genre';
    const genres = (d?.genres || []).filter((g) => g.count > 0);
    let base;
    if (genreMode) {
      const targets = S.noticeGenreHref === 'all' ? genres : genres.filter((g) => g.href === S.noticeGenreHref);
      if (targets.some((g) => !genreCache.has(g.href))) setTimeout(() => loadGenres(targets), 0);
      base = targets.flatMap((g) => genreCache.get(g.href) || []);
    } else {
      base = unreadItems;
    }
    const q = S.noticeQuery.trim().toLowerCase();
    const list = sortNotices(
      base.filter(
        (n) =>
          (genreMode || S.noticeGenre === 'all' || (S.noticeGenre === 'important' ? n.important : n.genre === S.noticeGenre)) &&
          (!q || `${n.title} ${n.dept} ${n.sender} ${n.course} ${n.genre}`.toLowerCase().includes(q))
      )
    );
    const selectable = list.filter((n) => n.unread);
    const sel = [...S.selected].filter((s) => base.some((n) => n.seqNo === s && n.unread));
    const allChecked = selectable.length > 0 && selectable.every((n) => S.selected.has(n.seqNo));
    const modeBtn = (key, label) =>
      h('button', { class: 'fchip' + (S.noticeMode === key ? ' on' : ''), onclick: () => ((S.noticeMode = key), S.selected.clear(), render()) }, label);
    const fchip = (key, label) =>
      h('button', { class: 'fchip' + (S.noticeGenre === key ? ' on' : ''), onclick: () => ((S.noticeGenre = key), render()) }, label);
    const gchip = (href, label) =>
      h('button', { class: 'fchip' + (S.noticeGenreHref === href ? ' on' : ''), onclick: () => ((S.noticeGenreHref = href), render()) }, label);
    const unreadGenres = [...new Set(unreadItems.map((n) => n.genre).filter(Boolean))];

    // 種類順のときは種類ごとに見出しを付ける
    const rows = [];
    let lastGenre = null;
    list.forEach((n) => {
      if (S.noticeSort === 'genre' && n.genre !== lastGenre) {
        lastGenre = n.genre;
        rows.push(h('div', { class: 'section-title' }, `${n.genre || '（種類なし）'}（${list.filter((x) => x.genre === n.genre).length}件）`));
      }
      rows.push(noticeItem(n, true, genreMode));
    });

    return h(
      'div',
      {},
      h('h1', {}, '連絡'),
      h('p', { class: 'sub' }, d ? `未読 ${d.total} 件（開くと既読になります）` : '連絡通知'),
      h('div', { class: 'filters' }, modeBtn('unread', `未読 ${d?.total ?? ''}`), modeBtn('genre', '種類別（既読を含む）')),
      h(
        'div',
        { class: 'toolbar' },
        h(
          'label',
          { class: 'search' },
          icon('search'),
          h('input', {
            type: 'search',
            placeholder: '表題・差出人・科目で検索',
            value: S.noticeQuery,
            oninput: (e) => {
              S.noticeQuery = e.target.value;
              const pos = e.target.selectionStart;
              render();
              const inp = mainEl.querySelector('input[type="search"]');
              inp.focus();
              inp.setSelectionRange(pos, pos);
            },
          })
        ),
        h(
          'select',
          { title: '並べ替え', onchange: (e) => ((S.noticeSort = e.target.value), render()) },
          NOTICE_SORTS.map(([v, l]) => h('option', { value: v, selected: S.noticeSort === v }, l))
        ),
        h('button', { class: 'icon-btn', title: '添付ファイルをまとめて保存', onclick: () => openBulkAttach(list) }, icon('download'))
      ),
      genreMode
        ? h(
            'div',
            { class: 'filters' },
            gchip('all', 'すべての種類'),
            genres.map((g) => gchip(g.href, `${g.name} ${g.count}${g.unread ? `（未読${g.unread}）` : ''}`))
          )
        : h(
            'div',
            { class: 'filters' },
            fchip('all', `すべて ${unreadItems.length}`),
            fchip('important', `重要 ${unreadItems.filter((n) => n.important).length}`),
            unreadGenres.map((g) => fchip(g, `${g} ${unreadItems.filter((n) => n.genre === g).length}`))
          ),
      selectable.length
        ? h(
            'div',
            { class: 'toolbar' },
            h(
              'label',
              { class: 'btn text' },
              h('input', {
                type: 'checkbox',
                class: 'check',
                checked: allChecked,
                onchange: (e) => {
                  selectable.forEach((n) => (e.target.checked ? S.selected.add(n.seqNo) : S.selected.delete(n.seqNo)));
                  render();
                },
              }),
              '表示中の未読をすべて選択'
            ),
            h('button', { class: 'btn filled', disabled: !sel.length, onclick: () => bulkRead(sel) }, icon('doneAll'), `選択した${sel.length}件を既読`),
            genreMode
              ? null
              : h(
                  'button',
                  { class: 'btn tonal', onclick: () => bulkRead(unreadItems.slice(0, S.settings.bulkCount).map((n) => n.seqNo)) },
                  `上から${Math.min(S.settings.bulkCount, unreadItems.length)}件を既読`
                ),
            genreMode
              ? null
              : h(
                  'button',
                  { class: 'btn outline', onclick: () => bulkRead(unreadItems.filter((n) => !n.important).map((n) => n.seqNo)) },
                  '［重要］以外をすべて既読'
                )
          )
        : null,
      errorBox('notices', 'kj'),
      d == null && !S.errors.notices ? skeleton(6) : null,
      genreMode && genreLoading ? skeleton(4) : null,
      d && !list.length && !genreLoading
        ? empty('doneAll', genreMode ? 'この種類の連絡はありません' : unreadItems.length ? '該当する連絡はありません' : '未読の連絡はありません')
        : null,
      h('div', { class: 'list' }, rows),
      h(
        'div',
        { style: { marginTop: '16px' } },
        h('button', { class: 'btn outline', onclick: () => openTab('kj', '連絡通知（学情の画面）') }, icon('open'), '学情の画面で検索する（掲載期間が過ぎた連絡など）')
      )
    );
  };

  const openNotice = async (n) => {
    const body = h('div', {}, skeleton(5));
    const sheet = openSheet({ title: n.title, body });
    try {
      const d = await GX.openNotice(n);
      if (d.genreHref) n.genreHref = d.genreHref;
      // 既読になったので一覧と種類別の表示に反映
      if (S.data.notices && n.unread) {
        const before = S.data.notices.items.length;
        S.data.notices.items = S.data.notices.items.filter((x) => x.seqNo !== n.seqNo);
        if (S.data.notices.items.length < before) S.data.notices.total = Math.max(0, S.data.notices.total - 1);
      }
      genreCache.forEach((arr) => arr.forEach((x) => x.seqNo === n.seqNo && (x.unread = false)));
      S.selected.delete(n.seqNo);
      sheet.setTitle(d.title || n.title);
      const pinBtn = h('button', { class: 'btn ' + (S.my.pins[n.seqNo] ? 'tonal' : 'outline'), onclick: () => {
        togglePin(n, d);
        pinBtn.className = 'btn ' + (S.my.pins[n.seqNo] ? 'tonal' : 'outline');
        pinBtn.textContent = S.my.pins[n.seqNo] ? 'ピン留め中（解除）' : 'ホームにピン留め';
        render();
      } }, S.my.pins[n.seqNo] ? 'ピン留め中（解除）' : 'ホームにピン留め');
      const content = GX.linkify(h('div', { class: 'notice-body' }, d.body));
      const metaKeys = Object.entries(d.meta).filter(([k]) => !['年度', '開講所属', '開講番号', '科目名'].includes(k));
      body.replaceChildren(
        h('div', { class: 'meta', style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' } },
          d.genre ? h('span', { class: 'chip blue' }, d.genre) : null,
          n.important ? h('span', { class: 'chip red' }, '重要') : null,
          d.meta['科目名'] ? h('span', { class: 'chip' }, d.meta['科目名']) : null
        ),
        h('div', { class: 'toolbar', style: { marginBottom: '12px' } }, pinBtn),
        content,
        dateChips(d.title || n.title, d.body.textContent || ''),
        d.attachments.length
          ? h('div', { style: { marginTop: '20px' } },
              h('div', { class: 'section-title' }, icon('attach'), `添付ファイル（${d.attachments.length}）`),
              d.attachments.length > 1 ? h('button', { class: 'btn tonal', style: { marginBottom: '8px' }, onclick: () => runBulkAttach([{ ...n, unread: false }], `${(d.title || n.title).slice(0, 40)}`) }, icon('download'), 'すべてまとめて保存（zip）') : null,
              d.attachments.map((f) =>
                h('button', { class: 'attach', style: { width: '100%', textAlign: 'left' }, onclick: () => downloadAttachment(n, f) }, icon('download'), f.name)
              )
            )
          : null,
        metaKeys.length ? h('dl', { class: 'kv' }, metaKeys.map(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])) : null
      );
      render();
    } catch (e) {
      body.replaceChildren(h('div', { class: 'error' }, icon('alert'), `開けませんでした：${e.message}`));
      if (e instanceof GX.AuthError) onAuthLost();
    }
  };

  // ----- 添付ファイルをまとめて保存（zip） -----
  // 未読の連絡は、添付を取得するために本文を開くと既読になる（学情の仕様）。そのため既定では選ばず、選ぶときに知らせる
  const markLocallyRead = (n) => {
    if (S.data.notices && n.unread) {
      const before = S.data.notices.items.length;
      S.data.notices.items = S.data.notices.items.filter((x) => x.seqNo !== n.seqNo);
      if (S.data.notices.items.length < before) S.data.notices.total = Math.max(0, S.data.notices.total - 1);
    }
    genreCache.forEach((arr) => arr.forEach((x) => x.seqNo === n.seqNo && (x.unread = false)));
  };
  const runBulkAttach = async (notices, label = '連絡の添付ファイル') => {
    if (!notices.length) return;
    const unread = notices.filter((n) => n.unread).length;
    if (unread && !confirm(`未読の連絡が${unread}件含まれています。添付ファイルを取得するために本文を開くと、学情で既読になります（未読に戻せません）。続けますか？`)) return;
    const bar = h('div', { style: { width: '0%' } });
    const text = h('span', {}, '準備しています…');
    const s = snack(h('div', {}, text, h('div', { class: 'progress' }, bar)), 0);
    try {
      const { files, skipped } = await GX.collectAttachments(notices, (k, t, title) => {
        bar.style.width = `${(k / t) * 100}%`;
        text.textContent = k < t ? `添付ファイルを集めています… ${k + 1}/${t}：${title.slice(0, 24)}` : '保存しています…';
      });
      notices.forEach(markLocallyRead);
      s.close();
      render();
      if (!files.length) return snack(`添付ファイルのある連絡はありませんでした（${notices.length}件を確認）`, 5000);
      const d = new Date();
      const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
      const safeLabel = label.replace(/[\\/:*?"<>|]/g, '_');
      GX.saveBlob(await GX.makeZip(files), `${safeLabel}_${stamp}.zip`);
      const errors = skipped.filter((x) => x.why !== '添付ファイルなし');
      snack(`${files.length}個のファイルを zip で保存しました${errors.length ? `（${errors.length}件は取得できませんでした：${errors[0].title.slice(0, 20)} など）` : ''}`, 7000);
    } catch (e) {
      s.close();
      snack(`まとめて保存できませんでした：${e.message}`, 6000);
      if (e instanceof GX.AuthError) onAuthLost();
    }
  };
  const openBulkAttach = (list) => {
    const items = list.slice(0, 200);
    const chosen = new Set(items.filter((n) => !n.unread).map((n) => n.seqNo));
    const count = h('span', {});
    const go = h('button', { class: 'btn filled' }, icon('download'), '選んだ連絡の添付を zip で保存');
    const update = () => {
      count.textContent = `${chosen.size}件を選択中`;
      go.disabled = !chosen.size;
    };
    const rows = items.map((n) =>
      h(
        'label',
        { class: 'item', style: { cursor: 'pointer' } },
        h('input', { type: 'checkbox', class: 'check', checked: chosen.has(n.seqNo), onchange: (e) => (e.target.checked ? chosen.add(n.seqNo) : chosen.delete(n.seqNo), update()) }),
        h('div', { class: 'txt' }, h('div', { class: 't1' }, n.title), h('div', { class: 't2' }, [n.date ? GX.fmtDate(new Date(n.date)) : '', n.genre, n.sender].filter(Boolean).join('・'))),
        n.unread ? h('span', { class: 'chip red' }, '未読') : null
      )
    );
    const sheet = openSheet({
      title: '添付ファイルをまとめて保存',
      body: h(
        'div',
        {},
        h('p', { class: 'note' }, `いま表示している連絡（${items.length}件${list.length > items.length ? `／先頭の${items.length}件まで` : ''}）から選びます。添付ファイルを連絡ごとのフォルダに分けて、1つの zip にまとめて保存します。添付のない連絡は自動で飛ばします。`),
        h('p', { class: 'note' }, '未読の連絡は、取得すると学情で既読になるため、最初は選ばれていません。'),
        h(
          'div',
          { class: 'toolbar' },
          h('button', { class: 'btn text', onclick: () => (items.forEach((n) => chosen.add(n.seqNo)), rows.forEach((r) => (r.querySelector('input').checked = true)), update()) }, 'すべて選択'),
          h('button', { class: 'btn text', onclick: () => (chosen.clear(), rows.forEach((r) => (r.querySelector('input').checked = false)), update()) }, '選択を解除'),
          h('div', { style: { flex: 1 } }),
          count
        ),
        h('div', { class: 'list' }, rows),
        h('div', { class: 'toolbar', style: { position: 'sticky', bottom: 0, background: 'var(--surface-1)', padding: '10px 0' } }, go)
      ),
    });
    go.onclick = () => {
      const picked = items.filter((n) => chosen.has(n.seqNo));
      sheet.close();
      runBulkAttach(picked);
    };
    update();
  };

  const downloadAttachment = async (n, f) => {
    const s = snack(`「${f.name}」をダウンロードしています…`, 0);
    try {
      const saved = await GX.downloadAttachment(n, f.index, f.name);
      s.close();
      snack(`「${saved}」を保存しました`);
    } catch (e) {
      s.close();
      snack(`ダウンロードできませんでした：${e.message}`);
      if (e instanceof GX.AuthError) onAuthLost();
    }
  };

  const bulkRead = async (seqNos) => {
    if (!seqNos.length) return;
    if (!confirm(`${seqNos.length}件の連絡通知を既読にします。よろしいですか？\n（学情に「未読に戻す」機能はありません）`)) return;
    const bar = h('div', { style: { width: '0%' } });
    const label = h('span', {}, `既読にしています… 0/${seqNos.length}`);
    const s = snack(h('div', {}, label, h('div', { class: 'progress' }, bar)), 0);
    try {
      await GX.markNoticesRead(seqNos, (d, t) => {
        label.textContent = `既読にしています… ${d}/${t}`;
        bar.style.width = `${(d / t) * 100}%`;
      });
      s.close();
      S.selected.clear();
      snack(`${seqNos.length}件を既読にしました`);
    } catch (e) {
      s.close();
      snack(`途中で失敗しました：${e.message}`);
    }
    genreCache.clear();
    loadOne('notices');
  };

  // ----- 成績 -----
  const viewGrades = () => {
    const g = S.data.grades;
    if (!g) return h('div', {}, h('h1', {}, '成績'), errorBox('grades', 'si'), S.errors.grades ? null : skeleton(6));
    const years = [...new Set(g.list.map((x) => x.year).filter(Boolean))].sort().reverse();
    const filtered = g.list.filter((x) =>
      S.gradeYear === 'all' ? true : S.gradeYear === 'pending' ? !x.hyogo && !x.gouhi : x.year === S.gradeYear
    );
    const sum = GX.summarizeGrades(g.list);
    const f = (v, d = 1) => (v == null ? '—' : v.toFixed(d));
    // 学期ごとの集計
    const terms = {};
    g.list.forEach((x) => {
      if (!x.year) return;
      (terms[`${x.year} ${x.term}`] ||= []).push(x);
    });
    const termRows = Object.entries(terms)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([k, arr]) => {
        const s = GX.summarizeGrades(arr);
        return h('tr', {}, h('td', {}, k), h('td', { class: 'num' }, s.earned), h('td', { class: 'num' }, f(s.weightedAvg)), h('td', { class: 'num' }, f(s.gpa, 2)));
      });
    const sorters = {
      no: (a, b) => a.no - b.no,
      score: (a, b) => (b.score ?? -1) - (a.score ?? -1),
      name: (a, b) => a.name.localeCompare(b.name, 'ja'),
      year: (a, b) => (b.year || '').localeCompare(a.year || '') || b.term.localeCompare(a.term),
    };
    const rows = [...filtered].sort(sorters[S.gradeSort]);
    const maxDist = Math.max(1, ...Object.values(sum.dist));
    const fchip = (key, label) =>
      h('button', { class: 'fchip' + (S.gradeYear === key ? ' on' : ''), onclick: () => ((S.gradeYear = key), render()) }, label);
    const hyogoChip = (x) =>
      x.hyogo
        ? h('span', { class: 'chip ' + (x.hyogo === '不可' ? 'red' : x.hyogo === '秀' || x.hyogo === '優' ? 'ok' : '') }, x.hyogo)
        : x.gouhi
          ? h('span', { class: 'chip ' + (x.gouhi === '否' ? 'red' : 'ok') }, x.gouhi)
          : h('span', { class: 'chip' }, '評価待ち');
    return h(
      'div',
      {},
      h('h1', {}, '成績'),
      h('p', { class: 'sub' }, [g.dept, g.grade].filter(Boolean).join('・') || '単位修得状況'),
      errorBox('grades', 'si'),
      h(
        'div',
        { class: 'grid cols-4' },
        h('div', { class: 'stat' }, h('div', { class: 'label' }, '修得単位'), h('div', { class: 'value' }, g.earnedTotal ?? sum.earned, h('small', {}, '単位'))),
        h('div', { class: 'stat' }, h('div', { class: 'label' }, '平均点（単位加重）'), h('div', { class: 'value' }, f(sum.weightedAvg), h('small', {}, '点'))),
        h('div', { class: 'stat' }, h('div', { class: 'label' }, '平均点（単純）'), h('div', { class: 'value' }, f(sum.simpleAvg), h('small', {}, '点'))),
        h('div', { class: 'stat' }, h('div', { class: 'label' }, 'GPA（参考値）'), h('div', { class: 'value' }, f(sum.gpa, 2)))
      ),
      h(
        'p',
        { class: 'note', style: { margin: '8px 4px 0' } },
        'GPA は新潟大学の算出方法（GP＝(得点−50)/10、59点以下は0）で計算した参考値です。医学部・歯学部・教育学部は GPA ではなく平均点を用います。'
      ),
      h(
        'div',
        { class: 'grid cols-2', style: { marginTop: '16px' } },
        h(
          'section',
          { class: 'card outlined' },
          h('div', { class: 'card-head' }, h('h2', {}, '評価の分布')),
          h(
            'div',
            { class: 'bars' },
            GX.HYOGO.map((k) =>
              h('div', { class: 'bar' }, h('span', {}, k), h('div', { class: 'track' }, h('div', { class: 'fill', style: { width: `${(sum.dist[k] / maxDist) * 100}%` } })), h('span', { class: 'num' }, sum.dist[k]))
            )
          ),
          sum.pending ? h('p', { class: 'note' }, `評価待ちの科目：${sum.pending}科目`) : null
        ),
        h(
          'section',
          { class: 'card outlined' },
          h('div', { class: 'card-head' }, h('h2', {}, '学期ごと')),
          termRows.length
            ? h('table', { class: 'tbl' }, h('thead', {}, h('tr', {}, h('th', {}, '学期'), h('th', { class: 'num' }, '修得単位'), h('th', { class: 'num' }, '平均点'), h('th', { class: 'num' }, 'GPA'))), h('tbody', {}, termRows))
            : empty('school', 'まだ評価がありません')
        )
      ),
      gradeSimCard(g),
      h('div', { class: 'section-title' }, '科目一覧'),
      h(
        'div',
        { class: 'toolbar' },
        h(
          'div',
          { class: 'filters', style: { padding: 0, flex: 1 } },
          fchip('all', 'すべて'),
          fchip('pending', '評価待ち'),
          years.map((y) => fchip(y, `${y}年度`))
        ),
        h(
          'select',
          { onchange: (e) => ((S.gradeSort = e.target.value), render()) },
          [
            ['no', '学情の順'],
            ['score', '得点が高い順'],
            ['year', '修得年度順'],
            ['name', '科目名順'],
          ].map(([v, l]) => h('option', { value: v, selected: S.gradeSort === v }, l))
        )
      ),
      h(
        'div',
        { class: 'list' },
        rows.map((x) =>
          h(
            'div',
            { class: 'item' },
            h('div', { class: 'lead ' + (x.score == null ? 'gray' : x.score >= 80 ? 'green' : x.score >= 60 ? '' : 'red') }, x.score ?? '—'),
            h(
              'div',
              { class: 'txt' },
              h('div', { class: 't1' }, x.name, x.remote ? h('span', { class: 'note' }, '（遠隔）') : null),
              h('div', { class: 't2' }, [x.code, x.kubun, x.year && `${x.year} ${x.term}`].filter(Boolean).join('・'))
            ),
            h('div', { class: 'trail' }, hyogoChip(x), `${x.credits}単位`)
          )
        )
      ),
      h('div', { style: { marginTop: '16px' } }, h('button', { class: 'btn outline', onclick: () => openTab('si', '成績（学情の画面）') }, icon('open'), '学情の画面で開く（CSV出力など）'))
    );
  };

  // ===== 予定・授業：開いたときに読み込むデータ =====
  const X = { data: {}, errors: {}, loading: new Set() };
  const lazy = (key, fn, force) => {
    if (!force && (key in X.data || key in X.errors || X.loading.has(key) || isBusy())) return X.data[key];
    X.loading.add(key);
    delete X.errors[key];
    fn()
      .then((v) => (X.data[key] = v))
      .catch((e) => {
        X.errors[key] = e;
        if (e instanceof GX.AuthError) onAuthLost();
      })
      .finally(() => {
        X.loading.delete(key);
        render();
      });
    return undefined;
  };
  const lazyState = (key, tabId) =>
    X.errors[key]
      ? h('div', { class: 'error' }, icon('alert'), h('div', { style: { flex: 1 } }, `読み込めませんでした：${X.errors[key].message}`),
          h('button', { class: 'btn text', onclick: () => lazy(key, LAZY[key], true) }, '再試行'),
          tabId ? h('button', { class: 'btn text', onclick: () => openTab(tabId) }, '学情の画面で開く') : null)
      : X.loading.has(key) && !(key in X.data)
        ? skeleton(4)
        : null;
  const LAZY = {
    kyuko: GX.fetchKyuko,
    rishu: () => GX.fetchRishu(S.rishuTermHref),
    courses: GX.fetchCourses,
    attendance: GX.fetchAttendance,
    forum: GX.fetchForum,
  };
  const SCH_COLORS = { holiday: 'red', report: 'amber', quiz: 'amber', survey: 'blue', kyuko: 'red', grade: 'green', other: 'gray' };
  const SCH_LABEL = { holiday: '休日', report: 'レポート', quiz: '小テスト', survey: 'アンケート', kyuko: '休講補講', grade: '成績', other: '予定' };

  // ----- 予定（スケジュール＋休講補講） -----
  const viewCalendar = () => {
    const key = `schedule:${S.schOffset}`;
    const sch = key in X.data ? X.data[key] : lazy(key, () => GX.fetchSchedule(S.schOffset));
    const kyuko = lazy('kyuko', LAZY.kyuko) ?? X.data.kyuko;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const kinds = ['all', 'report', 'quiz', 'survey', 'kyuko', 'holiday', 'other'];
    const days = (sch?.days || []).filter((d) => d.items.length);
    const filtered = days
      .map((d) => ({ ...d, items: d.items.filter((it) => S.schKind === 'all' || it.kind === S.schKind) }))
      .filter((d) => d.items.length);
    const move = (n) => {
      S.schOffset += n;
      render();
    };
    return h(
      'div',
      {},
      h('h1', {}, '予定'),
      h('p', { class: 'sub' }, '学情のスケジュール（課題の締切・休日・Myスケジュールなど）と休講・補講'),
      medWeekCard(),
      h(
        'section',
        { class: 'card outlined', style: { marginBottom: '16px' } },
        h('div', { class: 'card-head' }, h('h2', {}, '休講・補講・教室変更'), h('button', { class: 'btn text', onclick: () => openTab('kh') }, '学情の画面で見る')),
        lazyState('kyuko', 'kh'),
        kyuko && !kyuko.length ? h('p', { class: 'note', style: { margin: '4px 12px' } }, '現在、お知らせされている休講・補講・教室変更はありません。') : null,
        h(
          'div',
          { class: 'list' },
          (kyuko || []).map((k) =>
            h('div', { class: 'item' },
              h('div', { class: 'lead ' + (k.kind === '休講' ? 'red' : k.kind === '補講' ? 'green' : 'amber') }, k.kind.slice(0, 2)),
              h('div', { class: 'txt' }, h('div', { class: 't1' }, `${k.name}（${k.code}）`), h('div', { class: 't2' }, [k.date, k.period, k.room, k.teacher].filter(Boolean).join('・'))))
          )
        )
      ),
      h(
        'div',
        { class: 'toolbar' },
        h('button', { class: 'icon-btn', title: '前の月', onclick: () => move(-1) }, '‹'),
        h('h2', { style: { minWidth: '120px', textAlign: 'center' } }, sch ? (sch.year ? `${sch.year}年${sch.month}月` : '—') : '読み込み中…'),
        h('button', { class: 'icon-btn', title: '次の月', onclick: () => move(1) }, '›'),
        S.schOffset ? h('button', { class: 'btn text', onclick: () => move(-S.schOffset) }, '今月') : null,
        h('div', { style: { flex: 1 } }),
        h('button', { class: 'btn outline', onclick: () => openTab('sch', 'スケジュール（予定の追加・編集）') }, icon('open'), '予定を追加・編集')
      ),
      h('div', { class: 'filters' }, kinds.map((k) => h('button', { class: 'fchip' + (S.schKind === k ? ' on' : ''), onclick: () => ((S.schKind = k), render()) }, k === 'all' ? 'すべて' : SCH_LABEL[k]))),
      lazyState(key, 'sch'),
      sch && !filtered.length ? empty('calendar', 'この月の予定はありません') : null,
      filtered.map((d) => {
        const isToday = d.date.getTime() === today.getTime();
        const past = d.date < today;
        return h(
          'div',
          { class: 'card outlined', style: { marginBottom: '10px', opacity: past ? 0.6 : 1, borderColor: isToday ? 'var(--primary)' : null } },
          h('div', { class: 'section-title', style: { margin: '0 0 6px' } }, `${GX.fmtDate(d.date, false)}${isToday ? '（今日）' : ''}`),
          d.items.map((it) =>
            h('div', { class: 'item', style: { minHeight: '44px', padding: '6px 4px' } },
              h('span', { class: `chip ${SCH_COLORS[it.kind] === 'gray' ? '' : SCH_COLORS[it.kind] === 'amber' ? 'soon' : SCH_COLORS[it.kind]}` }, SCH_LABEL[it.kind]),
              h('div', { class: 'txt' }, h('div', { class: 't1', style: { fontWeight: 400 } }, it.text.replace(/^\[[^\]]+\]/, ''))))
          )
        );
      })
    );
  };

  // ----- 授業（時間割・科目・出欠・シラバス・フォーラム） -----
  const CLASS_TABS = [
    ['timetable', '時間割'],
    ['courses', '科目'],
    ['attendance', '出欠'],
    ['syllabus', 'シラバス'],
    ['forum', 'フォーラム'],
  ];
  const viewClasses = () => {
    const tabs = medEnabled() ? [...CLASS_TABS, ['med', '講義概要']] : CLASS_TABS;
    const tab = tabs.some(([k]) => k === S.classTab) ? S.classTab : 'timetable';
    const body = { timetable: viewTimetable, courses: viewCourses, attendance: viewAttendance, syllabus: viewSyllabusSearch, forum: viewForum, med: viewMedSyllabus }[tab]();
    return h(
      'div',
      {},
      h('h1', {}, '授業'),
      h('div', { class: 'filters', style: { marginTop: '8px' } }, tabs.map(([k, l]) => h('button', { class: 'fchip' + (tab === k ? ' on' : ''), onclick: () => ((S.classTab = k), render()) }, l))),
      body
    );
  };

  const viewTimetable = () => {
    const r = lazy('rishu', LAZY.rishu) ?? X.data.rishu;
    const days = r?.dayNames?.length ? r.dayNames : ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    const periods = [...new Set((r?.slots || []).map((s) => s.period))];
    return h(
      'div',
      {},
      h(
        'div',
        { class: 'toolbar' },
        h('p', { class: 'sub', style: { margin: 0, flex: 1 } }, r ? `${r.year}年度 ${r.term}${r.updated ? `（最終更新 ${r.updated}）` : ''}` : '履修登録の状況'),
        (r?.terms || []).map((t) =>
          h('button', { class: 'fchip' + (r.term === t.label ? ' on' : ''), onclick: () => ((S.rishuTermHref = t.href), lazy('rishu', LAZY.rishu, true), render()) }, t.label)
        ),
        h('button', { class: 'btn filled', onclick: () => openTab('rs', '履修') }, icon('open'), '履修登録・変更')
      ),
      lazyState('rishu', 'rs'),
      r
        ? h(
            'div',
            {},
            periods.length
              ? h('div', { style: { overflowX: 'auto' } },
                  h('table', { class: 'tbl' },
                    h('thead', {}, h('tr', {}, h('th', {}, ''), days.map((d) => h('th', {}, d.replace('曜日', ''))))),
                    h('tbody', {}, periods.map((p) =>
                      h('tr', {}, h('th', {}, p), days.map((d) => {
                        const cell = r.slots.filter((s) => s.period === p && s.day === d);
                        return h('td', {}, cell.map((c) => h('button', { class: 'chip blue', style: { height: 'auto', padding: '4px 8px', whiteSpace: 'normal', textAlign: 'left', marginBottom: '4px' }, onclick: () => openCoursePage({ ...c, name: c.text }) }, c.text)));
                      }))
                    ))
                  ))
              : h('p', { class: 'note' }, '曜日・時限が決まっている科目はありません。'),
            h('div', { class: 'section-title' }, `集中講義など（${r.others.length}）`),
            r.others.length
              ? h('div', { class: 'list' }, r.others.map((c) =>
                  h('button', { class: 'item', onclick: () => openCoursePage(c) },
                    h('div', { class: 'lead' }, icon('book')),
                    h('div', { class: 'txt' }, h('div', { class: 't1' }, c.name), h('div', { class: 't2' }, [c.code, c.room, c.period].filter(Boolean).join('・'))),
                    h('div', { class: 'trail' }, c.credits))))
              : h('p', { class: 'note' }, 'ありません。')
          )
        : null
    );
  };

  const viewCourses = () => {
    const list = lazy('courses', LAZY.courses) ?? X.data.courses;
    return h(
      'div',
      {},
      h('p', { class: 'sub' }, '履修中の科目（授業ポートフォリオ）。開くと、その科目の連絡・レポート・小テスト・資料を確認できます。'),
      lazyState('courses', 'rs'),
      list && !list.length ? empty('book', '履修中の科目はありません') : null,
      h('div', { class: 'list' }, (list || []).map((c) =>
        h('button', { class: 'item', onclick: () => openCoursePage(c) },
          h('div', { class: 'lead' }, icon('book')),
          h('div', { class: 'txt' }, h('div', { class: 't1' }, c.name), h('div', { class: 't2' }, c.slot)),
          h('div', { class: 'trail', style: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' } }, c.flags.map((f) => h('span', { class: 'chip blue' }, f))))))
    );
  };

  const openCourse = async (c) => {
    // 画面キーが古いと開けないため、開く直前に一覧を取り直す
    try {
      const fresh = (await GX.fetchCourses()).find((x) => x.name === c.name) || c;
      openClassicSheet(c.name, fresh.href);
    } catch (e) {
      snack(`開けませんでした：${e.message}`);
    }
  };

  const viewAttendance = () => {
    const list = lazy('attendance', LAZY.attendance) ?? X.data.attendance;
    return h(
      'div',
      {},
      h('p', { class: 'sub' }, '出欠管理システムに登録された出欠状況です。'),
      lazyState('attendance', 'aa'),
      list && !list.length ? empty('check', '出欠が登録された科目はありません') : null,
      h('div', { class: 'list' }, (list || []).map((a) =>
        h('div', { class: 'item' },
          h('div', { class: 'lead ' + (a.absent >= 3 ? 'red' : a.absent ? 'amber' : 'green') }, String(a.absent)),
          h('div', { class: 'txt' }, h('div', { class: 't1' }, a.name), h('div', { class: 't2' }, [a.code, a.slot, a.alert && `警告条件：${a.alert}`].filter(Boolean).join('・'))),
          h('div', { class: 'trail' }, `出席${a.present}・欠席${a.absent}`, a.late || a.early ? `遅刻${a.late}・早退${a.early}` : null)))),
      h('div', { style: { marginTop: '12px' } }, h('button', { class: 'btn outline', onclick: () => openTab('aa') }, icon('open'), '学情の画面で開く（年度の切り替えなど）'))
    );
  };

  const viewSyllabusSearch = () => {
    const f = S.sy;
    const field = (key, placeholder, type = 'text') =>
      h('input', { class: 'input', type, placeholder, value: f[key], style: { flex: 1, minWidth: '140px' }, oninput: (e) => (f[key] = e.target.value), onkeydown: (e) => e.key === 'Enter' && runSearch() });
    const runSearch = async () => {
      if (!f.name && !f.teacher && !f.code && !f.keyword) return snack('科目名・教員名・開講番号・キーワードのどれかを入力してください');
      S.syResult = { loading: true };
      render();
      try {
        S.syResult = await GX.searchSyllabus(f);
      } catch (e) {
        S.syResult = { error: e };
        if (e instanceof GX.AuthError) onAuthLost();
      }
      render();
    };
    const res = S.syResult;
    return h(
      'div',
      {},
      h('div', { class: 'card outlined', style: { marginBottom: '14px' } },
        h('div', { class: 'toolbar', style: { marginBottom: '8px' } }, field('name', '科目名'), field('teacher', '教員名')),
        h('div', { class: 'toolbar', style: { marginBottom: 0 } },
          field('code', '開講番号'), field('keyword', 'キーワード（授業内容など）'),
          h('input', { class: 'input', type: 'number', value: f.nendo, style: { width: '96px' }, title: '年度', oninput: (e) => (f.nendo = e.target.value) }),
          h('button', { class: 'btn filled', onclick: runSearch }, icon('search'), '検索'))),
      res?.loading ? skeleton(4) : null,
      res?.error ? h('div', { class: 'error' }, icon('alert'), `検索できませんでした：${res.error.message}`) : null,
      res?.items ? h('p', { class: 'note' }, `${res.total}件${res.total > res.items.length ? `（先頭${res.items.length}件を表示）` : ''}`) : null,
      res?.items && !res.items.length ? empty('search', '該当する授業はありません') : null,
      h('div', { class: 'list' }, (res?.items || []).map((s) =>
        h('button', { class: 'item', onclick: () => openSyllabus(s) },
          h('div', { class: 'lead' }, icon('book')),
          h('div', { class: 'txt' }, h('div', { class: 't1' }, s.name), h('div', { class: 't2' }, [s.code, s.teacher, s.term, s.slot, s.kubun].filter(Boolean).join('・')))))),
      h('div', { style: { marginTop: '12px' } }, h('button', { class: 'btn outline', onclick: () => openTab('sy') }, icon('open'), '学情の画面で詳しい条件を指定して検索'))
    );
  };

  const openSyllabus = async (c) => {
    const body = h('div', {}, skeleton(6));
    openSheet({ title: c.name || c.text || 'シラバス', body });
    try {
      const sy = await GX.fetchSyllabus({ nendo: c.nendo, shozoku: c.shozoku, code: c.code });
      if (!sy.sections.length) throw new Error('シラバスが登録されていません');
      body.replaceChildren(
        ...sy.sections.map((sec) =>
          h('div', {},
            sec.heading ? h('div', { class: 'section-title' }, sec.heading) : null,
            h('dl', { class: 'kv' }, sec.rows.map((r) => [h('dt', {}, r.label.split('／')[0]), h('dd', { class: 'notice-body', style: { fontSize: '14px' } }, GX.linkify(r.value))]))
          )
        ),
        h('button', { class: 'btn outline', onclick: () => openClassicSheet('シラバス（学情の画面）', sy.url) }, icon('open'), '学情の画面で開く（PDF出力など）')
      );
    } catch (e) {
      body.replaceChildren(h('div', { class: 'error' }, icon('alert'), `開けませんでした：${e.message}`));
      if (e instanceof GX.AuthError) onAuthLost();
    }
  };

  const viewForum = () => {
    const fm = lazy('forum', LAZY.forum) ?? X.data.forum;
    return h(
      'div',
      {},
      h('div', { class: 'toolbar' },
        h('p', { class: 'sub', style: { margin: 0, flex: 1 } }, fm?.current ? `表示中のフォーラム：${fm.current}` : 'フォーラム'),
        h('button', { class: 'btn filled', onclick: () => openTab('fm') }, icon('forum'), 'フォーラムを開く（閲覧・投稿）')),
      lazyState('forum', 'fm'),
      fm && fm.forums.length ? h('div', { class: 'filters' }, fm.forums.map((f) => h('span', { class: 'fchip' }, `${f.name}${f.count != null ? ` ${f.count}` : ''}`))) : null,
      fm && !fm.topics.length ? empty('forum', 'トピックはありません') : null,
      h('div', { class: 'list' }, (fm?.topics || []).map((t) =>
        h('button', { class: 'item', onclick: () => openTab('fm') },
          h('div', { class: 'lead ' + (/終了/.test(t.status) ? 'gray' : '') }, icon('forum')),
          h('div', { class: 'txt' }, h('div', { class: 't1' }, t.title), h('div', { class: 't2' }, [`コメント${t.comments}`, t.updated, t.status].filter(Boolean).join('・'))))))
    );
  };

  // ===== この端末だけに保存する自分用データ（課題の進捗・自分の締切・メモ・ピン留め） =====
  const MY_KEY = 'gxMy';
  S.my = { tasks: {}, pins: {} };
  const loadMy = async () => {
    try {
      const v = (await GX.api.storage.local.get(MY_KEY))[MY_KEY];
      if (v) S.my = { tasks: v.tasks || {}, pins: v.pins || {} };
    } catch (e) {}
  };
  const saveMy = () => {
    try {
      GX.api.storage.local.set({ [MY_KEY]: S.my });
    } catch (e) {}
  };

  // ----- 課題の進捗・自分の締切・メモ（学情にはない機能） -----
  const PROGRESS = [
    ['', '未着手'],
    ['doing', '取り組み中'],
    ['review', '見直し中'],
    ['ready', '提出準備OK'],
  ];
  const myTask = (r) => S.my.tasks[r.id] || {};
  const myDue = (r) => (myTask(r).due ? new Date(myTask(r).due) : null);
  const effectiveDue = (r) => myDue(r) || r.end;
  const progressChip = (r) => {
    const p = myTask(r).progress;
    if (!p || r.status === 'done') return null;
    return h('span', { class: 'chip ' + (p === 'ready' ? 'ok' : 'blue') }, PROGRESS.find(([k]) => k === p)?.[1]);
  };
  const toLocalInput = (d) => {
    if (!d) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const editMyTask = (r) => {
    const t = { ...myTask(r) };
    const commit = () => {
      if (!t.progress && !t.due && !t.memo) delete S.my.tasks[r.id];
      else S.my.tasks[r.id] = { ...t, title: r.title, savedAt: Date.now() };
      saveMy();
      render();
    };
    const chips = h('div', { class: 'filters' });
    const drawChips = () =>
      chips.replaceChildren(
        ...PROGRESS.map(([k, l]) =>
          h('button', { class: 'fchip' + ((t.progress || '') === k ? ' on' : ''), onclick: () => ((t.progress = k), drawChips(), commit()) }, l)
        )
      );
    drawChips();
    const due = h('input', {
      class: 'input',
      type: 'datetime-local',
      value: toLocalInput(t.due ? new Date(t.due) : null),
      max: toLocalInput(r.end),
      onchange: (e) => {
        t.due = e.target.value ? new Date(e.target.value).toISOString() : '';
        commit();
      },
    });
    const memo = h('textarea', {
      class: 'input',
      style: { width: '100%', height: '140px', padding: '10px 12px', lineHeight: '1.6' },
      placeholder: '方針・参考資料・やることリストなど（この端末だけに保存されます）',
      oninput: (e) => {
        t.memo = e.target.value;
        clearTimeout(memo._t);
        memo._t = setTimeout(commit, 500);
      },
    });
    memo.value = t.memo || '';
    openSheet({
      title: `自分用メモ：${r.title}`,
      body: h(
        'div',
        {},
        h('p', { class: 'note' }, `${r.course}・学情の締切 ${GX.fmtDate(r.end)}`),
        h('div', { class: 'section-title' }, '進み具合'),
        chips,
        h('div', { class: 'section-title' }, '自分の締切（学情の締切より前に設定）'),
        h('div', { class: 'toolbar' }, due, h('button', { class: 'btn text', onclick: () => ((due.value = ''), (t.due = ''), commit()) }, '解除')),
        h('p', { class: 'note' }, '設定すると、ホームや課題一覧で「自分の締切」までの残り時間を表示し、その順に並べます。'),
        h('div', { class: 'section-title' }, 'メモ'),
        memo
      ),
    });
  };

  // ----- 今週の締切（混み具合） -----
  const weekStrip = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * 86400000));
    const tasks = openTasks();
    const counts = days.map((d) => tasks.filter((t) => t.end && t.end >= d && t.end < new Date(d.getTime() + 86400000)).length);
    const max = Math.max(1, ...counts);
    return h(
      'div',
      { class: 'week' },
      days.map((d, i) =>
        h(
          'button',
          { class: 'wday' + (counts[i] ? ' has' : ''), style: { '--lv': String(counts[i] / max) }, title: `${GX.fmtDate(d, false)}：締切${counts[i]}件`, onclick: () => ((S.view = 'tasks'), (S.taskFilter = 'open'), render()) },
          h('span', { class: 'wd' }, i === 0 ? '今日' : '日月火水木金土'[d.getDay()]),
          h('span', { class: 'wn' }, d.getDate()),
          h('span', { class: 'wc' }, counts[i] ? `${counts[i]}件` : '—')
        )
      )
    );
  };

  // ----- ホーム：今日・明日の予定 -----
  const todayCard = () => {
    const sch = X.data['schedule:0'] ?? lazy('schedule:0', () => GX.fetchSchedule(0));
    const kyuko = X.data.kyuko ?? lazy('kyuko', LAZY.kyuko);
    const t0 = new Date();
    t0.setHours(0, 0, 0, 0);
    const pick = (offset) => (sch?.days || []).find((d) => d.date.getTime() === t0.getTime() + offset * 86400000)?.items || [];
    const block = (label, items) =>
      h('div', {},
        h('div', { class: 'note', style: { margin: '6px 4px' } }, label),
        items.length
          ? items.map((it) => h('div', { class: 'item', style: { minHeight: '40px', padding: '6px 8px' } }, h('span', { class: `chip ${it.kind === 'holiday' || it.kind === 'kyuko' ? 'red' : it.kind === 'report' || it.kind === 'quiz' ? 'soon' : ''}` }, SCH_LABEL[it.kind]), h('div', { class: 'txt' }, h('div', { class: 't1', style: { fontWeight: 400 } }, it.text.replace(/^\[[^\]]+\]/, '')))))
          : h('p', { class: 'note', style: { margin: '0 8px 6px' } }, '予定はありません')
      );
    return h(
      'section',
      { class: 'card outlined' },
      h('div', { class: 'card-head' }, h('h2', {}, '今日・明日の予定'), h('button', { class: 'btn text', onclick: () => ((S.view = 'calendar'), render()) }, '予定を見る')),
      lazyState('schedule:0', 'sch'),
      sch ? [block(`今日 ${GX.fmtDate(t0, false)}`, pick(0)), block('明日', pick(1))] : X.errors['schedule:0'] ? null : skeleton(2),
      kyuko && kyuko.length ? h('p', { class: 'note', style: { margin: '8px 4px 0' } }, `休講・補講・教室変更のお知らせが${kyuko.length}件あります（「予定」で確認）`) : null
    );
  };

  // ----- ホーム：ピン留めした連絡 -----
  const pinsCard = () => {
    const pins = Object.values(S.my.pins).sort((a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0));
    if (!pins.length) return null;
    return h(
      'section',
      { class: 'card outlined' },
      h('div', { class: 'card-head' }, h('h2', {}, 'ピン留めした連絡')),
      h('div', { class: 'list' }, pins.map((p) =>
        h('button', { class: 'item', onclick: () => openNotice({ ...p, date: p.date ? new Date(p.date) : null, unread: false }) },
          h('div', { class: 'lead amber' }, icon('attach')),
          h('div', { class: 'txt' }, h('div', { class: 't1' }, p.title), h('div', { class: 't2' }, p.memo || [p.genre, p.sender].filter(Boolean).join('・')))
        )))
    );
  };
  const togglePin = (n, d) => {
    if (S.my.pins[n.seqNo]) delete S.my.pins[n.seqNo];
    else
      S.my.pins[n.seqNo] = {
        seqNo: n.seqNo,
        href: n.href,
        genreHref: n.genreHref || d?.genreHref || null,
        title: d?.title || n.title,
        genre: n.genre || d?.genre || '',
        sender: n.sender || '',
        date: n.date ? new Date(n.date).toISOString() : null,
        pinnedAt: Date.now(),
        memo: '',
      };
    saveMy();
  };

  // ----- 連絡の本文から日付を見つけてカレンダーへ（学情にはない機能） -----
  const findDates = (text) => {
    const now = new Date();
    const out = [];
    const push = (y, mo, d, hh, mm) => {
      if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= 31)) return;
      let year = y || now.getFullYear();
      if (!y && mo < now.getMonth() + 1 - 2) year++; // 数か月前の月なら来年とみなす
      const date = new Date(year, mo - 1, d, hh ?? 0, mm ?? 0);
      if (isNaN(date) || date < new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)) return;
      const key = `${date.getTime()}-${hh != null}`;
      if (!out.some((o) => o.key === key)) out.push({ key, date, hasTime: hh != null });
    };
    const time = String.raw`(?:\s*[（(][月火水木金土日][）)])?\s*(?:(\d{1,2})[:：時](\d{2})?分?)?`;
    for (const m of text.matchAll(new RegExp(String.raw`(\d{4})\s*[/年]\s*(\d{1,2})\s*[/月]\s*(\d{1,2})日?` + time, 'g')))
      push(+m[1], +m[2], +m[3], m[4] != null ? +m[4] : undefined, m[5] != null ? +m[5] : undefined);
    for (const m of text.matchAll(new RegExp(String.raw`(?<![\d/年])(\d{1,2})月\s*(\d{1,2})日` + time, 'g')))
      push(0, +m[1], +m[2], m[3] != null ? +m[3] : undefined, m[4] != null ? +m[4] : undefined);
    for (const m of text.matchAll(/(?<![\d/年])(\d{1,2})\/(\d{1,2})\s*[（(][月火水木金土日][）)]\s*(?:(\d{1,2})[:：時](\d{2})?)?/g))
      push(0, +m[1], +m[2], m[3] != null ? +m[3] : undefined, m[4] != null ? +m[4] : undefined);
    return out.sort((a, b) => a.date - b.date).slice(0, 6);
  };
  const dateChips = (title, bodyText) => {
    const found = findDates(bodyText);
    if (!found.length) return null;
    return h(
      'div',
      { style: { marginTop: '18px' } },
      h('div', { class: 'section-title' }, icon('calendar'), '本文中の日付をカレンダーに追加'),
      h('div', { class: 'filters', style: { flexWrap: 'wrap' } }, found.map((f) =>
        h('button', { class: 'fchip', onclick: () => {
          GX.download(`gakujo-${f.date.getMonth() + 1}-${f.date.getDate()}.ics`, GX.eventIcs({ title, date: f.date, hasTime: f.hasTime, description: bodyText.slice(0, 500) }));
          snack('カレンダー形式で保存しました。開くとカレンダーに追加できます');
        } }, `${GX.fmtDate(f.date, f.hasTime)} を追加`)))
    );
  };

  // ----- 授業の新着を開く（開く直前に最新のリンクを取り直す） -----
  const openNews = async (n) => {
    try {
      const fresh = (await GX.fetchNews()).find((x) => x.text === n.text && x.date === n.date) || n;
      openClassicSheet(n.text, fresh.href);
    } catch (e) {
      snack(`開けませんでした：${e.message}`);
      if (e instanceof GX.AuthError) onAuthLost();
    }
  };

  // ----- 科目ごとのページ（学情にはない機能：課題・連絡・成績・出欠・シラバスを1か所に） -----
  const openCoursePage = (c) => {
    const code = c.code || '';
    const name = c.name || c.text || '';
    const body = h('div', {});
    const draw = () => {
      const reports = (S.data.reports || []).filter((r) => r.code === code);
      const grade = (S.data.grades?.list || []).find((g) => g.code === code);
      const att = (X.data.attendance || []).find((a) => a.code === code);
      const notices = [...genreCache.values()].flat().filter((n) => n.course && (n.course === name || name.includes(n.course)));
      const portfolio = (X.data.courses || []).find((x) => x.code === code || x.name === name);
      body.replaceChildren(
        h('div', { class: 'filters' },
          code ? h('span', { class: 'chip' }, code) : null,
          c.slot || c.period ? h('span', { class: 'chip' }, c.slot || c.period) : null,
          c.credits ? h('span', { class: 'chip' }, c.credits) : null),
        h('div', { class: 'toolbar' },
          c.nendo && c.shozoku && code ? h('button', { class: 'btn tonal', onclick: () => openSyllabus({ ...c, name }) }, icon('book'), 'シラバス') : null,
          portfolio ? h('button', { class: 'btn outline', onclick: () => openCourse(portfolio) }, icon('open'), '学情の科目ページ') : null,
          (() => {
            const mc = medEnabled() && medCourseOf(name);
            return mc ? h('button', { class: 'btn outline', onclick: () => openMedPage(`${mc.pdfFrom}-${mc.pdfTo}`, null, `${mc.code} ${mc.name}（講義概要）`) }, icon('book'), `講義概要 p.${mc.pdfFrom}〜`) : null;
          })()),
        h('div', { class: 'section-title' }, `課題（${reports.length}）`),
        reports.length ? h('div', { class: 'list' }, reports.map(taskListItem)) : h('p', { class: 'note' }, 'この科目の課題はありません。'),
        h('div', { class: 'section-title' }, '成績'),
        grade
          ? h('p', {}, grade.hyogo || grade.gouhi ? `${grade.score ?? '—'}点・${grade.hyogo || grade.gouhi}・${grade.credits}単位` : `評価待ち（${grade.credits}単位）`)
          : h('p', { class: 'note' }, '成績表にこの科目はありません。'),
        h('div', { class: 'section-title' }, '出欠'),
        att ? h('p', {}, `出席${att.present}・欠席${att.absent}・遅刻${att.late}・早退${att.early}`) : h('p', { class: 'note' }, X.data.attendance ? '出欠の記録はありません。' : '読み込み中…'),
        h('div', { class: 'section-title' }, `連絡（${notices.length}）`),
        notices.length
          ? h('div', { class: 'list' }, notices.slice(0, 20).map((n) => noticeItem(n, false, true)))
          : h('p', { class: 'note' }, genreCache.size ? 'この科目の連絡は見つかりませんでした。' : '「連絡」の「種類別（既読を含む）」を一度開くと、この科目の連絡もここに表示されます。')
      );
    };
    openSheet({ title: name || code, body });
    draw();
    if (!X.data.attendance && !isBusy()) GX.fetchAttendance().then((v) => ((X.data.attendance = v), draw())).catch(() => {});
    if (!X.data.courses && !isBusy()) GX.fetchCourses().then((v) => ((X.data.courses = v), draw())).catch(() => {});
  };

  // ----- 全体検索（課題・連絡・科目・成績・ピン留め） -----
  const openSearch = () => {
    const input = h('input', { class: 'input', type: 'search', placeholder: '課題・連絡・科目・成績を検索', style: { width: '100%', height: '48px', fontSize: '16px' } });
    const results = h('div', {});
    const run = () => {
      const q = input.value.trim().toLowerCase();
      if (!q) return results.replaceChildren(h('p', { class: 'note' }, '入力するとすぐに結果が表示されます。'));
      const hit = (...xs) => xs.filter(Boolean).join(' ').toLowerCase().includes(q);
      const reports = (S.data.reports || []).filter((r) => hit(r.title, r.course, r.code));
      const noticeMap = new Map();
      [...(S.data.notices?.items || []), ...[...genreCache.values()].flat()].forEach((n) => hit(n.title, n.sender, n.dept, n.course, n.genre) && noticeMap.set(n.seqNo, n));
      const notices = [...noticeMap.values()];
      const courseMap = new Map();
      [...(X.data.rishu?.others || []), ...(X.data.rishu?.slots || []), ...(X.data.courses || [])].forEach((c) => hit(c.name, c.text, c.code) && courseMap.set(c.code || c.name, c));
      (S.data.grades?.list || []).forEach((g) => hit(g.name, g.code) && !courseMap.has(g.code) && courseMap.set(g.code, { code: g.code, name: g.name }));
      const courses = [...courseMap.values()];
      const sec = (label, arr, fn) => (arr.length ? [h('div', { class: 'section-title' }, `${label}（${arr.length}）`), h('div', { class: 'list' }, arr.slice(0, 30).map(fn))] : []);
      results.replaceChildren(
        ...sec('課題', reports, taskListItem),
        ...sec('連絡', notices, (n) => noticeItem(n, false, true)),
        ...sec('科目', courses, (c) =>
          h('button', { class: 'item', onclick: () => openCoursePage(c) }, h('div', { class: 'lead' }, icon('book')), h('div', { class: 'txt' }, h('div', { class: 't1' }, c.name || c.text), h('div', { class: 't2' }, c.code || '')))),
        h('div', { style: { marginTop: '16px' } },
          h('button', { class: 'btn outline', onclick: async () => {
            sheet.close();
            S.view = 'classes';
            S.classTab = 'syllabus';
            S.sy.name = input.value.trim();
            S.syResult = { loading: true };
            render();
            try {
              S.syResult = await GX.searchSyllabus(S.sy);
            } catch (e) {
              S.syResult = { error: e };
            }
            render();
          } }, icon('search'), `シラバスで「${input.value.trim()}」を検索`)),
        !reports.length && !notices.length && !courses.length ? h('p', { class: 'note' }, '見つかりませんでした。連絡は「未読」と、読み込み済みの「種類別」から探します。') : null
      );
    };
    input.addEventListener('input', run);
    const sheet = openSheet({ title: '検索', body: h('div', {}, input, results) });
    run();
    setTimeout(() => input.focus(), 50);
  };

  // ----- 成績の見通し・目標（学情にはない機能） -----
  const LETTER = (sc) => (sc >= 90 ? '秀' : sc >= 80 ? '優' : sc >= 70 ? '良' : sc >= 60 ? '可' : '不可');
  const gradeSimCard = (g) => {
    const pending = g.list.filter((x) => !x.hyogo && !x.gouhi && x.credits > 0);
    if (!pending.length) return null;
    const simList = g.list.map((x) => {
      const v = S.sim[x.code];
      return v != null && v !== '' && !x.hyogo && !x.gouhi ? { ...x, score: Number(v), hyogo: LETTER(Number(v)) } : x;
    });
    const cur = GX.summarizeGrades(g.list);
    const sim = GX.summarizeGrades(simList);
    const f = (v, d = 1) => (v == null ? '—' : v.toFixed(d));
    // 目標平均点に必要な、評価待ち科目の平均点
    const pendCredits = pending.reduce((a, x) => a + x.credits, 0);
    const curScoreSum = (cur.weightedAvg ?? 0) * cur.credits;
    const need = S.simTarget ? (Number(S.simTarget) * (cur.credits + pendCredits) - curScoreSum) / pendCredits : null;
    return h(
      'section',
      { class: 'card outlined', style: { marginTop: '16px' } },
      h('div', { class: 'card-head' }, h('h2', {}, '成績の見通し（試算）')),
      h('p', { class: 'note' }, '評価待ちの科目に仮の点数を入れると、平均点と GPA を試算します。入力した点数はこの画面を閉じると消えます。'),
      h('div', { class: 'list' }, pending.map((x) =>
        h('div', { class: 'item', style: { minHeight: '48px' } },
          h('div', { class: 'txt' }, h('div', { class: 't1', style: { fontWeight: 400 } }, x.name), h('div', { class: 't2' }, `${x.credits}単位`)),
          h('input', { class: 'input', type: 'number', min: 0, max: 100, placeholder: '点数', value: S.sim[x.code] ?? '', style: { width: '88px' },
            onchange: (e) => ((S.sim[x.code] = e.target.value), render()) })))),
      h('div', { class: 'grid cols-2', style: { marginTop: '10px' } },
        h('div', { class: 'stat' }, h('div', { class: 'label' }, '平均点（試算）'), h('div', { class: 'value' }, f(sim.weightedAvg), h('small', {}, `現在 ${f(cur.weightedAvg)}`))),
        h('div', { class: 'stat' }, h('div', { class: 'label' }, 'GPA（試算）'), h('div', { class: 'value' }, f(sim.gpa, 2), h('small', {}, `現在 ${f(cur.gpa, 2)}`)))),
      h('div', { class: 'toolbar', style: { marginTop: '14px' } },
        h('span', {}, '目標の平均点'),
        h('input', { class: 'input', type: 'number', min: 0, max: 100, value: S.simTarget ?? '', style: { width: '88px' }, onchange: (e) => ((S.simTarget = e.target.value), render()) }),
        need != null
          ? h('span', { class: 'chip ' + (need > 100 ? 'red' : need <= 60 ? 'ok' : 'blue') },
              need > 100 ? '評価待ちの科目だけでは届きません' : `評価待ち科目で平均 ${Math.max(0, need).toFixed(1)} 点が必要`)
          : null)
    );
  };

  // ----- 自己診断（学情の画面が変わったときに、どこが読めなくなったかを調べる） -----
  const runDiagnostics = async (out) => {
    const checks = [
      ['課題', GX.fetchReports, (r) => `${r.length}件`],
      ['未読の連絡', GX.fetchUnreadNotices, (r) => `${r.items.length}件・種類${r.genres.length}`],
      ['成績', GX.fetchGrades, (r) => `${r.list.length}科目`],
      ['授業の新着', GX.fetchNews, (r) => `${r.length}件`],
      ['スケジュール', () => GX.fetchSchedule(0), (r) => (r.year ? `${r.year}年${r.month}月` : '月が読めません')],
      ['休講補講', GX.fetchKyuko, (r) => `${r.length}件`],
      ['時間割', () => GX.fetchRishu(), (r) => `${r.term || '学期不明'}・${r.slots.length + r.others.length}科目`],
      ['履修科目', GX.fetchCourses, (r) => `${r.length}科目`],
      ['出欠', GX.fetchAttendance, (r) => `${r.length}科目`],
      ['フォーラム', GX.fetchForum, (r) => `トピック${r.topics.length}件`],
    ];
    const lines = [`学情プラス v${GX.version()} / ${navigator.userAgent} / ${new Date().toLocaleString('ja-JP')}`];
    out.replaceChildren();
    for (const [label, fn, fmt] of checks) {
      const row = h('div', { class: 'item', style: { minHeight: '40px' } }, h('div', { class: 'lead gray' }, '…'), h('div', { class: 'txt' }, h('div', { class: 't1' }, label), h('div', { class: 't2' }, '確認中…')));
      out.append(row);
      try {
        const v = await fn();
        row.firstChild.className = 'lead green';
        row.firstChild.textContent = '✓';
        row.querySelector('.t2').textContent = fmt(v);
        lines.push(`OK ${label}: ${fmt(v)}`);
      } catch (e) {
        row.firstChild.className = 'lead red';
        row.firstChild.textContent = '×';
        row.querySelector('.t2').textContent = e.message;
        lines.push(`NG ${label}: ${e.name} ${e.message}`);
        if (e instanceof GX.AuthError) break;
      }
      await GX.sleep(200);
    }
    return lines.join('\n');
  };

  // ===== 医学科モード（講義概要 PDF から読み取った授業日程・講義概要） =====
  // 誤った日程を出さないため：今年度のもの・最新の読み取り方式・画像照合済みのものだけを使い、
  // すべての予定に PDF のページを添え、読み取れなかった週は「原本で確認」に案内する
  const MED_KEY = 'gxMed';
  const loadMed = async () => {
    try {
      S.med = (await GX.api.storage.local.get(MED_KEY))[MED_KEY] || null;
    } catch (e) {
      S.med = null;
    }
  };
  const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const isoToDate = (iso) => new Date(`${iso}T00:00:00`);
  const mdOf = (iso) => {
    const d = isoToDate(iso);
    return `${d.getMonth() + 1}/${d.getDate()}（${'日月火水木金土'[d.getDay()]}）`;
  };
  const hm = (t) => t.replace(/^0/, '');
  const medEnabled = () => {
    const m = S.settings.medMode;
    if (m === 'on') return true;
    if (m === 'off') return false;
    return GX.isMedDept(S.data.grades?.dept);
  };
  const medGrade = () => Number(S.settings.medGrade) || GX.gradeNumber(S.data.grades?.grade);
  const medState = () => {
    const d = S.med;
    const g = medGrade();
    const fy = GX.fiscalYear();
    if (!d) return { kind: 'none', g };
    if (d.parserVersion !== GX.MED_PARSER_VERSION || !d.rasterChecked) return { kind: 'outdated', d, g };
    if (d.fiscalYear !== fy) return { kind: 'stale', d, g, fy };
    if (!g) return { kind: 'nograde', d };
    if (!d.grades.includes(g)) return { kind: 'gradeMissing', d, g };
    const ev = d.events.filter((e) => e.grade === g);
    const weeks = d.weeks.filter((w) => w.grade === g);
    const failed = d.failed.filter((f) => f.grade === g);
    const last = [...weeks.map((w) => w.to), ...failed.map((f) => f.to).filter(Boolean)].sort().pop();
    const kind = last && isoDay(new Date()) > last ? 'ended' : 'ok';
    return { kind, d, g, ev, weeks, failed, last };
  };
  // 取り込んだあとに「講義概要」「時間割」の連絡が届いていたら、修正版が出た可能性を知らせる
  const medNewerNotice = () => {
    if (!S.med) return null;
    const all = [...(S.data.notices?.items || []), ...[...genreCache.values()].flat()];
    return all.find((n) => /講義概要|授業時間割|時間割表/.test(n.title || '') && n.date && new Date(n.date).getTime() > S.med.importedAt) || null;
  };
  const medUrl = (hash, tab) => {
    const dark = appEl?.classList.contains('dark');
    return `${GX.api.runtime.getURL('med/med.html')}?${tab ? '' : 'embed=1&'}theme=${dark ? 'dark' : 'light'}#${hash}`;
  };
  const openMed = (hash = '', title = '医学科モード：講義概要') =>
    openSheet({
      title,
      body: h('iframe', { title, src: medUrl(hash) }),
      wide: true,
      flush: true,
      actions: h('a', { class: 'btn text', href: medUrl(hash, true), target: '_blank', rel: 'noopener' }, icon('open'), h('span', { class: 'hide-sm' }, '新しいタブ')),
    });
  const openMedPage = (pages, hint, title) =>
    openMed(`view=${pages}${hint ? `&hint=${encodeURIComponent(hint)}` : ''}${title ? `&title=${encodeURIComponent(title)}` : ''}`, title || `講義概要 PDF ${pages}ページ目（原本）`);

  const medItem = (e) =>
    h(
      'div',
      { class: 'item', style: { minHeight: '40px', padding: '4px', alignItems: 'center' } },
      e.holiday ? h('span', { class: 'chip red' }, '休日') : h('span', { class: 'chip', style: { flex: 'none' } }, `${hm(e.start)}〜${hm(e.end)}`),
      h(
        'div',
        { class: 'txt' },
        h('div', { class: 't1', style: { fontWeight: 400, whiteSpace: 'pre-line' } }, e.lines.join('\n')),
        e.spanFrom ? h('div', { class: 't2' }, `${mdOf(e.spanFrom)}〜${mdOf(e.spanTo)}の通しのコマ`) : null
      ),
      h(
        'button',
        {
          class: 'btn text',
          style: { flex: 'none' },
          title: '講義概要の原本（PDF）で確認',
          onclick: () => openMedPage(e.page, `${mdOf(e.date)} ${hm(e.start)}〜${hm(e.end)}「${e.title}」は、このページの「${e.week ? `第${e.week}週` : `${mdOf(e.date)}の週`}」の表にあります。`),
        },
        `p.${e.page}`
      )
    );

  const MED_BANNER = '講義概要の PDF から自動で読み取った日程です。休講・補講・教室変更などは、学情の連絡と「休講・補講」を優先してください。';

  const medWeekCard = () => {
    if (!medEnabled()) return null;
    const st = medState();
    const box = (...kids) =>
      h(
        'section',
        { class: 'card outlined', style: { marginBottom: '16px' } },
        h('div', { class: 'card-head' }, h('h2', {}, `授業日程${st.g ? `（${st.g}年次）` : ''}`), h('button', { class: 'btn text', onclick: () => openMed('') }, '講義概要の管理')),
        ...kids
      );
    const importBtn = h('button', { class: 'btn filled', onclick: () => openMed('') }, '講義概要の PDF を取り込む');
    if (st.kind === 'none') return box(h('p', {}, '医学部医学科の「講義概要」の PDF を取り込むと、ここに自分の学年の授業日程を表示します（PDF はこの端末の中だけで読み取ります）。'), importBtn);
    if (st.kind === 'outdated') return box(h('p', {}, '読み取り方式が新しくなったため、いまは表示していません。「講義概要の管理」を開くと、保存してある PDF から自動で読み直します。'), h('button', { class: 'btn filled', onclick: () => openMed('') }, '講義概要の管理を開く'));
    if (st.kind === 'stale') return box(h('p', {}, `取り込んである講義概要は令和${st.d.fiscalYear - 2018}年度のものです。年度が変わったため、古い日程は表示していません。令和${st.fy - 2018}年度の講義概要を取り込んでください。`), importBtn);
    if (st.kind === 'nograde') return box(h('p', {}, '学年を確認できませんでした。設定の「医学科モード」で学年を選んでください。'), h('button', { class: 'btn filled', onclick: openSettings }, '設定を開く'));
    if (st.kind === 'gradeMissing') return box(h('p', {}, `取り込んだ講義概要には${st.g}年次の授業時間割表がありません（${st.d.grades.join('・')}年次のみ）。学年が違う場合は、設定の「医学科モード」で選び直してください。`));
    if (st.kind === 'ended') return box(h('p', {}, `令和${st.d.fiscalYear - 2018}年度の講義概要の授業日程（${st.g}年次）はすべて終わりました。新年度の講義概要が配布されたら取り込んでください。`), importBtn);

    const newer = medNewerNotice();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + 7 * (S.medWeek || 0));
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return isoDay(d);
    });
    const inRange = (x, iso) => x.from && x.from <= iso && iso <= x.to;
    const blocks = st.weeks.filter((w) => days.some((d) => inRange(w, d)));
    const fails = st.failed.filter((f) => days.some((d) => inRange(f, d)));
    const undated = st.failed.filter((f) => !f.from);
    const notes = st.d.notes.filter((n) => n.grade === st.g && blocks.some((b) => b.page === n.page && b.week === n.week && b.term === n.term));
    const covered = (d) => blocks.some((b) => inRange(b, d));
    const failedOn = (d) => fails.find((f) => inRange(f, d));
    const show = days.filter((d, i) => i < 5 || st.ev.some((e) => e.date === d) || failedOn(d));
    const move = (n) => {
      S.medWeek = (S.medWeek || 0) + n;
      render();
    };
    const exportIcs = () => {
      const from = isoDay(today);
      const list = st.ev.filter((e) => e.date >= from);
      if (!list.length) return snack('書き出す予定がありません');
      GX.download(
        `igakuka-R${st.d.fiscalYear - 2018}-${st.g}nen-jugyo.ics`,
        GX.medIcs(list, { source: `令和${st.d.fiscalYear - 2018}年度 医学部医学科 講義概要`, calName: `医学科 ${st.g}年次 授業日程` })
      );
      snack(`今日以降の${list.length}件を書き出しました。カレンダーのアプリで開くと追加できます`, 6000);
    };
    return box(
      h('p', { class: 'note', style: { margin: '0 4px 8px' } }, MED_BANNER),
      newer
        ? h('div', { class: 'error', style: { background: 'var(--amber-c, #ffefc9)', color: 'inherit' } }, icon('alert'), h('div', { style: { flex: 1 } }, `取り込んだあとに「${newer.title}」という連絡が届いています。講義概要の修正版が配布された場合は、取り込み直してください。`), h('button', { class: 'btn text', onclick: () => openMed('') }, '取り込み直す'))
        : null,
      h(
        'div',
        { class: 'toolbar' },
        h('button', { class: 'icon-btn', title: '前の週', onclick: () => move(-1) }, '‹'),
        h('h2', { style: { minWidth: '150px', textAlign: 'center', fontSize: '15px' } }, `${mdOf(days[0])}〜${mdOf(days[6])}`),
        h('button', { class: 'icon-btn', title: '次の週', onclick: () => move(1) }, '›'),
        S.medWeek ? h('button', { class: 'btn text', onclick: () => move(-S.medWeek) }, '今週') : null,
        h('div', { style: { flex: 1 } }),
        h('button', { class: 'btn outline', onclick: exportIcs }, icon('download'), 'カレンダーに書き出す')
      ),
      blocks.length
        ? h('div', { class: 'note', style: { margin: '0 4px 6px' } }, blocks.map((b) => `${b.label}（PDF ${b.page}ページ目）`).join('／'))
        : null,
      !blocks.length && !fails.length ? h('p', { class: 'note', style: { margin: '4px' } }, 'この週は、講義概要の授業時間割表の期間外です（休業期間など）。授業暦は「講義概要の管理」から原本で確認できます。') : null,
      blocks.length || fails.length
        ? show.map((d) => {
            const f = failedOn(d);
            const list = st.ev.filter((e) => e.date === d).sort((a, b) => a.start.localeCompare(b.start));
            const isToday = d === isoDay(today);
            return h(
              'div',
              { class: 'card outlined', style: { marginBottom: '8px', borderColor: isToday ? 'var(--primary)' : null, opacity: d < isoDay(today) ? 0.6 : 1 } },
              h('div', { class: 'section-title', style: { margin: '0 0 4px' } }, `${mdOf(d)}${isToday ? '（今日）' : ''}`),
              f
                ? h('div', { class: 'item' }, h('span', { class: 'chip red' }, '未確認'), h('div', { class: 'txt' }, h('div', { class: 't1', style: { fontWeight: 400 } }, 'この週は講義概要から確実に読み取れなかったため、表示していません。')), h('button', { class: 'btn text', onclick: () => openMedPage(f.page, `${f.label}の表は、このページにあります。`) }, `原本 p.${f.page}`))
                : list.length
                ? list.map(medItem)
                : covered(d)
                ? h('p', { class: 'note', style: { margin: '0 4px 4px' } }, '時間割表に記載はありません')
                : h('p', { class: 'note', style: { margin: '0 4px 4px' } }, '時間割表の期間外です')
            );
          })
        : null,
      notes.map((n) => h('p', { class: 'note', style: { margin: '6px 4px' } }, `注記（PDF ${n.page}ページ目）：${n.text}`)),
      undated.length
        ? h('p', { class: 'note', style: { margin: '6px 4px' } }, `読み取れなかった表があります：${undated.map((f) => `${f.label}（p.${f.page}）`).join('、')}。原本で確認してください。`)
        : null
    );
  };

  // ホーム：今日・明日の授業（講義概要）
  const medTodayCard = () => {
    if (!medEnabled()) return null;
    const st = medState();
    if (st.kind !== 'ok') return null;
    const t0 = new Date();
    t0.setHours(0, 0, 0, 0);
    const t1 = new Date(t0.getTime() + 86400000);
    const block = (label, iso) => {
      const list = st.ev.filter((e) => e.date === iso).sort((a, b) => a.start.localeCompare(b.start));
      const known = st.weeks.some((w) => w.from <= iso && iso <= w.to);
      const failed = st.failed.some((f) => f.from && f.from <= iso && iso <= f.to);
      return h(
        'div',
        {},
        h('div', { class: 'note', style: { margin: '6px 4px' } }, `${label} ${mdOf(iso)}`),
        failed
          ? h('p', { class: 'note', style: { margin: '0 8px 6px' } }, '講義概要から確実に読み取れなかった週です。原本で確認してください（「予定」から開けます）。')
          : list.length
          ? list.map(medItem)
          : h('p', { class: 'note', style: { margin: '0 8px 6px' } }, known ? '時間割表に記載はありません' : [0, 6].includes(isoToDate(iso).getDay()) ? '土日のため時間割表に記載はありません' : '時間割表の期間外です')
      );
    };
    return h(
      'section',
      { class: 'card outlined' },
      h('div', { class: 'card-head' }, h('h2', {}, `今日・明日の授業（${st.g}年次）`), h('button', { class: 'btn text', onclick: () => ((S.view = 'calendar'), render()) }, '週の日程')),
      block('今日', isoDay(t0)),
      block('明日', isoDay(t1)),
      h('p', { class: 'note', style: { margin: '6px 4px 0' } }, '講義概要から読み取った日程です。変更は学情の連絡が優先です。')
    );
  };

  // 授業：講義概要（科目ごとの PDF のページ）
  const normName = (t) => String(t || '').normalize('NFKC').replace(/\s+/g, '');
  const medCourseOf = (name) => {
    const st = medState();
    if (!['ok', 'ended'].includes(st.kind)) return null;
    const n = normName(name);
    return n ? st.d.courses.find((c) => normName(c.name) === n) || null : null;
  };
  const viewMedSyllabus = () => {
    const st = medState();
    if (!['ok', 'ended'].includes(st.kind)) return medWeekCard() || empty('book', '講義概要を取り込むと表示されます');
    const q = normName(S.medQuery || '').toLowerCase();
    const hits = (c) => !q || normName(`${c.code}${c.name}${c.text}`).toLowerCase().includes(q);
    const snippet = (c) => {
      if (!q) return '';
      const t = normName(c.text).toLowerCase();
      const i = t.indexOf(q);
      return i < 0 ? '' : `…${normName(c.text).slice(Math.max(0, i - 20), i + q.length + 30)}…`;
    };
    const list = st.d.courses.filter(hits).sort((a, b) => (a.grade === st.g ? 0 : 1) - (b.grade === st.g ? 0 : 1) || a.grade - b.grade || a.code.localeCompare(b.code));
    const input = h('input', { class: 'input', type: 'search', placeholder: '科目名・本文（キーワード）で検索', value: S.medQuery || '', style: { flex: 1, minWidth: '200px' } });
    input.addEventListener('input', () => {
      S.medQuery = input.value;
      clearTimeout(input._t);
      input._t = setTimeout(() => {
        render();
        const again = mainEl.querySelector('input[type=search]');
        again?.focus();
        again?.setSelectionRange(again.value.length, again.value.length);
      }, 250);
    });
    return h(
      'div',
      {},
      h('p', { class: 'sub' }, `令和${st.d.fiscalYear - 2018}年度 医学部医学科 講義概要（${st.d.courses.length}科目）。各科目の講義概要を原本のページで表示します。`),
      h('div', { class: 'toolbar' }, input, st.d.calendarPage ? h('button', { class: 'btn outline', onclick: () => openMedPage(st.d.calendarPage, null, '授業暦（原本）') }, '授業暦') : null),
      list.length ? null : empty('search', '見つかりませんでした'),
      h(
        'div',
        { class: 'list' },
        list.map((c) =>
          h(
            'button',
            { class: 'item', onclick: () => openMedPage(`${c.pdfFrom}-${c.pdfTo}`, null, `${c.code} ${c.name}（講義概要）`) },
            h('div', { class: 'lead ' + (c.grade === st.g ? 'blue' : '') }, `${c.grade}年`),
            h('div', { class: 'txt' }, h('div', { class: 't1' }, c.name), h('div', { class: 't2' }, snippet(c) || `${c.code}・PDF ${c.pdfFrom}〜${c.pdfTo}ページ`))
          )
        )
      )
    );
  };

  // ----- 新機能のお知らせ（更新後に一度だけ表示） -----
  const WHATS_NEW = [
    '医学科モード：講義概要の PDF を取り込むと、授業日程を「予定」とホームに表示（ページごとに画像でも照合し、確実に読めた週だけを表示）',
    '医学科モード：授業日程をカレンダーに書き出し、各科目の講義概要を原本のページで表示・本文を検索',
    '連絡の添付ファイルをまとめて zip で保存',
    '2段階認証の設定画面で、表示された鍵をそのまま学情プラスに登録できるように',
    'ホームに「今日・明日の予定」「今週の締切」「ピン留めした連絡」を追加',
    '課題ごとに「自分の締切」「進み具合」「メモ」を設定できるように',
    '連絡の本文中の日付を、ワンタップでカレンダーに追加',
    '科目ごとのページ（課題・成績・出欠・連絡・シラバスを1か所に）',
    '画面上部の虫めがねから、課題・連絡・科目・成績をまとめて検索',
    '成績の見通し（仮の点数で平均点・GPAを試算、目標に必要な点数）',
    '提出画面で入力中の本文を自動で下書き保存（ログインが切れても復元できます）',
    '設定に「診断」を追加（学情の画面が変わって動かないときの確認用）',
    '2段階認証の鍵の登録・確認・削除を、新しい画面の設定から行えるように',
  ];
  const showWhatsNew = async () => {
    try {
      const v = GX.version();
      const { gxLastVersion } = await GX.api.storage.local.get('gxLastVersion');
      if (gxLastVersion === v) return;
      await GX.api.storage.local.set({ gxLastVersion: v });
      openSheet({
        title: gxLastVersion ? `学情プラス v${v} の新機能` : '学情プラスへようこそ',
        body: h('div', {},
          gxLastVersion ? null : h('p', {}, '学情の画面を、見やすい新しい画面で表示しています。右上の「⇄」でいつでも元の画面に戻れます。'),
          h('ul', { style: { paddingLeft: '20px', lineHeight: '1.9' } }, WHATS_NEW.map((t) => h('li', {}, t))),
          h('p', { class: 'note' }, 'この拡張機能は新潟大学の公式のものではありません。データは学情とこの端末の間だけでやり取りされます。')),
      });
    } catch (e) {}
  };

  // ----- その他 -----
  const viewMore = () =>
    h(
      'div',
      {},
      h('h1', {}, 'その他'),
      h('p', { class: 'sub' }, '学情の各画面をこの画面の中で開きます。閉じるとここに戻ります。'),
      h(
        'div',
        { class: 'tiles' },
        GX.CLASSIC_TABS.map((t) =>
          h('button', { class: 'tile', onclick: () => openTab(t.id, t.label) }, h('div', { class: 'lead' }, icon(t.icon)), t.label)
        )
      ),
      h('div', { class: 'section-title' }, 'アカウント'),
      h(
        'div',
        { class: 'tiles' },
        h('button', { class: 'tile', onclick: openSettings }, h('div', { class: 'lead' }, icon('settings')), '学情プラスの設定'),
        h('button', { class: 'tile', onclick: logout }, h('div', { class: 'lead' }, icon('logout')), 'ログアウト')
      ),
      h('p', { class: 'note', style: { marginTop: '24px' } }, `学情プラス v${GX.version()}（gakujo-chan-extender を元にした非公式の拡張機能です）`)
    );

  const logout = () => {
    if (!confirm('学情からログアウトしますか？')) return;
    const el = [...document.querySelectorAll('a, li, span, button, div')].find(
      (e) => e.children.length <= 2 && /^ログアウト$|^Logout$/i.test(e.textContent.trim()) && (e.onclick || e.getAttribute('onclick') || e.href)
    );
    if (el) el.click();
    else location.href = '/campusweb/campusportal.do?page=main&action=logout';
  };

  // ===== 設定 =====
  const openSettings = () => {
    const s = S.settings;
    const sw = (key) =>
      h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: !!s[key], onchange: (e) => save({ [key]: e.target.checked }) }), h('span', {}));
    const row = (title, desc, control) => h('div', { class: 'setting' }, h('div', { class: 'txt' }, h('div', {}, title), desc ? h('div', { class: 't2' }, desc) : null), control);
    const select = (key, options) =>
      h('select', { onchange: (e) => save({ [key]: isNaN(e.target.value) ? e.target.value : Number(e.target.value) }) },
        options.map(([v, l]) => h('option', { value: v, selected: String(s[key]) === String(v) }, l))
      );
    const save = async (patch) => {
      S.settings = await GX.setSettings(patch);
      applyTheme();
      renderTimer();
      render();
      snack('保存しました');
    };
    // 2段階認証の鍵（新しい画面の中で登録・確認・削除まで完結）
    const keyBox = h('div', {});
    const drawKey = async () => {
      const k = await GX.getTotpKey();
      const code = h('b', { style: { fontSize: '22px', letterSpacing: '.15em' } }, '------');
      const left = h('span', { class: 'note' });
      if (k) {
        const tick = async () => {
          if (!keyBox.isConnected) return clearInterval(timer);
          code.textContent = await GX.totp(k);
          left.textContent = `（あと${GX.totpRemaining()}秒で切り替わり）`;
        };
        const timer = setInterval(tick, 1000);
        tick();
      }
      const input = h('input', { class: 'input', type: 'password', autocomplete: 'off', placeholder: '秘密鍵（英大文字と数字）または otpauth:// のURI', style: { flex: 1, minWidth: '200px' } });
      const msg = h('p', { class: 'note' });
      keyBox.replaceChildren(
        k
          ? h('div', { class: 'card', style: { marginBottom: '10px' } },
              h('div', { class: 'note' }, '鍵は登録済みです。いまの認証コード（認証アプリの表示と同じなら正しく登録できています）'),
              h('div', {}, code, ' ', left))
          : h('p', { class: 'note' }, '鍵は未登録です。登録方法は「使い方」を参照してください。'),
        h('div', { class: 'toolbar' }, input,
          h('button', { class: 'btn filled', onclick: async () => {
            const nk = GX.normalizeTotpKey(input.value);
            if (!GX.isValidTotpKey(nk)) return (msg.textContent = '鍵の形式が正しくありません（A〜Z と 2〜7 の16文字以上）。');
            await GX.setTotpKey(nk);
            snack('鍵を保存しました。共用のPCでは「自動で送信」をオフにしてください');
            drawKey();
          } }, k ? '上書き保存' : '保存'),
          k ? h('button', { class: 'btn text', onclick: async () => {
            if (!confirm('登録済みの鍵を削除しますか？')) return;
            await GX.setTotpKey('');
            snack('鍵を削除しました');
            drawKey();
          } }, '削除') : null),
        msg
      );
    };
    drawKey();
    const diagOut = h('div', { class: 'list' });
    let diagText = '';
    const diagCopy = h('button', { class: 'btn text', disabled: true, onclick: async () => {
      try {
        await navigator.clipboard.writeText(diagText);
        snack('診断結果をコピーしました（個人情報は含まれていません）');
      } catch (e) {
        snack('コピーできませんでした');
      }
    } }, '結果をコピー');
    openSheet({
      title: '学情プラスの設定',
      body: h(
        'div',
        {},
        h('div', { class: 'section-title' }, '表示'),
        row('新しい画面を使う', 'オフにすると、ログイン後は学情の元の画面が表示されます。', sw('newUi')),
        row('テーマ', null, select('theme', [['auto', '端末の設定に合わせる'], ['light', 'ライト'], ['dark', 'ダーク']])),
        row('旧画面の改善', '旧画面でも並べ替え・締切表示・平均点/GPA・一括既読を使えるようにします。', sw('classicEnhance')),
        h('div', { class: 'section-title' }, 'ログイン時間の自動延長'),
        row('自動延長', '学情のログイン時間（20分）が切れる前に自動で延長します。', sw('extendEnabled')),
        row('延長するタイミング', '残り時間がこの値以下になったら延長します。', select('extendThreshold', [6, 8, 10, 12, 15, 18].map((n) => [n, `残り${n}分`]))),
        row(
          '延長を続ける時間',
          '最後に画面を操作してからこの時間が過ぎると、延長をやめます（席を離れたときの安全のため）。',
          select('extendLimit', [[30, '30分'], [60, '1時間'], [120, '2時間'], [180, '3時間'], [240, '4時間'], [480, '8時間'], [0, '無制限']])
        ),
        h('div', { class: 'section-title' }, '提出画面'),
        row('入力中の本文を下書き保存', 'レポートなどの本文を、この端末の中に自動で一時保存します。ログインが切れても、次に開いたときに復元できます（14日で自動削除）。', sw('draftSave')),
        h('div', { class: 'section-title' }, '連絡'),
        row('一括既読の既定件数', '「上から◯件を既読」ボタンの件数です。', select('bulkCount', [5, 10, 20, 30, 50, 100].map((n) => [n, `${n}件`]))),
        h('div', { class: 'section-title' }, '医学科モード'),
        row(
          '医学科モード',
          `講義概要の PDF から授業日程と講義概要を表示します。自動：学情の所属から判定（いまの所属：${S.data.grades?.dept || '読み込み中'} → ${GX.isMedDept(S.data.grades?.dept) ? '医学科' : '医学科以外'}）`,
          select('medMode', [['auto', '自動'], ['on', 'オン'], ['off', 'オフ']])
        ),
        row(
          '学年',
          `授業日程を表示する学年です。学情の学年：${S.data.grades?.grade || '読み込み中'}`,
          select('medGrade', [[0, `学情の学年に合わせる${GX.gradeNumber(S.data.grades?.grade) ? `（${GX.gradeNumber(S.data.grades?.grade)}年）` : ''}`], ...[1, 2, 3, 4, 5, 6].map((n) => [n, `${n}年次`])])
        ),
        h('div', { class: 'toolbar' }, h('button', { class: 'btn outline', onclick: () => openMed('') }, '講義概要の取り込み・管理')),
        h('div', { class: 'section-title' }, '2段階認証'),
        row('認証コードの自動入力', 'ログイン時の認証コードを、登録した鍵から自動で入力します。', sw('twofaEnabled')),
        row('自動で送信して認証を通過', '鍵が登録されていれば、コードを入力して自動で送信します。PCを共用する場合はオフにしてください。', sw('twofaAutoSubmit')),
        keyBox,
        h('div', { class: 'section-title' }, '診断'),
        h('p', { class: 'note' }, '学情の画面が変わって一部が動かないときに、どの画面が読めなくなったかを確認します（閲覧だけで、既読などにはなりません）。'),
        h('div', { class: 'toolbar' },
          h('button', { class: 'btn outline', onclick: async (e) => {
            e.target.disabled = true;
            diagText = await runDiagnostics(diagOut);
            e.target.disabled = false;
            diagCopy.disabled = false;
          } }, '診断を実行'),
          diagCopy),
        diagOut,
        h('p', { class: 'note', style: { marginTop: '20px' } }, `学情プラス v${GX.version()}。設定と自分用データはこのブラウザに保存され、学情以外には送信されません。`)
      ),
    });
  };

  // ===== シートとスナックバー =====
  const openSheet = ({ title, body, wide, flush, onClose, classic, actions }) => {
    const titleEl = h('h2', {}, title);
    let closed = false;
    if (classic) classicOpen++;
    const close = () => {
      if (closed) return;
      closed = true;
      scrim.remove();
      document.removeEventListener('keydown', onKey, true);
      if (classic) classicOpen = Math.max(0, classicOpen - 1);
      onClose?.();
      if (!isBusy() && pendingReload) {
        pendingReload = false;
        loadAll();
      }
    };
    // シートが重なっているときは、一番上のシートだけを Esc で閉じる
    const onKey = (e) => e.key === 'Escape' && root.querySelectorAll('.scrim')[root.querySelectorAll('.scrim').length - 1] === scrim && close();
    const scrim = h(
      'div',
      { class: 'scrim', onclick: (e) => e.target === scrim && close() },
      h(
        'div',
        { class: 'sheet' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true' },
        h('div', { class: 'sheet-head' }, h('button', { class: 'icon-btn', title: '閉じる', onclick: close }, icon('close')), titleEl, actions || null),
        h('div', { class: 'sheet-body' + (flush ? ' flush' : '') }, body)
      )
    );
    document.addEventListener('keydown', onKey, true);
    appEl.append(scrim);
    return { close, setTitle: (t) => (titleEl.textContent = t) };
  };

  let snackTimer;
  const snack = (content, ms = 3200) => {
    root.querySelectorAll('.snack').forEach((e) => e.remove());
    const el = h('div', { class: 'snack', role: 'status' }, content);
    appEl.append(el);
    clearTimeout(snackTimer);
    if (ms) snackTimer = setTimeout(() => el.remove(), ms);
    return { close: () => el.remove() };
  };

  // ===== 起動判定 =====
  (async () => {
    S.settings = await GX.getSettings();
    GX.onSettingsChanged(async () => {
      S.settings = await GX.getSettings();
      if (appEl) {
        applyTheme();
        renderTimer();
      }
    });
    if (!S.settings.newUi) return;
    // ログイン済みのポータル画面でだけ起動する
    const ok = await GX.waitFor('#portaltimer, #timeout-timer', { timeout: 10000 });
    if (!ok) return;
    // 旧画面のタブを開いた直後は旧画面のまま（右下のボタンで戻れる）
    if (sessionStorage.getItem(MODE_KEY) === 'classic' && /[?&]tabId=/.test(location.search)) {
      showFab();
      return;
    }
    if (sessionStorage.getItem(MODE_KEY) === 'classic' && !/[?&]tabId=/.test(location.search)) {
      sessionStorage.setItem(MODE_KEY, 'new');
    }
    await Promise.all([loadMy(), loadMed()]);
    GX.api.storage?.onChanged?.addListener((ch, area) => {
      if (area === 'local' && ch[MED_KEY]) {
        S.med = ch[MED_KEY].newValue || null;
        render();
      }
    });
    openNewUi();
    setTimeout(showWhatsNew, 1500);
  })();

  GX.app = { open: openNewUi, toClassic, state: S };
})();
