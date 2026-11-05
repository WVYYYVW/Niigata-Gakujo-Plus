// 学情プラス — 学情（CampusSquare）からデータを読み取る層
// 画面の構造に依存する処理はすべてここに集める。学情の画面が変わったら主にここを直す。
(() => {
  const GX = (globalThis.GX = globalThis.GX || {});

  GX.FLOWS = {
    notices: 'KJW0001100-flow', // 連絡通知（未読一覧）
    reports: 'ENW3411100-flow', // レポート・小テスト・アンケート
    grades: 'SIW0001300-flow', // 単位修得状況照会
    portfolio: 'JPW0001000-flow', // 授業ポートフォリオ（Whats NEW）
    kyuko: 'KHW0001100-flow', // 休講補講
    schedule: 'PTW0001200-flow', // スケジュール
    rishu: 'RSW0001000-flow', // 履修登録・登録状況照会
    attendance: 'AAW3411000-flow', // 出欠状況参照
    forum: 'FMW0001100-flow', // フォーラム
    syllabus: 'SYW0001000-flow', // シラバス参照
  };

  // 旧画面のタブのメニュー（例：履修 → 授業ポートフォリオ、履修登録…）を読み取る
  // ポータル画面を読み込むだけなので、既読などの副作用はない
  GX.fetchTabMenus = async (tabId) => {
    const { doc } = await GX.getDoc(
      `${ORIGIN}/campusweb/campusportal.do?page=main&tabId=${encodeURIComponent(tabId)}`
    );
    return [...doc.querySelectorAll('#tabmenu-ul span[onclick]')]
      .map((s) => {
        const m = (s.getAttribute('onclick') || '').match(/loadPortletMenu\('(\w+)'\s*,\s*'([^']+)'/);
        if (!m) return null;
        return { label: GX.txt(s), target: m[1], url: GX.abs(m[2]) };
      })
      .filter((m) => m && m.label && m.target === 'main' && /_flowId=/.test(m.url));
  };

  // 旧画面のタブ（新UIの「その他」から開く）
  GX.CLASSIC_TABS = [
    { id: 'home', label: '旧画面のHOME', icon: 'home' },
    { id: 'kh', label: '休講補講', icon: 'event_busy' },
    { id: 'sch', label: 'スケジュール', icon: 'calendar' },
    { id: 'sy', label: 'シラバス', icon: 'book' },
    { id: 'rs', label: '履修', icon: 'list' },
    { id: 'aa', label: '出欠管理', icon: 'check' },
    { id: 'fm', label: 'フォーラム', icon: 'forum' },
    { id: 'sd', label: 'ダウンロード', icon: 'download' },
    { id: 'gk', label: '各種情報', icon: 'info' },
    { id: 'link', label: 'リンク', icon: 'link' },
  ];

  const ORIGIN = location.origin;
  GX.abs = (href, base = `${ORIGIN}/campusweb/`) => new URL(href, base).href;
  GX.flowUrl = (flowId) => `${ORIGIN}/campusweb/campussquare.do?_flowId=${flowId}`;

  // Firefox の content script ではページと同じ扱いの fetch（content.fetch）を使う
  const doFetch =
    typeof content !== 'undefined' && content && typeof content.fetch === 'function'
      ? content.fetch.bind(content)
      : fetch.bind(globalThis);

  class AuthError extends Error {
    constructor() {
      super('ログインが切れています');
      this.name = 'AuthError';
    }
  }
  GX.AuthError = AuthError;

  const parse = (html) => new DOMParser().parseFromString(html, 'text/html');
  const isLoginPage = (doc) =>
    !!doc.querySelector('input[type="password"]') && !doc.querySelector('#portaltimer, form[name="TimeoutForm"]');

  // 連絡通知の詳細（displayMidoku / confirm）は開くだけで既読になる。
  // 既読にしてよい処理（詳細を開く・既読処理）以外からは読み込めないようにする安全装置
  const READ_TRIGGER = /[?&]_eventId=(displayMidoku|confirm)\b/;
  GX.isReadTrigger = (url) => READ_TRIGGER.test(String(url));

  GX.getDoc = async (url, init = {}, { allowRead = false } = {}) => {
    if (!allowRead && GX.isReadTrigger(url)) throw new Error('既読になるページの読み込みを止めました');
    const res = await doFetch(url, { credentials: 'include', redirect: 'follow', ...init });
    if (!res.ok) throw new Error(`学情からの読み込みに失敗しました（HTTP ${res.status}）`);
    const doc = parse(await res.text());
    if (isLoginPage(doc)) throw new AuthError();
    GX.lastServerContact = Date.now();
    return { doc, url: res.url || url };
  };

  GX.post = (url, params) =>
    GX.getDoc(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });

  GX.txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

  // 学情が英語表示（English）のときは表の見出しが英語になり、読み取れない。
  // 「データが0件」と誤って表示しないよう、英語表示を検知して分かりやすいエラーにする
  class EnglishModeError extends Error {
    constructor() {
      super('学情が英語表示（English）になっているため読み取れません。ログイン画面で日本語表示を選んでからログインし直してください');
      this.name = 'EnglishModeError';
    }
  }
  GX.EnglishModeError = EnglishModeError;
  GX.isEnglishPage = (doc) => {
    const heads = [...doc.querySelectorAll('th')].map((t) => t.textContent).join('');
    return heads.trim().length > 0 && !/[\u3040-\u30ff\u4e00-\u9fff]/.test(heads);
  };
  const tableOrEnglish = (doc, table) => {
    if (!table && GX.isEnglishPage(doc)) throw new EnglishModeError();
    return table;
  };

  // 見出し行の文字から列番号を引く（列の順番が変わっても動くように）
  const headerIndex = (table, names) => {
    const cells = [...(table.rows[0]?.cells || [])].map((c) => GX.txt(c));
    const map = {};
    for (const [key, label] of Object.entries(names)) {
      map[key] = cells.findIndex((c) => c === label || c.startsWith(label));
    }
    return map;
  };
  const findTable = (doc, mustInclude) =>
    [...doc.querySelectorAll('table')].find((t) => {
      const head = GX.txt(t.rows[0]);
      return t.rows.length > 0 && mustInclude.every((w) => head.includes(w));
    }) || null;
  GX.findTable = findTable;

  // "2026/11/02 13:00" → Date
  const DATE_RE = /(\d{4})\/(\d{1,2})\/(\d{1,2})\s*(\d{1,2}):(\d{2})/g;
  GX.parseDates = (text) =>
    [...String(text).matchAll(DATE_RE)].map((m) => new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));

  // ===== レポート・小テスト・アンケート =====
  const ENQ_RE = /callEnqInfoSearch\('(\w+)',\s*'(\w+)',\s*'(\w+)',\s*'(\w+)',\s*'(\w+)',\s*'(\w+)'\)/;

  GX.parseReportTable = (table) => {
    const ix = headerIndex(table, {
      type: '種別',
      title: 'タイトル',
      status: '状態',
      code: '開講番号',
      course: '科目名',
      term: '開講',
      slot: '曜日・時限',
      period: '提出期間',
    });
    return [...table.rows].slice(1).map((tr, i) => {
      const c = tr.cells;
      const get = (k) => (ix[k] >= 0 ? GX.txt(c[ix[k]]) : '');
      const [start, end] = GX.parseDates(ix.period >= 0 ? c[ix.period]?.textContent : '');
      const statusText = get('status');
      const status = /一時保存|Temporarily/i.test(statusText)
        ? 'temp'
        : /未提出|Not submitted/i.test(statusText)
          ? 'todo'
          : /提出済|Submitted/i.test(statusText)
            ? 'done'
            : 'other';
      const actions = [...tr.querySelectorAll('input[type="button"], button')]
        .map((b) => {
          const m = (b.getAttribute('onclick') || '').match(ENQ_RE);
          if (!m) return null;
          return {
            label: (b.value || b.textContent || '').trim(),
            disabled: b.disabled,
            eventId: m[1],
            enqType: m[2],
            seqNo: m[3],
            jikanwariNendo: m[4],
            jikanwariShozokucd: m[5],
            jikanwaricd: m[6],
          };
        })
        .filter(Boolean);
      const main = actions.find((a) => !a.disabled) || null;
      return {
        row: tr,
        index: i,
        type: get('type'),
        title: get('title'),
        statusText,
        status,
        code: get('code'),
        course: get('course'),
        term: get('term'),
        slot: get('slot'),
        start: start || null,
        end: end || null,
        actions,
        main,
        id: main ? `${main.enqType}-${main.seqNo}` : `r${i}`,
      };
    });
  };

  GX.fetchReports = async () => {
    let { doc, url } = await GX.getDoc(GX.flowUrl(GX.FLOWS.reports));
    // 件数が表示件数より多ければ、表示件数を最大にして取り直す
    // 「1～13/13件表示」→ [_, 開始, 終了, 総数]
    const pager = doc.body.textContent.match(/(\d+)～(\d+)\/(\d+)件/);
    if (pager && Number(pager[3]) > Number(pager[2])) {
      const form = [...doc.forms].find((f) => f.querySelector('select[name="_displayCount"]'));
      if (form) {
        const key = form.querySelector('input[name="_flowExecutionKey"]').value;
        ({ doc, url } = await GX.post(GX.abs(form.getAttribute('action'), url), {
          _flowExecutionKey: key,
          _displayCount: '500',
          _eventId_paging: '表示',
        }));
      }
    }
    const table = tableOrEnglish(doc, findTable(doc, ['タイトル', '提出期間']));
    if (!table) return [];
    return GX.parseReportTable(table).map(({ row, ...r }) => r);
  };

  // ===== 連絡通知 =====
  GX.parseNoticeTable = (table, baseUrl) => {
    const ix = headerIndex(table, {
      date: '掲載日時',
      title: '表題',
      genre: 'ジャンル',
      dept: '所属',
      sender: '氏名',
      teacher: '担当者',
      course: '科目名',
      unread: '未読',
      period: '連絡通知期間',
    });
    return [...table.rows]
      .slice(1)
      .map((tr) => {
        const c = tr.cells;
        const a = ix.title >= 0 ? c[ix.title]?.querySelector('a') : null;
        if (!a) return null;
        const href = GX.abs(a.getAttribute('href'), baseUrl);
        const seqNo = (href.match(/seqNo=(\d+)/) || [])[1] || href;
        const flags = GX.txt(c[ix.title]);
        const [date] = GX.parseDates((c[ix.date]?.textContent || '').replace(/(\d{1,2}:\d{2}):\d{2}/, '$1'));
        return {
          row: tr,
          seqNo,
          href,
          title: GX.txt(a),
          important: flags.includes('[重要]'),
          isNew: flags.includes('[新着]'),
          date: date || null,
          dateText: GX.txt(c[ix.date]),
          genre: ix.genre >= 0 ? GX.txt(c[ix.genre]) : '',
          dept: ix.dept >= 0 ? GX.txt(c[ix.dept]) : '',
          sender: ix.sender >= 0 ? GX.txt(c[ix.sender]) : ix.teacher >= 0 ? GX.txt(c[ix.teacher]) : '',
          course: ix.course >= 0 ? GX.txt(c[ix.course]) : '',
          // 未読一覧には「未読」列がない（全件未読）。ジャンル別一覧では ○ が未読
          unread: ix.unread >= 0 ? GX.txt(c[ix.unread]) === '○' : true,
          period: ix.period >= 0 ? GX.txt(c[ix.period]) : '',
        };
      })
      .filter(Boolean);
  };

  GX.fetchUnreadNotices = async () => {
    const { doc, url } = await GX.getDoc(GX.flowUrl(GX.FLOWS.notices));
    const table = tableOrEnglish(doc, findTable(doc, ['掲載日時', '表題']));
    const items = table ? GX.parseNoticeTable(table, url).map(({ row, ...n }) => n) : [];
    const total = Number((doc.body.textContent.match(/未読が\s*(\d+)\s*件/) || [])[1] ?? items.length);
    const genreTable = findTable(doc, ['ジャンル', '件数']);
    // ジャンル一覧：「授業連絡通知」「共通通知」などの見出し行の下に各ジャンルが並ぶ
    const genres = [];
    let group = '';
    if (genreTable) {
      for (const tr of [...genreTable.rows].slice(1)) {
        const a = tr.querySelector('a');
        if (!a) continue;
        const href = GX.abs(a.getAttribute('href'), url);
        if (!/_eventId=dispKeijiListGenre\b/.test(href)) {
          group = GX.txt(a); // 見出し行
          continue;
        }
        const countText = GX.txt(tr.cells[tr.cells.length - 1]);
        genres.push({
          name: GX.txt(a),
          group,
          href,
          count: Number((countText.match(/(\d+)件/) || [])[1] || 0),
          unread: Number((countText.match(/未読\s*(\d+)/) || [])[1] || 0),
        });
      }
    }
    return { items, total, genres };
  };

  // ジャンル別の一覧（既読を含む）。一覧ページなので開いても既読にはならない
  GX.fetchGenreNotices = async (genreHref) => {
    if (!/_eventId=dispKeijiListGenre\b/.test(genreHref) || GX.isReadTrigger(genreHref)) {
      throw new Error('ジャンル一覧のURLではありません');
    }
    let { doc, url } = await GX.getDoc(genreHref);
    // 表示件数が総数より少なければ、最大件数・新しい順で取り直す
    const pager = doc.body.textContent.match(/(\d+)～(\d+)\/(\d+)件/);
    if (pager && Number(pager[3]) > Number(pager[2])) {
      const form = doc.querySelector('select[name="_displayCount"]')?.closest('form');
      if (form) {
        const params = {};
        [...form.elements].forEach((e) => {
          if (e.name) params[e.name] = e.value;
        });
        params._displayCount = '500';
        if ('sort' in params) params.sort = '11'; // 掲載日時（降順）
        ({ doc, url } = await GX.post(GX.abs(form.getAttribute('action'), url), params));
      }
    }
    const table = findTable(doc, ['表題', '掲載日時']);
    return table ? GX.parseNoticeTable(table, url).map(({ row, ...n }) => ({ ...n, genreHref: genreHref })) : [];
  };

  // 詳細を開く（＝既読になる）。本文は安全な要素だけ残して返す
  GX.fetchNoticeDetail = async (href) => {
    const { doc, url } = await GX.getDoc(href, {}, { allowRead: true });
    const head = doc.querySelector('table.keiji-block');
    const titleText = GX.txt(head);
    const meta = {};
    const attachments = [];
    // 見出し（th）の値は、同じ行の右隣の td か、見出し行の下に続く行の td にある
    // （添付ファイル・対象開講科目などは「見出し行 → 値の行」の形）
    doc.querySelectorAll('table.keiji-normal th').forEach((th) => {
      const key = GX.txt(th);
      if (!key) return;
      let cells = [];
      if (th.nextElementSibling?.tagName === 'TD') {
        cells = [th.nextElementSibling];
      } else {
        let tr = th.parentElement.nextElementSibling;
        while (tr && !tr.querySelector('th')) {
          cells.push(...tr.querySelectorAll('td'));
          tr = tr.nextElementSibling;
        }
      }
      if (key === '添付ファイル') {
        cells.forEach((td) =>
          td.querySelectorAll('a[href]').forEach((a) => {
            const href = GX.abs(a.getAttribute('href'), url);
            attachments.push({ name: GX.txt(a), href, index: Number((href.match(/[?&]index=(\d+)/) || [])[1] ?? attachments.length) });
          })
        );
      } else if (!meta[key] && cells.length) meta[key] = cells.map((c) => GX.txt(c)).filter(Boolean).join(' ');
    });
    // 本文：見出し表のあとから最初の keiji-normal 表の手前まで
    const body = document.createElement('div');
    if (head) {
      let node = head.nextSibling;
      while (node && !(node.nodeType === 1 && node.matches?.('table.keiji-normal'))) {
        body.appendChild(GX.sanitize(node));
        node = node.nextSibling;
      }
    }
    const tm = titleText.match(/^(.*?)\s*\[([^\]]+)\]\s*$/);
    return {
      title: tm ? tm[1] : titleText,
      genre: tm ? tm[2] : '',
      body,
      meta,
      attachments,
    };
  };

  // 通知の最新リンクを探す。学情の画面キー（flowExecutionKey）は古くなると使えないため、
  // 開く・ダウンロードする直前に一覧を取り直す。
  // 未読一覧に無ければ（既読になった通知など）、同じ種類のジャンル別一覧から探す。
  GX.freshNotice = async (n) => {
    if (n.genreHref) {
      const hit = (await GX.fetchGenreNotices(n.genreHref)).find((x) => x.seqNo === n.seqNo);
      if (hit) return hit;
    }
    const un = await GX.fetchUnreadNotices();
    const hit = un.items.find((x) => x.seqNo === n.seqNo);
    if (hit) return hit;
    const kt = (n.href.match(/keijitype=(\d+)/) || [])[1];
    const gc = (n.href.match(/genrecd=(\d+)/) || [])[1];
    const genre = un.genres.find((g) => g.href.includes(`keijitype=${kt}&`) && new RegExp(`genrecd=${gc}(?!\\d)`).test(g.href));
    if (genre) {
      const hit2 = (await GX.fetchGenreNotices(genre.href)).find((x) => x.seqNo === n.seqNo);
      if (hit2) return hit2;
    }
    throw new Error('この連絡は一覧に見つかりませんでした（掲載期間が終わった可能性があります）');
  };

  GX.openNotice = async (n) => {
    const fresh = await GX.freshNotice(n);
    const d = await GX.fetchNoticeDetail(fresh.href);
    if (!d.title) throw new Error('学情から本文を取得できませんでした');
    return { ...d, genreHref: fresh.genreHref || n.genreHref || null };
  };

  // 添付ファイルをダウンロードする：最新の詳細ページから添付のリンクを取り直し、
  // ファイルとして保存する（新しいタブを開かないので、スマホでもこの画面のまま保存できる）
  // 添付ファイル1つを取得する（att.href は直前に開いた詳細ページのリンク）
  GX.fetchAttachment = async (att) => {
    const res = await doFetch(att.href, { credentials: 'include' });
    if (!res.ok) throw new Error(`ダウンロードに失敗しました（HTTP ${res.status}）`);
    const type = res.headers.get('content-type') || '';
    if (/text\/html/i.test(type)) throw new Error('学情がファイルを返しませんでした。もう一度お試しください');
    const blob = await res.blob();
    const cd = res.headers.get('content-disposition') || '';
    const fromHeader = (() => {
      const m = cd.match(/filename\*=UTF-8''([^;]+)/i) || cd.match(/filename="?([^";]+)"?/i);
      if (!m) return '';
      try {
        return decodeURIComponent(m[1]);
      } catch (e) {
        return m[1];
      }
    })();
    return { blob, name: att.name || fromHeader || 'download' };
  };

  GX.saveBlob = (blob, name) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 30000);
    return name;
  };

  GX.downloadAttachment = async (n, index, name) => {
    const d = await GX.openNotice(n);
    const att = d.attachments.find((a) => a.index === index) || d.attachments[index];
    if (!att) throw new Error('添付ファイルが見つかりませんでした');
    const f = await GX.fetchAttachment(att);
    return GX.saveBlob(f.blob, name || f.name);
  };

  // 連絡の添付ファイルをまとめて取得する。連絡ごとに最新の詳細ページを開き直してから取得する
  //   notices：連絡の配列、onProgress(done, total, label)
  //   戻り値：{ files: [{ path, blob }], skipped: [{ title, why }] }
  GX.collectAttachments = async (notices, onProgress = () => {}) => {
    const files = [];
    const skipped = [];
    const safe = (t) => String(t || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 60) || '無題';
    const used = new Set();
    const uniq = (p) => {
      let q = p;
      for (let i = 2; used.has(q); i++) q = p.replace(/(\.[^./]+)?$/, (ext) => `(${i})${ext || ''}`);
      used.add(q);
      return q;
    };
    for (let k = 0; k < notices.length; k++) {
      const n = notices[k];
      onProgress(k, notices.length, n.title);
      try {
        let d = await GX.openNotice(n);
        if (!d.attachments.length) {
          skipped.push({ title: n.title, why: '添付ファイルなし' });
          continue;
        }
        const date = n.date ? new Date(n.date) : null;
        const folder = safe(`${date ? `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}_` : ''}${d.title || n.title}`);
        for (let i = 0; i < d.attachments.length; i++) {
          let f;
          try {
            f = await GX.fetchAttachment(d.attachments[i]);
          } catch (e) {
            // リンクが古くなっていたら、詳細ページを開き直してもう一度
            d = await GX.openNotice(n);
            f = await GX.fetchAttachment(d.attachments[i]);
          }
          files.push({ path: uniq(`${folder}/${safe(f.name)}`), blob: f.blob });
        }
      } catch (e) {
        if (e instanceof GX.AuthError) throw e;
        skipped.push({ title: n.title, why: e.message });
      }
    }
    onProgress(notices.length, notices.length, '');
    return { files, skipped };
  };

  // ===== ZIP（無圧縮・UTF-8 のファイル名）を作る：外部ライブラリなし =====
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  const crc32 = (u8) => {
    let c = 0xffffffff;
    for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  GX.makeZip = async (files) => {
    const enc = new TextEncoder();
    const parts = [];
    const central = [];
    let offset = 0;
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    for (const f of files) {
      const data = new Uint8Array(await f.blob.arrayBuffer());
      const name = enc.encode(f.path);
      const crc = crc32(data);
      const head = new DataView(new ArrayBuffer(30));
      head.setUint32(0, 0x04034b50, true);
      head.setUint16(4, 20, true);
      head.setUint16(6, 0x0800, true); // ファイル名は UTF-8
      head.setUint16(8, 0, true); // 無圧縮
      head.setUint16(10, dosTime, true);
      head.setUint16(12, dosDate, true);
      head.setUint32(14, crc, true);
      head.setUint32(18, data.length, true);
      head.setUint32(22, data.length, true);
      head.setUint16(26, name.length, true);
      head.setUint16(28, 0, true);
      parts.push(head.buffer, name, data);
      const cd = new DataView(new ArrayBuffer(46));
      cd.setUint32(0, 0x02014b50, true);
      cd.setUint16(4, 20, true);
      cd.setUint16(6, 20, true);
      cd.setUint16(8, 0x0800, true);
      cd.setUint16(10, 0, true);
      cd.setUint16(12, dosTime, true);
      cd.setUint16(14, dosDate, true);
      cd.setUint32(16, crc, true);
      cd.setUint32(20, data.length, true);
      cd.setUint32(24, data.length, true);
      cd.setUint16(28, name.length, true);
      cd.setUint32(42, offset, true);
      central.push(cd.buffer, name);
      offset += 30 + name.length + data.length;
    }
    const cdSize = central.reduce((a, b) => a + b.byteLength, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true);
    end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
  };

  // 既読処理：一覧を取り直し → 対象の詳細を順に読み込む（別タブは開かない）
  GX.markNoticesRead = async (seqNos, onProgress = () => {}) => {
    const targets = new Set(seqNos.map(String));
    const total = targets.size;
    let done = 0;
    let rounds = 0;
    while (targets.size && rounds < 50) {
      rounds++;
      const { doc, url } = await GX.getDoc(GX.flowUrl(GX.FLOWS.notices));
      const table = findTable(doc, ['掲載日時', '表題']);
      const rows = table ? GX.parseNoticeTable(table, url) : [];
      const batch = rows.filter((r) => targets.has(r.seqNo)).slice(0, 10);
      // 一覧から消えたもの（既読済み・期間切れ）は完了扱い
      for (const s of [...targets]) {
        if (!rows.some((r) => r.seqNo === s)) {
          targets.delete(s);
          done++;
        }
      }
      if (!batch.length) break;
      for (const r of batch) {
        if (!GX.isReadTrigger(r.href)) continue; // 想定外のURLは読み込まない
        await doFetch(r.href, { credentials: 'include' });
        targets.delete(r.seqNo);
        done++;
        onProgress(done, total);
        await GX.sleep(250); // 学情に負担をかけないよう間隔を空ける
      }
    }
    onProgress(total, total);
    return done;
  };

  // ===== 成績 =====
  GX.HYOGO = ['秀', '優', '良', '可', '不可'];
  GX.parseGradeTable = (table) => {
    const ix = headerIndex(table, {
      no: 'No.',
      code: '開講番号',
      name: '科目',
      teacher: '担当教員',
      kubun: '科目区分',
      hissen: '必選区分',
      credits: '単位数',
      score: '得点',
      hyogo: '評語',
      gouhi: '合否',
      gp: 'GP',
      year: '修得年度',
      term: '修得学期',
      report: '報告日',
    });
    return [...table.rows].slice(1).map((tr) => {
      const c = tr.cells;
      const get = (k) => (ix[k] >= 0 ? GX.txt(c[ix[k]]) : '');
      const scoreNum = get('score') === '' ? null : Number(get('score'));
      const gpNum = get('gp') === '' ? null : Number(get('gp'));
      const name = get('name');
      return {
        row: tr,
        no: Number(get('no')) || 0,
        code: get('code'),
        name: name.replace(/◆/g, '').trim(),
        remote: name.includes('◆'),
        teacher: get('teacher'),
        kubun: get('kubun'),
        hissen: get('hissen'),
        credits: Number(get('credits')) || 0,
        score: Number.isFinite(scoreNum) ? scoreNum : null,
        hyogo: get('hyogo'),
        gouhi: get('gouhi'),
        gp: Number.isFinite(gpNum) ? gpNum : null,
        year: get('year'),
        term: get('term'),
        report: get('report'),
      };
    });
  };

  // 新潟大学の算出方法：GP =（得点 − 50）/ 10。不可（59点以下）は 0 として扱う（参考値）
  GX.gpOf = (g) => {
    if (g.gp != null) return g.gp;
    if (g.score == null) return null;
    return g.score < 60 ? 0 : (g.score - 50) / 10;
  };

  GX.summarizeGrades = (list) => {
    const graded = list.filter((g) => g.score != null && GX.HYOGO.includes(g.hyogo) && g.credits > 0);
    const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
    const credits = sum(graded, (g) => g.credits);
    const earned = sum(
      list.filter((g) => g.gouhi === '合'),
      (g) => g.credits
    );
    return {
      count: graded.length,
      credits,
      earned,
      pending: list.filter((g) => !g.hyogo && !g.gouhi).length,
      weightedAvg: credits ? sum(graded, (g) => g.score * g.credits) / credits : null,
      simpleAvg: graded.length ? sum(graded, (g) => g.score) / graded.length : null,
      gpa: credits ? sum(graded, (g) => GX.gpOf(g) * g.credits) / credits : null,
      dist: Object.fromEntries(GX.HYOGO.map((h) => [h, list.filter((g) => g.hyogo === h).length])),
    };
  };

  // 画面の「所属」「学年」の欄を読む（見出しのセルの次のセル。なければ同じセルの中の「所属 ◯◯」）
  const PROFILE_LABELS = ['学籍番号', '氏名', '所属', '学年', '学科', '専攻', '修得単位数', '入学年度', '在籍状況', '指導教員'];
  GX.profileFromDoc = (doc) => {
    const out = {};
    const cells = [...doc.querySelectorAll('th, td')];
    for (const [key, label] of [['dept', '所属'], ['grade', '学年']]) {
      const c = cells.find((el) => GX.txt(el).replace(/[\s:：]/g, '') === label);
      const next = c?.nextElementSibling;
      if (next) out[key] = GX.txt(next);
    }
    if (!out.dept || !out.grade) {
      const t = GX.txt(doc.body);
      const stop = PROFILE_LABELS.join('|');
      for (const [key, label] of [['dept', '所属'], ['grade', '学年']]) {
        if (out[key]) continue;
        const m = t.match(new RegExp(`(?:^|\\s)${label}\\s*[:：]?\\s*(.+?)\\s*(?=\\s(?:${stop})(?:\\s|[:：])|$)`));
        if (m) out[key] = m[1].trim().slice(0, 60);
      }
    }
    return out;
  };
  // 「3年」「３」「3年次」→ 3。読めなければ 0（推測しない）
  GX.gradeNumber = (g) => {
    const m = String(g || '').replace(/[０-９]/g, (c) => '０１２３４５６７８９'.indexOf(c)).match(/^\s*([1-6])\s*(年|年次)?\s*$/);
    return m ? Number(m[1]) : 0;
  };
  // 医学部医学科かどうか（保健学科などは含めない）
  GX.isMedDept = (dept) => {
    const d = String(dept || '').replace(/\s+/g, '');
    return /医学部/.test(d) && /医学科/.test(d) && !/保健学科/.test(d);
  };

  GX.fetchGrades = async () => {
    const { doc } = await GX.getDoc(GX.flowUrl(GX.FLOWS.grades));
    const table = tableOrEnglish(doc, findTable(doc, ['単位数', '評語']));
    const list = table ? GX.parseGradeTable(table).map(({ row, ...g }) => g) : [];
    const headText = GX.txt(doc.querySelector('table'));
    const earnedTotal = Number((headText.match(/修得単位数\s*([\d.]+)/) || [])[1]) || null;
    const prof = GX.profileFromDoc(doc);
    const grade = prof.grade || (headText.match(/学年\s*(\S+)/) || [])[1] || '';
    const dept = prof.dept || (headText.match(/所属\s*(\S+)/) || [])[1] || '';
    return { list, earnedTotal, grade, dept };
  };

  // ===== 授業ポートフォリオの新着 =====
  GX.fetchNews = async () => {
    const { doc, url } = await GX.getDoc(GX.flowUrl(GX.FLOWS.portfolio));
    return [...doc.querySelectorAll('#readmore li')]
      .map((li) => {
        const a = li.querySelector('a');
        if (!a) return null;
        const text = GX.txt(a);
        const kind = /レポート/.test(text)
          ? 'report'
          : /小テスト/.test(text)
            ? 'quiz'
            : /連絡通知/.test(text)
              ? 'notice'
              : 'other';
        return {
          date: (GX.txt(li).match(/\d{4}\/\d{2}\/\d{2}/) || [''])[0],
          text,
          kind,
          href: GX.abs(a.getAttribute('href'), url),
        };
      })
      .filter(Boolean);
  };

  // ===== フォームの値をまとめる（hidden を含む。同名は最初の値） =====
  const formParams = (form) => {
    const p = {};
    [...form.elements].forEach((e) => {
      if (!e.name || e.name in p) return;
      if ((e.type === 'checkbox' || e.type === 'radio') && !e.checked) return;
      if (e.type === 'button' || e.type === 'submit') return;
      p[e.name] = e.value;
    });
    return p;
  };

  // ===== スケジュール（月表示） =====
  const SCH_KIND = [
    [/^\[休日\]/, 'holiday'],
    [/^\[レポート\]/, 'report'],
    [/^\[小テスト\]/, 'quiz'],
    [/^\[アンケート\]/, 'survey'],
    [/^\[(休講|補講|教室変更)/, 'kyuko'],
    [/^\[成績/, 'grade'],
  ];
  GX.fetchSchedule = async (offset = 0) => {
    let { doc, url } = await GX.getDoc(GX.flowUrl(GX.FLOWS.schedule));
    for (let i = 0; i < Math.abs(offset); i++) {
      const form = doc.forms.ScheduleListForm || doc.getElementById('ScheduleListForm');
      if (!form) break;
      const p = formParams(form);
      p._eventId = offset > 0 ? 'setNextMonth' : 'setPrevMonth';
      ({ doc, url } = await GX.post(GX.abs(form.getAttribute('action') || 'campussquare.do', url), p));
    }
    const label = (doc.body.textContent.match(/(\d{4})年\s*(\d{1,2})月/) || []);
    const year = Number(label[1]);
    const month = Number(label[2]);
    const days = [];
    doc.querySelectorAll('td').forEach((td) => {
      const num = td.querySelector('.cal-head-number');
      if (!num) return;
      const day = Number(GX.txt(num));
      const add = td.querySelector('[onclick*="addSchedule("]')?.getAttribute('onclick') || '';
      const ymd = (add.match(/addSchedule\((\d{8})\)/) || [])[1];
      const date = ymd ? new Date(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8)) : new Date(year, month - 1, day);
      const items = [...td.querySelectorAll('.cal-content span, .cal-content a')]
        .map((s) => GX.txt(s))
        .filter(Boolean)
        .map((text) => ({ text, kind: (SCH_KIND.find(([re]) => re.test(text)) || [, 'other'])[1] }));
      days.push({ date, cls: td.className, items });
    });
    return { year, month, days };
  };

  // ===== 休講・補講・教室変更（一覧形式・変更情報のみ） =====
  GX.fetchKyuko = async () => {
    let { doc, url } = await GX.getDoc(GX.flowUrl(GX.FLOWS.kyuko));
    const form = doc.forms.searchForm;
    if (form) {
      const p = formParams(form);
      p.dispType = 'list';
      p.dispData = 'chg';
      p._eventId_search = '表示';
      ({ doc, url } = await GX.post(GX.abs(form.getAttribute('action') || 'campussquare.do', url), p));
    }
    const table = findTable(doc, ['日付', '時限', '開講番号']);
    if (!table) return [];
    const ix = headerIndex(table, { date: '日付', period: '時限', code: '開講番号', name: '科目', teacher: '教員名', room: '講義室' });
    return [...table.rows]
      .slice(1)
      .filter((tr) => tr.cells.length > 2)
      .map((tr) => {
        const get = (k) => (ix[k] >= 0 ? GX.txt(tr.cells[ix[k]]) : '');
        const rowText = GX.txt(tr);
        return {
          date: get('date'),
          period: get('period'),
          code: get('code'),
          name: get('name'),
          teacher: get('teacher'),
          room: get('room'),
          kind: /休講/.test(rowText) ? '休講' : /補講/.test(rowText) ? '補講' : /教室変更/.test(rowText) ? '教室変更' : '変更',
        };
      });
  };

  // ===== 履修（時間割・登録状況） =====
  GX.fetchRishu = async (termHref) => {
    const { doc, url } = await GX.getDoc(termHref || GX.flowUrl(GX.FLOWS.rishu));
    const head = (doc.body.textContent.match(/(\d{4})年度\s*(第\S+?学期|\S+期)/) || []);
    const terms = [...doc.querySelectorAll('a[href*="_eventId=search"][href*="gakkiKbnCode"]')].map((a) => ({
      label: GX.txt(a),
      href: GX.abs(a.getAttribute('href'), url),
    }));
    const callArgs = (el) => {
      const m = (el?.getAttribute('onclick') || '').match(/CallDetail\('(\w+)','(\w+)','(\w+)'/);
      return m ? { nendo: m[1], shozoku: m[2], code: m[3] } : null;
    };
    // コマ表：行＝時限、列＝曜日
    const grid = doc.querySelector('table.rishu-koma');
    const dayNames = grid ? [...grid.rows[0].cells].map((c) => GX.txt(c)) : [];
    const slots = [];
    if (grid) {
      [...grid.rows].slice(1).forEach((tr) => {
        const period = GX.txt(tr.cells[0]);
        [...tr.cells].slice(1).forEach((td, i) => {
          const text = GX.txt(td).replace(/追加/g, '').trim();
          if (!text) return;
          const link = td.querySelector('[onclick*="CallDetail"]');
          slots.push({ period, day: dayNames[i + 1] || dayNames[i] || '', text, ...(callArgs(link) || {}) });
        });
      });
    }
    // 集中講義など
    const etcTable = doc.querySelector('table.rishu-etc');
    const others = etcTable
      ? [...etcTable.rows]
          .filter((tr) => tr.querySelector('[onclick*="CallDetail"]'))
          .map((tr) => ({
            ...callArgs(tr.querySelector('[onclick*="CallDetail"]')),
            name: GX.txt(tr.cells[1]),
            room: GX.txt(tr.cells[2]),
            period: GX.txt(tr.cells[3]),
            credits: GX.txt(tr.cells[4]),
            note: GX.txt(tr.cells[5]),
          }))
      : [];
    const updated = (doc.body.textContent.match(/最終更新日時：\s*([\d/: ]+)/) || [])[1] || '';
    return { year: head[1] || '', term: head[2] || '', terms, dayNames: dayNames.slice(1), slots, others, updated: updated.trim() };
  };

  // ===== 授業ポートフォリオ（履修科目の一覧） =====
  GX.fetchCourses = async () => {
    const { doc, url } = await GX.getDoc(GX.flowUrl(GX.FLOWS.portfolio));
    const table = doc.querySelector('table.list_tbl');
    if (!table) return [];
    return [...table.rows]
      .slice(1)
      .map((tr) => {
        const a = tr.cells[1]?.querySelector('a');
        if (!a) return null;
        const flags = [...tr.querySelectorAll('a.iTip[title]')]
          .map((x) => x.getAttribute('title'))
          .filter((t) => /されています/.test(t))
          .map((t) => t.replace(/が登録されています。?/, ''));
        const href = GX.abs(a.getAttribute('href'), url);
        const q = (k) => (href.match(new RegExp(`[?&]${k}=([^&#]+)`, 'i')) || [])[1] || '';
        return { name: GX.txt(a), href, slot: GX.txt(tr.cells[3]), flags, code: q('jikanwariCd'), nendo: q('nendo'), shozoku: q('jikanwariShozokuCd') };
      })
      .filter(Boolean);
  };

  // ===== 出欠状況 =====
  GX.fetchAttendance = async () => {
    const { doc } = await GX.getDoc(GX.flowUrl(GX.FLOWS.attendance));
    const table = findTable(doc, ['開講番号', '出席回数']);
    if (!table) return [];
    const ix = headerIndex(table, {
      code: '開講番号',
      name: '科目名',
      slot: '曜日・時限',
      teacher: '担当教員',
      alert: 'アラート条件',
      present: '出席回数',
      absent: '欠席回数',
      late: '遅刻回数',
      early: '早退回数',
    });
    return [...table.rows]
      .slice(1)
      .filter((tr) => tr.cells.length > 5)
      .map((tr) => {
        const get = (k) => (ix[k] >= 0 ? GX.txt(tr.cells[ix[k]]) : '');
        const start = Math.max(ix.early, ix.late, ix.absent) + 2; // 「無効回数」の次から各回の記録
        const marks = [...tr.cells].slice(start).map((c) => GX.txt(c)).filter((t) => t && t !== '/');
        return {
          code: get('code'),
          name: get('name'),
          slot: get('slot'),
          teacher: get('teacher'),
          alert: get('alert'),
          present: Number(get('present')) || 0,
          absent: Number(get('absent')) || 0,
          late: Number(get('late')) || 0,
          early: Number(get('early')) || 0,
          marks,
        };
      });
  };

  // ===== フォーラム（トピック一覧） =====
  GX.fetchForum = async () => {
    const { doc } = await GX.getDoc(GX.flowUrl(GX.FLOWS.forum));
    const forums = [...doc.querySelectorAll('a[onclick*="displayTopic("]')].map((a) => {
      const t = GX.txt(a);
      const m = t.match(/^(.*?)\s*(\d+)?$/);
      return { name: m ? m[1] : t, count: m && m[2] ? Number(m[2]) : null };
    });
    const table = doc.querySelector('table.listing');
    const topics = table
      ? [...table.rows]
          .slice(1)
          .filter((tr) => tr.cells.length >= 3)
          .map((tr) => ({
            title: GX.txt(tr.cells[0]),
            comments: GX.txt(tr.cells[1]),
            updated: GX.txt(tr.cells[2]),
            status: GX.txt(tr.cells[3]),
          }))
      : [];
    const current = (GX.txt(doc.body).match(/Info\s+(.+?)\s+投稿順/) || [])[1] || '';
    return { forums, topics, current };
  };

  // ===== シラバス =====
  GX.searchSyllabus = async ({ nendo, name = '', teacher = '', code = '', keyword = '' }) => {
    const { doc, url } = await GX.getDoc(GX.flowUrl(GX.FLOWS.syllabus));
    const form = doc.forms.SearchForm;
    if (!form) throw new Error('シラバスの検索画面が見つかりません');
    const p = formParams(form);
    Object.assign(p, { _eventId: 'search', kaikoKamokunm: name, kyokannm: teacher, kaikoNo: code, freeWord1: keyword, _displayCount: '200' });
    if (nendo) p.nendo = String(nendo);
    const res = await GX.post(GX.abs(form.getAttribute('action') || 'campussquare.do', url), p);
    const table = findTable(res.doc, ['開講番号', '科目名', '担当教員']);
    const total = Number((res.doc.body.textContent.match(/\d+～\d+\/(\d+)件/) || [])[1] || 0);
    if (!table) return { items: [], total };
    const ix = headerIndex(table, { term: '学期', kaiko: '開講', slot: '曜日・時限', kubun: '科目区分', code: '開講番号', name: '科目名', teacher: '担当教員' });
    const items = [...table.rows]
      .slice(1)
      .map((tr) => {
        const btn = tr.querySelector('[onclick*="refer("]:not([disabled])') || tr.querySelector('[onclick*="refer("]');
        const m = (btn?.getAttribute('onclick') || '').match(/refer\('(\w+)','(\w+)','(\w+)'/);
        if (!m) return null;
        const get = (k) => (ix[k] >= 0 ? GX.txt(tr.cells[ix[k]]) : '');
        return { nendo: m[1], shozoku: m[2], code: m[3], term: get('term'), slot: get('slot'), kubun: get('kubun'), name: get('name'), teacher: get('teacher') };
      })
      .filter(Boolean);
    return { items, total: total || items.length };
  };

  GX.fetchSyllabus = async ({ nendo, shozoku, code }) => {
    const u = `${GX.flowUrl(GX.FLOWS.syllabus)}&nendo=${encodeURIComponent(nendo)}&jikanwarishozokucd=${encodeURIComponent(shozoku)}&jikanwaricd=${encodeURIComponent(code)}&_eventId=syllabus`;
    const { doc } = await GX.getDoc(u);
    const sections = [];
    doc.querySelectorAll('table.syllabus-normal').forEach((t) => {
      // 表の直前の「●授業基本情報」などを見出しにする
      let prev = t.previousSibling;
      let heading = '';
      while (prev && !heading) {
        const tx = (prev.textContent || '').trim();
        if (tx) heading = tx.split('\n').pop().trim();
        prev = prev.previousSibling;
      }
      const rows = [];
      [...t.rows].forEach((tr) => {
        const cells = [...tr.cells];
        for (let i = 0; i < cells.length; i++) {
          if (cells[i].tagName === 'TH') {
            const td = cells[i + 1] && cells[i + 1].tagName === 'TD' ? cells[i + 1] : null;
            const value = document.createElement('div');
            if (td) td.childNodes.forEach((n) => value.appendChild(GX.sanitize(n)));
            rows.push({ label: GX.txt(cells[i]), value });
            if (td) i++;
          }
        }
      });
      if (rows.length) sections.push({ heading: heading.replace(/^●/, ''), rows });
    });
    return { sections, url: u };
  };

  // ===== 安全な本文表示用のサニタイズ =====
  const ALLOWED = new Set(['BR', 'P', 'DIV', 'SPAN', 'B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'FONT', 'A', 'PRE', 'TABLE', 'TBODY', 'THEAD', 'TR', 'TD', 'TH']);
  GX.sanitize = (node) => {
    if (node.nodeType === 3) return document.createTextNode(node.textContent);
    if (node.nodeType !== 1) return document.createTextNode('');
    const tag = node.tagName;
    if (['SCRIPT', 'STYLE', 'FORM', 'INPUT', 'IFRAME', 'OBJECT'].includes(tag)) return document.createTextNode('');
    let out;
    if (!ALLOWED.has(tag)) {
      out = document.createDocumentFragment();
    } else if (tag === 'A') {
      out = document.createElement('a');
      const href = node.getAttribute('href') || '';
      if (/^https?:/i.test(href)) {
        out.href = href;
        out.target = '_blank';
        out.rel = 'noopener noreferrer';
      }
    } else if (tag === 'FONT') {
      out = document.createElement('span');
      const color = node.getAttribute('color');
      if (color && /^#?[\w]+$/.test(color)) out.style.color = color;
    } else {
      out = document.createElement(tag.toLowerCase());
    }
    node.childNodes.forEach((ch) => out.appendChild(GX.sanitize(ch)));
    return out;
  };

  // 本文中の URL をリンクにする（テキストノードのみ対象）
  GX.linkify = (root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      if (!walker.currentNode.parentElement?.closest('a')) nodes.push(walker.currentNode);
    }
    const re = /https?:\/\/[^\s<>"'）)」]+/g;
    nodes.forEach((tn) => {
      const text = tn.textContent;
      if (!re.test(text)) return;
      re.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let last = 0;
      for (const m of text.matchAll(re)) {
        frag.append(text.slice(last, m.index));
        const a = document.createElement('a');
        a.href = m[0];
        a.textContent = m[0];
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        frag.append(a);
        last = m.index + m[0].length;
      }
      frag.append(text.slice(last));
      tn.replaceWith(frag);
    });
    return root;
  };

  // ===== カレンダー（.ics）書き出し =====
  // ===== カレンダー（.ics）の書き出し =====
  // alarms：通知のタイミング（開始の何分前か）の配列。Google カレンダーなどに取り込むと、そのカレンダーの通知（メール通知も可）が使える
  const icsPad = (n) => String(n).padStart(2, '0');
  const icsYmd = (d) => `${d.getFullYear()}${icsPad(d.getMonth() + 1)}${icsPad(d.getDate())}`;
  const icsFmt = (d) => `${icsYmd(d)}T${icsPad(d.getHours())}${icsPad(d.getMinutes())}00`;
  const icsUtc = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const icsEsc = (s) => String(s).replace(/[\;,]/g, (m) => '\\' + m).replace(/\r?\n/g, '\\n');
  // 1行75バイトごとに折り返す（RFC 5545）
  const icsFold = (line) => {
    const enc = new TextEncoder();
    if (enc.encode(line).length <= 75) return line;
    const out = [];
    let cur = '';
    for (const ch of line) {
      if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) {
        out.push(cur);
        cur = '';
      }
      cur += ch;
    }
    out.push(cur);
    return out.join('\r\n ');
  };
  const icsAlarm = (min, text) => {
    const m = Number(min);
    const trig = m % 1440 === 0 ? `-P${m / 1440}D` : m % 60 === 0 ? `-PT${m / 60}H` : `-PT${m}M`;
    return ['BEGIN:VALARM', `TRIGGER:${trig}`, 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(text)}`, 'END:VALARM'];
  };
  const icsWrap = (name, events) =>
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//gakujo-plus//JA',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${icsEsc(name)}`,
      'X-WR-TIMEZONE:Asia/Tokyo',
      'BEGIN:VTIMEZONE',
      'TZID:Asia/Tokyo',
      'BEGIN:STANDARD',
      'DTSTART:19700101T000000',
      'TZOFFSETFROM:+0900',
      'TZOFFSETTO:+0900',
      'TZNAME:JST',
      'END:STANDARD',
      'END:VTIMEZONE',
      ...events.flat(),
      'END:VCALENDAR',
    ]
      .map(icsFold)
      .join('\r\n');
  GX.ALARM_CHOICES = [[0, '通知なし'], [10, '10分前'], [30, '30分前'], [60, '1時間前'], [180, '3時間前'], [1440, '1日前']];

  GX.toIcs = (reports, { alarms = [1440] } = {}) => {
    const now = new Date();
    return icsWrap(
      '学情 課題締切',
      reports
        .filter((r) => r.end)
        .map((r) => [
          'BEGIN:VEVENT',
          `UID:gakujo-${r.id}-${icsFmt(r.end)}@gakujo-plus`,
          `DTSTAMP:${icsUtc(now)}`,
          `DTSTART;TZID=Asia/Tokyo:${icsFmt(new Date(r.end.getTime() - 30 * 60000))}`,
          `DTEND;TZID=Asia/Tokyo:${icsFmt(r.end)}`,
          `SUMMARY:${icsEsc(`【締切】${r.title}`)}`,
          `DESCRIPTION:${icsEsc(`${r.type}／${r.course}（${r.code}）\n提出期間: ${r.start ? r.start.toLocaleString('ja-JP') : ''} ～ ${r.end.toLocaleString('ja-JP')}`)}`,
          ...alarms.filter((m) => m > 0).flatMap((m) => icsAlarm(m, `締切が近づいています：${r.title}`)),
          'END:VEVENT',
        ])
    );
  };

  // 医学科の授業日程（講義概要 PDF から読み取ったもの）。出典のページを必ず書き添える
  GX.medIcs = (events, { alarms = [], source = '講義概要', calName = '医学科 授業日程' } = {}) => {
    const now = new Date();
    const hash = (t) => [...t].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);
    return icsWrap(
      calName,
      events.map((e) => {
        const d = e.date.replace(/-/g, '');
        const next = new Date(`${e.date}T00:00:00`);
        next.setDate(next.getDate() + 1);
        const timed = !e.holiday;
        return [
          'BEGIN:VEVENT',
          `UID:gxmed-${d}-${e.start.replace(':', '')}-${e.grade}-${hash(e.title)}@gakujo-plus`,
          `DTSTAMP:${icsUtc(now)}`,
          timed ? `DTSTART;TZID=Asia/Tokyo:${d}T${e.start.replace(':', '')}00` : `DTSTART;VALUE=DATE:${d}`,
          timed ? `DTEND;TZID=Asia/Tokyo:${d}T${e.end.replace(':', '')}00` : `DTEND;VALUE=DATE:${icsYmd(next)}`,
          `SUMMARY:${icsEsc(e.title)}`,
          `DESCRIPTION:${icsEsc(`${e.grade}年次・${e.term}${e.week ? `・第${e.week}週` : ''}\n出典：${source} PDF ${e.page}ページ目\n※講義概要から自動で読み取った日程です。変更は学情の連絡・休講補講の情報を優先してください。`)}`,
          timed ? 'TRANSP:OPAQUE' : 'TRANSP:TRANSPARENT',
          ...(timed ? alarms.filter((m) => m > 0).flatMap((m) => icsAlarm(m, `まもなく：${e.title}`)) : []),
          'END:VEVENT',
        ];
      })
    );
  };

  // 1件の予定（連絡の本文中の日付など）を .ics にする
  GX.eventIcs = ({ title, date, hasTime, description = '', alarms = [] }) => {
    const end = hasTime ? new Date(date.getTime() + 60 * 60000) : new Date(date.getTime() + 86400000);
    return icsWrap(title, [
      [
        'BEGIN:VEVENT',
        `UID:gakujo-note-${icsFmt(date)}-${Math.random().toString(36).slice(2)}@gakujo-plus`,
        `DTSTAMP:${icsUtc(new Date())}`,
        hasTime ? `DTSTART;TZID=Asia/Tokyo:${icsFmt(date)}` : `DTSTART;VALUE=DATE:${icsYmd(date)}`,
        hasTime ? `DTEND;TZID=Asia/Tokyo:${icsFmt(end)}` : `DTEND;VALUE=DATE:${icsYmd(end)}`,
        `SUMMARY:${icsEsc(title)}`,
        `DESCRIPTION:${icsEsc(description)}`,
        ...(hasTime ? alarms.filter((m) => m > 0).flatMap((m) => icsAlarm(m, title)) : []),
        'END:VEVENT',
      ],
    ]);
  };

  GX.download = (filename, text, type = 'text/calendar') => {
    const blob = new Blob([text], { type: `${type};charset=utf-8` });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
  };

  // 締切までの残り時間を人が読める形に
  GX.until = (date, now = Date.now()) => {
    if (!date) return { text: '', level: 'none' };
    const ms = date.getTime() - now;
    if (ms <= 0) return { text: '締切済み', level: 'past' };
    const min = Math.floor(ms / 60000);
    const h = Math.floor(min / 60);
    const d = Math.floor(h / 24);
    const text = d >= 1 ? `あと${d}日${h % 24 ? `${h % 24}時間` : ''}` : h >= 1 ? `あと${h}時間${min % 60}分` : `あと${min}分`;
    const level = h < 24 ? 'urgent' : h < 72 ? 'soon' : 'later';
    return { text, level };
  };

  GX.fmtDate = (d, withTime = true) => {
    if (!d) return '';
    const w = '日月火水木金土'[d.getDay()];
    const base = `${d.getMonth() + 1}/${d.getDate()}(${w})`;
    return withTime ? `${base} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : base;
  };
})();
