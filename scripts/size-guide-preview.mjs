#!/usr/bin/env node
// Builds the size guide comparison page: each new size guide rendered on the
// real product page next to an existing product of the same shape, at desktop
// (1440) and mobile (390), with the designer's chart above for checking.
//
//   node scripts/size-guide-preview.mjs --out <dir> \
//     --pair "graffiti-letter-tee=afterparty-x-megahertz-logo-t-shirt" \
//     --chart "graffiti-letter-tee=/path/to/Graffiti Letter Tee Chart 2026.png" ...
//
// --pair  new-handle=reference-handle. The new handle must already be in
//         SIZE_GUIDE_MAP. The reference is a live product with the same kind
//         of garment; its page hosts the new files, so drafts can be previewed.
// --chart new-handle=designer's full chart (optional, shown for checking numbers).
// --port  dev server port (default 3100). Start it first: npm run dev.
//
// Writes <dir>/index.html and <dir>/img/*. Publish <dir>/index.html as a private
// Artifact with the img files, as described in section B of the launch-prep skill.

import {spawn} from 'node:child_process';
import {copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {extname, join, resolve} from 'node:path';

const args = process.argv.slice(2);
const opt = (name) => args.flatMap((a, i) => (a === `--${name}` ? [args[i + 1]] : []));
const out = resolve(opt('out')[0] ?? '');
const port = opt('port')[0] ?? '3100';
const pairs = opt('pair').map((p) => p.split('='));
const charts = Object.fromEntries(opt('chart').map((c) => [c.slice(0, c.indexOf('=')), c.slice(c.indexOf('=') + 1)]));
if (!opt('out')[0] || !pairs.length) {
  console.error('Usage: node scripts/size-guide-preview.mjs --out <dir> --pair new=reference [--pair ...] [--chart new=file]');
  process.exit(1);
}

const route = readFileSync(new URL('../app/routes/products.$handle.tsx', import.meta.url), 'utf8');
const mapSrc = route.slice(route.indexOf('const SIZE_GUIDE_MAP'));
function entry(handle) {
  const m = mapSrc.match(new RegExp(`'${handle}':\\s*\\{\\s*sizeGuide:\\s*'([^']+)',(?:\\s*sizePhoto:\\s*'([^']+)',)?`));
  if (!m) throw new Error(`${handle} is not in SIZE_GUIDE_MAP`);
  return {svg: m[1], photo: m[2]};
}

// Headless Chrome over the DevTools protocol.
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEBUG_PORT = 9345;
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'sgp-'))}`], {stdio: 'ignore'});
for (let i = 0; ; i++) {
  try { await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`); break; } catch { if (i > 40) throw new Error('Chrome did not start'); }
  await new Promise((r) => setTimeout(r, 250));
}

async function capture(host, vw, file, swap) {
  const t = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, {method: 'PUT'})).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = {};
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({id: i, method, params})); });
  // A tall window keeps the sticky Add to Cart bar from painting over the shot.
  await send('Emulation.setDeviceMetricsOverride', {width: vw, height: 2600, deviceScaleFactor: 2, mobile: vw < 700});
  await send('Page.enable');
  await send('Page.navigate', {url: `http://localhost:${port}/products/${host}`});
  await new Promise((r) => setTimeout(r, 6000));
  const res = await send('Runtime.evaluate', {awaitPromise: true, returnByValue: true, expression: `(async () => {
    const d = document.querySelector('details.product-size-guide');
    if (!d) return null;
    d.open = true;
    for (let i = 0; i < 60 && !(d.querySelector('.product-size-guide-svg svg') && d.querySelector('.product-size-guide-photo img')?.complete); i++)
      await new Promise((r) => setTimeout(r, 250));
    ${swap ? `
    d.querySelector('.product-size-guide-svg').innerHTML =
      (await (await fetch(${JSON.stringify(swap.svg)})).text()).replace(/\\sfont-size="[^"]*"/g, '');
    const img = d.querySelector('.product-size-guide-photo img');
    if (img) {
      await new Promise((r) => { img.onload = r; img.src = ${JSON.stringify(swap.photo ?? '')}; });
      const ratio = img.naturalWidth / img.naturalHeight;
      const box = d.querySelector('.product-size-guide-photo');
      box.className = box.className.replace(/product-size-guide-photo--\\w+/g, '').trim() + ' product-size-guide-photo--' +
        (ratio < 0.75 ? 'tall' : ratio > 1.2 ? 'wide' : 'square');
    }` : ''}
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 400));
    const a = d.getBoundingClientRect();
    const btn = [...document.querySelectorAll('button')].find((b) => /add to cart|sold out/i.test(b.textContent) && b.getBoundingClientRect().top > a.top);
    const pr = d.querySelector('.product-size-guide-photo img')?.getBoundingClientRect();
    // The gap above starts at the bottom edge of the table's last line (a line's
    // box is its centre, so add half its stroke), as in check-size-guide-gaps.cjs.
    const svgEl = d.querySelector('.product-size-guide-svg svg');
    const units = svgEl.getBoundingClientRect().width / svgEl.viewBox.baseVal.width;
    const lineEl = [...svgEl.querySelectorAll('line')].sort((p, q) => q.getBoundingClientRect().bottom - p.getBoundingClientRect().bottom)[0];
    const sr = {bottom: lineEl.getBoundingClientRect().bottom + ((parseFloat(getComputedStyle(lineEl).strokeWidth) || 1) / 2) * units};
    const br = btn?.getBoundingClientRect();
    const bottom = Math.max(a.bottom + 60, br ? br.bottom + 12 : 0);
    return {x: a.left - 16, y: a.top + scrollY - 12, w: a.width + 32, h: bottom - a.top + 12,
      tableGap: pr ? Math.round(pr.top - sr.bottom) : null, buttonGap: pr && br ? Math.round(br.top - pr.bottom) : null,
      photo: pr ? [Math.round(pr.width), Math.round(pr.height)] : null};
  })()`});
  const r = res.result.result?.value;
  if (!r) throw new Error(`${host}: no size guide found on the page`);
  const shot = await send('Page.captureScreenshot', {format: 'png', captureBeyondViewport: true, clip: {x: r.x, y: r.y, width: r.w, height: r.h, scale: 1}});
  writeFileSync(join(out, 'img', file), Buffer.from(shot.result.data, 'base64'));
  ws.close();
  return r;
}

