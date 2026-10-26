import { formatError, t } from '../../i18n/index.ts';
import { AlertCircle, Check, Info, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { dateTimeText } from '../common.ts';
import type { ExtensionState } from '../use-extension.ts';
import { Button } from './ui.tsx';

export function ConnectionError({ state }: { state: ExtensionState }) {
  if (!state.connectionError) return null;
  return <div className="message message-error" role="alert">
    <AlertCircle size={20} aria-hidden="true" />
    <div><p>{state.connectionError}</p>
      <p className="connection-help">{state.data && state.lastUpdatedAt ?
        t('staleData', [dateTimeText(state.lastUpdatedAt)]) : t('connectionNoData')}</p>
      <Button variant="text" data-connection-retry disabled={state.refreshing || state.busy}
        onClick={() => void state.refresh()}>{t(state.refreshing ? 'reconnecting' : 'retryConnection')}</Button></div>
  </div>;
}

export function RunningStatus({ state, id }: { state: ExtensionState; id: string }) {
  const status = state.connectionError ? state.refreshing ? 'reconnecting' : 'unavailable' :
    !state.data ? 'loading' : state.data.settings.paused ? 'paused' : 'running';
  const label = status === 'loading' ? 'connecting' : status === 'unavailable' ? 'statusUnavailable' : status;
  return <span className={'running-status is-' + status} id={id} data-state={status} role="status">
    <span className="status-dot" aria-hidden="true" />{t(label)}
  </span>;
}

export function Toast({ state }: { state: ExtensionState }) {
  const region = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => { previousFocus.current = state.notice?.returnFocus ?? null; }, [state.notice?.id]);
  const canFocus = (target: HTMLElement | null): target is HTMLElement =>
    !!target?.isConnected && !region.current?.contains(target) && target !== document.body &&
    !target.matches(':disabled') && target.getClientRects().length > 0 && !target.closest('[hidden], [inert]');
  const returnTarget = () => {
    if (canFocus(previousFocus.current)) return previousFocus.current;
    if (canFocus(state.notice?.returnFocus ?? null)) return state.notice!.returnFocus;
    return document.querySelector<HTMLElement>('[data-connection-retry]:not(:disabled), .page:not([hidden]) h1, #open-options');
  };
  const dismiss = () => {
    if (region.current?.contains(document.activeElement)) returnTarget()?.focus();
    state.dismissNotice();
  };
  const undo = async () => {
    const target = returnTarget();
    await state.undo();
    // A pending action can disable its button; preserve a later user-selected focus.
    requestAnimationFrame(() => {
      if (document.activeElement === document.body || region.current?.contains(document.activeElement)) {
        (canFocus(target) ? target : returnTarget())?.focus();
      }
    });
  };
  useEffect(() => {
    // Recovery takes priority over an old confirmation; keep errors and Undo.
    if (state.connectionError && state.notice && !state.notice.error && !state.notice.undo) dismiss();
  }, [state.connectionError, state.notice?.id]);
  return <div className="toast-region" ref={region} role={state.notice?.error ? 'alert' : 'status'} aria-atomic="true"
    onPointerEnter={event => { if (event.pointerType !== 'touch') state.setNoticeHovered(true); }}
    onPointerLeave={() => state.setNoticeHovered(false)}
    onFocusCapture={event => {
      const target = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null;
      if (canFocus(target)) previousFocus.current = target;
      state.setNoticeFocused(true);
    }}
    onBlurCapture={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) state.setNoticeFocused(false);
    }}>
    {state.notice && <div className={'toast' + (state.notice.error ? ' toast-error' : '')}>
      {state.notice.error ? <AlertCircle size={18} aria-hidden="true" /> : <Check size={18} aria-hidden="true" />}
      <span>{state.notice.message}</span>
      {state.notice.undo && <Button variant="text" disabled={!state.canAct} onClick={() => void undo()}>{t('undo')}</Button>}
      <Button variant="icon" aria-label={t('closeNotice')} onClick={dismiss}><X size={18} /></Button>
    </div>}
  </div>;
}

export function BackgroundError({ state }: { state: ExtensionState }) {
  return state.data?.lastError ? <div className="message message-warning" role="status">
    <Info size={20} aria-hidden="true" /><p>{t('lastCheckFailed', [formatError(state.data.lastError)])}</p>
  </div> : null;
}
