import React, { useState } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import CountrySelect from '../../components/common/CountrySelect';

const initialForm = {
  originCity: '',
  destinationCity: '',
  travelDate: '',
  message: '',
  contactMethod: '',
};

export default function TravelPostForm({ onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [origin, setOrigin] = useState(null);       // { value, code }
  const [destination, setDestination] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const originName = origin?.value?.trim();
    const destName = destination?.value?.trim();
    if (!originName || !destName || !form.travelDate) {
      toast.error('Please choose origin, destination, and date.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/travel', {
        originCity: originName,              // keep backend as-is
        destinationCity: destName,
        travelDate: form.travelDate,         // yyyy-MM-dd
        message: form.message.trim(),
        contactMethod: form.contactMethod.trim(),
      });
      toast.success('Your trip was posted!');
      setForm(initialForm);
      setOrigin(null);
      setDestination(null);
      onCreated?.();
    } catch (err) {
      console.error(err);
      toast.error('Failed to post your trip');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>Share your trip</h3>
      <div className="hstack" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 240 }}>
        <CountrySelect
          value={origin}
          onChange={setOrigin}
          placeholder="From (city)"
        />
        </div>
        <div style={{ minWidth: 240 }}>
        <CountrySelect
          value={destination}
          onChange={setDestination}
          placeholder="To (city)"
        />
        </div>
        <input
          type="date"
          className="input"
          style={inputStyle}
          value={form.travelDate}
          onChange={setField('travelDate')}
        />
        <input
          className="input"
          style={{ ...inputStyle, minWidth: 260, flex: 1 }}
          placeholder="How to contact you (WhatsApp, Telegram, Email...)"
          value={form.contactMethod}
          onChange={setField('contactMethod')}
        />
      </div>

      <textarea
        className="input"
        style={{ ...inputStyle, width: '100%', marginTop: 12 }}
        rows={3}
        placeholder="Optional note (e.g., flight time, baggage details)"
        value={form.message}
        onChange={setField('message')}
      />

      <div className="hstack" style={{ gap: 8, marginTop: 12 }}>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post Trip'}
        </button>
      </div>
    </form>
  );
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  minWidth: 180,
};
