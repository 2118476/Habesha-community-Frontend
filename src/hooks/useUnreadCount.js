import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';

export default function useUnreadCount(pollMs = 10000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const { data } = await api.get('/messages/unread-count');
        if (active) setCount(data || 0);
      } catch {}
    };
    tick();
    const id = setInterval(tick, pollMs);
    return () => { active = false; clearInterval(id); };
  }, [pollMs]);
  return count;
}