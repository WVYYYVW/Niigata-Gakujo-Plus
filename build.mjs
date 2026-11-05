// 学情プラス — ビルド：src/ から各ブラウザ向けの拡張機能を dist/ に出力する
//   node build.mjs           → dist/chrome, dist/firefox, dist/safari と各 zip
// 依存パッケージは不要（Node.js 18 以上と zip コマンドのみ）
import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const DIST = 'dist';

const CONTENT_JS = [
  'common/ext.js',
  'common/totp.js',
  'common/gakujo.js',
  'content/timer.js',
  'content/login.js',
  'content/twofa.js',
  'content/classic.js',
  'content/smart.js',
  'content/app-style.js',
  'content/app.js',
];

const base = () => ({
  manifest_version: 3,
  name: '学情プラス',
  short_name: '学情プラス',
  version: pkg.version,
  description: '新潟大学の学務情報システム（学情）を使いやすくする非公式の拡張機能。新しい画面、締切管理、添付の一括保存、自動延長、2段階認証の自動入力、医学科の授業日程。',
  icons: { 16: 'icons/icon16.png', 32: 'icons/icon32.png', 48: 'icons/icon48.png', 96: 'icons/icon96.png', 128: 'icons/icon128.png' },
  permissions: ['storage'],
  host_permissions: ['https://gakujo.iess.niigata-u.ac.jp/*'],
  action: {
    default_title: '学情プラス',
    default_popup: 'options/options.html',
    default_icon: { 16: 'icons/icon16.png', 32: 'icons/icon32.png' },
  },
  options_ui: { page: 'options/options.html', open_in_tab: true },
  // 医学科モードの画面（講義概要の取り込み・原本の表示）を、学情の新しい画面の中に表示するため
  web_accessible_resources: [{ resources: ['med/med.html'], matches: ['https://gakujo.iess.niigata-u.ac.jp/*'] }],
  content_scripts: [
    {
      matches: ['https://gakujo.iess.niigata-u.ac.jp/campusweb/*'],
      all_frames: true,
      run_at: 'document_end',
      js: CONTENT_JS,
    },
  ],
});

const targets = {
  chrome: (m) => m,
  firefox: (m) => ({
    ...m,
    browser_specific_settings: {
      // ID は Firefox アドオンに登録したら変えられない
      gecko: {
        id: 'niigata-gakujo-plus@wvyyyvw.github.io',
        strict_min_version: '140.0',
        // 個人データは収集・送信しない（学情とこの端末の間だけでやり取りする）
        data_collection_permissions: { required: ['none'] },
      },
      gecko_android: { strict_min_version: '142.0' },
    },
  }),
  safari: (m) => m,
};

rmSync(DIST, { recursive: true, force: true });
for (const [name, transform] of Object.entries(targets)) {
  const out = join(DIST, name);
  mkdirSync(out, { recursive: true });
  cpSync('src', out, { recursive: true });
  writeFileSync(join(out, 'manifest.json'), JSON.stringify(transform(base()), null, 2));
  cpSync('LICENSE', join(out, 'LICENSE'));
  const zip = `gakujo-plus-${name}-${pkg.version}.zip`;
  execSync(`cd ${out} && zip -qr ../${zip} .`);
  console.log(`✓ ${out}  →  ${DIST}/${zip}`);
}

// 動作確認用：content script をひとつに連結したもの（ブラウザのコンソールに貼って試せる）
const shim = `globalThis.chrome = globalThis.chrome && globalThis.chrome.storage ? globalThis.chrome : (() => {
  const mk = (k) => ({
    get: async (d) => { const all = JSON.parse(localStorage.getItem(k) || '{}'); if (typeof d === 'string') return { [d]: all[d] }; if (Array.isArray(d)) return Object.fromEntries(d.map((x) => [x, all[x]])); return { ...(d || {}), ...all }; },
    set: async (o) => { localStorage.setItem(k, JSON.stringify({ ...JSON.parse(localStorage.getItem(k) || '{}'), ...o })); },
    remove: async (key) => { const all = JSON.parse(localStorage.getItem(k) || '{}'); delete all[key]; localStorage.setItem(k, JSON.stringify(all)); },
  });
  return { storage: { sync: mk('gx-sync'), local: mk('gx-local'), onChanged: { addListener() {} } }, runtime: { getManifest: () => ({ version: '${pkg.version}-dev' }) } };
})();\n`;
writeFileSync(
  join(DIST, 'dev-inject.js'),
  shim + CONTENT_JS.map((f) => `// ---- ${f}\n${readFileSync(join('src', f), 'utf8')}`).join('\n')
);
console.log(`✓ ${DIST}/dev-inject.js（開発用）`);
if (!existsSync('LICENSE')) console.warn('LICENSE がありません');
