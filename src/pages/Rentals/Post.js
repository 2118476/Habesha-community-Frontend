// src/pages/Rentals/Post.js
import React, { useMemo, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { createRental, uploadRentalPhotos } from '../../api/rentals';
import sectionStyles from '../../stylus/sections/Rentals.module.scss';
import formStyles from '../../stylus/components/Form.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';

const MAX_PHOTOS = 6;
const MAX_FILE_MB = 10;

export default function RentalsPost() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    roomType: 'room',
    contact: '',
    featured: false,
  });
  const [files, setFiles] = useState([]);        // File[]
  const [previews, setPreviews] = useState([]);  // object URLs
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const nav = useNavigate();

  const canSubmit = useMemo(() => {
    return form.title.trim() && form.location.trim() && String(form.price).trim() && !submitting;
  }, [form, submitting]);

  const setField = (k) => (e) =>
    setForm((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  function onPick(e) {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    if (files.length + picked.length > MAX_PHOTOS) {
      toast.error(t("rentals.maxPhotos", { count: MAX_PHOTOS }));
      return;
    }
    const tooBig = picked.find(f => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) {
      toast.error(t("rentals.photoSizeLimit", { size: MAX_FILE_MB }));
      return;
    }
    const next = [...files, ...picked];
    setFiles(next);
    setPreviews(next.map(f => URL.createObjectURL(f)));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removePhoto(idx) {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    setPreviews(next.map(f => URL.createObjectURL(f)));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      // 1) create rental
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        price: Number(form.price),
        roomType: form.roomType || 'room',
        contact: form.contact.trim(),
        featured: !!form.featured,
      };
      const created = await createRental(payload);
      const id = created.id;
      if (!id) throw new Error(t("rentals.failedToCreateRental"));

      // 2) upload images (optional)
      if (files.length) {
        await uploadRentalPhotos(id, files);
      }

      toast.success(t("rentals.rentalListingCreated"));
      nav(`/app/rentals/${id}`);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || t("rentals.failedToCreateListing"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={sectionStyles.wrapper}>
      <div className={sectionStyles.headerRow}>
        <h1>{t("rentals.postRental")}</h1>
        <Link to="/app/rentals" className={buttonStyles.link}>{t("rentals.backToListings")}</Link>
      </div>

      <form onSubmit={onSubmit} className={formStyles.form}>
        <label>
          {t("rentals.title")}*
          <input
            value={form.title}
            onChange={setField('title')}
            required
            disabled={submitting}
            className={formStyles.input}
            placeholder={t("rentals.titlePlaceholder")}
          />
        </label>

        <label>
          {t("rentals.location")}*
          <input
            value={form.location}
            onChange={setField('location')}
            required
            disabled={submitting}
            className={formStyles.input}
            placeholder={t("rentals.locationPlaceholder")}
          />
        </label>

        <label>
          {t("rentals.pricePerMonth")}*
          <input
            type="number"
            step="1"
            min="0"
            value={form.price}
            onChange={setField('price')}
            required
            disabled={submitting}
            className={formStyles.input}
          />
        </label>

        <label>
          {t("rentals.houseType")}
          <select
            value={form.roomType}
            onChange={setField('roomType')}
            disabled={submitting}
            className={formStyles.input}
          >
            <option value="room">{t("rentals.room")}</option>
            <option value="studio">{t("rentals.studio")}</option>
            <option value="flat">{t("rentals.flat")}</option>
            <option value="house">{t("rentals.house")}</option>
          </select>
        </label>

        <label>
          {t("rentals.contact")}
          <input
            value={form.contact}
            onChange={setField('contact')}
            disabled={submitting}
            className={formStyles.input}
            placeholder={t("rentals.contactPlaceholder")}
          />
        </label>

        <label>
          {t("rentals.description")}
          <textarea
            value={form.description}
            onChange={setField('description')}
            disabled={submitting}
            className={formStyles.textarea}
            rows={5}
            placeholder={t("rentals.descriptionPlaceholder")}
          />
        </label>

        <div className={formStyles.formGroup}>
          <label className={formStyles.checkbox}>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={setField('featured')}
              disabled={submitting}
            />
            <span>{t("rentals.featureListing")}</span>
          </label>
        </div>

        <div className={sectionStyles.photosBox}>
          <div className={sectionStyles.photosHeader}>
            <div>{t("rentals.photosUpTo", { count: MAX_PHOTOS })}</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onPick}
              disabled={submitting}
            />
          </div>
          {!!previews.length && (
            <div className={sectionStyles.grid}>
              {previews.map((src, i) => (
                <div key={i} className={sectionStyles.thumb}>
                  <img src={src} alt={`Preview ${i+1}`} />
                  <button
                    type="button"
                    className={buttonStyles.ghost}
                    onClick={() => removePhoto(i)}
                    disabled={submitting}
                  >
                    {t("common.remove")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={sectionStyles.actions}>
          <button
            type="submit"
            className={`${buttonStyles.btn} ${buttonStyles.primary}`}
            disabled={!canSubmit}
          >
            {submitting ? t("rentals.posting") : t("rentals.createListing")}
          </button>
        </div>
      </form>
    </div>
  );
}
