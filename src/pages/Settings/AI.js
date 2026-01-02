import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

/**
 * AISettings exposes a single toggle for enabling or disabling the
 * conversational AI assistant. It interacts with the unified
 * settings endpoint to persist the user's preference. Quick message
 * templates could be added here in future iterations.
 */
const AISettings = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/users/me/settings');
        setEnabled(data.aiAssistEnabled ?? false);
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleChange = async (e) => {
    const value = e.target.checked;
    setEnabled(value);
    try {
      await api.put('/api/users/me/settings', { aiAssistEnabled: value });
      toast.success('AI assistant preference updated');
    } catch {
      toast.error('Failed to update AI setting');
    }
  };

  return (
    <div>
      <h2>AI Assistant</h2>
      <label>
        <input type="checkbox" checked={enabled} onChange={handleChange} />
        Enable assistant panel
      </label>
    </div>
  );
};

export default AISettings;