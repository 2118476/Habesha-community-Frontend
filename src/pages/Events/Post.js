import React, { useState } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Form for posting events. Users can optionally feature the event,
// which triggers a Stripe checkout session via a backend call.
const EventPost = () => {
  const [form, setForm] = useState({
    title: '',
    date: '',
    description: '',
    imageUrl: '',
    location: '',
    featured: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div>
      <h2>Post an Event</h2>
      <form onSubmit={handleSubmit} className="form">
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required />
        <input type="date" name="date" value={form.date} onChange={handleChange} required />
        <input name="location" value={form.location} onChange={handleChange} placeholder="Location" required />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" required />
        {/* Optional image URL input. Users can provide a link to an image hosted elsewhere. */}
        <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="Image URL" />
        <label className="checkbox-label">
          <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} /> Feature this event (£10)
        </label>
        <button type="submit" className="btn-primary">Create Event</button>
      </form>
    </div>
  );
};

export default EventPost;