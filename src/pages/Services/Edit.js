
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import formStyles from '../../stylus/components/Form.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';
import { PageLoader } from '../../components/ui/PageLoader/PageLoader';

export default function EditService() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({title:'',description:'',location:'',basePrice:'',mode:'IN_PERSON'});
  const [imageFile, setImageFile] = useState(null);
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
        const { data } = await api.get('/api/services/' + id);
        setForm({ ...form, ...data });
      } catch (e) {
        toast.error('Failed to load service');
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
    setSaving(true);
    try {
      await api.put('/api/services/' + id, form);
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        try {
          await api.post(`/api/services/${id}/image`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch {
          toast.warn('Saved, but the new image failed to upload.');
        }
      }
      toast.success('Service updated');
      navigate(-1);
    } catch (e) {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ padding: 16 }}>
      <PageLoader message="Loading service..." />
    </div>
  );

  return (
    <div style={{ padding: 16 }}>
      <h2>Edit Service</h2>
      <form onSubmit={onSubmit} className={formStyles.form}>
        <input name="title" value={form.title || ''} onChange={onChange} className={formStyles.input} aria-invalid={!!errors.title} placeholder="Title" />
        {errors.title && <span className={formStyles.error}>{errors.title}</span>}
        <textarea name="description" value={form.description || ''} onChange={onChange} className={formStyles.textarea} aria-invalid={!!errors.description} placeholder="Description" />
        {errors.description && <span className={formStyles.error}>{errors.description}</span>}
        <input name="price" value={form.price ?? ''} onChange={onChange} className={formStyles.input} placeholder="Price" />
        <input name="location" value={form.location || ''} onChange={onChange} className={formStyles.input} placeholder="Location" />

        <label className={formStyles.label} htmlFor="svc-edit-image" style={{ marginTop: 8 }}>Cover image</label>
        <img
          src={imageFile ? URL.createObjectURL(imageFile) : `${api.defaults.baseURL}/api/services/${id}/image`}
          alt="Service cover"
          style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 12, objectFit: 'cover' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <input id="svc-edit-image" type="file" accept="image/*" className={formStyles.input} onChange={(e) => setImageFile(e.target.files?.[0] || null)} />

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={saving} className={`${buttonStyles.btn} ${buttonStyles.primary}`}>{saving ? 'Saving…' : 'Save'}</button>
          <button type="button" className={buttonStyles.btn} onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
