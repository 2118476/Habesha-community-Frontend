// src/api/homeswap.js
import api from "./axiosInstance";

/**
 * Fetch a single home swap post by id.
 * Falls back to the plain endpoint used by the listing pages.  Note that
 * for editing we only need the basic fields (title, location, description).
 */
export async function getHomeSwap(id) {
  const { data } = await api.get(`/homeswap/${id}`);
  return data;
}

/**
 * Fetch a home swap post along with its photo metadata.  Your backend
 * exposes `/homeswap/{id}/with-photos` for this richer payload.
 */
export async function getHomeSwapWithPhotos(id) {
  const { data } = await api.get(`/homeswap/${id}/with-photos`);
  return data;
}

/**
 * Update an existing home swap post.  Only the owner may update via this
 * endpoint.  Administrators and moderators will receive a 403.
 *
 * `payload` should contain the editable fields: { title, location, description, homeType, bedrooms, availableFrom, availableTo }
 * although currently only title, location and description are persisted.
 */
export async function updateHomeSwap(id, payload) {
  const { data } = await api.put(`/api/home-swap/${id}`, payload);
  return data;
}

/**
 * Delete a home swap post by id.  Owners, administrators and
 * moderators may delete; the backend will enforce authorization.
 */
export async function deleteHomeSwap(id) {
  await api.delete(`/api/home-swap/${id}`);
}