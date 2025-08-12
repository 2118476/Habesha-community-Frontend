import React, { useState } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Form for service providers to create a new service listing. The
// backend calculates commissions and may restrict who can post
// services based on role.
const ServicePost = () => {
  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    estimatedTime: '',
    basePrice: '',
    location: '',
    mode: 'IN_PERSON',
    featured: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert mode to uppercase enum (IN_PERSON/ONLINE) as expected by the backend
      const payload = {
        category: form.category,
        title: form.title,
        description: form.description,
        estimatedTime: form.estimatedTime,
        basePrice: parseFloat(form.basePrice || 0),
        location: form.location,
        mode: form.mode,
        featured: form.featured,
      };
      await api.post('/services', payload);
      toast.success('Service created');
      setForm({ category: '', title: '', description: '', estimatedTime: '', basePrice: '', location: '', mode: 'IN_PERSON', featured: false });
    } catch {
      toast.error('Failed to create service');
    }
  };

  return (
    <div>
      <h2>Post a Service</h2>
      <form onSubmit={handleSubmit} className="form">
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" required />
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" required />
        <input name="estimatedTime" value={form.estimatedTime} onChange={handleChange} placeholder="Estimated time" required />
        <input name="basePrice" value={form.basePrice} onChange={handleChange} placeholder="Base price" required />
        <input name="location" value={form.location} onChange={handleChange} placeholder="Location" required />
        <select name="mode" value={form.mode} onChange={handleChange}>
          <option value="IN_PERSON">In Person</option>
          <option value="ONLINE">Online</option>
        </select>
        <label className="checkbox-label">
          <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} /> Feature this service (£10)
        </label>
        <button type="submit" className="btn-primary">Create Service</button>
      </form>
    </div>
  );
};

export default ServicePost;