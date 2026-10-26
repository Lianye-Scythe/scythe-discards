import { emptySession, MAX_ACTIVITIES } from './model.ts';
import type { Activity, ActivityCode, Message, Session, Settings, Snapshot, TabInfo, TabState } from './model.ts';
import { decide, hostnameOf, normalizeHostname, readSettings, reconcileTabs, retryDelay, rootDomainOf, usedTabIds, validTimeout } from './policy.ts';
import { AppError, toErrorData } from './errors.ts';
import type { ErrorData } from './errors.ts';

export interface BrowserAdapter {
  listTabs(): Promise<TabInfo[]>;
  activeTabs(): Promise<TabInfo[]>;
  getTab(id: number): Promise<TabInfo | undefined>;
  discard(id: number): Promise<TabInfo | undefined>;
  readSettings(): Promise<unknown>;
  writeSettings(settings: Settings): Promise<void>;
  readSession(): Promise<unknown>;
  writeSession(session: Session): Promise<void>;
  setAlarm(enabled: boolean): Promise<void>;
  setBadge(paused: boolean): Promise<void>;
  currentTabId(): Promise<number | null>;
  version(): string;
}

function readSession(value: unknown): Session {
  const fresh = emptySession();
  if (!value || typeof value !== 'object') return fresh;
  const data = value as Partial<Session>;
  if (data.version !== 1) return fresh;
  if (data.tabs && typeof data.tabs === 'object') {
    for (const [key, state] of Object.entries(data.tabs)) {
      if (!state || !Number.isInteger(state.id) || String(state.id) !== key ||
        !Number.isInteger(state.windowId)) continue;
      fresh.tabs[key] = {
        id: state.id, windowId: state.windowId,
        inUse: state.inUse === true,
        inactiveSince: typeof state.inactiveSince === 'number' && Number.isFinite(state.inactiveSince)
          ? state.inactiveSince : null,
        manualProtected: state.manualProtected === true,
        hardProtected: state.hardProtected === true,
        discarded: state.discarded === true,
        failures: Number.isSafeInteger(state.failures) && state.failures > 0 ? Math.min(state.failures, 20) : 0,
        retryAt: typeof state.retryAt === 'number' && Number.isFinite(state.retryAt) ? state.retryAt : null,
      };
    }
  }
  if (Array.isArray(data.activities)) {
    fresh.activities = data.activities.flatMap((item: unknown): Activity[] => {
      if (!item || typeof item !== 'object') return [];
      const entry = item as Partial<Activity> & { detail?: unknown };
      if (typeof entry.id !== 'string' || typeof entry.at !== 'number' || !Number.isFinite(entry.at) ||
        !Number.isInteger(entry.tabId) || typeof entry.hostname !== 'string' ||
        (entry.kind !== 'discarded' && entry.kind !== 'failed' && entry.kind !== 'restored')) return [];
      const legacy = typeof entry.detail === 'string' ? entry.detail : undefined;
      const code: ActivityCode = entry.kind === 'restored' ? 'restored' :
        entry.kind === 'failed' ? 'discard-failed' :
          entry.code === 'discard-strict' || legacy === '嚴格模式逾時卸載' ? 'discard-strict' : 'discard-normal';
      return [{ id: entry.id, at: entry.at, tabId: entry.tabId!, hostname: entry.hostname,
        kind: entry.kind, code, ...(entry.kind === 'failed' ? { error: toErrorData(entry.error ?? legacy) } : {}) }];
    }).slice(0, MAX_ACTIVITIES);
  }
  fresh.lastSweepAt = typeof data.lastSweepAt === 'number' ? data.lastSweepAt : null;
  fresh.lastError = data.lastError ? toErrorData(data.lastError) : null;
  return fresh;
}

export class Controller {
  settings = readSettings(undefined);
  session = emptySession();
  initialized = false;
  private generation = 0;

  private readonly browser: BrowserAdapter;
  private readonly now: () => number;

  constructor(browser: BrowserAdapter, now = () => Date.now()) {
    this.browser = browser;
    this.now = now;
  }

