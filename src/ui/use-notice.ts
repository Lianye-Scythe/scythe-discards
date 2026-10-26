import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message } from '../core/model.ts';

export interface UndoAction { message: Message; success: string }
export interface Notice {
  id: number;
  message: string;
  error: boolean;
  undo?: UndoAction;
  returnFocus: HTMLElement | null;
}
type NoticeInput = Omit<Notice, 'id'>;

export function useNotice(busy: boolean) {
  const [notice, setNotice] = useState<Notice>();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const sequence = useRef(0);
  const showNotice = useCallback((value: NoticeInput) => {
    setNotice({ ...value, id: ++sequence.current });
  }, []);
  const dismissNotice = useCallback(() => {
    setNotice(undefined); setHovered(false); setFocused(false);
  }, []);

  useEffect(() => {
    if (!notice || notice.error || hovered || focused || busy) return;
    // Leaving the notice gives a fresh reading period; errors stay until dismissed.
    const timer = setTimeout(() => {
      setNotice(current => current?.id === notice.id ? undefined : current);
    }, notice.undo ? 7000 : 4000);
    return () => clearTimeout(timer);
  }, [notice, hovered, focused, busy]);

  return { notice, showNotice, dismissNotice, setNoticeHovered: setHovered, setNoticeFocused: setFocused };
}