// Approved spacing: 35px above and below the drawing (rounded, so 34 to 36).
const gapOk = (g) => g != null && Math.abs(g - 35) <= 1;

mkdirSync(join(out, 'img'), {recursive: true});
const sections = [];
let allGood = true;
try {
  for (const [handle, ref] of pairs) {
    const swap = entry(handle);
    const views = {};
    for (const [key, vw] of [['desktop', 1440], ['mobile', 390]]) {
      const old = await capture(ref, vw, `${ref}-${key}.png`);
      const neu = await capture(ref, vw, `${handle}-${key}.png`, swap);
      views[key] = {old, neu};
      const ok = (s) => gapOk(s.tableGap) && gapOk(s.buttonGap);
      if (!ok(old) || !ok(neu)) allGood = false;
      console.log(`${handle} ${key}: new gaps ${neu.tableGap}/${neu.buttonGap}, diagram ${neu.photo?.join('x')} | ${ref} ${old.photo?.join('x')}`);
    }
    let chart = '';
    if (charts[handle]) {
      chart = `chart-${handle}${extname(charts[handle])}`;
      copyFileSync(charts[handle], join(out, 'img', chart));
    }
    sections.push({handle, ref, views, chart});
  }
} finally {
  chrome.kill();
}

const title = (h) => h.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const gap = (s) => `diagram ${s.photo ? s.photo.join('×') : 'none'} · gaps <b class="${gapOk(s.tableGap) ? 'ok' : 'bad'}">${s.tableGap}</b> / <b class="${gapOk(s.buttonGap) ? 'ok' : 'bad'}">${s.buttonGap}</b>`;
const pair = (s, key) => `
    <div class="pair ${key}">
      <div class="col"><span class="label">Existing: ${title(s.ref)}</span><div class="shot"><img src="img/${s.ref}-${key}.png" alt=""></div><span class="stats">${gap(s.views[key].old)}</span></div>
      <div class="col"><span class="label">New</span><div class="shot"><img src="img/${s.handle}-${key}.png" alt=""></div><span class="stats">${gap(s.views[key].neu)}</span></div>
    </div>`;

