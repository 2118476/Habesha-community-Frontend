import React, { useState } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Form to create a rental listing. Supports uploading multiple
// images using FormData. Users can optionally mark their listing
// as featured to trigger a payment flow on the backend.
const RentalsPost = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    roomType: '',
    contact: '',
    images: '',
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
      // Build a JSON payload. Images can be entered as a comma‑separated list of URLs.
      const imageList = form.images
        ? form.images
            .split(',')
            .map((img) => img.trim())
            .filter((img) => img)
        : [];
      const payload = {
        title: form.title,
        description: form.description,
        location: form.location,
        price: parseFloat(form.price || 0),
        roomType: form.roomType,
        contact: form.contact,
        images: imageList,
        featured: form.featured,
      };
      await api.post('/rentals', payload);
      toast.success('Rental listing created');
      setForm({
        title: '',
        description: '',
        location: '',
        price: '',
        roomType: '',
        contact: '',
        images: '',
        featured: false,
      });
    } catch {
      toast.error('Failed to create rental');
    }
  };

  return (
    <div>
      <h2>Post Rental</h2>
      <form onSubmit={handleSubmit} className="form">
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" required />
        <input name="location" value={form.location} onChange={handleChange} placeholder="Location" required />
        <input name="price" value={form.price} onChange={handleChange} placeholder="Price" required />
        <input name="roomType" value={form.roomType} onChange={handleChange} placeholder="Room type" required />
        <input name="contact" value={form.contact} onChange={handleChange} placeholder="Contact info" required />
        {/* Accept comma separated image URLs rather than file uploads */}
        <input name="images" value={form.images} onChange={handleChange} placeholder="Image URLs (comma separated)" />
        <label className="checkbox-label">
          <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} /> Feature this listing (£10)
        </label>
        <button type="submit" className="btn-primary">Create Listing</button>
      </form>
    </div>
  );
};

export default RentalsPost;