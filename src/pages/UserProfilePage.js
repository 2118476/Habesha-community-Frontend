import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';

const UserProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data } = await api.get(`/users/${id}`);
      setUser(data);
    } catch (err) {
      toast.error('Failed to load user profile');
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleRequestContact = async (type) => {
    try {
      await api.post('/contact/request', {
        targetUserId: user.id,
        type, // 'email' or 'phone'
      });
      toast.success(`Requested access to ${type}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send contact request');
    }
  };

  const handleMessage = () => {
    navigate('/messages', {
      state: { selectedUserId: user.id },
    });
  };

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="profile-container" style={{ padding: '2rem' }}>
      <h2>{user.username}'s Profile</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <img
          src={user.profileImageUrl || '/default-avatar.png'}
          alt="Profile"
          width={120}
          height={120}
          style={{ borderRadius: '50%' }}
        />
        <div>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>City:</strong> {user.city || '—'}</p>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <button onClick={handleMessage}>💬 Message</button>
        <button onClick={() => handleRequestContact('email')} style={{ marginLeft: '10px' }}>
          📧 Request Email
        </button>
        <button onClick={() => handleRequestContact('phone')} style={{ marginLeft: '10px' }}>
          📱 Request Phone
        </button>
      </div>
    </div>
  );
};

export default UserProfilePage;
