
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import formStyles from '../../stylus/components/Form.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';
import { PageLoader } from '../../components/ui/PageLoader/PageLoader';

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({title:'',description:'',location:'',date:''});
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = 'Title is required';
    if (form.price !== undefined && (isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0)) e.price = 'Enter a valid price';
    if (form.date !== undefined && !form.date) e.date = 'Select a date';
    if (!form.description?.trim()) e.description = 'Description is required';
    return e;
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/events/' + id);
        setForm({ ...form, ...data });
      } catch (e) {
        toast.error('Failed to load event');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, [id]);

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const eobj = validate();
    if (Object.keys(eobj).length) { setErrors(eobj); toast.error('Please fix the highlighted errors'); return; }
    try {
      await api.put('/api/events/' + id, form);
      toast.success('Event updated');
      navigate(-1);
    } catch (e) {
      toast.error('Update failed');
    }
  };

  if (loading) return (
    <div style={{ padding: 16 }}>
      <PageLoader message="Loading event..." />
    </div>
  );

  return (
    <div style={{ padding: 16 }}>
      <h2>Edit Event</h2>
      <form onSubmit={onSubmit} className={formStyles.form}>
        <input name="title" value={form.title || ''} onChange={onChange} className={formStyles.input} aria-invalid={!!errors.title} placeholder="Title" />
        {errors.title && <span className={formStyles.error}>{errors.title}</span>}
        <textarea name="description" value={form.description || ''} onChange={onChange} className={formStyles.textarea} aria-invalid={!!errors.description} placeholder="Description" />
        {errors.description && <span className={formStyles.error}>{errors.description}</span>}
        <input name="price" value={form.price ?? ''} onChange={onChange} className={formStyles.input} placeholder="Price" />
        <input name="location" value={form.location || ''} onChange={onChange} className={formStyles.input} placeholder="Location" />
        <div style={{ marginTop: 12 }}>
          <button type="submit" className={`${buttonStyles.btn} ${buttonStyles.primary}`}>Save</button>
          <button type="button" className={buttonStyles.btn} onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
