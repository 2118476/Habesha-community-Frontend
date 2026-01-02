// src/pages/Search/index.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search as SearchIcon, ArrowRight } from "lucide-react";

import api from "../../api/axiosInstance";
import { buildHrefForItem } from "../../utils/detailRoutes";
import {
  tolerantSearch,
  inferModule,
} from "../../components/search/SearchPopover";
import { getRentalCoverUrl } from "../../api/rentals";

/* --- small helpers --- */
const firstString = (...vals) =>
  vals.find(
    (v) => typeof v === "string" && v && String(v).trim().length > 0
  ) || null;

const toAbsoluteUrl = (src) => {
  if (!src) return null;
  if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:")) return src;
  const base = (api?.defaults?.baseURL || "").replace(/\/$/, "");
  const path = src.startsWith("/") ? src : `/${src}`;
  return `${base}${path}`;
};

/* Homeswap cover helper (same as HomeSwapHub.jsx) */
const coverFromHomeSwap = (item = {}) =>
  item?.coverUrl ||
  item?.cover ||
  item?.thumbnailUrl ||
  item?.image ||
  item?.images?.[0] ||
  item?.photos?.[0]?.url ||
  item?.photos?.[0] ||
  null;

/* Ads image helper (aligned with Ads/Details firstImage logic) */
const pickAdImage = (it = {}) => {
  const arrays = [
    it?.photos,
    it?.images,
    it?.pictures,
    it?.media,
    it?.gallery,
  ].filter(Boolean);

  for (const arr of arrays) {
    if (!Array.isArray(arr) || !arr.length) continue;
    const f = arr[0];
    const u =
      typeof f === "string"
        ? f
        : f?.url || f?.src || f?.path || f?.secureUrl;
    if (u) return toAbsoluteUrl(u);
  }

  const fallback =
    it?.imageUrl || it?.firstPhotoUrl || it?.coverUrl || null;
  return toAbsoluteUrl(fallback);
};

const resolveServiceId = (raw = {}) =>
  raw.id ??
  raw.serviceId ??
  raw.listingId ??
  raw.publicId ??
  raw.uuid ??
  raw._id ??
  null;

/**
 * Pick the best image URL for a search result, based on module.
 * Falls back to generic thumbnail-like fields when module-specific
 * logic cannot find anything.
 */
const pickImageForItem = (raw = {}, moduleKey) => {
  const mod = (moduleKey || "").toLowerCase();

  if (mod === "rentals") {
    const url = getRentalCoverUrl(raw);
    if (url) return toAbsoluteUrl(url);
    
    // Fallback for rentals: try photos array
    if (Array.isArray(raw.photos) && raw.photos.length > 0) {
      const photo = raw.photos[0];
      const photoUrl = typeof photo === 'string' ? photo : (photo?.url || photo?.photoUrl);
      if (photoUrl) return toAbsoluteUrl(photoUrl);
    }
  }

  if (mod === "homeswap") {
    const c = coverFromHomeSwap(raw);
    if (c) return toAbsoluteUrl(c);
    
    // Fallback for homeswap: try photos array
    if (Array.isArray(raw.photos) && raw.photos.length > 0) {
      const photo = raw.photos[0];
      const photoUrl = typeof photo === 'string' ? photo : (photo?.url || photo?.photoUrl);
      if (photoUrl) return toAbsoluteUrl(photoUrl);
    }
  }

  if (mod === "services") {
    const id = resolveServiceId(raw);
    if (id) {
      const base = (api?.defaults?.baseURL || "").replace(/\/$/, "");
      return `${base}/api/services/${encodeURIComponent(id)}/image`;
    }
  }

  if (mod === "ads") {
    const img = pickAdImage(raw);
    if (img) return img;
  }

  // Fallback: try common thumbnail-like fields + arrays
  const fromArray = (arr) => {
    if (!Array.isArray(arr) || !arr.length) return null;
    const first = arr[0];
    if (!first) return null;
    if (typeof first === "string") return first;
    if (typeof first === "object") {
      return (
        first.url ||
        first.photoUrl ||
        first.imageUrl ||
        first.path ||
        first.href ||
        first.secureUrl ||
        null
      );
    }
    return null;
  };

  const urlLike = firstString(
    raw.coverImageUrl,
    raw.coverUrl,
    raw.imageUrl,
    raw.thumbnailUrl,
    raw.photoUrl,
    raw.mainImageUrl,
    raw.heroImageUrl,
    raw.firstPhotoUrl,
    raw.media?.cover?.url,
    raw.media?.coverUrl,
    Array.isArray(raw.media) ? fromArray(raw.media) : null,
    fromArray(raw.photos),
    fromArray(raw.images),
    fromArray(raw.imageUrls),
    fromArray(raw.photoUrls),
    fromArray(raw.pictures),
    fromArray(raw.gallery)
  );

  return toAbsoluteUrl(urlLike);
};

