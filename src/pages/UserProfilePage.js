import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';
import Avatar from '../components/Avatar';
import { PageLoader } from '../components/ui/PageLoader/PageLoader';

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

  if (!user) return <PageLoader message="Loading profile..." />;

  return (
    <div className="profile-container" style={{ padding: '2rem' }}>
      <h2>{user.username}'s Profile</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {/* Display the user's avatar using the Avatar component which
            automatically falls back to initials when no image is available. */}
        <Avatar
          user={{ id: user.id, name: user.name || user.username, avatarUrl: user.profileImageUrl }}
          size={120}
          alt="Profile"
          rounded
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
