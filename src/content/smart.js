// 学情プラス — 学情のスマホ版（campussmart.do）から新しい画面へ案内する
(() => {
  const GX = globalThis.GX;
  if (!GX.isTop || !/\/campusweb\/campussmart\.do/.test(location.pathname)) return;
  (async () => {
    const s = await GX.getSettings();
    if (!s.newUi) return;
    const host = document.createElement('div');
    const r = host.attachShadow({ mode: 'open' });
    r.innerHTML = `<style>
      a{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:8px;padding:12px 20px;border-radius:16px;background:#0b57d0;color:#fff;text-decoration:none;font:600 14px system-ui,-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.3);white-space:nowrap}
    </style><a href="/campusweb/campusportal.do?page=main">学情プラスの新しい画面で開く</a>`;
    document.documentElement.appendChild(host);
  })();
})();
