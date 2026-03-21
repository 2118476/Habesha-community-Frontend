// src/pages/HomeSwap/HomeSwapEdit.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import { getHomeSwap, updateHomeSwap } from "../../api/homeswap";

import formStyles from "../../stylus/components/Form.module.scss";
import buttonStyles from "../../stylus/components/Button.module.scss";
import styles from "../../stylus/sections/HomeSwap.module.scss";
import { PageLoader } from "../../components/ui/PageLoader/PageLoader";

const MAX_PHOTOS = 6;
const MAX_FILE_MB = 10;

export default function HomeSwapEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    location: "",
    description: "",
    homeType: "entire",
    bedrooms: "1",
  });
  const [errorMsg, setErrorMsg] = useState("");

  // Photo state
  const [existingPhotos, setExistingPhotos] = useState([]); // from server: { id, url }
  const [removePhotoIds, setRemovePhotoIds] = useState([]); // IDs to remove
  const [newPhotos, setNewPhotos] = useState([]);            // File[]
  const [newPreviews, setNewPreviews] = useState([]);        // blob URLs
  const fileRef = useRef(null);

  // Fetch existing post on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getHomeSwap(id);
        if (cancelled) return;

        const ownerId = data?.userId ?? data?.ownerId ?? null;
        const meId = user?.id ?? user?.userId ?? user?._id ?? null;
        const sameUser =
          meId != null && ownerId != null && String(meId) === String(ownerId);
        if (!sameUser) {
          toast.error("You are not allowed to edit this post");
          navigate(`/app/home-swap/${id}`);
          return;
        }
        setForm({
          title: data?.title ?? "",
          location: data?.location ?? "",
          description: data?.description ?? "",
          homeType: data?.homeType ?? data?.home_type ?? "entire",
          bedrooms: data?.bedrooms != null ? String(data.bedrooms) : "1",
        });
        // Load existing photos
        if (data?.photos && Array.isArray(data.photos)) {
          setExistingPhotos(data.photos.map((p) => ({ id: p.id, url: p.url })));
        }
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Failed to load home swap.";
        toast.error(msg);
        setErrorMsg(msg);
        navigate(-1);
        return;
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  // Build previews for new photos
  useEffect(() => {
    const urls = newPhotos.map((f) => URL.createObjectURL(f));
    setNewPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [newPhotos]);

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const visibleExisting = existingPhotos.filter((p) => !removePhotoIds.includes(p.id));
  const totalPhotos = visibleExisting.length + newPhotos.length;

  const canSubmit = useMemo(() => {
    return !!form.title.trim() && !!form.location.trim();
  }, [form.title, form.location]);

  const onRemoveExisting = (photoId) => {
    setRemovePhotoIds((prev) => [...prev, photoId]);
  };

  const onUndoRemove = (photoId) => {
    setRemovePhotoIds((prev) => prev.filter((pid) => pid !== photoId));
  };

  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || []).filter(Boolean);
    if (!files.length) return;

    if (totalPhotos + files.length > MAX_PHOTOS) {
      toast.warn(`Maximum ${MAX_PHOTOS} photos allowed`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    for (const f of files) {
      if (!f.type?.startsWith?.("image/")) {
        toast.error("Only image files are allowed");
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`Max file size is ${MAX_FILE_MB}MB`);
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
    }
    setNewPhotos((prev) => [...prev, ...files]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onRemoveNew = (idx) => {
    setNewPhotos((arr) => arr.filter((_, i) => i !== idx));
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        location: form.location.trim(),
        description: form.description?.trim() || "",
        homeType: form.homeType,
        bedrooms: String(form.bedrooms ?? "1"),
      };
      await updateHomeSwap(id, payload, newPhotos, removePhotoIds);
      toast.success("Home swap updated");
      navigate(`/app/home-swap/${id}`);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Update failed";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div style={{ padding: 16 }}>
      <PageLoader message="Loading home swap..." />
    </div>
  );
  if (errorMsg && !form.title) return <div style={{ padding: 16 }}>{errorMsg}</div>;

  return (
    <div className={`${formStyles.wrap} ${styles.wrap}`}>
      <h2 className={`${formStyles.title} ${styles.title}`}>Edit Home Swap</h2>
      <form onSubmit={onSubmit} className={formStyles.form} noValidate>
        <label>
          Title*
          <input value={form.title} onChange={setField("title")} required disabled={submitting} />
        </label>

        <label>
          Location*
          <input value={form.location} onChange={setField("location")} required disabled={submitting} />
        </label>

        <label>
          Home type
          <select value={form.homeType} onChange={setField("homeType")} disabled={submitting}>
            <option value="entire">Entire place</option>
            <option value="room">Private room</option>
          </select>
        </label>

        <label>
          Bedrooms
          <input type="number" min="0" value={form.bedrooms} onChange={setField("bedrooms")} disabled={submitting} />
        </label>

        <label>
          Description
          <textarea rows={4} value={form.description} onChange={setField("description")} disabled={submitting} />
        </label>

        {/* ---- Photos section ---- */}
        <div className={`${formStyles.field} ${styles.field}`}>
          <div>Photos (max {MAX_PHOTOS})</div>

          {/* Existing photos */}
          {existingPhotos.length > 0 && (
            <div className={styles.thumbGrid}>
              {existingPhotos.map((photo) => {
                const isMarkedForRemoval = removePhotoIds.includes(photo.id);
                return (
                  <div key={photo.id} className={styles.thumb} style={isMarkedForRemoval ? { opacity: 0.4 } : {}}>
                    <img src={photo.url} alt="Existing photo" />
                    {isMarkedForRemoval ? (
                      <button
                        type="button"
                        className={buttonStyles.sm}
                        onClick={() => onUndoRemove(photo.id)}
                        disabled={submitting}
                      >
                        Undo
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={buttonStyles.sm}
                        onClick={() => onRemoveExisting(photo.id)}
                        disabled={submitting}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* New photo previews */}
          {newPreviews.length > 0 && (
            <div className={styles.thumbGrid}>
              {newPreviews.map((src, i) => (
                <div key={`new-${i}`} className={styles.thumb}>
                  <img src={src} alt={`New photo ${i + 1}`} />
                  <button
                    type="button"
                    className={buttonStyles.sm}
                    onClick={() => onRemoveNew(i)}
                    disabled={submitting}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {totalPhotos < MAX_PHOTOS && (
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onPickFiles}
              aria-label="Add photos"
              disabled={submitting}
            />
          )}
        </div>

        <div className={`${formStyles.actions} ${styles.actions}`} style={{ marginTop: 16 }}>
          <button type="submit" className={buttonStyles.primary} disabled={!canSubmit || submitting}>
            {submitting ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className={buttonStyles.secondary}
            onClick={() => navigate(-1)}
            style={{ marginLeft: 8 }}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
