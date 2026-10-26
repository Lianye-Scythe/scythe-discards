import { getDomain } from 'tldts';
import { AppError } from './errors.ts';
import { DEFAULT_SETTINGS } from './model.ts';
import type { AllowRule, Decision, Settings, TabInfo, TabState } from './model.ts';

export function hostnameOf(value: string | undefined): string | null {
  try {
    const url = new URL(value ?? '');
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.hostname.toLowerCase().replace(/\.+$/, '') || null;
  } catch { return null; }
}

export function normalizeHostname(value: string): string {
  const input = value.trim();
  if (!input || /[\s*]/u.test(input)) throw new AppError('invalid-host');
  const hostname = hostnameOf(input.includes('://') ? input : `https://${input}`);
  if (!hostname || hostname.startsWith('.') || hostname.includes('..')) {
    throw new AppError('unrecognized-host');
  }
  return hostname;
}

export function rootDomainOf(hostname: string): string | null {
  return getDomain(hostname, { allowPrivateDomains: true, validateHostname: true });
}

export function matchingRules(hostname: string | null, rules: AllowRule[]): AllowRule[] {
  if (!hostname) return [];
  return rules.filter(rule => hostname === rule.hostname ||
    (rule.includeSubdomains && hostname.endsWith('.' + rule.hostname)));
}

export function matchesAllowlist(hostname: string | null, rules: AllowRule[]): boolean {
  if (!hostname) return false;
  return rules.some(rule => hostname === rule.hostname ||
    (rule.includeSubdomains && hostname.endsWith('.' + rule.hostname)));
}

export function validTimeout(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && Number.isSafeInteger(value * 60_000 + Date.now());
}

export function readSettings(value: unknown): Settings {
  if (!value || typeof value !== 'object') return structuredClone(DEFAULT_SETTINGS);
  const source = value as Partial<Settings>;
  const allowlist: AllowRule[] = [];
  if (Array.isArray(source.allowlist)) {
    for (const rule of source.allowlist) {
      if (!rule || typeof rule.hostname !== 'string') continue;
      try {
        allowlist.push({
          id: typeof rule.id === 'string' ? rule.id : crypto.randomUUID(),
          hostname: normalizeHostname(rule.hostname),
          includeSubdomains: rule.includeSubdomains === true && rootDomainOf(normalizeHostname(rule.hostname)) !== null,
        });
      } catch { /* Ignore invalid imported rules, never treat them as URL patterns. */ }
    }
  }
  return {
    version: 1,
    mode: source.mode === 'strict' ? 'strict' : 'normal',
    timeoutMinutes: typeof source.timeoutMinutes === 'number' && validTimeout(source.timeoutMinutes)
      ? source.timeoutMinutes : DEFAULT_SETTINGS.timeoutMinutes,
    paused: source.paused === true,
    theme: source.theme === 'dark' || source.theme === 'light' ? source.theme : 'system',
    allowlist,
  };
}

export function usedTabIds(tabs: TabInfo[]): Set<number> {
  const used = new Set<number>();
  const splitGroups = new Set<string>();
  for (const tab of tabs) {
    if (!tab.active) continue;
    used.add(tab.id);
    if (typeof tab.splitViewId === 'number' && tab.splitViewId >= 0) {
      splitGroups.add(`${tab.windowId}:${tab.splitViewId}`);
    }
  }
  for (const tab of tabs) {
    if (typeof tab.splitViewId === 'number' && tab.splitViewId >= 0 &&
      splitGroups.has(`${tab.windowId}:${tab.splitViewId}`)) used.add(tab.id);
  }
  return used;
}

export function reconcileTabs(
  tabs: TabInfo[], previous: Record<string, TabState>, settings: Settings,
  now: number, resetBackground = false,
): Record<string, TabState> {
  const used = usedTabIds(tabs);
  const next: Record<string, TabState> = {};
  for (const tab of tabs) {
    const old = previous[tab.id];
    const inUse = used.has(tab.id);
    const manualProtected = old?.manualProtected ?? false;
    const hardProtected = manualProtected || matchesAllowlist(hostnameOf(tab.url), settings.allowlist);
    const reset = !old || old.inUse || resetBackground || (old.hardProtected && !hardProtected);
    const inactiveSince = inUse ? null : reset ? now : old.inactiveSince ?? now;
    const resetRetry = inUse || reset || hardProtected;
    next[tab.id] = {
      id: tab.id, windowId: tab.windowId, inUse, inactiveSince,
      manualProtected, hardProtected,
      discarded: tab.discarded === true,
      failures: resetRetry ? 0 : old.failures,
      retryAt: resetRetry ? null : old.retryAt,
    };
  }
  return next;
}

export function decide(tab: TabInfo, state: TabState | undefined, settings: Settings, now: number): Decision {
  const dueAt = state?.inactiveSince == null ? null : state.inactiveSince + settings.timeoutMinutes * 60_000;
  const decision = (reason: Decision['reason']): Decision => ({ reason, dueAt });
  if (tab.discarded) return decision('discarded');
  if (tab.active) return decision('active');
  if (state?.inUse) return decision('split-view');
  const hostname = hostnameOf(tab.url);
  if (!hostname) return decision('unsupported');
  if (matchesAllowlist(hostname, settings.allowlist)) return decision('allowlist');
  if (state?.manualProtected) return decision('manual');
  if (settings.paused) return decision('paused');
  if (settings.mode === 'normal') {
    if (tab.pinned) return decision('pinned');
    if (tab.audible) return decision('audible');
    if (tab.autoDiscardable === false) return decision('auto-protected');
  }
  if (state?.retryAt != null && state.retryAt > now) return decision('retrying');
  return decision(dueAt != null && dueAt <= now ? 'due' : 'waiting');
}

export function retryDelay(failureCount: number): number {
  return [30_000, 60_000, 120_000, 300_000][Math.min(3, Math.max(0, failureCount - 1))]!;
}
