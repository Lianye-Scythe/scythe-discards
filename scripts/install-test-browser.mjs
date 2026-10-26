import { mkdir, writeFile, chmod, access } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { homedir } from 'node:os';
import { unzipSync } from 'fflate';

const root = resolve(import.meta.dirname, '..');
const platforms = { 'linux:x64': 'linux64', 'linux:arm64': 'linux-arm64', 'darwin:arm64': 'mac-arm64', 'darwin:x64': 'mac-x64', 'win32:x64': 'win64' };
const platform = platforms[`${process.platform}:${process.arch}`];
if (!platform) throw new Error('請使用 Playwright 支援的平台，或設定 DISCARDS_CHROME_EXECUTABLE。');
const response = await fetch('https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json');
if (!response.ok) throw new Error(`無法讀取 Chrome 穩定版清單：${response.status}`);
const stable = (await response.json()).channels.Stable;
const download = stable.downloads.chrome.find(item => item.platform === platform);
if (!download) throw new Error('這個平台沒有 Chrome for Testing 穩定版。');
const cache = resolve(homedir(), '.cache', 'chrome-discards', stable.version);
const folder = `chrome-${platform}`;
const binary = process.platform === 'win32' ? 'chrome.exe' : process.platform === 'darwin'
  ? 'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' : 'chrome';
const executablePath = resolve(cache, folder, binary);
let cached = false;
try { await access(executablePath); cached = true; } catch {}
if (!cached) {
  console.log(`Downloading latest stable Chrome for Testing ${stable.version} (${platform})`);
  const archive = await fetch(download.url);
  if (!archive.ok) throw new Error(`瀏覽器下載失敗：${archive.status}`);
  const entries = unzipSync(new Uint8Array(await archive.arrayBuffer()));
  for (const [name, data] of Object.entries(entries)) {
    if (name.endsWith('/')) continue;
    const path = resolve(cache, name);
    if (!path.startsWith(cache + sep)) throw new Error('瀏覽器封裝包含不支援的路徑。');
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
    if (process.platform !== 'win32' && /(?:chrome|chrome-wrapper|chrome_crashpad_handler|chrome_sandbox|Google Chrome for Testing|\.dylib)$/.test(name)) await chmod(path, 0o755);
  }
}
await mkdir(resolve(root, 'artifacts'), { recursive: true });
await writeFile(resolve(root, 'artifacts/stable-browser.json'), JSON.stringify({ version: stable.version, executablePath, source: download.url }, null, 2));
console.log(`Stable ${stable.version}: ${executablePath}`);
