import type { ErrorData } from './errors.ts';

export type Mode = 'normal' | 'strict';
export type Theme = 'system' | 'light' | 'dark';

export interface AllowRule {
  id: string;
  hostname: string;
  includeSubdomains: boolean;
}

export interface Settings {
  version: 1;
  mode: Mode;
  timeoutMinutes: number;
  paused: boolean;
  theme: Theme;
  allowlist: AllowRule[];
}

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  mode: 'normal',
  timeoutMinutes: 30,
  paused: false,
  theme: 'system',
  allowlist: [],
};

export interface TabInfo {
  id: number;
  windowId: number;
  active: boolean;
  url?: string;
  title?: string;
  discarded?: boolean;
  pinned?: boolean;
  audible?: boolean;
  autoDiscardable?: boolean;
  splitViewId?: number;
}

export interface TabState {
  id: number;
  windowId: number;
  inUse: boolean;
  inactiveSince: number | null;
  manualProtected: boolean;
  hardProtected: boolean;
  discarded: boolean;
  failures: number;
  retryAt: number | null;
}

export type Reason = 'paused' | 'active' | 'split-view' | 'discarded' |
  'unsupported' | 'allowlist' | 'manual' | 'pinned' | 'audible' |
  'auto-protected' | 'waiting' | 'retrying' | 'due';

export interface Decision { reason: Reason; dueAt: number | null }

export const MAX_ACTIVITIES = 200;
export type ActivityCode = 'discard-normal' | 'discard-strict' | 'restored' | 'discard-failed';
export interface Activity {
  id: string;
  at: number;
  tabId: number;
  hostname: string;
  kind: 'discarded' | 'failed' | 'restored';
  code: ActivityCode;
  error?: ErrorData;
}

export interface Session {
  version: 1;
  tabs: Record<string, TabState>;
  activities: Activity[];
  lastSweepAt: number | null;
  lastError: ErrorData | null;
}

export function emptySession(): Session {
  return { version: 1, tabs: {}, activities: [], lastSweepAt: null, lastError: null };
}

export interface TabView extends TabInfo, Decision {
  hostname: string;
  manualProtected: boolean;
  inactiveSince: number | null;
}

export interface Snapshot {
  settings: Settings;
  tabs: TabView[];
  activities: Activity[];
  lastSweepAt: number | null;
  lastError: ErrorData | null;
  currentTabId: number | null;
  version: string;
}

export type Message =
  | { type: 'snapshot' }
  | { type: 'settings'; mode: Mode; timeoutMinutes: number }
  | { type: 'theme'; theme: Theme }
  | { type: 'pause'; paused: boolean }
  | { type: 'allow-add'; hostname: string; includeSubdomains: boolean }
  | { type: 'allow-remove'; id: string }
  | { type: 'protect'; tabId: number; protected: boolean }
  | { type: 'clear-activities' }
  | { type: 'sweep' };

export type Reply = { ok: true; data: Snapshot } | { ok: false; error: ErrorData };
