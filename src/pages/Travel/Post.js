import React, { useState } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Form to create a new travel post.
// Includes light validation and clears after submit.
const TravelPost = () => {
  const [form, setForm] = useState({
    originCity: '',
    destinationCity: '',
    travelDate: '',
    message: '',
    contactMethod: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.originCity.trim() || !form.destinationCity.trim() || !form.travelDate || !form.contactMethod.trim()) {
      toast.warn('Fill origin, destination, date, and contact method');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/travel', {
        originCity: form.originCity.trim(),
        destinationCity: form.destinationCity.trim(),
        travelDate: form.travelDate,       // YYYY-MM-DD
        message: form.message?.trim() || '',
        contactMethod: form.contactMethod.trim(),
      });
      toast.success('Travel post created');

      // Reset form
      setForm({
        originCity: '',
        destinationCity: '',
        travelDate: '',
        message: '',
        contactMethod: '',
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to create travel post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ marginBottom: 8 }}>Post Travel Plan</h2>
      <p style={{ marginTop: 0, color: '#64748b' }}>
        Share a route & date so people can reach you. <em>Use at your own risk.</em>
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: 12 }}>
        <div className="hstack" style={{ gap: 12, flexWrap: 'wrap' }}>
          <input
            name="originCity"
            value={form.originCity}
            onChange={handleChange}
            placeholder="Origin city"
            required
            style={inputStyle}
          />
          <input
            name="destinationCity"
            value={form.destinationCity}
            onChange={handleChange}
            placeholder="Destination city"
            required
            style={inputStyle}
          />
          <input
            type="date"
            name="travelDate"
            value={form.travelDate}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>

        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="Message (optional)"
          rows={4}
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            resize: 'vertical',
          }}
        />

        <input
          name="contactMethod"
          value={form.contactMethod}
          onChange={handleChange}
          placeholder="Contact method (email/phone/Telegram)"
          required
          style={inputStyle}
        />

        <div className="hstack" style={{ gap: 8 }}>
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  minWidth: 200,
};

export default TravelPost;
