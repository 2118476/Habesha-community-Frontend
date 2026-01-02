// src/api/search.js
import api from "./axiosInstance";

/** Build a very controlled query string */
const toQS = (obj = {}) => {
  const usp = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v == null) return;
    usp.set(k, String(v));
  });
  return usp.toString();
};

/** Pull the first array-like from any API shape */
const pluck = (res) => {
  const r = res?.data ?? res;
  if (Array.isArray(r)) return r;
  for (const k of ["items", "results", "data", "content", "listings", "records"]) {
    if (Array.isArray(r?.[k])) return r[k];
  }
  const hits = r?.hits?.hits;
  if (Array.isArray(hits))
    return hits.map((h) => h?._source || h?._doc || h?.fields || h);
  const edges = r?.data?.search?.edges || r?.edges;
  if (Array.isArray(edges)) return edges.map((e) => e?.node || e).filter(Boolean);
  if (r && typeof r === "object") {
    const arrays = Object.values(r).filter(Array.isArray);
    if (arrays.length) return arrays.flat();
  }
  return [];
};

const MODULES = ["rentals", "homeswap", "services", "events", "travel", "ads"];

/**
 * Fetch one module's first page from either /api/<module> or /<module>,
 * tagging each item with __module so the frontend can route + style correctly.
 */
const fetchModuleList = async (moduleName, size) => {
  const paths = [`/api/${moduleName}`, `/${moduleName}`];

  for (const path of paths) {
    try {
      const qs = toQS({ page: 0, size });
      const { data } = await api.get(`${path}?${qs}`);
      const arr = pluck(data);
      if (Array.isArray(arr) && arr.length) {
        return arr.map((it) => ({ ...it, __module: moduleName }));
      }
    } catch {
      // try the next path
    }
  }

  return [];
};

/**
 * Cross-module search with safe fallbacks that your backend supports.
 * No /search or /<module>/search calls; we use list endpoints and filter client-side.
 *
 * Returns: { items: [...], nextCursor: null }
 */
export async function searchAll(arg) {
  const opts = typeof arg === "string" ? { q: arg } : arg || {};
  const q = opts.q ?? opts.query ?? opts.term ?? opts.keywords ?? "";
  const size = Number(opts.limit ?? 24);

  const typesRaw = opts.types ?? opts.include ?? MODULES;
  const types = (Array.isArray(typesRaw)
    ? typesRaw
    : String(typesRaw || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
  ).filter((m) => MODULES.includes(m));

  const modulesToUse = types.length ? types : MODULES;

  // Fetch each module list in parallel
  const perModule = await Promise.all(
    modulesToUse.map((m) => fetchModuleList(m, size))
  );
  const pooled = perModule.flat();

  if (!q) {
    return { items: pooled, nextCursor: null };
  }

  // Lightweight client filter
  const needle = q.toLowerCase();
  const haystack = (it) =>
    [
      it?.title,
      it?.name,
      it?.headline,
      it?.label,
      it?.description,
      it?.summary,
      it?.about,
      it?.details,
      it?.body,
      it?.city,
      it?.town,
      it?.location,
      it?.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

  const filtered = pooled.filter((it) => haystack(it).includes(needle));
  return { items: filtered, nextCursor: null };
}
