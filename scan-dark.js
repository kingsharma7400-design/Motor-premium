/* Sweeps the HOME (calculator) tab + the other product panes for elements whose
   COMPUTED background stays paper-white (or text stays near-black) while
   data-theme="dark" is on. Prints the offenders, grouped. */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..', 'uploads');

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
html = html.replace(/<link[^>]*rel="stylesheet"[^>]*>/g, m => {
  const f = (m.match(/href="([^"]+)"/) || [])[1] || '';
  const file = path.join(ROOT, f.replace(/^.\//, ''));
  return fs.existsSync(file) ? '<style>\n' + fs.readFileSync(file, 'utf8') + '\n</style>' : '';
});
/* simulate a calculated quote so the breakdown/final tables + hero have content */
html = html.replace('<div class="op-result" id="fireResult" style="display:none;"></div>',
  '<div class="op-result" id="fireResult"><table><tr><td>Cover</td><td>Premium</td></tr></table></div>');

const dom = new JSDOM(html.replace('<html lang="en">', '<html lang="en" data-theme="dark">'),
  { url: 'http://localhost/', pretendToBeVisual: true });
const win = dom.window, doc = win.document;

const rgb = s => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(s || ''); return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null; };
const lum = c => { if (!c) return null; const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
const idOf = e => e.id ? '#' + e.id : (typeof e.className === 'string' && e.className.trim() ? e.className.trim().split(/\s+/).slice(0, 2).map(x => '.' + x).join('') : e.tagName.toLowerCase());

const WHITE_BG = [];
const DARK_TEXT = [];
const all = [...doc.querySelectorAll('.tab-content *, .app-shell *')];
for (const el of all) {
  if (el.closest('#tab-quote') || el.closest('#tab-hquote')) continue;   // quotation stays paper-white on purpose
  const cs = win.getComputedStyle(el);
  if (/gradient/.test(cs.backgroundImage || '')) continue;   // amber-gradient buttons/logo keep dark text on purpose
  const bg = rgb(cs.backgroundColor);
  const l = lum(bg);
  if (bg && bg.a > .5 && l !== null && l > .75) {
    WHITE_BG.push([idOf(el), el.tagName, cs.backgroundColor, el.textContent.trim().slice(0, 26)]);
  }
  const c = lum(rgb(cs.color));
  if (c !== null && c < .12) {           // near-black text on a dark page
    const bl = lum(bg);
    if (bl === null || bl < .3) DARK_TEXT.push([idOf(el), el.tagName, cs.color, 'bg ' + cs.backgroundColor]);
  }
}
const uniq = arr => { const s = new Set(); return arr.filter(x => { const k = x.join('|'); if (s.has(k)) return false; s.add(k); return true; }); };
console.log('\n=== elements that stay PAPER-WHITE in dark mode (' + uniq(WHITE_BG).length + ' distinct) ===');
uniq(WHITE_BG).slice(0, 40).forEach(x => console.log('  ' + x[0].padEnd(30) + x[1].padEnd(7) + x[2].padEnd(22) + '"' + x[3] + '"'));
console.log('\n=== near-black text on dark background (' + uniq(DARK_TEXT).length + ' distinct) ===');
uniq(DARK_TEXT).slice(0, 40).forEach(x => console.log('  ' + x.join('  ')));
if (!uniq(WHITE_BG).length && !uniq(DARK_TEXT).length) console.log('  none 🎉');
