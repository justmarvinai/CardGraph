/**
 * Serves the static export the way a static host does, so the preview and
 * end-to-end scripts run against exactly what gets deployed.
 *
 * Usage: pnpm build && pnpm serve [port]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = process.argv[2];
const PORT = Number(process.argv[3] ?? 3300);
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2',
  '.txt': 'text/plain', '.ico': 'image/x-icon', '.map': 'application/json',
};

const exists = async (p) => { try { return (await stat(p)).isFile(); } catch { return false; } };

createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let path = join(ROOT, normalize(url).replace(/^(\.\.[/\\])+/, ''));
  // Mirror how a static host resolves a Next.js export.
  if (!(await exists(path))) {
    if (await exists(`${path}.html`)) path = `${path}.html`;
    else if (await exists(join(path, 'index.html'))) path = join(path, 'index.html');
    else if (await exists(join(ROOT, '404.html'))) { res.writeHead(404); path = join(ROOT, '404.html'); }
    else { res.writeHead(404).end('not found'); return; }
  }
  try {
    const body = await readFile(path);
    res.writeHead(res.statusCode === 404 ? 404 : 200, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(500).end('error'); }
}).listen(PORT, () => console.log('static server on', PORT));
