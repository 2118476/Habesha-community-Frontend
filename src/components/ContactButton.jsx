import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

export default function ContactButton({ toUserId, context, children='Message', className='' }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!toUserId) return;
    setLoading(true);
 try {
  const res = await api.post('/api/messages/ensure-thread', {
    userId: toUserId,
    contextType: context?.type,
    contextId: context?.id
  });

  const threadId =
    res?.data?.threadId ||
    res?.data?.id ||
    null;

  if (threadId) {
    navigate(`/app/messages/thread/${threadId}`, {
      state: {
        selectedUserId: String(toUserId),
        focusComposer: true
      }
    });
  } else {
    // Fallback: still deep-link using user id (your Messages page accepts userId, too)
    navigate(`/app/messages/thread/${toUserId}`, {
      state: { selectedUserId: String(toUserId), focusComposer: true }
    });
  }
} catch (e) {
  console.error(e);
  // Last-resort fallback
  navigate('/app/messages', { state: { selectedUserId: String(toUserId) } });
} finally {
  setLoading(false);
}
}

  return (
    <button onClick={handleClick} disabled={loading} className={className} aria-label='Contact user'>
      {loading ? 'Opening…' : children}
    </button>
  );
}
