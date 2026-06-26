import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import api from "../api/axiosInstance";
import { toast } from "react-toastify";
import sectionStyles from "../stylus/sections/Profile.module.scss";
import buttonStyles from "../stylus/components/Button.module.scss";
import { avatarSrcFrom } from "../utils/avatar";

const hasEdgeSpaces = (s) => typeof s === "string" && (s.startsWith(" ") || s.endsWith(" "));
const notTrimCheck = (form) => {
  if (hasEdgeSpaces(form.name)) return { field: "name", label: "Name" };
  if (hasEdgeSpaces(form.city)) return { field: "city", label: "City" };
  return null;
};

/* ---- "My posts" helpers ---- */
const asArray = (d) => (Array.isArray(d) ? d : d?.content ?? d?.items ?? []);
const ownerIdOf = (x) =>
  x?.ownerId ?? x?.userId ?? x?.providerId ?? x?.posterId ??
  x?.owner?.id ?? x?.user?.id ?? x?.postedBy?.id ?? null;
const titleOf = (x) =>
  x?.title || x?.name || x?.headline ||
  (x?.originCity ? `${x.originCity} → ${x.destinationCity || ""}` : "") || "Untitled";

const Profile = () => {
  const { t } = useTranslation();
  const { user, refreshMe } = useAuth();
  const myId = user?.id ?? user?.userId ?? user?._id ?? null;

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

  // -------------------- Avatar (FB-style: pick → auto center-crop → upload) --------------------
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarBust, setAvatarBust] = useState(Number(localStorage.getItem("avatarBust") || 0));

  const avatarAnchorRef = useRef(null);
  const menuRef = useRef(null);
  const firstItemRef = useRef(null);
  const fileInputRef = useRef(null);

  const imgSrc = user ? avatarSrcFrom(user, { cacheBust: avatarBust }) : "";

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDocClick = (e) => {
      const a = avatarAnchorRef.current;
      const m = menuRef.current;
      if (!a || !m) return;
      if (!a.contains(e.target) && !m.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) setTimeout(() => firstItemRef.current?.focus(), 0);
  }, [menuOpen]);

  const openOsPicker = () => {
    setMenuOpen(false);
    const input = fileInputRef.current;
    if (!input) return;
    try {
      if (typeof input.showPicker === "function") input.showPicker();
      else input.click();
    } catch {
      input.click();
    }
  };

  /** Center-crop the largest square (cover) and scale to 512×512 — no manual zoom. */
  const cropCoverToBlob = (image) =>
    new Promise((resolve) => {
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      const side = Math.min(image.width, image.height);
      const sx = (image.width - side) / 2;
      const sy = (image.height - side) / 2;
      ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size);
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9);
    });

  const onPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) return toast.error("Please choose a JPG, PNG, WEBP or GIF image.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max size is 5MB.");

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = async () => {
      setUploading(true);
      try {
        const blob = await cropCoverToBlob(image);
        const fd = new FormData();
        fd.append("image", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
        await api.post("/users/me/profile-image", fd);
        const bust = Date.now();
        localStorage.setItem("avatarBust", String(bust));
        setAvatarBust(bust);
        await refreshMe?.({ bust: true });
        toast.success("Profile photo updated.");
      } catch (err) {
        console.error(err);
        toast.error(err?.response?.data?.message || "Upload failed.");
      } finally {
        setUploading(false);
        URL.revokeObjectURL(url);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error("Could not read that image.");
    };
    image.src = url;
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
      const msg =
        err?.response?.status === 404 || err?.response?.status === 405
          ? "Your server doesn't support removing photos."
          : err?.response?.data?.message || "Could not remove photo.";
      toast.error(msg);
    }
  };

  // -------------------- My posts --------------------
  const [myPosts, setMyPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const loadMyPosts = useCallback(async () => {
    if (!myId) return;
    setPostsLoading(true);
    try {
      const reqs = await Promise.allSettled([
        api.get(`/api/ads`, { params: { ownerId: myId, limit: 50 } }),
        api.get(`/api/rentals`, { params: { ownerId: myId, limit: 50 } }),
        api.get(`/api/services`, { params: { ownerId: myId, limit: 50 } }),
        api.get(`/api/events`, { params: { ownerId: myId, limit: 50 } }),
        api.get(`/homeswap`, { params: { ownerId: myId, limit: 50 } }),
      ]);
      const grab = (i) => (reqs[i].status === "fulfilled" ? asArray(reqs[i].value.data) : []);
      const mine = (list, type, base) =>
        list
          .filter((x) => String(ownerIdOf(x)) === String(myId))
          .map((x) => ({ type, id: x.id, title: titleOf(x), to: `${base}/${x.id}` }));

      const all = [
        ...mine(grab(0), t("profile.tabs.ads", "Ads"), "/app/ads"),
        ...mine(grab(1), t("profile.tabs.rentals", "Rentals"), "/app/rentals"),
        ...mine(grab(2), t("profile.tabs.services", "Services"), "/app/services"),
        ...mine(grab(3), t("profile.tabs.events", "Events"), "/app/events"),
        ...mine(grab(4), t("profile.tabs.homeSwap", "Home Swap"), "/app/home-swap"),
      ];
      setMyPosts(all);
    } catch {
      setMyPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [myId, t]);

  useEffect(() => {
    loadMyPosts();
  }, [loadMyPosts]);

  if (!user) return <div className={sectionStyles.container}>Loading profile…</div>;

  const handle = user.username || (user.email ? user.email.split("@")[0] : "user");
  const menuId = "avatar-menu";
  const bio = (user.bio || "").trim();

  // -------------------- Render --------------------
  return (
    <div className={sectionStyles.container}>
      <div className={sectionStyles.headerBar}>
        <h2 className={sectionStyles.pageTitle}>{t("profile.myProfile")}</h2>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onPick} />

      {/* Summary card */}
      <div className={sectionStyles.section}>
        <div className={sectionStyles.summaryGrid}>
          {/* Avatar — click to open the menu */}
          <div className={sectionStyles.avatarShell} ref={avatarAnchorRef}>
            <button
              type="button"
              className={sectionStyles.avatarWrap}
              aria-label="Change profile photo"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((v) => !v)}
              disabled={uploading}
            >
              <img
                src={imgSrc}
                alt="Profile"
                width={112}
                height={112}
                draggable={false}
                className={sectionStyles.avatarImg}
                onError={(e) => { e.currentTarget.src = "/default-avatar.png"; }}
              />
              <span className={sectionStyles.avatarOverlay}>
                {uploading ? t("forms.uploading", "Uploading…") : t("profile.change", "Change")}
              </span>
            </button>

            {menuOpen && (
              <div id={menuId} className={sectionStyles.menu} ref={menuRef} role="menu" aria-label={t("profile.avatarActions")}>
                <button ref={firstItemRef} type="button" role="menuitem" onClick={openOsPicker}>
                  {t("profile.uploadNewPhoto")}
                </button>
                <button type="button" role="menuitem" onClick={() => imgSrc && window.open(imgSrc, "_blank", "noopener")}>
                  {t("profile.viewPhoto")}
                </button>
                <button type="button" role="menuitem" onClick={removeAvatar}>
                  {t("profile.removePhoto")}
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

            {bio && <p className={sectionStyles.bioText}>{bio}</p>}

            <ul className={sectionStyles.metaList}>
              {user.email && (<li><strong>{t("profile.email")}:</strong> {user.email}</li>)}
              {(user.city || user.location) && (<li><strong>{t("profile.city")}:</strong> {user.city || user.location}</li>)}
              {(user.phone || user.phoneNumber) && (<li><strong>{t("profile.phone")}:</strong> {user.phone || user.phoneNumber}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* Account form */}
      <div className={sectionStyles.section}>
        <h3 className={sectionStyles.sectionTitle}>{t("profile.accountDetails")}</h3>
        <form onSubmit={saveAccount} className={sectionStyles.formList}>
          <label className={sectionStyles.field}>
            <span>{t("profile.name")}</span>
            <input name="name" value={form.name} onChange={onFormChange} autoComplete="name" className={sectionStyles.input} />
          </label>

          <div className={sectionStyles.field}>
            <span>{t("profile.email")}</span>
            <div aria-readonly="true" className={sectionStyles.readonlyBox}>{form.email || "—"}</div>
          </div>

          <div className={sectionStyles.field}>
            <span>{t("profile.phone")}</span>
            <div aria-readonly="true" className={sectionStyles.readonlyBox}>{form.phone || "—"}</div>
          </div>

          <label className={sectionStyles.field}>
            <span>{t("profile.city")}</span>
            <input name="city" value={form.city} onChange={onFormChange} autoComplete="address-level2" className={sectionStyles.input} />
          </label>

          <div className={sectionStyles.actions}>
            <Link to="/app/settings/account" className={`${buttonStyles.btn}`} style={{ marginRight: "auto" }}>
              {t("profile.editBio", "Edit bio")}
            </Link>
            <button type="submit" className={`${buttonStyles.btn} ${buttonStyles.primary}`} disabled={saving || !isDirty}>
              {saving ? t("forms.saving") : t("profile.saveChanges")}
            </button>
          </div>
        </form>
      </div>

      {/* My posts */}
      <div className={sectionStyles.section}>
        <h3 className={sectionStyles.sectionTitle}>
          {t("profile.myPosts", "My posts")}
          {!postsLoading && myPosts.length > 0 && (
            <span className={sectionStyles.countPill}>{myPosts.length}</span>
          )}
        </h3>

        {postsLoading ? (
          <p className={sectionStyles.muted}>{t("common.loading", "Loading…")}</p>
        ) : myPosts.length === 0 ? (
          <p className={sectionStyles.muted}>{t("profile.noPostsYet", "You haven't posted anything yet.")}</p>
        ) : (
          <div className={sectionStyles.postsGrid}>
            {myPosts.map((p) => (
              <Link key={`${p.type}-${p.id}`} to={p.to} className={sectionStyles.postCard}>
                <span className={sectionStyles.postType}>{p.type}</span>
                <span className={sectionStyles.postTitle}>{p.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
