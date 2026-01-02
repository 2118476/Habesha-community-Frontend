// src/pages/Rentals/Edit.js
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import api from "../../api/axiosInstance";
import { getRental, getRentalWithPhotos, uploadRentalPhotos } from "../../api/rentals";

import sectionStyles from "../../stylus/sections/Rentals.module.scss";
import { PageLoader } from "../../components/ui/PageLoader/PageLoader";
import formStyles from "../../stylus/components/Form.module.scss";
import buttonStyles from "../../stylus/components/Button.module.scss";

const MAX_PHOTOS = 6;
const MAX_FILE_MB = 10;

/**
 * Edit Rental screen:
 * - Loads existing rental data
 * - Checks permission (owner OR ADMIN)
 * - Lets the user edit text fields (title / location / price / roomType / contact / description / featured)
 * - Lets the user remove existing photos
 * - Lets the user add new photos
 * - On save:
 *    1) PUT /rentals/:id with updated fields
 *    2) DELETE each removed photo
 *    3) POST any new photos
 */
export default function EditRental() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // text fields
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
    roomType: "room",
    contact: "",
    featured: false,
  });

  // photos already on server
  // each: { id, url, filename, markedDelete: false }
  const [serverPhotos, setServerPhotos] = useState([]);

  // new files user just picked (not uploaded yet)
  const [newFiles, setNewFiles] = useState([]); // File[]
  const [newPreviews, setNewPreviews] = useState([]); // object URLs

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef(null);

  // figure out if we can submit
  const canSubmit = useMemo(() => {
    return (
      form.title.trim() &&
      form.location.trim() &&
      String(form.price).trim() &&
      !submitting
    );
  }, [form, submitting]);

  // total photos after deletions and new picks
  const currentPhotoSlots = useMemo(() => {
    const keptServer = serverPhotos.filter((p) => !p.markedDelete).length;
    return keptServer + newFiles.length;
  }, [serverPhotos, newFiles]);

  // mark permission (owner or admin)
  function userIsAllowed(rentalData) {
    // figure out who owns it
    const postedBy =
      rentalData.postedBy ||
      rentalData.poster ||
      rentalData.owner ||
      rentalData.user ||
      null;

    const ownerId =
      postedBy?.id ||
      postedBy?.userId ||
      rentalData.ownerId ||
      rentalData.userId ||
      null;

    const meId = user?.id || user?.userId || user?._id || null;

    // roles could be strings or objects, normalise:
    const roles = Array.isArray(user?.roles)
      ? user.roles.map((r) =>
          typeof r === "string"
            ? r.toUpperCase()
            : String(r?.name || "").toUpperCase()
        )
      : [];
    const isAdmin = roles.includes("ADMIN");

    const isOwner = meId && ownerId && String(meId) === String(ownerId);

    return isOwner || isAdmin;
  }

  // load rental data (details + photos)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const [core, withPhotos] = await Promise.all([
          getRental(id).catch(() => null),
          getRentalWithPhotos(id).catch(() => null),
        ]);

        if (cancelled) return;

        if (!core && !withPhotos) {
          toast.error(t("rentals.listingNotFound"));
          navigate(-1);
          return;
        }

        // merged rental object
        const data = { ...(core || {}), ...(withPhotos || {}) };

        // permission check
        if (!userIsAllowed(data)) {
          toast.error(t("rentals.notAllowedToEdit"));
          navigate(`/app/rentals/${id}`);
          return;
        }

        // Pre-fill form from data we know we store in backend
        setForm({
          title: data.title || "",
          description: data.description || "",
          location: data.location || "",
          price:
            data.price !== undefined && data.price !== null
              ? String(data.price)
              : "",
          roomType: data.roomType || data.room_type || "room",
          contact: data.contact || "",
          featured: !!data.featured,
        });

        // Photos:
        // from withPhotos endpoint we mapped:
        // photos: [{ id, url, filename, sortIndex }]
        const mappedPhotos = Array.isArray(data.photos)
          ? data.photos.map((p) => ({
              id: p.id,
              url: p.url,
              filename: p.filename,
              sortIndex: p.sortIndex,
              markedDelete: false,
            }))
          : [];

        setServerPhotos(mappedPhotos);
      } catch (err) {
        console.error(err);
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          t("rentals.failedToLoadRental");
        toast.error(msg);
        navigate(-1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  // field change helper
  const setField = (key) => (e) => {
    const { type, checked, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [key]: type === "checkbox" ? checked : value,
    }));
  };

  // pick new files
  function onPick(e) {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;

    // enforce max total
    if (currentPhotoSlots + picked.length > MAX_PHOTOS) {
      toast.error(t("rentals.maxPhotosTotal", { count: MAX_PHOTOS }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // enforce max filesize
    const tooBig = picked.find(
      (f) => f.size > MAX_FILE_MB * 1024 * 1024
    );
    if (tooBig) {
      toast.error(t("rentals.photoSizeLimit", { size: MAX_FILE_MB }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const nextFiles = [...newFiles, ...picked];
    const nextPreviews = nextFiles.map((f) => URL.createObjectURL(f));

    setNewFiles(nextFiles);
    setNewPreviews(nextPreviews);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // remove a not-yet-uploaded picked file
  function removeNewFile(idx) {
    const nextFiles = newFiles.filter((_, i) => i !== idx);
    const nextPreviews = nextFiles.map((f) => URL.createObjectURL(f));
    setNewFiles(nextFiles);
    setNewPreviews(nextPreviews);
  }

  // toggle delete on existing photo
  function toggleServerPhotoDelete(idx) {
    setServerPhotos((prev) =>
      prev.map((p, i) =>
        i === idx ? { ...p, markedDelete: !p.markedDelete } : p
      )
    );
  }

  // submit:
  // 1. PUT details
  // 2. DELETE marked photos
  // 3. UPLOAD newFiles
  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      setErrorMsg("");

      // 1) update text fields
      const body = {
        title: form.title,
        description: form.description,
        location: form.location,
        price: form.price,
        roomType: form.roomType,
        contact: form.contact,
        featured: form.featured,
      };

      await api.put(`/rentals/${id}`, body);

      // 2) delete photos that were markedDelete = true
      const toDelete = serverPhotos.filter((p) => p.markedDelete);
      for (const p of toDelete) {
        try {
          await api.delete(`/rentals/${id}/photos/${p.id}`);
        } catch (err) {
          console.error("Failed to delete photo", p.id, err);
        }
      }

      // 3) upload new selected photos
      if (newFiles.length) {
        await uploadRentalPhotos(id, newFiles);
      }

      toast.success(t("rentals.listingUpdated"));
      navigate(`/app/rentals/${id}`);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("rentals.updateFailed");
      setErrorMsg(msg);
      toast.error(msg);
      setSubmitting(false); // keep form open for retry
      return;
    }

    // success path already navigated
  }

  const onCancel = () => {
    navigate(`/app/rentals/${id}`);
  };

  const showBannerError = useMemo(
    () => !!errorMsg && !submitting,
    [errorMsg, submitting]
  );

  if (loading) {
    return (
      <div style={{ padding: "16px" }}>
        <PageLoader message="Loading rental..." />
      </div>
    );
  }

  return (
    <div className={sectionStyles.wrapper}>
      <div className={sectionStyles.headerRow}>
        <h1>{t("rentals.editRental")}</h1>
        <Link to={`/app/rentals/${id}`} className={buttonStyles.link}>
          {t("rentals.backToListing")}
        </Link>
      </div>

      {showBannerError && (
        <div
          style={{
            background: "transparent",
            borderBottom: "2px solid #dc2626",
            color: "#dc2626",
            fontSize: "14px",
            fontWeight: 500,
            paddingBottom: "8px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "999px",
              backgroundColor: "#dc2626",
              display: "inline-block",
            }}
          />
          <span>{errorMsg || t("rentals.updateFailed")}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className={formStyles.form}>
        {/* Title */}
        <label>
          {t("rentals.title")}*
          <input
            value={form.title}
            onChange={setField("title")}
            required
            disabled={submitting}
            className={formStyles.input}
            placeholder={t("rentals.titlePlaceholder")}
          />
        </label>

        {/* Location */}
        <label>
          {t("rentals.location")}*
          <input
            value={form.location}
            onChange={setField("location")}
            required
            disabled={submitting}
            className={formStyles.input}
            placeholder={t("rentals.locationPlaceholder")}
          />
        </label>

        {/* Price */}
        <label>
          {t("rentals.pricePerMonth")}*
          <input
            type="number"
            step="1"
            min="0"
            value={form.price}
            onChange={setField("price")}
            required
            disabled={submitting}
            className={formStyles.input}
          />
        </label>

        {/* Room type */}
        <label>
          {t("rentals.houseType")}
          <select
            value={form.roomType}
            onChange={setField("roomType")}
            disabled={submitting}
            className={formStyles.input}
          >
            <option value="room">{t("rentals.room")}</option>
            <option value="studio">{t("rentals.studio")}</option>
            <option value="flat">{t("rentals.flat")}</option>
            <option value="house">{t("rentals.house")}</option>
          </select>
        </label>

        {/* Contact */}
        <label>
          {t("rentals.contact")}
          <input
            value={form.contact}
            onChange={setField("contact")}
            disabled={submitting}
            className={formStyles.input}
            placeholder={t("rentals.contactPlaceholder")}
          />
        </label>

        {/* Description */}
        <label>
          {t("rentals.description")}
          <textarea
            value={form.description}
            onChange={setField("description")}
            disabled={submitting}
            className={formStyles.textarea}
            rows={5}
            placeholder={t("rentals.descriptionPlaceholder")}
          />
        </label>

        {/* Featured toggle */}
        <div className={formStyles.formGroup}>
          <label className={formStyles.checkbox}>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={setField("featured")}
              disabled={submitting}
            />
            <span>{t("rentals.featureListing")}</span>
          </label>
        </div>

        {/* PHOTOS SECTION */}
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

          {/* existing photos from server */}
          {serverPhotos.length > 0 && (
            <>
              <div
                className={sectionStyles.subHeader}
                style={{ marginTop: "12px" }}
              >
                {t("rentals.existingPhotos")}
              </div>
              <div className={sectionStyles.grid}>
                {serverPhotos.map((p, i) => (
                  <div
                    key={p.id}
                    className={sectionStyles.thumb}
                    style={{
                      position: "relative",
                      opacity: p.markedDelete ? 0.4 : 1,
                      outline: p.markedDelete
                        ? "2px solid #dc2626"
                        : "none",
                    }}
                  >
                    <img
                      src={p.url}
                      alt={p.filename || `Photo ${i + 1}`}
                    />
                    <button
                      type="button"
                      className={buttonStyles.ghost}
                      disabled={submitting}
                      onClick={() => toggleServerPhotoDelete(i)}
                    >
                      {p.markedDelete ? t("rentals.undoRemove") : t("common.remove")}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* new (not yet uploaded) photos */}
          {newPreviews.length > 0 && (
            <>
              <div
                className={sectionStyles.subHeader}
                style={{ marginTop: "12px" }}
              >
                {t("rentals.newPhotosToAdd")}
              </div>
              <div className={sectionStyles.grid}>
                {newPreviews.map((src, i) => (
                  <div
                    key={`new-${i}`}
                    className={sectionStyles.thumb}
                  >
                    <img src={src} alt={`new ${i + 1}`} />
                    <button
                      type="button"
                      className={buttonStyles.ghost}
                      disabled={submitting}
                      onClick={() => removeNewFile(i)}
                    >
                      {t("common.remove")}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className={sectionStyles.actions}>
          <button
            type="submit"
            className={`${buttonStyles.btn} ${buttonStyles.primary}`}
            disabled={!canSubmit}
          >
            {submitting ? t("rentals.saving") : t("rentals.saveChanges")}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className={buttonStyles.btn}
            style={{
              border: "1px solid #cbd5e1",
              backgroundColor: "#fff",
            }}
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
