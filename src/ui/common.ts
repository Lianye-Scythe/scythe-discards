import { AppError, toErrorData } from '../core/errors.ts';
import { formatError, locale, t } from '../i18n/index.ts';
import type { Message, Reply, Snapshot } from '../core/model.ts';

export async function send(message: Message): Promise<Snapshot> {
  if (!globalThis.chrome?.runtime?.id) throw new AppError('extension-required');
  let reply: Reply | undefined;
  try { reply = await chrome.runtime.sendMessage(message); }
  catch (error) { throw new AppError('bridge-unavailable', toErrorData(error).detail); }
  if (!reply) throw new AppError('bridge-unavailable');
  if (!reply.ok) { const error = toErrorData(reply.error); throw new AppError(error.code, error.detail); }
  return reply.data;
}

export function isConnectionError(error: unknown): boolean {
  const code = toErrorData(error).code;
  return code === 'extension-required' || code === 'bridge-unavailable';
}

export function errorText(error: unknown): string {
  return formatError(toErrorData(error));
}

export function timeText(at: number): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(at);
}

export function dateTimeText(at: number): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(at);
}

export function remaining(at: number | null): string {
  if (at == null) return '';
  const minutes = Math.ceil((at - Date.now()) / 60_000);
  if (minutes <= 0) return t('waitingForScan');
  const unit = (value: number, unit: 'minute' | 'hour') =>
    new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' }).format(value);
  const values = minutes < 60 ? [unit(minutes, 'minute')] :
    [unit(Math.floor(minutes / 60), 'hour'), ...(minutes % 60 ? [unit(minutes % 60, 'minute')] : [])];
  return t('timeRemaining', [new Intl.ListFormat(locale, { style: 'short', type: 'unit' }).format(values)]);
}

export async function openOptionsPage(route?: 'allowlist' | 'tabs'): Promise<void> {
  await chrome.runtime.openOptionsPage();
  if (!route) return;
  const base = chrome.runtime.getURL('ui/options.html');
  const tabs = await chrome.tabs.query({});
  const tab = tabs.find(item => item.url?.split('#')[0] === base);
  if (tab?.id != null) await chrome.tabs.update(tab.id, { url: base + '#' + route, active: true });
}
