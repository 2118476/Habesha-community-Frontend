import api from "./axiosInstance";
import { makeApiUrl } from "./httpUrl";
import { getRentalCoverUrl } from "./rentals";

/**
 * Frontend feed aggregator with backend→frontend fallback.
 * Now aligned to your per-feature endpoints (incl. TRAVEL).
 */

const FEED_BACKEND_ON =
  (typeof process !== "undefined"
    ? process?.env?.REACT_APP_FEED_BACKEND === "true"
    : false);


// ---------- helpers ----------
const toArray = (x) => (!x ? [] : Array.isArray(x) ? x : [x]);

function firstTruthy(...vals) {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return undefined;
}
const looksLikeUrl  = (s) => typeof s === "string" && /^(https?:)?\/\//i.test(s);
const looksLikePath = (s) =>
  typeof s === "string" && (s.startsWith("/") || s.startsWith("uploads/"));

function get(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) cur = cur[p];
    else return undefined;
  }
  return cur;
}
const anyGet = (obj, paths) => firstTruthy(...paths.map((p) => get(obj, p)));

function photoIdToEndpoint(type, fid, id) {
  const t = (type || "").toLowerCase();
  if (!fid && !id) return null;

  switch (t) {
    case "rental":
    case "rentals":
    case "rental_listing":
    case "rental-listing":
    case "listing_rental":
    case "listing-rental":
      return fid
        ? `/rentals/photos/${encodeURIComponent(fid)}`
        : id
        ? `/rentals/${encodeURIComponent(id)}/photos/first`
        : null;

    case "home_swap":
    case "home-swap":
    case "homeswap":
      return id ? `/homeswap/${encodeURIComponent(id)}/photos/first` : null;

    case "service":
    case "services":
      return id ? `/services/${encodeURIComponent(id)}/photos/first` : null;

    case "event":
    case "events":
      return id ? `/events/${encodeURIComponent(id)}/photos/first` : null;

    // ads / travel usually don’t have a photo-by-id endpoint
    case "ad":
    case "ads":
    case "classified":
    case "travel":
    case "trip":
    case "trips":
    case "tour":
    case "tours":
    case "journey":
      return null;

    default:
      return null;
  }
}

function pickImageUrl(it, type, id) {
  const t = (type || "").toLowerCase();

  // Rentals: use the same helper as Rentals page
  if (t === "rental" || t === "rentals" || t === "rental_listing" || t === "rental-listing") {
    const viaHelper = getRentalCoverUrl(it);
    if (looksLikeUrl(viaHelper) || looksLikePath(viaHelper)) return viaHelper;
  }

  const urlish = firstTruthy(
    it.imageUrl, it.pictureUrl, it.image,
    it.thumbnailUrl, it.coverUrl, it.mainPhotoUrl,
    it.photoUrl, it.firstPhotoUrl, it.firstPhotoPath,
    it.primaryPhotoUrl, it.primaryImageUrl,
    it.url, it.thumb, it.thumbnail
  );
  if (looksLikeUrl(urlish) || looksLikePath(urlish)) return urlish;

  const arrays = [it.photos, it.images, it.pictures, it.media, it.gallery, it.imageUrls].filter(Boolean);
  for (const arr of arrays) {
    if (!Array.isArray(arr) || !arr.length) continue;
    const first = arr[0];
    if (typeof first === "string") {
      if (looksLikeUrl(first) || looksLikePath(first)) return first;
    } else if (first && typeof first === "object") {
      const u = first.url || first.src || first.thumbnailUrl || first.path;
      if (looksLikeUrl(u) || looksLikePath(u)) return u;
      const fid = first.id || first.photoId || first.fileId || first._id;
      const mapped = photoIdToEndpoint(t, fid, id);
      if (mapped) return mapped;
    }
  }

  const ph = firstTruthy(it.firstPhoto, it.coverPhoto, it.primaryPhoto, it.photo, it.mainPhoto);
  if (ph && typeof ph === "object") {
    const u = ph.url || ph.src || ph.path || ph.thumbnailUrl;
    if (looksLikeUrl(u) || looksLikePath(u)) return u;
    const fid = ph.id || ph.photoId || ph.fileId || ph._id;
    const mapped = photoIdToEndpoint(t, fid, id);
    if (mapped) return mapped;
  }

  const pathish = firstTruthy(it.imagePath, it.photoPath, it.firstPhotoPath);
  if (typeof pathish === "string") {
    if (looksLikeUrl(pathish)) return pathish;
    if (pathish.startsWith("/")) return pathish;
    if (pathish.startsWith("uploads/")) return `/${pathish}`;
  }

  const fileId = firstTruthy(it.coverImageId, it.imageId, it.photoId, it.fileId, it.thumbnailId);
  if (fileId) {
    const mapped = photoIdToEndpoint(t, fileId, id);
    if (mapped) return mapped;
  }

  if (id) {
    const mapped = photoIdToEndpoint(t, null, id);
    if (mapped) return mapped;
  }
  return null;
}