const useQueryParams = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

export default function SearchPage() {
  const { t } = useTranslation();
  const params = useQueryParams();
  const navigate = useNavigate();

  const initialTerm = params.get("q") || "";
  const [input, setInput] = useState(initialTerm);
  const [term, setTerm] = useState(initialTerm);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // keep state in sync when URL ?q changes
  useEffect(() => {
    const q = params.get("q") || "";
    setInput(q);
    setTerm(q);
  }, [params]);

  // run search when the "active" term changes
  useEffect(() => {
    const q = term.trim();
    if (!q) {
      setItems([]);
      setErr("");
      setBusy(false);
      return;
    }

    let cancelled = false;
    setBusy(true);
    setErr("");

    (async () => {
      try {
        const rawResults = await tolerantSearch(q);
        if (cancelled) return;

        // normalize + dedupe
        const seen = new Set();
        const deduped = rawResults
          .map((it) => {
            const raw = it._raw || it;
            const mod = it.__module || inferModule(raw) || it.type || "item";
            return { ...it, __module: mod, _raw: raw };
          })
          .filter((it) => {
            const key = `${it.__module || "item"}:${it.id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

        setItems(deduped);
      } catch {
        if (!cancelled) {
          setErr(t('search.searchFailed'));
          setItems([]);
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [term]);

  const onSubmit = (e) => {
    e.preventDefault();
    const q = input.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search", {
      replace: false,
    });
    setTerm(q);
  };

  const total = items.length;

  return (
    <div style={{ padding: "32px 24px 40px" }}>
      <h1
        style={{
          fontSize: 28,
          margin: "0 0 16px",
          fontWeight: 800,
          letterSpacing: 0.4,
        }}
      >
        Search
      </h1>

      {/* search bar on the page */}
      <form
        onSubmit={onSubmit}
        style={{
          maxWidth: 640,
          marginBottom: 24,
          display: "flex",
          gap: 8,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
          }}
        >
          <SearchIcon size={18} strokeWidth={2} style={{ marginRight: 8 }} />
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('search.searchPlaceholder')}
            style={{
              flex: 1,
              height: 42,
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 14,
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            minWidth: 88,
            padding: "0 18px",
            borderRadius: 999,
            border: "none",
            background: "#111827",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      {term.trim() && (
        <div
          style={{
            marginBottom: 16,
            fontSize: 14,
            color: "#6b7280",
            display: "flex",
            justifyContent: "space-between",
            maxWidth: 900,
          }}
        >
          <span>
            Showing{" "}
            <strong style={{ color: "#111827" }}>{total}</strong> result
            {total === 1 ? "" : "s"} for{" "}
            <strong style={{ color: "#111827" }}>"{term.trim()}"</strong>
          </span>
        </div>
      )}

      {busy && (
        <div style={{ paddingTop: 24, fontSize: 14, color: "#6b7280" }}>
          Searching…
        </div>
      )}

      {!busy && err && (
        <div style={{ paddingTop: 24, fontSize: 14, color: "#b91c1c" }}>
          {err}
        </div>
      )}

      {!busy && !err && !total && term.trim() && (
        <div style={{ paddingTop: 24, fontSize: 14, color: "#6b7280" }}>
          {t('search.noResultsFound')}. {t('search.tryDifferentKeyword')}.
        </div>
      )}

      {!busy && total > 0 && (
        <div
          style={{
            marginTop: 8,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
            maxWidth: 1200,
          }}
        >
          {items.map((it, i) => {
            const raw = it._raw || it;
            const modHint = it.__module || inferModule(raw);
            
            // Debug logging
            console.log("Search result item:", {
              id: raw.id,
              title: it.title,
              module: modHint,
              raw: raw
            });
            
            const href = buildHrefForItem({ ...raw, __module: modHint });
            console.log("Built href:", href);

            const img = pickImageForItem(raw, modHint);
            const badge = modHint || it.type || "item";

            // Extract additional details based on module type
            const getDetails = () => {
              const details = {};
              
              if (modHint === "rentals") {
                details.price = raw.rent || raw.price || raw.monthlyRent;
                details.location = raw.city || raw.location || raw.address;
                details.bedrooms = raw.bedrooms;
                details.bathrooms = raw.bathrooms;
                details.description = raw.description || raw.details;
              } else if (modHint === "homeswap") {
                details.location = raw.city || raw.location || raw.address;
                details.bedrooms = raw.bedrooms;
                details.swapType = raw.swapType;
                details.description = raw.description || raw.details;
              } else if (modHint === "services") {
                details.price = raw.hourlyRate || raw.price;
                details.location = raw.city || raw.location;
                details.category = raw.serviceCategory || raw.category;
                details.description = raw.description || raw.details;
              } else if (modHint === "events") {
                details.date = raw.startDate || raw.eventDate || raw.date;
                details.location = raw.venue || raw.city || raw.location;
                details.price = raw.price || raw.ticketPrice;
                details.description = raw.description || raw.details;
              } else if (modHint === "travel") {
                details.destination = raw.destination;
                details.departure = raw.departure;
                details.date = raw.departureDate || raw.date;
                details.description = raw.description || raw.details;
              } else if (modHint === "ads") {
                details.price = raw.price;
                details.location = raw.city || raw.location;
                details.condition = raw.condition;
                details.description = raw.description || raw.details;
              }
              
              return details;
            };

            const details = getDetails();

            const inner = (
              <>
                {/* Image */}
                <div
                  style={{
                    height: 180,
                    borderRadius: 12,
                    overflow: "hidden",
                    marginBottom: 12,
                    background: img ? "#f3f4f6" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    position: "relative",
                  }}
                >
                  {img ? (
                    <img
                      src={img}
                      alt={it.title || ""}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: 48,
                      fontWeight: 700,
                      opacity: 0.3,
                    }}>
                      {(it.title || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {/* Badge overlay */}
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      padding: "4px 12px",
                      borderRadius: 999,
                      background: "rgba(0,0,0,0.7)",
                      backdropFilter: "blur(8px)",
                      color: "white",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {badge}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  {/* Title */}
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      marginBottom: 8,
                      color: "#111827",
                      lineHeight: 1.3,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {it.title || "Untitled"}
                  </h3>

                  {/* Details */}
                  <div style={{ marginBottom: 8, fontSize: 13, color: "#6b7280" }}>
                    {details.location && (
                      <div style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <span>📍</span>
                        <span>{details.location}</span>
                      </div>
                    )}
                    
                    {details.destination && (
                      <div style={{ marginBottom: 4 }}>
                        ✈️ {details.departure} → {details.destination}
                      </div>
                    )}
                    
                    {(details.bedrooms || details.bathrooms) && (
                      <div style={{ marginBottom: 4 }}>
                        {details.bedrooms && `🛏️ ${details.bedrooms} bed`}
                        {details.bedrooms && details.bathrooms && " • "}
                        {details.bathrooms && `🚿 ${details.bathrooms} bath`}
                      </div>
                    )}
                    
                    {details.category && (
                      <div style={{ marginBottom: 4 }}>
                        🔧 {details.category}
                      </div>
                    )}
                    
                    {details.condition && (
                      <div style={{ marginBottom: 4 }}>
                        📦 {details.condition}
                      </div>
                    )}
                    
                    {details.swapType && (
                      <div style={{ marginBottom: 4 }}>
                        🔄 {details.swapType}
                      </div>
                    )}
                    
                    {details.date && (
                      <div style={{ marginBottom: 4 }}>
                        📅 {new Date(details.date).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {details.description && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                        lineHeight: 1.5,
                        marginBottom: 12,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {details.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: 12,
                      borderTop: "1px solid #f3f4f6",
                    }}
                  >
                    {details.price ? (
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#0a84ff",
                        }}
                      >
                        ${details.price}
                        {modHint === "rentals" && <span style={{ fontSize: 12, fontWeight: 400 }}>/mo</span>}
                        {modHint === "services" && <span style={{ fontSize: 12, fontWeight: 400 }}>/hr</span>}
                      </span>
                    ) : (
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>View details</span>
                    )}
                    <ArrowRight size={18} strokeWidth={2} color="#6b7280" />
                  </div>
                </div>
              </>
            );

            const cardStyle = {
              borderRadius: 16,
              padding: 16,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              textDecoration: "none",
              color: "inherit",
              transition: "all 0.2s ease",
              cursor: href ? "pointer" : "default",
            };

            const hoverStyle = {
              ...cardStyle,
              transform: "translateY(-4px)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.1)",
            };

            // Fallback: if no valid href, navigate to module list page
            const finalHref = href || (modHint ? `/app/${modHint}` : "/app/home");
            
            if (!href || href === "/app/home") {
              // No valid detail link - make it non-clickable or link to module list
              return (
                <Link
                  key={`${it.id}-${i}`}
                  to={finalHref}
                  style={{...cardStyle, opacity: 0.8}}
                  title={`View all ${modHint || "items"}`}
                >
                  {inner}
                  <div style={{
                    marginTop: 8,
                    padding: 8,
                    background: "#fef3c7",
                    borderRadius: 8,
                    fontSize: 11,
                    color: "#92400e",
                    textAlign: "center"
                  }}>
                    ⚠️ Details unavailable - Click to browse {modHint || "items"}
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={`${it.id}-${i}`}
                to={finalHref}
                state={{ fromSearch: true, item: raw }}
                style={cardStyle}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, {
                    transform: "translateY(-4px)",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.1)",
                  });
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, {
                    transform: "translateY(0)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
                  });
                }}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
