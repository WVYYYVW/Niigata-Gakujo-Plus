// 学情プラス — 旧画面（学情そのままの画面）の改善
// 元の拡張機能の機能（並べ替え・GPA・一括既読）を、現在の学情に合わせて作り直したもの
(() => {
  const GX = globalThis.GX;
  if (!/\/campusweb\/campussquare\.do/.test(location.pathname)) return;

  const STYLE = `
    .gx-bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:8px 0;padding:8px 10px;border-radius:12px;background:#eef3fd;font:13px/1.5 system-ui,-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;color:#1f1f1f}
    .gx-bar b{color:#0b57d0;margin-right:4px}
    .gx-btn{font:inherit;padding:5px 12px;border:1px solid #c4c7c5;border-radius:999px;background:#fff;color:#0b57d0;cursor:pointer}
    .gx-btn.on{background:#d3e3fd;border-color:#d3e3fd;color:#041e49;font-weight:600}
    .gx-btn.primary{background:#0b57d0;border-color:#0b57d0;color:#fff;font-weight:600}
    .gx-btn:disabled{opacity:.5;cursor:default}
    .gx-num{width:64px;font:inherit;padding:4px 8px;border:1px solid #c4c7c5;border-radius:8px}
    .gx-chip{display:inline-block;margin-top:2px;padding:0 8px;border-radius:999px;font-size:11px;font-weight:600;white-space:nowrap}
    .gx-urgent{background:#f9dedc;color:#8c1d18}.gx-soon{background:#ffe9b8;color:#5c4300}.gx-later{background:#e6f4ea;color:#0d652d}.gx-past{background:#eceff1;color:#5f6368}
    tr.gx-row-urgent>td:first-child{box-shadow:inset 4px 0 #d93025}
    tr.gx-row-soon>td:first-child{box-shadow:inset 4px 0 #f9ab00}
    tr.gx-row-past{opacity:.6}
    .gx-temp{color:#0b57d0!important;font-weight:600}
    .gx-sum{display:flex;flex-wrap:wrap;gap:10px;margin:8px 0}
    .gx-stat{padding:8px 14px;border-radius:12px;background:#fff;border:1px solid #dde3ea}
    .gx-stat small{display:block;color:#5f6368;font-size:11px}
    .gx-stat span{font-size:18px;font-weight:700;color:#1f1f1f}
    .gx-note{color:#5f6368;font-size:11px}
  `;

  const addStyle = () => {
    if (document.getElementById('gx-classic-style')) return;
    const s = document.createElement('style');
    s.id = 'gx-classic-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  };
  const el = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    });
    kids.flat().forEach((k) => e.append(k));
    return e;
  };
  // 行の DOM ごと並べ替える（ボタンの動作を壊さない）
  const reorder = (table, items) => {
    const tbody = items[0]?.row.parentElement;
    if (!tbody) return;
    items.forEach((it) => tbody.appendChild(it.row));
  };
  const toggleOn = (bar, btn) => {
    bar.querySelectorAll('.gx-btn').forEach((b) => b.classList.remove('on'));
    btn.classList.add('on');
  };

  // ===== レポート・小テスト・アンケート =====
  const enhanceReports = (table) => {
    const items = GX.parseReportTable(table);
    const ix = [...table.rows[0].cells].findIndex((c) => GX.txt(c) === '提出期間');
    const now = Date.now();
    items.forEach((it) => {
      const u = GX.until(it.end, now);
      const done = it.status === 'done';
      if (!done && u.level !== 'none') it.row.classList.add(`gx-row-${u.level}`);
      if (done && u.level === 'past') it.row.classList.add('gx-row-past');
      if (it.status === 'temp') it.row.querySelectorAll('font').forEach((f) => f.classList.add('gx-temp'));
      if (ix >= 0 && u.text && !done) {
        it.row.cells[ix].append(el('br'), el('span', { class: `gx-chip gx-${u.level}` }, u.text));
      }
    });
    const order = { todo: 0, temp: 1, done: 2, other: 3 };
    const byDeadline = () => {
      const active = items.filter((i) => !i.end || i.end.getTime() > now);
      const expired = items.filter((i) => i.end && i.end.getTime() <= now);
      const sortFn = (a, b) => order[a.status] - order[b.status] || (a.end?.getTime() ?? 0) - (b.end?.getTime() ?? 0);
      return [...active.sort(sortFn), ...expired.sort((a, b) => b.end - a.end)];
    };
    const sorts = {
      期限順: byDeadline,
      タイトル順: () => [...items].sort((a, b) => a.title.localeCompare(b.title, 'ja')),
      開講番号順: () => [...items].sort((a, b) => a.code.localeCompare(b.code) || (a.end ?? 0) - (b.end ?? 0)),
      元の順: () => [...items].sort((a, b) => a.index - b.index),
    };
    const bar = el('div', { class: 'gx-bar' }, el('b', {}, '学情プラス'), '並べ替え：');
    Object.entries(sorts).forEach(([label, fn], i) => {
      const b = el('button', { class: 'gx-btn' + (i === 0 ? ' on' : ''), type: 'button' }, label);
      b.addEventListener('click', () => {
        reorder(table, fn());
        toggleOn(bar, b);
      });
      bar.append(b);
    });
    const ics = el('button', { class: 'gx-btn', type: 'button' }, '未提出の締切をカレンダーへ');
    ics.addEventListener('click', () => {
      const list = items.filter((i) => i.status !== 'done' && i.end && i.end.getTime() > Date.now());
      if (!list.length) return alert('期限内の未提出の課題はありません。');
      GX.download('gakujo-deadlines.ics', GX.toIcs(list));
    });
    bar.append(ics);
    table.parentElement.insertBefore(bar, table);
    reorder(table, byDeadline());
  };

  // ===== 成績 =====
  const enhanceGrades = (table) => {
    const items = GX.parseGradeTable(table);
    const s = GX.summarizeGrades(items);
    const f = (v, d = 2) => (v == null ? '—' : v.toFixed(d));
    const sum = el(
      'div',
      { class: 'gx-sum' },
      el('div', { class: 'gx-stat' }, el('small', {}, '平均点（単位数で加重）'), el('span', {}, f(s.weightedAvg, 1))),
      el('div', { class: 'gx-stat' }, el('small', {}, '平均点（単純平均）'), el('span', {}, f(s.simpleAvg, 1))),
      el('div', { class: 'gx-stat' }, el('small', {}, 'GPA（参考値）'), el('span', {}, f(s.gpa))),
      el('div', { class: 'gx-stat' }, el('small', {}, '評価済み科目'), el('span', {}, `${s.count}科目`))
    );
    const note = el(
      'div',
      { class: 'gx-note' },
      'GPA = Σ(単位数×GP)/Σ単位数、GP =（得点−50）/10（59点以下は0）で計算した参考値です。医学部などGPAを使わない学部では平均点を参照してください。'
    );
    const bar = el('div', { class: 'gx-bar' }, el('b', {}, '学情プラス'), '並べ替え：');
    const sorts = {
      'No.順': () => [...items].sort((a, b) => a.no - b.no),
      得点順: () => [...items].sort((a, b) => (b.score ?? -1) - (a.score ?? -1)),
      開講番号順: () => [...items].sort((a, b) => a.code.localeCompare(b.code)),
      修得年度順: () =>
        [...items].sort((a, b) => (b.year || '0').localeCompare(a.year || '0') || b.term.localeCompare(a.term)),
    };
    Object.entries(sorts).forEach(([label, fn], i) => {
      const b = el('button', { class: 'gx-btn' + (i === 0 ? ' on' : ''), type: 'button' }, label);
      b.addEventListener('click', () => {
        reorder(table, fn());
        toggleOn(bar, b);
      });
      bar.append(b);
    });
    table.parentElement.insertBefore(el('div', {}, sum, note, bar), table);
  };

  // ===== 連絡通知の一括既読 =====
  const enhanceNotices = async (table) => {
    const settings = await GX.getSettings();
    const items = GX.parseNoticeTable(table, location.href);
    if (!items.length) return;
    const num = el('input', { class: 'gx-num', type: 'number', min: '1', max: String(items.length) });
    num.value = String(Math.min(settings.bulkCount, items.length));
    const status = el('span', {});
    const run = async (seqNos) => {
      if (!seqNos.length) return;
      if (!confirm(`${seqNos.length}件の連絡通知を既読にします。よろしいですか？`)) return;
      bar.querySelectorAll('button').forEach((b) => (b.disabled = true));
      try {
        await GX.markNoticesRead(seqNos, (d, t) => (status.textContent = ` ${d}/${t} 件処理中…`));
        status.textContent = ' 完了しました。再読み込みします…';
        setTimeout(() => location.replace(GX.flowUrl(GX.FLOWS.notices)), 600);
      } catch (e) {
        status.textContent = ` 失敗しました：${e.message}`;
        bar.querySelectorAll('button').forEach((b) => (b.disabled = false));
      }
    };
    const top = el('button', { class: 'gx-btn primary', type: 'button' }, '上から指定件数を既読');
    top.addEventListener('click', () => run(items.slice(0, Number(num.value) || 0).map((i) => i.seqNo)));
    const notImportant = el('button', { class: 'gx-btn', type: 'button' }, '[重要]以外をすべて既読');
    notImportant.addEventListener('click', () => run(items.filter((i) => !i.important).map((i) => i.seqNo)));
    const all = el('button', { class: 'gx-btn', type: 'button' }, `すべて既読（${items.length}件）`);
    all.addEventListener('click', () => run(items.map((i) => i.seqNo)));
    const bar = el('div', { class: 'gx-bar' }, el('b', {}, '学情プラス'), '一括既読：', num, '件', top, notImportant, all, status);
    table.parentElement.insertBefore(bar, table);
  };

  // シート内の画面の構造に、見た目用の目印（クラス）だけを付ける。要素の移動や値の変更はしない
  const decorateSheet = () => {
    // 「●返信」「●あなたの解答」などの見出し行を、新しい画面の見出しと同じ見た目にする
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const heads = [];
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (/^\s*●/.test(n.textContent) && n.textContent.trim().length < 60 && !n.parentElement.closest('textarea, select, option, a, button')) heads.push(n);
    }
    heads.forEach((n) => {
      const span = document.createElement('span');
      span.className = 'gx-sec';
      span.textContent = n.textContent.trim().replace(/^●\s*/, '');
      n.replaceWith(span);
    });
    // 一番外側の表をカード、ラベル（th）と値（td）の2列の行を「項目」として扱う
    document.querySelectorAll('table').forEach((t) => {
      if (!t.parentElement.closest('table')) t.classList.add('gx-card');
      [...t.rows].forEach((tr) => {
        const c = [...tr.cells];
        if (c.length === 2 && c[0].tagName === 'TH' && c[1].tagName === 'TD') tr.classList.add('gx-kv');
      });
    });
    // 画面上部のタイトル帯（例：「レポート・小テスト・アンケート提出／小テスト 解答」）
    const first = [...document.body.querySelectorAll('table, div')].find((e) => /／/.test(e.textContent) && e.textContent.trim().length < 80);
    if (first) {
      first.classList.add('gx-pagetitle');
      first.classList.remove('gx-card');
    }
    // ボタンを種類ごとに：主要（提出など）・注意（取消・削除）・その他
    document.querySelectorAll('input[type=button], input[type=submit], input[type=reset], button').forEach((b) => {
      const label = (b.value || b.textContent || '').trim();
      if (/取消|削除|キャンセル|中止/.test(label)) b.classList.add('gx-danger');
      else if (/^(提出|解答|回答|確定|登録|送信|保存|確認|次へ|OK)/.test(label) && !/一時保存/.test(label)) b.classList.add('gx-primary');
    });
  };

  // 新しい画面のシート内（提出・確認画面など）で開かれたときは、狭い画面でも崩れないようにする
  const fitToSheet = () => {
    let fe = null;
    try {
      fe = window.frameElement;
    } catch (e) {}
    if (!fe || fe.id === 'main-frame-if') return;
    // 学情本来の画面（提出・解答・登録など）を、新しい画面と同じデザイン（色・角丸・ボタン・
    // ダークモード）に整える。見た目だけを変え、フォームの値や送信処理には手を加えない。
    const s = document.createElement('style');
    s.id = 'gx-sheet-style';
    s.textContent = GX.SHEET_CSS;
    document.head.appendChild(s);
    document.documentElement.classList.add('gx-sheet');
    decorateSheet();
    // テーマ：新しい画面と同じ（ライト／ダーク）。新しい画面側で切り替えたら追従する
    const appEl = (() => {
      try {
        return window.top.document.getElementById('gakujo-plus')?.shadowRoot?.querySelector('.app') || null;
      } catch (e) {
        return null;
      }
    })();
    const applyTheme = async () => {
      let dark;
      if (appEl) dark = appEl.classList.contains('dark');
      else {
        const t = (await GX.getSettings()).theme;
        dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
      }
      document.documentElement.classList.toggle('gx-dark', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    };
    applyTheme();
    if (appEl) new MutationObserver(applyTheme).observe(appEl, { attributes: true, attributeFilter: ['class'] });
    else matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  };

  // ===== 提出画面の下書き保存 =====
  // 本文の入力欄（textarea と、リッチテキスト編集の iframe）の内容を、この端末の中（storage.local）に3秒ごとに保存し、
  // 次に同じ画面を開いたときに復元できるようにする。14日たった下書きは自動で消す
  const DRAFT_PREFIX = 'gxDraft:';
  const DRAFT_DAYS = 14;
  const hashText = (t) => [...t].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);
  const draftKey = () => {
    // 科目名・タイトルなど、その提出を見分けられる欄の値から作る（URL のキーは毎回変わるため使わない）
    const parts = [];
    document.querySelectorAll('th').forEach((th) => {
      const label = GX.txt(th);
      if (/科目|タイトル|課題|テーマ|設問|開講番号/.test(label) && label.length < 20) {
        const td = th.nextElementSibling;
        if (td) parts.push(`${label}=${GX.txt(td).slice(0, 80)}`);
      }
    });
    if (!parts.length) return null;
    return DRAFT_PREFIX + hashText(parts.join('|'));
  };
  const editorBody = (ta) => {
    // CLEditor などは textarea を隠し、隣の iframe（about:blank）で編集する
    const fr = ta.parentElement?.querySelector('iframe');
    try {
      return ta.offsetParent === null && fr?.contentDocument?.body?.isContentEditable ? fr.contentDocument.body : fr?.contentDocument?.designMode === 'on' ? fr.contentDocument.body : null;
    } catch (e) {
      return null;
    }
  };
  const fields = () =>
    [...document.querySelectorAll('textarea')].filter((ta) => !ta.closest('#gx-draft-bar') && !ta.readOnly && !ta.disabled).map((ta, i) => ({ ta, id: ta.name || ta.id || `textarea${i}`, body: editorBody(ta) }));
  const readField = (f) => (f.body ? { html: f.body.innerHTML } : { text: f.ta.value });
  const isEmpty = (v) => !v || (v.text != null ? !v.text.trim() : !v.html.replace(/<br\s*\/?>|&nbsp;|<[^>]+>/gi, '').trim());
  const writeField = (f, v) => {
    if (f.body && v.html != null) {
      const doc = new DOMParser().parseFromString(`<body>${v.html}</body>`, 'text/html');
      doc.querySelectorAll('script, iframe, object, embed').forEach((n) => n.remove());
      f.body.replaceChildren(...[...doc.body.childNodes].map((n) => f.body.ownerDocument.importNode(n, true)));
      f.ta.value = v.html;
    } else if (v.text != null) {
      f.ta.value = v.text;
    } else if (v.html != null) {
      f.ta.value = v.html;
    }
    f.ta.dispatchEvent(new Event('input', { bubbles: true }));
    f.ta.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const cleanupDrafts = async () => {
    try {
      const all = await GX.api.storage.local.get(null);
      const old = Object.keys(all).filter((k) => k.startsWith(DRAFT_PREFIX) && Date.now() - (all[k]?.t || 0) > DRAFT_DAYS * 86400000);
      if (old.length) await GX.api.storage.local.remove(old);
    } catch (e) {}
  };
  const enableDrafts = async () => {
    await GX.sleep(800); // リッチテキスト編集の iframe ができるのを待つ
    const fs = fields();
    if (!fs.length) return;
    const key = draftKey();
    if (!key) return;
    cleanupDrafts();
    const saved = (await GX.api.storage.local.get(key))[key];
    const current = () => Object.fromEntries(fields().map((f) => [f.id, readField(f)]));
    // 保存してある下書きが、いまの入力内容と違えば「復元」を案内する
    if (saved && Object.entries(saved.values || {}).some(([id, v]) => !isEmpty(v) && JSON.stringify(v) !== JSON.stringify(current()[id]))) {
      const when = new Date(saved.t);
      const bar = el(
        'div',
        { class: 'gx-bar', id: 'gx-draft-bar' },
        el('b', {}, '学情プラス'),
        `${when.getMonth() + 1}/${when.getDate()} ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')} に入力していた下書きがあります。`,
        el('button', { class: 'gx-btn primary', type: 'button', onclick: () => {
          fields().forEach((f) => saved.values[f.id] && writeField(f, saved.values[f.id]));
          bar.remove();
        } }, '復元する'),
        el('button', { class: 'gx-btn', type: 'button', onclick: async () => {
          await GX.api.storage.local.remove(key);
          bar.remove();
        } }, '下書きを消す')
      );
      const anchor = fs[0].ta.closest('table') || fs[0].ta;
      anchor.parentElement.insertBefore(bar, anchor);
    }
    let last = JSON.stringify(current());
    setInterval(() => {
      const now = current();
      const json = JSON.stringify(now);
      if (json === last) return;
      last = json;
      if (Object.values(now).every(isEmpty)) return;
      GX.api.storage.local.set({ [key]: { t: Date.now(), values: now } }).catch(() => {});
      // 入力中はログイン時間の自動延長の「操作」として数える
      try {
        window.top.postMessage({ gxActivity: true }, location.origin);
      } catch (e) {}
    }, 3000);
  };

  const run = async () => {
    fitToSheet();
    const settings = await GX.getSettings();
    if (settings.draftSave) enableDrafts().catch(() => {});
    if (!settings.classicEnhance) return;
    addStyle();
    const reports = document.querySelector('#enqListForm') && GX.findTable(document, ['タイトル', '提出期間']);
    if (reports && reports.rows.length > 1) enhanceReports(reports);
    const grades = GX.findTable(document, ['単位数', '評語']);
    if (grades && grades.rows.length > 1 && document.querySelector('#taniReferListForm')) enhanceGrades(grades);
    // 「未読一覧」の表のみ（ジャンル別一覧などは対象外）
    const unreadHead = [...document.querySelectorAll('table.keiji-block')].some((t) => GX.txt(t).includes('未読一覧'));
    const notices = unreadHead && GX.findTable(document, ['掲載日時', '表題']);
    if (notices && notices.rows.length > 1) enhanceNotices(notices);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
