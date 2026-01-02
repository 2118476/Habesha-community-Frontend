// src/api/rentals.js
import api from "./axiosInstance";
import { makeApiUrl } from "./httpUrl";

/**
 * Guess the best cover image URL for a rental card / thumbnail.
 * Works with multiple backend response shapes.
 */
export function getRentalCoverUrl(rental) {
  if (!rental || typeof rental !== "object") return "";

  // 1. direct fields from backend
  let out =
    rental.coverUrl ||
    rental.imageUrl ||
    rental.photoUrl ||
    rental.thumbnailPath ||
    rental.firstPhotoPath ||
    rental.primaryPhotoPath ||
    null;

  // 2. array-style formats
  if (!out && Array.isArray(rental.photos) && rental.photos.length > 0) {
    out = rental.photos[0].url || rental.photos[0].path || null;
  }
  if (
    !out &&
    Array.isArray(rental.photoPaths) &&
    rental.photoPaths.length > 0
  ) {
    out = rental.photoPaths[0];
  }

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

/**
 * Fetch a single rental by id.
 * Basic details (title, description, price, etc.)
 */
export async function getRental(id) {
  const { data } = await api.get(`/rentals/${id}`);
  return data;
}

/**
 * Fetch a rental plus photo metadata/count.
 * Your backend exposes `/rentals/{id}/with-photos`.
 */
export async function getRentalWithPhotos(id) {
  const { data } = await api.get(`/rentals/${id}/with-photos`);
  return data;
}

/**
 * Create a new rental listing.
 * `payload` is plain JSON: { title, description, price, location, ... }
 * Returns the created rental (including its new id).
 */
export async function createRental(payload) {
  const { data } = await api.post("/rentals", payload);
  return data;
}

/**
 * Upload photos for an existing rental.
 * files: File[] (from <input type="file" multiple />)
 */
export async function uploadRentalPhotos(rentalId, files = []) {
  const fd = new FormData();
  files.forEach((file) => {
    fd.append("files", file);
  });

  const { data } = await api.post(`/rentals/${rentalId}/photos`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * Update an existing rental.
 * Caller must be the owner (or an admin) – backend enforces that.
 */
export async function updateRental(id, payload) {
  const { data } = await api.put(`/rentals/${id}`, payload);
  return data;
}

/**
 * Delete a rental by id.
 * Caller must be the owner (or an admin).
 */
export async function deleteRental(id) {
  await api.delete(`/rentals/${id}`);
}

/**
 * List rentals (for the /app/rentals page).
 * Supports filters like { city, page, size, hasPhotos, q }
 */
export async function listRentals(params = {}) {
  const { data } = await api.get("/rentals", { params });
  return data;
}
