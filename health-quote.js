/* ============================================================
   health-quote.js  —  OICL Premium Calculator V30.0
   Health products ke liye Motor jaisa Quotation page.

   Har health calculator (Youth Eco Care, OSSP, HFF, Super Top-Up,
   Generic Mediclaim) calculate hone par apna result yahan register
   karta hai. Phir "📄 Generate Quotation →" button se wahi
   Motor wala A4 quotation layout khulta hai — brief details,
   premium summary, breakdown table aur 1-page PDF download.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var lastHealth = null;   /* { product, uin, meta[], rows[], net, notes } */

  function money(x) {
    return '₹ ' + Math.round(x).toLocaleString('en-IN');
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function today() {
    if (window.OIC && window.OIC.pdf && window.OIC.pdf.today) return window.OIC.pdf.today();
    var d = new Date(), p = function (x) { return (x < 10 ? '0' : '') + x; };
    return p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear();
  }
  function addYear(dmy) {
    var m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dmy || '');
    if (!m) return '—';
    var d = new Date(+m[3] + 1, +m[2] - 1, +m[1]);
    d.setDate(d.getDate() - 1);
    var p = function (x) { return (x < 10 ? '0' : '') + x; };
    return p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear();
  }

  /* ============================================================
     Calculators yahan apna result register karte hain
     ============================================================ */
  window.registerHealthQuote = function (data) {
    lastHealth = data;
    var btn = $('healthGotoQuote');
    if (btn) btn.style.display = 'block';
    if (window.OIC) window.OIC.lastHealth = data;
    /* Quotation banate hi History me save (Motor ke saath ek hi number sequence). */
    try { saveHealthToHistory(data); } catch (e) { if (window.console) console.warn(e); }
  };

  function kindOfQuote(d) {
    if (d.backTab === 'pa') return 'pa';
    var p = String(d.product || '');
    if (/Youth Eco/i.test(p))      return 'yec';
    if (/Sampoorna|Swasthya Suraksha/i.test(p)) return 'ossp';
    if (/Family Floater/i.test(p)) return 'hff';
    if (/Top-?Up/i.test(p))        return 'stu';
    return 'med';
  }

  /* Plan/table/grade line for the History card: prefer an explicit "Table …" /
     "Plan" entry, else the first meta row. */
  function planLabel(d) {
    var found = '';
    (d.covers || []).concat(d.meta || []).forEach(function (m) {
      var k = String((m && (m[0] !== undefined ? m[0] : m.k)) || '');
      var v = String((m && (m[1] !== undefined ? m[1] : m.v)) || '');
      if (!found && (k === 'Plan' || /Table\s+(I{1,3}|II)/i.test(v))) found = v;
    });
    if (found) return found;
    var m0 = (d.meta || [])[0];
    return m0 ? String(m0[1] !== undefined ? m0[1] : m0.v || '') : '';
  }

  function saveHealthToHistory(d) {
    if (!d || !window.OIC || !window.OIC.history || !window.OIC.history.saveOther) return;
    var kind = kindOfQuote(d);
    var cust = '';
    (d.meta || []).forEach(function (m) {
      var k = String((m && (m[0] !== undefined ? m[0] : m.k)) || '');
      var v = (m && (m[1] !== undefined ? m[1] : m.v));
      if (!cust && /name|life assured|member|insured/i.test(k)) cust = String(v || '');
    });
    var si = 0;
    (d.meta || []).forEach(function (m) {
      var k = String((m && (m[0] !== undefined ? m[0] : m.k)) || '');
      if (!si && /sum insured|capital|deductible/i.test(k)) {
        var num = String(m[1] !== undefined ? m[1] : m.v).replace(/[^\d]/g, '');
        si = parseInt(num, 10) || 0;
      }
    });
    var paneOf = { pa: 'op-pa', yec: 'op-yec', ossp: 'op-ossp', hff: 'op-hff', stu: 'op-stu', med: 'op-med' };
    window.OIC.history.saveOther({
      kind: kind,
      pane: paneOf[kind],
      product: d.product || 'Health',
      customer: cust,
      net: d.net, total: d.net,
      sumInsured: si,
      gstLabel: 'GST Exempt',
      policyLabel: planLabel(d),
      uin: d.uin,
      note: d.notes
    });
  }

  /* ============================================================
     Quotation number (motor ke saath shared sequence)
     ============================================================ */
  function nextQuoteNo() {
    try {
      var k = 'oic_quote_seq';
      var cur = parseInt(localStorage.getItem(k) || '0', 10) || 0;
      cur += 1;
      localStorage.setItem(k, String(cur));
      return String(cur).padStart(4, '0');
    } catch (e) {
      return String(Math.floor(Math.random() * 9000) + 1000);
    }
  }

  /* ============================================================
     Quotation render
     ============================================================ */
  function renderHealthQuote() {
    if (!lastHealth) return;
    var d = lastHealth;

    var qn = $('hqNumber');
    if (qn && (!qn.textContent || qn.textContent === '0000')) qn.textContent = nextQuoteNo();

    var t = today();
    if ($('hqDateTop')) $('hqDateTop').textContent = t;
    if ($('hqDate')) $('hqDate').textContent = t;
    if ($('hqGeneratedAt')) $('hqGeneratedAt').textContent = t;
    if ($('hqKindLabel')) {
      $('hqKindLabel').textContent = (d.backTab === 'pa') ? 'PA Quotation' : 'Health Quotation';
    }
    if ($('hqProduct')) $('hqProduct').textContent = d.product || '—';
    if ($('hqUin')) $('hqUin').textContent = d.uin || '—';
    if ($('hqStart')) $('hqStart').textContent = t;
    if ($('hqEnd')) $('hqEnd').textContent = addYear(t);

    /* ---- Premium summary strip ---- */
    if ($('hqNetTop')) $('hqNetTop').textContent = money(d.net);
    if ($('hqGstTop')) $('hqGstTop').textContent = 'NIL — Exempt';
    if ($('hqBaseTop')) $('hqBaseTop').textContent = money(d.base != null ? d.base : d.net);
    if ($('hqPayableTop')) $('hqPayableTop').textContent = money(d.net);

    /* ---- Brief details grid ---- */
    var meta = $('hqMeta');
    if (meta) {
      meta.innerHTML = (d.meta || []).map(function (m) {
        var col = m.hl ? ' style="color:#047857;font-weight:700;"' : '';
        return '<div><strong>' + esc(m[0] !== undefined ? m[0] : m.k) + '</strong> <span' + col + '>'
             + esc(m[1] !== undefined ? m[1] : m.v) + '</span></div>';
      }).join('');
    }

    /* ---- Breakdown table ---- */
    var tb = document.querySelector('#hqTable tbody');
    if (tb) {
      tb.innerHTML = (d.rows || []).map(function (r) {
        var val = (typeof r[1] === 'number') ? money(r[1]) : esc(r[1]);
        var cls = /^(Base|Gross|Premium)/i.test(r[0]) ? ' class="final-row"' : '';
        return '<tr' + cls + '><td>' + esc(r[0]) + '</td><td class="right">' + val + '</td></tr>';
      }).join('');
    }

    if ($('hqNet')) $('hqNet').textContent = money(d.net);
    if ($('hqTotal')) $('hqTotal').textContent = money(d.net);

    /* ---- Covers table (optional) ---- */
    var cb = document.querySelector('#hqCovers tbody');
    var cw = $('hqCoversWrap');
    if (cb && cw) {
      if (d.covers && d.covers.length) {
        cb.innerHTML = d.covers.map(function (r) {
          return '<tr><td>' + esc(r[0]) + '</td><td class="right">' + esc(r[1]) + '</td></tr>';
        }).join('');
        cw.style.display = 'block';
      } else cw.style.display = 'none';
    }

    if ($('hqNote')) $('hqNote').innerHTML = d.notes || '';
  }

  /* ============================================================
     PDF (Motor ka same 1-page A4 engine reuse)
     ============================================================ */
  function buildHTML() {
    var d = lastHealth;
    var qNo = $('hqNumber') ? $('hqNumber').textContent : '0000';
    var t = today();
    var css = (window.OIC && window.OIC.pdf && window.OIC.pdf.css) ? window.OIC.pdf.css() : '';
    var isPA = (d.backTab === 'pa');

    var rs = function (x) { return 'Rs. ' + Math.round(x).toLocaleString('en-IN'); };

    /* Motor PDF ki tarah 5-column meta grid */
    var metaHtml = (d.meta || []).map(function (m) {
      return '<div><strong>' + esc(m[0]) + '</strong><span>' + esc(m[1]) + '</span></div>';
    }).join('');

    /* Breakdown — table.bt (Motor wali class) */
    var rowsHtml = (d.rows || []).map(function (r) {
      var num = (typeof r[1] === 'number');
      var val = num ? rs(r[1]) : esc(r[1]);
      var cls = /^(Base|Gross|Premium|Total)/i.test(r[0]) ? ' class="final-row"' : '';
      var muted = (!num && /^(N\/A|Not opted|—|-)/i.test(String(r[1]))) ? ' class="muted"' : '';
      return '<tr' + (cls || muted) + '><td>' + esc(r[0]) + '</td>'
           + '<td class="right">' + val + '</td></tr>';
    }).join('');

    var coversHtml = (d.covers || []).slice(0, 16).map(function (r) {
      return '<tr><td>' + esc(r[0]) + '</td><td class="right">' + esc(r[1]) + '</td></tr>';
    }).join('');

    var base = (d.base != null ? d.base : d.net);
    var addons = Math.max(0, d.net - base);

    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' + css
      + '.quote-meta{grid-template-columns:repeat(4,1fr);}'
      + '.two-col{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:start;}'
      + '</style></head><body>'
      + '<div class="quote-doc" id="pdfRoot">'
      + '<div class="doc-watermark" aria-hidden="true"></div>'

      /* ---- Header ---- */
      + '<div class="quote-head"><div>'
      + '<div class="logo-circle">OIC</div>'
      + '<div class="brand-title">ORIENTAL INSURANCE COMPANY LTD</div></div>'
      + '<div class="quote-no"><div class="quote-no-label">'
      + (isPA ? 'PA Quotation' : 'Health Quotation') + '</div>'
      + '<div class="quote-num">' + esc(qNo) + '</div>'
      + '<div style="font-size:9px;color:#64748b;margin-top:3px;">Date: <b style="color:#0a2540;">'
      + esc(t) + '</b></div></div></div>'

      /* ---- Product bar ---- */
      + '<div style="background:#0a2540;color:#fff;padding:7px 12px;border-radius:8px;'
      + 'margin-bottom:8px;font-size:12px;font-weight:800;display:flex;'
      + 'justify-content:space-between;align-items:center;gap:10px;">'
      + '<span>' + esc(d.product) + '</span>'
      + '<span style="font-weight:400;font-size:9px;opacity:.85;white-space:nowrap;">UIN: '
      + esc(d.uin || '—') + '</span></div>'

      /* ---- Premium summary ---- */
      + '<div class="quote-summary"><div class="qs-title">Premium Summary</div><div class="qs-grid">'
      + '<div class="qs-item"><span>Base Premium</span><b>' + rs(base) + '</b></div>'
      + '<div class="qs-item"><span>Loadings / Add-ons</span><b>' + rs(addons) + '</b></div>'
      + '<div class="qs-item"><span>GST</span><b>NIL</b></div>'
      + '<div class="qs-item qs-grand"><span>Net Payable</span><b>' + rs(d.net) + '</b></div>'
      + '</div></div>'

      /* ---- Brief details ---- */
      + (metaHtml ? '<div class="quote-meta">' + metaHtml + '</div>' : '')

      /* ---- Breakdown + Covers side by side (Motor jaisa compact) ---- */
      + (coversHtml
        ? '<div class="two-col">'
          + '<div><h3 class="sec">Premium Breakdown</h3>'
          + '<table class="bt"><thead><tr><th>Particulars</th>'
          + '<th class="right">Amount</th></tr></thead><tbody>' + rowsHtml + '</tbody></table></div>'
          + '<div><h3 class="sec">Key Covers &amp; Sub-limits</h3>'
          + '<table class="bt"><tbody>' + coversHtml + '</tbody></table></div>'
          + '</div>'
        : '<h3 class="sec">Premium Breakdown</h3>'
          + '<table class="bt"><thead><tr><th>Particulars</th>'
          + '<th class="right">Amount</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>')

      /* ---- Totals ---- */
      + '<table class="ft"><tbody>'
      + '<tr class="bold"><td>Total Premium</td><td class="right num">' + rs(d.net) + '</td></tr>'
      + '<tr><td>GST (' + (isPA ? 'Personal Accident' : 'Health insurance') + ')</td>'
      + '<td class="right num">NIL - Exempt</td></tr>'
      + '<tr class="grand"><td>Net Premium Payable</td><td class="right num">' + rs(d.net) + '</td></tr>'
      + '</tbody></table>'

      /* ---- Signatures ---- */
      + '<div class="quote-foot">'
      + '<div class="sig-block"><div>Signature</div><div class="sig-line"></div></div>'
      + '<div class="sig-block"><div>Name of Agent / Agency Code</div><div class="sig-line"></div></div>'
      + '<div class="sig-block"><div>Branch / Divisional Manager</div><div class="sig-line"></div></div>'
      + '</div>'

      + '<div class="disclaimer">Disclaimer: Premium computed as per official OICL premium chart for '
      + esc(d.product) + '. Final premium is subject to underwriting, medical examination (if applicable) '
      + 'and terms in force on the date of policy issuance. '
      + (isPA ? 'Personal Accident' : 'Health insurance') + ' premium is exempt from GST.<br>'
      + '<strong class="generated-by">Generated: ' + esc(t) + ' &middot; Customized by Mohit Sharma</strong></div>'
      + '</div></body></html>';
  }

  async function downloadPDF() {
    if (!lastHealth) {
      if (window.proToast) window.proToast('Pehle premium calculate karein', 'warning');
      return;
    }
    var P = window.OIC && window.OIC.pdf;
    if (!P) { window.print(); return; }
    try {
      var snap = await P.renderHTMLToCanvas(buildHTML());
      var blob = P.canvasToA4(snap.canvas);
      var qNo = ($('hqNumber') ? $('hqNumber').textContent : '0000').replace(/[^\w-]/g, '');
      P.download(blob, 'OIC_Health_Quotation_' + qNo + '.pdf');
    } catch (e) {
      console.error('Health PDF failed', e);
      if (window.proToast) window.proToast('PDF ban nahi paya — internet on karke try karein', 'error');
    }
  }

  /* ============================================================
     Navigation
     ============================================================ */
  function showTab(id) {
    Array.prototype.forEach.call(document.querySelectorAll('.nav-item'), function (x) { x.classList.remove('active'); });
    Array.prototype.forEach.call(document.querySelectorAll('.tab-content'), function (x) { x.classList.remove('active'); });
    var t = $(id);
    if (t) t.classList.add('active');
    if (window.setPageTitle) window.setPageTitle(String(id).replace(/^tab-/, ''));
  }

  var originTab = 'med';   /* quotation se wapas kahan jana hai */

  function openQuote() {
    if (!lastHealth) {
      if (window.proToast) window.proToast('Pehle premium calculate karein', 'warning');
      return;
    }
    originTab = (lastHealth && lastHealth.backTab) ? lastHealth.backTab : 'med';
    renderHealthQuote();
    showTab('tab-hquote');
    /* PA ka quotation hai to page heading bhi PA dikhaye */
    if (originTab === 'pa') {
      var m = $('pageTitleMain'), sb = $('pageTitleSub');
      if (m)  m.textContent  = 'PA Quotation';
      if (sb) sb.textContent = 'Personal Accident Insurance Quotation';
      document.title = 'PA Quotation · Oriental Insurance';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function sharePDF() {
    if (!lastHealth) {
      if (window.proToast) window.proToast('Pehle premium calculate karein', 'warning');
      return;
    }
    renderHealthQuote();
    var P = window.OIC && window.OIC.pdf;
    if (!P) return;
    var qNo = ($('hqNumber') ? $('hqNumber').textContent : '0000').replace(/[^\w-]/g, '');
    var filename = 'OIC_' + (originTab === 'pa' ? 'PA' : 'Health') + '_Quotation_' + qNo + '.pdf';
    try {
      var snap = await P.renderHTMLToCanvas(buildHTML());
      var blob = P.canvasToA4(snap.canvas);
      var file = new File([blob], filename, { type: 'application/pdf', lastModified: Date.now() });
      var shared = false;
      if (navigator.canShare) {
        try {
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file] });
            shared = true;
          }
        } catch (err) {
          if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError')) shared = true;
        }
      }
      if (!shared) {
        P.download(blob, filename);
        if (window.proToast) window.proToast('PDF download ho gaya — WhatsApp/Email se share karein', 'success');
      }
    } catch (e) {
      console.error('Health share failed', e);
      if (window.proToast) window.proToast('PDF ban nahi paya', 'error');
    }
  }

  function init() {
    var go = $('healthGotoQuote');
    if (go) go.addEventListener('click', openQuote);

    var back = $('hqBack');
    if (back) back.addEventListener('click', function () {
      showTab('tab-' + originTab);
      var b = document.querySelector('.nav-item[data-tab="' + originTab + '"]');
      if (b) b.classList.add('active');
      if (window.setPageTitle) window.setPageTitle(originTab);
    });

    var dl = $('hqPrint');
    if (dl) dl.addEventListener('click', downloadPDF);
    var sb = $('hqShare');
    if (sb) sb.addEventListener('click', sharePDF);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.HealthQuote = { render: renderHealthQuote, pdf: downloadPDF, open: openQuote, share: sharePDF };
})();