function buildDetailPath(type, id, slug) {
  const key = encodeURIComponent(slug || id || "");
  if (!key) return "#";
  const t = (type || "").toLowerCase();
  switch (t) {
    case "home_swap":
    case "home-swap":
    case "homeswap":
      return `/app/homeswap/${key}`;
    case "rental":
    case "rentals":
      return `/app/rentals/${key}`;
    case "service":
    case "services":
      return `/app/services/${key}`;
    case "event":
    case "events":
      return `/app/events/${key}`;
    case "ad":
    case "ads":
    case "classified":
      return `/app/ads/${key}`;
    case "travel":
    case "trip":
    case "trips":
    case "tour":
    case "tours":
    case "journey":
      return `/app/travel/${key}`;
    default:
      return "#";
  }
}

function buildTravelTitle(it) {
  const origin = firstTruthy(
    // ✅ your real field names first
    it.originCity,
    // fallbacks
    it.from, it.origin, it.fromCity, it.from_city, it.departureCity, it.departure_city,
    it.departure, it.leavingFrom, it.source, it.start, it.startCity, it.fromLocation, it.from_location,
    anyGet(it, ["from.city","from.name","fromCity.name","route.from.city","route.origin.city","route.originCity"])
  );
  const destination = firstTruthy(
    // ✅ your real field names first
    it.destinationCity,
    // fallbacks
    it.to, it.destination, it.toCity, it.to_city, it.arrivalCity, it.arrival_city,
    it.arrival, it.goingTo, it.end, it.endCity, it.toLocation, it.to_location,
    anyGet(it, ["to.city","to.name","toCity.name","route.to.city","route.destination.city","route.destinationCity"])
  );

  if (origin || destination) {
    return {
      title: `${origin || "—"} → ${destination || ""}`.trim(),
      location: `${origin || ""}${origin && destination ? " → " : ""}${destination || ""}`.trim(),
      origin, destination,
    };
  }
  return { title: null, location: null, origin: null, destination: null };
}

