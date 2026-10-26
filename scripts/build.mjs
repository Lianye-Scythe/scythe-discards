import { readFile, writeFile, mkdir, rm, copyFile, stat, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { crc32 } from 'node:zlib';
import { build } from 'esbuild';
import { Resvg } from '@resvg/resvg-js';
import { compileCatalog } from '../src/i18n/catalog.ts';
import { PRODUCT_NAME } from '../src/brand.ts';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, 'ui'), { recursive: true });
await mkdir(resolve(dist, 'icons'), { recursive: true });
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'));
const notices = [await readFile(resolve(root, 'THIRD_PARTY_NOTICES.md'), 'utf8')];
for (const [directory, info] of Object.entries(lock.packages)) {
  if (!directory || info.dev) continue;
  const location = resolve(root, directory);
  const dependency = JSON.parse(await readFile(resolve(location, 'package.json'), 'utf8'));
  const licenses = (await readdir(location, { withFileTypes: true }))
    .filter(entry => entry.isFile() && /^licen[cs]e(?:[-.].*)?$/i.test(entry.name));
  if (!licenses.length) throw new Error('Missing license for ' + dependency.name);
  notices.push('\n\n---\n\n' + dependency.name + '@' + dependency.version + '\n');
  for (const license of licenses) notices.push(await readFile(resolve(location, license.name), 'utf8'));
}
await writeFile(resolve(dist, 'THIRD_PARTY_NOTICES.txt'), notices.join('\n'));
const manifest = JSON.parse(await readFile(resolve(root, 'public/manifest.json'), 'utf8'));
await copyFile(resolve(root, 'LICENSE'), resolve(dist, 'LICENSE'));
manifest.version = pkg.version;
manifest.name = '__MSG_extensionName__';
manifest.short_name = PRODUCT_NAME;
manifest.description = '__MSG_extensionDescription__';
manifest.default_locale = 'en';
manifest.action.default_title = PRODUCT_NAME;
await writeFile(resolve(dist, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
for (const locale of ['en', 'zh_TW', 'zh_CN']) {
  const source = JSON.parse(await readFile(resolve(root, 'src/i18n', locale + '.json'), 'utf8'));
  const catalog = compileCatalog({ ...source, extensionName: PRODUCT_NAME + ' — ' + source.extensionNameSuffix });
  await mkdir(resolve(dist, '_locales', locale), { recursive: true });
  await writeFile(resolve(dist, '_locales', locale, 'messages.json'), JSON.stringify(catalog, null, 2) + '\n');
}
for (const name of ['options.html', 'popup.html']) await copyFile(resolve(root, 'src/ui', name), resolve(dist, 'ui', name));
await build({
  absWorkingDir: root,
  entryPoints: { background: 'src/background.ts', 'ui/options': 'src/ui/options.tsx', 'ui/popup': 'src/ui/popup.tsx', 'ui/theme': 'src/ui/theme.ts' },
  outdir: dist, bundle: true, format: 'iife', platform: 'browser', target: ['chrome120'], minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  legalComments: 'linked', logLevel: 'warning',
});
const css = spawnSync(process.execPath, [resolve(root, 'node_modules/@tailwindcss/cli/dist/index.mjs'),
  '-i', resolve(root, 'src/ui/styles.css'), '-o', resolve(dist, 'ui/styles.css'), '--minify'], { cwd: root, stdio: 'inherit' });
if (css.status !== 0) process.exit(css.status ?? 1);
const sourceIcon = await readFile(resolve(root, 'public/icon.png'));
const provenance = JSON.parse(await readFile(resolve(root, 'public/icon.png.json'), 'utf8'));
const iconWidth = sourceIcon.readUInt32BE(16), iconHeight = sourceIcon.readUInt32BE(20);
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + iconWidth + '" height="' + iconHeight + '" viewBox="0 0 ' + iconWidth + ' ' + iconHeight + '"><image href="data:image/png;base64,' + sourceIcon.toString('base64') + '" width="' + iconWidth + '" height="' + iconHeight + '"/></svg>';
for (const size of [16, 32, 48, 128]) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  const text = Buffer.from('impeccable:prompt\0' + provenance.prompt);
  const type = Buffer.from('tEXt');
  const chunk = Buffer.alloc(12 + text.length);
  chunk.writeUInt32BE(text.length, 0); type.copy(chunk, 4); text.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([type, text])), chunk.length - 4);
  await writeFile(resolve(dist, `icons/${size}.png`), Buffer.concat([png.subarray(0, -12), chunk, png.subarray(-12)]));
}
for (const file of ['background.js', 'ui/options.js', 'ui/popup.js', 'ui/styles.css']) {
  console.log(`${file}: ${((await stat(resolve(dist, file))).size / 1024).toFixed(1)} KiB`);
}
console.log(`Built ${PRODUCT_NAME} ${pkg.version} → dist/`);
