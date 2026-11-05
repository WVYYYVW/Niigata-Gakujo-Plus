// 学情プラス — ログイン時間の自動延長
// 「残り◯分になったら延長」「最後の操作から◯分までは延長を続ける（無制限も可）」を設定できる
(() => {
  const GX = globalThis.GX;

  // iframe 内（旧画面の本体や新UIの提出画面）での操作も「操作」として親に伝える
  if (!GX.isTop) {
    const ping = () => {
      try {
        window.top.postMessage({ gxActivity: true }, location.origin);
      } catch (e) {}
    };
    ['pointerdown', 'keydown'].forEach((t) => document.addEventListener(t, ping, { capture: true, passive: true }));
    return;
  }
  if (!GX.isPortalMain()) return;

  const timer = (GX.timer = {
    lastActivity: Date.now(),
    lastExtend: 0,
    extendCount: 0,
    settings: null,
    listeners: new Set(),
    el: () => document.getElementById('timeout-timer'),
    button: () => document.getElementById('portaltimer') || document.getElementById('portaltimerimg'),
    remaining() {
      const n = parseInt(this.el()?.textContent ?? '', 10);
      return Number.isFinite(n) ? n : null;
    },
    // 延長を続けられる残り（分）。null は無制限
    budgetLeft() {
      const s = this.settings;
      if (!s || !s.extendLimit) return null;
      return Math.max(0, s.extendLimit - (Date.now() - this.lastActivity) / 60000);
    },
    extendNow() {
      const b = this.button();
      if (!b) return false;
      b.click(); // 学情自身の延長処理（extendSession）を呼ぶ
      this.lastExtend = Date.now();
      this.extendCount++;
      this.emit();
      return true;
    },
    onChange(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    },
    emit() {
      this.listeners.forEach((fn) => {
        try {
          fn(this);
        } catch (e) {}
      });
    },
  });

  const markActive = () => {
    timer.lastActivity = Date.now();
  };
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((t) =>
    document.addEventListener(t, markActive, { capture: true, passive: true })
  );
  window.addEventListener('message', (e) => {
    if (e.origin === location.origin && e.data && e.data.gxActivity) markActive();
  });

  const tick = () => {
    const s = timer.settings;
    const remain = timer.remaining();
    if (s && s.extendEnabled && remain != null && remain > 0 && remain <= s.extendThreshold) {
      const left = timer.budgetLeft();
      // 前回の延長から1分以内は重ねて押さない
      if ((left === null || left > 0) && Date.now() - timer.lastExtend > 60000) timer.extendNow();
    }
    timer.emit();
  };

  (async () => {
    timer.settings = await GX.getSettings();
    GX.onSettingsChanged(async () => {
      timer.settings = await GX.getSettings();
      tick();
    });
    const el = await GX.waitFor('#timeout-timer', { timeout: 15000 });
    if (!el) return;
    // 学情の表示（1分ごと）が変わるたびに確認。保険として30秒ごとにも確認
    new MutationObserver(tick).observe(el, { childList: true, characterData: true, subtree: true });
    setInterval(tick, 30000);
    tick();
  })();
})();
