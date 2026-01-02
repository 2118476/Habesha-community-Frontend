import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';

/**
 * Poll the backend for the number of incoming friend requests for the
 * current user. The hook returns the count and refreshes every
 * `pollMs` milliseconds. Should an error occur, the count silently
 * resets to zero.
 *
 * @param {number} pollMs Interval in milliseconds to refresh the count
 */
export default function useFriendRequestCount(pollMs = 10000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        // Fetch all incoming requests to compute the total. We use
        // the legacy endpoint since it returns the full list.
        const { data } = await api.get('/friends/requests/incoming');
        if (!active) return;
        const arr = Array.isArray(data) ? data : [];
        setCount(arr.length);
      } catch {
        if (active) setCount(0);
      }
    };
    tick();
    const id = setInterval(tick, pollMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [pollMs]);
  return count;
}