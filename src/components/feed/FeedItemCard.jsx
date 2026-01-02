/* @jsxRuntime classic */
// src/components/feed/FeedItemCard.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "../../pages/Feed/FeedPage.module.scss";
import { makeApiUrl } from "../../api/httpUrl";

const FALLBACK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

/* ----------------------- helpers ----------------------- */
function detailsPath(type, id) {
  if (!id) return "#";
  const t = (type || "").toLowerCase();
  switch (t) {
    case "home_swap":
    case "home-swap":
    case "homeswap":
      return `/app/homeswap/${id}`;
    case "rental":
    case "rentals":
    case "rental_listing":
    case "rental-listing":
    case "listing_rental":
    case "listing-rental":
      return `/app/rentals/${id}`;
    case "service":
    case "services":
      return `/app/services/${id}`;
    case "event":
    case "events":
      return `/app/events/${id}`;
    case "ad":
    case "ads":
    case "classified":
      return `/app/ads/${id}`;
    case "travel":
    case "trip":
    case "trips":
    case "tour":
    case "tours":
    case "journey":
      return `/app/travel/${id}`;
    default:
      return "#";
  }
}

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/* Normalize a possible path or URL to an absolute URL */
const isAbs = (s) => typeof s === "string" && /^(https?:)?\/\//i.test(s);
function absolutize(src) {
  if (!src || typeof src !== "string") return null;
  if (isAbs(src)) return src; // already absolute
  const path = src.startsWith("uploads/") ? `/${src}` : src; // normalize "uploads/..."
  return makeApiUrl(path);
}

/** Try to derive an image when feed item didn't give one. */
function deriveImgFromItem(item) {
  const t = (item?.type || "").toLowerCase();

  // Common direct fields
  const direct =
    item?.imageUrl ||
    item?.pictureUrl ||
    item?.image ||
    item?.photoUrl ||
    item?.firstPhotoUrl ||
    item?.thumbnailUrl ||
    item?.coverUrl ||
    item?.primaryImageUrl ||
    item?.primaryPhotoUrl ||
    item?.url ||
    item?.thumb ||
    item?.thumbnail ||
    item?.imagePath ||
    item?.photoPath ||
    item?.firstPhotoPath;

  if (direct) return absolutize(direct);

  // Arrays
  const arrays = [
    item?.photos,
    item?.images,
    item?.pictures,
    item?.media,
    item?.gallery,
    item?.imageUrls,
  ].filter(Boolean);

  for (const arr of arrays) {
    if (!Array.isArray(arr) || !arr.length) continue;
    const first = arr[0];
    if (typeof first === "string") {
      const a = absolutize(first);
      if (a) return a;
    } else if (first && typeof first === "object") {
      const u = first.url || first.src || first.thumbnailUrl || first.path;
      const a = absolutize(u);
      if (a) return a;
    }
  }

  // Rentals/HomeSwap: last-resort first-photo endpoints (requires id)
  const id =
    item?.id ??
    item?.itemId ??
    item?.rentalId ??
    item?.homeSwapId ??
    item?.listingId ??
    item?.publicId ??
    item?.uuid ??
    item?._id ??
    null;

  if (!id) return null;

  if (t.includes("rental")) return absolutize(`/rentals/${id}/photos/first`);
  if (t.includes("swap") || t.includes("home"))
    return absolutize(`/homeswap/${id}/photos/first`);

  return null;
}

