import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const languages = process.argv.slice(2).length ? process.argv.slice(2) : ['en', 'zh-CN', 'zh-TW'];
for (const language of languages) {
  console.log('Testing Chrome UI language: ' + language);
  const result = spawnSync(process.execPath, ['tests/browser/run.mjs', '--ui', '--locale=' + language], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
