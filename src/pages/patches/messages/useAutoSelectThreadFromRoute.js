import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

/**
 * Call this at the top of your Messages page component to auto-select a thread
 * when the route is /app/messages/thread/:threadId.
 *
 * Expected props/context in your app:
 * - a function selectThread(threadId)
 * - a function fetchThreadIfMissing(threadId)
 *   You can replace the body with your app's state management.
 */
export function useAutoSelectThreadFromRoute({ selectThread, fetchThreadIfMissing }) {
  const { threadId } = useParams();

  useEffect(() => {
    if (!threadId) return;
    if (typeof selectThread === 'function') selectThread(threadId);
    if (typeof fetchThreadIfMissing === 'function') fetchThreadIfMissing(threadId);
  }, [threadId, selectThread, fetchThreadIfMissing]);
}
