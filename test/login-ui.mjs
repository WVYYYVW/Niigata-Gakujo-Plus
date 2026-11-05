import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
const root='/home/claude/gakujo-extender-next/src/';
const html=`<!doctype html><html><head></head><body>
<form name="TopForm"></form>
<div id="wf_PTW0000011_20120827233559"><form id="wf_PTW0000011_20120827233559-form" method="post" onsubmit="return send();">
<input type="hidden" name="wfId" value="x"><table><tr><td>ID</td><td><input type="text" name="userName" autocomplete="off"> ※小文字で入力してください。</td></tr>
<tr><td>パスワード</td><td><input type="password" name="password" autocomplete="off"> <a href="http://www.cais.niigata-u.ac.jp/download/">※パスワード変更はこちら（保護者等除く）</a></td></tr></table>
<input type="hidden" name="locale" value="ja_JP"><button type="submit"><span>ログイン</span></button>
<button type="button" onclick="location.href='campusportal.do?locale=en_US'">English</button>
<button type="button" onclick="location.href='campussmart.do?locale=ja_JP'">スマホ版</button></form></div>
<div>お知らせ\n  登録されていません</div><a href="https://www.iess.niigata-u.ac.jp/first-step.html">学務情報システムの操作方法・よくある質問はこちら</a>
</body></html>`;
const dom=new JSDOM(html,{url:'https://gakujo.iess.niigata-u.ac.jp/campusweb/campusportal.do',runScripts:'outside-only'});
const w=dom.window; let submitted=null;
w.send=()=>{submitted={u:w.document.querySelector('[name=userName]').value,p:w.document.querySelector('[name=password]').value};return false;};
w.chrome={storage:{sync:{get:async d=>d},local:{get:async d=>({})},onChanged:{addListener(){}}},runtime:{getManifest:()=>({version:'t'})}};
w.fetch=globalThis.fetch;
for(const f of ['common/ext.js','common/totp.js','common/gakujo.js','content/login.js']) w.eval(readFileSync(root+f,'utf8'));
await new Promise(r=>setTimeout(r,200));
const host=w.document.getElementById('gx-auth');
console.log('overlay:',!!host, 'links:',[...host.querySelectorAll('.gx-links > *')].map(e=>e.textContent));
host.querySelector('#gx-user').value='M25TEST'; host.querySelector('#gx-pass').value='pw';
// jsdom: clicking submit button triggers form submit event → onsubmit attr runs send()
host.querySelector('form').dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));
await new Promise(r=>setTimeout(r,100));
console.log('submitted:',submitted, 'orig values:', w.document.querySelector('[name=userName]').value, w.document.querySelector('[name=password]').value, 'btn:', host.querySelector('.gx-btn').textContent);
process.exit(0);
