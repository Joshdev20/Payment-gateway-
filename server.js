#!/usr/bin/env node
/**
 * Minimal static file server for the PayoutFlow demo.
 * No dependencies. Serves ./public and nothing else.
 */
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, 'public');
const PORT = Number(process.env.PORT || 12000);
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';

  // Resolve inside ROOT only — reject traversal.
  const filePath = normalize(join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden');

  let stat;
  try {
    stat = statSync(filePath);
  } catch {
    return send(res, 404, 'Not found', { 'content-type': 'text/plain; charset=utf-8' });
  }

  const target = stat.isDirectory() ? join(filePath, 'index.html') : filePath;
  try {
    statSync(target);
  } catch {
    return send(res, 404, 'Not found', { 'content-type': 'text/plain; charset=utf-8' });
  }

  const type = MIME[extname(target).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, {
    ...SECURITY_HEADERS,
    'content-type': type,
    // Revalidate every request so edits are picked up immediately.
    'cache-control': 'no-cache',
    etag: `W/"${stat.size}-${stat.mtimeMs}"`,
  });
  createReadStream(target).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`PayoutFlow demo running at http://${HOST}:${PORT}`);
});
