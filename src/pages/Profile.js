import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import useAuth from "../hooks/useAuth";
import api from "../api/axiosInstance";
import { toast } from "react-toastify";
import sectionStyles from "../stylus/sections/Profile.module.scss";
import buttonStyles from "../stylus/components/Button.module.scss";
import { avatarSrcFrom } from "../utils/avatar";
import { InlineSpinner } from "../components/ui/Spinner/Spinner";

const hasEdgeSpaces = (s) => typeof s === "string" && (s.startsWith(" ") || s.endsWith(" "));
const notTrimCheck = (form) => {
  if (hasEdgeSpaces(form.name)) return { field: "name", label: "Name" };
  if (hasEdgeSpaces(form.city)) return { field: "city", label: "City" };
  return null;
};

const Profile = () => {
  const { t } = useTranslation();
  const { user, refreshMe } = useAuth();

  // -------------------- Account form --------------------
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || user.displayName || "",
      email: user.email || "",
      phone: user.phone || user.phoneNumber || "",
      city: user.city || user.location || "",
    });
  }, [user]);

  const onFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // email/phone read-only here → exclude from dirty check
  const isDirty = useMemo(() => {
    if (!user) return false;
    return (
      (user.name || user.displayName || "") !== form.name ||
      (user.city || user.location || "") !== form.city
    );
  }, [user, form]);

  const saveAccount = async (e) => {
    e?.preventDefault?.();
    if (!isDirty) return;

    const bad = notTrimCheck(form);
    if (bad) {
      toast.error(`${bad.label} cannot start or end with spaces.`);
      document.querySelector(`input[name="${bad.field}"]`)?.focus();
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        displayName: form.name,
        // email omitted (read-only)
        phone: form.phone,
        phoneNumber: form.phone,
        city: form.city,
        location: form.city,
      };

      try {
        await api.put("/api/users/me", payload);
      } catch {
        await api.put("/users/me", payload);
      }

      await refreshMe?.({ bust: true });
      toast.success("Account details saved.");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Could not save account details.");
    } finally {
      setSaving(false);
    }
  };

  // -------------------- Avatar/menu/editor --------------------
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [imgEl, setImgEl] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);

  const [avatarBust, setAvatarBust] = useState(
    Number(localStorage.getItem("avatarBust") || 0)
  );

  const avatarAnchorRef = useRef(null);
  const menuRef = useRef(null);
  const firstItemRef = useRef(null);
  const fileInputRef = useRef(null);
  const frameRef = useRef(null);
  const dragRef = useRef({ dragging: false, x: 0, y: 0 });

  const imgSrc = user ? avatarSrcFrom(user, { cacheBust: avatarBust }) : "";

  // Close menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      const a = avatarAnchorRef.current;
      const m = menuRef.current;
      if (!a || !m) return;
      if (!a.contains(e.target) && !m.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Focus first menu item when opened
  useEffect(() => {
    if (menuOpen) setTimeout(() => firstItemRef.current?.focus(), 0);
  }, [menuOpen]);

  const onAvatarClick = () => setMenuOpen((v) => !v);

  // File picking
  const openOsPicker = () => {
    const input = fileInputRef.current;
    if (!input) return;
    try {
      if (typeof input.showPicker === "function") input.showPicker();
      else input.click();
    } catch {
      input.click();
    }
  };

  const onChooseUploadNew = () => {
    setMenuOpen(false);
    setShowEditor(true);
    openOsPicker();
  };

  const onChooseEditCrop = () => {
    setMenuOpen(false);
    if (!imgSrc) {
      setShowEditor(true);
      toast.info("No profile photo yet. Use “Upload new photo…” first.");
      return;
    }
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      setImgEl(image);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setShowEditor(true);
    };
    image.onerror = () => {
      setShowEditor(true);
      toast.error("Could not load current photo for editing. Try uploading a new one.");
    };
    const bust = imgSrc.includes("?") ? "&" : "?";
    image.src = `${imgSrc}${bust}editBust=${Date.now()}`;
  };

  const onPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) loadImage(file);
    setShowEditor(true);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) loadImage(file);
  };

  const loadImage = (file) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error("Please choose a JPG, PNG, WEBP or GIF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max size is 5MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImgEl(image);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setShowEditor(true);
    };
    image.src = url;
  };

  const startDrag = (e) => {
    e.preventDefault();
    dragRef.current = { dragging: true, x: e.clientX, y: e.clientY };
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", endDrag);
  };
  const onDrag = (e) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current.x = e.clientX;
    dragRef.current.y = e.clientY;
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  };
  const endDrag = () => {
    dragRef.current.dragging = false;
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", endDrag);
  };

  const makeCanvasBlob = async () => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size, size);

    if (imgEl) {
      const iw = imgEl.width * zoom;
      const ih = imgEl.height * zoom;
      const cx = size / 2 + offset.x;
      const cy = size / 2 + offset.y;
      const x = cx - iw / 2;
      const y = cy - ih / 2;
      ctx.drawImage(imgEl, x, y, iw, ih);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  };

  const uploadAvatar = async () => {
    if (!imgEl) return toast.info("Pick an image first.");
    setUploading(true);
    try {
      const blob = await makeCanvasBlob();
      const fd = new FormData();
      fd.append("image", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      await api.post("/users/me/profile-image", fd);
      const bust = Date.now();
      localStorage.setItem("avatarBust", String(bust));
      setAvatarBust(bust);
      await refreshMe?.({ bust: true });
      setShowEditor(false);
      setImgEl(null);
      toast.success("Profile photo updated.");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    setMenuOpen(false);
    try {
      await api.delete("/users/me/profile-image");
      const bust = Date.now();
      localStorage.setItem("avatarBust", String(bust));
      setAvatarBust(bust);
      await refreshMe?.({ bust: true });
      toast.success("Profile photo removed.");
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.status === 404 || err?.response?.status === 405
          ? "Your server doesn't support removing photos."
          : err?.response?.data?.message || "Could not remove photo.";
      toast.error(msg);
    }
  };

  if (!user) return <div className={sectionStyles.container}>Loading profile…</div>;

  const handle = user.username || (user.email ? user.email.split("@")[0] : "user");
  const menuId = "avatar-menu";

  // -------------------- Render --------------------
  return (
    <div className={sectionStyles.container}>
      <div className={sectionStyles.headerBar}>
        <h2 className={sectionStyles.pageTitle}>{t('profile.myProfile')}</h2>
      </div>

      {/* Hidden file input for immediate browse */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onPick}
      />

      {/* Summary card */}
      <div className={sectionStyles.section}>
        <div className={sectionStyles.summaryGrid}>
          {/* Avatar block — circle-only + external menu */}
          <div className={sectionStyles.avatarShell} ref={avatarAnchorRef}>
            <button
              type="button"
              className={sectionStyles.avatarWrap}
              aria-label="Change profile photo"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={onAvatarClick}
            >
              <img
                src={imgSrc}
                alt="Profile"
                width={112}
                height={112}
                draggable={false}
                className={sectionStyles.avatarImg}
                onError={(e) => {
                  e.currentTarget.src = "/default-avatar.png";
                }}
              />
              <span className={sectionStyles.avatarOverlay}>Change</span>
            </button>

            {menuOpen && (
              <div
                id={menuId}
                className={sectionStyles.menu}
                ref={menuRef}
                role="menu"
                aria-label={t('profile.avatarActions')}
              >
                <button
                  ref={firstItemRef}
                  type="button"
                  role="menuitem"
                  onClick={onChooseUploadNew}
                >
                  {t('profile.uploadNewPhoto')}
                </button>
                <button type="button" role="menuitem" onClick={onChooseEditCrop}>
                  {t('profile.editAndCrop')}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => imgSrc && window.open(imgSrc, "_blank", "noopener")}
                >
                  {t('profile.viewPhoto')}
                </button>
                <button type="button" role="menuitem" onClick={removeAvatar}>
                  {t('profile.removePhoto')}
                </button>
              </div>
            )}
          </div>

          {/* Meta details */}
          <div className={sectionStyles.metaCol}>
            <div className={sectionStyles.nameBlock}>
              <div className={sectionStyles.nameLine}>
                <span className={sectionStyles.displayName}>
                  {user.name || user.displayName || handle}
                </span>
                {user.role && <span className={sectionStyles.roleBadge}>{user.role}</span>}
              </div>
              <div className={sectionStyles.handle}>@{handle}</div>
            </div>

            <ul className={sectionStyles.metaList}>
              {user.email && (
                <li>
                  <strong>{t('profile.email')}:</strong> {user.email}
                </li>
              )}
              {(user.city || user.location) && (
                <li>
                  <strong>{t('profile.city')}:</strong> {user.city || user.location}
                </li>
              )}
              {(user.phone || user.phoneNumber) && (
                <li>
                  <strong>{t('profile.phone')}:</strong> {user.phone || user.phoneNumber}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Account form */}
      <div className={sectionStyles.section}>
        <h3 className={sectionStyles.sectionTitle}>{t('profile.accountDetails')}</h3>
        <form onSubmit={saveAccount} className={sectionStyles.formList}>
          <label className={sectionStyles.field}>
            <span>{t('profile.name')}</span>
            <input
              name="name"
              value={form.name}
              onChange={onFormChange}
              autoComplete="name"
              className={sectionStyles.input}
            />
          </label>

          <div className={sectionStyles.field}>
            <span>{t('profile.email')}</span>
            <div aria-readonly="true" className={sectionStyles.readonlyBox}>
              {form.email || "—"}
            </div>
          </div>

          <div className={sectionStyles.field}>
            <span>{t('profile.phone')}</span>
            <div aria-readonly="true" className={sectionStyles.readonlyBox}>
              {form.phone || "—"}
            </div>
          </div>

          <label className={sectionStyles.field}>
            <span>{t('profile.city')}</span>
            <input
              name="city"
              value={form.city}
              onChange={onFormChange}
              autoComplete="address-level2"
              className={sectionStyles.input}
            />
          </label>

          <div className={sectionStyles.actions}>
            <button
              type="submit"
              className={`${buttonStyles.btn} ${buttonStyles.primary}`}
              disabled={saving || !isDirty}
            >
              {saving ? t('forms.saving') : t('profile.saveChanges')}
            </button>
          </div>
        </form>
      </div>

      {/* Inline avatar editor */}
      {showEditor && (
        <div className={sectionStyles.section}>
          <h3 className={sectionStyles.sectionTitle}>{t('profile.profilePhoto')}</h3>

          <div
            className={sectionStyles.dropzone}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={onChooseUploadNew}
            tabIndex={0}
            role="button"
            aria-label="Upload image"
          >
            <p className={sectionStyles.dropText}>
              {t('profile.dragDropImage')} <span>{t('profile.browse')}</span>
            </p>
          </div>

          {imgEl && (
            <div className={sectionStyles.editorWrap}>
              <div
                className={sectionStyles.frame}
                ref={frameRef}
                onMouseDown={startDrag}
              >
                <img
                  src={imgEl.src}
                  alt="preview"
                  className={sectionStyles.frameImg}
                  style={{
                    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  }}
                  draggable={false}
                />
              </div>

              <div className={sectionStyles.sliderWrap}>
                <label htmlFor="zoom-range">{t('profile.zoom')}</label>
                <input
                  id="zoom-range"
                  className={sectionStyles.slider}
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                />
              </div>

              <div className={sectionStyles.editorActions}>
                <button
                  type="button"
                  className={`${buttonStyles.btn} ${buttonStyles.primary}`}
                  onClick={uploadAvatar}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <InlineSpinner size="sm" color="white" />
                      {t('forms.uploading')}
                    </>
                  ) : (
                    t('profile.saveAvatar')
                  )}
                </button>
                <button
                  type="button"
                  className={buttonStyles.btn}
                  onClick={() => {
                    setImgEl(null);
                    setShowEditor(false);
                  }}
                  disabled={uploading}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
