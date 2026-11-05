// 学情プラス — 2段階認証コードの自動入力・自動送信
// 鍵はこの端末のブラウザ内（storage.local）にだけ保存し、外部には送らない
(() => {
  const GX = globalThis.GX;
  if (!GX.isTop || !/\/campusweb\/campusportal\.do/.test(location.pathname)) return;

  const SELECTOR = 'input[name="ninshoCode"]';

  // 認証画面の「送信」ボタンを探す（見つからなければフォーム送信）
  const submitCode = (input) => {
    const form = input.form || input.closest('form');
    const scope = form || input.closest('#google-authenticator-login-body') || document;
    const btns = [...scope.querySelectorAll('button, input[type="submit"], input[type="button"]')].filter(
      (b) => !b.closest('#gx-auth') && !b.closest('#gx-2fa')
    );
    const btn =
      btns.find((b) => /認証|ログイン|送信|確認|OK|Verify|Login|Submit/i.test(b.value || b.textContent)) ||
      btns.find((b) => b.type === 'submit');
    if (btn) btn.click();
    else if (form) form.requestSubmit ? form.requestSubmit() : form.submit();
  };

  const run = async () => {
    const settings = await GX.getSettings();
    if (!settings.twofaEnabled) return;
    const input = await GX.waitFor(SELECTOR, { timeout: 30000 });
    if (!input || document.getElementById('portaltimer')) return;

    const fill = async (key) => {
      const code = await GX.totp(key);
      input.value = code;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return code;
    };
    // 失敗時に送信を繰り返さないよう、1分に1回まで自動送信
    const canAutoSubmit = () => {
      const last = Number(sessionStorage.getItem('gx-2fa-submit') || 0);
      if (Date.now() - last < 60000) return false;
      sessionStorage.setItem('gx-2fa-submit', String(Date.now()));
      return true;
    };
    const autoFlow = async (key, setStatus) => {
      // コードの切り替わり直前（残り3秒未満）なら、切り替わりを待ってから入力する
      const left = GX.totpRemaining();
      if (left < 3) {
        setStatus('コードの切り替わりを待っています…');
        await GX.sleep(left * 1000 + 300);
      }
      await fill(key);
      if (settings.twofaAutoSubmit && canAutoSubmit()) {
        setStatus('認証コードを自動入力し、送信しています…', true);
        setTimeout(() => submitCode(input), 500);
        return 'submitted';
      }
      setStatus('認証コードを自動入力しました。「認証」を押してください。', true);
      return 'filled';
    };

    // 2段階認証の「設定」画面（QR コードと鍵が表示される画面）では、自動送信せず、鍵の登録を手伝う
    const setupKey = findSetupKey();
    if (setupKey !== null) return setupFlow(input, setupKey, fill);
    if (settings.newUi && !sessionStorage.getItem('gx-auth-classic')) return newUiFlow(settings, input, fill, autoFlow);
    return panelFlow(input, autoFlow);
  };

  // ===== 新しい画面（ログイン画面と同じデザインの認証カード） =====
  const newUiFlow = async (settings, input, fill, autoFlow) => {
    if (!GX.AUTH_CSS) return panelFlow(input, autoFlow);
    if (!document.getElementById('gx-auth-style')) {
      const st = document.createElement('style');
      st.id = 'gx-auth-style';
      st.textContent = GX.AUTH_CSS;
      document.head.appendChild(st);
    }
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1';
    document.getElementById('gx-auth')?.remove();

    const host = document.createElement('div');
    host.id = 'gx-auth';
    host.innerHTML = `
      <div class="gx-card">
        <div class="gx-logo">学</div>
        <h1>2段階認証</h1>
        <p class="gx-sub">認証アプリに表示される6桁のコードを入力してください。</p>
        <form id="gx-2fa-form">
          <label for="gx-code">認証コード</label>
          <input class="gx-in gx-code" id="gx-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}">
          <p class="gx-note" id="gx-status"></p>
          <div class="gx-row"><button type="button" class="gx-link" id="gx-orig">元の画面で表示</button><button type="submit" class="gx-btn">認証</button></div>
        </form>
        <details id="gx-keybox">
          <summary>自動入力の設定（秘密鍵）</summary>
          <p class="gx-note">認証アプリに登録したときの秘密鍵（または otpauth:// のURI）を登録すると、次回から自動で入力・送信します。鍵はこの端末のブラウザ内にだけ保存されます。</p>
          <input class="gx-in" id="gx-key" type="password" autocomplete="off" placeholder="秘密鍵">
          <div class="gx-row"><button type="button" class="gx-link" id="gx-del">登録済みの鍵を削除</button><button type="button" class="gx-btn" id="gx-save">保存</button></div>
          <p class="gx-note" id="gx-keymsg"></p>
        </details>
      </div>`;
    document.documentElement.appendChild(host);
    document.documentElement.style.overflow = 'hidden';
    const $ = (id) => host.querySelector('#' + id);
    const setStatus = (t, ok) => {
      $('gx-status').textContent = t;
      $('gx-status').className = 'gx-note' + (ok ? ' gx-ok' : '');
    };
    const code = $('gx-code');
    code.addEventListener('input', () => {
      code.value = code.value.replace(/\D/g, '').slice(0, 6);
      input.value = code.value;
    });
    $('gx-2fa-form').addEventListener('submit', (e) => {
      e.preventDefault();
      input.value = code.value;
      setStatus('送信しています…', true);
      submitCode(input);
    });
    $('gx-orig').addEventListener('click', () => {
      host.remove();
      document.documentElement.style.overflow = '';
      sessionStorage.setItem('gx-auth-classic', '1');
    });
    $('gx-save').addEventListener('click', async () => {
      const key = GX.normalizeTotpKey($('gx-key').value);
      if (!GX.isValidTotpKey(key)) {
        $('gx-keymsg').textContent = '鍵の形式が正しくありません（A〜Z と 2〜7 の16文字以上）。';
        return;
      }
      await GX.setTotpKey(key);
      $('gx-key').value = '';
      $('gx-keymsg').textContent = '保存しました。';
      start();
    });
    $('gx-del').addEventListener('click', async () => {
      await GX.setTotpKey('');
      $('gx-keymsg').textContent = '削除しました。';
    });

    const start = async () => {
      const key = await GX.getTotpKey();
      if (!key) {
        setStatus('');
        $('gx-keybox').open = true;
        code.focus();
        return;
      }
      await autoFlow(key, setStatus);
      code.value = input.value;
    };
    start();
  };

  // ===== 設定画面の判定：画面に Base32 の鍵（16文字以上）か QR コードの画像がある =====
  // 戻り値：見つけた鍵（見つからないが QR がある場合は ''）、設定画面でなければ null
  const findSetupKey = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const found = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.parentElement?.closest('#gx-auth, #gx-2fa, script, style')) continue;
      const t = n.textContent.replace(/[\s-]+/g, '');
      if (/^[A-Z2-7]{16,64}=*$/.test(t)) found.push(t);
      const uri = n.textContent.match(/otpauth:\/\/totp\/\S+/);
      if (uri) found.push(uri[0]);
    }
    const inputs = [...document.querySelectorAll('input[type="text"], input:not([type])')].filter((i) => /^[A-Z2-7\s]{16,}$/.test(i.value || ''));
    inputs.forEach((i) => found.push(i.value.replace(/\s+/g, '')));
    if (found.length) return found[0];
    const qr = [...document.querySelectorAll('img, canvas')].some(
      (el) => !el.closest('#gx-auth, #gx-2fa') && (/qr/i.test(`${el.id} ${el.className} ${el.getAttribute('alt') || ''}`) || /qr|chart\?/i.test((el.getAttribute('src') || '').slice(0, 200)) || (/^data:image\//.test(el.getAttribute('src') || '') && el.width >= 100 && Math.abs(el.width - el.height) <= 8))
    );
    return qr ? '' : null;
  };

  const setupFlow = async (input, detected, fill) => {
    const form = input.form || document.querySelector('form[name="form"]') || input.closest('form');
    const host = document.createElement('div');
    host.id = 'gx-2fa';
    const root = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host{all:initial;display:block;margin:16px auto;max-width:560px;font:14px/1.7 system-ui,-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;color:#1f1f1f}
      .card{border:1px solid #c4c7c5;border-radius:16px;padding:16px 18px;background:#fff}
      h3{margin:0 0 6px;font-size:15px;font-weight:600;color:#0b57d0}
      ol{margin:6px 0;padding-left:20px} p{margin:4px 0;color:#444746}
      .row{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
      input{flex:1;min-width:0;font:inherit;padding:10px 12px;border:1px solid #747775;border-radius:8px}
      button{font:inherit;font-weight:600;padding:10px 16px;border:0;border-radius:999px;background:#0b57d0;color:#fff;cursor:pointer}
      .ok{color:#146c2e;font-weight:600} code{font-size:18px;letter-spacing:.12em}`;
    const card = document.createElement('div');
    card.className = 'card';
    const mk = (tag, text) => {
      const el = document.createElement(tag);
      if (text) el.textContent = text;
      return el;
    };
    const steps = mk('ol');
    [
      'まず、この画面の QR コードを認証アプリ（Google Authenticator など）で読み取ってください（学情プラスが使えないときの予備になります）。',
      '下の欄の鍵を確認して「学情プラスに登録」を押してください。',
      '表示された6桁のコードが認証アプリと同じなら、学情の「認証」ボタンを押して設定を完了してください。',
    ].forEach((t) => steps.append(mk('li', t)));
    const keyInput = mk('input');
    keyInput.type = 'text';
    keyInput.autocomplete = 'off';
    keyInput.spellcheck = false;
    keyInput.placeholder = '画面に表示されている鍵（英大文字と数字）';
    keyInput.value = detected || '';
    const save = mk('button', '学情プラスに登録');
    const msg = mk('p');
    const row = mk('div');
    row.className = 'row';
    row.append(keyInput, save);
    card.append(mk('h3', '学情プラス：2段階認証の自動入力を設定'), steps, row, msg, mk('p', '※この画面では自動で送信しません。鍵はこの端末のブラウザの中だけに保存されます。'));
    root.append(style, card);
    (form?.parentElement || document.body).appendChild(host);
    save.addEventListener('click', async (e) => {
      e.preventDefault();
      const key = GX.normalizeTotpKey(keyInput.value);
      if (!GX.isValidTotpKey(key)) return (msg.textContent = '鍵の形式が正しくありません（A〜Z と 2〜7 の16文字以上）。');
      await GX.setTotpKey(key);
      const code = await fill(key);
      msg.className = 'ok';
      msg.textContent = `登録しました。いまのコード：${code}（認証アプリと同じか確かめてから、学情の「認証」を押してください）`;
    });
  };

  // ===== 旧画面向け（認証画面の下に登録欄を追加） =====
  const panelFlow = async (input, autoFlow) => {
    const form = input.form || document.querySelector('form[name="form"]') || input.closest('form');
    const host = document.createElement('div');
    host.id = 'gx-2fa';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host{all:initial;display:block;margin:16px auto;max-width:520px;font:14px/1.6 system-ui,-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;color:#1f1f1f}
        .card{border:1px solid #c4c7c5;border-radius:16px;padding:16px 18px;background:#fff}
        h3{margin:0 0 6px;font-size:15px;font-weight:600;color:#0b57d0}
        p{margin:4px 0;color:#444746}
        .row{display:flex;gap:8px;margin-top:10px}
        input{flex:1;min-width:0;font:inherit;padding:10px 12px;border:1px solid #747775;border-radius:8px}
        button{font:inherit;font-weight:600;padding:10px 16px;border:0;border-radius:999px;background:#0b57d0;color:#fff;cursor:pointer}
        button.text{background:transparent;color:#0b57d0;padding:10px 8px}
        .ok{color:#146c2e}
      </style>
      <div class="card">
        <h3>学情プラス：2段階認証の自動入力</h3>
        <p id="status"></p>
        <div class="row">
          <input id="key" type="password" autocomplete="off" placeholder="秘密鍵（英大文字と数字）または otpauth:// のURI">
          <button id="save">保存</button>
        </div>
        <p id="msg"></p>
      </div>`;
    (form?.parentElement || document.body).appendChild(host);
    const $ = (id) => root.getElementById(id);
    const setStatus = (t, ok) => {
      $('status').textContent = t;
      $('status').className = ok ? 'ok' : '';
    };
    $('save').addEventListener('click', async (e) => {
      e.preventDefault();
      const key = GX.normalizeTotpKey($('key').value);
      if (!GX.isValidTotpKey(key)) return ($('msg').textContent = '鍵の形式が正しくありません（A〜Z と 2〜7 の16文字以上）。');
      await GX.setTotpKey(key);
      $('key').value = '';
      $('msg').textContent = '保存しました。';
      autoFlow(key, setStatus);
    });
    const key = await GX.getTotpKey();
    if (key) autoFlow(key, setStatus);
    else setStatus('鍵が未登録です。登録すると次回から認証コードが自動で入力・送信されます。');
  };

  run();
})();
