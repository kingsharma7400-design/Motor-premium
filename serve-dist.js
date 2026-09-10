/* Tiny static server for /home/user/dist so the zips get a real download link. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = '/home/user/dist', PORT = 8099;
const MIME = { '.zip': 'application/zip', '.html': 'text/html; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, path.normalize(p).replace(/^(\.\.[\/\\])+/, ''));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    const list = fs.readdirSync(ROOT).map(f => `<li><a href="/${f}">${f}</a></li>`).join('');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<h3>Not found</h3><ul>${list}</ul>`);
  }
  const ext = path.extname(file), buf = fs.readFileSync(file);
  const head = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': buf.length };
  if (ext === '.zip') head['Content-Disposition'] = `attachment; filename="${path.basename(file)}"`;
  res.writeHead(200, head); res.end(buf);
}).listen(PORT, '0.0.0.0', () => console.log('serving ' + ROOT + ' on 0.0.0.0:' + PORT));
