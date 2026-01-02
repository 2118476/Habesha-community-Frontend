import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosInstance';

/**
 * Normalize any numeric-ish field to a non-negative integer.
 */
const nni = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
};

/**
 * Shape guard + numeric normalization. Keeps unknown fields too.
 */
function normalizeCounts(data) {
  const d = (data && typeof data === 'object') ? data : {};

  const normalized = {
    // Known fields
    unreadMessages: nni(d.unreadMessages),
    unreadThreads:  nni(d.unreadThreads),
    pendingRequests:nni(d.pendingRequests),
    notifications:  nni(d.notifications),
  };

  // Preserve any extra fields your API may add in the future
  for (const k in d) {
    if (!(k in normalized)) normalized[k] = d[k];
  }
  return normalized;
}

/**
 * useCounts
 * - Polls /api/counts every 15s
 * - ALSO refreshes immediately (debounced) on:
 *   • window focus
 *   • tab becomes visible
 *   • custom events: 'messages:updated', 'notifications:updated', 'friends:updated', 'counts:refresh'
 * - Returns the TanStack Query object ({ data, refetch, ... })
 */
export function useCounts() {
  const q = useQuery({
    queryKey: ['counts'],
    queryFn: async () => {
      const { data } = await api.get('/api/counts');
      return normalizeCounts(data);
    },
    // Prevent initial flicker
    initialData: { unreadMessages: 0, unreadThreads: 0, pendingRequests: 0, notifications: 0 },
    // Background poll
    refetchInterval: 15000,
    // We'll manage focus/visibility manually (faster + debounced)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    // Consider fresh for 15s to avoid remount-churn
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    retry: 1,
    select: normalizeCounts, // in case initialData merges with server response later
  });

  // Debounced "kick" so multiple events don't cause spammy refetch calls.
  const kickTimerRef = useRef(null);
  const kickCounts = useCallback(() => {
    if (kickTimerRef.current) return;
    kickTimerRef.current = setTimeout(() => {
      kickTimerRef.current = null;
      q.refetch();
    }, 200);
  }, [q]);

  useEffect(() => {
    // Guards for SSR/testing environments
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const onVisibility = () => {
      if (document.visibilityState === 'visible') kickCounts();
    };
    const onFocus = () => kickCounts();

    const onMessagesUpdated = () => kickCounts();
    const onNotificationsUpdated = () => kickCounts();
    const onFriendsUpdated = () => kickCounts();
    const onCountsRefresh = () => kickCounts(); // generic hook you can dispatch anywhere

    window.addEventListener('focus', onFocus, { passive: true });
    document.addEventListener('visibilitychange', onVisibility, { passive: true });
    window.addEventListener('messages:updated', onMessagesUpdated, { passive: true });
    window.addEventListener('notifications:updated', onNotificationsUpdated, { passive: true });
    window.addEventListener('friends:updated', onFriendsUpdated, { passive: true });
    window.addEventListener('counts:refresh', onCountsRefresh, { passive: true });

    return () => {
      if (kickTimerRef.current) { clearTimeout(kickTimerRef.current); kickTimerRef.current = null; }
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('messages:updated', onMessagesUpdated);
      window.removeEventListener('notifications:updated', onNotificationsUpdated);
      window.removeEventListener('friends:updated', onFriendsUpdated);
      window.removeEventListener('counts:refresh', onCountsRefresh);
    };
  }, [kickCounts]);

  return q;
}

export default useCounts;
