// src/pages/Search.jsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { searchAll } from "../api/search";

const isAbs = (s) => typeof s === "string" && /^(https?:)?\/\//i.test(s);
const FALLBACK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const imgOf = (it) => {
  if (!it) return null;
  if (isAbs(it?.imageUrlAbsolute)) return it.imageUrlAbsolute;
  if (isAbs(it?.imageUrl)) return it.imageUrl;
  if (isAbs(it?.firstPhotoUrl)) return it.firstPhotoUrl;
  const arrays = [it?.photos, it?.images, it?.pictures, it?.media, it?.gallery].filter(Boolean);
  for (const arr of arrays) {
    if (!Array.isArray(arr) || !arr.length) continue;
    const first = arr[0];
    const u = typeof first === "string" ? first : first?.url || first?.src || first?.path;
    if (u) return u;
  }
  return null;
};

const detailsPath = (type, id) => {
  if (!id) return "#";
  const t = (type || "").toLowerCase();
  if (t.includes("rental")) return `/app/rentals/${id}`;
  if (t.includes("swap")) return `/app/homeswap/${id}`;
  if (t.includes("service")) return `/app/services/${id}`;
  if (t.includes("ad") || t.includes("classified")) return `/app/ads/${id}`;
  if (t.includes("travel") || t.includes("trip") || t.includes("tour")) return `/app/travel/${id}`;
  return "#";
};

export default function Search() {
  const { t } = useTranslation();
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const q = (params.get("q") || "").trim();

  const [items, setItems] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!q) { setItems([]); return; }
      try {
        setBusy(true);
        setErr("");
        const { items } = await searchAll({ q, limit: 36 });
        if (!cancelled) setItems(items ?? []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr(t('search.searchFailed'));
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [q, t]);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontWeight: 900 }}>Search</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = new FormData(e.currentTarget).get("q");
            navigate(`/app/search?q=${encodeURIComponent(String(val||"").trim())}`);
          }}
          role="search"
          aria-label="Search"
          style={{ display: "flex", gap: 8 }}
        >
          <input
            name="q"
            defaultValue={q}
            placeholder={t('search.searchPlaceholder')}
            style={{
              flex: 1,
              border: "1px solid var(--border-1, #e6e8ee)",
              background: "var(--surface-0, #fff)",
              padding: "10px 12px",
              borderRadius: 10,
            }}
          />
          <button
            type="submit"
            style={{
              border: "1px solid var(--border-1, #e6e8ee)",
              background: "color-mix(in oklab, var(--brand, #0a84ff) 10%, white)",
              padding: "10px 14px",
              borderRadius: 10,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>
      </header>

      {busy && <div style={{ opacity: 0.8 }}>{t('search.searching')}</div>}
      {err && <div style={{ color: "#8a1620" }}>{err}</div>}

      {!busy && !err && q && items.length === 0 && (
        <div>No results for “{q}”. Try a different keyword.</div>
      )}

      <div
        role="list"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        {items.map((it, i) => {
          const id = it?.id ?? it?._id ?? it?.listingId ?? it?.publicId ?? `x${i}`;
          const type = it?.type || "";
          const href = detailsPath(type, id);
          const title = (it?.title || it?.name || "Untitled").toString();
          const src = imgOf(it) || FALLBACK_PIXEL;

          return (
            <Link
              key={`${id}-${i}`}
              to={href}
              role="listitem"
              style={{
                textDecoration: "none",
                color: "inherit",
                border: "1px solid var(--border-1, #e6e8ee)",
                background: "var(--surface-0, #fff)",
                borderRadius: 14,
                overflow: "hidden",
                display: "grid",
                gridTemplateRows: "150px auto",
              }}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
                onError={(e) => (e.currentTarget.src = FALLBACK_PIXEL)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{ padding: 10, display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.25 }}>
                  {title.length > 70 ? title.slice(0, 67) + "…" : title}
                </div>
                <div style={{ fontSize: 12.5, opacity: 0.7 }}>{type}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
