import React, { useState } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import CountrySelect from '../../components/common/CountrySelect';

// Import design system styles
import formStyles from '../../stylus/components/Form.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';

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

  const todayISO = new Date().toISOString().slice(0, 10);

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
        message: (form.message || '').trim(),
        contactMethod: (form.contactMethod || '').trim(),
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
    <form
      onSubmit={handleSubmit}
      className="section"
      style={{ marginBottom: '1rem' }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Share your trip</h3>

      <div
        className="hstack"
        style={{ gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}
      >
        <div style={{ minWidth: 240, flex: '1 1 280px' }}>
          <CountrySelect
            value={origin}
            onChange={setOrigin}
            placeholder="From (city)"
          />
        </div>

        <div style={{ minWidth: 240, flex: '1 1 280px' }}>
          <CountrySelect
            value={destination}
            onChange={setDestination}
            placeholder="To (city)"
          />
        </div>

        <input
          type="date"
          value={form.travelDate}
          onChange={setField('travelDate')}
          aria-label="Date"
          className={formStyles.input}
          style={{ minWidth: 160, flex: '1 1 160px' }}
          min={todayISO}
          required
        />

        <input
          value={form.contactMethod}
          onChange={setField('contactMethod')}
          placeholder="How to contact you (WhatsApp, Telegram, Email...)"
          className={formStyles.input}
          style={{ minWidth: 260, flex: '1 1 260px' }}
        />
      </div>

      <textarea
        className={formStyles.textarea}
        rows={3}
        placeholder="Optional note (e.g., flight time, baggage details)"
        value={form.message}
        onChange={setField('message')}
        style={{ width: '100%', marginTop: '0.75rem' }}
      />

      <div className="hstack" style={{ gap: '0.5rem', marginTop: '0.75rem' }}>
        <button
          type="submit"
          disabled={submitting}
          className={`${buttonStyles.btn} ${buttonStyles.primary}`}
        >
          {submitting ? 'Posting…' : 'Post Trip'}
        </button>
      </div>
    </form>
  );
}

// Legacy inputStyle constant removed. Inputs now use Form.module.scss for styling.
