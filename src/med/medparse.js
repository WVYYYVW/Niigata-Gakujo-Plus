// 学情プラス — 医学科「講義概要」PDF の読み取り（授業時間割表と各科目の講義概要）
// PDF は利用者の端末の中だけで読み取り、外部には送信しない。
// pdf.js の document オブジェクトを受け取り、時間割の予定と科目ごとの本文を返す。
(function (root) {
  'use strict';

  const ZEN = '０１２３４５６７８９';
  const toHalf = (s) => String(s).replace(/[０-９]/g, (c) => String(ZEN.indexOf(c)));
  const norm = (s) => toHalf(s).replace(/[：]/g, ':').replace(/\s+/g, ' ').trim();

  // 「令令和和」のように同じ文字を二重に描いた文字列を元に戻す
  const undouble = (s) => {
    if (s.length >= 4 && s.length % 2 === 0) {
      let ok = true;
      for (let i = 0; i < s.length; i += 2) if (s[i] !== s[i + 1]) ok = false;
      if (ok) return s.replace(/(.)\1/g, '$1');
    }
    return s;
  };

  // ページの文字と、表の枠（塗り・線の四角形）を取り出す。座標は上から下へ増える向き
  const readPage = async (page, OPS) => {
    const vp = page.getViewport({ scale: 1 });
    const H = vp.height;
    const tc = await page.getTextContent();
    const items = tc.items
      .filter((it) => it.str && it.str.trim())
      .map((it) => {
        const size = Math.abs(it.transform[3]) || it.height || 7;
        const base = H - it.transform[5];
        return { str: undouble(it.str), x: it.transform[4], w: it.width, top: base - size * 0.88, bottom: base + size * 0.12, base, size };
      });
    const rects = [];
    if (OPS) {
      const ol = await page.getOperatorList();
      const mul = (a, b) => [
        a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
        a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
        a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
      ];
      let ctm = [1, 0, 0, 1, 0, 0];
      const stack = [];
      const pt = (x, y) => [ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5]];
      for (let i = 0; i < ol.fnArray.length; i++) {
        const fn = ol.fnArray[i];
        const args = ol.argsArray[i];
        if (fn === OPS.save) stack.push(ctm.slice());
        else if (fn === OPS.restore) ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
        else if (fn === OPS.transform) ctm = mul(ctm, args);
        else if (fn === OPS.constructPath) {
          const [ops, coords] = args;
          const pts = [];
          let k = 0;
          for (const op of ops) {
            if (op === OPS.rectangle) {
              const [x, y, w, h] = coords.slice(k, k + 4);
              pts.push(pt(x, y), pt(x + w, y + h));
              k += 4;
            } else if (op === OPS.moveTo || op === OPS.lineTo) {
              pts.push(pt(coords[k], coords[k + 1]));
              k += 2;
            } else if (op === OPS.curveTo) k += 6;
            else if (op === OPS.curveTo2 || op === OPS.curveTo3) k += 4;
          }
          if (pts.length >= 2) {
            const xs = pts.map((p) => p[0]);
            const ys = pts.map((p) => H - p[1]);
            const r = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
            if (r.x1 - r.x0 > 0.2 || r.y1 - r.y0 > 0.2) rects.push(r);
          }
        }
      }
    }
    return { items, rects, H };
  };

  // 文字を行ごとにまとめて文章にする（重ね描きの重複は取り除く）
  const linesOf = (items) => {
    const sorted = items.slice().sort((a, b) => a.base - b.base || a.x - b.x);
    const lines = [];
    for (const it of sorted) {
      const line = lines.find((l) => Math.abs(l.base - it.base) < it.size * 0.45);
      if (line) line.items.push(it);
      else lines.push({ base: it.base, items: [it] });
    }
    return lines
      .sort((a, b) => a.base - b.base)
      .map((l) => {
        const chars = [];
        l.items
          .sort((a, b) => a.x - b.x)
          .forEach((it) => {
            const cw = it.w / Math.max(1, it.str.length);
            [...it.str].forEach((ch, i) => chars.push({ ch, x: it.x + i * cw, cw }));
          });
        chars.sort((a, b) => a.x - b.x);
        let out = '';
        let last = null;
        for (const c of chars) {
          if (last && c.ch === last.ch && Math.abs(c.x - last.x) < Math.max(1.5, last.cw * 0.6)) continue; // 重なった同じ文字
          if (last && c.x - (last.x + last.cw) > last.cw * 1.2 && !/\s$/.test(out)) out += ' ';
          out += c.ch;
          last = c;
        }
        return { base: l.base, x0: Math.min(...l.items.map((i) => i.x)), x1: Math.max(...l.items.map((i) => i.x + i.w)), text: out.replace(/\s+/g, ' ').trim() };
      });
  };

  const center = (o) => ({ cx: o.x + o.w / 2, cy: (o.top + o.bottom) / 2 });
  const RE_HEAD = /([2-6２-６])\s*年?\s*次生\s*・\s*第\s*([1-2１２])\s*学期/;
  const RE_WEEK = /^第\s*(\d+)\s*週/;
  const RE_DATE = /^(\d{1,2})月(\d{1,2})日\s*[（(](.)[）)]$/;
  const RE_HOLIDAY = /^(\S{1,8}の日|振替休日|国民の(祝|休)日|天皇誕生日|元日)$/;
  const RE_TIME = /^(\d{1,2}):(\d{2})\s*～\s*(\d{1,2}):(\d{2})$/;


  // ===== 画像（ピクセル）による照合 =====
  // pg.raster = { data: RGBA, width, height, sx, sy }（sx, sy：1pt あたりのピクセル数）
  // 1) 各列・各時限の境目に罫線が「描かれているか」をピクセルで判定し、コマのまとまり方が文字・図形からの読み取りと一致するか
  // 2) 各コマの中に、読み取った文字以外の描画（画像になった文字など）がないか
  const rasterCheck = (pg, g) => {
    const R = pg.raster;
    const dark = (xpt, ypt) => {
      const x = Math.round(xpt * R.sx);
      const y = Math.round(ypt * R.sy);
      if (x < 0 || y < 0 || x >= R.width || y >= R.height) return false;
      const i = (y * R.width + x) * 4;
      if (R.data[i + 3] < 128) return false;
      return Math.max(R.data[i], R.data[i + 1], R.data[i + 2]) < 110;
    };
    const stepX = 1 / R.sx;
    const stepY = 1 / R.sy;
    const boxes = g.body.map((it) => ({ x0: it.x - 1.2, x1: it.x + it.w + 1.2, y0: it.top - 1.2, y1: it.bottom + 1.2 }));
    const inText = (x, y) => boxes.some((b) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1);
    // 線の有無：線が通るはずの位置の前後 ±1.6pt で、1画素の行（列）ごとに濃い画素の割合を求め、最大値を返す。
    // 罫線は端から端まで続くので 0.9 以上になり、文字だけなら途切れるので低くなる
    const lum = (xpt, ypt) => {
      const x = Math.round(xpt * R.sx);
      const y = Math.round(ypt * R.sy);
      if (x < 0 || y < 0 || x >= R.width || y >= R.height) return 255;
      const i = (y * R.width + x) * 4;
      if (R.data[i + 3] < 128) return 255;
      return 0.299 * R.data[i] + 0.587 * R.data[i + 1] + 0.114 * R.data[i + 2];
    };
    // 罫線の画素：両側（線と直角の方向に 2.4pt 離れた所）の明るいほうより明らかに暗い（片側に文字があってもよい）
    const isLinePx = (axis, x, y) => {
      const v = lum(x, y);
      if (v < 60) return true;
      const a = axis === 'h' ? lum(x, y - 2.4) : lum(x - 2.4, y);
      const b = axis === 'h' ? lum(x, y + 2.4) : lum(x + 2.4, y);
      return v < Math.max(a, b) - 25;
    };
    // 戻り値 { all：全体での割合の最大, bare：文字の上を除いた割合の最大（除いた後の点が少なければ null） }
    const lineFill = (axis, fixed, from, to) => {
      let all = 0;
      let bare = null;
      const span = axis === 'h' ? R.sy : R.sx;
      const step = axis === 'h' ? stepX : stepY;
      for (let o = -1.6; o <= 1.6; o += 1 / span) {
        let n = 0;
        let d = 0;
        let nb = 0;
        let db = 0;
        for (let t = from; t <= to; t += step) {
          const [x, y] = axis === 'h' ? [t, fixed + o] : [fixed + o, t];
          const on = isLinePx(axis, x, y);
          n++;
          if (on) d++;
          if (!inText(x, y)) {
            nb++;
            if (on) db++;
          }
        }
        if (n) all = Math.max(all, d / n);
        if (nb >= 8) bare = Math.max(bare ?? 0, db / nb);
      }
      return { all, bare };
    };
    // 罫線あり：true／なし：false／判断できない：null
    // 線があれば文字の有無にかかわらず 0.9 以上になる。文字で全体が覆われている所は、太字の文字でも 0.8 未満なら線なしとみなす
    const hasLine = ({ all, bare }) => {
      if (all >= 0.9) return true;
      if (all < 0.6) return false;
      if (bare != null) return bare < 0.2 ? false : null;
      return all < 0.8 ? false : null;
    };
    const nc = g.dates.length;
    const nr = g.times.length;
    // 列の左右の端（縦罫線の位置）
    const leftEdge = (() => {
      const l = g.vLines.filter((v) => v.x0 < g.dates[0].item.x && v.x0 > g.colEdges[0].x0 - 12 && v.y0 < g.bodyTop + 1 && v.y1 > g.bodyTop - 8).sort((a, b) => b.x0 - a.x0)[0];
      return l ? (l.x0 + l.x1) / 2 : g.colEdges[0].x0;
    })();
    const lastD = g.dates[nc - 1];
    const rightEdge = (() => {
      const l = g.vLines.filter((v) => v.x0 > lastD.item.x + lastD.item.w && v.x0 < g.colEdges[nc - 1].x1 + 12 && v.y0 < g.bodyTop + 1 && v.y1 > g.bodyTop - 8).sort((a, b) => a.x0 - b.x0)[0];
      return l ? (l.x0 + l.x1) / 2 : g.colEdges[nc - 1].x1;
    })();
    const xs = [leftEdge, ...g.bounds.map((b) => b.x), rightEdge];
    // 時限の境目（時限の列の横罫線があればその位置）
    const ys = [g.bodyTop];
    for (let r = 0; r < nr - 1; r++) {
      const mid = (g.times[r].item.bottom + g.times[r + 1].item.top) / 2;
      const l = g.hLines.filter((h) => Math.abs((h.y0 + h.y1) / 2 - mid) < 4 && h.x0 < g.times[r].item.x + 2 && h.x1 > g.times[r].item.x + g.times[r].item.w - 2).sort((a, b) => Math.abs((a.y0 + a.y1) / 2 - mid) - Math.abs((b.y0 + b.y1) / 2 - mid))[0];
      ys.push(l ? (l.y0 + l.y1) / 2 : mid);
    }
    ys.push(g.bodyBottom);
    // ピクセルから、隣り合う枠（列 c・時限 r）がつながっているかを調べる
    const id = (c, r) => c * nr + r;
    const parent = Array.from({ length: nc * nr }, (_, i) => i);
    const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    for (let c = 0; c < nc; c++) {
      for (let r = 0; r < nr - 1; r++) {
        const lf = lineFill('h', ys[r + 1], xs[c] + 3, xs[c + 1] - 3);
        const line = hasLine(lf);
        if (globalThis.GXMED_DEBUG) (g.dbg = g.dbg || []).push(`h c${c} r${r} y${ys[r + 1].toFixed(1)} ${JSON.stringify(lf)}`);
        if (line === false) parent[find(id(c, r + 1))] = find(id(c, r));
        else if (line === null) return `${g.dates[c].mo}月${g.dates[c].d}日の${g.times[r].end}の境目の罫線がはっきりしません` + (globalThis.GXMED_DEBUG ? ` ${JSON.stringify(lf)}` : '');
      }
    }
    for (let c = 0; c < nc - 1; c++) {
      for (let r = 0; r < nr; r++) {
        const lf = lineFill('v', xs[c + 1], ys[r] + 2, ys[r + 1] - 2);
        const line = hasLine(lf);
        if (line === false) parent[find(id(c + 1, r))] = find(id(c, r));
        else if (line === null) return `${g.dates[c].mo}月${g.dates[c].d}日と${g.dates[c + 1].mo}月${g.dates[c + 1].d}日の間の罫線がはっきりしません` + (globalThis.GXMED_DEBUG ? ` ${JSON.stringify(lf)}` : '');
      }
    }
    // 図形から読み取ったコマ（列×時限の集まり）と、ピクセルから読み取ったまとまりが同じか
    const vecOf = new Map();
    g.cells.forEach((cell, k) => {
      const rows = g.times.map((t, r) => r).filter((r) => g.times[r].cy > cell.y0 && g.times[r].cy < cell.y1);
      cell.cols.forEach((c) => rows.forEach((r) => vecOf.set(id(c, r), k)));
    });
    if (vecOf.size !== nc * nr) return '時限の見出しに対応しないコマがあります';
    const groupToVec = new Map();
    const vecToGroup = new Map();
    for (const [i, k] of vecOf) {
      const gr = find(i);
      if ((groupToVec.has(gr) && groupToVec.get(gr) !== k) || (vecToGroup.has(k) && vecToGroup.get(k) !== gr)) {
        const c = Math.floor(i / nr);
        return `${g.dates[c].mo}月${g.dates[c].d}日 ${g.times[i % nr].start}のコマの範囲が一致しません` + (globalThis.GXMED_DEBUG ? ` ys=${ys.map((y) => y.toFixed(1))} cells=${JSON.stringify(g.cells.map((x) => [x.cols, x.y0.toFixed(1), x.y1.toFixed(1)]))} ${g.dbg.filter((d) => d.startsWith(`h c${c} `)).join(' | ')}` : '');
      }
      groupToVec.set(gr, k);
      vecToGroup.set(k, gr);
    }
    // コマの中に、読み取った文字以外の濃い描画がないか（斜線で消したコマは除く）
    for (const cell of g.cells) {
      const x0 = cell.cols[0] === 0 ? leftEdge : xs[cell.cols[0]];
      const x1 = xs[cell.cols[cell.cols.length - 1] + 1];
      const ix0 = Math.ceil((x0 + 2.5) * R.sx);
      const ix1 = Math.floor((x1 - 2.5) * R.sx);
      const iy0 = Math.ceil((cell.y0 + 2.5) * R.sy);
      const iy1 = Math.floor((cell.y1 - 2.5) * R.sy);
      const local = boxes.filter((b) => b.x1 > x0 && b.x0 < x1 && b.y1 > cell.y0 && b.y0 < cell.y1);
      const extra = [];
      for (let y = iy0; y <= iy1; y++) {
        for (let x = ix0; x <= ix1; x++) {
          const i = (y * R.width + x) * 4;
          if (R.data[i + 3] < 128 || Math.max(R.data[i], R.data[i + 1], R.data[i + 2]) >= 110) continue;
          const xp = x / R.sx;
          const yp = y / R.sy;
          // 時限の境目の罫線（コマの内側を横切るもの）は除く
          if (ys.some((yy) => Math.abs(yy - yp) < 1.6) && cell.y0 < yp && yp < cell.y1) continue;
          if (local.some((b) => xp >= b.x0 && xp <= b.x1 && yp >= b.y0 && yp <= b.y1)) continue;
          extra.push([xp, yp]);
        }
      }
      if (extra.length <= 6) continue;
      if (!cell.items.length) {
        const w = x1 - x0;
        const hh = cell.y1 - cell.y0;
        const len = Math.hypot(w, hh);
        const nearDiag = (p) => Math.min(Math.abs((p[1] - cell.y0) * w - (p[0] - x0) * hh), Math.abs((p[1] - cell.y0) * w - (x1 - p[0]) * hh)) / len < 2.5;
        if (extra.filter(nearDiag).length >= extra.length * 0.97) continue; // 斜線で消したコマ
      }
      const c = cell.cols[0];
      return `${g.dates[c].mo}月${g.dates[c].d}日のコマに、文字として読み取れない記載があります`;
    }
    return null;
  };

  // ===== 授業時間割表 =====
  // 方針：誤った予定を表示しないことを最優先にする。
  //  - 各日の列ごとに、表の横罫線で区切られた枠を1コマとして読む
  //  - 時刻は、その枠の高さに入る時限の見出し（8:30～9:30 など）から決める
  //  - 曜日と日付が一致しない・読み残した文字がある・時刻が決まらない週は「読み取れなかった週」として除外する
  const parseTimetablePage = (pg, pageNo) => {
    const flat = norm(pg.items.map((i) => i.str).join(''));
    const head = flat.match(RE_HEAD);
    if (!head || !/授業時間割表/.test(flat)) return { events: [], failed: [], notes: [], weeks: [] };
    const grade = Number(toHalf(head[1]));
    const term = `第${toHalf(head[2])}学期`;
    const pageRoomItem = pg.items.find((i) => /^[（(].*(講義室|実習室)[）)]$/.test(norm(i.str)));
    const pageRoom = pageRoomItem ? norm(pageRoomItem.str).replace(/^[（(]|[）)]$/g, '') : '';
    const hLines = pg.rects.filter((r) => r.y1 - r.y0 < 1.6 && r.x1 - r.x0 > 15);
    const vLines = pg.rects.filter((r) => r.x1 - r.x0 < 1.6 && r.y1 - r.y0 > 3);
    const failed = [];
    const isFooter = (i) => /^[－-]\s*\d+\s*[－-]$/.test(norm(i.str)) && i.base > pg.H * 0.85;
    // 表のひとかたまり（1週間分）は、日付の見出しの行ごとに区切る。
    // 「第N週」の見出しがない表（試験期間など）も、日付の見出しがあれば同じように読む
    const weekItems = pg.items.filter((i) => RE_WEEK.test(norm(i.str)));
    const dateRows = [];
    pg.items
      .filter((i) => RE_DATE.test(norm(i.str)))
      .sort((a, b) => a.base - b.base)
      .forEach((i) => {
        const row = dateRows.find((r) => Math.abs(r.base - i.base) < 2);
        if (row) row.items.push(i);
        else dateRows.push({ base: i.base, items: [i] });
      });
    dateRows.forEach((r, k) => {
      r.top = Math.min(...r.items.map((i) => i.top));
      const prevBase = k ? dateRows[k - 1].base : -Infinity;
      r.wk = weekItems.filter((w) => w.base < r.top && w.base > r.top - 30 && w.base > prevBase + 20).sort((a, b) => b.base - a.base)[0] || null;
      r.start = r.wk ? r.wk.top - 0.5 : r.top - 14;
    });
    // 見出しの行に結びつかない「第N週」があれば、その週は読めていない
    weekItems
      .filter((w) => !dateRows.some((r) => r.wk === w))
      .forEach((w) => {
        const n = Number(norm(w.str).match(RE_WEEK)[1]);
        failed.push({ grade, term, week: n, page: pageNo, label: `${grade}年次・${term}・第${n}週`, why: '表の見出し（日付）を読み取れませんでした' });
      });
    const events = [];
    const weeks = [];
    const notes = [];
    const WD = '日月火水木金土';
    let lastYear = null;
    dateRows.forEach((row, wi) => {
      const wk = row.wk;
      const weekNo = wk ? Number(norm(wk.str).match(RE_WEEK)[1]) : null;
      const yEnd = dateRows[wi + 1] ? dateRows[wi + 1].start : pg.H - 20;
      const yStart = row.start;
      const inWeek = (i) => i.top >= yStart && i.top < yEnd;
      const yr = (wk && Number((norm(wk.str).match(/\(\s*(\d{4})\s*\./) || [])[1])) || lastYear;
      const firstDate = norm(row.items.slice().sort((a, b) => a.x - b.x)[0].str).match(RE_DATE);
      const label = `${grade}年次・${term}・` + (weekNo != null ? `第${weekNo}週` : `週番号なしの表（${firstDate ? `${firstDate[1]}月${firstDate[2]}日〜` : ''}）`);
      let range = {};
      const fail = (why) => failed.push({ grade, term, week: weekNo, page: pageNo, label, why, ...range });
      const dates = row.items
        .map((i) => {
          const m = norm(i.str).match(RE_DATE);
          return { ...center(i), item: i, mo: Number(m[1]), d: Number(m[2]), wd: m[3] };
        })
        .sort((a, b) => a.cx - b.cx);
      const times = pg.items
        .filter((i) => inWeek(i) && RE_TIME.test(norm(i.str)))
        .map((i) => {
          const m = norm(i.str).match(RE_TIME);
          return { ...center(i), item: i, start: `${m[1].padStart(2, '0')}:${m[2]}`, end: `${m[3].padStart(2, '0')}:${m[4]}` };
        })
        .sort((a, b) => a.cy - b.cy);
      if (!yr || !dates.length) return fail('表の見出し（日付）を読み取れませんでした');
      if (dates.length !== new Set(dates.map((d) => Math.round(d.cx))).size) return fail('日付の見出しが重なっています');
      // 時限の見出しは、表の左端（日付の列より左）にあるものだけ。コマの中の「9:00～11:30」などは見出しではない
      const firstDateLeft = Math.min(...dates.map((d) => d.item.x));
      const timeCol = times.filter((t) => t.item.x + t.item.w < firstDateLeft - 2);
      if (timeCol.length < 2) return fail('時限の見出しを読み取れませんでした');
      times.length = 0;
      times.push(...timeCol);
      for (let i = 1; i < times.length; i++) {
        if (!(times[i].start > times[i - 1].start) || !(times[i].cy > times[i - 1].cy)) return fail('時限の見出しの並びが想定と違います');
      }
      // 日付：年をまたぐ週にも対応し、曜日が実際の暦と一致するか確かめる
      const firstMonth = dates[0].mo;
      for (const dt of dates) {
        const y = dt.mo < firstMonth ? yr + 1 : yr;
        const d = new Date(y, dt.mo - 1, dt.d);
        if (WD[d.getDay()] !== dt.wd) return fail(`${dt.mo}月${dt.d}日の曜日（${dt.wd}）が暦と一致しません`);
        dt.iso = `${y}-${String(dt.mo).padStart(2, '0')}-${String(dt.d).padStart(2, '0')}`;
      }
      // 日付は左から右へ、1日ずつ増えていくこと
      for (let i = 1; i < dates.length; i++) if (!(dates[i].iso > dates[i - 1].iso)) return fail('日付の並びが想定と違います');
      lastYear = Number(dates[dates.length - 1].iso.slice(0, 4));
      range = { from: dates[0].iso, to: dates[dates.length - 1].iso };
      // 「第N週（2026.4.27－5.1）」の期間の両端が、表の日付の見出しに含まれていること（照合）
      if (wk) {
        const r = norm(wk.str).replace(/\s+/g, '').match(/\((\d{4})\.(\d{1,2})\.(\d{1,2})[－\-～~](?:(\d{1,2})\.)?(\d{1,2})\)/);
        if (!r) return fail('週の期間の表記を読み取れませんでした');
        const sM = Number(r[2]);
        const eM = r[4] ? Number(r[4]) : sM;
        const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const from = iso(Number(r[1]), sM, Number(r[3]));
        const to = iso(eM < sM ? Number(r[1]) + 1 : Number(r[1]), eM, Number(r[5]));
        const isos = dates.map((d) => d.iso);
        if (!isos.includes(from) || !isos.includes(to)) return fail(`週の期間（${from}〜${to}）と表の日付が一致しません`);
      }
      // 列の境界（日付の見出しの中間）
      const colEdges = dates.map((d, i) => ({
        x0: i === 0 ? Math.max(...times.map((t) => t.item.x + t.item.w)) + 1 : (dates[i - 1].cx + d.cx) / 2,
        x1: i === dates.length - 1 ? d.cx + (d.cx - (dates[i - 1]?.cx ?? d.cx - 70)) / 2 : (d.cx + dates[i + 1].cx) / 2,
      }));
      const bodyTop = Math.max(...dates.map((d) => d.item.bottom));
      // 表の下端：最後の時限の見出しのすぐ下にある、表の幅いっぱいの横罫線
      const lastT = times[times.length - 1];
      const tableW = colEdges[colEdges.length - 1].x1 - colEdges[0].x0;
      const bottomLine = hLines
        .filter((l) => l.y0 > lastT.cy && l.y0 < lastT.cy + 12 && l.x1 - l.x0 > tableW * 0.5)
        .sort((a, b) => a.y0 - b.y0)[0];
      const bodyBottom = bottomLine ? (bottomLine.y0 + bottomLine.y1) / 2 : lastT.item.bottom + 1.5;
      const labelSet = new Set([...times.map((t) => t.item), ...dates.map((d) => d.item)]);
      const isLabel = (it) => labelSet.has(it) || RE_WEEK.test(norm(it.str)) || /^(時間|曜日)$/.test(norm(it.str)) || it === pageRoomItem;
      // 表の本体：見出しの行より下、表の下端より上の、時限の見出しより右にある文字すべて
      const body = pg.items.filter((i) => inWeek(i) && !isLabel(i) && center(i).cy > bodyTop && center(i).cy < bodyBottom && i.x + i.w > colEdges[0].x0 - 1);
      // 時限の列の中に、見出し以外の文字が入り込んでいたら読み取りを中止（想定外の構造）
      const stray = pg.items.filter((i) => inWeek(i) && !isLabel(i) && center(i).cy > bodyTop && center(i).cy < bodyBottom && i.x + i.w <= colEdges[0].x0 - 1);
      if (stray.length) return fail(`時限の列に想定外の文字がありました（${stray.map((i) => i.str).join('').slice(0, 20)}）`);
      const dt0 = (i) => `${dates[i].mo}月${dates[i].d}日`;
      const pending = [];
      // 列と列の境目の縦罫線。見出しの行にあるはず。ない場合は想定外の構造
      const bounds = [];
      for (let i = 0; i < dates.length - 1; i++) {
        const mid = (dates[i].cx + dates[i + 1].cx) / 2;
        const segs = vLines.filter((l) => Math.abs((l.x0 + l.x1) / 2 - mid) < 8 && l.y0 < bodyTop + 1 && l.y1 > bodyTop - 8);
        if (!segs.length) return fail('日付の列の区切り線を読み取れませんでした');
        const x = (segs[0].x0 + segs[0].x1) / 2;
        bounds.push({ x, segs: vLines.filter((l) => Math.abs((l.x0 + l.x1) / 2 - x) < 1.5) });
      }
      // y0〜y1 の範囲で、境目に線が引かれている長さ
      const coveredLen = (b, y0, y1) => {
        const iv = b.segs.map((l) => [Math.max(y0, l.y0), Math.min(y1, l.y1)]).filter(([a, c]) => c > a).sort((p, q) => p[0] - q[0]);
        let len = 0;
        let cur = y0;
        for (const [a, c] of iv) {
          const s = Math.max(a, cur);
          if (c > s) len += c - s;
          cur = Math.max(cur, c);
        }
        return len;
      };
      // 各列を横罫線で区切った枠
      const segsByCol = dates.map((dt, ci) => {
        const col = colEdges[ci];
        const cx = (col.x0 + col.x1) / 2;
        const cuts = [bodyTop, ...hLines.filter((l) => l.x0 < cx && l.x1 > cx && l.y0 > bodyTop - 3 && l.y0 < bodyBottom + 3).map((l) => (l.y0 + l.y1) / 2), bodyBottom]
          .sort((a, b) => a - b)
          .filter((y, i, arr) => i === 0 || y - arr[i - 1] > 2);
        const out = [];
        for (let k = 0; k < cuts.length - 1; k++) out.push({ ci, y0: cuts[k], y1: cuts[k + 1] });
        return out;
      });
      // 縦罫線のない境目でつながった枠は、複数の日にまたがる1つのコマ（例：4日間続く実習）
      const parent = new Map();
      const find = (s) => (parent.get(s) === s || !parent.has(s) ? s : find(parent.get(s)));
      segsByCol.flat().forEach((s) => parent.set(s, s));
      for (let i = 0; i < bounds.length; i++) {
        for (const s of segsByCol[i]) {
          for (const t of segsByCol[i + 1]) {
            const a = Math.max(s.y0, t.y0);
            const c = Math.min(s.y1, t.y1);
            if (c - a <= 2) continue;
            const cov = coveredLen(bounds[i], a, c);
            if (cov >= c - a - 2) continue; // 線で区切られている
            if (cov > 2) return fail(`${dt0(i)}と${dt0(i + 1)}の間の区切り線が途中で切れています`);
            if (Math.abs(s.y0 - t.y0) > 2 || Math.abs(s.y1 - t.y1) > 2) return fail(`${dt0(i)}と${dt0(i + 1)}にまたがるコマの形が想定と違います`);
            parent.set(find(t), find(s));
          }
        }
      }
      const groups = new Map();
      segsByCol.flat().forEach((s) => {
        const r = find(s);
        if (!groups.has(r)) groups.set(r, []);
        groups.get(r).push(s);
      });
      const cells = [...groups.values()].map((g) => {
        const cols = [...new Set(g.map((s) => s.ci))].sort((a, b) => a - b);
        return { cols, y0: Math.min(...g.map((s) => s.y0)), y1: Math.max(...g.map((s) => s.y1)), x0: colEdges[cols[0]].x0, x1: colEdges[cols[cols.length - 1]].x1, items: [] };
      });
      if (cells.some((c) => c.cols.some((ci, k) => k && ci !== c.cols[k - 1] + 1))) return fail('コマの形が想定と違います');
      // 文字をコマに振り分ける。区切り線をまたいで書かれた文字があれば想定外
      for (const it of body) {
        const { cx, cy } = center(it);
        const hit = cells.filter((c) => cx >= c.x0 && cx < c.x1 && cy > c.y0 && cy < c.y1);
        if (hit.length !== 1) return fail(`位置を決められない文字がありました（${it.str.slice(0, 20)}）`);
        for (const b of bounds) {
          if (it.x < b.x - 3 && it.x + it.w > b.x + 3 && coveredLen(b, it.top, it.bottom) > (it.bottom - it.top) * 0.5) return fail(`区切り線をまたぐ文字がありました（${it.str.slice(0, 20)}）`);
        }
        hit[0].items.push(it);
      }
      // 画像としての照合：ページを画像にして、罫線と文字の位置をピクセルから読み直し、上の読み取りと食い違いがないか確かめる
      if (pg.raster) {
        const why = rasterCheck(pg, { dates, colEdges, bounds, times, bodyTop, bodyBottom, cells, body, hLines, vLines });
        if (why) return fail(`画像での照合で食い違いがありました（${why}）`);
      }
      // 文字化け（フォントの対応表が壊れた PDF）を検出
      if (body.some((it) => /[\ue000-\uf8ff\ufffd\u0000-\u0008\u000e-\u001f]/.test(it.str))) return fail('文字化けした文字がありました');
      for (const cell of cells.sort((a, b) => a.cols[0] - b.cols[0] || a.y0 - b.y0)) {
        if (!cell.items.length) continue;
        const rows = times.filter((t) => t.cy > cell.y0 - 0.5 && t.cy < cell.y1 + 0.5);
        if (!rows.length) return fail(`${dt0(cell.cols[0])}の時間帯を決められませんでした`);
        // 時限の見出しの途中で枠が切れていないこと（見出し1行の中で区切られていたら想定外）
        if (rows.some((t) => t.item.top < cell.y0 - 1.5 || t.item.bottom > cell.y1 + 1.5)) return fail(`${dt0(cell.cols[0])}のコマの区切りが時限の見出しと合いません`);
        const ls = linesOf(cell.items);
        const lines = ls.map((l) => norm(l.text));
        // 枠の幅いっぱいまで書かれた行は折り返しとみなして、次の行とそのままつなぐ
        const cellW = cell.x1 - cell.x0;
        const title = lines
          .reduce((acc, t, k) => {
            if (!k) return t;
            const prev = ls[k - 1];
            const cjk = /[\u3040-\u30ff\u3400-\u9fff々ー]$/.test(acc) && /^[\u3040-\u30ff\u3400-\u9fff々ー]/.test(t);
            const wrapped = (cjk && prev.x1 - prev.x0 > cellW * 0.7) || acc.split(/[（(]/).length > acc.split(/[）)]/).length;
            return acc + (wrapped || /^[（(]/.test(t) ? '' : ' ') + t;
          }, '')
          .replace(/\s+/g, ' ')
          .trim();
        const span = cell.cols.length > 1 ? { spanFrom: dates[cell.cols[0]].iso, spanTo: dates[cell.cols[cell.cols.length - 1]].iso } : {};
        for (const ci of cell.cols) {
          pending.push({
            grade,
            term,
            week: weekNo,
            page: pageNo,
            date: dates[ci].iso,
            start: rows[0].start,
            end: rows[rows.length - 1].end,
            title,
            lines,
            mark: /●/.test(title) ? '●' : '',
            holiday: rows.length === times.length && RE_HOLIDAY.test(title),
            ...span,
          });
        }
      }
      events.push(...pending);
      weeks.push({ grade, term, week: weekNo, page: pageNo, label, ...range });
      // 表の外にある記載（※注記や「6年 Post-CC OSCE」など）は、すべて注記として残す
      const bodySet = new Set(body);
      const noteItems = pg.items.filter((i) => inWeek(i) && !isLabel(i) && !bodySet.has(i) && !isFooter(i));
      const noteText = linesOf(noteItems).map((l) => norm(l.text)).filter(Boolean);
      if (noteText.length) notes.push({ grade, term, week: weekNo, page: pageNo, label, text: noteText.join(' ') });
    });
    // 最初の表より上にある、表題以外の記載
    const firstStart = dateRows.length ? dateRows[0].start : pg.H;
    const headExtra = linesOf(pg.items.filter((i) => i.top < firstStart && !isFooter(i) && i !== pageRoomItem))
      .map((l) => norm(l.text))
      .filter((t) => t && !RE_HEAD.test(t) && !/授業時間割表/.test(t) && !/^令和\s*\d+\s*年度/.test(t));
    if (headExtra.length) notes.push({ grade, term, week: null, page: pageNo, label: `${grade}年次・${term}`, text: headExtra.join(' ') });
    return { events, failed, notes, weeks };
  };

  // ===== 科目ごとの講義概要（目次のページ番号で区切る） =====
  const parseSyllabus = (pages) => {
    // 印刷されたページ番号（「－ 23 －」）→ PDF のページ
    const printed = {};
    pages.forEach((pg, idx) => {
      const foot = pg.items.find((i) => /^[－-]\s*\d+\s*[－-]$/.test(norm(i.str)) && i.base > pg.H * 0.9);
      if (foot) printed[Number(norm(foot.str).match(/\d+/)[0])] = idx;
    });
    // 目次：「M1201 人体の構造と機能Ⅰ ……… 23」
    const toc = [];
    let grade = null;
    for (const pg of pages.slice(0, 8)) {
      for (const l of linesOf(pg.items)) {
        const t = norm(l.text);
        const g = t.match(/^[（(]\s*([2-6])\s*年次生\s*[）)]$/);
        if (g) grade = Number(g[1]);
        const m = t.match(/^(M\d{4})\s+(.+?)\s*[…・.]{2,}\s*(\d+)$/);
        if (m && grade) toc.push({ code: m[1], name: m[2].replace(/\s*概要$/, '').trim(), grade, page: Number(m[3]) });
      }
    }
    const byPage = toc.slice().sort((a, b) => a.page - b.page);
    const courses = byPage
      .map((c, i) => {
        const startIdx = printed[c.page];
        const nextPage = byPage[i + 1]?.page;
        let endIdx = nextPage != null && printed[nextPage] != null ? printed[nextPage] - 1 : pages.length - 1;
        if (startIdx == null) return null;
        endIdx = Math.max(startIdx, endIdx);
        const text = pages
          .slice(startIdx, endIdx + 1)
          .map((pg) =>
            linesOf(pg.items.filter((i) => !(/^[－-]\s*\d+\s*[－-]$/.test(norm(i.str)) && i.base > pg.H * 0.9)))
              .map((l) => l.text)
              .join('\n')
          )
          .join('\n\n');
        // 照合：その科目の最初のページに、目次と同じ講義番号が書かれていること
        const first = pages[startIdx].items.map((i) => i.str).join('').replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)).replace(/\s+/g, '');
        if (!first.includes(c.code)) return null;
        return { ...c, pdfFrom: startIdx + 1, pdfTo: endIdx + 1, text: text.replace(/[ \t]+\n/g, '\n').trim() };
      })
      .filter(Boolean);
    const missing = toc.filter((t) => !courses.some((c) => c.code === t.code)).map(({ code, name, grade, page }) => ({ code, name, grade, page }));
    return { courses, missing };
  };

  // 授業暦などから年度（令和◯年度 → 西暦）を読み取る
  const fiscalYearOf = (pages) => {
    for (const pg of pages.slice(0, 8)) {
      const t = toHalf(pg.items.map((i) => i.str).join(''));
      const m = t.match(/令和\s*(\d+)\s*年度/);
      if (m) return 2018 + Number(m[1]);
    }
    return null;
  };

  // pdf.js の document を受け取り、まとめて読み取る
  // render(page) を渡すと、時間割表のページを画像にして照合する（ブラウザでは canvas に描いて RGBA を返す）
  const parseDocument = async (doc, OPS, onProgress = () => {}, { render } = {}) => {
    const pages = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const text = (await page.getTextContent()).items.map((i) => i.str).join('');
      const needRects = /授業時間割表/.test(text) || /授業時間割表/.test(undouble(text));
      const pg = await readPage(page, needRects ? OPS : null);
      if (needRects && render) pg.raster = await render(page);
      pages.push(pg);
      onProgress(n, doc.numPages);
    }
    const tt = pages.map((pg, i) => parseTimetablePage(pg, i + 1));
    const events = tt.flatMap((t) => t.events);
    const failed = tt.flatMap((t) => t.failed);
    const notes = tt.flatMap((t) => t.notes);
    const weeks = tt.flatMap((t) => t.weeks);
    const { courses, missing: syllabusMissing } = parseSyllabus(pages);
    const calendarPage = pages.findIndex((pg) => /授業暦/.test(pg.items.map((i) => i.str).join('')) && /補講|休業/.test(pg.items.map((i) => i.str).join(''))) + 1 || null;
    const fiscalYear = fiscalYearOf(pages) || (events[0] ? Number(events[0].date.slice(0, 4)) - (Number(events[0].date.slice(5, 7)) < 4 ? 1 : 0) : null);
    const dates = events.map((e) => e.date).sort();
    const grades = [...new Set(events.map((e) => e.grade).concat(courses.map((c) => c.grade)))].sort();
    return { fiscalYear, events, failed, notes, weeks, courses, syllabusMissing, grades, firstDate: dates[0] || null, lastDate: dates[dates.length - 1] || null, numPages: doc.numPages, calendarPage, rasterChecked: !!render };
  };

  root.GXMed = { VERSION: 1, parseDocument, parseTimetablePage, parseSyllabus, linesOf, readPage, undouble };
})(typeof globalThis !== 'undefined' ? globalThis : this);
