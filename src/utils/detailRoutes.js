// src/utils/detailRoutes.js
// Build correct detail links from heterogeneous search/feed items.

const LINK_PATTERNS = {
  rentals:  ["/app/rentals/:id"],
  homeswap: ["/app/homeswap/:id"], // NOTE: your routes use "homeswap" (no dash)
  services: ["/app/services/:id"],
  events:   ["/app/events/:id"],
  travel:   ["/app/travel/:id"],
  ads:      ["/app/ads/:id"],
};

const firstString = (...vals) =>
  vals.find((v) => typeof v === "string" && v.trim().length > 0) || null;

const isAbs = (s) => typeof s === "string" && /^(https?:)?\/\//i.test(s);

function normalizeRel(p) {
  if (!p) return "/app/home";
  // Normalise common “detail” shapes to our /app paths
  if (p.startsWith("/app/")) return p;
  if (p.startsWith("/")) return `/app${p}`.replace(/\/{2,}/g, "/");
  return `/app/${p}`.replace(/\/{2,}/g, "/");
}

function directHref(it) {
  const d = firstString(
    it?.frontendHref,
    it?.frontendUrl,
    it?.clientUrl,
    it?.detailsUrl,
    it?.detailUrl,
    it?.viewUrl,
    it?.href,
    it?.url,
    it?.path,
    it?.link,
    it?.routerPath
  );
  if (!d) return null;
  return isAbs(d) ? d : normalizeRel(d);
}

function rawTypeToKey(s) {
  if (!s) return null;
  const t = String(s).toLowerCase();
  if (/^rent/.test(t) || /\brental(s)?\b/.test(t)) return "rentals";
  if (/home[-_\s]?swap|^swap$/.test(t)) return "homeswap";
  if (/service|tutor|repair|clean|plumb|electric/.test(t)) return "services";
  if (/event|festival|conference|meetup/.test(t)) return "events";
  if (/travel|trip|tour|flight|itinerary/.test(t)) return "travel";
  if (/^ad(s)?$|classified/.test(t) || /marketplace/.test(t)) return "ads";
  return null;
}

function guessModuleFromItem(it) {
  // explicit hints first (we set __module in search fallback too)
  const explicit = firstString(
    it?.__module,
    it?.module,
    it?.group,
    it?.domain,
    it?.collection,
    it?.section
  );
  const byExplicit = rawTypeToKey(explicit);
  if (byExplicit) return byExplicit;

  // from path-ish fields
  const p = (it?.href || it?.url || it?.path || it?.link || "").toLowerCase();
  if (p.includes("/rentals")) return "rentals";
  if (p.includes("/home-swap") || p.includes("/homeswap")) return "homeswap";
  if (p.includes("/services")) return "services";
  if (p.includes("/events")) return "events";
  if (p.includes("/travel")) return "travel";
  if (p.includes("/ads") || p.includes("/classified")) return "ads";

  // from field shape
  if (
    ["bedrooms", "bathrooms", "rent", "deposit", "address", "city"].some(
      (k) => k in (it || {})
    )
  )
    return "rentals";
  if (["availableDates", "swapType"].some((k) => k in (it || {})))
    return "homeswap";
  if (
    ["hourlyRate", "serviceCategory", "skills", "experience"].some(
      (k) => k in (it || {})
    )
  )
    return "services";
  if (
    ["startsAt", "startDate", "eventDate", "endDate", "venue"].some(
      (k) => k in (it || {})
    )
  )
    return "events";
  if (
    ["destination", "departure", "itinerary"].some((k) => k in (it || {}))
  )
    return "travel";
  if (["price", "condition"].some((k) => k in (it || {}))) return "ads";

  // title fallback
  const titleish = String(it?.title || it?.name || "").toLowerCase();
  if (/\brent|room|flat|apartment|house\b/.test(titleish)) return "rentals";
  if (/\bswap|home\s*swap\b/.test(titleish)) return "homeswap";
  if (/\btutor|tutoring|repair|clean|support\b/.test(titleish)) return "services";

  return null;
}

function pickIdOrSlug(it) {
  return firstString(
    // common generics
    it?.slug,
    it?.id,
    it?._id,
    it?.uuid,
    it?.publicId,
    it?.listingId,
    // module-specific
    it?.rentalId,
    it?.serviceId,
    it?.adId,
    it?.eventId,
    it?.travelId,
    it?.swapId,
    it?.homeSwapId,
    it?.home_swap_id
  );
}

/**
 * Build href for any item coming from search/feed:
 * - Use any existing href/url (normalised).
 * - Else build from module + id/slug with real app routes.
 * - Else fall back to module index with ?open=… to avoid 404s.
 * - Else hard-fallback /app/home (never empty/undefined).
 */
export function buildHrefForItem(it) {
  if (!it) return "/app/home";

  const direct = directHref(it);
  if (direct) return direct;

  const moduleKey = guessModuleFromItem(it);
  const idOrSlug = pickIdOrSlug(it);

  if (moduleKey && idOrSlug) {
    const pat = (LINK_PATTERNS[moduleKey] || [])[0];
    if (pat) return pat.replace(":id", encodeURIComponent(idOrSlug));
  }

  if (moduleKey && idOrSlug) {
    return `/app/${moduleKey}?open=${encodeURIComponent(idOrSlug)}`;
  }

  return "/app/home";
}

export { LINK_PATTERNS, guessModuleFromItem };
