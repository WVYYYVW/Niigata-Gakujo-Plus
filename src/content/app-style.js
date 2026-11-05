// 学情プラス — 新UIのスタイル（Shadow DOM 内に適用するので学情側のCSSと干渉しない）
(() => {
  const GX = globalThis.GX;

  // 新しい画面のシート内に開く学情本来の画面（提出・解答・登録・科目ページなど）用。
  // 新しい画面と同じ色・角丸・ボタン・ダークモードにそろえる（見た目のみ）。
  GX.SHEET_CSS = `
html.gx-sheet{
  --primary:#0b57d0;--on-primary:#fff;--primary-c:#d3e3fd;--on-primary-c:#041e49;
  --secondary-c:#c2e7ff;--on-secondary-c:#001d35;
  --surface:#f8fafd;--surface-1:#ffffff;--surface-2:#f0f4f9;--surface-3:#e9eef6;
  --on-surface:#1f1f1f;--on-surface-v:#444746;--outline:#747775;--outline-v:#e1e3e1;
  --error:#b3261e;--error-c:#f9dedc;--on-error-c:#410e0b;--ok:#146c2e;
  color-scheme:light;
}
html.gx-sheet.gx-dark{
  --primary:#a8c7fa;--on-primary:#062e6f;--primary-c:#0842a0;--on-primary-c:#d3e3fd;
  --secondary-c:#004a77;--on-secondary-c:#c2e7ff;
  --surface:#131314;--surface-1:#1e1f20;--surface-2:#282a2c;--surface-3:#333537;
  --on-surface:#e3e3e3;--on-surface-v:#c4c7c5;--outline:#8e918f;--outline-v:#444746;
  --error:#f2b8b5;--error-c:#8c1d18;--on-error-c:#f9dedc;--ok:#6dd58c;
  color-scheme:dark;
}
html.gx-sheet,html.gx-sheet body{max-width:100%;overflow-x:hidden;background:var(--surface-1)!important;color:var(--on-surface)!important}
html.gx-sheet body{margin:0!important;padding:16px 20px 56px!important;font:15px/1.65 "Google Sans Text","Google Sans","Noto Sans JP",system-ui,-apple-system,"Hiragino Sans",sans-serif!important;-webkit-font-smoothing:antialiased}
html.gx-sheet body *{font-family:inherit!important;box-sizing:border-box}
html.gx-sheet body :where(div,span,p,td,th,li,label,b,strong,font:not([color]),center){color:inherit}
html.gx-sheet [bgcolor],html.gx-sheet [background]{background:transparent!important}
html.gx-sheet img{max-width:100%;height:auto}
html.gx-sheet a{color:var(--primary)!important;text-underline-offset:2px}
html.gx-sheet hr{border:0;border-top:1px solid var(--outline-v);margin:16px 0}
html.gx-sheet font[color="red"],html.gx-sheet font[color="#ff0000"],html.gx-sheet font[color="#FF0000"],html.gx-sheet span[style*="color:red"],html.gx-sheet span[style*="color: red"],html.gx-sheet .required{color:var(--error)!important}
html.gx-sheet font[color="blue"],html.gx-sheet font[color="#0000ff"]{color:var(--primary)!important}
html.gx-sheet.gx-dark font[color="black"],html.gx-sheet.gx-dark font[color="#000000"]{color:var(--on-surface)!important}

/* タイトル帯と見出し */
html.gx-sheet .gx-pagetitle,html.gx-sheet .gx-pagetitle *{background:none!important;border:0!important;box-shadow:none!important}
html.gx-sheet .gx-pagetitle{display:block;margin:0 0 12px!important;padding:0!important;color:var(--on-surface-v)!important;font-size:13px!important;font-weight:500!important;letter-spacing:.02em}
html.gx-sheet .gx-pagetitle img{display:none}
html.gx-sheet br:has(+ .gx-sec),html.gx-sheet table.gx-card + br{display:none}
html.gx-sheet .gx-sec{display:block;margin:20px 0 10px;font-size:15px;font-weight:600;color:var(--on-surface)}
html.gx-sheet .gx-sec::before{content:"";display:inline-block;width:4px;height:16px;margin-right:8px;border-radius:2px;background:var(--primary);vertical-align:-2px}
html.gx-sheet h1,html.gx-sheet h2,html.gx-sheet h3,html.gx-sheet .keiji-block,html.gx-sheet .portlet-title,html.gx-sheet .title{background:none!important;border:0!important;color:var(--on-surface)!important}

/* 表 → カード */
html.gx-sheet table{width:100%!important;max-width:100%!important;table-layout:auto;border-collapse:separate!important;border-spacing:0!important;border:0!important;background:transparent!important;margin:0!important}
html.gx-sheet table.gx-card{background:var(--surface-1)!important;border:1px solid var(--outline-v)!important;border-radius:16px!important;overflow:hidden;margin:0 0 14px!important}
html.gx-sheet td,html.gx-sheet th{border:0!important;border-bottom:1px solid var(--outline-v)!important;padding:12px 14px!important;background:transparent!important;color:var(--on-surface)!important;font-size:14px!important;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;height:auto!important}
html.gx-sheet tr:last-child>td,html.gx-sheet tr:last-child>th{border-bottom:0!important}
html.gx-sheet th{background:var(--surface-2)!important;color:var(--on-surface-v)!important;font-weight:500!important;text-align:left!important;white-space:normal!important}
html.gx-sheet tr.gx-kv>th{width:30%;min-width:96px}
html.gx-sheet table table td,html.gx-sheet table table th{padding:6px 8px!important}

/* 入力欄 */
html.gx-sheet textarea,html.gx-sheet select,html.gx-sheet input:is([type=text],[type=password],[type=number],[type=email],[type=url],[type=tel],[type=date],[type=time],:not([type])){max-width:100%!important;font-size:16px!important;padding:12px 14px!important;border:1px solid var(--outline)!important;border-radius:10px!important;background:var(--surface-1)!important;color:var(--on-surface)!important;box-shadow:none!important;background-image:none!important}
html.gx-sheet select{padding-right:32px!important;-webkit-appearance:auto;appearance:auto}
html.gx-sheet textarea{width:100%!important;min-height:10em;line-height:1.7!important;resize:vertical}
html.gx-sheet textarea:focus,html.gx-sheet input:focus,html.gx-sheet select:focus{outline:2px solid var(--primary)!important;outline-offset:-1px;border-color:transparent!important}
html.gx-sheet textarea[readonly],html.gx-sheet textarea[disabled],html.gx-sheet input[readonly]{background:var(--surface-2)!important;color:var(--on-surface-v)!important}
html.gx-sheet input[type=file]{max-width:100%;font-size:14px!important;color:var(--on-surface-v)!important;padding:8px 0!important}
html.gx-sheet input[type=file]::file-selector-button{margin-right:12px;height:40px;padding:0 18px;border:1px solid var(--outline)!important;border-radius:20px;background:var(--surface-1);color:var(--primary);font-family:inherit;font-size:14px;font-weight:600;cursor:pointer}
html.gx-sheet input[type=radio],html.gx-sheet input[type=checkbox]{width:20px;height:20px;accent-color:var(--primary);vertical-align:middle;margin:0 6px 0 0}

/* ボタン：主要＝塗り、その他＝枠線、取消・削除＝赤文字 */
html.gx-sheet :is(input[type=button],input[type=submit],input[type=reset],button){display:inline-flex;align-items:center;justify-content:center;min-height:40px!important;height:auto!important;padding:0 20px!important;margin:4px 6px 4px 0!important;font-size:14px!important;font-weight:600!important;border-radius:20px!important;border:1px solid var(--outline)!important;background:var(--surface-1)!important;color:var(--primary)!important;cursor:pointer;box-shadow:none!important;background-image:none!important;text-shadow:none!important;width:auto}
html.gx-sheet :is(input,button).gx-primary{background:var(--primary)!important;border-color:var(--primary)!important;color:var(--on-primary)!important}
html.gx-sheet :is(input,button).gx-danger{color:var(--error)!important;border-color:var(--outline-v)!important}
html.gx-sheet :is(input,button):hover:not([disabled]){filter:brightness(.96)}
html.gx-sheet.gx-dark :is(input,button):hover:not([disabled]){filter:brightness(1.12)}
html.gx-sheet :is(input,button)[disabled]{opacity:.4!important;cursor:default}
html.gx-sheet .ui-button,html.gx-sheet .ui-state-default,html.gx-sheet .ui-widget-content,html.gx-sheet .ui-widget-header{background-image:none!important}

/* 確認ダイアログ（jQuery UI） */
html.gx-sheet .ui-widget-overlay{background:rgba(0,0,0,.4)!important;opacity:1!important}
html.gx-sheet .ui-dialog{background:var(--surface-1)!important;color:var(--on-surface)!important;border:0!important;border-radius:24px!important;padding:12px!important;box-shadow:0 8px 32px rgba(0,0,0,.3)!important}
html.gx-sheet .ui-dialog .ui-dialog-titlebar{background:none!important;border:0!important;color:var(--on-surface)!important;font-size:17px!important}
html.gx-sheet .ui-dialog .ui-dialog-content,html.gx-sheet .ui-dialog .ui-dialog-buttonpane{background:none!important;border:0!important;color:var(--on-surface)!important}
html.gx-sheet .cleditorMain{border:1px solid var(--outline)!important;border-radius:10px!important;overflow:hidden;background:var(--surface-1)!important}
html.gx-sheet .cleditorToolbar{background:var(--surface-2)!important}

/* 学情プラスの追加部品（並べ替えバーなど） */
html.gx-sheet .gx-bar{background:var(--surface-2)!important;color:var(--on-surface)!important}
html.gx-sheet .gx-bar b{color:var(--primary)!important}
html.gx-sheet .gx-btn{background:var(--surface-1)!important;color:var(--primary)!important;border-color:var(--outline-v)!important}
html.gx-sheet .gx-btn.on{background:var(--secondary-c)!important;color:var(--on-secondary-c)!important}
html.gx-sheet .gx-btn.primary{background:var(--primary)!important;color:var(--on-primary)!important}
html.gx-sheet .gx-stat{background:var(--surface-1)!important;border-color:var(--outline-v)!important}
html.gx-sheet .gx-stat span{color:var(--on-surface)!important}
html.gx-sheet .gx-num{background:var(--surface-1);color:var(--on-surface);border-color:var(--outline)}
html.gx-sheet.gx-dark .gx-urgent{background:#8c1d18;color:#f9dedc}
html.gx-sheet.gx-dark .gx-soon{background:#5c4300;color:#ffdf99}
html.gx-sheet.gx-dark .gx-later{background:#0f5223;color:#c4eed0}
html.gx-sheet.gx-dark .gx-temp{color:var(--primary)!important}

/* スマホ：ラベルと値を縦に並べる */
@media (max-width: 600px){
  html.gx-sheet body{padding:12px 12px 56px!important}
  html.gx-sheet tr.gx-kv>th,html.gx-sheet tr.gx-kv>td{display:block;width:auto!important}
  html.gx-sheet tr.gx-kv>th{border-bottom:0!important;padding:10px 14px 2px!important;font-size:12px!important;background:transparent!important}
  html.gx-sheet tr.gx-kv>td{padding:2px 14px 12px!important}
  html.gx-sheet :is(input[type=button],input[type=submit],button).gx-primary{width:100%;margin:8px 0!important;min-height:48px!important}
}
`;

  GX.APP_CSS = `
:host{all:initial}
*{box-sizing:border-box}
.app{
  --primary:#0b57d0;--on-primary:#fff;--primary-c:#d3e3fd;--on-primary-c:#041e49;
  --secondary-c:#c2e7ff;--on-secondary-c:#001d35;
  --surface:#f8fafd;--surface-1:#ffffff;--surface-2:#f0f4f9;--surface-3:#e9eef6;
  --on-surface:#1f1f1f;--on-surface-v:#444746;--outline:#c4c7c5;--outline-v:#e1e3e1;
  --error:#b3261e;--error-c:#f9dedc;--on-error-c:#410e0b;
  --warn-c:#ffefc9;--on-warn-c:#4a3800;--ok-c:#c4eed0;--on-ok-c:#072711;
  --shadow:0 1px 2px rgba(0,0,0,.08),0 1px 3px 1px rgba(0,0,0,.05);
  position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;
  background:var(--surface);color:var(--on-surface);
  font:15px/1.55 "Google Sans Text","Google Sans","Noto Sans JP",system-ui,-apple-system,"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic UI",Meiryo,sans-serif;
  -webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;
}
.app.dark{
  --primary:#a8c7fa;--on-primary:#062e6f;--primary-c:#0842a0;--on-primary-c:#d3e3fd;
  --secondary-c:#004a77;--on-secondary-c:#c2e7ff;
  --surface:#131314;--surface-1:#1e1f20;--surface-2:#282a2c;--surface-3:#333537;
  --on-surface:#e3e3e3;--on-surface-v:#c4c7c5;--outline:#8e918f;--outline-v:#444746;
  --error:#f2b8b5;--error-c:#8c1d18;--on-error-c:#f9dedc;
  --warn-c:#5c4300;--on-warn-c:#ffdf99;--ok-c:#0f5223;--on-ok-c:#c4eed0;
  --shadow:0 1px 3px rgba(0,0,0,.5);
}
button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}
a{color:var(--primary)}
svg{width:24px;height:24px;fill:currentColor;flex:none}

/* ===== トップバー ===== */
.top{display:flex;align-items:center;gap:8px;height:64px;padding:0 8px 0 16px;flex:none}
.brand{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:500;white-space:nowrap;letter-spacing:.2px}
.brand .logo{width:32px;height:32px;border-radius:10px;background:var(--primary);color:var(--on-primary);display:grid;place-items:center;font-weight:700;font-size:16px}
.brand small{font-size:13px;color:var(--on-surface-v);font-weight:400}
.top .spacer{flex:1}
.timer{display:flex;align-items:center;gap:6px;height:36px;padding:0 14px 0 10px;border-radius:999px;background:var(--surface-3);font-size:13px;white-space:nowrap}
.timer svg{width:18px;height:18px}
.timer.low{background:var(--error-c);color:var(--on-error-c)}
.icon-btn{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:var(--on-surface-v)}
.icon-btn:hover{background:var(--surface-3)}
.icon-btn.spin svg{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* ===== 本体レイアウト ===== */
.body{flex:1;display:flex;min-height:0}
.rail{width:88px;flex:none;display:flex;flex-direction:column;align-items:center;gap:4px;padding-top:4px}
.nav-item{display:flex;flex-direction:column;align-items:center;gap:4px;width:72px;padding:0 0 6px;font-size:12px;font-weight:500;color:var(--on-surface-v)}
.nav-item .pill{position:relative;width:56px;height:32px;border-radius:16px;display:grid;place-items:center;transition:background .2s}
.nav-item:hover .pill{background:var(--surface-3)}
.nav-item.active{color:var(--on-surface)}
.nav-item.active .pill{background:var(--secondary-c);color:var(--on-secondary-c)}
.badge{position:absolute;top:0;right:6px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:var(--error);color:#fff;font-size:10px;font-weight:700;line-height:16px;text-align:center}
.app.dark .badge{color:#601410}
.main{flex:1;min-width:0;overflow-y:auto;background:var(--surface-1);border-radius:24px 0 0 0;padding:24px 28px 40px;-webkit-overflow-scrolling:touch}
.content{max-width:1080px;margin:0 auto}
.bottom{display:none}

/* ===== 共通部品 ===== */
h1{font-size:28px;font-weight:400;margin:4px 0 4px;letter-spacing:0}
h2{font-size:18px;font-weight:500;margin:0}
.sub{color:var(--on-surface-v);font-size:14px;margin:0 0 20px}
.grid{display:grid;gap:16px}
.cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.card{background:var(--surface);border-radius:20px;padding:18px 20px}
.card.outlined{background:var(--surface-1);border:1px solid var(--outline-v)}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.stat{display:flex;flex-direction:column;gap:2px;text-align:left;width:100%;border-radius:20px;padding:16px 18px;background:var(--surface)}
button.stat:hover{background:var(--surface-3)}
.stat .label{font-size:13px;color:var(--on-surface-v);display:flex;align-items:center;gap:6px}
.stat .label svg{width:18px;height:18px}
.stat .value{font-size:32px;font-weight:400;line-height:1.2}
.stat .value small{font-size:14px;color:var(--on-surface-v);margin-left:4px}
.stat.alert{background:var(--error-c);color:var(--on-error-c)}
.stat.alert .label{color:inherit}
.list{display:flex;flex-direction:column}
.item{display:flex;align-items:center;gap:14px;width:100%;min-width:0;text-align:left;padding:12px 12px;border-radius:14px;min-height:56px}
.card,.grid>*{min-width:0}
.item:hover{background:var(--surface-2)}
.item .lead{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--primary-c);color:var(--on-primary-c);flex:none}
.item .lead svg{width:20px;height:20px}
.item .lead.red{background:var(--error-c);color:var(--on-error-c)}
.item .lead.amber{background:var(--warn-c);color:var(--on-warn-c)}
.item .lead.green{background:var(--ok-c);color:var(--on-ok-c)}
.item .lead.gray{background:var(--surface-3);color:var(--on-surface-v)}
.item .txt{flex:1;min-width:0}
.item .t1{font-weight:500;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.item .t2{font-size:13px;color:var(--on-surface-v);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.item .trail{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex:none;font-size:12px;color:var(--on-surface-v)}
.item.unread .t1{font-weight:700}
.divider{height:1px;background:var(--outline-v);margin:4px 12px}
.chip{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 10px;border-radius:8px;font-size:12px;font-weight:600;white-space:nowrap;background:var(--surface-3);color:var(--on-surface-v)}
.chip.urgent{background:var(--error-c);color:var(--on-error-c)}
.chip.soon{background:var(--warn-c);color:var(--on-warn-c)}
.chip.later,.chip.ok{background:var(--ok-c);color:var(--on-ok-c)}
.chip.blue{background:var(--primary-c);color:var(--on-primary-c)}
.chip.red{background:var(--error-c);color:var(--on-error-c)}
.filters{display:flex;gap:8px;overflow-x:auto;padding:2px 0 12px;scrollbar-width:none}
.filters::-webkit-scrollbar{display:none}
.fchip{height:32px;padding:0 14px;border-radius:8px;border:1px solid var(--outline);font-size:13px;font-weight:500;white-space:nowrap;color:var(--on-surface-v);display:inline-flex;align-items:center;gap:6px}
.fchip.on{background:var(--secondary-c);color:var(--on-secondary-c);border-color:transparent}
.fchip.on::before{content:"✓";font-weight:700}
.toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:14px}
.search{flex:1;min-width:200px;display:flex;align-items:center;gap:10px;height:48px;padding:0 16px;border-radius:24px;background:var(--surface-2)}
.search input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;color:inherit}
select,.input{font:inherit;color:inherit;height:40px;padding:0 12px;border-radius:8px;border:1px solid var(--outline);background:var(--surface-1)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 20px;border-radius:20px;font-size:14px;font-weight:500;white-space:nowrap}
.btn svg{width:18px;height:18px}
.btn.filled{background:var(--primary);color:var(--on-primary)}
.btn.filled:hover{box-shadow:var(--shadow)}
.btn.tonal{background:var(--secondary-c);color:var(--on-secondary-c)}
.btn.outline{border:1px solid var(--outline);color:var(--primary)}
.btn.text{color:var(--primary);padding:0 12px}
.btn:disabled{opacity:.45;cursor:default}
.task{display:flex;gap:14px;padding:16px;border-radius:16px;background:var(--surface);margin-bottom:10px;border-left:4px solid transparent}
.task.urgent{border-left-color:#d93025}.task.soon{border-left-color:#f9ab00}
.task.past{opacity:.72}
.task .txt{flex:1;min-width:0}
.task .meta{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 0;align-items:center}
.task .title{font-weight:500;font-size:16px}
.task .course{font-size:13px;color:var(--on-surface-v)}
.task .actions{display:flex;flex-direction:column;gap:6px;justify-content:center}
.section-title{display:flex;align-items:center;gap:8px;margin:22px 0 10px;font-size:14px;font-weight:600;color:var(--on-surface-v)}
.empty{text-align:center;color:var(--on-surface-v);padding:36px 12px}
.empty svg{width:48px;height:48px;opacity:.5;display:block;margin:0 auto 8px}
.error{display:flex;gap:12px;align-items:center;background:var(--error-c);color:var(--on-error-c);border-radius:16px;padding:12px 16px;margin-bottom:12px}
.skeleton{height:56px;border-radius:14px;background:linear-gradient(90deg,var(--surface-2),var(--surface-3),var(--surface-2));background-size:200% 100%;animation:sh 1.2s infinite;margin-bottom:8px}
@keyframes sh{to{background-position:-200% 0}}
table.tbl{width:100%;border-collapse:collapse;font-size:14px}
.tbl th{text-align:left;font-weight:500;color:var(--on-surface-v);font-size:12px;padding:8px 10px;border-bottom:1px solid var(--outline-v)}
.tbl td{padding:10px;border-bottom:1px solid var(--outline-v)}
.tbl td.num,.tbl th.num{text-align:right;font-variant-numeric:tabular-nums}
.bars{display:flex;flex-direction:column;gap:8px}
.bar{display:grid;grid-template-columns:44px 1fr 36px;align-items:center;gap:10px;font-size:13px}
.bar .track{height:10px;border-radius:5px;background:var(--surface-3);overflow:hidden}
.bar .fill{height:100%;border-radius:5px;background:var(--primary)}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.tile{display:flex;flex-direction:column;align-items:flex-start;gap:10px;padding:18px;border-radius:20px;background:var(--surface);text-align:left;font-weight:500}
.tile:hover{background:var(--surface-3)}
.tile .lead{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--primary-c);color:var(--on-primary-c)}
.check{width:20px;height:20px;accent-color:var(--primary);flex:none}
.note{font-size:12px;color:var(--on-surface-v)}

/* ===== シート（詳細・提出画面） ===== */
.scrim{position:absolute;inset:0;background:rgba(0,0,0,.32);display:flex;justify-content:flex-end;z-index:10;animation:fade .15s}
@keyframes fade{from{opacity:0}}
.sheet{width:min(760px,100%);height:100%;background:var(--surface-1);display:flex;flex-direction:column;box-shadow:-4px 0 24px rgba(0,0,0,.2);animation:slide .2s ease-out}
.sheet.wide{width:min(1180px,100%)}
@keyframes slide{from{transform:translateX(40px);opacity:.4}}
.sheet-head{display:flex;align-items:center;gap:8px;min-height:64px;padding:8px 8px 8px 12px;border-bottom:1px solid var(--outline-v)}
.sheet-head h2{flex:1;font-size:17px;line-height:1.4;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.sheet-body{flex:1;overflow:auto;padding:20px 24px 40px;-webkit-overflow-scrolling:touch}
.sheet-body.flush{padding:0;overflow:hidden}
.week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;margin-top:4px}
.wday{display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 2px;border:0;border-radius:14px;background:var(--surface);color:var(--on-surface);font:inherit;cursor:pointer}
.wday.has{background:color-mix(in srgb,var(--primary) calc(12% + var(--lv,0) * 30%),var(--surface))}
.wday .wd{font-size:12px;color:var(--on-surface-v)}
.wday .wn{font-size:18px;font-weight:600}
.wday .wc{font-size:12px;color:var(--on-surface-v)}
.wday.has .wc{color:var(--primary);font-weight:600}
.sheet iframe{width:100%;height:100%;border:0;background:var(--surface-1)}
.notice-body{white-space:pre-wrap;word-break:break-word;line-height:1.75;font-size:15px}
.kv{display:grid;grid-template-columns:120px 1fr;gap:6px 12px;font-size:14px;margin:16px 0;padding:14px 16px;border-radius:16px;background:var(--surface)}
.kv dt{color:var(--on-surface-v)}
.kv dd{margin:0}
.attach{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;background:var(--surface);margin-bottom:8px;text-decoration:none;color:var(--on-surface)}
.attach:hover{background:var(--surface-3)}
.setting{display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid var(--outline-v)}
.setting .txt{flex:1}
.setting .t2{font-size:13px;color:var(--on-surface-v)}
.switch{position:relative;width:52px;height:32px;flex:none}
.switch input{opacity:0;width:0;height:0}
.switch span{position:absolute;inset:0;border-radius:16px;background:var(--surface-3);border:2px solid var(--outline);transition:.2s}
.switch span::after{content:"";position:absolute;left:6px;top:6px;width:16px;height:16px;border-radius:50%;background:var(--outline);transition:.2s}
.switch input:checked+span{background:var(--primary);border-color:var(--primary)}
.switch input:checked+span::after{left:24px;top:2px;width:24px;height:24px;background:var(--on-primary)}

/* ===== スナックバー・FAB ===== */
.snack{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);z-index:20;max-width:calc(100% - 32px);background:#313033;color:#f4eff4;padding:14px 18px;border-radius:8px;box-shadow:var(--shadow);font-size:14px;animation:fade .2s}
.progress{height:4px;border-radius:2px;background:var(--surface-3);overflow:hidden;margin-top:8px}
.progress div{height:100%;background:var(--primary);transition:width .2s}

/* ===== スマホ ===== */
@media (max-width: 839px){
  .rail{display:none}
  .main{border-radius:0;padding:12px 16px 96px}
  .top{height:56px;padding:0 4px 0 12px}
  .brand{font-size:18px}
  .brand small{display:none}
  .bottom{display:flex;position:absolute;left:0;right:0;bottom:0;height:calc(72px + env(safe-area-inset-bottom));padding-bottom:env(safe-area-inset-bottom);background:var(--surface-2);justify-content:space-around;align-items:center;z-index:5}
  .bottom .nav-item{width:auto;flex:1;min-width:0;font-size:11px;letter-spacing:-.02em}
  .bottom .nav-item .pill{width:48px}
  .cols-4{grid-template-columns:repeat(2,minmax(0,1fr))}
  .cols-2{grid-template-columns:minmax(0,1fr)}
  .card{padding:14px 12px}
  .item{padding:10px 8px;gap:12px}
  h1{font-size:24px}
  .stat .value{font-size:26px}
  .task{flex-direction:column;gap:10px}
  .task .actions{flex-direction:row;justify-content:flex-start}
  .sheet-body{padding:16px 16px 40px}
  .kv{grid-template-columns:1fr}
  .kv dt{font-size:12px}
  .hide-sm{display:none!important}
  .timer{padding:0 10px 0 8px}
}
`;
})();
