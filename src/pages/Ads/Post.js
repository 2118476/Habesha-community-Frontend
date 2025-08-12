import React, { useState } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Form to create a new classified ad
const AdPost = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    contact: '',
    category: '',
    featured: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const descWithContact = form.contact
        ? `${form.description}\nContact: ${form.contact}`
        : form.description;

      const payload = {
        title: form.title,
        description: descWithContact,
        price: parseFloat(form.price || 0),
        category: form.category || 'General',
        imageUrl: '', // Optional — not used currently
        featured: form.featured,
      };

      console.log('Submitting ad:', payload); // ✅ Debug
      await api.post('/ads', payload);
      toast.success('Ad created');

      // Reset form
      setForm({
        title: '',
        description: '',
        price: '',
        contact: '',
        category: '',
        featured: false,
      });
    } catch (error) {
      console.error('Failed to create ad:', error); // ✅ Debug actual error
      toast.error('Failed to create ad');
    }
  };

  return (
    <div>
      <h2>Post an Ad</h2>
      <form onSubmit={handleSubmit} className="form">
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" required />
        <input name="price" value={form.price} onChange={handleChange} placeholder="Price" type="number" required />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" required />
        <input name="contact" value={form.contact} onChange={handleChange} placeholder="Contact info" required />
        <label className="checkbox-label">
          <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} />
          Feature this ad (£10)
        </label>
        <button type="submit" className="btn-primary">Create Ad</button>
      </form>
    </div>
  );
};

export default AdPost;
