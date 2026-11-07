import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function createDemoServer(root = fileURLToPath(new URL('../', import.meta.url))) {
  const types = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
  return http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    response.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end('Read-only demonstration'); return; }
    try {
      const route = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (route === '/') { response.writeHead(302, { Location: '/software/web/' }); response.end(); return; }
      if (!route.startsWith('/software/web/') && !route.startsWith('/software/simulator/')) throw new Error('Not public');
      if (route.includes('\\') || route.includes('\0') || route.split('/').some(part => part.startsWith('.'))) throw new Error('Invalid route');
      const relative = route.endsWith('/') ? route + 'index.html' : route;
      const resolved = path.resolve(root, '.' + relative), prefix = path.resolve(root) + path.sep;
      if (!resolved.startsWith(prefix) || !(await stat(resolved)).isFile()) throw new Error('Not a file');
      const type = types[path.extname(resolved)]; if (!type) throw new Error('Not an allowed asset');
      const data = await readFile(resolved); response.writeHead(200, { 'Content-Type': type, 'Content-Length': data.length });
      response.end(request.method === 'HEAD' ? undefined : data);
    } catch { response.writeHead(404); response.end('Not found'); }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new RangeError('PORT must be 1..65535.');
  const server = createDemoServer(); server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`SIMULATED only: http://127.0.0.1:${port}/software/web/`));
}
