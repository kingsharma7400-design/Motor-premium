#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""(2) bold "Customized by" line in PDF/Excel footers · (3) dark-mode text fixes
   · (1) History: Product filter control in index.html + product badge style."""
import io, sys
U = '/home/user/uploads/'

def edit(fname, pairs):
    p = U + fname
    s = io.open(p, encoding='utf-8').read()
    for i, (old, new) in enumerate(pairs):
        n = s.count(old)
        if n != 1:
            print('ABORT %s anchor #%d matched %d times:\n%s' % (fname, i, n, old[:240]))
            sys.exit(1)
        s = s.replace(old, new)
    io.open(p, 'w', encoding='utf-8').write(s)
    print('%-18s %d change(s) applied' % (fname, len(pairs)))

# ---------- (2) PDF / Excel: "Customized by" line bold + dark ----------
edit('app.js', [
  # print CSS used by BOTH the Motor PDF and the Health/PA PDF
  ("""      .disclaimer { margin-top: 8px; font-size: 7.5px; color: #64748b; line-height: 1.35; border-top: 1px solid #e2e8f0; padding-top: 6px; }""",
   """      .disclaimer { margin-top: 8px; font-size: 7.5px; color: #64748b; line-height: 1.35; border-top: 1px solid #e2e8f0; padding-top: 6px; }
      .disclaimer strong { font-weight: 800 !important; color: #0a2540 !important; }"""),
])

edit('styles-pro.css', [
  ("""  .disclaimer, .hq-notes, #hqNotes {
    font-size: 8.8px !important;
    line-height: 1.35 !important;
    margin-top: 9px !important;
  }""",
   """  .disclaimer, .hq-notes, #hqNotes {
    font-size: 8.8px !important;
    line-height: 1.35 !important;
    margin-top: 9px !important;
  }
  /* "Generated … · Customized by …" line — bold & dark in print/PDF */
  .disclaimer strong, .hq-notes strong, #hqNotes strong {
    font-weight: 800 !important;
    color: #0a2540 !important;
    font-style: normal !important;
  }"""),
])

# NOTE: the `.disclaimer strong` screen rule was added to styles.css manually —
# block left empty here on purpose so this script stays re-runnable.

edit('excel-export.js', [
  ("""    rows.push({ cells: [{ v: 'Generated: ' + today() + '  ·  Customized by Mohit Sharma', s: 11 }] });""",
   """    rows.push({ cells: [{ v: 'Generated: ' + today() + '  ·  Customized by Mohit Sharma', s: 15 }] });"""),
])

# ---------- (1) History: Product filter control ----------
edit('index.html', [
  ("""          <div class="h-search"><input type="text" id="hSearch" placeholder="Search reg. no, name, vehicle, quote no, premium…" autocomplete="off" /></div>
          <select class="h-filter" id="hFilterPolicy">""",
   """          <div class="h-search"><input type="text" id="hSearch" placeholder="Search reg. no, name, vehicle, product, quote no, premium…" autocomplete="off" /></div>
          <select class="h-filter" id="hFilterProduct" title="Show one product's quotes only"></select>
          <select class="h-filter" id="hFilterPolicy">"""),
])

# ---------- (1) product badge on history cards + (3) dark-mode text fixes ----------
edit('styles-pro.css', [
  (""".h-tag-ghost { background: #f8fafc; color: var(--text-2); border-color: var(--border); }""",
   """.h-tag-ghost { background: #f8fafc; color: var(--text-2); border-color: var(--border); }
/* product badge on saved quotes (Fire / Theft / PA / Mediclaim plans) */
.h-tag-product {
  background: #eef2ff; color: #3730a3; border-color: #c7d2fe; font-weight: 700;
}"""),
])

DARK = """
/* =========================================================
   DARK MODE · TEXT CONTRAST PASS
   Inline `style="color:#…"` values written for the light theme
   (index.html form labels/hints, product panes) used to sit on a
   dark card and go unreadable.  Inline styles beat class rules, so
   these need !important — grouped here so the HTML stays untouched.
   The quotation document (.quote-doc) is deliberately paper-white in
   both themes, so its own inline colours are left alone.
   ========================================================= */
html[data-theme="dark"] .field label span[style*="#b45309"],
html[data-theme="dark"] .field label b[style*="#b45309"],
html[data-theme="dark"] .date-field-wrap span[style*="#b45309"] { color: #fcd34d !important; }

html[data-theme="dark"] .field label[style*="#1e40af"],
html[data-theme="dark"] .field label[style*="#854d0e"],
html[data-theme="dark"] .field label[style*="#0369a1"],
html[data-theme="dark"] .field label[style*="#92400e"],
html[data-theme="dark"] .field div[style*="#854d0e"],
html[data-theme="dark"] #cpaTermHint { color: #bfdbfe !important; }

html[data-theme="dark"] .field div[style*="background:#f0fdf4"],
html[data-theme="dark"] .field div[style*="background:#f0f9ff"],
html[data-theme="dark"] .field div[style*="background:#fff7ed"],
html[data-theme="dark"] .field div[style*="background:#eff6ff"] {
  background: #101a30 !important;
  border-color: #2b3b5e !important;
}
html[data-theme="dark"] .field div[style*="#92400e"],
html[data-theme="dark"] .field div[style*="#1e40af"],
html[data-theme="dark"] .field div[style*="#047857"] { color: #c7d2fe !important; }

html[data-theme="dark"] .field div[style*="color:#64748b"],
html[data-theme="dark"] .field div[style*="color:#475569"],
html[data-theme="dark"] #hqNote { color: #a9b8d8 !important; }

html[data-theme="dark"] #todayBtn { color: #93c5fd !important; }
html[data-theme="dark"] #todayBtn:hover { color: #bfdbfe !important; }

/* health / fire / theft / PA result boxes: label text on dark card */
html[data-theme="dark"] .op-result td { color: var(--text); }
html[data-theme="dark"] .op-result td span[style*="#64748b"],
html[data-theme="dark"] .op-result div[style*="#64748b"] { color: #a9b8d8 !important; }

/* history product badge (light + dark) */
html[data-theme="dark"] .h-tag-product {
  background: #1e245c; color: #c7d2fe; border-color: #37417e;
}
"""

with io.open(U + 'styles-pro.css', 'a', encoding='utf-8') as f:
    f.write(DARK)
print('styles-pro.css      dark-mode contrast block appended (%d chars)' % len(DARK))
print('\nALL DONE')
