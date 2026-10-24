// Regenerates the logo files from shared/brand.config.js. Run after a rename:
//   node scripts/brand-assets.mjs
// SVGs are written directly; PNGs (app icons, social image) are rendered with
// Playwright if it is installed (npx playwright install chromium).
import { writeFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND } from '../shared/brand.config.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = (f) => path.join(root, 'client/public', f);
const ARC = 'M24 9.5a14.5 14.5 0 1 1-12.56 7.25';

const monogram = (pad = 0) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${48 + pad * 2} ${48 + pad * 2}">
  <title>${BRAND.name}</title>
  <circle cx="24" cy="24" r="24" fill="#012834"/>
  <path d="${ARC}" fill="none" stroke="#4bcd3e" stroke-width="5" stroke-linecap="round"/>
  <circle cx="15.6" cy="11.2" r="3.1" fill="#f2a679"/>
</svg>
`;

const wordmark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${64 + BRAND.name.length * 25} 56">
  <title>${BRAND.name}</title>
  <g transform="translate(4 4)">
    <circle cx="24" cy="24" r="24" fill="#012834"/>
    <path d="${ARC}" fill="none" stroke="#4bcd3e" stroke-width="5" stroke-linecap="round"/>
    <circle cx="15.6" cy="11.2" r="3.1" fill="#f2a679"/>
  </g>
  <text x="64" y="38" font-family="'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible', system-ui, sans-serif" font-weight="800" font-size="34" letter-spacing="-1.4" fill="#012834">${BRAND.name}</text>
</svg>
`;

writeFileSync(out('favicon.svg'), monogram());
writeFileSync(out('brand/monogram.svg'), monogram());
writeFileSync(out('brand/wordmark.svg'), wordmark);
writeFileSync(out('manifest.webmanifest'), JSON.stringify({
  name: BRAND.name, short_name: BRAND.name, description: BRAND.tagline,
  start_url: '/app', display: 'standalone', background_color: '#f6f1ea', theme_color: '#012834',
  icons: [
    { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/brand/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));
console.log('Wrote favicon.svg, brand/monogram.svg, brand/wordmark.svg, manifest.webmanifest');

let chromium;
try { chromium = createRequire(import.meta.url)('playwright').chromium; } catch { console.log('Playwright not found: PNGs not regenerated.'); process.exit(0); }

const font = readFileSync(path.join(root, 'client/node_modules/@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2')).toString('base64');
const fontCss = `@font-face { font-family: 'Atkinson Hyperlegible Next'; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 200 800; }`;
const browser = await chromium.launch();
const page = await browser.newPage();
async function png(file, w, h, body) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!doctype html><style>${fontCss} html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden} body{font-family:'Atkinson Hyperlegible Next'}</style>${body}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out(file), omitBackground: true });
}
const icon = (pad, bg) => `<div style="width:100%;height:100%;display:grid;place-items:center;background:${bg}">${monogram(pad).replace('<svg', '<svg width="100%" height="100%"')}</div>`;
await png('brand/icon-192.png', 192, 192, icon(0, 'transparent'));
await png('brand/icon-512.png', 512, 512, icon(0, 'transparent'));
await png('brand/icon-maskable-512.png', 512, 512, icon(12, '#012834'));
await png('brand/apple-touch-icon.png', 180, 180, icon(8, '#012834'));
await png('brand/social.png', 1200, 630, `
  <div style="width:1200px;height:630px;position:relative;overflow:hidden;background:#f6f1ea;color:#012834">
    <i style="position:absolute;width:760px;height:760px;right:-200px;top:-320px;border-radius:50%;background:#f2a679;filter:blur(90px);opacity:.8"></i>
    <i style="position:absolute;width:520px;height:520px;left:-160px;bottom:-260px;border-radius:50%;background:#9fe28f;filter:blur(90px);opacity:.6"></i>
    <div style="position:absolute;left:80px;top:80px;width:96px;height:96px">${monogram().replace('<svg', '<svg width="96" height="96"')}</div>
    <p style="position:absolute;left:80px;top:230px;margin:0;font-weight:800;font-size:112px;letter-spacing:-6px;line-height:.92;max-width:760px">${BRAND.tagline}</p>
    <p style="position:absolute;left:80px;bottom:72px;margin:0;font-weight:800;font-size:40px;letter-spacing:-1.5px">${BRAND.name}</p>
  </div>`);
await browser.close();
console.log('Rendered icon-192, icon-512, icon-maskable-512, apple-touch-icon, social.png');
