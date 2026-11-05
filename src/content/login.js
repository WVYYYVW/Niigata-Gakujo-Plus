// 学情プラス — ログイン画面・2段階認証画面の新しいデザイン
// 入力欄は学情の元のフォームへ値を渡して送信するだけ。ID・パスワードを保存・送信することはない。
// （パスワードの保存はブラウザ／iCloud キーチェーンの機能に任せるため、入力欄は通常の DOM に置く）
(() => {
  const GX = globalThis.GX;
  if (!GX.isTop || !/\/campusweb\/campusportal\.do/.test(location.pathname)) return;

  GX.AUTH_CSS = `
#gx-auth, #gx-auth *{all:revert;box-sizing:border-box}
#gx-auth{position:fixed!important;inset:0!important;z-index:2147483000!important;overflow:auto!important;display:flex!important;align-items:center;justify-content:center;padding:24px 16px!important;
  background:#f0f4f9!important;color:#1f1f1f!important;font:15px/1.6 "Google Sans Text","Google Sans","Noto Sans JP",system-ui,-apple-system,"Hiragino Sans",sans-serif!important;-webkit-font-smoothing:antialiased}
@media (prefers-color-scheme: dark){#gx-auth{background:#131314!important;color:#e3e3e3!important}#gx-auth .gx-card{background:#1e1f20!important}#gx-auth .gx-in{background:#131314!important;color:#e3e3e3!important;border-color:#8e918f!important}#gx-auth .gx-sub,#gx-auth .gx-note{color:#c4c7c5!important}#gx-auth .gx-news{background:#282a2c!important}}
#gx-auth .gx-card{width:100%;max-width:440px;background:#fff;border-radius:28px;padding:36px 32px 28px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
#gx-auth .gx-logo{width:48px;height:48px;border-radius:14px;background:#0b57d0;color:#fff;display:grid;place-items:center;font-weight:700;font-size:22px;margin:0 0 16px}
#gx-auth h1{font-size:26px;font-weight:400;margin:0 0 4px;line-height:1.3}
#gx-auth .gx-sub{margin:0 0 24px;color:#444746;font-size:14px}
#gx-auth label{display:block;font-size:13px;font-weight:500;margin:14px 0 6px}
#gx-auth .gx-in{display:block;width:100%;height:52px;padding:0 16px;font:inherit;font-size:16px;color:#1f1f1f;background:#fff;border:1px solid #747775;border-radius:8px;outline:none}
#gx-auth .gx-in:focus{border:2px solid #0b57d0;padding:0 15px}
#gx-auth .gx-pw{position:relative}
#gx-auth .gx-eye{position:absolute;right:6px;top:6px;height:40px;padding:0 12px;border:0;border-radius:20px;background:transparent;color:#0b57d0;font:inherit;font-size:13px;font-weight:500;cursor:pointer}
#gx-auth .gx-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:24px;flex-wrap:wrap}
#gx-auth .gx-btn{height:44px;padding:0 24px;border:0;border-radius:22px;background:#0b57d0;color:#fff;font:inherit;font-size:15px;font-weight:600;cursor:pointer}
#gx-auth .gx-btn[disabled]{opacity:.5;cursor:default}
#gx-auth .gx-link{color:#0b57d0;text-decoration:none;font-size:14px;font-weight:500;background:none;border:0;padding:0;cursor:pointer;font-family:inherit}
#gx-auth .gx-links{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:22px;padding-top:16px;border-top:1px solid #e1e3e1}
#gx-auth .gx-err{margin-top:14px;padding:10px 14px;border-radius:12px;background:#f9dedc;color:#410e0b;font-size:14px}
#gx-auth .gx-ok{color:#146c2e}
#gx-auth .gx-note{font-size:12px;color:#444746;margin-top:8px}
#gx-auth .gx-news{margin-top:18px;padding:12px 14px;border-radius:14px;background:#f0f4f9;font-size:13px;white-space:pre-wrap;max-height:180px;overflow:auto}
#gx-auth details{margin-top:18px;font-size:14px}
#gx-auth summary{cursor:pointer;color:#0b57d0;font-weight:500}
#gx-auth .gx-code{letter-spacing:.4em;font-size:22px;text-align:center}
`;

  const addStyle = () => {
    if (document.getElementById('gx-auth-style')) return;
    const st = document.createElement('style');
    st.id = 'gx-auth-style';
    st.textContent = GX.AUTH_CSS;
    document.head.appendChild(st);
  };
  const el = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'class') e.className = v;
      else e.setAttribute(k, v === true ? '' : v);
    });
    kids.flat().forEach((k) => k != null && e.append(k));
    return e;
  };
  const setViewport = () => {
    let m = document.querySelector('meta[name="viewport"]');
    if (!m) {
      m = document.createElement('meta');
      m.name = 'viewport';
      document.head.appendChild(m);
    }
    m.content = 'width=device-width, initial-scale=1';
  };
  // 元のページの表示を戻す（「元の画面で表示」用）
  const showOriginal = (host) => {
    host.remove();
    document.documentElement.style.overflow = '';
    sessionStorage.setItem('gx-auth-classic', '1');
  };

  // ===== ログイン画面 =====
  const buildLogin = (origUser, origPass) => {
    const form = origUser.form || origUser.closest('form');
    const submitBtn = form?.querySelector('button[type="submit"], input[type="submit"]');
    const findBtn = (re) => [...document.querySelectorAll('button[onclick]')].find((b) => re.test(b.getAttribute('onclick') || ''));
    const enBtn = findBtn(/locale=en_US/);
    const smartBtn = findBtn(/campussmart\.do/);
    const pwChange = [...document.querySelectorAll('a')].find((a) => /パスワード変更/.test(a.textContent));
    const faq = [...document.querySelectorAll('a')].find((a) => /操作方法|よくある質問/.test(a.textContent));
    const newsText = (() => {
      const t = (document.body.innerText || document.body.textContent || "").match(/お知らせ\s*([\s\S]*?)\s*(リンク|使用上の注意|$)/);
      const s = t ? t[1].trim() : '';
      return s && !/^登録されていません$/.test(s) ? s.slice(0, 1500) : '';
    })();

    const user = el('input', { class: 'gx-in', id: 'gx-user', name: 'username', type: 'text', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', required: true });
    const pass = el('input', { class: 'gx-in', id: 'gx-pass', name: 'password', type: 'password', autocomplete: 'current-password', required: true });
    const eye = el('button', { type: 'button', class: 'gx-eye', onclick: () => {
      pass.type = pass.type === 'password' ? 'text' : 'password';
      eye.textContent = pass.type === 'password' ? '表示' : '隠す';
    } }, '表示');
    const err = el('div', { class: 'gx-err', style: 'display:none' });
    const btn = el('button', { type: 'submit', class: 'gx-btn' }, 'ログイン');
    const f = el('form', { autocomplete: 'on', onsubmit: (e) => {
      e.preventDefault();
      err.style.display = 'none';
      // 学情は「小文字で入力」と指定しているため小文字にそろえる
      origUser.value = user.value.trim().toLowerCase();
      origPass.value = pass.value;
      btn.disabled = true;
      btn.textContent = 'ログイン中…';
      if (submitBtn) submitBtn.click();
      else form?.requestSubmit?.();
      watchError();
    } },
      el('label', { for: 'gx-user' }, 'ID（小文字）'), user,
      el('label', { for: 'gx-pass' }, 'パスワード'), el('div', { class: 'gx-pw' }, pass, eye),
      err,
      el('div', { class: 'gx-row' },
        pwChange ? el('a', { class: 'gx-link', href: pwChange.href, target: '_blank', rel: 'noopener' }, 'パスワードを変更') : el('span'),
        btn)
    );
    const host = el('div', { id: 'gx-auth' },
      el('div', { class: 'gx-card' },
        el('div', { class: 'gx-logo' }, '学'),
        el('h1', {}, 'ログイン'),
        el('p', { class: 'gx-sub' }, '新潟大学 学務情報システム（学情プラス）'),
        f,
        newsText ? el('div', { class: 'gx-news' }, el('b', {}, 'お知らせ'), '\n', newsText) : null,
        el('div', { class: 'gx-links' },
          enBtn ? el('button', { type: 'button', class: 'gx-link', onclick: () => enBtn.click() }, 'English') : null,
          faq ? el('a', { class: 'gx-link', href: faq.href, target: '_blank', rel: 'noopener' }, '操作方法・FAQ') : null,
          el('button', { type: 'button', class: 'gx-link', onclick: () => showOriginal(host) }, '元の画面で表示'))
      )
    );

    // ログインに失敗したとき、学情が表示したメッセージを拾って見せる
    const watchError = () => {
      const started = Date.now();
      const timer = setInterval(() => {
        const msg = [...document.querySelectorAll('.ui-dialog, .error, .errorMessage, font[color="red"], font[color="#ff0000"], span[style*="red"]')]
          .filter((e) => !host.contains(e) && e.offsetParent !== null)
          .map((e) => e.innerText.trim())
          .find((t) => t && t.length < 300 && !/^\*|必須/.test(t));
        if (msg) {
          clearInterval(timer);
          err.textContent = msg;
          err.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'ログイン';
        } else if (Date.now() - started > 12000) {
          clearInterval(timer);
          btn.disabled = false;
          btn.textContent = 'ログイン';
          err.innerHTML = '';
          err.append('応答がありません。', el('button', { type: 'button', class: 'gx-link', onclick: () => showOriginal(host) }, '元の画面で確認する'));
          err.style.display = 'block';
        }
      }, 400);
    };

    document.documentElement.appendChild(host);
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => (user.value ? pass : user).focus(), 50);
  };

  const run = async () => {
    const s = await GX.getSettings();
    if (!s.newUi || sessionStorage.getItem('gx-auth-classic')) return;
    if (document.getElementById('portaltimer')) return; // ログイン済み
    const origPass = document.querySelector('input[type="password"][name="password"]');
    const origUser = document.querySelector('input[name="userName"]');
    if (origPass && origUser) {
      addStyle();
      setViewport();
      buildLogin(origUser, origPass);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
