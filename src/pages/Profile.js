import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';

// Simple profile page displaying the authenticated user's
// information. You can extend this page to allow editing the
// profile or updating the password.
const Profile = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  if (!user) {
    return <div>Loading profile...</div>;
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result;
      if (!result) return;
      try {
        setUploading(true);
        // POST to backend to update profile image
        await api.post('/users/me/profile-image', { profileImageUrl: result });
        toast.success('Profile image updated');
        // refresh page to load new avatar
        window.location.reload();
      } catch (err) {
        toast.error('Failed to upload image');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <h2>Your Profile</h2>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Phone:</strong> {user.phone}</p>
      <p><strong>City:</strong> {user.city}</p>
      <p><strong>Role:</strong> {user.role}</p>

      {/* Profile picture upload */}
      <div style={{ marginTop: 12 }}>
        <h4>Profile Image</h4>
        <img
          src={user.profileImageUrl || '/default-avatar.png'}
          alt="Profile"
          width={120}
          height={120}
          style={{ borderRadius: '50%', objectFit: 'cover' }}
        />
        <div style={{ marginTop: 8 }}>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {uploading && <span style={{ marginLeft: 8 }}>Uploading…</span>}
        </div>
      </div>
    </div>
  );
};

export default Profile;