import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Controller } from '../../src/core/controller.ts';
import type { BrowserAdapter } from '../../src/core/controller.ts';
import { DEFAULT_SETTINGS } from '../../src/core/model.ts';
import type { Session, Settings, TabInfo } from '../../src/core/model.ts';

class FakeBrowser implements BrowserAdapter {
  settings: Settings = { ...structuredClone(DEFAULT_SETTINGS), mode: 'strict', timeoutMinutes: 1 };
  session: Session | undefined;
  tabs: TabInfo[] = [{ id: 1, windowId: 1, active: true, url: 'https://active.test' },
    { id: 2, windowId: 1, active: false, url: 'https://background.test' }];
  discarded: number[] = [];
  alarm = true;
  fail = false;
  failStorage = false;
  beforeGet: (() => void) | undefined;
  afterDiscard: (() => void) | undefined;
  async listTabs() { return structuredClone(this.tabs); }
  async activeTabs() { return structuredClone(this.tabs.filter(tab => tab.active)); }
  async getTab(id: number) { this.beforeGet?.(); return structuredClone(this.tabs.find(tab => tab.id === id)); }
  async discard(id: number) {
    if (this.fail) throw new Error('Chrome 拒絕');
    const tab = this.tabs.find(tab => tab.id === id);
    if (!tab || tab.active) throw new Error('不能卸載使用中分頁');
    tab.discarded = true; this.discarded.push(id); this.afterDiscard?.();
    return structuredClone(tab);
  }
  async readSettings() { return structuredClone(this.settings); }
  async writeSettings(value: Settings) { this.settings = structuredClone(value); }
  async readSession() { return structuredClone(this.session); }
  async writeSession(value: Session) { if (this.failStorage) throw new Error('儲存失敗'); this.session = structuredClone(value); }
  async setAlarm(enabled: boolean) { this.alarm = enabled; }
  async setBadge() {}
  async currentTabId() { return this.tabs.find(tab => tab.active)?.id ?? null; }
  version() { return 'test'; }
}

async function setup() {
  const browser = new FakeBrowser();
  let now = 10_000;
  const controller = new Controller(browser, () => now);
  await controller.initialize();
  return { browser, controller, advance: (ms: number) => { now += ms; }, time: () => now };
}

test('只卸載到期背景頁，成功確認後才記錄', async () => {
  const { browser, controller, advance } = await setup();
  await controller.sweep(); assert.deepEqual(browser.discarded, []);
  advance(60_000); await controller.sweep();
  assert.deepEqual(browser.discarded, [2]);
  assert.equal(controller.session.activities[0]?.kind, 'discarded');
  await controller.sweep(); assert.deepEqual(browser.discarded, [2]);
});

test('切換成 active 的競態會在 API 前重新檢查', async () => {
  const { browser, controller, advance } = await setup();
  advance(60_000);
  browser.beforeGet = () => { browser.tabs[1]!.active = true; };
  await controller.sweep();
  assert.deepEqual(browser.discarded, []);
});

test('候選排隊後白名單改變，執行前使用最新設定', async () => {
  const { browser, controller, advance } = await setup();
  browser.tabs.push({ id: 3, windowId: 1, active: false, url: 'https://keep.test' });
  await controller.refresh(); advance(60_000);
  browser.afterDiscard = () => { browser.settings.allowlist = [{ id: 'k', hostname: 'keep.test', includeSubdomains: true }]; };
  await controller.sweep();
  assert.deepEqual(browser.discarded, [2]);
});

test('收到新的保護操作會中止舊候選佇列', async () => {
  const { browser, controller, advance } = await setup();
  browser.tabs.push({ id: 3, windowId: 1, active: false, url: 'https://other.test' });
  await controller.refresh(); advance(60_000);
  browser.afterDiscard = () => controller.invalidate();
  await controller.sweep();
  assert.deepEqual(browser.discarded, [2]);
});

test('失敗會退避，不會偽報成功，也不重設閒置起點', async () => {
  const { browser, controller, advance, time } = await setup();
  browser.fail = true; advance(60_000); await controller.sweep();
  const state = controller.session.tabs[2]!;
  assert.equal(state.inactiveSince, 10_000);
  assert.equal(state.retryAt, time() + 30_000);
  assert.equal(controller.session.activities[0]?.kind, 'failed');
  advance(10_000); await controller.sweep();
  assert.equal(controller.session.activities.length, 1);
  browser.fail = false; advance(20_000); await controller.sweep();
  assert.deepEqual(browser.discarded, [2]);
});

test('worker 重啟沿用計時，瀏覽器工作階段重建給完整期限', async () => {
  const { browser, advance, time } = await setup();
  advance(60_000);
  const restarted = new Controller(browser, time); await restarted.initialize(); await restarted.sweep();
  assert.deepEqual(browser.discarded, [2]);
  browser.tabs[1]!.discarded = false; browser.session = undefined; browser.discarded = [];
  const newSession = new Controller(browser, time); await newSession.initialize(); await newSession.sweep();
  assert.deepEqual(browser.discarded, []);
});

