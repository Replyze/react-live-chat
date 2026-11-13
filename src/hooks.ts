import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { Replyze, getServerState, getState, subscribe } from './core';
import type { ReplyzeEventHandler, ReplyzeEventName, ReplyzeMethods, ReplyzeState } from './types';

export type UseReplyzeResult = ReplyzeState & ReplyzeMethods;

/**
 * The widget's methods plus its state (`status`, `isOpen`, `unreadCount`).
 * Works anywhere in the tree, no provider needed: the widget is one per page.
 * The methods are stable; calls made before the widget is ready run once it is.
 */
export function useReplyze(): UseReplyzeResult {
  const state = useSyncExternalStore(subscribe, getState, getServerState);
  return useMemo(() => ({ ...state, ...Replyze }), [state]);
}

/**
 * Listen to a widget event for as long as the component is mounted.
 * The handler can change between renders without re-subscribing.
 *
 * ```tsx
 * useReplyzeEvent('message:received', (message) => console.log(message.content));
 * ```
 */
export function useReplyzeEvent<E extends ReplyzeEventName>(event: E, handler: ReplyzeEventHandler<E>): void {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => {
    const listener = ((...args: Parameters<ReplyzeEventHandler<E>>) => latest.current(...args)) as ReplyzeEventHandler<E>;
    return Replyze.on(event, listener);
  }, [event]);
}
