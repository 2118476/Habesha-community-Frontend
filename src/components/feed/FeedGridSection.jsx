// src/components/feed/FeedGridSection.jsx
import React from "react";
import styles from "../../pages/Feed/FeedPage.module.scss";
import FeedItemCard from "./FeedItemCard";
import { makeApiUrl } from "../../api/httpUrl";

/**
 * Grid section used by Rentals / Home Swap / Services / Ads.
 * - If `title` is falsy, header is omitted (so parent can own the header).
 * - `kind` is passed through to FeedItemCard via item props context.
 */

// type-specific last-resort first-photo path (for image-first types)
function fallbackPhotoPath(type, id) {
  if (!id) return null;
  const t = (type || "").toLowerCase();
  switch (t) {
    case "home_swap":
    case "home-swap":
    case "homeswap":
      return `/homeswap/${id}/photos/first`;
    case "rental":
    case "rentals":
    case "rental_listing":
    case "rental-listing":
    case "listing_rental":
    case "listing-rental":
      return `/rentals/${id}/photos/first`;
    default:
      return null;
  }
}

function absolutize(src) {
  if (!src || typeof src !== "string") return null;
  if (/^https?:\/\//i.test(src)) return src; // already absolute
  const path = src.startsWith("uploads/") ? `/${src}` : src; // normalize uploads/...
  return makeApiUrl(path);
}

// safest image selector for the card
function resolveImgSrc(it) {
  const t = (it?.type || "").toLowerCase();

  // 1) already absolute from feed normalization
  if (typeof it.imageUrlAbsolute === "string" && it.imageUrlAbsolute) {
    return it.imageUrlAbsolute;
  }
  // 2) relative/absolute imageUrl
  if (typeof it.imageUrl === "string" && it.imageUrl) {
    return absolutize(it.imageUrl);
  }
  // 3) DTO convenience (e.g., Rentals)
  if (typeof it.firstPhotoUrl === "string" && it.firstPhotoUrl) {
    return absolutize(it.firstPhotoUrl);
  }
  // 4) common alternates
  const alt =
    it.coverUrl ||
    it.photoUrl ||
    (Array.isArray(it.photos) && (it.photos[0]?.url || it.photos[0]?.path)) ||
    null;
  if (alt) return absolutize(alt);

  // For Services & Ads: do NOT invent a photo; render text-card instead.
  if (t.includes("service") || t.includes("ad") || t.includes("classified")) {
    return null;
  }

  // 5) Rentals/HomeSwap last-resort by type/id
  const id =
    it?.id ??
    it?.itemId ??
    it?.rentalId ??
    it?.homeSwapId ??
    it?.listingId ??
    it?.publicId ??
    it?.uuid ??
    it?._id ??
    null;

  const fb = fallbackPhotoPath(it?.type, id);
  return fb ? absolutize(fb) : null;
}

export default function FeedGridSection({
  title,
  items = [],
  observe,
  kind,
  showCount = true,
  headerExtra = null,
}) {
  /*
   * The FeedGridSection does not rely on specific module classes for
   * its container – the surrounding feed section provides the spacing
   * and scroll‑triggered transforms.  We avoid referencing undefined
   * classes (e.g. styles.section, styles.reveal) here.  Instead, we
   * optionally render a header and then a grid container using the
   * existing `gridStagger` utility class.  The `data-reveal="list-up"`
   * attribute triggers the global reveal styles defined in
   * `_reveal.scss` for a staggered entrance.
   */
  return (
    <section
      ref={observe}
      aria-label={title || undefined}
      data-kind={kind}
      style={{ "--d": "60ms" }}
    >
      {title ? (
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {headerExtra}
            {showCount && (
              <span className={styles.count}>{items?.length || 0}</span>
            )}
          </div>
        </div>
      ) : null}

      <div
        className={styles.gridStagger}
        role="list"
        data-reveal="list-up"
      >
        {items && items.length ? (
          items.map((it, i) => {
            const imgSrc = resolveImgSrc(it); // may be null → text-card layout
            const key = `${kind}-${it.slug ?? it.id ?? it._id ?? it.uuid ?? i}-${i}`;
            return (
              <FeedItemCard
                key={key}
                item={it}
                kind={kind}
                observe={observe}
                index={i}
                role="listitem"
                imgSrc={imgSrc}
              />
            );
          })
        ) : (
          <div className={styles.emptyInline} role="note">
            No items yet.
          </div>
        )}
      </div>
    </section>
  );
}
