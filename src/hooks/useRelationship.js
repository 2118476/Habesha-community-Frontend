import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

/**
 * Centralized friendship & contact-visibility logic.
 * - Attempts to use your backend endpoints if they exist.
 * - Fallbacks keep the UI safe (hide contacts by default).
 *
 * Endpoints (optional):
 *  GET  /api/friends/status?targetId=123  -> { isFriend: bool, isMutualFriend: bool }
 *  POST /api/contact-requests { targetUserId } -> 200 OK
 */
export function useRelationship(targetUserId, api) {
  const [state, setState] = useState({ isFriend: false, isMutualFriend: false, canSeeContactInfo: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!targetUserId || !api) return;
      setLoading(true);
      try {
        const r = await api.get('/api/friends/status', { params: { targetId: targetUserId } });
        const isFriend = !!r?.data?.isFriend;
        const isMutualFriend = !!r?.data?.isMutualFriend;
        if (mounted) setState({ isFriend, isMutualFriend, canSeeContactInfo: !!isMutualFriend });
      } catch (e) {
        if (mounted) setState(s => ({ ...s, canSeeContactInfo: false }));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [targetUserId, api]);

  async function requestContactInfo() {
    if (!api) return toast.info('Contact request submitted.');
    try {
      await api.post('/api/contact-requests', { targetUserId });
      toast.success('Contact info requested.');
    } catch (e) {
      toast.error('Could not request contact info.');
    }
  }

  return { ...state, loading, requestContactInfo };
}
