// src/components/search/SearchPopover.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";

import { searchAll } from "../../api/search";
import api from "../../api/axiosInstance";
import styles from "./SearchPopover.module.scss";

/* ------------------------------- helpers ------------------------------- */
const isAbs = (s) => typeof s === "string" && /^(https?:)?\/\//i.test(s);
const pick = (obj, ...keys) => keys.map((k) => obj?.[k]).find((v) => v != null);

/** Module inference — used both locally and as a hint to detailRoutes */
export const inferModule = (it = {}) => {
  const bag = [
    it.__module,
    it.module,
    it.group,
    it.domain,
    it.collection,
    it.section,
    it.type,
    it.category,
    it.kind,
    it.categoryName,
    it.resourceType,
    it.model,
    it.modelName,
    it.__typename,
    it.categoryPath,
    Array.isArray(it.breadcrumbs) ? it.breadcrumbs.join(" / ") : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/(^|\b|\/)(rent|rental|room|flat|apartment|house)(\b|\/)/.test(bag))
    return "rentals";
  if (/(home[-_\s]?swap|\bswap\b)/.test(bag)) return "homeswap";
  if (
    /(service|tutor|tutoring|repair|clean|tech|support|education|plumbing|electrician)/.test(
      bag
    )
  )
    return "services";
  if (/(event|meetup|conference|festival)/.test(bag)) return "events";
  if (/(travel|trip|tour|flight|itinerary)/.test(bag)) return "travel";
  if (
    /(^|[^a-z])(ad|ads|classified|classifieds|marketplace)([^a-z]|$)/.test(bag)
  )
    return "ads";

  const p = (it.href || it.url || it.path || it.link || "").toLowerCase();
  if (p.includes("/rentals")) return "rentals";
  if (p.includes("/home-swap") || p.includes("/homeswap")) return "homeswap";
  if (p.includes("/services")) return "services";
  if (p.includes("/events")) return "events";
  if (p.includes("/travel")) return "travel";
  if (p.includes("/ads") || p.includes("/classified")) return "ads";

  if (
    ["bedrooms", "bathrooms", "rent", "deposit", "address", "city"].some(
      (k) => k in it
    )
  )
    return "rentals";
  if (["availableDates", "swapType"].some((k) => k in it)) return "homeswap";
  if (
    ["hourlyRate", "serviceCategory", "skills", "experience"].some(
      (k) => k in it
    )
  )
    return "services";
  if (
    ["startsAt", "startDate", "eventDate", "endDate", "venue"].some(
      (k) => k in it
    )
  )
    return "events";
  if (["destination", "departure", "itinerary"].some((k) => k in it))
    return "travel";
  if (["price", "condition"].some((k) => k in it)) return "ads";

  const titleish = (it.title || it.name || "").toLowerCase();
  if (/\brent|room|flat|apartment|house\b/.test(titleish)) return "rentals";
  if (/\bswap|home\s*swap\b/.test(titleish)) return "homeswap";
  if (/\btutor|tutoring|repair|clean|support\b/.test(titleish)) return "services";

  return null;
};

/* ------------------- id + route helpers ------------------- */
const MODULE_ALIAS = {
  rental: "rentals",
  "home-swap": "homeswap",
  home_swap: "homeswap",
  swap: "homeswap",
};

const extractId = (it) =>
  pick(
    it,
    "id",
    "_id",
    "listingId",
    "publicId",
    "uuid",
    "rentalId",
    "serviceId",
    "adId",
    "eventId",
    "travelId",
    "swapId",
    "homeSwapId",
    "home_swap_id",
    "slug"
  );

/** Pull an id out of any href like “…/rentals/44/with-photos” => "44" */
const parseIdFromHref = (href, mod) => {
  if (!href) return null;
  const m = String(href).match(new RegExp(`/${mod}/([^/?#]+)`));
  return m?.[1] ? decodeURIComponent(m[1]) : null;
};

/**
 * Canonicalize module name and force /app/<mod>/<id>.
 *
 * IMPORTANT: this NEVER falls back to "/app" anymore.
 * If we can't build a proper detail URL, we return null
 * and let the caller decide (usually /search?q=...).
 */
const ensureAppDetailHref = (raw, href, modHint) => {
  const m0 =
    MODULE_ALIAS[(modHint || inferModule(raw) || "").toLowerCase()] ||
    (modHint || inferModule(raw));
  if (!m0) return href || null;
  const mod = m0;
  if (isAbs(href)) return href;

  const id = extractId(raw) ?? parseIdFromHref(href, mod);
  if (!id) return href || null;

  return `/app/${mod}/${encodeURIComponent(String(id))}`;
};

