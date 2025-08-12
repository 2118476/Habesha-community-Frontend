import React, { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import '../styles/messages.css';



const POLL_MS = 10000;
const DEBUG = false;

const MessagesPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  const selectedUserIdFromNav = location.state?.selectedUserId || null;
  const selectedUserNameFromNav = location.state?.selectedUserName || null;
  const prefillMessageFromNav = location.state?.prefillMessage || '';

  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Contact request state
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [selectedDetails, setSelectedDetails] = useState(null);

  const [loadingFriends, setLoadingFriends] = useState(true);
  const [initialLoadingMessages, setInitialLoadingMessages] = useState(false);

  const endRef = useRef(null);
  const pollRef = useRef(null);

  const myId = user?.id != null ? String(user.id) : null;

  const scrollToBottom = (smooth = true) => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  const norm = useCallback((m) => ({
    id: m.id,
    content: m.content ?? m.text ?? '',
    senderId: m.senderId ?? m?.sender?.id ?? null,
    recipientId: m.recipientId ?? m?.recipient?.id ?? null,
    createdAt: m.sentAt ?? m.createdAt ?? null,
  }), []);

  const isMine = useCallback((msg) => {
    const n = norm(msg);
    return myId && n.senderId && String(n.senderId) === myId;
  }, [myId, norm]);

  const normalizeFriends = useCallback((raw) => {
    const arr = Array.isArray(raw) ? raw : [];
    return arr.map((f) => ({
      id: f.id,
      name: f.name ?? f.username ?? 'Unknown',
      avatar: f.avatarUrl || null,
      lastText: f.lastText || '',
      lastAt: f.lastAt || null,
      unread: Number(f.unread || 0),
    }));
  }, []);

  const fetchFriends = useCallback(async () => {
    setLoadingFriends(true);
    try {
      const [{ data: friendsData }, { data: unreadSummary }] = await Promise.all([
        api.get('/friends/list'),
        api.get('/messages/unread-summary')
      ]);

      const base = normalizeFriends(friendsData);

      const merged = base.map(f => {
        const match = unreadSummary.find(u => String(u.userId) === String(f.id));
        return { ...f, unread: match ? Number(match.count) : 0 };
      });

      merged.sort((a, b) => {
        const u = (b.unread || 0) - (a.unread || 0);
        if (u !== 0) return u;
        const ta = a.lastAt ? new Date(a.lastAt).getTime() : 0;
        const tb = b.lastAt ? new Date(b.lastAt).getTime() : 0;
        return tb - ta;
      });

      setFriends(merged);
    } catch (err) {
      toast.error('Failed to load friends');
    } finally {
      setLoadingFriends(false);
    }
  }, [normalizeFriends]);

  /**
   * Fetch incoming and outgoing contact requests for the current
   * user.  Incoming requests are those where the current user is
   * the target (recipient).  Outgoing requests are those sent by
   * the current user.  These lists are used to render request
   * notifications and statuses within the conversation.
   */
  const fetchContactRequests = useCallback(async () => {
    try {
      const [incRes, outRes] = await Promise.all([
        api.get('/contact/requests/incoming'),
        api.get('/contact/requests/outgoing'),
      ]);
      setIncomingRequests(Array.isArray(incRes.data) ? incRes.data : []);
      setOutgoingRequests(Array.isArray(outRes.data) ? outRes.data : []);
    } catch (err) {
      // Do not surface an error to the user here as this is
      // supplementary information; however log for debugging.
      if (DEBUG) console.error('Error fetching contact requests', err);
    }
  }, []);

  /**
   * Respond to a contact request by approving or rejecting it.
   * After responding, refresh the contact request lists to
   * reflect the new state.
   */
  const handleRespondContact = useCallback(async (requestId, accept) => {
    try {
      await api.post(`/contact/requests/${requestId}/respond?accept=${accept}`);
      await fetchContactRequests();
      toast.success(accept ? 'Contact request accepted' : 'Contact request rejected');
    } catch (err) {
      console.error(err);
      toast.error('Failed to respond to contact request');
    }
  }, [fetchContactRequests]);

  const fetchMessagesInitial = useCallback(async (friendId) => {
    if (!friendId) return;
    setInitialLoadingMessages(true);
    try {
      const { data } = await api.get(`/messages/${friendId}`);
      const list = (Array.isArray(data) ? data : []).map(norm);
      setMessages(list);

      try { await api.post(`/messages/read/${friendId}`); } catch {}

      setFriends(prev => prev.map(f => f.id === friendId ? { ...f, unread: 0 } : f));
      setTimeout(() => scrollToBottom(false), 0);
    } catch {
      toast.error('Error loading messages');
    } finally {
      setInitialLoadingMessages(false);
    }
  }, [norm]);

  const fetchMessagesSilent = useCallback(async (friendId) => {
    if (!friendId) return;
    try {
      const { data } = await api.get(`/messages/${friendId}`);
      const list = (Array.isArray(data) ? data : []).map(norm);
      if (list.length !== messages.length || (list.at(-1)?.id !== messages.at(-1)?.id)) {
        setMessages(list);
        scrollToBottom(true);
      }
    } catch {}
  }, [messages.length, messages, norm]);

  const sendMessage = useCallback(async () => {
    const text = newMessage.trim();
    if (!selected?.id || !text) return;

    try {
      await api.post('/messages/send', {
        recipientId: selected.id,
        content: text,
        viaSms: false,
      });
      setNewMessage('');
      const now = new Date().toISOString();
      const opt = { id: `tmp-${Date.now()}`, content: text, senderId: myId ? Number(myId) : null, recipientId: selected.id, createdAt: now };
      setMessages(prev => [...prev, opt]);
      setFriends(prev => prev.map(f => f.id === selected.id ? { ...f, lastText: text, lastAt: now } : f));
      scrollToBottom(true);
      fetchMessagesSilent(selected.id);
    } catch {
      toast.error('Failed to send message');
    }
  }, [newMessage, selected?.id, myId, fetchMessagesSilent]);

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString();
  };

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  // Fetch contact requests on mount and periodically every POLL_MS
  useEffect(() => {
    fetchContactRequests();
    const interval = setInterval(() => {
      fetchContactRequests();
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchContactRequests]);

  useEffect(() => {
    if (!friends.length || selected) return;
    if (selectedUserIdFromNav) {
      const f = friends.find(x => x.id === selectedUserIdFromNav);
      if (f) { setSelected(f); return; }
    }
    if (selectedUserNameFromNav) {
      const f = friends.find(x => (x.name || '').toLowerCase() === selectedUserNameFromNav.toLowerCase());
      if (f) setSelected(f);
    }
  }, [friends, selected, selectedUserIdFromNav, selectedUserNameFromNav]);

  // If a prefill message is provided (e.g., when coming from a listing), populate the input
  useEffect(() => {
    if (prefillMessageFromNav && !newMessage) {
      setNewMessage(prefillMessageFromNav);
    }
  }, [prefillMessageFromNav, newMessage]);

  useEffect(() => {
    if (selected?.id) fetchMessagesInitial(selected.id);
  }, [selected?.id, fetchMessagesInitial]);

  // When a friend is selected, fetch their detailed profile (for
  // contact information) and reset input message if there is a
  // prefill provided via navigation state.
  useEffect(() => {
    const loadDetails = async () => {
      if (!selected?.id) { setSelectedDetails(null); return; }
      try {
        const { data } = await api.get(`/users/${selected.id}`);
        setSelectedDetails(data);
      } catch (err) {
        setSelectedDetails(null);
        if (DEBUG) console.error('Failed to fetch user details', err);
      }
    };
    loadDetails();
  }, [selected?.id]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try { await fetchFriends(); } catch {}
      if (selected?.id) { try { await fetchMessagesSilent(selected.id); } catch {} }
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [selected?.id, fetchFriends, fetchMessagesSilent]);

  return (
    <div className="messages-layout">
      <aside className="threads card">
        <div className="threads-header">Messages</div>
        {loadingFriends ? (
          <div className="threads-empty">Loading…</div>
        ) : friends.length ? (
          <ul className="threads-list">
            {friends.map((f) => {
              const active = selected?.id === f.id;
              const initials = (f.name || 'U').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();
              return (
                <li
                  key={f.id}
                  className={`friend-item ${active ? 'active' : ''} ${f.unread > 0 ? 'unread' : ''}`}
                  onClick={() => setSelected(f)}
                >
                  <div className="friend-avatar">{initials}</div>
                  <div className="friend-main">
                    <div className="friend-top">
                      <span className="friend-name">{f.name}</span>
                      <span className="friend-time">{formatTime(f.lastAt)}</span>
                    </div>
                    <div className="friend-bottom">
                      <span className="friend-last">{f.lastText || ''}</span>
                      {f.unread > 0 && <span className="badge">{f.unread}</span>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="threads-empty">No conversations yet.</div>
        )}
      </aside>

      <section className="conversation card">
        {selected ? (
          <>
            <div className="conv-header">
              <div className="conv-avatar">{(selected.name || 'U').slice(0,2).toUpperCase()}</div>
              <div className="conv-name">{selected.name}</div>
            </div>

            {/* Render contact requests and statuses for this conversation */}
            <div className="contact-requests" style={{ padding: '0.5rem 1rem' }}>
              {/* Incoming requests from this user */}
              {incomingRequests
                .filter((req) => String(req.requesterId) === String(selected.id))
                .map((req) => (
                  <div key={req.id} style={{ marginBottom: '0.5rem', background: '#f9f9f9', padding: '0.5rem', borderRadius: '4px' }}>
                    <div>
                      {req.requesterName} requested your {req.type.toLowerCase()}.
                    </div>
                    <div style={{ marginTop: '0.3rem' }}>
                      <button className="btn" onClick={() => handleRespondContact(req.id, true)}>
                        Accept
                      </button>
                      <button className="btn" style={{ marginLeft: '6px' }} onClick={() => handleRespondContact(req.id, false)}>
                        Deny
                      </button>
                    </div>
                  </div>
                ))}

              {/* Outgoing requests to this user */}
              {outgoingRequests
                .filter((req) => String(req.targetId) === String(selected.id))
                .map((req) => (
                  <div key={req.id} style={{ marginBottom: '0.5rem', background: '#eef7ff', padding: '0.5rem', borderRadius: '4px' }}>
                    <div>
                      You requested their {req.type.toLowerCase()}. Status: {req.status.toLowerCase()}.
                    </div>
                    {/* If approved, show the contact info */}
                    {req.status === 'APPROVED' && selectedDetails && (
                      <div style={{ marginTop: '0.25rem' }}>
                        {req.type === 'EMAIL' && selectedDetails.email && (
                          <span>Email: {selectedDetails.email}</span>
                        )}
                        {req.type === 'PHONE' && selectedDetails.phone && (
                          <span>Phone: {selectedDetails.phone}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            <div className="messages-window">
              {initialLoadingMessages ? (
                <div className="threads-empty">Loading…</div>
              ) : messages.length ? (
                messages.map((msg) => {
                  const n = norm(msg);
                  const mine = isMine(msg);
                  return (
                    <div key={msg.id} className={`msg-row ${mine ? 'mine' : 'theirs'}`}>
                      {DEBUG && (
                        <div style={{fontSize:11,opacity:.6,marginBottom:2}}>
                          senderId={String(n.senderId)} | myId={String(myId)} | mine={String(mine)}
                        </div>
                      )}
                      <div className="msg-bubble">
                        <div className="msg-text">{n.content}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="threads-empty">No messages yet — say hi 👋</div>
              )}
              <div ref={endRef} />
            </div>

            <div className="send-box">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message…"
                rows={2}
              />
              <button className="btn" onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="threads-empty" style={{ height: '100%' }}>
            Select a conversation to start chatting.
          </div>
        )}
      </section>
    </div>
  );
};

export default MessagesPage;
