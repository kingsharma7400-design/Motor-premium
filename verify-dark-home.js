/* Home page in dark mode, AFTER a real premium calculation: every cell of the
   OD/TP breakdown + the Total/GST/Net/Commission table must be dark-surface with
   light text. Light mode must be untouched. Quotation doc stays paper. */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const ROOT = path.join(__dirname, '..', 'uploads');

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace(/<script src="(https?:)?\/\/[^"]*"[^>]*><\/script>/g, '<!--cdn-->');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  const f = path.join(ROOT, src);
  if (!fs.existsSync(f)) return '';
  let t = fs.readFileSync(f, 'utf8');
  if (/styles-pro/.test(src)) { /* noop */ }
  return '<script>\n' + t + '\n</script>';
});
html = html.replace(/<link[^>]*rel="stylesheet"[^>]*>/g, m => {
  const f = (m.match(/href="([^"]+)"/) || [])[1] || '';
  const file = path.join(ROOT, f.replace(/^.\//, ''));
  return fs.existsSync(file) ? '<style>\n' + fs.readFileSync(file, 'utf8') + '\n</style>' : '';
});

const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => errs.push(e.message.split('\n')[0]));

const wait = ms => new Promise(r => setTimeout(r, ms));
const pad = n => String(n).padStart(2, '0');
const fmt = d => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;

function lum(c) { if (!c) return 0; const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); }
const parse = str => {
  const s = String(str || '').trim();
  let m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(s);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (m) { const h = m[1].length === 3 ? m[1].split('').map(c => c + c).join('') : m[1];
           return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16), a: 1 }; }
  return null;
};
/* jsdom never resolves var(…) — read the two variable blocks out of the CSS
   itself and resolve by hand, exactly like the browser cascade would. */
function varMap(theme) {
  const map = {};
  const grab = (txt, re) => {
    const m = re.exec(txt); if (!m) return;
    m[1].replace(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi, (_, k, v) => { map[k] = v.trim(); return ''; });
  };
  grab(fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8'), /:root\s*\{([\s\S]*?)\}/);
  if (theme === 'dark') grab(fs.readFileSync(path.join(ROOT, 'styles-pro.css'), 'utf8'), /html\[data-theme="dark"\]\s*\{([\s\S]*?)\}/);
  const out = {};
  for (const k in map) {                     /* one pass of nesting */
    let v = map[k];
    for (let i = 0; i < 3; i++) v = v.replace(/var\((--[a-z0-9-]+)([^)]*)\)/gi, (mm, kk, fb) => out[kk] || map[kk] || (fb || '').replace(/^,/, '').trim() || 'transparent');
    out[k] = v;
  }
  return out;
}
function makeResolve(map) {
  return raw => {
    if (!raw) return raw;
    let v = String(raw);
    for (let i = 0; i < 4 && /var\(/.test(v); i++)
      v = v.replace(/var\((--[a-z0-9-]+)(\s*,\s*([^)]*))?\)/gi, (mm, k, _x, fb) => map[k] || (fb || '').trim() || 'transparent');
    return v.trim();
  };
}
function effBg(win, el, resolve) {                       // walk up until a non-transparent bg is found
  for (let e = el; e; e = e.parentElement) {
    const c = parse(resolve ? resolve(win.getComputedStyle(e).backgroundColor) : win.getComputedStyle(e).backgroundColor);
    if (c && c.a > .5) return c;
    const bi = win.getComputedStyle(e).backgroundImage || '';
    if (/gradient/.test(bi)) {                  // gradient: approximate with its first colour stop
      const c = parse(bi); if (c) return c;
      const m = /rgba?\(\s*(\d+)[^)]*\)/.exec(bi);
      if (m) return { r: +m[1], g: +m[2], b: +m[3], a: 1 };
    }
  }
  return { r: 11, g: 17, b: 32, a: 1 };
}
function varText(win, el, prop) {          // jsdom leaves var(--x) unresolved → resolve it ourselves
  const raw = win.getComputedStyle(el)[prop] || '';
  const m = /var\((--[a-z0-9-]+)(?:,\s*([^)]*))?\)/i.exec(raw);
  if (!m) return raw;
  const v = win.getComputedStyle(win.document.documentElement).getPropertyValue(m[1]).trim();
  return v || m[2] || raw;
}
const ratio = (a, b) => { const L1 = Math.max(lum(a), lum(b)), L2 = Math.min(lum(a), lum(b)); return (L1 + .05) / (L2 + .05); };

