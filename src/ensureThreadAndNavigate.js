/**
 * Ensure there's a 1:1 thread with targetUserId, then deep-link into that chat.
 *
 * Messages.jsx deep-links by the PEER USER id at /app/messages/thread/:id and
 * runs its own ensure-thread + conversation load on mount, so we just need to
 * (best-effort) create the thread and navigate to the canonical route with the
 * navigation state the Messages page understands.
 *
 * @param {Function} navigate - from react-router-dom
 * @param {string|number} targetUserId
 * @param {object} api - your axios instance (optional)
 */
export async function ensureThreadAndNavigate(navigate, targetUserId, api) {
  if (!targetUserId) return;

  // Best-effort: create/get the 1:1 thread server-side. The backend expects a
  // JSON body { userId }. Safe to ignore failures — Messages.jsx also calls
  // ensure-thread when it opens the deep link.
  if (api) {
    try {
      await api.post(`/api/messages/ensure-thread`, { userId: targetUserId });
    } catch {
      /* ignore — the Messages page will retry */
    }
  }

  navigate(`/app/messages/thread/${targetUserId}`, {
    state: { selectedUserId: String(targetUserId), focusComposer: true },
  });
}
