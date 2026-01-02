// src/utils/avatar.js
import api from '../api/axiosInstance';

const API_BASE = (api?.defaults?.baseURL || '').replace(/\/+$/, '');
const LS_BUST_KEY = 'avatarBust';

/* ------------------------------ helpers ------------------------------ */

/** True if url is already absolute (http, https, protocol-relative, data, blob, file). */
function isAbsoluteUrl(url) {
  return typeof url === 'string' && /^(?:https?:)?\/\/|^(?:data:|blob:|file:)/i.test(url);
}

/** Join base + path with a single slash boundary. */
function joinBase(base, path) {
  if (!base) return path || '';
  if (!path) return base || '';
  const a = String(base).replace(/\/+$/, '');
  const b = String(path).replace(/^\/+/, '');
  return `${a}/${b}`;
}

/** Append query params to url (before cache-bust), preserving existing query string. */
function withQuery(url, params) {
  if (!params || typeof params !== 'object' || !Object.keys(params).length) return url;
  const u = new URL(url, API_BASE || window?.location?.origin || 'http://localhost');
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    u.searchParams.set(k, String(v));
  });
  return u.toString();
}

/** Append cache-bust token to the URL if provided or found in localStorage. */
function withBust(url, token) {
  const bust = token ?? (typeof localStorage !== 'undefined' && localStorage.getItem(LS_BUST_KEY));
  if (!bust || !url) return url;
  const u = new URL(url, API_BASE || window?.location?.origin || 'http://localhost');
  u.searchParams.set('t', bust);
  return u.toString();
}

/** Sanitize bad DB strings ('null', 'undefined', whitespace-only). */
function cleanPath(p) {
  if (typeof p !== 'string') return '';
  const s = p.trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return '';
  return s;
}

/* --------------------------- public functions --------------------------- */

/**
 * Resolve a raw avatar path into a fully qualified URL.
 * - Absolute (http/https, //, data:, blob:, file:) → returned as-is
 * - Relative → prefixed with API_BASE
 */
export function resolveAvatarUrl(path) {
  const cleaned = cleanPath(path);
  if (!cleaned) return '';
  return isAbsoluteUrl(cleaned) ? cleaned : joinBase(API_BASE, cleaned);
}

/**
 * Extract the “best candidate” avatar path from a user-like object.
 * Checks multiple common fields and (optionally) falls back to `/users/{id}/profile-image`.
 */
function extractAvatarPath(user, fallbackToProfileImage = true) {
  if (!user || typeof user !== 'object') return '';

  // Common direct fields or nested structures (Cloudinary-like)
  const candidate =
    user.avatarUrl ||
    user.profileImageUrl ||
    user.friendAvatarUrl ||
    user.photoUrl ||
    user.imageUrl ||
    (typeof user.avatar === 'string' && user.avatar) ||
    (user.avatar && (user.avatar.secureUrl || user.avatar.url)) ||
    (user.profile && user.profile.avatarUrl);

  if (cleanPath(candidate)) return cleanPath(candidate);

  // Last-resort fallback: serve from backend if an id exists
  if (fallbackToProfileImage && user.id) {
    return `/users/${user.id}/profile-image`;
  }

  return '';
}

/**
 * Determine the best possible avatar URL from either a string (path/URL) or a user-like object.
 * Options:
 *  - cacheBust: string to append as `?t=...` (defaults to localStorage['avatarBust'])
 *  - params: object of query params to append (e.g., { w: 96, h: 96, fit: 'cover' })
 *  - fallbackToProfileImage: boolean (default: true) to use `/users/{id}/profile-image` if no explicit avatar field
 */
export function avatarSrcFrom(userOrPath, opts = {}) {
  const { cacheBust, params, fallbackToProfileImage = true } = opts;

  let raw = '';
  if (typeof userOrPath === 'string') {
    raw = cleanPath(userOrPath);
  } else if (userOrPath && typeof userOrPath === 'object') {
    raw = extractAvatarPath(userOrPath, fallbackToProfileImage);
  }

  const resolved = resolveAvatarUrl(raw);
  const withParams = withQuery(resolved, params);
  return withBust(withParams, cacheBust);
}

/* ----------------------- cache-bust convenience ----------------------- */

/** Set an explicit cache-bust token (e.g., timestamp) for avatars. */
export function setAvatarCacheBust(token) {
  if (typeof localStorage === 'undefined') return;
  if (!token && token !== 0) return;
  localStorage.setItem(LS_BUST_KEY, String(token));
}

/** Touch cache-bust using the current time. Call after a user updates their avatar. */
export function touchAvatarCacheBust() {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LS_BUST_KEY, String(Date.now()));
}
