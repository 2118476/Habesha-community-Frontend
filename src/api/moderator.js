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

/* ---------------- Trust & Safety console ---------------- */

/** Dashboard overview counters (open reports, reports today, total users). */
export async function getOverview() {
  const { data } = await api.get('/api/mod/overview');
  return data;
}

/** Open + reviewed report queue (newest first). */
export async function getReports() {
  const { data } = await api.get('/api/reports');
  return data;
}

/** Set a report's status: 'REVIEWED' or 'CLOSED'. */
export async function setReportStatus(reportId, status) {
  const { data } = await api.patch(`/api/reports/${reportId}/status`, { status });
  return data;
}

/** Remove one piece of reported content. */
export async function takedownContent(contentType, contentId, reason) {
  return api.post('/api/mod/takedown', { contentType, contentId, reason });
}

/** Suspend (ban) a user with a reason shown to them at login. */
export async function suspendUser(userId, reason) {
  return api.post(`/api/mod/users/${userId}/suspend`, { reason });
}

/** Reinstate a suspended user. */
export async function unsuspendUser(userId) {
  return api.post(`/api/mod/users/${userId}/unsuspend`);
}

/** Send a formal warning notice to a user. */
export async function warnUser(userId, message) {
  return api.post(`/api/mod/users/${userId}/warn`, { message });
}

/** Audit log (admin only). */
export async function getAudit({ page = 0, size = 50 } = {}) {
  const { data } = await api.get('/api/admin/audit', { params: { page, size } });
  return data;
}