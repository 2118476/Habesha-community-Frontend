// src/api/admin.js
// Administrative API helpers for listing users and updating roles.
import api from './axiosInstance';

/**
 * Fetch a paginated list of users from the admin API.
 * @param {Object} params
 * @param {number} params.page - zero‑based page index
 * @param {number} params.size - number of results per page
 * @param {string} params.query - optional search query for name/username
 */
export async function getUsers({ page = 0, size = 20, query = '' } = {}) {
  const params = { page, size };
  if (query) params.query = query;
  const { data } = await api.get('/api/admin/users', { params });
  return data;
}

/**
 * Update the role of a user. Only admins may call this endpoint.
 * @param {number} id - user ID
 * @param {string} role - one of 'USER','SERVICE_PROVIDER','MODERATOR','ADMIN'
 */
export async function updateUserRole(id, role) {
  return api.put(`/api/admin/users/${id}/role`, null, { params: { role } });
}

/**
 * Retrieve a single user's details including last login and last active timestamps.
 * @param {number} id - user ID
 */
export async function getUserById(id) {
  const { data } = await api.get(`/api/admin/users/${id}`);
  return data;
}

/**
 * Permanently delete a user. Use with caution as this cannot be undone.
 * @param {number} id - user ID
 */
export async function deleteUser(id) {
  return api.delete(`/api/admin/users/${id}`);
}

/**
 * Deactivate a user's account. A deactivated user cannot log in.
 * @param {number} id - user ID
 */
export async function deactivateUser(id) {
  return api.put(`/api/admin/users/${id}/deactivate`);
}

/**
 * Activate a previously deactivated account.
 * @param {number} id - user ID
 */
export async function activateUser(id) {
  return api.put(`/api/admin/users/${id}/activate`);
}