// src/api/homeswap.js
import api from "./axiosInstance";

/**
 * Fetch a single home swap post by id.
 * The response includes photos: [{ id, url, width, height, sortOrder }].
 */
export async function getHomeSwap(id) {
  const { data } = await api.get(`/homeswap/${id}`);
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