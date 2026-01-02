/**
 * Ensure there's a 1:1 thread with targetUserId, then navigate to it.
 * Tries preferred endpoint first, then falls back to search.
 *
 * @param {Function} navigate - from react-router-dom
 * @param {string|number} targetUserId
 * @param {object} api - your axios instance (optional)
 */
export async function ensureThreadAndNavigate(navigate, targetUserId, api) {
  try {
    let threadId = null;
    if (api) {
      try {
        // Preferred: create or get existing 1:1 thread
        const res = await api.post(`/api/messages/threads/ensure`, null, { params: { targetUserId } });
        threadId = res?.data?.id || res?.data?.threadId;
      } catch {}
      if (!threadId) {
        // Fallback: list threads and find by participant
        const list = await api.get(`/api/messages/threads`);
        const found = (list?.data || []).find(t =>
          (t.participants || []).some(p => String(p.id) === String(targetUserId))
        );
        threadId = found?.id;
      }
    }
    if (!threadId) {
      // Absolute fallback: encode target as query and let Messages page resolve
      navigate(`/app/messages?to=${encodeURIComponent(targetUserId)}`);
      return;
    }
    navigate(`/app/messages/thread/${targetUserId}`);
  } catch (e) {
    console.error('ensureThreadAndNavigate failed', e);
    navigate(`/app/messages`);
  }
}