/**
 * normalizeHref:
 * 1) Try to build a canonical /app/<mod>/<id>
 * 2) Fallback to any explicit href/url/path/link on the item
 * 3) If nothing is available, return null (no more "/app" default)
 */
export const normalizeHref = (href, raw, modHint) => {
  const primary = ensureAppDetailHref(raw, href, modHint);
  if (primary) return primary;

  const fallback =
    raw?.href || raw?.url || raw?.path || raw?.link || raw?.to || null;

  return fallback || null;
};

/* --------------------------- result normalization --------------------------- */
const pluckResultPayload = (res) => {
  const r = res?.data ?? res;
  if (Array.isArray(r)) return r;
  for (const k of ["items", "results", "data", "content", "listings", "records"]) {
    if (Array.isArray(r?.[k])) return r[k];
  }
  if (r && typeof r === "object") {
    const arrays = Object.values(r).filter(Array.isArray);
    if (arrays.length) return arrays.flat();
  }
  const esHits = r?.hits?.hits;
  if (Array.isArray(esHits))
    return esHits.map((h) => h?._source || h?._doc || h?.fields || h);
  const edges = r?.data?.search?.edges || r?.edges;
  if (Array.isArray(edges)) return edges.map((e) => e?.node || e).filter(Boolean);
  return [];
};

const normalizeResults = (raw) => {
  const arr = pluckResultPayload(raw);
  return arr.map((it, i) => {
    const id = extractId(it) ?? `x${i}`;
    const title =
      (pick(it, "title", "name", "headline", "label") || "Untitled") + "";
    const type =
      (pick(it, "type", "category", "kind", "collection", "domain", "categoryName") ||
        "item") + "";
    const __module = inferModule(it);
    return { id, title, type, __module, _raw: it };
  });
};

/* ------------------------------ existence check ------------------------------ */

/**
 * Map module -> API detail endpoint builder.
 * Adjust these if your backend paths are slightly different.
 */
const VERIFY_ENDPOINTS = {
  rentals:  (id) => `/api/rentals/${id}`,
  // backend uses /api/home-swap for the API controller
  homeswap: (id) => `/api/home-swap/${id}`,
  services: (id) => `/api/services/${id}`,
  events:   (id) => `/api/events/${id}`,
  travel:   (id) => `/api/travel/${id}`,
  ads:      (id) => `/api/ads/${id}`,
};


/**
 * For each result, hit its detail API once.
 * If the backend says 404/410 => filter it out.
 * If network/server error => keep it (don’t hide everything).
 */
const filterExistingItems = async (items) => {
  if (!items.length) return items;

  const checks = await Promise.allSettled(
    items.map(async (it) => {
      const raw = it._raw || it;
      const mod = it.__module || inferModule(raw);
      const id = extractId(raw);

      const buildEndpoint = VERIFY_ENDPOINTS[mod];
      if (!buildEndpoint || !id) {
        // if we can’t verify, keep it (don’t be too aggressive)
        return { it, ok: true };
      }

      try {
        const res = await api.head(buildEndpoint(id));
        const ok = res.status >= 200 && res.status < 300;
        return { it, ok };
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404 || status === 410) {
          // definitely deleted or gone
          return { it, ok: false };
        }
        // network / server errors -> keep
        return { it, ok: true };
      }
    })
  );

  return checks
    .filter((c) => c.status === "fulfilled" && c.value.ok)
    .map((c) => c.value.it);
};

/* ---------------------- in-memory search result cache ---------------------- */

const SEARCH_CACHE = new Map(); // key -> { items, t }
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes; adjust if you like

const makeCacheKey = (term) => term.trim().toLowerCase();

const readCache = (term) => {
  const key = makeCacheKey(term || "");
  if (!key) return null;
  const entry = SEARCH_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.t > CACHE_TTL_MS) {
    SEARCH_CACHE.delete(key);
    return null;
  }
  return entry.items;
};

const writeCache = (term, items) => {
  const key = makeCacheKey(term || "");
  if (!key) return;
  SEARCH_CACHE.set(key, { items: Array.isArray(items) ? items : [], t: Date.now() });
};

/* ------------------------------ search plumbing ------------------------------ */

