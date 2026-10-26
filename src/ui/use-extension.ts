import { t } from '../i18n/index.ts';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message, Snapshot } from '../core/model.ts';
import { errorText, isConnectionError, send } from './common.ts';
import { useNotice } from './use-notice.ts';
import type { UndoAction } from './use-notice.ts';

export type ActionResult = { ok: true } | { ok: false; error: string };

export function useExtension() {
  const [data, setData] = useState<Snapshot>();
  const [busy, setBusy] = useState(false);
  const [connectionError, setConnectionError] = useState<string>();
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>();
  const notifications = useNotice(busy || !!connectionError);
  const { showNotice } = notifications;
  const busyRef = useRef(false);
  const connected = useRef(false);
  const revision = useRef(0);
  const mounted = useRef(false);

  const refresh = useCallback(async (): Promise<void> => {
    if (busyRef.current) return;
    const current = ++revision.current;
    setRefreshing(true);
    try {
      const snapshot = await send({ type: 'snapshot' });
      if (mounted.current && current === revision.current) {
        connected.current = true;
        setData(snapshot); setConnectionError(undefined); setLastUpdatedAt(Date.now());
      }
    } catch (error) {
      if (mounted.current && current === revision.current) {
        connected.current = false; setConnectionError(errorText(error));
      }
    } finally {
      if (mounted.current && current === revision.current) setRefreshing(false);
    }
  }, []);

  const act = useCallback(async (message: Message, success?: string, inline = false, undo?: UndoAction): Promise<ActionResult> => {
    if (busyRef.current) return { ok: false, error: t('busy') };
    if (!connected.current) return { ok: false, error: t('errorBridgeUnavailable') };
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    busyRef.current = true; ++revision.current; setRefreshing(false); setBusy(true);
    try {
      const snapshot = await send(message);
      if (mounted.current) {
        connected.current = true;
        setData(snapshot); setConnectionError(undefined); setLastUpdatedAt(Date.now());
        if (success) showNotice({ message: success, error: false, returnFocus, ...(undo ? { undo } : {}) });
      }
      return { ok: true };
    } catch (error) {
      const description = errorText(error);
      if (mounted.current) {
        if (isConnectionError(error)) {
          connected.current = false; setConnectionError(description);
        } else if (!inline) showNotice({ message: description, error: true, returnFocus });
      }
      return { ok: false, error: description };
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [showNotice]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const visible = () => { if (!document.hidden) void refresh(); };
    const interval = setInterval(visible, 15_000);
    // Session writes are deliberately excluded: a snapshot also writes session state.
    const settingsChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes.settings) visible();
    };
    document.addEventListener('visibilitychange', visible);
    globalThis.chrome?.storage?.onChanged.addListener(settingsChanged);
    return () => {
      mounted.current = false; connected.current = false; ++revision.current; clearInterval(interval);
      document.removeEventListener('visibilitychange', visible);
      globalThis.chrome?.storage?.onChanged.removeListener(settingsChanged);
    };
  }, [refresh]);

  return { data, busy, connectionError, refreshing, lastUpdatedAt, refresh, act,
    canAct: !!data && !busy && !connectionError, ...notifications,
    undo: () => notifications.notice?.undo ?
      act(notifications.notice.undo.message, notifications.notice.undo.success) : Promise.resolve(undefined) };
}

export type ExtensionState = ReturnType<typeof useExtension>;
