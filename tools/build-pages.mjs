import { cp, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url), output = new URL('build/site/', root);
await mkdir(output, { recursive: true });
for (const name of ['web', 'simulator']) await cp(new URL('software/' + name, root), new URL(name, output), { recursive: true });
await writeFile(new URL('index.html', output), '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="refresh" content="0;url=./web/"><title>GAIA Rewinder — simulador</title><a href="./web/">Abrir demonstração SIMULATED</a></html>\n');
await writeFile(new URL('.nojekyll', output), '');
console.log('Static demo prepared (not deployed): ' + fileURLToPath(output));