  invalidate(): void { this.generation++; }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.settings = readSettings(await this.browser.readSettings());
    this.session = readSession(await this.browser.readSession());
    await this.refresh();
    await this.browser.writeSettings(this.settings);
    await this.browser.setAlarm(!this.settings.paused);
    await this.browser.setBadge(this.settings.paused);
    await this.persist();
    this.initialized = true;
  }

  async refresh(resetBackground = false): Promise<TabInfo[]> {
    const tabs = await this.browser.listTabs();
    const previous = this.session.tabs;
    this.session.tabs = reconcileTabs(tabs, previous, this.settings, this.now(), resetBackground);
    for (const tab of tabs) {
      if (previous[tab.id]?.discarded && !tab.discarded) {
        this.log(tab, 'restored');
      }
    }
    return tabs;
  }

  async persist(): Promise<void> { await this.browser.writeSession(this.session); }

  private log(tab: TabInfo, code: ActivityCode, error?: ErrorData): void {
    const kind = code === 'restored' ? 'restored' : code === 'discard-failed' ? 'failed' : 'discarded';
    this.session.activities.unshift({
      id: crypto.randomUUID(), at: this.now(), tabId: tab.id,
      hostname: hostnameOf(tab.url) ?? '', kind, code, ...(error ? { error } : {}),
    });
    this.session.activities.length = Math.min(this.session.activities.length, MAX_ACTIVITIES);
  }

  reportError(error: unknown): void {
    this.session.lastError = toErrorData(error);
  }

  async synchronize(): Promise<void> {
    const old = this.settings;
    this.settings = readSettings(await this.browser.readSettings());
    await this.refresh(old.paused && !this.settings.paused);
    await this.browser.setAlarm(!this.settings.paused);
    await this.browser.setBadge(this.settings.paused);
    await this.persist();
  }

  async replaceTab(addedId: number, removedId: number): Promise<void> {
    const old = this.session.tabs[removedId];
    if (old) {
      this.session.tabs[addedId] = { ...old, id: addedId };
      delete this.session.tabs[removedId];
    }
    await this.refresh();
    await this.persist();
  }

  async snapshot(): Promise<Snapshot> {
    const tabs = await this.refresh();
    await this.persist();
    return {
      settings: structuredClone(this.settings),
      tabs: tabs.map(tab => ({
        ...tab, ...decide(tab, this.session.tabs[tab.id], this.settings, this.now()),
        hostname: hostnameOf(tab.url) ?? 'Chrome',
        manualProtected: this.session.tabs[tab.id]?.manualProtected ?? false,
        inactiveSince: this.session.tabs[tab.id]?.inactiveSince ?? null,
      })),
      activities: structuredClone(this.session.activities),
      lastSweepAt: this.session.lastSweepAt, lastError: this.session.lastError,
      currentTabId: await this.browser.currentTabId(), version: this.browser.version(),
    };
  }

  async handle(message: Message): Promise<Snapshot> {
    switch (message.type) {
      case 'snapshot': return this.snapshot();
      case 'settings': {
        if (message.mode !== 'normal' && message.mode !== 'strict') throw new AppError('invalid-mode');
        if (!validTimeout(message.timeoutMinutes)) throw new AppError('invalid-timeout');
        await this.saveSettings({ ...this.settings, mode: message.mode, timeoutMinutes: message.timeoutMinutes });
        break;
      }
      case 'theme': {
        if (!['system', 'light', 'dark'].includes(message.theme)) throw new AppError('invalid-theme');
        await this.saveSettings({ ...this.settings, theme: message.theme });
        break;
      }
      case 'pause': {
        if (typeof message.paused !== 'boolean') throw new AppError('invalid-pause');
        const resume = this.settings.paused && !message.paused;
        await this.saveSettings({ ...this.settings, paused: message.paused });
        if (resume) await this.refresh(true);
        break;
      }
      case 'allow-add': {
        if (typeof message.hostname !== 'string') throw new AppError('invalid-host');
        const hostname = normalizeHostname(message.hostname);
        const includeSubdomains = message.includeSubdomains === true;
        if (includeSubdomains && !rootDomainOf(hostname)) throw new AppError('unsafe-domain');
        const existing = this.settings.allowlist.find(rule => rule.hostname === hostname);
        // An exact add/undo must never silently narrow an existing broader rule.
        if (existing && (existing.includeSubdomains || !includeSubdomains)) break;
        const rules = this.settings.allowlist.filter(rule => rule.hostname !== hostname);
        rules.push({ id: crypto.randomUUID(), hostname, includeSubdomains });
        await this.saveSettings({ ...this.settings, allowlist: rules });
        break;
      }
      case 'allow-remove': {
        if (!this.settings.allowlist.some(rule => rule.id === message.id)) throw new AppError('rule-not-found');
        await this.saveSettings({ ...this.settings,
          allowlist: this.settings.allowlist.filter(rule => rule.id !== message.id) });
        break;
      }
      case 'protect': {
        if (!Number.isInteger(message.tabId) || typeof message.protected !== 'boolean') throw new AppError('invalid-tab');
        const tab = await this.browser.getTab(message.tabId);
        if (!tab) throw new AppError('tab-closed');
        await this.refresh();
        const state = this.session.tabs[message.tabId];
        if (!state) throw new AppError('tab-missing');
        state.manualProtected = message.protected;
        // Keep the previous hardProtected value until reconciliation so that
        // removing the final protection grants a complete new timeout.
        await this.refresh();
        break;
      }
      case 'clear-activities': this.session.activities = []; break;
      case 'sweep': await this.sweep(); break;
      default: throw new AppError('unsupported-message');
    }
    await this.persist();
    return this.snapshot();
  }

  private async saveSettings(settings: Settings): Promise<void> {
    await this.browser.writeSettings(settings);
    this.settings = settings;
    await this.browser.setAlarm(!settings.paused);
    await this.browser.setBadge(settings.paused);
    await this.refresh();
  }

  async sweep(): Promise<void> {
    const generation = this.generation;
    const started = this.now();
    this.settings = readSettings(await this.browser.readSettings());
    const tabs = await this.refresh();
    this.session.lastSweepAt = started;
    this.session.lastError = null;
    await this.persist();
    if (this.settings.paused) return;
    const candidates = tabs.filter(tab => decide(tab, this.session.tabs[tab.id], this.settings, started).reason === 'due')
      .sort((a, b) => (this.session.tabs[a.id]?.inactiveSince ?? started) -
        (this.session.tabs[b.id]?.inactiveSince ?? started));

    for (const candidate of candidates) {
      if (this.generation !== generation || this.now() - started > 15_000) break;
      this.settings = readSettings(await this.browser.readSettings());
      const current = await this.browser.getTab(candidate.id);
      if (!current) { delete this.session.tabs[candidate.id]; continue; }
      const activeTabs = await this.browser.activeTabs();
      const state = this.session.tabs[current.id];
      const currentState = state ? { ...state, inUse: usedTabIds([...activeTabs, current]).has(current.id) } : undefined;
      if (this.generation !== generation || !current ||
        decide(current, currentState, this.settings, this.now()).reason !== 'due') continue;
      await this.persist();
      try {
        const result = await this.browser.discard(current.id);
        const confirmed = result?.discarded ? result : await this.browser.getTab(result?.id ?? current.id);
        if (!confirmed?.discarded) throw new AppError('discard-unconfirmed');
        const state = this.session.tabs[current.id];
        if (state) {
          const updated: TabState = { ...state, id: confirmed.id, windowId: confirmed.windowId,
            discarded: true, failures: 0, retryAt: null };
          if (confirmed.id !== current.id) delete this.session.tabs[current.id];
          this.session.tabs[confirmed.id] = updated;
        }
        this.log(confirmed, this.settings.mode === 'strict' ? 'discard-strict' : 'discard-normal');
      } catch (error) {
        const stillExists = await this.browser.getTab(current.id);
        if (!stillExists) { delete this.session.tabs[current.id]; continue; }
        const state = this.session.tabs[current.id];
        if (state) {
          state.failures++;
          state.retryAt = this.now() + retryDelay(state.failures);
        }
        this.log(current, 'discard-failed', toErrorData(error));
      }
      await this.persist();
    }
  }
}
