// src/utils/timeAgo.js
//
// Locale-aware "time ago" + absolute date formatting used by listing cards,
// detail pages and the activity feed. Built on the native Intl APIs so it
// localizes automatically (English, Amharic, …) without hand-written strings.
//
// Exports:
//   timeAgo(input, locale)   -> e.g. "2 hours ago" / "ከ2 ሰዓት በፊት"  (or null)
//   fullDate(input, locale)  -> e.g. "21 June 2026, 14:08"          (or null)
//   toDate(input)            -> a valid Date or null

/** Coerce many shapes (ISO string, epoch ms/seconds, Date, array) into a Date. */
export function toDate(input) {
  if (input == null) return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;

  // Java LocalDateTime is often serialized as an array [y, M, d, h, m, s]
  if (Array.isArray(input) && input.length >= 3) {
    const [y, mo, d, h = 0, mi = 0, s = 0] = input;
    const dt = new Date(y, (mo || 1) - 1, d, h, mi, s);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  if (typeof input === "number") {
    // treat 10-digit values as seconds, 13-digit as milliseconds
    const ms = input < 1e12 ? input * 1000 : input;
    const dt = new Date(ms);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const dt = new Date(input);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

// Cache one formatter per locale (constructing Intl objects is relatively costly).
const rtfCache = new Map();
function getRtf(locale) {
  const key = locale || "en";
  if (!rtfCache.has(key)) {
    try {
      rtfCache.set(key, new Intl.RelativeTimeFormat(key, { numeric: "auto" }));
    } catch {
      rtfCache.set(key, null); // unsupported locale → manual fallback below
    }
  }
  return rtfCache.get(key);
}

const DIVISIONS = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

/**
 * Human "time ago". Returns null for missing/invalid dates so callers can
 * simply skip rendering.
 */
export function timeAgo(input, locale = "en") {
  const date = toDate(input);
  if (!date) return null;

  const rtf = getRtf(locale);
  let duration = (date.getTime() - Date.now()) / 1000; // negative = past

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      const value = Math.round(duration);
      if (rtf) return rtf.format(value, division.unit);
      // Manual English fallback if Intl.RelativeTimeFormat is unavailable
      const abs = Math.abs(value);
      if (division.unit === "second" && abs < 30) return "just now";
      const plural = abs === 1 ? "" : "s";
      return `${abs} ${division.unit}${plural} ago`;
    }
    duration /= division.amount;
  }
  return null;
}

// Cache absolute-date formatters per locale too.
const dtfCache = new Map();
function getDtf(locale) {
  const key = locale || "en";
  if (!dtfCache.has(key)) {
    try {
      dtfCache.set(
        key,
        new Intl.DateTimeFormat(key, {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      dtfCache.set(key, null);
    }
  }
  return dtfCache.get(key);
}

/** Full, localized date for tooltips / accessibility. */
export function fullDate(input, locale = "en") {
  const date = toDate(input);
  if (!date) return null;
  const dtf = getDtf(locale);
  return dtf ? dtf.format(date) : date.toLocaleString();
}