const html = `<title>Size Guide Preview</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap">
<style>
/* One section per product: designer's chart, then the existing reference beside the new build. */
:root { --bg:#f4f4f2; --panel:#fff; --fg:#141414; --muted:#6b6b66; --line:#deded9; --ok:#1d7a46; --ok-bg:#e6f3eb; --bad:#b3261e; --bad-bg:#fbe4e2;
  --sans:"Inter",-apple-system,"Helvetica Neue",Arial,sans-serif; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#161615; --panel:#1f1f1e; --fg:#f1f1ee; --muted:#a3a39c; --line:#343432; --ok:#6fd39a; --ok-bg:#173323; --bad:#ff8a80; --bad-bg:#3d1a17; color-scheme:dark; } }
:root[data-theme="dark"] { --bg:#161615; --panel:#1f1f1e; --fg:#f1f1ee; --muted:#a3a39c; --line:#343432; --ok:#6fd39a; --ok-bg:#173323; --bad:#ff8a80; --bad-bg:#3d1a17; color-scheme:dark; }
* { box-sizing:border-box; }
body { background:var(--bg); color:var(--fg); font-family:var(--sans); font-size:15px; line-height:1.5;
  padding-left:max(16px, env(safe-area-inset-left, 0px)); padding-right:max(16px, env(safe-area-inset-right, 0px)); padding-block:32px 64px; }
.wrap { max-width:1180px; margin:0 auto; display:flex; flex-direction:column; gap:40px; }
header { display:flex; flex-direction:column; gap:10px; }
h1 { font-size:28px; font-weight:600; margin:0; }
.lede { color:var(--muted); max-width:68ch; margin:0; }
.pill { font-size:12px; font-weight:500; padding:4px 10px; border-radius:999px; align-self:flex-start; background:var(--ok-bg); color:var(--ok); }
.pill.bad { background:var(--bad-bg); color:var(--bad); }
.toggle { display:inline-flex; border:1px solid var(--line); border-radius:8px; overflow:hidden; align-self:flex-start; }
.toggle button { font:inherit; font-size:13px; padding:7px 16px; border:0; background:var(--panel); color:var(--fg); cursor:pointer; }
.toggle button[aria-pressed="true"] { background:var(--fg); color:var(--bg); }
.toggle button:focus-visible { outline:2px solid var(--fg); outline-offset:-4px; }
section { background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:24px; display:flex; flex-direction:column; gap:20px; }
h2 { font-size:19px; font-weight:600; margin:0; }
.label { font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:var(--muted); }
.chart { display:flex; flex-direction:column; gap:8px; }
.chart img { width:100%; max-width:420px; border:1px solid var(--line); border-radius:4px; background:#fff; }
.pair { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:24px; align-items:start; }
.col { display:flex; flex-direction:column; gap:8px; min-width:0; }
.shot { background:#fff; border:1px solid var(--line); border-radius:4px; display:flex; justify-content:center; }
.shot img { display:block; width:100%; height:auto; }
.desktop .shot img { max-width:504px; } .mobile .shot img { max-width:422px; }
.stats { font-size:12px; color:var(--muted); font-variant-numeric:tabular-nums; }
.stats .ok { color:var(--ok); } .stats .bad { color:var(--bad); }
[data-view="desktop"] .mobile, [data-view="mobile"] .desktop { display:none; }
@media (max-width:720px) { .pair { grid-template-columns:1fr; } section { padding:16px; } }
</style>
<div class="wrap" id="app" data-view="desktop">
  <header>
    <h1>Size Guide Preview</h1>
    <p class="lede">Each new size guide rendered on the real product page (localhost, 2x), beside an existing product of the same shape. Approved spacing: 35px from the table to the diagram and 35px from the diagram to Add to Cart.</p>
    <span class="pill${allGood ? '' : ' bad'}">${allGood ? 'All spacing matches the approved 35px / 35px' : 'Some spacing is off: see the red numbers'}</span>
    <div class="toggle" role="group" aria-label="Screen size">
      <button type="button" id="btn-desktop" aria-pressed="true">Desktop 1440px</button>
      <button type="button" id="btn-mobile" aria-pressed="false">Mobile 390px</button>
    </div>
  </header>
${sections.map((s) => `  <section>
    <h2>${title(s.handle)}</h2>
    ${s.chart ? `<div class="chart"><span class="label">Designer's chart</span><img src="img/${s.chart}" alt="Designer's chart"></div>` : ''}${pair(s, 'desktop')}${pair(s, 'mobile')}
  </section>`).join('\n')}
</div>
<script>
(function () {
  var app = document.getElementById('app'), d = document.getElementById('btn-desktop'), m = document.getElementById('btn-mobile');
  function set(v) { app.setAttribute('data-view', v); d.setAttribute('aria-pressed', String(v === 'desktop')); m.setAttribute('aria-pressed', String(v === 'mobile')); }
  d.addEventListener('click', function () { set('desktop'); });
  m.addEventListener('click', function () { set('mobile'); });
})();
</script>
`;
writeFileSync(join(out, 'index.html'), html);
console.log(`\nWrote ${join(out, 'index.html')} (${allGood ? 'all spacing OK' : 'SPACING PROBLEMS'})`);
process.exit(allGood ? 0 : 1);
