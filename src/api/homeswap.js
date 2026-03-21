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
 * Update an existing home swap post with optional photo changes.
 * Sends multipart form data when photos are added/removed, otherwise JSON.
 *
 * @param {number} id
 * @param {object} payload - { title, location, description, homeType, bedrooms }
 * @param {File[]} [newPhotos] - new image files to upload
 * @param {number[]} [removePhotoIds] - IDs of existing photos to remove
 */
export async function updateHomeSwap(id, payload, newPhotos = [], removePhotoIds = []) {
  const hasPhotoChanges = (newPhotos && newPhotos.length > 0) || (removePhotoIds && removePhotoIds.length > 0);

  if (!hasPhotoChanges) {
    // Simple JSON update (no photo changes)
    const { data } = await api.put(`/homeswap/${id}`, payload);
    return data;
  }

  // Multipart update with photo changes
  const fd = new FormData();
  fd.append("data", JSON.stringify(payload));
  if (removePhotoIds && removePhotoIds.length > 0) {
    fd.append("removePhotoIds", JSON.stringify(removePhotoIds));
  }
  if (newPhotos) {
    for (const f of newPhotos) fd.append("photos", f);
  }
  const { data } = await api.put(`/homeswap/${id}`, fd, { withCredentials: true });
  return data;
}

/**
 * Delete a home swap post by id.  Owners, administrators and
 * moderators may delete; the backend will enforce authorization.
 */
export async function deleteHomeSwap(id) {
  await api.delete(`/api/home-swap/${id}`);
}