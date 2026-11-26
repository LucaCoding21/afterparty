#!/usr/bin/env node
/*
 * Checks that the measurement drawing on every product page sits with the same
 * white space above it (from the size table's bottom line) as below it (to the
 * Add to Cart button), at the desktop, tablet and phone sizes the approved
 * spacing was signed off at. Fails if the two sides differ by more than 1px.
 *
 *   npm run dev                      # in another terminal
 *   node scripts/check-size-guide-gaps.cjs [--base http://localhost:3000]   (or: npm run check:size-guides) [--out dir]
 *
 * --out saves a screenshot of every chart plus results.json, for the QA preview.
 * Gaps are measured to the drawing's ink (dark pixels), not to the image box,
 * so a stray speck or blank margin in a diagram file shows up as uneven.
 * Needs Playwright (`npm i -D playwright` or NODE_PATH pointing at one) and Chrome.
 */
const fs = require('fs');
const path = require('path');

let chromium;
try { ({chromium} = require('playwright')); } catch {
  console.error('Playwright is not installed. Run `npm i -D playwright` (uses your installed Chrome).');
  process.exit(2);
}

const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : dflt; };
const BASE = arg('--base', 'http://localhost:3000');
const OUT = arg('--out', null);
const TOLERANCE = 1;
const ROOT = path.resolve(__dirname, '..');

const VIEWS = {
  'desktop-1240': {width: 1240, height: 880},
  'desktop-1440': {width: 1440, height: 900},
  'desktop-1920': {width: 1920, height: 1080},
  'desktop-1100': {width: 1100, height: 700},
  'tablet-820': {width: 820, height: 1180},
  'phone-390': {width: 390, height: 844, isMobile: true},
};

function handles() {
  const src = fs.readFileSync(path.join(ROOT, 'app/routes/products.$handle.tsx'), 'utf8');
  const start = src.indexOf('const SIZE_GUIDE_MAP');
  const block = src.slice(start, src.indexOf('\n};', start));
  return [...block.matchAll(/^ {2}'([a-z0-9-]+)': \{[^}]*sizePhoto:/gm)].map((m) => m[1]);
}

// Runs in the page. Returns page-y positions of the table line, the first and
// last rows of dark ink in the drawing, and the top of the button.
const MEASURE = async () => {
  const d = document.querySelector('details.product-size-guide');
  if (!d) return {error: 'no size guide on the page'};
  d.open = true;
  const img = d.querySelector('.product-size-guide-photo img');
  if (!img) return {error: 'no measurement drawing'};
  await img.decode().catch(() => {});
  if (!img.naturalWidth) return {error: 'drawing did not load'};
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, c.width, c.height).data;
  const dark = (y) => { for (let x = 0; x < c.width; x++) { const i = (y * c.width + x) * 4; if (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114 < 160) return true; } return false; };
  let first = 0, last = c.height - 1;
  while (first < c.height && !dark(first)) first++;
  while (last > first && !dark(last)) last--;
  const r = img.getBoundingClientRect();
  const scale = Math.min(r.width / c.width, r.height / c.height);
  const drawnTop = r.top + (r.height - c.height * scale) / 2;
  const sy = window.scrollY;
  // A line's box is its centre; the visible gap starts at the bottom of its stroke.
  const svg = d.querySelector('.product-size-guide-svg svg');
  const units = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
  const lines = [...svg.querySelectorAll('line')];
  const lineEl = lines.sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom)[0];
  const stroke = parseFloat(getComputedStyle(lineEl).strokeWidth) || 1;
  const line = {bottom: lineEl.getBoundingClientRect().bottom + (stroke / 2) * units};
  const btn = document.querySelector('.product-form button[type="submit"]').getBoundingClientRect();
  const col = d.getBoundingClientRect();
  return {
    line: line.bottom + sy,
    inkTop: drawnTop + first * scale + sy,
    inkBottom: drawnTop + (last + 1) * scale + sy,
    btnTop: btn.top + sy, btnBottom: btn.bottom + sy,
    left: col.left, right: col.right,
    title: document.title.replace(/\s*[|—-]\s*afterparty$/, ''),
  };
};

(async () => {
  const browser = await chromium.launch({channel: 'chrome'});
  if (OUT) fs.mkdirSync(path.join(OUT, 'shots'), {recursive: true});
  const results = [], missing = [];
  let failures = 0;
  for (const handle of handles()) {
    const row = {handle, views: {}};
    for (const [name, vp] of Object.entries(VIEWS)) {
      const ctx = await browser.newContext({viewport: {width: vp.width, height: vp.height}, deviceScaleFactor: 2, isMobile: !!vp.isMobile, hasTouch: !!vp.isMobile});
      const page = await ctx.newPage();
      const res = await page.goto(`${BASE}/products/${handle}`, {waitUntil: 'networkidle', timeout: 60000}).catch(() => null);
      if (!res || res.status() !== 200) { await ctx.close(); missing.push(handle); break; }
      await page.addStyleTag({content: '[class*="popup"],[class*="modal"]{display:none!important}'});
      const m = await page.evaluate(MEASURE);
      if (m.error) { console.log(`FAIL ${handle} ${name}: ${m.error}`); failures++; await ctx.close(); continue; }
      row.title = m.title;
      const top = m.inkTop - m.line, bottom = m.btnTop - m.inkBottom;
      const v = {top: +top.toFixed(1), bottom: +bottom.toFixed(1), ok: Math.abs(top - bottom) <= TOLERANCE};
      if (!v.ok) failures++;
      if (OUT) {
        const clip = {x: m.left - 8, y: m.line - 24, width: m.right - m.left + 16, height: m.btnBottom - m.line + 32};
        v.img = `shots/${handle}-${name}.png`;
        v.h = +clip.height.toFixed(2);
        v.marks = {line: m.line - clip.y, inkTop: m.inkTop - clip.y, inkBottom: m.inkBottom - clip.y, btn: m.btnTop - clip.y};
        await page.screenshot({path: path.join(OUT, v.img), clip, fullPage: true});
      }
      row.views[name] = v;
      await ctx.close();
    }
    if (Object.keys(row.views).length) {
      results.push(row);
      const s = Object.entries(row.views).map(([n, v]) => `${n} ${v.top}/${v.bottom}${v.ok ? '' : ' UNEVEN'}`).join('  ');
      console.log(`${Object.values(row.views).every((v) => v.ok) ? 'ok  ' : 'FAIL'} ${handle}  ${s}`);
    }
  }
  await browser.close();
  if (OUT) fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({views: Object.keys(VIEWS), results, missing}, null, 1));
  if (missing.length) console.log(`\nNot live (skipped): ${missing.join(', ')}`);
  console.log(`\n${results.length} products checked at ${Object.keys(VIEWS).length} sizes, ${failures} uneven.`);
  process.exit(failures ? 1 : 0);
})();
