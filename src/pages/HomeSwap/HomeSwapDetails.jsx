// src/pages/HomeSwap/HomeSwapDetails.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import api from "../../api/axiosInstance";
import { makeApiUrl } from "../../api/httpUrl";

import styles from "../../stylus/sections/HomeSwap.module.scss";
import buttonStyles from "../../stylus/components/Button.module.scss";
import { PageLoader } from "../../components/ui/PageLoader/PageLoader";

import EntityMetaBar from "../../components/EntityMetaBar.jsx";
import ImageCarousel from "../../components/ImageCarousel.jsx";
import {
  navigateToDMFromItem,
  buildPrefillMessage,
  resolveOwnerId,
  resolveOwnerName,
} from "../../utils/dmNavigation";

import { deleteHomeSwap } from "../../api/homeswap";

/* ---------------------------- helpers ---------------------------- */

const FALLBACK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const toAbs = (u) =>
  typeof u === "string" && u
    ? /^https?:\/\//i.test(u)
      ? u
      : makeApiUrl(u.startsWith("/") ? u : `/uploads/${u}`)
    : null;

function firstWord(name) {
  if (!name) return "there";
  const s = String(name).trim();
  const space = s.indexOf(" ");
  return (space === -1 ? s : s.slice(0, space)) || "there";
}

/** Derive photos from common fields + conventional endpoints (deduped). */
function deriveHomeSwapPhotos(item, id) {
  const candidates = [];

  const direct =
    item?.coverUrl ||
    item?.imageUrl ||
    item?.thumbnailUrl ||
    item?.image ||
    item?.firstPhotoUrl ||
    item?.photoUrl ||
    item?.pictureUrl ||
    null;
  if (direct) candidates.push(direct);

  if (Array.isArray(item?.images)) candidates.push(...item.images);
  if (Array.isArray(item?.photos)) {
    for (const p of item.photos) {
      if (!p) continue;
      candidates.push(p.url || p.path || p.src || p);
    }
  }
  if (Array.isArray(item?.photoPaths)) candidates.push(...item.photoPaths);

  const fid = item?.firstPhotoId || item?.coverId || null;
  if (fid) candidates.push(`/homeswap/photos/${encodeURIComponent(fid)}`);
  if (id) {
    candidates.push(`/homeswap/${encodeURIComponent(id)}/photos/first`);
    const count = Number(item?.photoCount ?? item?.photosCount ?? 0);
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 18); i++) {
        candidates.push(`/homeswap/${encodeURIComponent(id)}/photos/${i}`);
      }
    }
  }

  const out = [];
  for (const c of candidates) {
    if (!c) continue;
    const src = typeof c === "string" ? c : c?.url || c?.path || c?.src || null;
    if (!src) continue;
    const abs = toAbs(src);
    if (abs && !out.includes(abs)) out.push(abs);
  }
  return out;
}

/** Prefill DMs (like Rentals, but homeswap-flavoured) */
function dmPrefillFrom(item, kind = "interest") {
  const fromHelper = buildPrefillMessage?.(item, "homeswap");
  const first = firstWord(resolveOwnerName(item));
  const title = item?.title || item?.headline || "your home swap";
  const loc =
    item?.location || item?.city || item?.area
      ? ` in ${item?.location || item?.city || item?.area}`
      : "";

  if (kind === "interest") {
    return fromHelper || `Hi ${first}, I’m interested in "${title}"${loc}.`;
  }
  if (kind === "available") {
    return `Hi ${first}, is "${title}"${loc} still available for swapping?`;
  }
  return `Hi ${first}, could you share more details about "${title}"${loc}?`;
}

/* ----------------------------- page ------------------------------ */

