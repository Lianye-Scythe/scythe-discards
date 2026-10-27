import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

// These cases exercise the rendered UI; transport faults exist only in test pages.
export async function runUiRegressions(page) {
  const context = page.context(), base = page.url().split('#')[0];
  const popupUrl = base.replace('options.html', 'popup.html');
  const language = await page.locator('html').getAttribute('lang');
  const suffix = language.replaceAll('-', '_'), isTW = suffix === 'zh_TW';
  const passed = [], screenshots = [], focusChecks = [], pageErrors = [], consoleErrors = [];
  const watch = target => {
    target.on('pageerror', error => pageErrors.push(error.message));
    target.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  };
  const rpc = message => page.evaluate(async message => {
    const reply = await chrome.runtime.sendMessage(message);
    if (!reply?.ok) throw new Error(JSON.stringify(reply));
    return reply.data;
  }, message);
  const keys = ['undo', 'closeNotice', 'removeWebsite', 'addWebsite'];
  const messages = await page.evaluate(keys => Object.fromEntries(keys.map(key =>
    [key, chrome.i18n.getMessage(key, ['$1'])])), keys);
  const t = (key, value) => messages[key].replace('$1', value ?? '');
  const capture = async (target, name) => {
    const path = 'artifacts/screenshots/v033-' + suffix + '-' + name + '.png';
    await target.screenshot({ path }); screenshots.push(path);
  };
  const record = name => { passed.push(name); console.log('UI PASS ' + name); };
  const focusWithTab = async (target, documentPage) => {
    for (let n = 0; n < 40; n++) {
      const previous = await documentPage.evaluateHandle(() => document.activeElement);
      await documentPage.keyboard.press('Tab');
      if (await target.evaluate(el => el === document.activeElement)) return previous;
      await previous.dispose();
    }
    throw new Error('Could not reach control with Tab');
  };
  const assertVisibleFocus = async (target, name) => {
    const result = await target.evaluate(el => {
      const r = el.getBoundingClientRect(), main = document.querySelector('.popup-content').getBoundingClientRect();
      const footer = document.querySelector('.popup-footer').getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { focused: el === document.activeElement, visible: el.matches(':focus-visible'),
        top: r.top, bottom: r.bottom, mainTop: main.top, mainBottom: main.bottom,
        footerTop: footer.top, hit: hit === el || el.contains(hit), scroll: document.querySelector('.popup-content').scrollTop };
    });
    assert(result.focused && result.visible && result.hit, name + ': focused control is obscured');
    assert(result.top >= result.mainTop && result.bottom <= result.mainBottom + 1 &&
      result.bottom <= result.footerTop, name + ': focus is outside the scroll area');
    focusChecks.push({ name, ...result });
  };
  await mkdir('artifacts/screenshots', { recursive: true });
  const editor = await context.newPage();
  watch(editor);
  await editor.clock.install(); await editor.goto(base + '#allowlist');
  const popup = await context.newPage(), fixture = await context.newPage();
  watch(popup); watch(fixture);
  let complete = false;
  try {
    await editor.locator('#running-status[data-state="running"]').waitFor();
    const host = 'undo.scythe.test';
    await rpc({ type: 'allow-add', hostname: host, includeSubdomains: false });
    const remove = editor.getByRole('button', { name: t('removeWebsite', host), exact: true });
    await remove.waitFor(); await remove.click();
    await editor.waitForFunction(label => document.activeElement.matches('button') && document.activeElement.textContent.includes(label),
      t('addWebsite'));
    const undo = editor.getByRole('button', { name: t('undo'), exact: true });
    await undo.waitFor(); const noticeOrigin = await focusWithTab(undo, editor); await editor.clock.fastForward(8000);
    assert(await undo.count() === 1 && await undo.evaluate(el => el === document.activeElement), 'Focused Undo expired');
    await editor.getByRole('button', { name: t('closeNotice'), exact: true }).press('Enter');
    assert(await noticeOrigin.evaluate(el => el === document.activeElement),
      'Dismissing a focused notice did not return focus');
    await noticeOrigin.dispose();
    await rpc({ type: 'allow-add', hostname: host, includeSubdomains: false });
    await remove.waitFor(); await remove.click(); await undo.waitFor();
    await editor.locator('.toast').hover(); await editor.clock.fastForward(8000);
    assert(await undo.count() === 1, 'Hovered Undo expired');
    await editor.mouse.move(0, 0); await editor.clock.fastForward(8000);
    await editor.locator('.toast').waitFor({ state: 'hidden' });
    record('Undo pauses for focus and hover, resumes on leave and restores focus on dismissal');

    const notes = context.pages().find(item => item !== fixture && item.url().endsWith('/notes') && !item.isClosed());
    assert(notes, 'Missing local notes fixture');
    const port = new URL(notes.url()).port;
    const longHost = ['a'.repeat(63), 'b'.repeat(63), 'c'.repeat(63), 'd'.repeat(47), 'scythe', 'test'].join('.');
    await fixture.goto('http://' + longHost + ':' + port + '/notes');
    const tabId = (await rpc({ type: 'snapshot' })).tabs.find(tab => tab.url?.includes(longHost)).id;
    await rpc({ type: 'allow-add', hostname: 'scythe.test', includeSubdomains: true });
    await popup.clock.install(); await popup.setViewportSize({ width: 360, height: 600 });
    await popup.addInitScript(({ tabId }) => {
      const original = chrome.runtime.sendMessage.bind(chrome.runtime);
      const bridge = { mode: 'hold', pending: [], snapshots: 0,
        release() { this.mode = 'ready'; this.pending.splice(0).forEach(run => run()); } };
      window.__testBridge = bridge;
      chrome.runtime.sendMessage = message => {
        if (bridge.mode === 'reject' || bridge.mode === 'transport-action' && message.type !== 'snapshot') {
          return Promise.reject(new Error('Test transport failure'));
        }
        if (bridge.mode === 'app-error' && message.type !== 'snapshot') {
          return Promise.resolve({ ok: false, error: { code: 'invalid-tab' } });
        }
        const run = () => original(message).then(reply => {
          if (message.type === 'snapshot') bridge.snapshots++;
          return reply.ok ? { ...reply, data: { ...reply.data, currentTabId: tabId } } : reply;
        });
        return bridge.mode === 'hold' ? new Promise((resolve, reject) =>
          bridge.pending.push(() => run().then(resolve, reject))) : run();
      };
    }, { tabId });
    await popup.goto(popupUrl); await popup.bringToFront();
    await popup.locator('#popup-status[data-state="loading"]').waitFor();
    assert(await popup.locator('#popup-automation').isDisabled(), 'Loading actions are enabled');
    assert(await popup.locator('#popup-host, #popup-scope-target').count() === 0,
      'Loading presents a guessed hostname or protection target');
    if (isTW) await capture(popup.locator('body'), 'popup-loading');
    await popup.evaluate(() => window.__testBridge.release());
    await popup.locator('#popup-status[data-state="running"]').waitFor();
    await popup.locator('#popup-manage-rule').waitFor();
    assert(await popup.locator('#popup-allow').count() === 0, 'Inherited rule exposes an unusable child switch');
    const hostnameSummary = popup.locator('#popup-host > summary');
    assert(await hostnameSummary.getAttribute('aria-label') === longHost, 'Compact hostname lost its full accessible name');
    await popup.setViewportSize({ width: 320, height: 600 });
    await focusWithTab(hostnameSummary, popup); await hostnameSummary.press('Enter');
    await popup.locator('#popup-host[open] .hostname-full').waitFor();
    assert(await popup.locator('#popup-host .hostname-full').textContent() === longHost, 'Full hostname cannot be read or selected');
    const snapshots = await popup.evaluate(() => {
      const before = window.__testBridge.snapshots;
      document.dispatchEvent(new Event('visibilitychange')); return before;
    });
    await popup.waitForFunction(before => window.__testBridge.snapshots > before, snapshots);
    await popup.evaluate(() => new Promise(requestAnimationFrame));
    assert(await popup.locator('#popup-host').getAttribute('open') !== null, 'Snapshot closed the hostname disclosure');
    assert(await popup.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Expanded hostname overflows narrow popup');
    if (isTW) await capture(popup.locator('body'), 'popup-host-expanded');
    await hostnameSummary.press('Enter');
    assert(await popup.locator('#popup-host').getAttribute('open') === null, 'Hostname cannot be collapsed with keyboard');
    await popup.setViewportSize({ width: 360, height: 600 });
    const parent = longHost.slice(longHost.indexOf('.') + 1);
    await rpc({ type: 'allow-add', hostname: parent, includeSubdomains: true });
    const rootRule = (await rpc({ type: 'snapshot' })).settings.allowlist.find(rule => rule.hostname === 'scythe.test');
    await rpc({ type: 'allow-remove', id: rootRule.id });
    const sourceSummary = popup.locator('#inherited-help details > summary');
    await sourceSummary.waitFor(); await focusWithTab(sourceSummary, popup); await sourceSummary.press('Enter');
    assert(await popup.locator('#inherited-help .hostname-full').textContent() === parent, 'Full inherited rule source is unavailable');
    await focusWithTab(popup.locator('#popup-manage-rule'), popup);
    await assertVisibleFocus(popup.locator('#popup-manage-rule'), 'expanded rule source management');
    const sourceVisible = await popup.locator('#inherited-help .hostname-full').evaluate(el => {
      const rect = el.getBoundingClientRect(), main = document.querySelector('.popup-content').getBoundingClientRect();
      return rect.top >= main.top && rect.bottom <= main.bottom + 1 && el.scrollWidth <= el.clientWidth;
    });
    assert(sourceVisible, 'Expanded rule source cannot be read completely within the scroller');
    if (isTW) await capture(popup.locator('body'), 'popup-rule-source-expanded');
    await sourceSummary.press('Enter');
    await rpc({ type: 'allow-add', hostname: 'scythe.test', includeSubdomains: true });
    const parentRule = (await rpc({ type: 'snapshot' })).settings.allowlist.find(rule => rule.hostname === parent);
    await rpc({ type: 'allow-remove', id: parentRule.id });
    await popup.locator('#inherited-help > .hostname:not(details)').waitFor();
    record('Inherited source is explicit; long hostname expands with keyboard and survives refresh at 320px');
    for (const selector of ['#popup-scope', '#popup-manage-rule']) {
      await focusWithTab(popup.locator(selector), popup); await assertVisibleFocus(popup.locator(selector), selector);
    }
    if (isTW || suffix === 'en') await capture(popup.locator('body'), 'popup-long-host');
    await popup.locator('#popup-scope').selectOption('domain'); await popup.locator('#popup-allow').click();
    const popupUndo = popup.getByRole('button', { name: t('undo'), exact: true });
    await popupUndo.waitFor(); await focusWithTab(popup.locator('#popup-scope'), popup);
    await assertVisibleFocus(popup.locator('#popup-scope'), 'scope with notification');
    await focusWithTab(popupUndo, popup); await popup.clock.fastForward(8000);
    assert(await popupUndo.evaluate(el => el === document.activeElement), 'Popup Undo lost focus');
    if (isTW) await capture(popup.locator('body'), 'popup-undo');
    await popupUndo.press('Enter');
    await popup.locator('#popup-allow').waitFor({ state: 'visible' });
    await popup.waitForFunction(() => document.activeElement.id === 'popup-allow');
    record('Long-host popup focus stays clear of the footer and inline notifications');

    await focusWithTab(popup.getByRole('button', { name: t('closeNotice'), exact: true }), popup);
    await popup.evaluate(() => {
      window.__testBridge.mode = 'reject'; document.dispatchEvent(new Event('visibilitychange'));
    });
    await popup.locator('#popup-status[data-state="unavailable"]').waitFor();
    assert(await popup.locator('#popup-automation').isDisabled() && await popup.locator('#popup-protect').isDisabled(),
      'Cached data permits remote actions');
    await popup.locator('.connection-help').waitFor();
    await popup.locator('.toast').waitFor({ state: 'hidden' });
    assert(await popup.locator('[data-connection-retry]').evaluate(el => el === document.activeElement),
      'Hiding a focused old success notice did not move focus to recovery');
    const retryVisible = await popup.locator('[data-connection-retry]').evaluate(el => {
      const rect = el.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return rect.top >= 0 && rect.bottom <= window.innerHeight && (hit === el || el.contains(hit));
    });
    assert(retryVisible, 'Connection recovery scrolled out of view');
    assert(await popup.locator('.current-reason.is-protected').count() === 0,
      'Stale tab data is presented as currently protected');
    await capture(popup.locator('body'), 'popup-connection-error');
    await popup.evaluate(() => { window.__testBridge.mode = 'hold'; });
    await popup.locator('[data-connection-retry]').click();
    await popup.locator('#popup-status[data-state="reconnecting"]').waitFor();
    assert(await popup.locator('[data-connection-retry]').isDisabled(), 'Duplicate retry is enabled');
    await popup.evaluate(() => window.__testBridge.release());
    await popup.locator('#popup-status[data-state="running"]').waitFor();
    assert(await popup.locator('#popup-protect').isEnabled(), 'Retry did not restore actions');
    await popup.evaluate(() => { window.__testBridge.mode = 'transport-action'; });
    await popup.locator('#popup-protect').click();
    await popup.locator('#popup-status[data-state="unavailable"]').waitFor();
    await popup.evaluate(() => { window.__testBridge.mode = 'ready'; });
    await popup.locator('[data-connection-retry]').click(); await popup.locator('#popup-status[data-state="running"]').waitFor();
    record('Loading, stale data, retry and action transport failures have consistent status');

    await popup.locator('#popup-allow').click(); await popupUndo.waitFor(); await popup.mouse.move(0, 0);
    await popup.evaluate(() => {
      window.__testBridge.mode = 'reject'; document.dispatchEvent(new Event('visibilitychange'));
    });
    await popup.locator('#popup-status[data-state="unavailable"]').waitFor();
    await popup.clock.fastForward(20_000);
    assert(await popupUndo.count() === 1 && await popupUndo.isDisabled(), 'Undo expired while reconnection was required');
    if (isTW) await capture(popup.locator('body'), 'popup-offline-undo');
    await popup.evaluate(() => { window.__testBridge.mode = 'ready'; });
    await popup.locator('[data-connection-retry]').click();
    await popup.locator('#popup-status[data-state="running"]').waitFor();
    await popupUndo.click();
    await popup.waitForFunction(() => document.querySelector('#popup-allow')?.getAttribute('aria-checked') === 'true');
    record('Recovery replaces old success feedback, restores focus and retains pending Undo until reconnected');

    await popup.evaluate(() => { window.__testBridge.mode = 'app-error'; });
    await popup.locator('#popup-protect').click(); await popup.locator('.toast-error').waitFor();
    await popup.clock.fastForward(60_000);
    assert(await popup.locator('.toast-error').count() === 1, 'Action error disappeared automatically');
    assert(await popup.locator('#popup-status').getAttribute('data-state') === 'running', 'Application validation marked a healthy bridge offline');
    await focusWithTab(popup.getByRole('button', { name: t('closeNotice'), exact: true }), popup);
    if (isTW) await capture(popup.locator('body'), 'popup-action-error');
    await popup.getByRole('button', { name: t('closeNotice'), exact: true }).press('Enter');
    await popup.locator('.toast').waitFor({ state: 'hidden' });
    assert(await popup.locator('#popup-allow').evaluate(el => el === document.activeElement), 'Error dismissal did not restore focus');
    record('Action errors remain dismissible, keep keyboard focus and preserve healthy connection status');
    const rule = (await rpc({ type: 'snapshot' })).settings.allowlist.find(rule => rule.hostname === 'scythe.test');
    if (rule) await rpc({ type: 'allow-remove', id: rule.id });
    assert(pageErrors.length === 0, 'Regression page errors: ' + pageErrors.join('; '));
    assert(consoleErrors.length === 0, 'Regression console errors: ' + consoleErrors.join('; '));
    complete = true;
    return { passed, screenshots, focusChecks, pageErrors, consoleErrors };
  } finally {
    if (!complete) await popup.screenshot({ path: 'artifacts/screenshots/v033-' + suffix + '-regression-failure.png' }).catch(() => {});
    if (complete || !process.argv.includes('--keep-open')) {
      await editor.close(); await popup.close(); await fixture.close();
    }
    await page.bringToFront();
  }
}
