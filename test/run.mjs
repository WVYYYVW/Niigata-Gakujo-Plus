// 学情プラス — 読み取り処理の自動テスト（学情の画面構造を模した架空のHTMLで確認）
//   npm test
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
  url: 'https://gakujo.iess.niigata-u.ac.jp/campusweb/campussquare.do?_flowExecutionKey=x',
  runScripts: 'outside-only',
});
const w = dom.window;
w.crypto.subtle ??= globalThis.crypto.subtle;
if (!w.crypto.subtle) Object.defineProperty(w.crypto, 'subtle', { value: globalThis.crypto.subtle });
w.TextEncoder = TextEncoder;
w.chrome = undefined;
let mockFetch = null;
w.fetch = (...a) => (mockFetch ? mockFetch(...a) : globalThis.fetch(...a));
for (const f of ['common/ext.js', 'common/totp.js', 'common/gakujo.js']) w.eval(readFileSync(`src/${f}`, 'utf8'));
const GX = w.GX;
const parse = (html) => new w.DOMParser().parseFromString(html, 'text/html');
let passed = 0;
const test = async (name, fn) => {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}\n    ${e.stack}`);
    process.exitCode = 1;
  }
};

console.log('TOTP');
await test('RFC 6238 のテストベクトル（SHA-1, 59秒 → 287082）', async () => {
  // "12345678901234567890" の base32
  const key = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  assert.equal(await GX.totp(key, { time: 59 * 1000 }), '287082');
  assert.equal(await GX.totp(key, { time: 1111111109 * 1000 }), '081804');
  assert.equal(await GX.totp(key, { time: 2000000000 * 1000 }), '279037');
});
await test('otpauth URI から鍵を取り出す', () => {
  assert.equal(GX.normalizeTotpKey('otpauth://totp/x?secret=abcd efgh ijkl mnop&issuer=y'), 'ABCDEFGHIJKLMNOP');
  assert.ok(GX.isValidTotpKey('JBSWY3DPEHPK3PXP'));
  assert.ok(!GX.isValidTotpKey('12345'));
});

console.log('レポート一覧');
const reportHtml = `<form id="enqListForm"><table><tr><td>1～3/3件表示</td></tr></table>
<table class="normal"><tr><th>種別</th><th>タイトル</th><th>状態</th><th>開講番号</th><th>科目名</th><th>開講</th><th>曜日・時限</th><th>提出期間</th><th>返信</th><th></th></tr>
<tr><td>レポート</td><td>課題A</td><td><font color="red">未提出</font></td><td>100X0001</td><td>科目甲</td><td>第2学期</td><td>他</td><td>2026/11/02 13:00<br> ～2026/11/09 16:20</td><td></td>
<td><input type="button" value="提出" onclick="return callEnqInfoSearch('answer', '01', '111', '2026', '07', '100X0001');"><input type="button" value="取消" disabled onclick="return callEnqAnsDelete('01', '111', '2026', '07', '100X0001');"></td></tr>
<tr><td>小テスト</td><td>クイズB</td><td>一時保存</td><td>100X0002</td><td>科目乙</td><td>第2学期</td><td>他</td><td>2026/10/01 08:00 ～2026/10/02 08:00</td><td></td>
<td><input type="button" value="確認" onclick="return callEnqInfoSearch('refer', '02', '222', '2026', '07', '100X0002');"></td></tr>
<tr><td>授業評価アンケート</td><td>アンケートC</td><td>提出済</td><td>100X0003</td><td>科目丙</td><td>第1学期</td><td>他</td><td>2026/10/23 16:30 ～2026/11/13 16:30</td><td></td><td></td></tr>
</table></form>`;
await test('列・状態・締切・操作ボタンを読み取れる', () => {
  const t = GX.findTable(parse(reportHtml), ['タイトル', '提出期間']);
  const r = GX.parseReportTable(t);
  assert.equal(r.length, 3);
  assert.equal(r[0].title, '課題A');
  assert.equal(r[0].status, 'todo');
  assert.equal(r[1].status, 'temp');
  assert.equal(r[2].status, 'done');
  assert.equal(r[0].end.getFullYear(), 2026);
  assert.equal(r[0].end.getMonth(), 10);
  assert.equal(r[0].end.getDate(), 9);
  assert.equal(r[0].end.getHours(), 16);
  assert.equal(r[0].actions.length, 1, '取消（callEnqAnsDelete）は操作として拾わない');
  assert.deepEqual(
    { e: r[0].main.eventId, t: r[0].main.enqType, s: r[0].main.seqNo, c: r[0].main.jikanwaricd },
    { e: 'answer', t: '01', s: '111', c: '100X0001' }
  );
  assert.equal(r[2].main, null);
});
await test('.ics 書き出し', () => {
  const t = GX.findTable(parse(reportHtml), ['タイトル', '提出期間']);
  const ics = GX.toIcs(GX.parseReportTable(t));
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 3);
  assert.match(ics, /DTEND;TZID=Asia\/Tokyo:20261109T162000/);
  assert.match(ics, /TRIGGER:-P1D/);
});

console.log('連絡通知');
const noticeHtml = `<table class="keiji-block"><tr><td>未読一覧</td></tr></table>
<form id="keijiReferForm"><b>未読が2件あります。</b></form>
<table class="normal"><tr><th>掲載日時</th><th>表題</th><th>返信<br>未読</th><th>ジャンル</th><th>所属</th><th>氏名</th><th>連絡通知期間</th></tr>
<tr><td>2026/11/2 17:12:53</td><td><a href="campussquare.do?_flowExecutionKey=k1&amp;_eventId=displayMidoku&amp;keijitype=4&amp;genrecd=406&amp;seqNo=900001">お知らせA</a> <span style="color:red;">[重要]</span> <span>[新着]</span></td><td>-</td><td>全学連絡通知</td><td></td><td>学務部</td><td>2026/11/2 18:00から<br>2026/11/5 23:59まで</td></tr>
<tr><td>2026/11/1 9:05:00</td><td><a href="campussquare.do?_flowExecutionKey=k1&amp;_eventId=displayMidoku&amp;keijitype=1&amp;genrecd=40&amp;seqNo=900002">授業連絡B</a></td><td>-</td><td>授業連絡</td><td>医学部</td><td>山田 太郎</td><td></td></tr>
</table>
<table class="keiji-block"><tr><td>ジャンル一覧</td></tr></table>
<table class="normal"><tr><th>ジャンル</th><th>重要</th><th>新着</th><th>件数</th></tr>
<tr><td><a href="#">授業連絡</a></td><td>○</td><td>○</td><td>41件 <font color="#ff0000">(未読27件)</font></td></tr></table>`;
await test('未読一覧を読み取れる', () => {
  const doc = parse(noticeHtml);
  const t = GX.findTable(doc, ['掲載日時', '表題']);
  const n = GX.parseNoticeTable(t, 'https://gakujo.iess.niigata-u.ac.jp/campusweb/campussquare.do');
  assert.equal(n.length, 2);
  assert.equal(n[0].seqNo, '900001');
  assert.equal(n[0].title, 'お知らせA');
  assert.ok(n[0].important);
  assert.ok(n[0].isNew);
  assert.ok(!n[1].important);
  assert.equal(n[1].sender, '山田 太郎');
  assert.equal(n[0].date.getHours(), 17);
  assert.match(n[0].href, /^https:\/\/gakujo\.iess\.niigata-u\.ac\.jp\/campusweb\/campussquare\.do\?.*seqNo=900001$/);
});

console.log('連絡通知の詳細');
await test('本文を安全に取り出す（script や onclick は残さない）', () => {
  const doc = parse(`<table class="keiji-block"><tr><td>件名X [授業連絡通知 授業連絡]</td></tr></table>
    本文1行目<br>2行目 <b>強調</b><script>alert(1)</script><a href="javascript:alert(1)" onclick="x()">危険</a><a href="https://example.com/">安全</a>
    <table class="keiji-normal"><tr><th>連絡通知元</th><td>学務部</td></tr></table>
    <table class="keiji-normal"><tr><th>添付ファイル</th><td><a href="campussquare.do?_eventId=dl&amp;n=1">a.pdf</a></td></tr></table>`);
  const head = doc.querySelector('table.keiji-block');
  const out = w.document.createElement('div');
  let node = head.nextSibling;
  while (node && !(node.nodeType === 1 && node.matches('table.keiji-normal'))) {
    out.appendChild(GX.sanitize(node));
    node = node.nextSibling;
  }
  assert.ok(!out.innerHTML.includes('script'));
  assert.ok(!out.innerHTML.includes('javascript:'));
  assert.ok(!out.innerHTML.includes('onclick'));
  assert.ok(out.innerHTML.includes('<b>強調</b>'));
  assert.ok(out.innerHTML.includes('href="https://example.com/"'));
});

console.log('成績');
const gradeHtml = `<table><tr><td>修得単位数 47.0 学年 2年 所属 医学部医学科</td></tr></table><form id="taniReferListForm"></form>
<table class="normal"><tr>${['No.', '分野', '水準', '開講番号', '科目', '担当教員', '科目区分', '必選区分', '単位数', '得点', '評語', '合否', 'GP', '修得年度', '修得学期', '読替前科目', '読替後科目', '報告日', '試験種別'].map((x) => `<th>${x}</th>`).join('')}</tr>
${[
  [1, '科目A', '2.0', '92', '秀', '合', '2025', '第1学期'],
  [2, '◆科目B', '1.0', '75', '良', '合', '2025', '第2学期'],
  [3, '科目C', '2.0', '50', '不可', '否', '2025', '第2学期'],
  [4, '科目D', '13.5', '', '', '', '', ''],
]
  .map(([no, name, cr, sc, hy, go, yr, tm]) => `<tr><td>${no}</td><td>80</td><td>13</td><td>X${no}</td><td>${name}</td><td>先生</td><td>区分</td><td>必修</td><td>${cr}</td><td>${sc}</td><td>${hy}</td><td>${go}</td><td></td><td>${yr}</td><td>${tm}</td><td></td><td></td><td></td><td></td></tr>`)
  .join('')}</table>`;
await test('GP欄が空でも平均点・GPAを計算できる', () => {
  const t = GX.findTable(parse(gradeHtml), ['単位数', '評語']);
  const g = GX.parseGradeTable(t);
  assert.equal(g.length, 4);
  assert.ok(g[1].remote);
  assert.equal(g[1].name, '科目B');
  const s = GX.summarizeGrades(g);
  // 加重平均 = (92*2 + 75*1 + 50*2) / 5 = 71.8
  assert.equal(s.weightedAvg.toFixed(1), '71.8');
  // 単純平均 = (92+75+50)/3 = 72.33
  assert.equal(s.simpleAvg.toFixed(2), '72.33');
  // GPA = (4.2*2 + 2.5*1 + 0*2) / 5 = 2.18
  assert.equal(s.gpa.toFixed(2), '2.18');
  assert.equal(s.earned, 3);
  assert.equal(s.pending, 1);
  assert.equal(s.dist['秀'], 1);
});

console.log('連絡通知の添付ファイル');
await test('見出し行の下の行にある添付ファイル・対象科目を読み取れる', async () => {
  const detail = `<html><body><table class="keiji-block"><tr><td>件名Y [授業連絡通知 授業連絡]</td></tr></table>本文
    <table class="keiji-normal"><tr><th>連絡通知元</th></tr><tr><td>顕微解剖学教室</td></tr></table>
    <table class="keiji-normal"><tr><th>添付ファイル</th></tr>
      <tr><td><a href="campussquare.do?_flowExecutionKey=k&amp;_eventId=download&amp;seqNo=1&amp;index=0">a.pdf</a></td></tr>
      <tr><td><a href="campussquare.do?_flowExecutionKey=k&amp;_eventId=download&amp;seqNo=1&amp;index=1">b.pdf</a></td></tr></table>
    <table class="keiji-normal"><tr><th>年度</th><th>科目名</th></tr><tr><td>2026</td><td>科目甲</td></tr></table></body></html>`;
  mockFetch = async (url) => new Response(detail, { status: 200, headers: { 'content-type': 'text/html' } });
  const d = await GX.fetchNoticeDetail('https://gakujo.iess.niigata-u.ac.jp/campusweb/campussquare.do?_flowExecutionKey=k&_eventId=confirm&seqNo=1');
  mockFetch = null;
  assert.equal(d.title, '件名Y');
  assert.equal(d.attachments.length, 2);
  assert.equal(d.attachments[1].name, 'b.pdf');
  assert.equal(d.attachments[1].index, 1);
  assert.match(d.attachments[0].href, /_eventId=download/);
  assert.equal(d.meta['連絡通知元'], '顕微解剖学教室');
});
await test('既読になるページは詳細を開く処理以外から読み込めない', async () => {
  await assert.rejects(() => GX.getDoc('https://gakujo.iess.niigata-u.ac.jp/campusweb/campussquare.do?_flowExecutionKey=k&_eventId=displayMidoku&seqNo=1'), /止めました/);
  await assert.rejects(() => GX.fetchGenreNotices('https://gakujo.iess.niigata-u.ac.jp/campusweb/campussquare.do?_flowExecutionKey=k&_eventId=confirm&seqNo=1'));
});

console.log('残り時間表示');
await test('締切までの表示と色分け', () => {
  const now = new Date(2026, 10, 3, 12, 0).getTime();
  assert.deepEqual({ ...GX.until(new Date(2026, 10, 3, 12, 30), now) }, { text: 'あと30分', level: 'urgent' });
  assert.equal(GX.until(new Date(2026, 10, 5, 12, 0), now).level, 'soon');
  assert.equal(GX.until(new Date(2026, 10, 9, 12, 0), now).text, 'あと6日');
  assert.equal(GX.until(new Date(2026, 10, 1), now).level, 'past');
});

console.log(`\n${passed} 件成功${process.exitCode ? '（失敗あり）' : ''}`);
