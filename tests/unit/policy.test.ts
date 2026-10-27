import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS } from '../../src/core/model.ts';
import type { Settings, TabInfo } from '../../src/core/model.ts';
import { decide, matchesAllowlist, normalizeHostname, readSettings, reconcileTabs, retryDelay, rootDomainOf, usedTabIds } from '../../src/core/policy.ts';
import { protectionFor } from '../../src/core/allowlist.ts';

const normal: Settings = structuredClone(DEFAULT_SETTINGS);
const strict: Settings = { ...normal, mode: 'strict' };
const tab = (patch: Partial<TabInfo> = {}): TabInfo => ({
  id: 1, windowId: 1, active: false, url: 'https://example.com/article', ...patch,
});

test('白名單按 hostname 邊界比對，包含與不包含子網域各自正確', () => {
  const rule = { id: 'a', hostname: 'example.com', includeSubdomains: true };
  assert.equal(matchesAllowlist('example.com', [rule]), true);
  assert.equal(matchesAllowlist('docs.example.com', [rule]), true);
  assert.equal(matchesAllowlist('notexample.com', [rule]), false);
  assert.equal(matchesAllowlist('example.com.attacker.test', [rule]), false);
  assert.equal(matchesAllowlist('docs.example.com', [{ ...rule, includeSubdomains: false }]), false);
  assert.equal(matchesAllowlist(null, [rule]), false);
});

test('網站正規化處理網址、大小寫、結尾點及國際化網域，拒絕不支援格式', () => {
  assert.equal(normalizeHostname(' HTTPS://EXAMPLE.COM./somewhere?q=1 '), 'example.com');
  assert.equal(normalizeHostname('例子.台灣'), 'xn--fsqu00a.xn--kpry57d');
  assert.throws(() => normalizeHostname('*.example.com'));
  assert.throws(() => normalizeHostname('chrome://settings'));
  assert.throws(() => normalizeHostname('bad host'));
  assert.throws(() => normalizeHostname(''));
});

test('精確白名單涵蓋同 hostname 的各網址，不含其他或下一層子網域', () => {
  const rule = { id: 'docs', hostname: normalizeHostname('https://docs.google.com/document/d/1'), includeSubdomains: false };
  assert.equal(rule.hostname, 'docs.google.com');
  assert.equal(matchesAllowlist(normalizeHostname('http://docs.google.com:8080/another?q=1'), [rule]), true);
  assert.equal(matchesAllowlist('drive.google.com', [rule]), false);
  assert.equal(matchesAllowlist('a.docs.google.com', [rule]), false);
  assert.equal(matchesAllowlist('google.com', [rule]), false);
});

test('PSL 正確辨識多層及私有後綴，不把共用平台或 IP 當作主網域', () => {
  assert.equal(rootDomainOf('docs.example.co.uk'), 'example.co.uk');
  assert.equal(rootDomainOf('co.uk'), null);
  assert.equal(rootDomainOf('github.io'), null);
  assert.equal(rootDomainOf('project.github.io'), 'project.github.io');
  assert.equal(rootDomainOf('a.project.github.io'), 'project.github.io');
  assert.equal(rootDomainOf('127.0.0.1'), null);
  assert.equal(rootDomainOf('[::1]'), null);
  assert.equal(rootDomainOf('localhost'), null);
});

test('popup 區分直接規則、上層涵蓋與整個主網域範圍', () => {
  const parent = { id: 'parent', hostname: 'example.com', includeSubdomains: true };
  const child = { id: 'child', hostname: 'docs.example.com', includeSubdomains: false };
  const inherited = protectionFor('docs.example.com', 'host', [parent]);
  assert.equal(inherited.checked, true);
  assert.equal(inherited.inherited?.id, 'parent');
  assert.equal(inherited.ownRule, undefined);
  const own = protectionFor('docs.example.com', 'host', [parent, child]);
  assert.equal(own.ownRule?.id, 'child');
  assert.equal(own.inherited, undefined);
  const domain = protectionFor('docs.example.com', 'domain', [parent, child]);
  assert.equal(domain.ownRule?.id, 'parent');
  assert.deepEqual(domain.target, { hostname: 'example.com', includeSubdomains: true });
  assert.equal(protectionFor('docs.example.com', 'domain', [child]).checked, false);
});

test('分頁使用很久後才切走，仍給完整的閒置期間', () => {
  let state = reconcileTabs([tab({ active: true })], {}, normal, 1_000);
  state = reconcileTabs([tab()], state, normal, 7_201_000);
  assert.equal(state[1]?.inactiveSince, 7_201_000);
  assert.equal(decide(tab(), state[1], normal, 7_201_001).reason, 'waiting');
  assert.equal(decide(tab(), state[1], normal, 9_001_000).reason, 'due');
});

