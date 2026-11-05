// 学情プラス — 共通: ブラウザAPIの差異吸収と設定
// Chrome / Firefox / Safari のどれでも同じコードで動くようにする
(() => {
  const GX = (globalThis.GX = globalThis.GX || {});
  GX.api = globalThis.browser ?? globalThis.chrome;

  GX.DEFAULTS = {
    newUi: true, // 新しい画面を使う
    theme: 'auto', // auto | light | dark
    extendEnabled: true, // 自動延長
    extendThreshold: 10, // 残り何分で延長するか
    extendLimit: 120, // 最後の操作から何分まで延長を続けるか（0 = 無制限）
    bulkCount: 10, // 一括既読の既定件数
    classicEnhance: true, // 旧画面の改善（並べ替え・GPA・一括既読）
    draftSave: true, // 提出画面の本文を端末内に下書き保存
    twofaEnabled: true, // 2段階認証の自動入力
    twofaAutoSubmit: true, // 鍵が登録されていれば、入力後に自動で送信して認証を通過する
    medMode: 'auto', // 医学科モード：auto（学情の所属から判定）| on | off
    medGrade: 0, // 医学科モードで使う学年（0 = 学情の学年を使う）
  };

  // 医学科「講義概要」PDF の読み取り方式の版。読み取り方式を直したら上げる（古い読み取り結果は使わない）
  GX.MED_PARSER_VERSION = 1;
  // 年度（4月始まり）
  GX.fiscalYear = (d = new Date()) => (d.getMonth() < 3 ? d.getFullYear() - 1 : d.getFullYear());

  // 設定は sync（端末間で同期）。2段階認証の鍵だけは local（同期しない）
  const area = () => GX.api?.storage?.sync ?? GX.api?.storage?.local;

  GX.getSettings = async () => {
    try {
      const got = await area().get(GX.DEFAULTS);
      return { ...GX.DEFAULTS, ...got };
    } catch (e) {
      return { ...GX.DEFAULTS };
    }
  };
  GX.setSettings = async (patch) => {
    await area().set(patch);
    return GX.getSettings();
  };
  GX.onSettingsChanged = (fn) => {
    GX.api?.storage?.onChanged?.addListener((changes, areaName) => {
      if (areaName === 'sync' || areaName === 'local') fn(changes);
    });
  };

  GX.getTotpKey = async () => {
    try {
      const { totpKey } = await GX.api.storage.local.get('totpKey');
      return totpKey || '';
    } catch (e) {
      return '';
    }
  };
  GX.setTotpKey = (key) =>
    key ? GX.api.storage.local.set({ totpKey: key }) : GX.api.storage.local.remove('totpKey');

  GX.version = () => {
    try {
      return GX.api.runtime.getManifest().version;
    } catch (e) {
      return '';
    }
  };

  GX.sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // 要素が現れるまで待つ（ポーリングではなく MutationObserver）
  GX.waitFor = (selector, { root = document, timeout = 20000 } = {}) =>
    new Promise((resolve) => {
      const found = root.querySelector(selector);
      if (found) return resolve(found);
      const obs = new MutationObserver(() => {
        const el = root.querySelector(selector);
        if (el) {
          obs.disconnect();
          resolve(el);
        }
      });
      obs.observe(root.documentElement || root, { childList: true, subtree: true });
      setTimeout(() => {
        obs.disconnect();
        resolve(null);
      }, timeout);
    });

  GX.isTop = window.top === window;
  GX.isPortalMain = () =>
    /\/campusweb\/campusportal\.do/.test(location.pathname) && /[?&]page=main\b/.test(location.search);
})();
