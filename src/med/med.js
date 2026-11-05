// 学情プラス — 医学科モード：講義概要 PDF の取り込み・原本の表示・読み取り結果の確認
// PDF はこの端末の中だけで読み取り、どこにも送信しない。
//   med.html                → 取り込み・管理
//   med.html#view=24-37     → 原本のページを表示（予定・講義概要の「原本で確認」から開く）
//   med.html#check          → 読み取り結果を原本と並べて確認
import * as pdfjsLib from '../vendor/pdfjs/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;

const GX = globalThis.GX;
const GXMed = globalThis.GXMed;
const app = document.getElementById('app');
const params = new URLSearchParams(location.hash.slice(1));
const embedded = new URLSearchParams(location.search).has('embed');

// ===== 小さな DOM ヘルパー =====
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
  return el;
};

// ===== テーマ（学情プラスの設定に合わせる） =====
(async () => {
  const q = new URLSearchParams(location.search).get('theme');
  let t = q || 'auto';
  if (!q) {
    try {
      t = (await GX.getSettings()).theme;
    } catch (e) {}
  }
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
})();

// ===== 保存場所 =====
// 読み取り結果 → storage.local（学情の画面から読む）。PDF 本体 → IndexedDB（この拡張機能の中だけ）
const KEY = 'gxMed';
const loadData = async () => (await GX.api.storage.local.get(KEY))[KEY] || null;
const saveData = (d) => GX.api.storage.local.set({ [KEY]: d });
const idb = () =>
  new Promise((res, rej) => {
    const r = indexedDB.open('gakujo-plus', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
const idbDo = async (mode, fn) => {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction('files', mode);
    const req = fn(tx.objectStore('files'));
    tx.oncomplete = () => res(req?.result);
    tx.onerror = () => rej(tx.error);
  });
};
const pdfPut = (bytes) => idbDo('readwrite', (s) => s.put(bytes, 'kogi'));
const pdfGet = () => idbDo('readonly', (s) => s.get('kogi')).catch(() => null);
const pdfDel = () => idbDo('readwrite', (s) => s.delete('kogi')).catch(() => {});

const sha256 = async (buf) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map((b) => b.toString(16).padStart(2, '0')).join('');

const openPdf = (bytes) => pdfjsLib.getDocument({ data: bytes.slice(0), isEvalSupported: false, verbosity: 0 }).promise;

const fmtDate = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`;
};
const reiwa = (y) => (y ? `令和${y - 2018}年度` : '年度不明');

// ===== PDF を読み取る =====
// 時間割表のページは画像にもして、罫線と文字の位置をピクセルから照合する（3倍＝216dpi）
const rasterize = async (page) => {
  const vp1 = page.getViewport({ scale: 1 });
  const vp = page.getViewport({ scale: 3 });
  const c = document.createElement('canvas');
  c.width = Math.ceil(vp.width);
  c.height = Math.ceil(vp.height);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  const d = ctx.getImageData(0, 0, c.width, c.height);
  c.width = c.height = 0; // メモリを早めに解放
  return { data: d.data, width: d.width, height: d.height, sx: d.width / vp1.width, sy: d.height / vp1.height };
};

const parseBytes = async (bytes, onProgress) => {
  const doc = await openPdf(bytes);
  const r = await GXMed.parseDocument(doc, pdfjsLib.OPS, onProgress, { render: rasterize });
  if (!r.rasterChecked) throw new Error('画像での照合を実行できませんでした');
  doc.destroy();
  return r;
};

// 読み取り結果が使えるものかどうか（使えないものは保存しない）
const validate = (r) => {
  const problems = [];
  if (!r.fiscalYear) problems.push('年度（令和◯年度）を読み取れませんでした。');
  if (!r.events.length && !r.courses.length) problems.push('授業時間割表も科目の講義概要も見つかりませんでした。医学部医学科の「講義概要」の PDF か確認してください。');
  if (r.fiscalYear && r.firstDate) {
    const fy = Number(r.firstDate.slice(0, 4)) - (Number(r.firstDate.slice(5, 7)) < 4 ? 1 : 0);
    if (fy !== r.fiscalYear) problems.push(`表紙の年度（${reiwa(r.fiscalYear)}）と時間割の日付（${r.firstDate}〜）が合いません。`);
  }
  return problems;
};

// ===== 取り込み・管理の画面 =====
const viewManage = async () => {
  const data = await loadData();
  const hasPdf = !!(await pdfGet());
  // 読み取り方式が新しくなっていたら、保存してある PDF から読み直す
  if (data && data.parserVersion !== GXMed.VERSION && hasPdf) return reparse(data);

  const fy = GX.fiscalYear();
  const status = !data
    ? h('div', { class: 'card' }, h('p', {}, 'まだ講義概要を取り込んでいません。'))
    : h(
        'div',
        { class: 'card' + (data.fiscalYear !== fy ? ' warn' : '') },
        h('p', {}, h('b', {}, `${reiwa(data.fiscalYear)} 医学部医学科 講義概要`), data.fiscalYear !== fy ? '（今年度のものではありません）' : ''),
        h('p', { class: 'note' }, `ファイル：${data.fileName}（${data.numPages}ページ）／取り込み：${new Date(data.importedAt).toLocaleString('ja-JP')}`),
        h('p', { class: 'note' }, `授業日程 ${data.events.length}件（${data.grades.join('・')}年次）／科目の講義概要 ${data.courses.length}科目`),
        data.failed.length ? h('p', { class: 'note' }, `読み取れなかった週：${data.failed.length}件（学情プラスには表示せず、原本の確認を案内します）`) : null,
        !hasPdf ? h('p', { class: 'note' }, 'PDF 本体はこの端末に残っていません（原本を表示するには、もう一度取り込んでください）。') : null,
        h(
          'div',
          { class: 'row', style: { marginTop: '8px' } },
          hasPdf ? h('button', { onclick: () => go('check') }, '読み取り結果を原本と見比べる') : null,
          hasPdf && data.calendarPage ? h('button', { onclick: () => go(`view=${data.calendarPage}`) }, '授業暦（原本）') : null,
          h(
            'button',
            {
              onclick: async () => {
                if (!confirm('取り込んだ講義概要（読み取り結果と PDF）をこの端末から削除します。よろしいですか？')) return;
                await GX.api.storage.local.remove(KEY);
                await pdfDel();
                render();
              },
            },
            '削除'
          )
        )
      );
  const picker = h('input', { type: 'file', accept: 'application/pdf,.pdf', onchange: (e) => e.target.files[0] && importFile(e.target.files[0]) });
  app.replaceChildren(
    h('h1', {}, '医学科モード：講義概要'),
    h('p', { class: 'note' }, '大学から配布される「医学部医学科 講義概要」の PDF を取り込むと、授業日程を学情プラスの「予定」に表示し、カレンダーに書き出せます。各科目の講義概要（シラバス）も原本のページで見られます。'),
    status,
    h('label', { class: 'drop' }, picker, h('b', {}, data ? '新しい講義概要を取り込む（置き換え）' : '講義概要の PDF を選ぶ'), h('div', { class: 'note' }, '修正版が配布されたときも、ここから取り込み直してください')),
    h(
      'div',
      { class: 'card' },
      h('h2', { style: { marginTop: 0 } }, '取り込みについて'),
      h('ul', { class: 'note', style: { paddingLeft: '20px', margin: 0 } },
        h('li', {}, 'PDF はこの端末の中だけで読み取ります。どこにも送信しません。'),
        h('li', {}, '読み取りに少しでも不確かな点がある週は、学情プラスには表示せず「原本で確認」を案内します。'),
        h('li', {}, '表示する予定にはすべて「PDF の何ページ目か」を付けます。日程の変更は学情の連絡・休講補講が優先です。'),
        h('li', {}, '年度が変わると、古い講義概要の日程は表示しません。新年度の講義概要を取り込んでください。'),
        h('li', {}, '講義概要の著作権は新潟大学にあります。取り込んだ PDF をほかの人に配布しないでください。')
      )
    )
  );
};

const progressCard = (label) => {
  const bar = h('div');
  const text = h('p', { class: 'note' }, label);
  const card = h('div', { class: 'card' }, text, h('div', { class: 'progress' }, bar));
  return { card, set: (n, total) => ((bar.style.width = `${(n / total) * 100}%`), (text.textContent = `${label}（${n} / ${total} ページ）`)) };
};

const importFile = async (file) => {
  const p = progressCard('PDF を読み取っています');
  app.replaceChildren(h('h1', {}, '講義概要を読み取っています'), p.card);
  let bytes, r;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
    r = await parseBytes(bytes, (n, t) => p.set(n, t));
  } catch (e) {
    app.replaceChildren(h('h1', {}, '読み取れませんでした'), h('div', { class: 'card err' }, h('p', {}, `PDF を開けませんでした：${e.message}`)), h('button', { onclick: render }, '戻る'));
    return;
  }
  const problems = validate(r);
  if (problems.length) {
    app.replaceChildren(
      h('h1', {}, 'この PDF は使えません'),
      h('div', { class: 'card err' }, problems.map((t) => h('p', {}, t))),
      h('button', { onclick: render }, '戻る')
    );
    return;
  }
  const data = {
    parserVersion: GXMed.VERSION,
    fileName: file.name,
    fileSize: file.size,
    sha256: await sha256(bytes),
    importedAt: Date.now(),
    ...r,
  };
  const old = await loadData();
  const fy = GX.fiscalYear();
  app.replaceChildren(
    h('h1', {}, '読み取り結果'),
    h(
      'div',
      { class: 'card' + (r.fiscalYear !== fy ? ' warn' : '') },
      h('p', {}, h('b', {}, `${reiwa(r.fiscalYear)}（${r.fiscalYear}年4月〜${r.fiscalYear + 1}年3月）`), r.fiscalYear !== fy ? ' ※今年度ではないため、予定には表示されません' : ''),
      h('p', {}, `授業日程：${r.events.length}件（${r.grades.join('・')}年次、${r.firstDate ? fmtDate(r.firstDate) : '—'}〜${r.lastDate ? fmtDate(r.lastDate) : '—'}）`),
      h('p', {}, `科目の講義概要：${r.courses.length}科目`, r.syllabusMissing.length ? `（目次にある${r.syllabusMissing.length}科目はページを特定できず、除外しました）` : ''),
      old && old.sha256 === data.sha256 ? h('p', { class: 'note' }, '前回と同じファイルです。') : null
    ),
    r.failed.length
      ? h(
          'div',
          { class: 'card warn' },
          h('p', {}, h('b', {}, `読み取れなかった週が${r.failed.length}件あります`), '。これらの週は学情プラスには表示せず、「原本で確認」を案内します。'),
          h('ul', { class: 'note', style: { paddingLeft: '20px' } }, r.failed.map((f) => h('li', {}, `${f.label}（PDF ${f.page}ページ目）：${f.why}`)))
        )
      : h('div', { class: 'card' }, h('p', { class: 'ok' }, 'すべての週を読み取れました。')),
    h('p', { class: 'note' }, '保存したあと「読み取り結果を原本と見比べる」で、自分の学年の時間割が正しく読み取れているか確かめられます。'),
    h(
      'div',
      { class: 'row' },
      h(
        'button',
        {
          class: 'primary',
          onclick: async (e) => {
            e.target.disabled = true;
            try {
              await pdfPut(bytes);
            } catch (err) {
              data.noPdf = true; // プライベートブラウズなどで保存できないときは、読み取り結果だけ使う
            }
            await saveData(data);
            render();
          },
        },
        'この内容で保存する'
      ),
      h('button', { onclick: render }, 'やめる')
    )
  );
};

const reparse = async (data) => {
  const p = progressCard('読み取り方式が新しくなったため、保存してある PDF を読み直しています');
  app.replaceChildren(h('h1', {}, '講義概要を読み直しています'), p.card);
  try {
    const bytes = await pdfGet();
    const r = await parseBytes(bytes, (n, t) => p.set(n, t));
    if (validate(r).length) throw new Error(validate(r).join(' '));
    await saveData({ ...data, ...r, parserVersion: GXMed.VERSION, reparsedAt: Date.now() });
  } catch (e) {
    await GX.api.storage.local.remove(KEY);
    app.replaceChildren(h('h1', {}, '読み直せませんでした'), h('div', { class: 'card err' }, h('p', {}, `${e.message}。お手数ですが、講義概要の PDF をもう一度取り込んでください。`)));
    return;
  }
  render();
};

// ===== 原本のページを表示 =====
let pdfDoc = null;
const getPdfDoc = async () => {
  if (pdfDoc) return pdfDoc;
  const bytes = await pdfGet();
  if (!bytes) return null;
  pdfDoc = await openPdf(bytes);
  return pdfDoc;
};

const renderPageInto = async (doc, n, holder) => {
  const page = await doc.getPage(n);
  const w = Math.min(holder.clientWidth || 800, 1200);
  const vp1 = page.getViewport({ scale: 1 });
  const scale = (w / vp1.width) * Math.min(2.5, window.devicePixelRatio || 1);
  const vp = page.getViewport({ scale });
  const canvas = h('canvas', { width: Math.floor(vp.width), height: Math.floor(vp.height), 'aria-label': `PDF ${n}ページ目` });
  holder.replaceChildren(canvas);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
};

const lazyPages = (doc, nums) => {
  const holders = nums.map((n) => {
    const holder = h('div', { style: { minHeight: '400px' } }, h('p', { class: 'note' }, `${n}ページ目を表示しています…`));
    holder.dataset.n = n;
    return [n, holder];
  });
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        renderPageInto(doc, Number(en.target.dataset.n), en.target).then(() => (en.target.style.minHeight = ''));
      }),
    { rootMargin: '600px 0px' }
  );
  holders.forEach(([, el]) => io.observe(el));
  return holders.map(([n, el]) => [h('div', { class: 'note' }, `PDF ${n}ページ目`), el]);
};

const viewPages = async (spec) => {
  const doc = await getPdfDoc();
  const data = await loadData();
  if (!doc) {
    app.replaceChildren(
      h('h1', {}, '原本を表示できません'),
      h('div', { class: 'card warn' }, h('p', {}, 'PDF 本体がこの端末に保存されていません。講義概要の PDF をもう一度取り込むと、原本を表示できます。')),
      h('button', { onclick: () => go('') }, '取り込み画面へ')
    );
    return;
  }
  const [a, b] = spec.split('-').map(Number);
  const from = Math.max(1, Math.min(a || 1, doc.numPages));
  const to = Math.max(from, Math.min(b || from, doc.numPages));
  const nums = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const title = params.get('title');
  app.replaceChildren(
    h('div', { class: 'pager row' }, h('b', { style: { flex: 1 } }, title || (data ? `${reiwa(data.fiscalYear)} 講義概要` : '講義概要')), h('span', { class: 'note' }, from === to ? `${from}ページ目` : `${from}〜${to}ページ目`)),
    params.get('hint') ? h('div', { class: 'card warn' }, h('p', {}, params.get('hint'))) : '',
    h('div', {}, lazyPages(doc, nums))
  );
};

// ===== 読み取り結果を原本と見比べる =====
const viewCheck = async () => {
  const doc = await getPdfDoc();
  const data = await loadData();
  if (!doc || !data) return viewPages('1');
  const pages = [...new Set(data.events.map((e) => e.page).concat(data.failed.map((f) => f.page)))].sort((a, b) => a - b);
  let gradeSel = Number(params.get('grade')) || 0;
  const body = h('div');
  const draw = () => {
    const ps = pages.filter((p) => !gradeSel || data.events.concat(data.failed).some((e) => e.page === p && e.grade === gradeSel));
    body.replaceChildren(
      ...ps.map((p) => {
        const ev = data.events.filter((e) => e.page === p);
        const byDate = new Map();
        ev.forEach((e) => (byDate.has(e.date) ? byDate.get(e.date) : byDate.set(e.date, []).get(e.date)).push(e));
        const fails = data.failed.filter((f) => f.page === p);
        const holder = h('div', {}, h('p', { class: 'note' }, '表示しています…'));
        renderPageInto(doc, p, holder);
        return h(
          'section',
          { class: 'card' },
          h('h2', { style: { marginTop: 0 } }, `PDF ${p}ページ目`),
          holder,
          fails.map((f) => h('p', { class: 'card warn' }, `${f.label}：読み取れなかったため表示しません（${f.why}）`)),
          h('details', {}, h('summary', {}, `このページから読み取った予定（${ev.length}件）`),
            h('table', {}, h('tr', {}, h('th', {}, '日付'), h('th', {}, '時間'), h('th', {}, '内容')),
              [...byDate].map(([d, list]) => list.map((e, i) => h('tr', {}, h('td', {}, i ? '' : fmtDate(d)), h('td', {}, `${e.start}〜${e.end}`), h('td', {}, e.lines.join(' ／ ')))))))
        );
      })
    );
  };
  app.replaceChildren(
    h('h1', {}, '読み取り結果の確認'),
    h('p', { class: 'note' }, '原本のページと、学情プラスが読み取った予定を並べています。食い違いを見つけたら、学情プラスの GitHub の Issue で教えてください（PDF そのものは添付しないでください）。'),
    h('div', { class: 'row pager' },
      h('button', { onclick: () => go('') }, '戻る'),
      [0, ...data.grades].map((g) => h('button', { class: g === gradeSel ? 'primary' : '', onclick: () => ((gradeSel = g), draw(), app.querySelectorAll('.pager button').forEach((b) => b.classList.toggle('primary', b.textContent === (g ? `${g}年次` : 'すべて')))) }, g ? `${g}年次` : 'すべて'))
    ),
    body
  );
  draw();
};

// ===== 画面の切替 =====
const go = (hash) => {
  location.hash = hash;
};
const render = () => {
  const p = new URLSearchParams(location.hash.slice(1));
  [...p].forEach(([k, v]) => params.set(k, v));
  [...params.keys()].forEach((k) => !p.has(k) && params.delete(k));
  window.scrollTo(0, 0);
  if (p.has('view')) return viewPages(p.get('view'));
  if (p.has('check')) return viewCheck();
  return viewManage();
};
window.addEventListener('hashchange', render);
if (embedded) document.documentElement.classList.add('embedded');
render().catch((e) => app.replaceChildren(h('div', { class: 'card err' }, h('p', {}, `エラー：${e.message}`))));
