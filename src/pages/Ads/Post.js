import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { uploadAdPhotos } from '../../api/ads';
import { toast } from 'react-toastify';
import sectionStyles from '../../stylus/sections/Ads.module.scss';
import formStyles from '../../stylus/components/Form.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';

const MAX_PHOTOS = 6;
const MAX_FILE_MB = 10;

// Form to create a new classified ad
const AdPost = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    contact: '',
    category: '',
    featured: false,
  });
  const [files, setFiles] = useState([]);        // File[]
  const [previews, setPreviews] = useState([]);  // object URLs
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const canSubmit = useMemo(() => {
    // Allow submission if at least one field has content
    const hasContent = form.title.trim() || form.description.trim() || form.price.trim() || form.contact.trim() || form.category.trim();
    return hasContent && !submitting;
  }, [form, submitting]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const onPick = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    if (files.length + picked.length > MAX_PHOTOS) {
      toast.error(t("ads.maxPhotos", { count: MAX_PHOTOS }) || `Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }
    const tooBig = picked.find(f => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) {
      toast.error(t("ads.photoSizeLimit", { size: MAX_FILE_MB }) || `Photo size must be under ${MAX_FILE_MB}MB`);
      return;
    }
    const next = [...files, ...picked];
    setFiles(next);
    setPreviews(next.map(f => URL.createObjectURL(f)));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (idx) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    setPreviews(next.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      // Build description with contact info if provided
      let finalDescription = form.description.trim();
      if (form.contact.trim()) {
        finalDescription = finalDescription 
          ? `${finalDescription}\n${t('ads.contact')}: ${form.contact.trim()}`
          : `${t('ads.contact')}: ${form.contact.trim()}`;
      }

      const payload = {
        title: form.title.trim() || 'Community Post',
        description: finalDescription || 'Shared from community',
        price: form.price.trim() ? parseFloat(form.price) : 0,
        category: form.category.trim() || t('ads.general', 'General'),
        imageUrl: '', // Will be updated after photo upload
        featured: form.featured,
      };

      // Validate price is a valid number
      if (isNaN(payload.price)) {
        payload.price = 0;
      }

      const { data } = await api.post('/ads', payload);
      
      // Upload photos if any
      if (files.length && data?.id) {
        try {
          await uploadAdPhotos(data.id, files);
        } catch (uploadError) {
          console.error('Photo upload failed:', uploadError);
          toast.error('Photo upload failed: ' + uploadError.message);
        }
      }
      
      toast.success(t('toast.saveSuccess'));

      // Navigate to ads list to see the new ad with photo
      navigate('/app/ads');
    } catch (error) {
      console.error('Failed to create ad:', error); // ✅ Debug actual error
      toast.error(t('errors.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={sectionStyles.container}>
      <h2 style={{ color: 'var(--text-1, #1a1a1a)', marginBottom: '20px' }}>
        {t('pages.postAnAd')}
      </h2>
      <form onSubmit={handleSubmit} className={formStyles.form}>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder={t('ads.title') + ' (optional)'}
          className={formStyles.input}
          style={{ color: 'var(--text-1, #1a1a1a)' }}
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder={t('ads.description') + ' (optional)'}
          className={formStyles.textarea}
          style={{ color: 'var(--text-1, #1a1a1a)' }}
        />
        <input
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder={t('ads.price') + ' (optional)'}
          type="number"
          className={formStyles.input}
          style={{ color: 'var(--text-1, #1a1a1a)' }}
        />
        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder={t('ads.category') + ' (optional)'}
          className={formStyles.input}
          style={{ color: 'var(--text-1, #1a1a1a)' }}
        />
        <input
          name="contact"
          value={form.contact}
          onChange={handleChange}
          placeholder={t('ads.contactInfo', 'Contact info') + ' (optional)'}
          className={formStyles.input}
          style={{ color: 'var(--text-1, #1a1a1a)' }}
        />
        <label className={formStyles.checkboxLabel} style={{ color: 'var(--text-1, #1a1a1a)' }}>
          <input
            type="checkbox"
            name="featured"
            checked={form.featured}
            onChange={handleChange}
          />
          {t('rentals.featureListing', 'Feature this ad (£10)')}
        </label>

        {/* Photo Upload Section */}
        <div className={sectionStyles.photosBox || formStyles.formGroup}>
          <div className={sectionStyles.photosHeader || formStyles.label}>
            <label style={{ color: 'var(--text-1, #1a1a1a)', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              {t("ads.photos", "Photos")} ({t("ads.photosUpTo", `Up to ${MAX_PHOTOS} photos`)})
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onPick}
              disabled={submitting}
              className={formStyles.input}
              style={{ marginBottom: '12px' }}
            />
          </div>
          {!!previews.length && (
            <div className={sectionStyles.grid || formStyles.photoGrid} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '12px',
              marginTop: '12px'
            }}>
              {previews.map((src, i) => (
                <div key={i} className={sectionStyles.thumb || formStyles.photoThumb} style={{
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid var(--border, #e5e7eb)'
                }}>
                  <img 
                    src={src} 
                    alt={`Preview ${i+1}`} 
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  <button
                    type="button"
                    className={`${buttonStyles.btn} ${buttonStyles.subtle}`}
                    onClick={() => removePhoto(i)}
                    disabled={submitting}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`${buttonStyles.btn} ${buttonStyles.primary}`}
            style={{
              color: '#ffffff',
              backgroundColor: 'var(--btn-brand, #2563eb)',
              opacity: !canSubmit ? 0.7 : 1,
              cursor: !canSubmit ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? t('forms.submitting') : t('ads.createAd', 'Create Ad')}
          </button>
          <button
            type="button"
            className={`${buttonStyles.btn} ${buttonStyles.subtle}`}
            onClick={() => navigate('/app/ads')}
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdPost;
