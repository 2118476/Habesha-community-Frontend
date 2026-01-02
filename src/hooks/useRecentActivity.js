// src/hooks/useRecentActivity.js
import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosInstance';

/**
 * Robust recent-activity fetcher.
 * - Tries several likely endpoints (first one that responds 2xx wins)
 * - Normalizes to the exact shape expected by ActivityItem:
 *   { id, type, title, createdAt, entityType, entityId, actor, href }
 */

const CANDIDATE_ENDPOINTS = [
  // common choices
  '/api/notifications',
  '/api/notifications/recent',
  '/api/notifications/list',
  '/api/activity/recent',
  '/api/activities/recent',
  '/api/recent-activities',
  // fallbacks people often use
  '/api/activity',
  '/api/activities',
  '/api/users/me/notifications',
  '/api/users/me/activity',
  '/notifications',
  '/notifications/recent',
];

const arr = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (Array.isArray(v.items)) return v.items;
  if (Array.isArray(v.content)) return v.content;
  if (Array.isArray(v.data)) return v.data;
  if (Array.isArray(v.results)) return v.results;
  if (v.page && Array.isArray(v.page.content)) return v.page.content; // Spring Page
  return [v];
};

const pick = (...xs) => xs.find((x) => x !== undefined && x !== null);

const asMillis = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
};

function normalize(raw) {
  // Fields commonly seen across backends
  const createdAt =
    pick(raw.createdAt, raw.created_at, raw.timestamp, raw.time, raw.date) || null;

  const id = String(
    pick(raw.id, raw._id, raw.uuid, raw.notificationId, raw.activityId, raw.key) ??
      `${pick(raw.type, raw.kind, raw.category, 'activity')}-${asMillis(createdAt)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`
  );

  const actor =
    pick(raw.actor, raw.user, raw.sender, raw.initiator, raw.originator, raw.by) || null;

  const type = String(pick(raw.type, raw.kind, raw.category, raw.event, 'activity'));

  // Match ActivityItem contract
  const entityType = String(
    pick(raw.entityType, raw.entity_type, raw.entity?.type, raw.targetType, raw.target?.type, raw.domain) || ''
  ).toLowerCase();

  const entityId = pick(
    raw.entityId,
    raw.entity_id,
    raw.entity?.id,
    raw.targetId,
    raw.target_id,
    raw.target?.id,
    raw.threadId,
    raw.thread_id
  );

  const title = pick(raw.title, raw.message, raw.text, raw.summary, raw.description, raw.body);

  const href = pick(raw.url, raw.href, raw.link) || null;

  // Read/unread state fields - keep from API response
  const isRead = pick(raw.isRead, raw.read, raw.seen, raw.is_seen, raw.is_read);
  const readAt = pick(raw.readAt, raw.read_at, raw.readTime, raw.read_time);
  const seenAt = pick(raw.seenAt, raw.seen_at, raw.seenTime, raw.seen_time);

  return {
    id,
    type,
    title: typeof title === 'string' ? title : undefined,
    createdAt,
    entityType,
    entityId,
    actor,
    href,
    // Include read/unread fields for accurate highlighting
    isRead: typeof isRead === 'boolean' ? isRead : undefined,
    readAt,
    seenAt,
    _raw: raw,
  };
}

async function fetchFromAny(limit = 20, signal) {
  let lastErr;
  for (const path of CANDIDATE_ENDPOINTS) {
    try {
      const { data } = await api.get(path, { params: { limit }, signal });
      const items = arr(data).map(normalize).filter(Boolean);
      // newest first
      items.sort((a, b) => asMillis(b.createdAt) - asMillis(a.createdAt));
      return items.slice(0, limit);
    } catch (e) {
      lastErr = e;
      // try next candidate on 4xx/5xx or network issues
      continue;
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('[useRecentActivity] no endpoints responded; returning empty list', lastErr);
  }
  return [];
}

export default function useRecentActivity(limit = 20, key = '') {
  return useQuery({
    queryKey: ['recent-activity', limit, key],
    queryFn: ({ signal }) => fetchFromAny(limit, signal),
    refetchInterval: 30_000,
  });
}