export default function HomeSwapDetails() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ownerPreview, setOwnerPreview] = useState(null);
  const [saved, setSaved] = useState(false);

  // section refs for jump chips
  const aboutRef = useRef(null);
  const detailsRef = useRef(null);
  const amenitiesRef = useRef(null);
  const ownerRef = useRef(null);

  // Load details (prefer richer payload if available)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        let data = null;
        try {
          const r = await api.get(`/homeswap/${id}/with-photos`);
          data = r.data;
        } catch {
          const r = await api.get(`/homeswap/${id}`);
          data = r.data;
        }
        if (alive) setItem(data);
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Could not load Home Swap details.";
        toast.error(msg);
        if (alive) setItem(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // Owner
  const ownerId = useMemo(() => (item ? resolveOwnerId(item) : null), [item]);
  const ownerName = useMemo(
    () => (item ? resolveOwnerName(item) : "Owner"),
    [item]
  );
  const isOwner =
    user?.id != null && ownerId != null && String(user.id) === String(ownerId);

  // Roles can be a string or array; normalise and accept both ADMIN/MODERATOR and ROLE_* variants
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((r) => String(r || "").trim().toUpperCase())
    : user?.role
    ? [String(user.role).trim().toUpperCase()]
    : [];
  const isAdmin = roles.includes("ADMIN") || roles.includes("ROLE_ADMIN");
  const isModerator = roles.includes("MODERATOR") || roles.includes("ROLE_MODERATOR");
  const canDelete = isOwner || isAdmin || isModerator;

  // Delete listing (owner/admin/mod)
  const handleDelete = async () => {
    if (!window.confirm(t("homeSwapDetails.deleteConfirm"))) {
      return;
    }
    try {
      await deleteHomeSwap(id); // calls DELETE /api/home-swap/{id}
      toast.success(t("homeSwapDetails.listingDeleted"));
      navigate("/app/home-swap", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("homeSwapDetails.failedToDelete");
      toast.error(msg);
    }
  };

  // Owner preview (avatar) via axios (respects credentials/baseURL)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ownerId) return;
      try {
        const { data } = await api.get(`/users/${ownerId}`);
        if (!cancelled) setOwnerPreview(data);
      } catch {
        // ok to ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  const ownerAvatarUrl = useMemo(() => {
    if (ownerPreview?.profile_image_url) return ownerPreview.profile_image_url;
    if (!ownerId) return null;
    return makeApiUrl(`/users/${ownerId}/profile-image`);
  }, [ownerId, ownerPreview]);

  const photos = useMemo(() => deriveHomeSwapPhotos(item || {}, id), [item, id]);

  // Share / copy link
  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = item?.title || "Home Swap";
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success(t("homeSwapDetails.linkCopiedToClipboard"));
      } else {
        toast.info(t("homeSwapDetails.sharingNotSupported"));
      }
    } catch {}
  }, [item, t]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("homeSwapDetails.linkCopied"));
    } catch {}
  }, [t]);

  // DM shortcut
  const openDM = useCallback(
    (kind) => {
      const prefill = dmPrefillFrom(item, kind);
      navigateToDMFromItem(navigate, item, {
        module: "homeswap",
        prefill,
        focusComposer: true,
        contextType: "homeswap",
        contextId: item?.id ?? id ?? null,
      });
    },
    [navigate, item, id]
  );

  // Save toggle (local only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("hs.saved");
      const set = raw ? new Set(JSON.parse(raw)) : new Set();
      setSaved(set.has(String(id)));
    } catch {}
  }, [id]);

  const toggleSaved = useCallback(() => {
    try {
      const raw = localStorage.getItem("hs.saved");
      const arr = raw ? JSON.parse(raw) : [];
      const set = new Set(arr.map(String));
      const k = String(id);
      if (set.has(k)) {
        set.delete(k);
        setSaved(false);
        toast.info(t("homeSwapDetails.removedFromSaved"));
      } else {
        set.add(k);
        setSaved(true);
        toast.success(t("homeSwapDetails.saved"));
      }
      localStorage.setItem("hs.saved", JSON.stringify([...set]));
    } catch {}
  }, [id, t]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented) return;
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "i" || e.key === "I") { openDM("interest"); }
      else if (e.key === "a" || e.key === "A") { openDM("available"); }
      else if (e.key === "d" || e.key === "D") { openDM("details"); }
      else if (e.key === "s" || e.key === "S") { handleShare(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openDM, handleShare]);

  const priceText =
    item?.price != null
      ? `£${Number(item.price).toLocaleString("en-GB")}${item?.pricePeriod ? `/${item.pricePeriod}` : `/${t("homeSwapDetails.perSwap")}`}`
      : null;

  const facts = [
    { label: t("homeSwapDetails.swapWindow"), value: item?.swapWindow || null },
    { label: t("homeSwapDetails.minNights"), value: item?.minNights != null ? String(item.minNights) : null },
    { label: t("homeSwapDetails.maxNights"), value: item?.maxNights != null ? String(item.maxNights) : null },
    { label: t("homeSwapDetails.bedrooms"), value: item?.bedrooms != null ? String(item.bedrooms) : null },
    { label: t("homeSwapDetails.bathrooms"), value: item?.bathrooms != null ? String(item.bathrooms) : null },
    { label: t("homeSwapDetails.petsAllowed"), value: item?.petsAllowed == null ? null : (item.petsAllowed ? t("homeSwapDetails.yes") : t("homeSwapDetails.no")) },
    { label: t("homeSwapDetails.smoking"), value: item?.smokingAllowed == null ? null : (item.smokingAllowed ? t("homeSwapDetails.allowed") : t("homeSwapDetails.notAllowed")) },
    { label: t("homeSwapDetails.priceNotes"), value: priceText },
  ].filter((f) => f.value);

  const desiredLocations =
    Array.isArray(item?.desiredLocations) && item.desiredLocations.length > 0
      ? item.desiredLocations.join(", ")
      : null;

  const chips = [
    ...(Array.isArray(item?.amenities) ? item.amenities.map(String) : []),
    ...(Array.isArray(item?.features) ? item.features.map(String) : []),
  ].filter(Boolean);

  if (loading) return (
    <div className={styles.pageLoading} aria-live="polite">
      <PageLoader message={t("homeSwapDetails.loadingHomeSwap")} />
    </div>
  );
  if (!item) return <div className={styles.pageLoading} role="alert">{t("homeSwapDetails.notFound")}</div>;

  const location =
    item?.location || item?.city || item?.area || item?.address || null;

  const mapsQuery = location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
    : null;
  const moreFromUserHref = ownerId ? `/app/home-swap?userId=${encodeURIComponent(ownerId)}` : null;
  const relatedInCityHref = item?.city ? `/app/home-swap?city=${encodeURIComponent(item.city)}` : null;

  const jumpTo = (ref) => ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className={styles.page}>
      {/* Top sticky actions */}
      <div className={styles.topBar}>
        <Link className={styles.backLink} to="/app/home-swap" aria-label="Back to Home Swap list">
          ← {t("homeSwapDetails.backToHomeSwap")}
        </Link>

        {!isOwner && (
          <div className={styles.stickyBar}>
            <button
              className={`${buttonStyles.btn} ${styles.neutralBtn}`}
              onClick={toggleSaved}
              title={saved ? t("homeSwapDetails.removeFromSaved") : t("homeSwapDetails.save")}
            >
              {saved ? t("homeSwapDetails.saved") : t("homeSwapDetails.save")}
            </button>
            <button
              className={`${buttonStyles.btn} ${styles.primaryBtn}`}
              onClick={() => openDM("interest")}
            >
              I’m interested
            </button>
            <button
              className={`${buttonStyles.btn} ${styles.neutralBtn}`}
              onClick={() => openDM("details")}
            >
              {t("homeSwapDetails.requestMoreInfo")}
            </button>
            <button
              className={`${buttonStyles.btn} ${styles.neutralBtn}`}
              onClick={handleShare}
            >
              {t("homeSwapDetails.share")}
            </button>
          </div>
        )}
      </div>

      {/* Header: media + title/meta */}
      <header className={styles.header}>
        <div className={styles.mediaWrap} aria-label="Listing photos">
          {photos.length > 0 ? (
            <>
              <ImageCarousel photos={photos} />
              <div className={styles.mediaBadge} aria-hidden="true">
                {photos.length} {photos.length === 1 ? t("homeSwapDetails.photo") : t("homeSwapDetails.photos")}
              </div>
            </>
          ) : (
            <div className={styles.mediaFallback} />
          )}
        </div>

        <div className={styles.titleWrap}>
          <h1 className={styles.title}>
            {item?.title || item?.headline || "Home Swap"}
          </h1>
          <EntityMetaBar
            location={location}
            price={item?.price || null}
            period={item?.price ? item?.pricePeriod || "per swap" : null}
            ownerName={ownerName}
            postedAt={item?.createdAt || item?.postedAt}
          />
        </div>
      </header>

      {/* Section jump chips */}
      <section className={styles.section} aria-label="Sections">
        <div className={styles.chips}>
          <button className={styles.chip} type="button" onClick={() => jumpTo(aboutRef)}>
            {t("homeSwapDetails.about")}
          </button>
          <button className={styles.chip} type="button" onClick={() => jumpTo(detailsRef)}>
            {t("homeSwapDetails.keyDetails")}
          </button>
          {chips.length > 0 && (
            <button className={styles.chip} type="button" onClick={() => jumpTo(amenitiesRef)}>
              {t("homeSwapDetails.amenities")}
            </button>
          )}
          <button className={styles.chip} type="button" onClick={() => jumpTo(ownerRef)}>
            {t("homeSwapDetails.owner")}
          </button>
        </div>
      </section>

      {/* Quick external actions */}
      <section className={styles.section} aria-label="Quick actions">
        <div className={styles.chips}>
          <button onClick={copyLink} className={styles.chip} type="button">{t("homeSwapDetails.copyLink")}</button>
          {mapsQuery && (
            <a href={mapsQuery} target="_blank" rel="noreferrer" className={styles.chip}>
              {t("homeSwapDetails.openInGoogleMaps")}
            </a>
          )}
          {ownerId && (
            <Link to={`/app/profile/${ownerId}`} className={styles.chip}>
              {t("homeSwapDetails.viewProfile")}
            </Link>
          )}
          {moreFromUserHref && (
            <Link to={moreFromUserHref} className={styles.chip}>
              {t("homeSwapDetails.moreFromThisUser")}
            </Link>
          )}
          {relatedInCityHref && (
            <Link to={relatedInCityHref} className={styles.chip}>
              {t("homeSwapDetails.relatedIn")} {item.city}
            </Link>
          )}
        </div>
      </section>

      {/* Content */}
      <div className={styles.contentGrid}>
        {/* Left column */}
        <main className={styles.body}>
          {(facts.length > 0 || desiredLocations || item?.swapPreferences) && (
            <section ref={detailsRef} className={styles.card} aria-label="Key details">
              <h3 className={styles.sectionTitle}>{t("homeSwapDetails.keyDetails")}</h3>
              <div className={styles.factsGrid}>
                {facts.map((f, i) => (
                  <div key={`${f.label}-${i}`} className={styles.fact}>
                    <span>{f.label}</span>
                    <strong>{f.value}</strong>
                  </div>
                ))}
                {desiredLocations && (
                  <div className={styles.factWide}>
                    <span>{t("homeSwapDetails.desiredLocations")}</span>
                    <strong>{desiredLocations}</strong>
                  </div>
                )}
                {item?.swapPreferences && (
                  <div className={styles.factWide}>
                    <span>{t("homeSwapDetails.notes")}</span>
                    <strong>{String(item.swapPreferences)}</strong>
                  </div>
                )}
              </div>
            </section>
          )}

          <section ref={aboutRef} className={styles.section}>
            <h2 className={styles.sectionTitle}>{t("homeSwapDetails.aboutThisSwap")}</h2>
            <p className={styles.sectionText}>
              {item?.description || item?.details || t("homeSwapDetails.noDescriptionProvided")}
            </p>
          </section>

          {chips.length > 0 && (
            <section ref={amenitiesRef} className={styles.section} aria-label="Amenities">
              <h3 className={styles.sectionTitle}>{t("homeSwapDetails.amenities")}</h3>
              <div className={styles.chips}>
                {chips.map((c, i) => (
                  <span key={`${c}-${i}`} className={styles.chip}>
                    {c}
                  </span>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Right column: owner card */}
        <aside ref={ownerRef} className={styles.ownerCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <button
              type="button"
              className={styles.ownerHeaderAvatarBtn}
              onClick={() => ownerId && navigate(`/app/profile/${ownerId}`)}
              aria-label="View profile"
              disabled={!ownerId}
              style={{ padding: 0, border: 0, background: "transparent" }}
            >
              <img
                src={ownerAvatarUrl || FALLBACK_PIXEL}
                alt={ownerName || "Owner"}
                className={styles.ownerHeaderAvatar}
                onError={(e) => (e.currentTarget.src = FALLBACK_PIXEL)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  objectFit: "cover",
                  display: "block",
                  border: "1px solid var(--hs-line)",
                }}
              />
            </button>

            <div style={{ minWidth: 0 }}>
              {ownerId ? (
                <Link to={`/app/profile/${ownerId}`} className={styles.ownerName}>
                  {ownerName || "Owner"}
                </Link>
              ) : (
                <div className={styles.ownerName}>{ownerName || "Owner"}</div>
              )}
            </div>
          </div>

          {/* DM button for non-owners */}
          {!isOwner && (
            <div className={styles.ownerActions}>
              <button
                type="button"
                className={`${buttonStyles.btn} ${styles.primaryBtn} ${styles.blockBtn}`}
                onClick={() => openDM("interest")}
              >
{t("homeSwapDetails.message")} {firstWord(ownerName)}
              </button>
            </div>
          )}

          {/* Owner/admin/mod actions */}
          {(isOwner || canDelete) && (
            <div className={styles.ownerActions} style={{ marginTop: 12 }}>
              {isOwner && (
                <Link
                  to={`/app/home-swap/${id}/edit`}
                  className={`${buttonStyles.btn} ${buttonStyles.secondary} ${styles.blockBtn}`}
                >
                  {t("homeSwapDetails.edit")}
                </Link>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className={`${buttonStyles.btn} ${buttonStyles.danger} ${styles.blockBtn}`}
                >
                  {t("homeSwapDetails.delete")}
                </button>
              )}
              <button
                type="button"
                onClick={handleShare}
                className={`${buttonStyles.btn} ${styles.neutralBtn} ${styles.blockBtn}`}
              >
                {t("homeSwapDetails.share")}
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom action buttons for non-owners */}
      {!isOwner && (
        <div className={styles.bottomActions}>
          <div className={styles.chips}>
            <button
              className={`${buttonStyles.btn} ${styles.neutralBtn}`}
              onClick={toggleSaved}
              title={saved ? t("homeSwapDetails.removeFromSaved") : t("homeSwapDetails.save")}
            >
              {saved ? t("homeSwapDetails.saved") : t("homeSwapDetails.save")}
            </button>
            <button
              className={`${buttonStyles.btn} ${styles.primaryBtn}`}
              onClick={() => openDM("interest")}
            >
              I'm interested
            </button>
            <button
              className={`${buttonStyles.btn} ${styles.neutralBtn}`}
              onClick={() => openDM("details")}
            >
              {t("homeSwapDetails.requestMoreInfo")}
            </button>
            <button
              className={`${buttonStyles.btn} ${styles.neutralBtn}`}
              onClick={handleShare}
            >
              {t("homeSwapDetails.share")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