/* ---------- TRAVEL title/location synthesis ---------- */
function synthesizeTravelLabel(item) {
  const first = (...vals) => {
    for (const v of vals) if (v != null && String(v).trim() !== "") return String(v).trim();
    return null;
  };

  const origin = first(
    item.originCity,
    item.origin, item.from, item.fromCity, item.from_city, item.departureCity, item.departure_city,
    item.departure, item.leavingFrom, item.source, item.start, item.startCity, item.fromLocation, item.from_location,
    item?.route?.from, item?.route?.origin, item?.route?.fromCity, item?.route?.originCity,
    item?.from?.city, item?.from?.name, item?.originCity?.name
  );
  const destination = first(
    item.destinationCity,
    item.destination, item.to, item.toCity, item.to_city, item.arrivalCity, item.arrival_city,
    item.arrival, item.goingTo, item.end, item.endCity, item.toLocation, item.to_location,
    item?.route?.to, item?.route?.destination, item?.route?.toCity, item?.route?.destinationCity,
    item?.to?.city, item?.to?.name, item?.destinationCity?.name
  );

  const title =
    item?.title && String(item.title).trim() !== ""
      ? item.title
      : (origin || destination)
      ? `${origin || "—"} → ${destination || ""}`.trim()
      : "(Untitled)";

  const location =
    item?.location && String(item.location).trim() !== ""
      ? item.location
      : (origin || destination)
      ? `${origin || ""}${origin && destination ? " → " : ""}${destination || ""}`.trim()
      : undefined;

  return { title, location };
}

/* ----------------------- component ----------------------- */
export default function FeedItemCard({ item, kind, imgSrc }) {
  const computedKind = useMemo(() => {
    if (kind) return kind;
    const t = (item?.type || "").toLowerCase();
    if (t.includes("rental")) return "rentals";
    if (t.includes("home") || t.includes("swap")) return "homes";
    if (t.includes("service")) return "services";
    if (t.includes("ad") || t.includes("classified")) return "ads";
    if (t.includes("travel") || t.includes("trip") || t.includes("tour") || t.includes("journey")) return "travel";
    return "other";
  }, [item?.type, kind]);

  const to = item?.detailPath || detailsPath(item?.type, item?.id);
  const travelLabel = computedKind === "travel" ? synthesizeTravelLabel(item) : null;
  const title = (travelLabel?.title ?? item?.title ?? "").trim() || "(Untitled)";
  const location = (travelLabel?.location ?? item?.location ?? "").trim() || null;

  // money chips
  const price =
    toNumber(item?.price) ??
    toNumber(item?.amount) ??
    toNumber(item?.cost) ??
    toNumber(item?.fare) ??
    toNumber(item?.ticketPrice) ??
    toNumber(item?.seatPrice) ??
    null;

  const computedImg = absolutize(imgSrc) || deriveImgFromItem(item);
  const hasImage = !!computedImg;

  // ---- Text-first card (simple) ----
  if (!hasImage && (computedKind === "services" || computedKind === "ads" || computedKind === "travel")) {
    return (
      <Link to={to} className={styles.card} aria-label={title}>
        <div className={styles.cardBody}>
          <h3 className={styles.cardTitle} title={title}>{title}</h3>
          {location && <div className={styles.cardLocation}>{location}</div>}
          {price != null && (
            <div className={styles.priceBadge} style={{ marginTop: 10 }}>
              £{price.toLocaleString("en-GB")}
            </div>
          )}
        </div>
      </Link>
    );
  }

  // ---- Image card (simple) ----
  const img = computedImg || FALLBACK_PIXEL;
  const typeBadge = (item?.type || "").replaceAll("_", " ").trim() || "Listing";

  return (
    <Link to={to} className={styles.card} aria-label={title}>
      <div className={styles.cardThumb}>
        <img
          src={img}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={(e) => (e.currentTarget.src = FALLBACK_PIXEL)}
        />
        <div className={styles.thumbBadges}>
          <span className={styles.thumbBadge}>{typeBadge}</span>
          {price != null && (
            <span className={styles.priceBadge}>
              £{price.toLocaleString("en-GB")}{computedKind === "rentals" || computedKind === "homes" ? <span className={styles.priceSub}>/mo</span> : null}
            </span>
          )}
        </div>
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle} title={title}>{title}</h3>
        {location && <div className={styles.cardLocation}>{location}</div>}
      </div>
    </Link>
  );
}
