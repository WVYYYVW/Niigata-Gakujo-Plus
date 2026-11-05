// 学情プラス — 設定画面（拡張機能のアイコン / 設定から開く）
(async () => {
  const GX = globalThis.GX;
  const $ = (s) => document.querySelector(s);
  document.getElementById('ver').textContent = GX.version();

  const load = async () => {
    const s = await GX.getSettings();
    document.querySelectorAll('[data-key]').forEach((el) => {
      const v = s[el.dataset.key];
      if (el.type === 'checkbox') el.checked = !!v;
      else el.value = String(v);
    });
    const key = await GX.getTotpKey();
    $('#keyStatus').textContent = key ? '鍵は登録済みです。' : '鍵は未登録です。下で登録するか、ログイン後の認証画面で登録できます。';
  };

  document.querySelectorAll('[data-key]').forEach((el) =>
    el.addEventListener('change', async () => {
      const v = el.type === 'checkbox' ? el.checked : 'num' in el.dataset ? Number(el.value) : el.value;
      await GX.setSettings({ [el.dataset.key]: v });
    })
  );

  $('#saveKey').addEventListener('click', async () => {
    const key = GX.normalizeTotpKey($('#key').value);
    if (!GX.isValidTotpKey(key)) {
      $('#keyMsg').textContent = '鍵の形式が正しくありません（A〜Z と 2〜7 の16文字以上）。';
      return;
    }
    await GX.setTotpKey(key);
    $('#key').value = '';
    const code = await GX.totp(key);
    $('#keyMsg').textContent = `保存しました。現在のコードは ${code} です（認証アプリの表示と一致すれば正しく登録できています）。`;
    load();
  });
  $('#delKey').addEventListener('click', async () => {
    if (!confirm('登録済みの鍵を削除しますか？')) return;
    await GX.setTotpKey('');
    $('#keyMsg').textContent = '削除しました。';
    load();
  });

  load();
})();
