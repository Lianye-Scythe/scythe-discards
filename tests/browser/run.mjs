import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
import { runUiRegressions } from './ui-regressions.mjs';

const root = resolve(import.meta.dirname, '../..');
const artifacts = resolve(root, 'artifacts');
const language = process.argv.find(arg => arg.startsWith('--locale='))?.slice(9) || 'zh-TW';
const localeSuffix = language.replaceAll('-', '_');
const viaCDP = process.env.DISCARDS_LOAD_VIA_CDP === '1';
await mkdir(artifacts, { recursive: true });
const server = createServer((request, response) => {
  const path = new URL(request.url, 'http://local.test').pathname;
  const names = { '/research': '研究資料 · Chrome 記憶體管理', '/reading': '稍後閱讀 · 網頁效能筆記',
    '/music': '音訊播放測試', '/protected': '工作文件 · 保護測試', '/notes': '專案筆記 · 分頁生命週期' };
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  response.end(`<!doctype html><html lang="zh-Hant"><head><title>${names[path] || '測試分頁'}</title><link rel="icon" href="data:,"></head><body><h1>${names[path] || '測試分頁'}</h1><p>Discards 本機功能測試頁面</p><button id="play">播放測試音</button><script>document.querySelector('#play').addEventListener('click',async()=>{const context=new AudioContext();await context.resume();const oscillator=context.createOscillator();const gain=context.createGain();gain.gain.value=.015;oscillator.connect(gain);gain.connect(context.destination);oscillator.start();window.audioContext=context;});</script></body></html>`);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const profile = await mkdtemp(join(tmpdir(), 'discards-test-'));
let executablePath = process.env.DISCARDS_CHROME_EXECUTABLE;
if (!executablePath) {
  try { executablePath = JSON.parse(await readFile(resolve(artifacts, 'stable-browser.json'), 'utf8')).executablePath; } catch {}
}
let context;
try {
context = await chromium.launchPersistentContext(profile, {
  channel: 'chromium', headless: true,
  ignoreDefaultArgs: ['--mute-audio', ...(viaCDP ? ['--disable-extensions'] : [])],
  ...(executablePath ? { executablePath } : {}),
  env: { ...process.env, LANGUAGE: language.replaceAll('-', '_') },
  viewport: { width: 1440, height: 1100 }, locale: language, timezoneId: 'Asia/Taipei',
  args: [...(viaCDP ? ['--enable-unsafe-extension-debugging'] : [`--disable-extensions-except=${resolve(root, 'dist')}`, `--load-extension=${resolve(root, 'dist')}`]), '--lang=' + language,
    '--remote-debugging-port=0', '--host-resolver-rules=MAP *.scythe.test 127.0.0.1', '--autoplay-policy=no-user-gesture-required'],
});
if (viaCDP) {
  const cdp = await context.browser().newBrowserCDPSession();
  await cdp.send('Extensions.loadUnpacked', { path: resolve(root, 'dist') });
  await cdp.detach();
}
} catch (error) {
  await context?.close().catch(() => {}); server.close();
  await rm(profile, { recursive: true, force: true, maxRetries: 5 });
  throw error;
}
const errors = [];
context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
let worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
const extensionId = worker.url().split('/')[2];
const options = await context.newPage();
await options.goto(`chrome-extension://${extensionId}/ui/options.html`);
const debugPort = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
await writeFile(resolve(artifacts, 'browser-session.json'), JSON.stringify({ runnerPid: process.pid, endpoint: `http://127.0.0.1:${debugPort}`,
  extensionId, optionsUrl: options.url(), profile }, null, 2));
const base = `http://127.0.0.1:${port}`;
const records = [];
let stage = 'initialization';
const rpc = async message => {
  const reply = await options.evaluate(message => chrome.runtime.sendMessage(message), message);
  assert.equal(reply?.ok, true, JSON.stringify(reply?.error)); return reply.data;
};
const snapshot = () => rpc({ type: 'snapshot' });
const waitUntil = async (condition, timeout = 10_000) => {
  const end = Date.now() + timeout;
  do {
    if (await condition()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  } while (Date.now() < end);
  throw new Error('等待 Chrome 狀態更新逾時。');
};
const restore = async id => {
  await options.evaluate(id => chrome.tabs.update(id, { active: true }), id);
  await waitUntil(async () => !(await options.evaluate(id => chrome.tabs.get(id), id)).discarded);
  await options.bringToFront();
};
const tabFor = async page => {
  const tabs = await options.evaluate(() => chrome.tabs.query({}));
  const tab = tabs.find(tab => tab.url === page.url());
  assert.ok(tab, `Missing tab for ${page.url()}`); return tab;
};
const addPage = async path => { const page = await context.newPage(); await page.goto(base + path); return page; };
const expire = async ids => {
  // Only the isolated test profile is modified; production has no time-travel message.
  await options.evaluate(async ids => {
    await chrome.runtime.sendMessage({ type: 'snapshot' });
    const { session } = await chrome.storage.session.get('session');
    for (const id of ids) if (session.tabs[id]) {
      session.tabs[id].inactiveSince = Date.now() - 120_000;
      session.tabs[id].inUse = false; session.tabs[id].retryAt = null;
    }
    await chrome.storage.session.set({ session });
  }, ids);
  await restartWorker();
};
const restartWorker = async () => {
  const cdp = await context.newCDPSession(options);
  await cdp.send('ServiceWorker.enable');
  const target = await cdp.send('Target.getTargets');
  const targetId = target.targetInfos.find(info => info.type === 'service_worker' && info.url.includes(extensionId))?.targetId;
  if (targetId) {
    await cdp.send('Target.closeTarget', { targetId });
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  await cdp.detach();
  await rpc({ type: 'snapshot' });
  worker = context.serviceWorkers().find(item => item.url().includes(extensionId)) || await context.waitForEvent('serviceworker');
};
const check = async (name, fn) => {
  stage = name; await fn(); records.push({ name, passed: true }); console.log(`PASS ${name}`);
};

try {
  await options.locator('#running-status[data-state="running"]').waitFor();
  console.log(`Browser: ${context.browser()?.version()}; extension: ${extensionId}`);
  await rpc({ type: 'settings', mode: 'strict', timeoutMinutes: 1 });
  const ordinary = await addPage('/research');
  await options.bringToFront();
  let ordinaryId = (await tabFor(ordinary)).id;
  await check('指定背景頁 discard，保留分頁並在切回時恢復', async () => {
    await expire([ordinaryId]); await rpc({ type: 'sweep' });
    assert.equal((await tabFor(ordinary)).discarded, true);
    ordinaryId = (await tabFor(ordinary)).id;
    assert.ok((await snapshot()).activities.some(item => item.tabId === ordinaryId && item.kind === 'discarded'));
    await restore(ordinaryId);
    assert.equal((await tabFor(ordinary)).discarded, false);
    await options.bringToFront();
  });

  await check('嚴格模式可卸載釘選且 autoDiscardable=false 的頁面', async () => {
    await options.evaluate(id => chrome.tabs.update(id, { pinned: true, autoDiscardable: false }), ordinaryId);
    await expire([ordinaryId]); await rpc({ type: 'sweep' });
    assert.equal((await tabFor(ordinary)).discarded, true);
    ordinaryId = (await tabFor(ordinary)).id;
    await restore(ordinaryId);
  });

  await check('一般模式保留相同的釘選分頁', async () => {
    await rpc({ type: 'settings', mode: 'normal', timeoutMinutes: 1 });
    await expire([ordinaryId]); await rpc({ type: 'sweep' });
    assert.equal((await tabFor(ordinary)).discarded, false);
    assert.equal((await snapshot()).tabs.find(tab => tab.id === ordinaryId).reason, 'pinned');
    await options.evaluate(id => chrome.tabs.update(id, { pinned: false, autoDiscardable: true }), ordinaryId);
    await rpc({ type: 'settings', mode: 'strict', timeoutMinutes: 1 });
  });

  await check('白名單及手動保護會優先於嚴格模式，移除後重新倒數', async () => {
    await rpc({ type: 'allow-add', hostname: '127.0.0.1', includeSubdomains: false });
    await expire([ordinaryId]); await rpc({ type: 'sweep' });
    assert.equal((await tabFor(ordinary)).discarded, false);
    const rule = (await snapshot()).settings.allowlist[0];
    await rpc({ type: 'allow-remove', id: rule.id });
    assert.equal((await snapshot()).tabs.find(tab => tab.id === ordinaryId).reason, 'waiting');
    await rpc({ type: 'protect', tabId: ordinaryId, protected: true });
    await expire([ordinaryId]); await rpc({ type: 'sweep' });
    assert.equal((await tabFor(ordinary)).discarded, false);
    await rpc({ type: 'protect', tabId: ordinaryId, protected: false });
    const current = (await snapshot()).tabs.find(tab => tab.id === ordinaryId);
    assert.equal(current.reason, 'waiting'); assert.ok(current.dueAt > Date.now() + 55_000);
  });

  await check('暫停時沒有 alarm，恢復後重新計時', async () => {
    await rpc({ type: 'pause', paused: true });
    assert.equal(await options.evaluate(() => chrome.action.getTitle({})),
      await options.evaluate(() => chrome.i18n.getMessage('actionPaused', [chrome.runtime.getManifest().short_name])));
    assert.equal((await options.evaluate(() => chrome.alarms.getAll())).length, 0);
    await expire([ordinaryId]); await rpc({ type: 'sweep' });
    assert.equal((await tabFor(ordinary)).discarded, false);
    await rpc({ type: 'pause', paused: false });
    assert.equal(await options.evaluate(() => chrome.action.getTitle({})),
      await options.evaluate(() => chrome.i18n.getMessage('actionRunning', [chrome.runtime.getManifest().short_name])));
    assert.equal((await options.evaluate(() => chrome.alarms.getAll())).length, 1);
    assert.equal((await snapshot()).tabs.find(tab => tab.id === ordinaryId).reason, 'waiting');
  });

  await check('真正的 alarm 事件會喚醒 worker 並卸載逾時頁', async () => {
    await expire([ordinaryId]);
    await options.evaluate(() => chrome.alarms.create('discards:scan', { when: Date.now() + 800 }));
    await waitUntil(async () => (await tabFor(ordinary)).discarded, 40_000);
    assert.equal((await tabFor(ordinary)).discarded, true);
    ordinaryId = (await tabFor(ordinary)).id;
    await restore(ordinaryId);
    // Restore the standard periodic alarm after the one-shot test alarm.
    await options.evaluate(() => chrome.alarms.clear('discards:scan'));
    await restartWorker();
  });

  const audioPage = await addPage('/music');
  await audioPage.locator('#play').click();
  console.log('Audio fixture:', await audioPage.evaluate(() => ({ state: window.audioContext?.state, activation: navigator.userActivation.hasBeenActive })));
  const audioId = (await tabFor(audioPage)).id;
  await options.bringToFront();
  await check('嚴格模式卸載實際播放音訊的背景頁', async () => {
    await waitUntil(async () => (await options.evaluate(id => chrome.tabs.get(id), audioId)).audible);
    await expire([audioId]); await rpc({ type: 'sweep' });
    assert.equal((await tabFor(audioPage)).discarded, true);
  });

  await check('外觀跟隨系統偏好，也可手動覆寫', async () => {
    await rpc({ type: 'theme', theme: 'system' });
    await options.emulateMedia({ colorScheme: 'dark' });
    await options.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(32, 33, 36)');
    await rpc({ type: 'theme', theme: 'light' });
    await options.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)');
    await rpc({ type: 'theme', theme: 'system' }); await options.emulateMedia({ colorScheme: 'light' });
  });

  assert.deepEqual(errors, []);
  const result = { at: new Date().toISOString(), browser: context.browser()?.version(), node: process.version,
    platform: process.platform, language, extensionVersion: (await snapshot()).version, checks: records, pageErrors: errors,
    note: (viaCDP ? 'Installed Chrome' : 'Chrome for Testing') + '; isolated profile; sleep/wake and long-term workload not tested.' };
  await writeFile(resolve(artifacts, 'browser-results.json'), JSON.stringify(result, null, 2));
  await writeFile(resolve(artifacts, 'browser-results-' + localeSuffix + '.json'), JSON.stringify(result, null, 2));
  await rm(resolve(artifacts, 'browser-failure.json'), { force: true });
  await rm(resolve(artifacts, 'browser-failure.png'), { force: true });

  if (process.argv.includes('--keep-open') || process.argv.includes('--ui')) {
    await rpc({ type: 'settings', mode: 'normal', timeoutMinutes: 30 });
    await rpc({ type: 'allow-add', hostname: 'docs.google.com', includeSubdomains: false });
    await rpc({ type: 'allow-add', hostname: 'meet.google.com', includeSubdomains: false });
    await addPage('/reading'); const notes = await addPage('/notes');
    await rpc({ type: 'protect', tabId: (await tabFor(notes)).id, protected: true });
    await options.bringToFront(); await options.reload();
    const debug = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
    await writeFile(resolve(artifacts, 'browser-session.json'), JSON.stringify({ runnerPid: process.pid, endpoint: `http://127.0.0.1:${debug}`,
      extensionId, optionsUrl: options.url(), profile, base, optionsTabId: (await tabFor(options)).id }, null, 2));
    if (process.argv.includes('--ui')) {
      stage = 'React 介面流程';
      const source = await readFile(resolve(import.meta.dirname, 'ui-flows.js'), 'utf8');
      const runFlow = new Function('return (' + source + ')')();
      const ui = await runFlow(options);
      stage = '介面邊界案例';
      const regressions = await runUiRegressions(options);
      ui.passed.push(...regressions.passed);
      ui.screenshots.push(...regressions.screenshots);
      ui.focusChecks = regressions.focusChecks;
      ui.pageErrors.push(...regressions.pageErrors);
      ui.consoleErrors.push(...regressions.consoleErrors);
      await writeFile(resolve(artifacts, 'ui-results.json'), JSON.stringify({ at: new Date().toISOString(),
        browser: context.browser()?.version(), extensionVersion: (await snapshot()).version, ...ui }, null, 2));
      await writeFile(resolve(artifacts, 'ui-results-' + localeSuffix + '.json'), JSON.stringify({ at: new Date().toISOString(), language, platform: process.platform, browser: context.browser()?.version(), ...ui }, null, 2));
      console.log('PASS ' + ui.passed.length + ' UI flows, ' + ui.screenshots.length + ' captures; no page errors');
    }
    if (process.argv.includes('--keep-open')) {
      console.log(`READY ${options.url()} CDP http://127.0.0.1:${debug}`);
      process.once('SIGINT', async () => { await context.close(); server.close(); await rm(profile, { recursive: true, force: true, maxRetries: 5 }); process.exit(0); });
      await new Promise(() => {});
    }
  }
} catch (error) {
  await writeFile(resolve(artifacts, 'browser-failure.json'), JSON.stringify({ stage, error: error.stack || String(error), pageErrors: errors, checks: records }, null, 2));
  await options.screenshot({ path: resolve(artifacts, 'browser-failure.png'), fullPage: true }).catch(() => {});
  if (process.argv.includes('--keep-open')) {
    console.error(`FAILED ${stage}: ${String(error)}; CDP http://127.0.0.1:${debugPort}`);
    process.once('SIGINT', async () => { await context.close(); server.close(); await rm(profile, { recursive: true, force: true, maxRetries: 5 }); process.exit(1); });
    await new Promise(() => {});
  }
  throw error;
} finally {
  await context.close(); server.close(); await rm(profile, { recursive: true, force: true, maxRetries: 5 });
}
