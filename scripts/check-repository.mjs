import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { posix, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const gitPaths = args => execFileSync('git', ['ls-files', '-z', ...args], { cwd: root, encoding: 'utf8' })
  .split('\0').filter(Boolean);
const files = gitPaths(['--cached']);
const tracked = new Set(files);
const problems = gitPaths(['--cached', '--ignored', '--exclude-standard'])
  .map(file => `Ignored file is tracked: ${file}`);
const documents = new Map(await Promise.all(files.filter(file => file.endsWith('.md'))
  .map(async file => [file, await readFile(resolve(root, file), 'utf8')])));

function headingIds(source) {
  const counts = new Map();
  const text = source.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
  return new Set([...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map(([, heading]) => {
    const slug = heading.replace(/<[^>]*>/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .toLowerCase().trim().replace(/[^\p{L}\p{N}\p{M}_\-\s]/gu, '').replace(/\s/g, '-');
    const count = counts.get(slug) ?? 0;
    counts.set(slug, count + 1);
    return count ? `${slug}-${count}` : slug;
  }));
}

let references = 0;
for (const [file, source] of documents) {
  const links = [...source.matchAll(/\]\(([^\s)]+)\)/g), ...source.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)];
  for (const [, reference] of links) {
    if (/^(?:[a-z][\w+.-]*:|\/\/)/i.test(reference)) continue;
    references++;
    let filename, fragment;
    try {
      [filename, fragment] = reference.split('#');
      filename = decodeURIComponent(filename.split('?')[0]);
      fragment = fragment ? decodeURIComponent(fragment) : '';
    } catch {
      problems.push(`${file}: invalid reference ${reference}`);
      continue;
    }
    const candidate = filename ? posix.normalize(filename.startsWith('/') ? filename.slice(1)
      : posix.join(posix.dirname(file), filename)) : file;
    const target = candidate.replace(/\/+$/, '') || '.';
    const directory = target === '.' || files.some(item => item.startsWith(target + '/'));
    if (!tracked.has(target) && !directory) {
      problems.push(`${file}: target is not tracked: ${reference}`);
    } else if (fragment && documents.has(target) && !headingIds(documents.get(target)).has(fragment)) {
      problems.push(`${file}: missing heading: ${reference}`);
    }
  }
}

if (problems.length) {
  console.error('Repository checks failed:\n' + problems.map(problem => '- ' + problem).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Repository checks passed: ${files.length} tracked files, ${documents.size} Markdown files, ${references} local references.`);
}
