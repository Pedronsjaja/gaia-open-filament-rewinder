import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createDemoServer } from '../tools/serve.mjs';

test('demo server exposes only read-only browser assets, not Git/BOM or arbitrary paths', async () => {
  const server = createDemoServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const html = await fetch(base + '/software/web/'); assert.equal(html.status, 200); assert.match(await html.text(), /SIMULATED/);
    const module = await fetch(base + '/software/simulator/math.mjs'); assert.equal(module.status, 200); assert.match(module.headers.get('content-type'), /javascript/);
    assert.match(html.headers.get('content-security-policy'), /connect-src 'none'/);
    for (const route of ['/.git/config', '/bom/bom.csv', '/software/web/%2e%2e/%2e%2e/AGENTS.md', '/software/web/%5c..%5cAGENTS.md']) assert.equal((await fetch(base + route)).status, 404);
    assert.equal((await fetch(base + '/software/web/', { method: 'POST' })).status, 405);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