function normalizeItem(raw) {
  const rawType = (raw.type || raw.category || raw.kind || "").toString();
  const t0 = rawType.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  let type = t0;
  if (["rental","rentals","rental_listing","listing_rental","rentallist","rental_list","rentallist"].includes(t0)) type = "rental";
  else if (["home_swap","home-swap","homeswap","house_swap","home_exchange","homeexchange"].includes(t0)) type = "home_swap";
  else if (["service","services","svc"].includes(t0)) type = "service";
  else if (["event","events"].includes(t0)) type = "event";
  else if (["ad","ads","classified","classified_ad","classified-ad","classifieds"].includes(t0)) type = "ad";
  else if (["travel","trip","trips","tour","tours","journey","rideshare","carpool"].includes(t0)) type = "travel";

  const id = firstTruthy(
    raw.id, raw.itemId, raw.rentalId, raw.serviceId, raw.eventId, raw.homeSwapId, raw.adId, raw.travelId, raw.tripId,
    raw.uuid, raw._id, raw.listingId, raw.publicId,
    raw.rentalID, raw.rId, raw.rid, raw.classifiedId, raw.classifiedID
  ) ?? null;

  const travelSynth = type === "travel" ? buildTravelTitle(raw) : { title: null, location: null };

  const title = firstTruthy(
    raw.title, raw.name, raw.headline, raw.postTitle,
    travelSynth.title, "(Untitled)"
  );

  const location = firstTruthy(
    raw.location, raw.city, raw.area, raw.country,
    travelSynth.location
  );

  const price = firstTruthy(
    raw.price, raw.monthlyPrice, raw.monthly, raw.rentPerMonth, raw.cost, raw.amount,
    raw.fare, raw.ticketPrice, raw.seatPrice
  );

  const createdAt = firstTruthy(raw.createdAt, raw.created_at, raw.postedAt, raw.publishedAt);
  const slug      = firstTruthy(raw.slug, raw.handle);

  let imageUrl = pickImageUrl(raw, type, id);
  if (typeof imageUrl === "string" && imageUrl.startsWith("uploads/")) {
    imageUrl = `/${imageUrl}`;
  }

  const imageUrlAbsolute  = imageUrl ? makeApiUrl(imageUrl) : null;
  const detailPath        = buildDetailPath(type, id, slug);

  return {
    ...raw,
    type, id, title, location, price, createdAt, slug,
    imageUrl,
    imageUrlAbsolute,
    detailPath,
    origin: travelSynth.origin ?? raw.origin ?? raw.from ?? null,
    destination: travelSynth.destination ?? raw.destination ?? raw.to ?? null,
  };
}

const safeDate = (d) => {
  const t = d ? Date.parse(d) : NaN;
  return Number.isFinite(t) ? t : 0;
};

const encodeCursor = (obj) => { try { return btoa(JSON.stringify(obj)); } catch { return null; } };
const decodeCursor = (s)    => { if (!s) return null; try { return JSON.parse(atob(s)); } catch { return null; } };

function extractListPayload(data) {
  // supports many shapes: array, {content}, {items}, {list}, {data:{items}}, {page:{content}}
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.page?.content)) return data.page.content;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
}

// ---------- FRONTEND MODE (per-feature endpoints like the list pages use) ----------
/**
 * Each type lists the endpoints your *list* pages hit.
 * We’ll try them in order until one works, then normalize.
 */
const TYPE_ENDPOINTS = {
  home_swap: { urls: ["/homeswap", "/api/homeswap"] },
  rental:    { urls: ["/api/rentals", "/rentals"] },
  service:   { urls: ["/api/services", "/services"] },
  event:     { urls: ["/api/events", "/events"] },
  ads:       { urls: ["/ads", "/api/ads"] },
  travel:    { urls: ["/api/travel", "/travel", "/api/trips", "/trips", "/travels", "/api/travels"] },
};

function normalizePerType(list, typeKey) {
  return toArray(list).map((it) => normalizeItem({ type: it.type ?? typeKey, ...it }));
}

function buildParamVariants(page, size, hasPhotos) {
  const p = {};
  // common variants
  p.variant1 = { page, size };
  p.variant2 = { pageNumber: page, pageSize: size };
  // hasPhotos only for types that support it (avoid hiding Services/Travel/Ads text posts)
  if (hasPhotos === true) {
    p.variant1.hasPhotos = "true";
    p.variant2.hasPhotos = "true";
  }
  return [p.variant1, p.variant2];
}

