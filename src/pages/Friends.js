import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const FriendsPage = () => {
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchFriends(),
      fetchIncomingRequests(),
      fetchOutgoingRequests()
    ]);
    setLoading(false);
  };

  const fetchFriends = async () => {
    try {
      const { data } = await api.get('/friends/list');
      setFriends(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading friends:', err.response?.data || err.message);
      toast.error('Failed to load friends');
    }
  };

  const fetchIncomingRequests = async () => {
    try {
      const { data } = await api.get('/friends/requests/incoming');
      setIncoming(data);
    } catch (err) {
      console.error('Incoming error:', err.response?.data || err.message);
      toast.error('Failed to load incoming requests');
    }
  };

  const fetchOutgoingRequests = async () => {
    try {
      const { data } = await api.get('/friends/requests/outgoing');
      setOutgoing(data);
    } catch (err) {
      console.error('Outgoing error:', err.response?.data || err.message);
      toast.error('Failed to load outgoing requests');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return toast.warn('Enter a name or username to search.');
    try {
      const { data } = await api.get(`/friends/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Search error:', err.response?.data || err.message);
      toast.error('Failed to search for users');
    }
  };

  const handleSendRequest = async (receiverId) => {
    try {
      await api.post('/friends/request', { receiverId });
      toast.success('Friend request sent!');
      setSearchResults([]);
      loadAllData();
    } catch (err) {
      console.error('Send request error:', err.response?.data || err.message);
      toast.error(err.response?.data || 'Could not send friend request');
    }
  };

  const handleRespond = async (requestId, accept) => {
    try {
      await api.post('/friends/respond', { requestId, accept });
      toast.success(accept ? 'Friend request accepted!' : 'Request rejected');
      loadAllData();
    } catch (err) {
      console.error('Response error:', err.response?.data || err.message);
      toast.error('Failed to respond to request');
    }
  };

  return (
    <div className="container" style={{ padding: '1rem' }}>
      <h2>Friends</h2>

      <div>
        <input
          type="text"
          placeholder="Search by name or username"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {searchResults.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Search Results</h4>
          <ul>
            {searchResults.map((user) => (
              <li key={user.id}>
                <button
                  onClick={() => navigate(`/profile/${user.id}`)}
                  style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {user.username} ({user.name})
                </button>
                <button style={{ marginLeft: '10px' }} onClick={() => handleSendRequest(user.id)}>
                  Send Request
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <h4>Incoming Friend Requests</h4>
          {incoming.length === 0 ? (
            <p>No incoming requests.</p>
          ) : (
            <ul>
              {incoming.map((req) => (
                <li key={req.id}>
                  {req.senderName} wants to be your friend
                  <button onClick={() => handleRespond(req.id, true)} style={{ marginLeft: '10px' }}>Accept</button>
                  <button onClick={() => handleRespond(req.id, false)} style={{ marginLeft: '5px' }}>Reject</button>
                </li>
              ))}
            </ul>
          )}

          <h4>Outgoing Friend Requests</h4>
          {outgoing.length === 0 ? (
            <p>No outgoing requests.</p>
          ) : (
            <ul>
              {outgoing.map((req) => (
                <li key={req.id}>You sent request to {req.receiverName}</li>
              ))}
            </ul>
          )}

       <h4>Your Friends</h4>
{friends.length === 0 ? (
  <p>No friends yet.</p>
) : (
  <ul>
    {friends.map((friend) => (
      <li key={friend.id}>
        <button
          onClick={() => navigate(`/profile/${friend.id}`)}
          style={{
            background: 'none',
            border: 'none',
            color: 'blue',
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          {friend.username} ({friend.name})
        </button>
      </li>
    ))}
  </ul>
)}

        </div>
      )}
    </div>
  );
};

export default FriendsPage;
