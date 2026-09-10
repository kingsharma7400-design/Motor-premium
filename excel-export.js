/* =========================================================
   OICL Premium Calculator V30.0 — EXCEL (.xlsx) EXPORT
   ---------------------------------------------------------
   Zero dependency. Asli .xlsx (OOXML) file banata hai —
   ZIP writer + sheet XML sab yahin likha hai, koi CDN nahi.
   Isliye offline bhi kaam karta hai.

   Public API:
     OICExcel.exportMotorQuote()
     OICExcel.exportHealthQuote()
     OICExcel.exportSimpleResult(elId, title, fileTag)
   ========================================================= */
(function () {
  'use strict';

  /* =======================================================
     1.  CRC32  (ZIP ke liye zaroori)
     ======================================================= */
  var CRC_TABLE = (function () {
    var t = new Int32Array(256), c, n, k;
    for (n = 0; n < 256; n++) {
      c = n;
      for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = -1;
    for (var i = 0; i < bytes.length; i++) {
      c = (c >>> 8) ^ CRC_TABLE[(c ^ bytes[i]) & 0xFF];
    }
    return (c ^ -1) >>> 0;
  }

  /* =======================================================
     2.  UTF-8 encode
     ======================================================= */
  function utf8(str) {
    if (window.TextEncoder) return new TextEncoder().encode(str);
    var s = unescape(encodeURIComponent(str));
    var a = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
    return a;
  }

  /* =======================================================
     3.  Minimal ZIP writer (STORE — no compression)
         .xlsx = ek zip hi hota hai
     ======================================================= */
  function zipFiles(files) {
    var chunks = [], central = [], offset = 0;

    function u16(v) { return [v & 0xFF, (v >>> 8) & 0xFF]; }
    function u32(v) { return [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]; }

    // DOS time/date
    var now = new Date();
    var dosTime = ((now.getHours() & 0x1F) << 11) | ((now.getMinutes() & 0x3F) << 5) | ((now.getSeconds() / 2) & 0x1F);
    var dosDate = (((now.getFullYear() - 1980) & 0x7F) << 9) | (((now.getMonth() + 1) & 0x0F) << 5) | (now.getDate() & 0x1F);

    files.forEach(function (f) {
      var nameB = utf8(f.name);
      var dataB = utf8(f.data);
      var crc = crc32(dataB);

      var local = [].concat(
        u32(0x04034b50), u16(20), u16(0x0800), u16(0),
        u16(dosTime), u16(dosDate),
        u32(crc), u32(dataB.length), u32(dataB.length),
        u16(nameB.length), u16(0)
      );
      chunks.push(new Uint8Array(local), nameB, dataB);

      central.push([].concat(
        u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0),
        u16(dosTime), u16(dosDate),
        u32(crc), u32(dataB.length), u32(dataB.length),
        u16(nameB.length), u16(0), u16(0), u16(0), u16(0),
        u32(0), u32(offset)
      ));
      central.push(nameB);

      offset += local.length + nameB.length + dataB.length;
    });

    var cdStart = offset, cdSize = 0, cdChunks = [];
    central.forEach(function (c) {
      var arr = (c instanceof Uint8Array) ? c : new Uint8Array(c);
      cdChunks.push(arr); cdSize += arr.length;
    });

    var end = new Uint8Array([].concat(
      u32(0x06054b50), u16(0), u16(0),
      u16(files.length), u16(files.length),
      u32(cdSize), u32(cdStart), u16(0)
    ));

    var all = chunks.concat(cdChunks, [end]);
    var total = all.reduce(function (n, a) { return n + a.length; }, 0);
    var out = new Uint8Array(total), p = 0;
    all.forEach(function (a) { out.set(a, p); p += a.length; });

    return new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  /* =======================================================
     4.  XML helpers
     ======================================================= */
  function xesc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  }
  function colName(n) {
    var s = '';
    while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = ((n - m) / 26) | 0; }
    return s;
  }

  /* =======================================================
     5.  Style catalogue
         s=0 normal · 1 title · 2 subtitle · 3 sectionHead
         4 label · 5 value · 6 money · 7 moneyBold
         8 tableHead · 9 grandLabel · 10 grandMoney
         11 muted · 12 metaLabel · 13 metaValue
     ======================================================= */
  var STYLES_XML =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<numFmts count="1">' +
        '<numFmt numFmtId="164" formatCode="&quot;\u20B9&quot;\\ #,##0.00"/>' +
      '</numFmts>' +
      '<fonts count="9">' +
        '<font><sz val="11"/><name val="Calibri"/><color rgb="FF1E293B"/></font>' +
        '<font><sz val="18"/><b/><name val="Calibri"/><color rgb="FFFFFFFF"/></font>' +
        '<font><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font>' +
        '<font><sz val="12"/><b/><name val="Calibri"/><color rgb="FF0A2540"/></font>' +
        '<font><sz val="11"/><b/><name val="Calibri"/><color rgb="FF334155"/></font>' +
        '<font><sz val="11"/><b/><name val="Calibri"/><color rgb="FFFFFFFF"/></font>' +
        '<font><sz val="12"/><b/><name val="Calibri"/><color rgb="FF065F46"/></font>' +
        '<font><sz val="10"/><i/><name val="Calibri"/><color rgb="FF64748B"/></font>' +
        '<font><sz val="11"/><b/><name val="Calibri"/><color rgb="FF0A2540"/></font>' +
      '</fonts>' +
      '<fills count="7">' +
        '<fill><patternFill patternType="none"/></fill>' +
        '<fill><patternFill patternType="gray125"/></fill>' +
        '<fill><patternFill patternType="solid"><fgColor rgb="FF0A2540"/><bgColor indexed="64"/></patternFill></fill>' +
        '<fill><patternFill patternType="solid"><fgColor rgb="FF1E40AF"/><bgColor indexed="64"/></patternFill></fill>' +
        '<fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>' +
        '<fill><patternFill patternType="solid"><fgColor rgb="FFD1FAE5"/><bgColor indexed="64"/></patternFill></fill>' +
        '<fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/><bgColor indexed="64"/></patternFill></fill>' +
      '</fills>' +
      '<borders count="3">' +
        '<border><left/><right/><top/><bottom/><diagonal/></border>' +
        '<border>' +
          '<left style="thin"><color rgb="FFCBD5E1"/></left>' +
          '<right style="thin"><color rgb="FFCBD5E1"/></right>' +
          '<top style="thin"><color rgb="FFCBD5E1"/></top>' +
          '<bottom style="thin"><color rgb="FFCBD5E1"/></bottom>' +
          '<diagonal/>' +
        '</border>' +
        '<border><left/><right/><top style="medium"><color rgb="FF0A2540"/></top><bottom/><diagonal/></border>' +
      '</borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="14">' +
        /* 0 normal      */ '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
        /* 1 title       */ '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
        /* 2 subtitle    */ '<xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
        /* 3 sectionHead */ '<xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>' +
        /* 4 label       */ '<xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
        /* 5 value       */ '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
        /* 6 money       */ '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>' +
        /* 7 moneyBold   */ '<xf numFmtId="164" fontId="8" fillId="6" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>' +
        /* 8 tableHead   */ '<xf numFmtId="0" fontId="5" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>' +
        /* 9 grandLabel  */ '<xf numFmtId="0" fontId="6" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>' +
        /*10 grandMoney  */ '<xf numFmtId="164" fontId="6" fillId="5" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>' +
        /*11 muted       */ '<xf numFmtId="0" fontId="7" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
        /*12 metaLabel   */ '<xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>' +
        /*13 metaValue   */ '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
      '</cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>';

  /* =======================================================
     6.  Sheet builder
         rows = [ {cells:[{v,s,t}], h?}, ... ]
     ======================================================= */
  function buildSheet(rows, opts) {
    opts = opts || {};
    var cols = opts.cols || [];
    var merges = opts.merges || [];

    var colXml = '';
    if (cols.length) {
      colXml = '<cols>' + cols.map(function (w, i) {
        return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>';
      }).join('') + '</cols>';
    }

    var body = rows.map(function (row, ri) {
      var r = ri + 1;
      var ht = row.h ? ' ht="' + row.h + '" customHeight="1"' : '';
      var cells = (row.cells || []).map(function (c, ci) {
        if (c == null) return '';
        var ref = colName(ci + 1) + r;
        var s = c.s ? ' s="' + c.s + '"' : '';
        if (c.v === '' || c.v == null) return '<c r="' + ref + '"' + s + '/>';
        if (c.t === 'n') return '<c r="' + ref + '"' + s + '><v>' + c.v + '</v></c>';
        return '<c r="' + ref + '"' + s + ' t="inlineStr"><is><t xml:space="preserve">' + xesc(c.v) + '</t></is></c>';
      }).join('');
      return '<row r="' + r + '"' + ht + '>' + cells + '</row>';
    }).join('');

    var mergeXml = merges.length
      ? '<mergeCells count="' + merges.length + '">' +
        merges.map(function (m) { return '<mergeCell ref="' + m + '"/>'; }).join('') +
        '</mergeCells>'
      : '';

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' +
      '<sheetViews><sheetView showGridLines="0" workbookViewId="0"/></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="16"/>' +
      colXml +
      '<sheetData>' + body + '</sheetData>' +
      mergeXml +
      '<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>' +
      '<pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/>' +
      '</worksheet>';
  }

  /* =======================================================
     7.  Workbook packer
     ======================================================= */
  function makeWorkbook(sheets) {
    var files = [];

    files.push({
      name: '[Content_Types].xml',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        sheets.map(function (s, i) {
          return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
        }).join('') +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>'
    });

    files.push({
      name: '_rels/.rels',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>'
    });

    files.push({
      name: 'xl/workbook.xml',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheets>' +
        sheets.map(function (s, i) {
          return '<sheet name="' + xesc(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>';
        }).join('') +
        '</sheets></workbook>'
    });

    files.push({
      name: 'xl/_rels/workbook.xml.rels',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        sheets.map(function (s, i) {
          return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>';
        }).join('') +
        '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>'
    });

    files.push({ name: 'xl/styles.xml', data: STYLES_XML });

    sheets.forEach(function (s, i) {
      files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: s.xml });
    });

    return zipFiles(files);
  }

  function saveBlob(blob, filename) {
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename); return;
    }
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 400);
  }

  /* =======================================================
     8.  DOM scraping helpers
     ======================================================= */
  function txt(el) {
    if (!el) return '';
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function byId(id) { return document.getElementById(id); }

  // "₹ 12,526.00" -> 12526  |  agar number na ho to null
  function toNum(s) {
    if (s == null) return null;
    var t = String(s).replace(/[\u20B9,\s]/g, '').replace(/[()]/g, '');
    if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
    var n = parseFloat(t);
    if (/^\(.*\)$/.test(String(s).trim()) || /^-/.test(String(s).trim())) n = -Math.abs(n);
    return n;
  }

  function moneyCell(raw, styleMoney, styleText) {
    var n = toNum(raw);
    if (n === null) return { v: raw || '—', s: styleText != null ? styleText : 5 };
    return { v: n, t: 'n', s: styleMoney };
  }

  function today() {
    var d = new Date(), p = function (x) { return (x < 10 ? '0' : '') + x; };
    return p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear();
  }
  function stamp() {
    var d = new Date(), p = function (x) { return (x < 10 ? '0' : '') + x; };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes());
  }

  /* Common header rows */
  function headerRows(rows, title, sub, qNo) {
    rows.push({ h: 30, cells: [{ v: 'ORIENTAL INSURANCE COMPANY LTD', s: 1 }, { s: 1 }, { s: 1 }, { s: 1 }] });
    rows.push({ h: 20, cells: [{ v: title, s: 2 }, { s: 2 }, { s: 2 }, { s: 2 }] });
    rows.push({ cells: [] });
    rows.push({
      cells: [
        { v: 'Quotation No.', s: 12 }, { v: qNo || '—', s: 13 },
        { v: 'Date', s: 12 }, { v: today(), s: 13 }
      ]
    });
    if (sub) {
      rows.push({ cells: [{ v: sub, s: 11 }] });
    }
    rows.push({ cells: [] });
    return rows;
  }

  function footerRows(rows) {
    rows.push({ cells: [] });
    rows.push({ cells: [{ v: 'This is a computer generated quotation and does not require a signature.', s: 11 }] });
    rows.push({ cells: [{ v: 'Premium is indicative and subject to underwriting approval. Rates as per IRDAI guidelines.', s: 11 }] });
    rows.push({ cells: [{ v: 'Generated: ' + today() + '  ·  Customized by Mohit Sharma', s: 15 }] });
    return rows;
  }

  /* Scrape a .breakdown-table into rows */
  function scrapeTable(tableEl, rows, heading) {
    if (!tableEl) return 0;
    var trs = tableEl.querySelectorAll('tbody tr');
    if (!trs.length) return 0;

    if (heading) {
      rows.push({ h: 20, cells: [{ v: heading, s: 3 }, { s: 3 }, { s: 3 }, { s: 3 }] });
    }
    rows.push({ cells: [{ v: 'Particulars', s: 8 }, { v: 'Amount', s: 8 }, { s: 8 }, { s: 8 }] });

    var n = 0;
    Array.prototype.forEach.call(trs, function (tr) {
      if (tr.offsetParent === null && tr.style.display === 'none') return;
      var tds = tr.querySelectorAll('td');
      if (tds.length < 2) return;

      var main = tds[0].querySelector('.label-main');
      var det = tds[0].querySelector('.label-detail');
      var label = main ? txt(main) : txt(tds[0]);
      if (det) label += '  (' + txt(det) + ')';
      if (!label) return;

      var isFinal = /final-row|bold|grand/.test(tr.className);
      rows.push({
        cells: [
          { v: label, s: isFinal ? 9 : 5 },
          moneyCell(txt(tds[1]), isFinal ? 10 : 6, isFinal ? 9 : 5),
          { s: 0 }, { s: 0 }
        ]
      });
      n++;
    });
    rows.push({ cells: [] });
    return n;
  }

  /* Scrape meta grid (.quote-meta div > strong + span) */
  function scrapeMeta(metaEl, rows, heading) {
    if (!metaEl) return;
    var items = metaEl.querySelectorAll('div');
    var pairs = [];
    Array.prototype.forEach.call(items, function (d) {
      if (d.style.display === 'none') return;
      var st = d.querySelector('strong'), sp = d.querySelector('span');
      if (!st || !sp) return;
      var v = txt(sp);
      if (!v || v === '—') return;
      pairs.push([txt(st), v]);
    });
    if (!pairs.length) return;

    rows.push({ h: 20, cells: [{ v: heading || 'Details', s: 3 }, { s: 3 }, { s: 3 }, { s: 3 }] });
    for (var i = 0; i < pairs.length; i += 2) {
      var a = pairs[i], b = pairs[i + 1];
      rows.push({
        cells: [
          { v: a[0], s: 12 }, { v: a[1], s: 13 },
          b ? { v: b[0], s: 12 } : { s: 0 },
          b ? { v: b[1], s: 13 } : { s: 0 }
        ]
      });
    }
    rows.push({ cells: [] });
  }

  /* =======================================================
     9.  MOTOR quotation → xlsx
     ======================================================= */
  function exportMotorQuote() {
    var doc = byId('quoteDoc');
    if (!doc) { toast('Quotation page nahi mila', 'warning'); return; }

    var qNo = txt(byId('quoteNumber')) || txt(byId('qNumber')) || '—';
    var rows = [];
    headerRows(rows, 'MOTOR INSURANCE QUOTATION', '', qNo);

    /* Summary strip */
    rows.push({ h: 20, cells: [{ v: 'Premium Summary', s: 3 }, { s: 3 }, { s: 3 }, { s: 3 }] });
    [
      ['Own Damage (OD)', txt(byId('qOdTotal2'))],
      ['Third Party (TP)', txt(byId('qTpTotal2'))],
      ['GST @ ' + (txt(byId('qGstPct2')) || '18') + '%', txt(byId('qGst2'))]
    ].forEach(function (p) {
      rows.push({ cells: [{ v: p[0], s: 4 }, moneyCell(p[1], 6), { s: 0 }, { s: 0 }] });
    });
    rows.push({
      cells: [
        { v: 'Net Premium Payable', s: 9 },
        moneyCell(txt(byId('qNet2')), 10, 9), { s: 0 }, { s: 0 }
      ]
    });
    rows.push({ cells: [] });

    /* Vehicle & policy details */
    scrapeMeta(doc.querySelector('.quote-meta'), rows, 'Vehicle & Policy Details');

    /* Chips (period / age) */
    var chips = [];
    Array.prototype.forEach.call(doc.querySelectorAll('.chip-row span'), function (c) {
      var t = txt(c); if (t) chips.push(t);
    });
    if (chips.length) {
      rows.push({ cells: [{ v: chips.join('   ·   '), s: 11 }] });
      rows.push({ cells: [] });
    }

    /* OD & TP tables */
    scrapeTable(byId('qOdTable'), rows, txt(byId('qOdHead')) || 'Own Damage Premium');
    scrapeTable(byId('qTpTable'), rows, txt(byId('qTpHead')) || 'Liability Premium (TP + PA)');

    /* Final totals table */
    var ft = doc.querySelector('table.final-table');
    if (ft) {
      rows.push({ h: 20, cells: [{ v: 'Premium Computation', s: 3 }, { s: 3 }, { s: 3 }, { s: 3 }] });
      Array.prototype.forEach.call(ft.querySelectorAll('tr'), function (tr) {
        if (tr.style.display === 'none') return;
        var tds = tr.querySelectorAll('td');
        if (tds.length < 2) return;
        var label = txt(tds[0]);
        if (!label) return;
        var grand = /grand/.test(tr.className);
        var bold = /bold|commission-row/.test(tr.className);
        rows.push({
          cells: [
            { v: label, s: grand ? 9 : (bold ? 4 : 5) },
            moneyCell(txt(tds[1]), grand ? 10 : (bold ? 7 : 6), grand ? 9 : 5),
            { s: 0 }, { s: 0 }
          ]
        });
      });
      rows.push({ cells: [] });
    }

    footerRows(rows);

    var xml = buildSheet(rows, {
      cols: [42, 20, 26, 22],
      merges: ['A1:D1', 'A2:D2']
    });
    var blob = makeWorkbook([{ name: 'Motor Quotation', xml: xml }]);
    saveBlob(blob, 'OIC_Motor_Quotation_' + (qNo !== '—' ? qNo : stamp()) + '.xlsx');
    toast('Excel file download ho gayi', 'success');
  }

  /* =======================================================
     10.  HEALTH / PA quotation → xlsx
     ======================================================= */
  function exportHealthQuote() {
    var doc = byId('hqDoc');
    if (!doc) { toast('Quotation page nahi mila', 'warning'); return; }

    var qNo = txt(byId('hqNumber')) || '—';
    var kind = txt(byId('hqKindLabel')) || 'Health Quotation';
    var rows = [];
    headerRows(rows, kind.toUpperCase(), '', qNo);

    /* Product line */
    rows.push({
      cells: [
        { v: 'Product', s: 12 }, { v: txt(byId('hqProduct')) || '—', s: 13 },
        { v: 'UIN', s: 12 }, { v: txt(byId('hqUin')) || '—', s: 13 }
      ]
    });
    rows.push({
      cells: [
        { v: 'Policy Start', s: 12 }, { v: txt(byId('hqStart')) || '—', s: 13 },
        { v: 'Policy End', s: 12 }, { v: txt(byId('hqEnd')) || '—', s: 13 }
      ]
    });
    rows.push({ cells: [] });

    /* Summary */
    rows.push({ h: 20, cells: [{ v: 'Premium Summary', s: 3 }, { s: 3 }, { s: 3 }, { s: 3 }] });
    rows.push({ cells: [{ v: 'Base Premium', s: 4 }, moneyCell(txt(byId('hqBaseTop')), 6), { s: 0 }, { s: 0 }] });
    rows.push({ cells: [{ v: 'GST', s: 4 }, { v: txt(byId('hqGstTop')) || 'NIL — Exempt', s: 5 }, { s: 0 }, { s: 0 }] });
    rows.push({
      cells: [
        { v: 'Net Premium Payable', s: 9 },
        moneyCell(txt(byId('hqPayableTop')), 10, 9), { s: 0 }, { s: 0 }
      ]
    });
    rows.push({ cells: [] });

    /* Meta grid */
    scrapeMeta(byId('hqMeta'), rows, 'Insured / Plan Details');

    /* Premium breakdown */
    scrapeTable(byId('hqTable'), rows, 'Premium Breakdown');

    /* Covers */
    var cw = byId('hqCoversWrap');
    if (cw && cw.style.display !== 'none') {
      var cov = byId('hqCovers');
      if (cov) {
        var ctrs = cov.querySelectorAll('tbody tr');
        if (ctrs.length) {
          rows.push({ h: 20, cells: [{ v: 'Coverage Details', s: 3 }, { s: 3 }, { s: 3 }, { s: 3 }] });
          rows.push({ cells: [{ v: 'Cover', s: 8 }, { v: 'Details', s: 8 }, { s: 8 }, { s: 8 }] });
          Array.prototype.forEach.call(ctrs, function (tr) {
            var tds = tr.querySelectorAll('td');
            if (tds.length < 2) return;
            rows.push({ cells: [{ v: txt(tds[0]), s: 4 }, { v: txt(tds[1]), s: 5 }, { s: 0 }, { s: 0 }] });
          });
          rows.push({ cells: [] });
        }
      }
    }

    /* Notes */
    var notes = byId('hqNotes');
    if (notes) {
      var lis = notes.querySelectorAll('li');
      if (lis.length) {
        rows.push({ h: 20, cells: [{ v: 'Important Notes', s: 3 }, { s: 3 }, { s: 3 }, { s: 3 }] });
        Array.prototype.forEach.call(lis, function (li) {
          rows.push({ cells: [{ v: '•  ' + txt(li), s: 11 }] });
        });
        rows.push({ cells: [] });
      }
    }

    footerRows(rows);

    var xml = buildSheet(rows, {
      cols: [42, 24, 26, 24],
      merges: ['A1:D1', 'A2:D2']
    });
    var safe = (kind.indexOf('PA') === 0) ? 'PA' : 'Health';
    var blob = makeWorkbook([{ name: safe + ' Quotation', xml: xml }]);
    saveBlob(blob, 'OIC_' + safe + '_Quotation_' + (qNo !== '—' ? qNo : stamp()) + '.xlsx');
    toast('Excel file download ho gayi', 'success');
  }

  /* =======================================================
     11.  FIRE / THEFT result box → xlsx
     ======================================================= */
  function exportSimpleResult(elId, title, fileTag) {
    var box = byId(elId);
    if (!box || box.style.display === 'none') {
      toast('Pehle premium calculate kijiye', 'warning'); return;
    }

    var rows = [];
    headerRows(rows, title.toUpperCase(), '', stamp());

    var head = box.querySelector('.op-result-head');
    if (head) {
      var tot = box.querySelector('.op-total');
      rows.push({ h: 20, cells: [{ v: 'Premium Summary', s: 3 }, { s: 3 }, { s: 3 }, { s: 3 }] });
      rows.push({
        cells: [
          { v: 'Total Premium Payable', s: 9 },
          moneyCell(txt(tot), 10, 9), { s: 0 }, { s: 0 }
        ]
      });
      rows.push({ cells: [] });
    }

    var tbl = box.querySelector('table');
    if (tbl) {
      rows.push({ h: 20, cells: [{ v: 'Premium Breakdown', s: 3 }, { s: 3 }, { s: 3 }, { s: 3 }] });
      rows.push({ cells: [{ v: 'Particulars', s: 8 }, { v: 'Amount', s: 8 }, { s: 8 }, { s: 8 }] });
      Array.prototype.forEach.call(tbl.querySelectorAll('tr'), function (tr) {
        var tds = tr.querySelectorAll('td');
        if (tds.length < 2) return;
        var label = txt(tds[0]);
        if (!label) return;
        var grand = /op-grand/.test(tr.className);
        var sub = /op-sub/.test(tr.className);
        rows.push({
          cells: [
            { v: label, s: grand ? 9 : (sub ? 4 : 5) },
            moneyCell(txt(tds[1]), grand ? 10 : 6, grand ? 9 : 5),
            { s: 0 }, { s: 0 }
          ]
        });
      });
      rows.push({ cells: [] });
    }

    var tax = box.parentNode ? box.parentNode.querySelector('.op-tax') : null;
    if (tax && txt(tax)) {
      rows.push({ cells: [{ v: txt(tax), s: 11 }] });
      rows.push({ cells: [] });
    }

    footerRows(rows);

    var xml = buildSheet(rows, { cols: [46, 22, 22, 20], merges: ['A1:D1', 'A2:D2'] });
    var blob = makeWorkbook([{ name: fileTag, xml: xml }]);
    saveBlob(blob, 'OIC_' + fileTag + '_' + stamp() + '.xlsx');
    toast('Excel file download ho gayi', 'success');
  }

  function toast(msg, kind) {
    if (window.proToast) window.proToast('📊 ' + msg, kind || 'success');
  }

  /* =======================================================
     12.  Buttons inject + wire
     ======================================================= */
  function mkBtn(id, label) {
    var b = document.createElement('button');
    b.id = id;
    b.type = 'button';
    b.className = 'btn-secondary btn-excel';
    b.innerHTML = label;
    return b;
  }

  function init() {
    /* --- Motor quotation toolbar --- */
    var mp = byId('printQuote');
    if (mp && !byId('xlMotor')) {
      var b1 = mkBtn('xlMotor', '📊 Download Excel');
      mp.parentNode.insertBefore(b1, mp.nextSibling);
      b1.addEventListener('click', exportMotorQuote);
    }

    /* --- Health / PA quotation toolbar --- */
    var hp = byId('hqPrint');
    if (hp && !byId('xlHealth')) {
      var b2 = mkBtn('xlHealth', '📊 Download Excel');
      hp.parentNode.insertBefore(b2, hp.nextSibling);
      b2.addEventListener('click', exportHealthQuote);
    }

    /* --- Fire --- */
    wireResultBtn('fireCalcBtn', 'fireResult', 'xlFire', 'Fire Insurance Quotation', 'Fire');
    /* --- Theft --- */
    wireResultBtn('theftCalcBtn', 'theftResult', 'xlTheft', 'Theft / Burglary Quotation', 'Theft');
  }

  function wireResultBtn(calcId, resultId, btnId, title, tag) {
    var calc = byId(calcId), res = byId(resultId);
    if (!calc || !res || byId(btnId)) return;

    var row = document.createElement('div');
    row.className = 'btn-row no-print';
    row.id = btnId + 'Row';
    row.style.marginTop = '12px';
    row.style.display = 'none';

    var b = mkBtn(btnId, '📊 Download Excel');
    row.appendChild(b);
    res.parentNode.insertBefore(row, res.nextSibling);

    b.addEventListener('click', function () { exportSimpleResult(resultId, title, tag); });

    // result dikhte hi button dikhao
    calc.addEventListener('click', function () {
      setTimeout(function () {
        row.style.display = (res.style.display !== 'none') ? 'flex' : 'none';
      }, 250);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.OICExcel = {
    exportMotorQuote: exportMotorQuote,
    exportHealthQuote: exportHealthQuote,
    exportSimpleResult: exportSimpleResult,
    _makeWorkbook: makeWorkbook,
    _buildSheet: buildSheet,
    _save: saveBlob
  };
})();