async function tryGet(url, paramVariants) {
  let lastErr;
  for (const params of paramVariants) {
    try {
      const { data } = await api.get(url, { params });
      return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("All param variants failed");
}

async function getFirstAvailable(urls, paramVariants) {
  let lastErr;
  for (const url of urls) {
    try {
      const data = await tryGet(url, paramVariants);
      return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("All endpoints failed");
}

async function frontendFetchFeed(params = {}) {
  const { types, limit = 20, sort = "newest", cursor, hasPhotos } = params;

  const activeTypes = toArray(types).length ? toArray(types) : Object.keys(TYPE_ENDPOINTS);

  const decoded = decodeCursor(cursor) || {
    pageByType: Object.fromEntries(activeTypes.map((t) => [t, 0])),
    pageSize: Math.max(6, Math.ceil(limit / Math.max(1, activeTypes.length))),
  };

  for (const k of Object.keys(decoded.pageByType)) if (!activeTypes.includes(k)) delete decoded.pageByType[k];
  for (const t of activeTypes) if (!(t in decoded.pageByType)) decoded.pageByType[t] = 0;

  const responses = await Promise.all(
    activeTypes.map(async (t) => {
      const urls = TYPE_ENDPOINTS[t]?.urls || [];
      const page = decoded.pageByType[t];
      const supportsPhotosFilter = (t === "rental" || t === "home_swap"); // NOT for services/ads/travel
      const paramVariants = buildParamVariants(page, decoded.pageSize, supportsPhotosFilter && hasPhotos === true);

      try {
        const data = await getFirstAvailable(urls, paramVariants);
        const list = extractListPayload(data);
        return { type: t, items: normalizePerType(list, t) };
      } catch (e) {
        console.error(`Frontend feed: failed ${t}`, e);
        return { type: t, items: [] };
      }
    })
  );

  const merged = responses.flatMap((r) => r.items);
  if (sort === "newest") merged.sort((a, b) => safeDate(b.createdAt) - safeDate(a.createdAt));

  const pageItems = merged.slice(0, limit);
  const anyHitFull = responses.some((r) => r.items.length >= decoded.pageSize);

  let nextCursor = null;
  if (anyHitFull) {
    const next = { pageByType: { ...decoded.pageByType }, pageSize: decoded.pageSize };
    for (const t of activeTypes) next.pageByType[t] = (next.pageByType[t] ?? 0) + 1;
    nextCursor = encodeCursor(next);
  }

  return { items: pageItems, nextCursor };
}

// ---------- BACKEND MODE + hybrid supplement ----------
function buildQS(params = {}) {
  const { types, sort = "newest", limit = 20, cursor, hasPhotos, ...rest } = params;
  const qs = new URLSearchParams();
  const t = toArray(types);
  if (t.length) qs.set("types", t.join(","));
  if (sort) qs.set("sort", sort);
  if (Number.isFinite(limit)) qs.set("limit", String(limit));
  if (cursor) qs.set("cursor", String(cursor));
  if (hasPhotos === true) qs.set("hasPhotos", "true");
  Object.entries(rest).forEach(([k, v]) => { if (v != null && v !== "") qs.set(k, String(v)); });
  return qs.toString();
}

async function backendFetchFeed(params = {}) {
  const { signal, ...rest } = params;
  const qs = buildQS(rest);
  const url = qs ? `/feed?${qs}` : `/feed`;
  const { data } = await api.get(url, { signal });

  const items = extractListPayload(data);
  const nextCursor = (data && (data.nextCursor ?? data.cursor ?? null)) || null;

  const normalized = items.map(normalizeItem);
  return { items: normalized, nextCursor };
}

function itemsHaveType(items, t) {
  const key = t.toLowerCase();
  return items.some((it) => (it.type || "").toLowerCase().includes(key));
}

// ---------- PUBLIC ----------
export async function fetchFeed(params = {}) {
  const requested = toArray(params.types);
  const requestedTypes = requested.length ? requested : ["home_swap","rental","service","ads","travel"];

  if (FEED_BACKEND_ON) {
    try {
      const controller = new AbortController();
      const tm = setTimeout(() => controller.abort(), 4000);
      const res = await backendFetchFeed({ ...params, signal: controller.signal });
      clearTimeout(tm);

      // If backend feed didn't include some requested types (e.g., TRAVEL), supplement from per-type endpoints.
      const missing = requestedTypes.filter((t) => !itemsHaveType(res.items, t));
      if (missing.length) {
        const front = await frontendFetchFeed({ ...params, types: missing });
        const merged = [...res.items, ...front.items];
        merged.sort((a, b) => safeDate(b.createdAt) - safeDate(a.createdAt));
        return { items: merged, nextCursor: res.nextCursor || front.nextCursor || null };
      }
      return res;
    } catch (e) {
      const status = e?.response?.status ?? 0;
      if ((status && status < 500 && status !== 404) && e.name !== "AbortError") throw e;
      console.warn("Feed backend failed/slow — using frontend aggregator");
    }
  }
  return await frontendFetchFeed(params);
}
