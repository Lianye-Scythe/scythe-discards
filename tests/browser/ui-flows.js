async page => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [], consoleErrors = [], passed = [], screenshots = [], overflowChecks = [], popupHeights = [];
  const context = page.context();
  const base = page.url().split('#')[0];
  const extensionId = base.split('/')[2];
  const version = await page.evaluate(() => chrome.runtime.getManifest().version);
  const keys = ['languageTag','navSettings','navAllowlist','navTabs','navActivity','navAbout','aboutLatest','openInNewTab','settings','allowlist','tabs','activity','saved','cancelChanges','addWebsite','add','cancel','removeWebsite','errorInvalidHost','noticeChecked','scopeHost','scopeDomain','inheritedProtection','manageRule','noActivity','undo'];
  const messages = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, chrome.i18n.getMessage(key, ['$1','$2','$3'])])), keys);
  const t = (key, args = []) => messages[key].replace(/\$(\d)/g, (_m, position) => String(args[Number(position) - 1] ?? ''));
  const language = messages.languageTag.replaceAll('-', '_');
  const isTW = language === 'zh_TW';
  const review = 'artifacts/screenshots/v' + version + '-' + language + '-';
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  const record = name => { passed.push(name); console.log('UI PASS ' + name); };
  const rpc = message => page.evaluate(async message => {
    const reply = await chrome.runtime.sendMessage(message);
    if (!reply?.ok) throw new Error(JSON.stringify(reply?.error));
    return reply.data;
  }, message);
  const routes = [
    { id: 'settings', nav: 'navSettings', title: 'settings' },
    { id: 'allowlist', nav: 'navAllowlist', title: 'allowlist' },
    { id: 'tabs', nav: 'navTabs', title: 'tabs' },
    { id: 'activity', nav: 'navActivity', title: 'activity' },
    { id: 'about', nav: 'navAbout', title: 'navAbout' },
  ];
  const [settings, allowlist, tabs, activity] = routes;
  const navigate = async route => {
    await page.locator('.sidebar nav').getByRole('link', { name: t(route.nav), exact: true }).click();
    await page.locator('.sidebar a[aria-current="page"]').filter({ hasText: t(route.nav) }).waitFor();
    await page.locator('.page:not([hidden]) h1').filter({ hasText: t(route.title) }).waitFor();
  };
  const waitSettings = (mode, timeout) => page.waitForFunction(async ({ mode, timeout }) => {
    const data = (await chrome.storage.local.get('settings')).settings;
    return data.mode === mode && data.timeoutMinutes === timeout;
  }, { mode, timeout });
  const capture = async (target, name, body = false) => {
    await target.evaluate(() => window.scrollTo(0, 0));
    await (body ? target.locator('body') : target).screenshot({ path: review + name + '.png', ...(body ? {} : { fullPage: true }) });
    screenshots.push(review + name + '.png');
  };

  await page.bringToFront(); await page.goto(base + '#settings');
  await page.locator('#running-status[data-state="running"]').waitFor();
  assert(await page.locator('html').getAttribute('lang') === messages.languageTag, 'Document language is wrong');
  assert(await page.evaluate(() => getComputedStyle(document.body).fontSize) === '14px', 'Chrome overrode body font size');
  await page.locator('#mode-strict').click(); await page.locator('#strict-warning').waitFor();
  await page.locator('#timeout').fill('17');
  assert((await rpc({ type: 'snapshot' })).settings.timeoutMinutes === 30, 'Draft applied before save');
  await page.locator('#save-rules').click(); await waitSettings('strict', 17);
  await page.locator('#rules-feedback').filter({ hasText: t('saved') }).waitFor();
  record('mode and timeout apply only after save');

  await page.locator('#timeout').fill('23'); await navigate(tabs);
  await page.locator('#tab-search').fill('稍後閱讀'); await navigate(settings);
  assert(await page.locator('#timeout').inputValue() === '23', 'Draft lost');
  await page.goBack(); await page.locator('.sidebar a[aria-current="page"]').filter({ hasText: t('navTabs') }).waitFor();
  assert(await page.locator('#tab-search').inputValue() === '稍後閱讀', 'Search lost');
  await page.goForward(); await page.locator('#timeout').waitFor();
  await page.getByRole('button', { name: t('cancelChanges'), exact: true }).click();
  assert(await page.locator('#timeout').inputValue() === '17', 'Cancel failed');
  record('navigation, browser history, drafts and search persist');
  await page.locator('#timeout').fill('0');
  assert(await page.locator('#timeout').evaluate(input => !input.validity.valid), 'Invalid timeout accepted');
  await page.locator('#save-rules').click();
  assert((await rpc({ type: 'snapshot' })).settings.timeoutMinutes === 17, 'Invalid timeout persisted');
  await page.locator('#mode-strict').focus();
  // Roving focus updates asynchronously; observe the action before releasing the key.
  await page.keyboard.down('ArrowUp');
  try {
    await page.waitForFunction(() => document.querySelector('#mode-normal').getAttribute('aria-checked') === 'true');
  } finally {
    await page.keyboard.up('ArrowUp');
  }
  await page.locator('#timeout').fill('30'); await page.locator('#save-rules').click(); await waitSettings('normal', 30);
  record('timeout validation and radio keyboard selection');

  await navigate(allowlist);
  await page.getByRole('button', { name: t('addWebsite'), exact: true }).click();
  assert(await page.locator('#allow-host').evaluate(input => document.activeElement === input), 'Editor did not receive focus');
  await page.locator('#allow-host').fill('*.invalid.test');
  await page.getByRole('button', { name: t('add'), exact: true }).click();
  await page.locator('#allow-error').waitFor();
  assert(await page.locator('#allow-error').innerText() === t('errorInvalidHost'), 'Inline error not localized');
  await page.locator('#allow-host').fill('https://EXAMPLE.com/path'); await page.locator('#allow-subdomains').click();
  await page.getByRole('button', { name: t('add'), exact: true }).click();
  await page.getByRole('button', { name: t('removeWebsite', ['example.com']), exact: true }).waitFor();
  assert((await rpc({ type: 'snapshot' })).settings.allowlist.some(rule => rule.hostname === 'example.com' && rule.includeSubdomains), 'Scope not saved');
  await page.getByRole('button', { name: t('removeWebsite', ['example.com']), exact: true }).click();
  await page.getByRole('button', { name: t('removeWebsite', ['example.com']), exact: true }).waitFor({ state: 'detached' });
  await page.getByRole('button', { name: t('undo'), exact: true }).click();
  await page.getByRole('button', { name: t('removeWebsite', ['example.com']), exact: true }).waitFor();
  await page.getByRole('button', { name: t('removeWebsite', ['example.com']), exact: true }).click();
  record('localized validation, normalized hostname, subdomains, removal and undo');

  await navigate(settings); await page.locator('#automation').click();
  await page.locator('#running-status[data-state="paused"]').waitFor(); await navigate(tabs);
  assert(await page.locator('#check-now').isDisabled(), 'Check enabled while paused');
  await navigate(settings); await page.locator('#automation').click();
  await page.locator('#running-status[data-state="running"]').waitFor();
  record('pause and resume switches');

  await navigate(tabs);
  const reading = page.locator('#tabs-body tr').filter({ hasText: '稍後閱讀' });
  assert(await reading.count() === 1, 'Search failed');
  const protect = reading.getByRole('switch'); await protect.click();
  await page.waitForFunction(() => document.querySelector('#tabs-body tr button[role="switch"]')?.getAttribute('aria-checked') === 'true');
  const handle = await protect.elementHandle(); await protect.focus(); await page.waitForTimeout(16_000);
  assert(await handle.evaluate(element => element.isConnected && document.activeElement === element), 'Refresh replaced focused control');
  assert(await page.locator('#tab-search').inputValue() === '稍後閱讀', 'Refresh cleared search');
  await page.locator('#tab-search').fill(''); await page.locator('#tab-filter').selectOption('protected');
  assert(await page.locator('#tabs-body tr[data-tab-id]').count() > 0, 'Protected filter failed');
  await page.locator('#tab-filter').selectOption('discarded');
  assert(await page.locator('#tabs-body tr[data-tab-id]').count() > 0, 'Discarded filter failed');
  await page.locator('#tab-filter').selectOption('all'); await page.locator('#check-now').click();
  await page.getByRole('status').filter({ hasText: t('noticeChecked') }).waitFor(); await page.reload();
  await page.locator('.sidebar a[aria-current="page"]').filter({ hasText: t('navTabs') }).waitFor();
  record('tab filters, protection, timed refresh focus and route reload');

  await navigate(settings); await page.locator('#theme').selectOption('dark');
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  assert(await page.evaluate(() => getComputedStyle(document.body).backgroundColor) === 'rgb(32, 33, 36)', 'Theme override failed');
  await page.locator('#theme').selectOption('system');
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'system');
  record('system theme and manual override');

  const about = routes[4];
  const savedSettings = (await rpc({ type: 'snapshot' })).settings;
  await page.locator('#timeout').fill('23'); await navigate(about);
  await page.waitForFunction(() => document.activeElement === document.querySelector('#about-page h1'));
  assert((await page.locator('#about-version').innerText()).includes(version), 'About version differs from manifest');
  await page.goBack(); await page.locator('#timeout').waitFor();
  assert(await page.locator('#timeout').inputValue() === '23', 'About navigation lost the settings draft');
  await page.goForward(); await page.locator('#about-page').waitFor(); await page.reload();
  await page.locator('.sidebar a[aria-current="page"][href="#about"]').waitFor();
  const guide = page.locator('.about-update-guide > summary'); await guide.focus(); await guide.press('Enter');
  await page.locator('.about-update-guide[open]').waitFor();
  assert((await page.locator('.about-update-guide').innerText()).includes('chrome://extensions'), 'ZIP update guide is missing');
  await guide.press('Enter');
  const localRequests = [];
  const observeRequest = request => { if (/^https?:/.test(request.url())) localRequests.push(request.url()); };
  page.on('request', observeRequest); await page.reload(); await page.locator('#about-version').waitFor();
  page.off('request', observeRequest);
  assert(localRequests.length === 0, 'About page contacted an external service');
  const latest = page.getByRole('link', { name: t('openInNewTab', [t('aboutLatest')]), exact: true });
  const interceptGitHub = route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Release fixture</title>' });
  await context.route('https://github.com/**', interceptGitHub);
  try {
    const [release] = await Promise.all([context.waitForEvent('page'), latest.click()]);
    await release.waitForLoadState();
    assert(release.url() === 'https://github.com/Lianye-Scythe/scythe-discards/releases/latest', 'Latest release link has the wrong destination');
    assert(await release.evaluate(() => window.opener === null), 'External resource retained an opener');
    await release.close();
  } finally { await context.unroute('https://github.com/**', interceptGitHub); }
  const [license] = await Promise.all([context.waitForEvent('page'), page.locator('#about-license').click()]);
  await license.waitForLoadState();
  assert((await license.locator('body').innerText()).includes('MIT License'), 'Bundled license cannot be read');
  await license.close();
  assert(JSON.stringify((await rpc({ type: 'snapshot' })).settings) === JSON.stringify(savedSettings), 'About changed stored settings');
  record('About route, history, focus, local version, update guide and resource links');

  const disconnected = await context.newPage();
  disconnected.on('pageerror', error => errors.push(error.message));
  await disconnected.addInitScript(() => { chrome.runtime.sendMessage = async () => { throw new Error('Isolated About transport fixture'); }; });
  await disconnected.goto(base + '#about');
  await disconnected.locator('#running-status[data-state="unavailable"]').waitFor();
  assert((await disconnected.locator('#about-version').innerText()).includes(version), 'About version depends on the background connection');
  assert(await disconnected.locator('#about-latest').getAttribute('href') === 'https://github.com/Lianye-Scythe/scythe-discards/releases/latest', 'Offline About lost its resource links');
  if (isTW) await capture(disconnected, 'about-offline');
  await disconnected.close(); await page.bringToFront();
  record('About metadata and resources remain available without a background connection');

  const notes = context.pages().find(item => item.url().endsWith('/notes') && !item.isClosed());
  assert(notes, 'Missing notes fixture');
  const fixturePort = new URL(notes.url()).port;
  const scoped = await context.newPage(); await scoped.goto('http://docs.scythe.test:' + fixturePort + '/notes');
  const popup = await context.newPage(); await popup.setViewportSize({ width: 360, height: 650 });
  popup.on('pageerror', error => errors.push(error.message));
  popup.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await popup.goto('chrome-extension://' + extensionId + '/ui/popup.html');
  const loadPopup = async (target = scoped) => {
    await target.bringToFront(); await popup.reload();
    await popup.locator('#popup-title').filter({ hasText: '專案筆記' }).waitFor();
  };
  await loadPopup(); await popup.locator('#popup-protect').click();
  assert((await rpc({ type: 'snapshot' })).tabs.find(tab => tab.url?.includes('docs.scythe.test')).manualProtected, 'Popup tab protection failed');
  await loadPopup(); await popup.locator('#popup-protect').click();
  await loadPopup(); await popup.locator('#popup-allow').click();
  assert((await rpc({ type: 'snapshot' })).settings.allowlist.some(rule => rule.hostname === 'docs.scythe.test' && !rule.includeSubdomains), 'Popup exact add failed');
  await loadPopup(); await popup.locator('#popup-allow').click();
  assert(!(await rpc({ type: 'snapshot' })).settings.allowlist.some(rule => rule.hostname === 'docs.scythe.test'), 'Popup exact removal failed');
  await popup.getByRole('button', { name: t('undo'), exact: true }).click();
  assert((await rpc({ type: 'snapshot' })).settings.allowlist.some(rule => rule.hostname === 'docs.scythe.test'), 'Popup undo failed');
  await loadPopup(); await popup.locator('#popup-allow').click();
  await loadPopup(); await popup.locator('#popup-scope').selectOption('domain'); await popup.locator('#popup-allow').click();
  assert((await rpc({ type: 'snapshot' })).settings.allowlist.some(rule => rule.hostname === 'scythe.test' && rule.includeSubdomains), 'Domain scope add failed');
  await loadPopup();
  assert(await popup.locator('#popup-allow').count() === 0, 'Inherited rule is presented as an editable child switch');
  assert(await popup.locator('.inherited-lock').count() === 1, 'Inherited protection has no source indicator');
  await popup.locator('#inherited-help').filter({ hasText: t('inheritedProtection', ['scythe.test']) }).waitFor();
  await popup.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await capture(popup, 'popup-inherited', true);
  popupHeights.push({ state: 'inherited', height: await popup.locator('body').evaluate(el => el.getBoundingClientRect().height) });
  await popup.locator('#popup-manage-rule').click(); await page.waitForURL(base + '#allowlist');
  await loadPopup(); await popup.locator('#popup-scope').selectOption('domain');
  await popup.locator('#popup-allow').click();
  assert(!(await rpc({ type: 'snapshot' })).settings.allowlist.some(rule => rule.hostname === 'scythe.test'), 'Explicit parent rule removal failed');
  record('popup exact and domain scopes, quick removal, undo and inherited protection');

  await page.bringToFront(); await popup.reload();
  await popup.locator('#popup-host').filter({ hasText: 'Chrome' }).waitFor();
  assert(await popup.locator('#popup-protect').isDisabled() && await popup.locator('#popup-allow').isDisabled(), 'Unsupported actions enabled');
  await loadPopup(); await capture(popup, 'popup', true);
  popupHeights.push({ state: 'normal', height: await popup.locator('body').evaluate(el => el.getBoundingClientRect().height) });
  if (isTW) { await popup.emulateMedia({ colorScheme: 'dark' }); await capture(popup, 'popup-dark', true); }
  await popup.close(); await scoped.close(); await page.bringToFront();
  record('popup unsupported page and localized scope controls');

  // Seed only this isolated profile to verify long history, pagination and clear.
  // Leave the UI to stop its polling, then drain writes and stop the worker before
  // replacing storage. Otherwise a live controller can overwrite the fixture.
  await page.goto('chrome-extension://' + extensionId + '/manifest.json');
  await page.evaluate(async () => {
    await chrome.runtime.sendMessage({ type: 'snapshot' });
    await chrome.alarms.clear('discards:scan');
  });
  const cdp = await context.newCDPSession(page);
  const targets = await cdp.send('Target.getTargets');
  const target = targets.targetInfos.find(item => item.type === 'service_worker' && item.url.includes(extensionId));
  assert(target, 'History fixture worker target missing');
  assert((await cdp.send('Target.closeTarget', { targetId: target.targetId })).success, 'History fixture worker did not close');
  const deadline = Date.now() + 5000;
  while ((await cdp.send('Target.getTargets')).targetInfos.some(item => item.targetId === target.targetId)) {
    assert(Date.now() < deadline, 'History fixture worker did not stop');
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  await cdp.detach();
  await page.evaluate(async () => {
    const { session } = await chrome.storage.session.get('session');
    session.activities = Array.from({ length: 125 }, (_, index) => ({ id: 'history-' + index,
      at: Date.now() - index * 1000, tabId: 999, hostname: 'fixture.example.test',
      kind: 'discarded', code: index % 2 ? 'discard-normal' : 'discard-strict' }));
    await chrome.storage.session.set({ session });
  });
  await page.goto(base); await page.locator('#running-status[data-state="running"]').waitFor(); await navigate(activity);
  const history = (await rpc({ type: 'snapshot' })).activities;
  assert(history.length === 125 && history.every(item => item.id.startsWith('history-')), 'History fixture was not loaded');
  assert(await page.locator('.activity-row').count() === 50, 'History page not limited to 50');
  await page.locator('#activity-next').click(); assert(await page.locator('.activity-row').count() === 50, 'History page 2 failed');
  if (isTW) { await page.setViewportSize({ width: 1440, height: 1000 }); await capture(page, 'activity-page2'); }
  await page.locator('#activity-next').click(); assert(await page.locator('.activity-row').count() === 25, 'History last page failed');
  assert(await page.locator('#activity-next').isDisabled(), 'History advanced beyond final page');
  await page.locator('#clear-activity').click(); await page.getByText(t('noActivity'), { exact: true }).waitFor();
  assert((await rpc({ type: 'snapshot' })).activities.length === 0, 'History was not cleared');
  assert(await page.locator('#clear-activity').isDisabled(), 'Empty history clear enabled');
  record('125 history events, 50/50/25 pagination and persistent clear');
  // Dismiss the verified transient result before baseline screenshots.
  await page.locator('.toast button').last().click();
  await page.locator('.toast').waitFor({ state: 'hidden' });

  // One batched capture round for the supported languages and changed surfaces.
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await navigate(settings); await capture(page, 'desktop');
  await navigate(about); await capture(page, 'about-desktop');
  await page.emulateMedia({ colorScheme: 'dark' }); await capture(page, 'about-dark');
  await page.emulateMedia({ colorScheme: 'light' });
  if (language === 'en' || isTW) { await navigate(tabs); await capture(page, 'desktop-tabs'); }
  if (isTW) { await navigate(settings); await page.emulateMedia({ colorScheme: 'dark' }); await capture(page, 'desktop-dark');
    await page.locator('#mode-strict').click(); await capture(page, 'desktop-strict'); await page.getByRole('button', { name: t('cancelChanges'), exact: true }).click(); }
  for (const width of [620, 380, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await page.emulateMedia({ colorScheme: 'light' });
    for (const route of routes) {
      await navigate(route);
      const metrics = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
      assert(metrics.scroll <= metrics.viewport, 'Overflow: ' + width + ', ' + route.id + ', ' + JSON.stringify(metrics));
      overflowChecks.push({ width, route: route.id, passed: true });
      if (route.id === 'about') {
        const labelsFit = await page.locator('.sidebar .nav-link').evaluateAll(links => links.every(link =>
          [...link.querySelectorAll('span')].filter(span => getComputedStyle(span).display !== 'none').every(span => {
            const a = link.getBoundingClientRect(), b = span.getBoundingClientRect();
            return b.left >= a.left && b.right <= a.right && span.scrollWidth <= span.clientWidth;
          })));
        assert(labelsFit, 'Five-item navigation labels do not fit at ' + width);
        if (width === 320) await capture(page, 'about-mobile');
      }
      if (route.id === 'settings' && (width === 380 || isTW)) await capture(page, width === 380 ? 'mobile' : 'tablet');
      if (width === 380 && route.id === 'tabs' && (language === 'en' || isTW)) await capture(page, 'mobile-tabs');
      if (isTW && width === 380 && route.id === 'allowlist') {
        await page.getByRole('button', { name: t('addWebsite'), exact: true }).click(); await page.locator('#allow-host').fill('*.invalid.test');
        await page.getByRole('button', { name: t('add'), exact: true }).click(); await page.locator('#allow-error').waitFor();
        await capture(page, 'mobile-editor'); await page.getByRole('button', { name: t('cancel'), exact: true }).click();
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 }); await navigate(settings); await page.bringToFront();
  assert(errors.length === 0, 'Page errors: ' + errors.join('; '));
  assert(consoleErrors.length === 0, 'Console errors: ' + consoleErrors.join('; '));
  return { language, passed, screenshots, overflowChecks, popupHeights, pageErrors: errors, consoleErrors };
}
