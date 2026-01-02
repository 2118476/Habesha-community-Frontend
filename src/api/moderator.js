// src/api/moderator.js
// API helpers for moderator dashboard. Provides read‑only user list.
import api from './axiosInstance';

/**
 * Fetch a paginated list of users from the moderator API.
 * Moderators and admins may access this endpoint.
 * @param {Object} params
 * @param {number} params.page - zero‑based page index
 * @param {number} params.size - number of results per page
 * @param {string} params.query - optional search query for name/username
 */
export async function getUsers({ page = 0, size = 20, query = '' } = {}) {
  const params = { page, size };
  if (query) params.query = query;
  const { data } = await api.get('/api/mod/users', { params });
  return data;
}