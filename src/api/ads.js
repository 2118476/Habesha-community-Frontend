// src/api/ads.js
import api from './axiosInstance';
import { makeApiUrl } from './httpUrl';

/**
 * Get the best cover image URL for an ad card / thumbnail.
 * Similar to getRentalCoverUrl but for ads.
 */
export function getAdCoverUrl(ad) {
  if (!ad || typeof ad !== "object") return "";

  // 1. Check for photos array first (new system)
  if (Array.isArray(ad.photos) && ad.photos.length > 0) {
    const firstPhoto = ad.photos[0];
    const url = firstPhoto.url || firstPhoto.path || null;
    if (url) {
      // already absolute? (http / https / data:)
      if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
      return makeApiUrl(url.startsWith("/") ? url : `/${url}`);
    }
  }

  // 2. Check firstPhotoUrl from with-photos endpoint
  if (ad.firstPhotoUrl) {
    const url = ad.firstPhotoUrl;
    if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
    return makeApiUrl(url.startsWith("/") ? url : `/${url}`);
  }

  // 3. Fallback to direct fields from backend (old system)
  let out = ad.imageUrl || ad.photoUrl || ad.coverUrl || null;

  if (!out) return "";

  // already absolute? (http / https / data:)
  if (/^https?:\/\//i.test(out) || out.startsWith("data:")) return out;

  // looks like "/uploads/whatever.jpg" or "uploads/whatever.jpg"
  if (/^\/?uploads\//i.test(out)) {
    const cleaned = out.startsWith("/") ? out : `/${out}`;
    return makeApiUrl(cleaned);
  }

  // fallback: just force absolute with baseURL
  return makeApiUrl(out.startsWith("/") ? out : `/${out}`);
}

/* =========================
   AD DETAILS / LIKES
   ========================= */

// Get full ad details (title, price, poster info, likeCount, likedByMe, etc.)
export async function fetchAdDetails(adId) {
  return api.get(`/ads/${adId}`);
}

// Like this ad (returns new likeCount)
export async function likeAd(adId) {
  return api.post(`/ads/${adId}/like`);
}

// Unlike this ad (returns new likeCount)
export async function unlikeAd(adId) {
  return api.delete(`/ads/${adId}/like`);
}

/* =========================
   COMMENTS / REPLIES
   These are under /api/ads/*
   ========================= */

// Get all comments (top-level + replies)
export async function getAdComments(adId) {
  return api.get(`/api/ads/${adId}/comments`);
}

// Add a new top-level comment
export async function postAdComment(adId, text) {
  return api.post(`/api/ads/${adId}/comments`, { text });
}

// Reply to a specific comment
export async function postAdReply(adId, parentId, text) {
  return api.post(`/api/ads/${adId}/comments/${parentId}/reply`, { text });
}

// Edit an existing comment (allowed if canEdit == true)
export async function editAdComment(commentId, text) {
  return api.put(`/api/ad-comments/${commentId}`, { text });
}

// Delete an existing comment (allowed if canDelete == true)
export async function deleteAdComment(commentId) {
  return api.delete(`/api/ad-comments/${commentId}`);
}

/* =========================
   AD PHOTO UPLOAD
   ========================= */

/**
 * Upload photos for an existing ad.
 * files: File[] (from <input type="file" multiple />)
 */
export async function uploadAdPhotos(adId, files = []) {
  const fd = new FormData();
  files.forEach((file) => {
    fd.append("files", file);
  });

  const { data } = await api.post(`/ads/${adId}/photos`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  
  return data;
}

/**
 * Fetch an ad plus photo metadata/count.
 * Similar to getRentalWithPhotos but for ads.
 */
export async function getAdWithPhotos(id) {
  const { data } = await api.get(`/ads/${id}/with-photos`);
  return data;
}