async function run(thm) {
  const dom = new JSDOM(html.replace('<html lang="en">', `<html lang="en" data-theme="${thm}">`),
    { url: 'http://localhost/Motor-premium/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc });
  const win = dom.window, doc = win.document;
  /* pro.js initTheme() reads oic_theme_v1 and re-applies it (it wins over the
     attribute we set) — so seed the storage, exactly like a user who toggled. */
  win.localStorage.setItem('oic_theme_v1', thm);
  win.matchMedia = win.matchMedia || (q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  win.scrollTo = () => {}; win.Element.prototype.scrollIntoView = function () {};
  const set = (id, v) => { const el = doc.getElementById(id); if (!el || el.disabled) return; el.value = v; ['input', 'change'].forEach(t => el.dispatchEvent(new win.Event(t, { bubbles: true }))); };
  await wait(250);
  set('policyDate', fmt(new Date()));
  set('vehicleType', 'twoWheeler'); await wait(40);
  set('fuelType', 'Petrol'); set('cc', 150); set('seating', 2);
  const d = new Date(); d.setFullYear(d.getFullYear() - 3); d.setDate(d.getDate() - 60);
  set('dor', fmt(d)); set('invoice', 90000); set('idv', 80000); set('policyType', 'package');
  set('policyTerm', '1'); set('zone', 'A'); set('state', 'Punjab'); set('ncb', 20);
  set('uwDiscount', 0); set('ndDiscount', 0); set('ndRenDiscount', 0);
  set('insuredName', 'Sunil Verma'); set('regNo', 'PB10AB1234');
  doc.getElementById('calcBtn').click(); await wait(150);
  return win;
}

(async () => {
  const dark = await run('dark');
  const light = await run('light');
  let pass = 0, fail = 0;
  const t = (n, ok, x) => { ok ? (pass++, console.log('  ✓ ' + n)) : (fail++, console.log('  ✗ ' + n + (x ? ' → ' + x : ''))); };

  const CHECKS = [
    ['OD table header (Cover/Rate)', '#odTable thead th'],
    ['OD row #1 (first breakdown line)', '#odTable tbody tr:first-child td'],
    ['OD row #3 (add-on / Dep Cap line)', '#odTable tbody tr:nth-child(3) td'],
    ['OD running-total cell', '#odTable tbody tr:last-child td:last-child'],
    ['TP table header', '#tpTable thead th'],
    ['TP row #1 (liability)', '#tpTable tbody tr:first-child td'],
    ['Total OD row', '#rowOdTotal td'],
    ['Total Premium before GST (bold row)', '.final-table tr.bold td'],
    ['GST @ 18% value', '#gstAmt2'],
    ['Net Premium Payable (grand row)', '#netAmount2'],
    ['Agent Commission row', '#commission'],
    ['Breakdown card body', '#calcBreakdown'],
    ['Total Premium stat card value', '#totalPremium'],
    ['Basic OD Rate stat card value', '#basicRateDisplay'],
    ['Checkbox row (add-on)', '.cb-row']
  ];
  console.log('\n== dark: readable text on a dark surface (WCAG >= 4.5:1) ==');
  const resD = makeResolve(varMap('dark')), resL = makeResolve(varMap('light'));
  for (const [name, s2] of CHECKS) {
    const el = dark.document.querySelector(s2);
    if (!el) { t(name, false, 'node missing: ' + s2); continue; }
    const cs = dark.getComputedStyle(el);
    const col = parse(resD(cs.color)) || { r: 0, g: 0, b: 0 };
    const bg = effBg(dark, el, resD);
    const r = ratio(col, bg);
    const darkSurface = lum(bg) < .35;
    t(name.padEnd(38) + ' text rgb(' + [col.r, col.g, col.b].join(',') + ')'.padEnd(12) + ' on rgb(' + [bg.r, bg.g, bg.b].join(',') + ')'.padEnd(6) + ' = ' + r.toFixed(1) + ':1',
      r >= 4.5 && darkSurface, 'contrast ' + r.toFixed(2) + ', darkSurface=' + darkSurface);
  }
  console.log('\n== stylesheet truth: winning declared background per node (own CSS parse) ==');
  /* jsdom exposes no usable cssRules, so parse the app's own stylesheets:
     selector → declarations, with @media print excluded and specificity ranked. */
  const FILES = ['styles.css', 'styles-other.css', 'styles-pro.css'];
  const stripAtPrint = css => { let out = '', depth = 0, i = 0;
    while (i < css.length) {
      if (css.startsWith('@media', i)) {
        const open = css.indexOf('{', i);
        if (/print/.test(css.slice(i, open))) { let d = 1, j = open + 1; while (j < css.length && d) { if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; } i = j; continue; }
      }
      out += css[i++];
    }
    return out.replace(/\/\*[\s\S]*?\*\//g, ' ');
  };
  const RULES = [];
  for (const f of FILES) {
    const css = stripAtPrint(fs.readFileSync(path.join(ROOT, f), 'utf8'));
    let idx = 0;
    css.replace(/([^{}]+)\{([^{}]*)\}/g, (m, sel, body) => {
      idx++;
      const decls = {};
      body.split(';').forEach(d => { const i2 = d.indexOf(':'); if (i2 < 0) return;
        const k = d.slice(0, i2).trim().toLowerCase(), v = d.slice(i2 + 1).trim();
        if (k && !k.startsWith('@')) decls[k] = { v, imp: /!important/.test(v) }; });
      sel.split(',').forEach(raw => { const x = raw.trim(); if (!x) return;
        RULES.push({ sel: x, decls, order: idx, file: f }); });
      return m;
    });
  }
  const spec = sel => [ (sel.match(/[.#\[]/g) || []).length, (sel.match(/(^|[\s>+~])[\w]/g) || []).length ];
  function winning(win, sel, prop) {
    const probe = win.document.querySelector(sel);
    if (!probe) return { v: 'node missing' };
    let best = null;
    for (const r of RULES) {
      const themeGate = /\[data-theme="([^"]*)"\]/.exec(r.sel);
      if (themeGate && themeGate[1] !== win.document.documentElement.getAttribute('data-theme')) continue;
      let hit = false; try { hit = [...win.document.querySelectorAll(r.sel)].indexOf(probe) > -1; } catch (e) { continue; }
      if (!hit || !r.decls[prop]) continue;
      const d = r.decls[prop], bs = spec(best ? best.sel : ''), rs = spec(r.sel);
      const better = !best || (d.imp && !best.imp) || (d.imp === best.imp && (rs[0] - bs[0] || rs[1] - bs[1] || r.order > best.order) > 0);
      if (better) best = { sel: r.sel, v: d.v.replace(' !important', ''), imp: d.imp, file: r.file };
    }
    return best || { v: '(none declared)' };
  }
  const HOME_BG = [
    ['OD/TP breakdown table', '#odTable', '#0b1526'],
    ['final (Total/GST/Net) table', '.final-table', '#0b1526'],
    ['commission row', '.final-table tr.commission-row td', 'rgba(245, 158, 11, .10)'],
    ['checkbox row', '.cb-row', '#0b1526'],
    ['stat card (lifted off page bg)', '.stat-card', '#16223c'],
    ['bold total row', '.final-table tr.bold td', '#101d34']
  ];
  const norm = v => String(v).replace(/\s+/g, '').toLowerCase();
  for (const [name, sel, expect] of HOME_BG) {
    const dW = winning(dark, sel, 'background') .v === 'node missing' ? winning(dark, sel, 'background-color') : winning(dark, sel, 'background');
    const lW = winning(light, sel, 'background').v === 'node missing' ? winning(light, sel, 'background-color') : winning(light, sel, 'background');
    const okD = norm(dW.v) === norm(expect);
    const okL = /white|--white|#f[0-9a-f]/.test(norm(lW.v)) && norm(lW.v) !== norm(expect);
    t(name.padEnd(28) + ' dark ' + String(dW.v).padEnd(24) + ' light ' + String(lW.v).padEnd(18), okD && okL,
      'dark=' + dW.v + ' (want ' + expect + ') light=' + lW.v);
  }
  const pageBg = winning(dark, 'html[data-theme="dark"] body', 'background');
  t('stat card differs from the page background (card still visible)',
    norm(winning(dark, '.stat-card', 'background').v) !== '#0b1120', 'page=' + pageBg.v);
  const qdCss = winning(dark, '.quote-doc .breakdown-table', 'background');
  t('quote-doc breakdown stays #fff in dark', /#fff|white/.test(norm(qdCss.v)), qdCss.v + ' via ' + qdCss.sel);
  console.log('  (parsed ' + RULES.length + ' selectors from the 3 app stylesheets, @media print excluded)');
  /* NB: the computed-style check above is the authoritative one for light mode —
     jsdom does not resolve var(--white) in background, so its computed values
     there are meaningless; the declared (stylesheet) check is used instead. */
  console.log('\n== quotation doc untouched ==');
  const qd = dark.document.querySelector('.quote-doc');
  t('quote-doc background still white in dark', lum(effBg(dark, qd, resD)) > .9, JSON.stringify(effBg(dark, qd, resD)));
  const qb = dark.document.querySelector('.quote-doc .breakdown-table');
  if (qb) { const c = effBg(dark, qb, resD); t('quote-doc breakdown stays light (not darkened)', lum(c) > .9, JSON.stringify(c)); }
  else console.log('  (quote-doc breakdown table not present pre-calculation — skipped)');
  t('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`\n${fail === 0 ? '✅ DARK-HOME PASS' : '❌ DARK-HOME FAIL'} — ${pass} ok, ${fail} wrong\n`);
  process.exit(fail ? 1 : 0);
})();
