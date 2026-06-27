import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { makeApiUrl } from '../../api/httpUrl';
import { toast } from 'react-toastify';
import formStyles from '../../stylus/components/Form.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';
import { PageLoader } from '../../components/ui/PageLoader/PageLoader';

export default function EditService() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    estimatedTime: '',
    basePrice: '',
    location: '',
    mode: 'IN_PERSON',
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = t('services.titleRequired', 'Title is required');
    if (form.basePrice !== '' && (isNaN(parseFloat(form.basePrice)) || parseFloat(form.basePrice) < 0))
      e.basePrice = t('services.invalidPrice', 'Enter a valid price');
    if (!form.description?.trim()) e.description = t('services.descriptionRequired', 'Description is required');
    return e;
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/services/' + id);
        // The detail DTO returns `price` (not `basePrice`); map it back so the
        // field is populated and saved under the right name.
        setForm((prev) => ({
          ...prev,
          category: data.category ?? '',
          title: data.title ?? '',
          description: data.description ?? '',
          estimatedTime: data.estimatedTime ?? '',
          basePrice: data.price ?? data.basePrice ?? '',
          location: data.location ?? '',
          mode: data.mode ?? 'IN_PERSON',
          imageUrl: data.imageUrl ?? '',
        }));
      } catch (e) {
        toast.error(t('services.failedToLoad', 'Failed to load service'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const eobj = validate();
    if (Object.keys(eobj).length) {
      setErrors(eobj);
      toast.error(t('common.fixErrors', 'Please fix the highlighted errors'));
      return;
    }
    setSaving(true);
    try {
      // Clean payload that matches the entity field names (basePrice, not price).
      const payload = {
        category: form.category,
        title: form.title,
        description: form.description,
        estimatedTime: form.estimatedTime,
        basePrice: form.basePrice === '' ? null : parseFloat(form.basePrice),
        location: form.location,
        mode: form.mode,
      };
      await api.put('/api/services/' + id, payload);

      // Replace the cover image only if a new one was chosen. The backend
      // upload swaps it on Supabase (and deletes the previous object).
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        try {
          await api.post(`/api/services/${id}/image`, fd);
        } catch (err) {
          const detail = err?.response?.data;
          toast.warn(
            typeof detail === 'string' && detail
              ? `Saved, but the new image failed to upload: ${detail}`
              : t('services.imageUpdateFailed', 'Saved, but the new image failed to upload.')
          );
        }
      }

      toast.success(t('services.updated', 'Service updated'));
      navigate(-1);
    } catch (e) {
      toast.error(t('services.updateFailed', 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div style={{ padding: 16 }}>
        <PageLoader message={t('services.loading', 'Loading service…')} />
      </div>
    );

  const previewSrc = imageFile
    ? URL.createObjectURL(imageFile)
    : form.imageUrl
    ? makeApiUrl(form.imageUrl)
    : null;

  return (
    <div style={{ padding: 16, maxWidth: 720, marginInline: 'auto' }}>
      <h2>{t('services.editService', 'Edit Service')}</h2>
      <form onSubmit={onSubmit} className={formStyles.form}>
        <input
          name="category"
          value={form.category || ''}
          onChange={onChange}
          className={formStyles.input}
          placeholder={t('services.categoryPlaceholder', 'Category')}
        />
        <input
          name="title"
          value={form.title || ''}
          onChange={onChange}
          className={formStyles.input}
          aria-invalid={!!errors.title}
          placeholder={t('services.titlePlaceholder', 'Title')}
        />
        {errors.title && <span className={formStyles.error}>{errors.title}</span>}

        <textarea
          name="description"
          value={form.description || ''}
          onChange={onChange}
          className={formStyles.textarea}
          aria-invalid={!!errors.description}
          placeholder={t('services.descriptionPlaceholder', 'Description')}
        />
        {errors.description && <span className={formStyles.error}>{errors.description}</span>}

        <input
          name="estimatedTime"
          value={form.estimatedTime || ''}
          onChange={onChange}
          className={formStyles.input}
          placeholder={t('services.estimatedTimePlaceholder', 'Estimated time')}
        />

        <input
          name="basePrice"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={form.basePrice ?? ''}
          onChange={onChange}
          className={formStyles.input}
          aria-invalid={!!errors.basePrice}
          placeholder={t('services.basePricePlaceholder', 'Base price (£)')}
        />
        {errors.basePrice && <span className={formStyles.error}>{errors.basePrice}</span>}

        <input
          name="location"
          value={form.location || ''}
          onChange={onChange}
          className={formStyles.input}
          placeholder={t('services.locationPlaceholder', 'Location')}
        />

        <select name="mode" value={form.mode || 'IN_PERSON'} onChange={onChange} className={formStyles.select}>
          <option value="IN_PERSON">{t('services.inPerson', 'In person')}</option>
          <option value="ONLINE">{t('services.online', 'Online')}</option>
        </select>

        <label className={formStyles.label} htmlFor="svc-edit-image" style={{ marginTop: 8 }}>
          {t('services.coverImage', 'Cover image')}
        </label>
        {previewSrc && (
          <img
            src={previewSrc}
            alt={t('services.coverImage', 'Cover image')}
            style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 12, objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <input
          id="svc-edit-image"
          type="file"
          accept="image/*"
          className={formStyles.input}
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={saving} className={`${buttonStyles.btn} ${buttonStyles.primary}`}>
            {saving ? t('common.saving', 'Saving…') : t('common.save', 'Save')}
          </button>
          <button
            type="button"
            className={buttonStyles.btn}
            onClick={() => navigate(-1)}
            style={{ marginLeft: 8 }}
          >
            {t('common.cancel', 'Cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