test('背景重新整理及音訊不重設嚴格模式的計時；切回再切走才重設', () => {
  let state = reconcileTabs([tab()], {}, strict, 1_000);
  state = reconcileTabs([tab({ audible: true, url: 'https://example.com/updated' })], state, strict, 100_000);
  assert.equal(state[1]?.inactiveSince, 1_000);
  state = reconcileTabs([tab({ active: true })], state, strict, 200_000);
  assert.equal(state[1]?.inactiveSince, null);
  state = reconcileTabs([tab()], state, strict, 300_000);
  assert.equal(state[1]?.inactiveSince, 300_000);
});

test('嚴格模式略過軟性保護，一般模式保留釘選、音訊與原生保護', () => {
  for (const [patch, reason] of [
    [{ pinned: true }, 'pinned'], [{ audible: true }, 'audible'], [{ autoDiscardable: false }, 'auto-protected'],
  ] as const) {
    const target = tab(patch);
    const state = reconcileTabs([target], {}, normal, 0);
    assert.equal(decide(target, state[1], normal, 2_000_000).reason, reason);
    assert.equal(decide(target, state[1], strict, 2_000_000).reason, 'due');
  }
});

test('嚴格模式仍尊重白名單、手動保護、active、已卸載及不支援 URL', () => {
  const settings: Settings = { ...strict, allowlist: [{ id: 'a', hostname: 'example.com', includeSubdomains: false }] };
  const state = reconcileTabs([tab()], {}, settings, 0);
  assert.equal(decide(tab(), state[1], settings, 2_000_000).reason, 'allowlist');
  assert.equal(decide(tab(), { ...state[1]!, manualProtected: true }, strict, 2_000_000).reason, 'manual');
  assert.equal(decide(tab({ active: true }), state[1], strict, 2_000_000).reason, 'active');
  assert.equal(decide(tab({ discarded: true }), state[1], strict, 2_000_000).reason, 'discarded');
  assert.equal(decide(tab({ url: 'chrome://settings' }), state[1], strict, 2_000_000).reason, 'unsupported');
});

test('多視窗與 split view 只保護同視窗的有效分割群組，NONE 不保護整個視窗', () => {
  const tabs = [tab({ active: true, splitViewId: 9 }), tab({ id: 2, splitViewId: 9 }),
    tab({ id: 3, windowId: 2, splitViewId: 9 }), tab({ id: 4, splitViewId: -1 }),
    tab({ id: 5, windowId: 3, active: true, splitViewId: -1 }), tab({ id: 6, windowId: 3, splitViewId: -1 })];
  assert.deepEqual([...usedTabIds(tabs)].sort(), [1, 2, 5]);
});

test('移除最後一項網站保護後，給完整新期限；切換嚴格模式不重設期限', () => {
  const protectedSettings: Settings = { ...normal, allowlist: [{ id: 'a', hostname: 'example.com', includeSubdomains: false }] };
  let state = reconcileTabs([tab()], {}, protectedSettings, 0);
  state = reconcileTabs([tab()], state, normal, 3_000_000);
  assert.equal(state[1]?.inactiveSince, 3_000_000);
  state = reconcileTabs([tab()], state, strict, 4_000_000);
  assert.equal(state[1]?.inactiveSince, 3_000_000);
});

test('worker 恢復保留原時間；缺少 session 才重新起算；移除已關閉分頁', () => {
  const first = reconcileTabs([tab()], {}, strict, 1_000);
  assert.equal(reconcileTabs([tab()], structuredClone(first), strict, 2_000_000)[1]?.inactiveSince, 1_000);
  assert.equal(reconcileTabs([tab()], {}, strict, 2_000_000)[1]?.inactiveSince, 2_000_000);
  assert.deepEqual(reconcileTabs([], first, strict, 2_000_000), {});
});

test('重試退避為 30、60、120、300 秒，持續失敗維持上限', () => {
  assert.deepEqual([1, 2, 3, 4, 20].map(retryDelay), [30_000, 60_000, 120_000, 300_000, 300_000]);
});

test('儲存資料損壞時恢復有效預設值，拒絕錯誤白名單', () => {
  assert.equal(readSettings({ timeoutMinutes: -5 }).timeoutMinutes, 30);
  assert.equal(readSettings({ mode: 'unknown' }).mode, 'normal');
  assert.deepEqual(readSettings({ allowlist: [{ hostname: '*' }] }).allowlist, []);
});
