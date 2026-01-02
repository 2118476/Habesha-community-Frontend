import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiBase } from "../../api/httpUrl"; // ✅ normalized axios baseURL

const FALLBACK_AVATAR = "/images/avatar.png";
const FALLBACK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

/* Pick the first available image field */
function firstImage(it) {
  const arrays = [it?.photos, it?.images, it?.pictures, it?.media, it?.gallery].filter(Boolean);
  for (const arr of arrays) {
    if (!Array.isArray(arr) || !arr.length) continue;
    const f = arr[0];
    const u = typeof f === "string" ? f : f?.url || f?.src || f?.path;
    if (u) return u;
  }
  return it?.imageUrl || it?.firstPhotoUrl || null;
}

/* Friendly relative time like "3h" / "2d" */
function prettyTime(dateish) {
  const d = dateish ? new Date(dateish) : null;
  if (!d || isNaN(+d)) return "Just now";
  const sec = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "Just now";
  const mins = Math.floor(sec / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(days / 365);
  return `${years}y`;
}

export default function AdsPostItem({ item }) {
  const { t } = useTranslation();
  const title = item?.title?.trim() || "Untitled";
  const text  = item?.description || item?.summary || "";
  const img   = firstImage(item);

  // 🔹 Poster identity (fallbacks cover your common shapes)
  const posterId =
    item?.posterId || item?.userId || item?.authorId || item?.ownerId || null;
  const posterName =
    item?.posterName || item?.userName || item?.authorName || item?.ownerName || "Community member";

  // 🔹 Avatar URL using your working pattern
  const avatarUrl = posterId ? `${apiBase}/users/${posterId}/profile-image` : null;

  // 🔹 Profile link (adjust to your routes)
  const profileHref = posterId ? `/app/profile/${posterId}` : "#";

  const whenText = prettyTime(item?.createdAt || item?.createdDate || item?.created_on);

  return (
    <article style={{ padding: "14px 0" }}>
      {/* ===== Header: avatar + name + time ===== */}
      <header style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <Link
          to={profileHref}
          style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
          aria-label={posterName}
        >
          <img
            src={avatarUrl || FALLBACK_AVATAR}
            alt={posterName}
            width="36"
            height="36"
            style={{ borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }}
            loading="lazy"
            decoding="async"
            onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }}
          />
        </Link>
        <div style={{ lineHeight: 1.15 }}>
          <Link
            to={profileHref}
            style={{ fontWeight: 600, textDecoration: "none" }}
          >
            {posterName}
          </Link>
          <br />
          <small style={{ opacity: .8 }}>{whenText}</small>
        </div>
      </header>

      {/* ===== Title & text ===== */}
      <h3 style={{ margin: "2px 0 6px" }}>{title}</h3>
      {text && <p style={{ whiteSpace: "pre-wrap", margin: "0 0 8px" }}>{text}</p>}

      {/* ===== Image (optional) ===== */}
      {img && (
        <div style={{ marginTop: 6 }}>
          <img
            src={img}
            alt={title}
            style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border)" }}
            onError={(e) => { e.currentTarget.src = FALLBACK_PIXEL; }}
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      {/* ===== Actions ===== */}
      <footer style={{ marginTop: 8, display: "flex", gap: 14, opacity: .9 }}>
        <button style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>{t('buttons.like')}</button>
        <button style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>{t('buttons.comment')}</button>
        <Link to={`/app/ads/${item?.id}`} style={{ textDecoration: "none" }}>{t('buttons.viewDetails')}</Link>
      </footer>

      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "14px 0 0" }} />
    </article>
  );
}
