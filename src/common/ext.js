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
  // sync がないブラウザ・使えないブラウザ（Orion など）では local に保存する
  let syncBroken = false;
  const area = () => (!syncBroken && GX.api?.storage?.sync) || GX.api?.storage?.local;

  GX.getSettings = async () => {
    try {
      const got = await area().get(GX.DEFAULTS);
      return { ...GX.DEFAULTS, ...got };
    } catch (e) {
      if (!syncBroken && GX.api?.storage?.local) {
        syncBroken = true;
        return GX.getSettings();
      }
      return { ...GX.DEFAULTS };
    }
  };
  GX.setSettings = async (patch) => {
    try {
      await area().set(patch);
    } catch (e) {
      if (syncBroken || !GX.api?.storage?.local) throw e;
      syncBroken = true;
      await area().set(patch);
    }
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

  // 新しい画面（ログイン・2段階認証・メイン）を出している間は、元のページを表示しない。
  // 元のページは横幅の広い表を含むため、スマホ（特に iPhone・iPad の WebKit）では
  // ページ全体が縮小表示され、新しい画面まで小さくなってしまう。元のフォームは非表示でも送信できる
  GX.cover = (on) => {
    const de = document.documentElement;
    if (!document.getElementById('gx-cover-style')) {
      const st = document.createElement('style');
      st.id = 'gx-cover-style';
      st.textContent =
        'html.gx-cover{overflow:hidden!important;width:100%!important;min-width:0!important;max-width:100%!important;height:100%!important;-webkit-text-size-adjust:100%!important;text-size-adjust:100%!important}' +
        'html.gx-cover>body{display:none!important}' +
        'html.gx-cover>frameset{display:none!important}';
      (document.head || de).appendChild(st);
    }
    de.classList.toggle('gx-cover', !!on);
    let meta = document.querySelector('meta[name="viewport"]');
    if (on) {
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        (document.head || de).appendChild(meta);
      }
      if (meta.dataset.gxOld === undefined) meta.dataset.gxOld = meta.content || '';
      meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    } else if (meta && meta.dataset.gxOld !== undefined) {
      if (meta.dataset.gxOld) meta.content = meta.dataset.gxOld;
      else meta.remove();
    }
    de.style.overflow = on ? 'hidden' : '';
  };

  GX.isTop = window.top === window;
  GX.isPortalMain = () =>
    /\/campusweb\/campusportal\.do/.test(location.pathname) && /[?&]page=main\b/.test(location.search);
})();
