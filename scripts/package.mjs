import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { zipSync } from 'fflate';

const root = resolve(import.meta.dirname, '..');
const files = {};
async function collect(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) await collect(join(directory, entry.name), name + '/');
    else files[name] = new Uint8Array(await readFile(join(directory, entry.name)));
  }
}
await collect(resolve(root, 'dist'));
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
await mkdir(resolve(root, 'artifacts'), { recursive: true });
const path = resolve(root, `artifacts/${pkg.name}-${pkg.version}.zip`);
const archive = zipSync(files, { level: 9 });
await writeFile(path, archive);
const checksum = createHash('sha256').update(archive).digest('hex');
await writeFile(resolve(root, 'artifacts/SHA256SUMS'), `${checksum}  ${pkg.name}-${pkg.version}.zip\n`);
console.log(path);