test('暫停停用排程，恢復後重新開始完整倒數', async () => {
  const { browser, controller, advance, time } = await setup();
  await controller.handle({ type: 'pause', paused: true }); assert.equal(browser.alarm, false);
  advance(600_000); await controller.sweep(); assert.deepEqual(browser.discarded, []);
  await controller.handle({ type: 'pause', paused: false }); assert.equal(browser.alarm, true);
  assert.equal(controller.session.tabs[2]?.inactiveSince, time());
  await controller.sweep(); assert.deepEqual(browser.discarded, []);
});

test('手動保護跨 worker 恢復，解除後給完整新倒數', async () => {
  const { browser, controller, advance, time } = await setup();
  await controller.handle({ type: 'protect', tabId: 2, protected: true });
  advance(600_000);
  const restarted = new Controller(browser, time); await restarted.initialize(); await restarted.sweep();
  assert.deepEqual(browser.discarded, []);
  await restarted.handle({ type: 'protect', tabId: 2, protected: false });
  assert.equal(restarted.session.tabs[2]?.inactiveSince, time());
});

test('持久化失敗時不繼續卸載', async () => {
  const { browser, controller, advance } = await setup();
  advance(60_000); browser.failStorage = true;
  await assert.rejects(controller.sweep(), /儲存失敗/);
  assert.deepEqual(browser.discarded, []);
});

test('tab ID 被替換時，手動保護轉移到新分頁', async () => {
  const { browser, controller } = await setup();
  await controller.handle({ type: 'protect', tabId: 2, protected: true });
  browser.tabs[1]!.id = 8;
  await controller.replaceTab(8, 2);
  assert.equal(controller.session.tabs[8]?.manualProtected, true);
  assert.equal(controller.session.tabs[2], undefined);
});

test('Chrome 在 discard 時更換 tab ID，仍保留時間並用新 ID 記錄成功', async () => {
  const { browser, controller, advance } = await setup();
  browser.afterDiscard = () => { browser.tabs[1]!.id = 9; };
  advance(60_000); await controller.sweep();
  assert.equal(controller.session.tabs[2], undefined);
  assert.equal(controller.session.tabs[9]?.inactiveSince, 10_000);
  assert.equal(controller.session.tabs[9]?.discarded, true);
  assert.equal(controller.session.activities[0]?.tabId, 9);
});

test('連續 250 次恢復只保留最新 200 筆紀錄，讀回超量資料仍截斷', async () => {
  const { browser, controller, advance, time } = await setup();
  for (let index = 0; index < 250; index++) {
    browser.tabs[1]!.discarded = true;
    await controller.refresh();
    advance(1);
    browser.tabs[1]!.discarded = false;
    await controller.refresh();
  }
  assert.equal(controller.session.activities.length, 200);
  assert.equal(controller.session.activities[0]?.at, 10_250);
  assert.equal(controller.session.activities[199]?.at, 10_051);
  assert.ok(controller.session.activities.every(activity => activity.kind === 'restored'));
  await controller.persist();
  const retained = structuredClone(controller.session.activities);
  browser.session!.activities.push(...structuredClone(retained));
  const restarted = new Controller(browser, time);
  await restarted.initialize();
  assert.deepEqual(restarted.session.activities, retained);
  assert.equal(browser.session?.activities.length, 200);
});

test('清除紀錄持久化，保留設定、計時與保護狀態', async () => {
  const { browser, controller, advance, time } = await setup();
  advance(60_000); await controller.sweep();
  await controller.handle({ type: 'protect', tabId: 2, protected: true });
  const before = structuredClone(controller.session.tabs);
  await controller.handle({ type: 'clear-activities' });
  assert.equal(browser.session?.activities.length, 0);
  assert.deepEqual(controller.session.tabs, before);
  const restarted = new Controller(browser, time);
  await restarted.initialize();
  assert.equal(restarted.session.activities.length, 0);
  assert.equal(restarted.session.tabs[2]?.manualProtected, true);
  assert.equal(restarted.settings.mode, 'strict');
});

test('加入或撤銷精確規則不縮小既有子網域保護，舊 id 不能移除新規則', async () => {
  const { controller } = await setup();
  await controller.handle({ type: 'allow-add', hostname: 'example.com', includeSubdomains: false });
  const oldId = controller.settings.allowlist[0]!.id;
  await controller.handle({ type: 'allow-add', hostname: 'example.com', includeSubdomains: true });
  const broader = structuredClone(controller.settings.allowlist[0]!);
  assert.notEqual(broader.id, oldId);
  await controller.handle({ type: 'allow-add', hostname: 'example.com', includeSubdomains: false });
  assert.deepEqual(controller.settings.allowlist[0], broader);
  await assert.rejects(controller.handle({ type: 'allow-remove', id: oldId }), { code: 'rule-not-found' });
  assert.deepEqual(controller.settings.allowlist[0], broader);
});

test('禁止公共後綴與 IP 的子網域規則，錯誤以代碼回傳', async () => {
  const { controller } = await setup();
  for (const hostname of ['com', 'co.uk', 'github.io', '127.0.0.1', 'localhost']) {
    await assert.rejects(controller.handle({ type: 'allow-add', hostname, includeSubdomains: true }), { code: 'unsafe-domain' });
  }
  assert.equal(controller.settings.allowlist.length, 0);
  await assert.rejects(controller.handle({ type: 'settings', mode: 'normal', timeoutMinutes: 0 }), { code: 'invalid-timeout' });
});
