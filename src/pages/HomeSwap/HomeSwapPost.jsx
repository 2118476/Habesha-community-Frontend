// src/pages/HomeSwap/HomeSwapPost.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../api/axiosInstance";
import { toast } from "react-toastify";
import formStyles from "../../stylus/components/Form.module.scss";
import buttonStyles from "../../stylus/components/Button.module.scss";
import styles from "../../stylus/sections/HomeSwap.module.scss";

const MAX_PHOTOS = 6;
const MAX_FILE_MB = 10;

export default function HomeSwapPost() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: "",
    location: "",
    description: "",
    homeType: "entire",
    bedrooms: "1",
  });

  const [photos, setPhotos] = useState([]);     // File[]
  const [previews, setPreviews] = useState([]); // string[]
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const setField = (k) => (e) =>
    setForm((v) => ({ ...v, [k]: e.target.value }));

  const canSubmit = useMemo(
    () => Boolean(form.title.trim() && form.location.trim()),
    [form.title, form.location]
  );

  // Build previews & clean them up on change/unmount
  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  const onPick = (e) => {
    const files = Array.from(e.target.files || []).filter(Boolean);
    if (!files.length) return;

    const combined = [...photos, ...files];
    if (combined.length > MAX_PHOTOS) {
      toast.warn(t('homeSwap.maxPhotos', { count: MAX_PHOTOS }));
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    for (const f of files) {
      if (!f.type?.startsWith?.("image/")) {
        toast.error(t('homeSwap.onlyImageFiles'));
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(t('homeSwap.photoSizeLimit', { size: MAX_FILE_MB }));
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
    }

    setPhotos(combined);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeAt = (i) => {
    setPhotos((arr) => arr.filter((_, idx) => idx !== i));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    try {
      const fd = new FormData();

      const payload = {
        title: form.title.trim(),
        location: form.location.trim(),
        description: form.description?.trim() || "",
        homeType: form.homeType,
        bedrooms: String(form.bedrooms ?? "1"),
      };

      fd.append("data", JSON.stringify(payload));
      for (const f of photos) fd.append("photos", f);

      const { data } = await api.post("/homeswap", fd, { withCredentials: true });

      toast.success(t('homeSwap.posted'));
      navigate(`/app/home-swap/${data.id}`);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data ||
        err?.message ||
        t('homeSwap.failedToPost');
      toast.error(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${formStyles.wrap} ${styles.wrap}`}>
      <h2 className={`${formStyles.title} ${styles.title}`}>{t('homeSwap.postTitle')}</h2>

      <form onSubmit={submit} className={formStyles.form} noValidate>
        <label>
          {t('homeSwap.title')}*
          <input
            value={form.title}
            onChange={setField("title")}
            placeholder={t('homeSwap.titlePlaceholder')}
            required
            disabled={submitting}
          />
        </label>

        <label>
          {t('homeSwap.location')}*
          <input
            value={form.location}
            onChange={setField("location")}
            placeholder={t('homeSwap.locationPlaceholder')}
            required
            disabled={submitting}
          />
        </label>

        <label>
          {t('homeSwap.homeType')}
          <select
            value={form.homeType}
            onChange={setField("homeType")}
            disabled={submitting}
          >
            <option value="entire">{t('homeSwap.entirePlace')}</option>
            <option value="room">{t('homeSwap.privateRoom')}</option>
          </select>
        </label>

        <label>
          {t('homeSwap.bedrooms')}
          <input
            type="number"
            min="0"
            value={form.bedrooms}
            onChange={setField("bedrooms")}
            disabled={submitting}
          />
        </label>

        <label>
          {t('homeSwap.description')}
          <textarea
            rows={4}
            value={form.description}
            onChange={setField("description")}
            placeholder={t('homeSwap.descriptionPlaceholder')}
            disabled={submitting}
          />
        </label>

        <div className={`${formStyles.field} ${styles.field}`}>
          <div>{t('homeSwap.photos', { count: MAX_PHOTOS })}</div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onPick}
            aria-label={t('homeSwap.choosePhotos')}
            disabled={submitting}
          />

          <div className={styles.thumbGrid}>
            {previews.map((src, i) => (
              <div key={i} className={styles.thumb}>
                <img src={src} alt={t('homeSwap.photoAlt', { number: i + 1 })} />
                <button
                  type="button"
                  className={buttonStyles.sm}
                  onClick={() => removeAt(i)}
                  aria-label={t('homeSwap.removePhoto', { number: i + 1 })}
                  disabled={submitting}
                >
                  {t('homeSwap.remove')}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={`${formStyles.actions} ${styles.actions}`}>
          <button className={buttonStyles.primary} disabled={!canSubmit || submitting}>
            {submitting ? t('homeSwap.posting') : t('common.post')}
          </button>
          <Link to="/app/home-swap" className={buttonStyles.ghost}>
            {t('common.cancel')}
          </Link>
          {!canSubmit && (
            <span className={styles.hint} aria-live="polite">
              {t('homeSwap.fillRequiredFields')}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
