import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

import sectionStyles from '../../stylus/sections/Travel.module.scss';
import formStyles from '../../stylus/components/Form.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';

// Form to create a new travel post.
// Includes validation, min date, inline error, toast + redirect on success.
const TravelPost = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    originCity: '',
    destinationCity: '',
    travelDate: '',
    message: '',
    contactMethod: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const todayISO = new Date().toISOString().slice(0, 10);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.originCity.trim()) e.originCity = t('forms.required');
    if (!form.destinationCity.trim()) e.destinationCity = t('forms.required');
    if (!form.travelDate) e.travelDate = t('forms.required');
    return e;
  };

  const onBlurDate = () => {
    setErrors((prev) => ({
      ...prev,
      travelDate: !form.travelDate ? t('forms.required') : '',
    }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();

    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      toast.error(t('errors.validation'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        originCity: form.originCity.trim(),
        destinationCity: form.destinationCity.trim(),
        travelDate: form.travelDate, // yyyy-MM-dd
        message: form.message?.trim() || '',
        contactMethod: form.contactMethod.trim(),
      };

      const { data } = await api.post('/travel', payload);

      toast.success(t('toast.saveSuccess'));
      // redirect to details page
      if (data?.id) {
        navigate(`/app/travel/${data.id}`);
      } else {
        navigate('/app/travel');
      }
    } catch (err) {
      console.error(err);
      toast.error(t('errors.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={sectionStyles.container}>
      <div className={sectionStyles.formWrapper}>
        <h2 style={{ marginBottom: 8 }}>{t('travel.postYourTravel')}</h2>
        <p style={{ marginTop: 0, color: '#64748b' }}>
          {t('travel.shareYourRoute')}
        </p>

        <form className={sectionStyles.form} onSubmit={handleSubmit} noValidate>
          <div className={sectionStyles.row}>
            <div className={sectionStyles.col}>
              <label className={formStyles.label} htmlFor="originCity">{t('travel.fromCity')}</label>
              <input
                id="originCity"
                name="originCity"
                type="text"
                value={form.originCity}
                onChange={handleChange}
                required
                className={formStyles.input}
                placeholder={t('travel.fromPlaceholder')}
              />
              {errors.originCity && (
                <div className={formStyles.errorText} role="alert">{errors.originCity}</div>
              )}
            </div>

            <div className={sectionStyles.col}>
              <label className={formStyles.label} htmlFor="destinationCity">{t('travel.toCity')}</label>
              <input
                id="destinationCity"
                name="destinationCity"
                type="text"
                value={form.destinationCity}
                onChange={handleChange}
                required
                className={formStyles.input}
                placeholder={t('travel.toPlaceholder')}
              />
              {errors.destinationCity && (
                <div className={formStyles.errorText} role="alert">{errors.destinationCity}</div>
              )}
            </div>

            <div className={sectionStyles.col}>
              <label className={formStyles.label} htmlFor="travelDate">{t('travel.travelDate')}</label>
              <input
                id="travelDate"
                type="date"
                name="travelDate"
                value={form.travelDate}
                onChange={handleChange}
                onBlur={onBlurDate}
                required
                className={formStyles.input}
                min={todayISO}
              />
              {errors.travelDate && (
                <div className={formStyles.errorText} role="alert">{errors.travelDate}</div>
              )}
            </div>
          </div>

          <label className={formStyles.label} htmlFor="message">{t('travel.messageOptional')}</label>
          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={4}
            className={formStyles.textarea}
            placeholder={t('travel.messagePlaceholder')}
          />

          <label className={formStyles.label} htmlFor="contactMethod">{t('travel.preferredContact')}</label>
          <input
            id="contactMethod"
            name="contactMethod"
            type="text"
            value={form.contactMethod}
            onChange={handleChange}
            className={formStyles.input}
            placeholder={t('travel.contactPlaceholder')}
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              type="submit"
              disabled={submitting}
              className={buttonStyles.button}
              style={{
                color: '#ffffff',
                backgroundColor: 'var(--btn-brand, #2563eb)',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? t('forms.submitting') : t('travel.postTravel')}
            </button>
            <button
              type="button"
              className={buttonStyles.ghost}
              onClick={() => navigate('/app/travel')}
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TravelPost;
