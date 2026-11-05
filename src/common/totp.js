// 学情プラス — TOTP（RFC 6238）をブラウザ標準の WebCrypto だけで計算する
// 元の拡張機能は otplib をバンドルした 760KB のファイルを使っていたが、これで不要になる
(() => {
  const GX = (globalThis.GX = globalThis.GX || {});

  // otpauth://totp/...?secret=XXXX の URI が貼られても鍵だけ取り出す
  GX.normalizeTotpKey = (input) => {
    let s = String(input || '').trim();
    const m = s.match(/[?&]secret=([^&]+)/i);
    if (m) s = decodeURIComponent(m[1]);
    return s.replace(/[\s-]/g, '').replace(/=+$/, '').toUpperCase();
  };

  GX.isValidTotpKey = (key) => /^[A-Z2-7]{16,}$/.test(GX.normalizeTotpKey(key));

  const base32Decode = (str) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    const out = [];
    for (const ch of str) {
      const idx = alphabet.indexOf(ch);
      if (idx < 0) throw new Error('invalid base32');
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        out.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    return new Uint8Array(out);
  };

  GX.totp = async (key, { step = 30, digits = 6, time = Date.now() } = {}) => {
    const secret = base32Decode(GX.normalizeTotpKey(key));
    const counter = Math.floor(time / 1000 / step);
    const msg = new ArrayBuffer(8);
    const view = new DataView(msg);
    view.setUint32(0, Math.floor(counter / 2 ** 32));
    view.setUint32(4, counter >>> 0);
    const cryptoKey = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-1' }, false, [
      'sign',
    ]);
    const mac = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, msg));
    const offset = mac[mac.length - 1] & 0x0f;
    const bin =
      ((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3];
    return String(bin % 10 ** digits).padStart(digits, '0');
  };

  // 現在のコードが切り替わるまでの秒数
  GX.totpRemaining = (step = 30) => step - (Math.floor(Date.now() / 1000) % step);
})();