/**
 * Client-side safety net.
 * If backend search fails or returns nothing, we still try to give
 * *something* by quickly scanning core modules.
 */
const clientSideFallbackSearch = async (term) => {
  const endpoints = [
    ["rentals", "/rentals"],
    ["homeswap", "/homeswap"],
    ["services", "/services"],
    ["events", "/events"],
    ["travel", "/travel"],
    ["ads", "/ads"],
    ["rentals", "/api/rentals"],
    ["homeswap", "/api/homeswap"],
    ["services", "/api/services"],
    ["events", "/api/events"],
    ["travel", "/api/travel"],
    ["ads", "/api/ads"],
  ];
  const q = term.toLowerCase();

  const settle = await Promise.allSettled(
    endpoints.map(([mod, p]) =>
      api.get(p, { params: { limit: 30 } }).then((res) => ({ mod, res }))
    )
  );

  const merged = settle
    .filter((s) => s.status === "fulfilled")
    .flatMap((s) => {
      const { mod, res } = s.value;
      const arr = pluckResultPayload(res);
      return arr.map((it) => ({ ...it, __module: mod }));
    });

  const filtered = merged.filter((it) => {
    const hay = [
      pick(it, "title", "name", "headline", "label"),
      pick(it, "description", "summary", "about", "details", "body"),
      pick(it, "city", "town", "location", "category"),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  return normalizeResults(filtered);
};

// Safe, single-call search that matches the backend, with robust fallback
export const tolerantSearch = async (term) => {
  const rawTerm = term || "";
  const trimmed = rawTerm.trim();
  if (!trimmed) return [];

  // 1) Try cache first to avoid hammering backend
  const cached = readCache(trimmed);
  if (cached) return cached;

  let finalItems = [];

  try {
    const res = await searchAll({
      q: trimmed,
      limit: 30,
      types: ["rentals", "homeswap", "services", "events", "travel", "ads"],
    });
    const normalized = normalizeResults(res);
    const existing = await filterExistingItems(normalized);
    if (existing.length) {
      finalItems = existing;
    } else {
      // backend returned nothing useful — try client-side best-effort
      const fallback = await clientSideFallbackSearch(trimmed);
      finalItems = await filterExistingItems(fallback);
    }
  } catch {
    // backend failed entirely — best-effort fallback
    try {
      const fallback = await clientSideFallbackSearch(trimmed);
      finalItems = await filterExistingItems(fallback);
    } catch {
      finalItems = [];
    }
  }

  // 2) Store in cache (even empty → prevents repeated hammering for same bad query)
  writeCache(trimmed, finalItems);
  return finalItems;
};

/* -------------------------------- component -------------------------------- */
/**
 * Header search: just a magnifier icon that expands inline into a text field.
 * No popup/overlay. Pressing Enter runs the search on the /search results page.
 * Transparent field (no white box) so it stays readable over the hero video.
 */
export default function SearchPopover() {
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const openBox = useCallback(() => {
    setOpen(true);
    // focus on the next frame, once the input has expanded
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const closeBox = useCallback(() => setOpen(false), []);

  const submit = useCallback(() => {
    const term = q.trim();
    if (!term) {
      inputRef.current?.focus();
      return;
    }
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setOpen(false);
    setQ("");
  }, [q, navigate]);

  // Collapse on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  // Global shortcuts: "/" and Ctrl/Cmd+K open + focus the field.
  useEffect(() => {
    const handler = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const typing =
        tag === "input" || tag === "textarea" || e.target?.isContentEditable;
      if (typing) return;

      const cmdK =
        (e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey) &&
        !e.altKey && !e.shiftKey;
      const slash =
        e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey;

      if (cmdK || slash) {
        e.preventDefault();
        openBox();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openBox]);

  return (
    <div
      className={styles.wrap}
      ref={wrapRef}
      data-open={open ? "true" : "false"}
    >
      <button
        type="button"
        className={styles.iconBtn}
        aria-label="Search"
        title="Search (press / or Ctrl+K)"
        onClick={() => (open ? submit() : openBox())}
      >
        <SearchIcon size={20} strokeWidth={2} aria-hidden="true" />
      </button>

      <input
        ref={inputRef}
        type="search"
        className={styles.inlineInput}
        placeholder="Search rentals, services, events…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            closeBox();
          }
        }}
        aria-label="Search"
        tabIndex={open ? 0 : -1}
      />
    </div>
  );
}
