import { Controller } from './core/controller.ts';
import type { BrowserAdapter } from './core/controller.ts';
import type { Message, Reply, TabInfo } from './core/model.ts';
import { toErrorData } from './core/errors.ts';
import { PRODUCT_NAME } from './brand.ts';

const ALARM = 'discards:scan';

function toTab(tab: chrome.tabs.Tab): TabInfo | undefined {
  if (tab.id == null || tab.id < 0) return undefined;
  return {
    id: tab.id, windowId: tab.windowId, active: tab.active,
    url: tab.url, title: tab.title, discarded: tab.discarded,
    pinned: tab.pinned, audible: tab.audible,
    autoDiscardable: tab.autoDiscardable,
    splitViewId: (tab as chrome.tabs.Tab & { splitViewId?: number }).splitViewId,
  };
}

const adapter: BrowserAdapter = {
  async listTabs() {
    return (await chrome.tabs.query({})).map(toTab).filter((tab): tab is TabInfo => tab !== undefined);
  },
  async activeTabs() {
    return (await chrome.tabs.query({ active: true })).map(toTab).filter((tab): tab is TabInfo => tab !== undefined);
  },
  async getTab(id) { try { return toTab(await chrome.tabs.get(id)); } catch { return undefined; } },
  async discard(id) { const tab = await chrome.tabs.discard(id); return tab ? toTab(tab) : undefined; },
  async readSettings() { return (await chrome.storage.local.get('settings')).settings; },
  async writeSettings(settings) { await chrome.storage.local.set({ settings }); },
  async readSession() { return (await chrome.storage.session.get('session')).session; },
  async writeSession(session) { await chrome.storage.session.set({ session }); },
  async setAlarm(enabled) {
    if (!enabled) { await chrome.alarms.clear(ALARM); return; }
    if (!await chrome.alarms.get(ALARM)) await chrome.alarms.create(ALARM, { periodInMinutes: 0.5 });
  },
  async setBadge(paused) {
    await chrome.action.setBadgeText({ text: paused ? 'Ⅱ' : '' });
    await chrome.action.setBadgeBackgroundColor({ color: '#5f6368' });
    await chrome.action.setTitle({ title: chrome.i18n.getMessage(paused ? 'actionPaused' : 'actionRunning', [PRODUCT_NAME]) });
  },
  async currentTabId() { return (await chrome.tabs.query({ active: true, lastFocusedWindow: true }))[0]?.id ?? null; },
  version() { return chrome.runtime.getManifest().version; },
};

const controller = new Controller(adapter);
let queue: Promise<unknown> = Promise.resolve();
let refreshQueued = false;

function run<T>(operation: () => Promise<T>, report = true): Promise<T> {
  const result = queue.then(async () => {
    await controller.initialize();
    return operation();
  });
  queue = result.catch(error => {
    if (report) { controller.reportError(error); console.error('Scythe Discards:', error); }
  });
  return result;
}

function refresh(): void {
  if (refreshQueued) return;
  refreshQueued = true;
  void run(async () => {
    refreshQueued = false;
    await controller.refresh();
    await controller.persist();
  }).catch(() => { refreshQueued = false; });
}

// Register listeners before the first await: a restarted worker must not miss events.
chrome.runtime.onMessage.addListener((message: unknown, sender, respond: (reply: Reply) => void) => {
  if (sender.id !== chrome.runtime.id || !message || typeof message !== 'object' || !('type' in message)) return;
  const request = message as Message;
  if (request.type !== 'snapshot' && request.type !== 'sweep') controller.invalidate();
  void run(() => controller.handle(request), false).then(
    data => respond({ ok: true, data }),
    error => respond({ ok: false, error: toErrorData(error) }),
  );
  return true;
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === ALARM) void run(() => controller.sweep());
});
chrome.tabs.onActivated.addListener(() => { controller.invalidate(); refresh(); });
chrome.tabs.onCreated.addListener(refresh);
chrome.tabs.onRemoved.addListener(refresh);
chrome.tabs.onAttached.addListener(() => { controller.invalidate(); refresh(); });
chrome.tabs.onDetached.addListener(() => { controller.invalidate(); refresh(); });
chrome.tabs.onReplaced.addListener((added, removed) => {
  void run(() => controller.replaceTab(added, removed));
});
chrome.tabs.onUpdated.addListener((_id, change) => {
  if ('url' in change || 'pinned' in change || 'audible' in change ||
    'autoDiscardable' in change || 'splitViewId' in change) controller.invalidate();
  if ('discarded' in change || 'url' in change || 'pinned' in change ||
    'audible' in change || 'autoDiscardable' in change || 'splitViewId' in change) refresh();
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) {
    controller.invalidate();
    void run(() => controller.synchronize());
  }
});
chrome.runtime.onStartup.addListener(() => { void run(() => controller.synchronize()); });
chrome.runtime.onInstalled.addListener(() => { void run(() => controller.synchronize()); });
void run(async () => {});
