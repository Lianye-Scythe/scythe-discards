import en from './en.json' with { type: 'json' };
import type { Activity, Reason } from '../core/model.ts';
import type { ErrorCode, ErrorData } from '../core/errors.ts';
export type MessageKey = keyof typeof en;

export function t(key: MessageKey, substitutions: (string | number)[] = []): string {
  const values = substitutions.map(String);
  const native = globalThis.chrome?.i18n?.getMessage(key, values);
  return native || en[key].replace(/\$(\d)/g, (_match, position: string) => values[Number(position) - 1] ?? '');
}
export const locale = t('languageTag');
export function initializeLocale(): void {
  document.documentElement.lang = locale;
}
export const number = (value: number): string => new Intl.NumberFormat(locale).format(value);
export const tabCount = (value: number): string => t(value === 1 ? 'tabOne' : 'tabOther', [number(value)]);
export const websiteCount = (value: number): string => t(value === 1 ? 'websiteOne' : 'websiteOther', [number(value)]);
export const tabSummary = (total: number, discarded: number): string =>
  t('popupSummary', [tabCount(total), t('discardedCount', [number(discarded)])]);

const reasonKeys: Record<Reason, MessageKey> = {
  paused: 'reasonPaused', active: 'reasonActive', 'split-view': 'reasonSplitView',
  discarded: 'reasonDiscarded', unsupported: 'reasonUnsupported', allowlist: 'reasonAllowlist',
  manual: 'reasonManual', pinned: 'reasonPinned', audible: 'reasonAudible',
  'auto-protected': 'reasonAutoProtected', waiting: 'reasonWaiting', retrying: 'reasonRetrying', due: 'reasonDue',
};
export const reasonText = (reason: Reason): string => t(reasonKeys[reason]);
const errorKeys: Record<ErrorCode, MessageKey> = {
  'invalid-host': 'errorInvalidHost', 'unrecognized-host': 'errorUnrecognizedHost',
  'unsafe-domain': 'errorUnsafeDomain', 'invalid-mode': 'errorInvalidMode',
  'invalid-timeout': 'errorInvalidTimeout', 'invalid-theme': 'errorInvalidTheme',
  'invalid-pause': 'errorInvalidPause', 'invalid-tab': 'errorInvalidTab',
  'tab-closed': 'errorTabClosed', 'tab-missing': 'errorTabMissing',
  'rule-not-found': 'errorRuleMissing', 'unsupported-message': 'errorUnsupportedMessage',
  'discard-unconfirmed': 'errorDiscardUnconfirmed', 'extension-required': 'errorExtensionRequired',
  'bridge-unavailable': 'errorBridgeUnavailable', unexpected: 'errorUnexpected',
};
export function formatError(error: ErrorData): string {
  return error.code === 'unexpected' && error.detail ? t('errorDetails', [error.detail]) : t(errorKeys[error.code]);
}
export function activityText(activity: Activity): string {
  if (activity.code === 'discard-normal') return t('eventNormal');
  if (activity.code === 'discard-strict') return t('eventStrict');
  if (activity.code === 'restored') return t('eventRestored');
  return formatError(activity.error ?? { code: 'unexpected' });
}
