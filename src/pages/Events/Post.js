import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import sectionStyles from '../../stylus/sections/Events.module.scss';
import formStyles from '../../stylus/components/Form.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';

// Form for posting events. Users can optionally feature the event,
// which triggers a Stripe checkout session via a backend call.
const EventPost = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: '',
    date: '',
    description: '',
    imageUrl: '',
    location: '',
    featured: false,
  });
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = 'Title is required';
    if ('price' in form && (isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0)) e.price = 'Enter a valid price';
    if (form.date !== undefined && !form.date) e.date = 'Select a date';
    if (!form.description?.trim()) e.description = 'Description is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix the highlighted errors'); return; }
    try {
      // Build payload expected by the backend. imageUrl maps to the
      // event image URL and featured controls whether the event is
      // highlighted. The backend returns the created Event entity.
      const payload = {
        title: form.title,
        date: form.date,
        description: form.description,
        imageUrl: form.imageUrl,
        location: form.location,
        featured: form.featured,
      };
      const { data } = await api.post('/events', payload);
      if (form.featured) {
        // Promote the event by hitting the promote endpoint; this
        // simply updates the featured flag on the server. No Stripe
        // integration is used here.
        await api.post(`/events/${data.id}/promote`);
      }
      toast.success('Event created');
      setForm({ title: '', date: '', description: '', imageUrl: '', location: '', featured: false });
    } catch {
      toast.error('Failed to create event');
    }
  };

  return (
    <div className={sectionStyles.container}>
      <h2>{t('pages.postAnEvent')}</h2>
      <form onSubmit={handleSubmit} className={formStyles.form}>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title"
          required
          className={formStyles.input}
          aria-invalid={!!errors.title}
        />
        {errors.title && <span className={formStyles.error}>{errors.title}</span>}
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
          className={formStyles.input}
        />
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="Location"
          required
          className={formStyles.input}
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          required
          className={formStyles.textarea}
        />
        {/* Optional image URL input. Users can provide a link to an image hosted elsewhere. */}
        <input
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleChange}
          placeholder="Image URL"
          className={formStyles.input}
        />
        <label className={formStyles.checkboxLabel}>
          <input
            type="checkbox"
            name="featured"
            checked={form.featured}
            onChange={handleChange}
          />
          Feature this event (£10)
        </label>
        <button
          type="submit"
          className={`${buttonStyles.btn} ${buttonStyles.primary}`}
        >
          Create Event
        </button>
      </form>
    </div>
  );
};

export default EventPost;