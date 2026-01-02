// src/pages/Rentals/Details.js
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import api from "../../api/axiosInstance";
import { getRental, getRentalWithPhotos } from "../../api/rentals";
import { makeApiUrl } from "../../api/httpUrl";
import { PageLoader } from "../../components/ui/PageLoader/PageLoader";

import styles from "../../stylus/sections/RentalsDetail.module.scss";
import buttonStyles from "../../stylus/components/Button.module.scss";

import EntityMetaBar from "../../components/EntityMetaBar.jsx";
import ImageCarousel from "../../components/ImageCarousel.jsx";
import OwnerActions from "../../components/OwnerActions.jsx";

import {
  resolveOwnerId,
  resolveOwnerName,
  navigateToDM,
} from "../../utils/dmNavigation";

const FALLBACK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export default function RentalDetails() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ownerPreview, setOwnerPreview] = useState(null);

  const safeApiUrl = (u) => (typeof u === "string" && u ? makeApiUrl(u) : null);

  // Load rental core + with-photos payloads and merge them
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [core, withPhotos] = await Promise.all([
          getRental(id).catch(() => null),
          getRentalWithPhotos(id).catch(() => null),
        ]);

        if (!core && !withPhotos) {
          toast.error(t("rentals.rentalNotFound"));
          setItem(null);
          return;
        }

        setItem({ ...(core || {}), ...(withPhotos || {}) });
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          t("rentals.failedToLoadRental");
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // figure out owner/poster (backend is not 100% consistent in naming)
  const posterObj = item?.postedBy || item?.owner || item?.user || null;
  const posterIdExplicit =
    posterObj?.id ??
    item?.userId ??
    item?.ownerId ??
    item?.posterId ??
    null;

  const ownerId = useMemo(
    () => resolveOwnerId(item) || posterIdExplicit || null,
    [item, posterIdExplicit]
  );

  const ownerName = useMemo(
    () => resolveOwnerName(item) || t("rentals.owner"),
    [item, t]
  );

  // admin-aware ownership check:
  const isOwner = useMemo(() => {
    if (!user) return false;

    const meId = user?.id ?? user?.userId ?? user?._id ?? null;
    const sameUser =
      meId != null && ownerId != null && String(meId) === String(ownerId);

    // roles could be strings or objects; normalise to upper-case strings
    const roles = Array.isArray(user?.roles)
      ? user.roles.map((r) =>
          typeof r === "string" ? r.toUpperCase() : String(r?.name || "").toUpperCase()
        )
      : [];
    const isAdmin = roles.includes("ADMIN");

    return sameUser || isAdmin;
  }, [user, ownerId]);

  // preload lightweight owner info (avatar, etc.) for sidebar
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ownerId) return;
      try {
        const res = await fetch(makeApiUrl(`/users/${ownerId}`), {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setOwnerPreview(data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  // photos for carousel
  const photos = useMemo(() => {
    if (!item) return [];

    // case 1: server already sent an array of objects
    if (Array.isArray(item.photos) && item.photos.length > 0) {
        return item.photos
          .map((p, i) => {
            const url =
              (typeof p?.url === "string" && p.url) ||
              (typeof p?.path === "string" && p.path) ||
              (p?.id ? `/rentals/photos/${p.id}` : null);
            return {
              id: p?.id ?? p?.photoId ?? i,
              url: safeApiUrl(url) || null,
            };
          })
          .filter((p) => p.url);
    }

    // case 2: fallback to photosCount -> /rentals/:id/photos/:i
    const count = Number(item?.photosCount ?? item?.photoCount ?? 0) || 0;
    return count > 0
      ? Array.from({ length: count }, (_, i) => ({
          id: i,
          url: safeApiUrl(`/rentals/${id}/photos/${i}`),
        }))
      : [];
  }, [item, id]);

  // avatar URL
  const ownerAvatarUrl = useMemo(() => {
    if (ownerPreview?.profile_image_url) return ownerPreview.profile_image_url;
    if (!ownerId) return null;
    return makeApiUrl(`/users/${ownerId}/profile-image`);
  }, [ownerId, ownerPreview]);

  // message prefills for DM
  const dmPrefill = (type) => {
    const first = (ownerName || "there").split(" ")[0];
    const title = item?.title || "your rental";
    const loc = item?.location ? ` in ${item.location}` : "";
    if (type === "interest")
      return `Hi ${first}, I’m interested in "${title}"${loc}.`;
    if (type === "available")
      return `Hi ${first}, is "${title}"${loc} still available?`;
    return `Hi ${first}, can you share more details about "${title}"${loc}?`;
  };

  // open DM screen
  const openDM = (prefill) => {
    if (!ownerId) {
      return navigate("/app/messages", {
        state: { selectedUserName: ownerName, prefillMessage: prefill },
      });
    }
    navigateToDM(navigate, ownerId, {
      ownerName,
      prefillMessage: prefill,
      focusComposer: true,
      contextType: "rental",
      contextId: item?.id ?? id ?? null,
    });
  };

  // share / copy link
  const handleShare = async () => {
    const url = window.location.href;
    const title = item?.title || "Rental";
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success(t("common.linkCopied"));
      } else {
        toast.info(t("common.sharingNotSupported"));
      }
    } catch {
      /* ignore cancel */
    }
  };

  // delete rental -> back to rentals list
  const handleDeleteRental = async () => {
    if (!window.confirm(t("rentals.deleteListingConfirm"))) {
      return;
    }
    try {
      await api.delete(`/rentals/${id}`);
      toast.success(t("rentals.listingDeleted"));
      navigate("/app/rentals");
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("rentals.failedToDeleteListing");
      toast.error(msg);
    }
  };

  if (loading) return (
    <div className={styles.page}>
      <PageLoader message={t("rentals.loadingRental")} />
    </div>
  );
  if (!item) return <div className={styles.page}>{t("common.notFound")}</div>;

  // build facts grid
  const facts = [
    {
      label: t("rentals.price"),
      value:
        item?.price != null
          ? `£${Number(item.price).toLocaleString("en-GB")}${
              item?.period ? `/${item.period}` : `/${t("rentals.month")}`
            }`
          : null,
    },
    {
      label: t("rentals.deposit"),
      value:
        item?.deposit != null
          ? `£${Number(item.deposit).toLocaleString("en-GB")}`
          : null,
    },
    {
      label: t("rentals.houseType"),
      value: item?.roomType ? String(item.roomType).toUpperCase() : null,
    },
    {
      label: t("rentals.furnished"),
      value:
        item?.furnished == null
          ? null
          : item.furnished
          ? t("common.yes")
          : t("common.no"),
    },
    {
      label: t("rentals.billsIncluded"),
      value:
        item?.billsIncluded == null
          ? null
          : item.billsIncluded
          ? t("common.yes")
          : t("common.no"),
    },
    {
      label: t("rentals.bedrooms"),
      value:
        item?.bedrooms != null ? String(item.bedrooms) : null,
    },
    {
      label: t("rentals.bathrooms"),
      value:
        item?.bathrooms != null ? String(item.bathrooms) : null,
    },
    {
      label: t("rentals.availableFrom"),
      value: item?.availableFrom
        ? new Date(item.availableFrom).toLocaleDateString("en-GB")
        : null,
    },
    {
      label: t("rentals.minTerm"),
      value: item?.minTerm ? `${item.minTerm} ${t("rentals.months")}` : null,
    },
  ].filter((f) => f.value);

  // chips / amenities list
  const chips = [
    item?.parking ? t("rentals.parking") : null,
    item?.internet ? t("rentals.internet") : null,
    item?.garden ? t("rentals.garden") : null,
    item?.balcony ? t("rentals.balcony") : null,
    item?.petsAllowed ? t("rentals.petsAllowed") : null,
    ...(Array.isArray(item?.amenities)
      ? item.amenities.map((a) => String(a))
      : []),
  ].filter(Boolean);

  return (
    <div className={styles.page}>
      {/* back link */}
      <div className={styles.topBar}>
        <Link
          className={`${buttonStyles.link} ${styles.backLink}`}
          to="/app/rentals"
        >
          ← {t("rentals.backToRentals")}
        </Link>
      </div>

      {/* heading section */}
      <div className={styles.header}>
        <h1 className={styles.title}>{item.title}</h1>

        <div className={styles.subtle}>
          {item.location && <span>{item.location}</span>}
          {item.location && (item.price != null || item.roomType) && (
            <span> · </span>
          )}

          {item.price != null && (
            <span>
              £{Number(item.price).toLocaleString("en-GB")}
              {item.period ? `/${item.period}` : `/${t("rentals.month")}`}
            </span>
          )}

          {item.roomType && (
            <>
              <span> · </span>
              <span>{String(item.roomType).toUpperCase()}</span>
            </>
          )}
        </div>
      </div>

      {/* photos */}
      {photos.length > 0 && (
        <div className={styles.mediaWrap}>
          <ImageCarousel photos={photos} />
        </div>
      )}

      {/* main content grid */}
      <div className={styles.contentGrid}>
        {/* LEFT COLUMN */}
        <div>
          {/* key facts card */}
          {facts.length > 0 && (
            <section
              className={styles.factsCard}
              aria-label={t("rentals.keyFacts")}
            >
              <dl className={styles.factsGrid}>
                {facts.map((f, i) => (
                  <div
                    key={`${f.label}-${i}`}
                    className={styles.fact}
                  >
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* description */}
          <section>
            <h3 className={styles.sectionTitle}>{t("rentals.description")}</h3>
            <p className={styles.body}>
              {item.description || t("rentals.noDescription")}
            </p>
          </section>

          {/* chips / amenities */}
          {chips.length > 0 && (
            <section
              aria-label={t("rentals.features")}
              className={styles.chipsSection}
            >
              <ul className={styles.chips}>
                {chips.map((c, i) => (
                  <li key={`${c}-${i}`}>{c}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN / OWNER CARD */}
        <aside className={styles.ownerCard}>
          {/* poster info row */}
          <div className={styles.ownerHeader}>
            <button
              type="button"
              className={styles.ownerHeaderAvatarBtn}
              onClick={() =>
                ownerId && navigate(`/app/profile/${ownerId}`)
              }
              aria-label={t("rentals.viewOwnerProfile")}
              disabled={!ownerId}
            >
              <img
                src={ownerAvatarUrl || FALLBACK_PIXEL}
                alt={ownerName || t("rentals.owner")}
                className={styles.ownerHeaderAvatar}
                onError={(e) => (e.currentTarget.src = FALLBACK_PIXEL)}
              />
            </button>

            <div className={styles.ownerHeaderText}>
              <div className={styles.ownerHeaderLabel}>
                {t("rentals.postedBy")}
              </div>

              {ownerId ? (
                <Link
                  to={`/app/profile/${ownerId}`}
                  className={styles.ownerHeaderName}
                >
                  {ownerName || t("rentals.owner")}
                </Link>
              ) : (
                <div className={styles.ownerHeaderName}>
                  {ownerName || t("rentals.owner")}
                </div>
              )}
            </div>

            {!isOwner && ownerId && (
              <div className={styles.ownerHeaderActions}>
                <button
                  className={`${buttonStyles.btn} ${styles.compactBtn} ${styles.compactPrimary}`}
                  onClick={() => openDM(dmPrefill("interest"))}
                >
                  Message
                </button>
              </div>
            )}
          </div>

          {/* actions for non-owner (Contact / Ask etc.) */}
          {!isOwner && ownerId && (
            <div
              className="actionsRow"
              style={{
                marginTop: 12,
                display: "grid",
                gap: 8,
              }}
            >
              <button
                className={`${buttonStyles.btn} ${styles.compactBtn} ${styles.hoverBrand}`}
                onClick={() => openDM(dmPrefill("interest"))}
              >
                I’m interested
              </button>

              <button
                className={`${buttonStyles.btn} ${styles.compactBtn} ${styles.hoverBrand}`}
                onClick={() => openDM(dmPrefill("available"))}
              >
                {t("rentals.isThisStillAvailable")}
              </button>

              <button
                className={`${buttonStyles.btn} ${styles.compactBtn} ${styles.hoverBrand}`}
                onClick={() => openDM(dmPrefill("details"))}
              >
                {t("rentals.askForMoreDetails")}
              </button>

              <button
                className={`${buttonStyles.btn} ${styles.compactBtn} ${styles.hoverBrand}`}
                onClick={handleShare}
              >
                Share
              </button>

              <button
                className={`${buttonStyles.btn} ${styles.compactBtn} ${styles.hoverBrand}`}
                onClick={() => navigate(`/app/profile/${ownerId}`)}
              >
                {t("profile.viewProfile")}
              </button>
            </div>
          )}

          {/* actions for owner/admin (Edit / Delete / Share) */}
          {isOwner && (
            <div
              className="actionsRow"
              style={{
                marginTop: 12,
                display: "grid",
                gap: 8,
              }}
            >
              {/* Reuse OwnerActions to give Edit + Delete */}
              <OwnerActions
                isOwner={true}
                editTo={`/app/rentals/${id}/edit`}
                onDelete={handleDeleteRental}
                className="ownerActionsRow"
              />

              <button
                className={`${buttonStyles.btn} ${styles.compactBtn}`}
                onClick={handleShare}
              >
                Share
              </button>
            </div>
          )}
        </aside>

        {/* sticky bottom bar on mobile for quick contact/share */}
        {!isOwner && ownerId && (
          <div
            className={styles.stickyBar}
            role="region"
            aria-label={t("rentals.quickActions")}
          >
            <button
              className={`${buttonStyles.btn} ${styles.compactBtn} ${styles.compactPrimary}`}
              onClick={() => openDM(dmPrefill("interest"))}
            >
              {t("rentals.contact")}
            </button>

            <button
              className={`${buttonStyles.btn} ${styles.compactBtn}`}
              onClick={handleShare}
            >
              Share
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
