import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../api/axiosInstance';

/**
 * Returns the number of chats (threads) that have unread messages.
 * - Polls every pollMs (default 15s).
 * - Also refetches when window dispatches 'messages:updated',
 *   when the tab regains focus, and when the page becomes visible.
 * - Tries /messages/threads first (chat-level); falls back to /api/messages/threads,
 *   and finally to /messages/unread-count (total messages) if needed.
 */
export default function useUnreadCount(pollMs = 15000) {
  const [count, setCount] = useState(0);
  const ctrlRef = useRef(null);
  const activeRef = useRef(true);

  const fetchCount = useCallback(async () => {
    if (!activeRef.current) return;

    // cancel any in-flight request
    ctrlRef.current?.abort?.();
    const controller = new AbortController();
    ctrlRef.current = controller;

    try {
      // 1) Prefer thread list (to count chats with unread > 0)
      let res;
      try {
        res = await api.get('/messages/threads', { signal: controller.signal, params: { limit: 200 } });
      } catch {
        // 2) Fallback to /api prefix if your axios baseURL doesn't include it
        res = await api.get('/api/messages/threads', { signal: controller.signal, params: { limit: 200 } });
      }

      const data = res?.data;
      const list = Array.isArray(data) ? data : (data?.items ?? data?.content ?? []);
      const chatCount = list.reduce((n, t) => {
        const u = Number(t?.unread ?? t?.unreadCount ?? t?.unread_messages ?? 0);
        return n + (u > 0 ? 1 : 0);
      }, 0);

      if (activeRef.current) setCount(chatCount);
    } catch {
      // 3) Last resort: total unread messages (keeps badge non-zero even if threads API is unavailable)
      try {
        const fallback = await api.get('/messages/unread-count', { signal: controller.signal });
        if (activeRef.current) setCount(Number(fallback?.data ?? 0));
      } catch {
        if (activeRef.current) setCount(0);
      }
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;
    fetchCount();

    const id = setInterval(fetchCount, pollMs);

    const onKick = () => fetchCount();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchCount();
    };

    window.addEventListener('messages:updated', onKick);
    window.addEventListener('focus', onKick);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      activeRef.current = false;
      ctrlRef.current?.abort?.();
      clearInterval(id);
      window.removeEventListener('messages:updated', onKick);
      window.removeEventListener('focus', onKick);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchCount, pollMs]);

  return count;
}
