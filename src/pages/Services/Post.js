import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import sectionStyles from '../../stylus/sections/Services.module.scss';
import formStyles from '../../stylus/components/Form.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';

// Form for service providers to create a new service listing. The
// backend calculates commissions and may restrict who can post
// services based on role.
const ServicePost = () => {
  const { t } = useTranslation();
  const [imageFile, setImageFile] = useState(null);
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
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix the highlighted errors'); return; }
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
      await api.post('/api/services', payload);
      toast.success('Service created');
      setForm({ category: '', title: '', description: '', estimatedTime: '', basePrice: '', location: '', mode: 'IN_PERSON', featured: false });
    } catch {
      toast.error('Failed to create service');
    }
  };

  return (
    <div className={sectionStyles.container}>
      <h2>{t('services.postService')}</h2>
      <form onSubmit={handleSubmit} className={formStyles.form}>
        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder={t('services.categoryPlaceholder')}
          required
          className={formStyles.input}
          aria-invalid={!!errors.title}
        />
        {errors.title && <span className={formStyles.error}>{errors.title}</span>}
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder={t('services.titlePlaceholder')}
          required
          className={formStyles.input}
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder={t('services.descriptionPlaceholder')}
          required
          className={formStyles.textarea}
        />
        <input
          name="estimatedTime"
          value={form.estimatedTime}
          onChange={handleChange}
          placeholder={t('services.estimatedTimePlaceholder')}
          required
          className={formStyles.input}
        />
        <input
          name="basePrice"
          value={form.basePrice}
          onChange={handleChange}
          placeholder={t('services.basePricePlaceholder')}
          required
          className={formStyles.input}
        />
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder={t('services.locationPlaceholder')}
          required
          className={formStyles.input}
        />
        <select
          name="mode"
          value={form.mode}
          onChange={handleChange}
          className={formStyles.select}
        >
          <option value="IN_PERSON">{t('services.inPerson')}</option>
          <option value="ONLINE">{t('services.online')}</option>
        </select>
        <label className={formStyles.checkboxLabel}>
          <input
            type="checkbox"
            name="featured"
            checked={form.featured}
            onChange={handleChange}
          />
          Feature this service (£10)
        </label>

        <label className={formStyles.label} htmlFor="svc-image">{t('services.imageOptional')}</label>
        <input id="svc-image" type="file" accept="image/*" className={formStyles.input} onChange={(e)=>setImageFile(e.target.files?.[0]||null)} />
        <button
          type="submit"
          className={`${buttonStyles.btn} ${buttonStyles.primary}`}
        >
          Create Service
        </button>
      </form>
    </div>
  );
};

export default ServicePost;