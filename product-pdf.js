/*
 * Native quotation PDF helper for Fire and the extended-product workspace.
 * Reuses V31's existing one-page A4 renderer; no third-party calculator UI
 * or runtime is used.
 */
(function () {
  'use strict';

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const safeFilePart = value => String(value || 'Quote').replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || 'Quote';
  const dateStamp = () => {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  };
  const displayDate = () => {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  };

  function buildHTML(payload) {
    const rows = (payload.rows || []).map(row => `<tr><td>${esc(row[0])}</td><td>${esc(row[1] || '')}</td><td class="amount">${esc(row[2])}</td></tr>`).join('');
    const facts = (payload.facts || []).map(fact => `<div class="fact"><span>${esc(fact[0])}</span><b>${esc(fact[1])}</b></div>`).join('');
    const notes = (payload.notes || []).filter(Boolean).map(note => `<li>${esc(note)}</li>`).join('');
    return `<!doctype html><html><head><meta charset="UTF-8"><style>
      *{box-sizing:border-box}body{margin:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#102a43}
      .doc{width:794px;min-height:1000px;padding:30px 34px;background:#fff}.head{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #0a2540;padding-bottom:14px;margin-bottom:17px}.brand{font-size:17px;font-weight:800;letter-spacing:.2px;color:#0a2540}.sub{font-size:10px;color:#637381;margin-top:4px;line-height:1.4}.quote{font-size:10px;color:#637381;text-align:right;text-transform:uppercase;letter-spacing:.9px;font-weight:700}.quote b{display:block;font-size:18px;letter-spacing:0;color:#0a2540;margin-top:3px;text-transform:none}.summary{border-radius:9px;background:#0a2540;color:#fff;padding:13px 16px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center}.summary span{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#bdd5ec;font-weight:700}.summary b{display:block;margin-top:3px;font-size:25px;color:#fff}.summary .total{text-align:right}.summary .total b{color:#f7c948}.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:#f7fafc;border:1px solid #d9e2ec;border-radius:8px;padding:10px 12px;margin-bottom:15px}.fact{min-width:0}.fact span{display:block;font-size:8px;color:#627d98;font-weight:700;text-transform:uppercase;letter-spacing:.45px;margin-bottom:2px}.fact b{display:block;font-size:10px;line-height:1.3;color:#102a43;overflow-wrap:anywhere}.section{font-size:11px;color:#0a2540;font-weight:800;margin:14px 0 6px;padding-bottom:4px;border-bottom:1px solid #cbd5e1}table{border-collapse:collapse;width:100%;font-size:10px}th{background:#edf2f7;color:#486581;font-size:8px;text-transform:uppercase;letter-spacing:.45px;text-align:left;padding:6px 7px}td{border-bottom:1px solid #e6edf3;padding:6px 7px;vertical-align:top;line-height:1.35}.amount{text-align:right;white-space:nowrap;font-weight:700}tfoot td{background:#f0fdf4;border-top:2px solid #86efac;border-bottom:0;font-size:12px;font-weight:800;color:#065f46;padding:8px 7px}.notes{font-size:9px;line-height:1.45;color:#627d98;background:#f8fafc;border-radius:7px;padding:9px 13px;margin-top:14px}.notes ul{margin:0;padding-left:15px}.foot{margin-top:16px;padding-top:8px;border-top:1px solid #d9e2ec;color:#829ab1;font-size:8px;line-height:1.4}
    </style></head><body><main class="doc"><header class="head"><div><div class="brand">THE ORIENTAL INSURANCE COMPANY LTD.</div><div class="sub">OICL Premium Calculator V31 · Indicative Premium Quotation</div></div><div class="quote">Quotation date<b>${displayDate()}</b></div></header><section class="summary"><div><span>${esc(payload.product || 'Insurance premium')}</span><b>${esc(payload.title || 'Premium Quotation')}</b></div><div class="total"><span>Total payable</span><b>${esc(payload.total)}</b></div></section>${facts ? `<section class="facts">${facts}</section>` : ''}<div class="section">Premium calculation</div><table><thead><tr><th>Cover / calculation item</th><th>Rate / details</th><th class="amount">Premium</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="2">Total Premium Payable</td><td class="amount">${esc(payload.total)}</td></tr></tfoot></table>${notes ? `<section class="notes"><ul>${notes}</ul></section>` : ''}<footer class="foot">This quotation is generated for calculation support only. Final acceptance, rates, terms, deductibles and premium remain subject to the prevailing OICL circulars, proposal information, inspection and underwriting approval.<br>© 2026 Mohit Sharma. All Rights Reserved.</footer></main></body></html>`;
  }

  async function download(payload, button) {
    const api = window.OIC && window.OIC.pdf;
    if (!api || typeof api.renderHTMLToCanvas !== 'function' || typeof api.canvasToA4 !== 'function' || typeof api.download !== 'function') {
      throw new Error('The V31 PDF renderer is not available. Reload the calculator and try again.');
    }
    const original = button ? button.textContent : '';
    if (button) { button.disabled = true; button.textContent = '⏳ Preparing PDF…'; }
    try {
      const snap = await api.renderHTMLToCanvas(buildHTML(payload));
      const blob = api.canvasToA4(snap.canvas);
      const filename = `OIC_${safeFilePart(payload.filename || payload.product || 'Premium_Quotation')}_${dateStamp()}.pdf`;
      api.download(blob, filename);
      return filename;
    } finally {
      if (button) { button.disabled = false; button.textContent = original; }
    }
  }

  window.OIC_PRODUCT_PDF = { buildHTML, download };
}());
