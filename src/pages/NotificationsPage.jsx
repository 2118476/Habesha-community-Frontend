import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useRecentActivity from "../hooks/useRecentActivity";
import useCounts from "../hooks/useCounts";
import ActivityItem from "../components/activity/ActivityItem";
import api from "../api/axiosInstance";
import styles from "../stylus/sections/NotificationsPage.module.scss";
import { ListLoader } from "../components/ui/SectionLoader/SectionLoader";

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { data: counts, refetch: refetchCounts } = useCounts();
  const unread = counts?.unreadNotifications ?? counts?.notifications ?? 0;

  // Use the same hook as NotificationBell - fetch more items for the full page
  const {
    data: rawItems = [],
    isLoading,
    isError,
    refetch: refetchActivity,
  } = useRecentActivity(50); // Get more items for the full page

  // Persisted "last seen" to highlight new items across sessions
  const LS_KEY = "notif.seenAt";
  const [, setLastSeenAt] = useState(() => {
    const v = localStorage.getItem(LS_KEY);
    return v || null;
  });

  // Deduplicate by id (defensive) - same logic as NotificationBell
  const items = useMemo(() => {
    const seen = new Set();
    return rawItems.filter((it) => {
      const k =
        it?.id ?? `${it?.type}-${it?.entityType}-${it?.entityId}-${it?.createdAt}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [rawItems]);

  // IntersectionObserver removed - using simple pagination with useRecentActivity
  // Could be enhanced later with infinite scroll if needed

  // Build unread ID set to guarantee badge count matches highlighted items
  const unreadIdSet = useMemo(() => {
    const set = new Set();
    
    // Check if items include explicit read state from API
    const hasExplicitReadState = items.some(item => typeof item.isRead === 'boolean');
    
    if (hasExplicitReadState) {
      // Use API read state if available
      items.forEach(item => {
        if (typeof item.isRead === 'boolean' && !item.isRead) {
          set.add(item.id);
        }
      });
    } else {
      // Fallback: highlight the first N newest items to match badge count
      // Items are already sorted newest-first from useRecentActivity
      const unreadCount = Math.max(0, unread);
      items.slice(0, unreadCount).forEach(item => {
        set.add(item.id);
      });
    }
    
    return set;
  }, [items, unread]);

  // Group by date label - same logic as NotificationBell
  const groups = useMemo(() => {
    const byKey = new Map();
    const fmt = (d) => {
      const now = new Date();
      const dd = new Date(d);
      const diffDays = Math.floor((now - dd) / 86400000);
      if (diffDays < 1 && now.getDate() === dd.getDate()) return t('notifications.today');
      if (diffDays <= 1 && new Date(now - 86400000).getDate() === dd.getDate())
        return t('notifications.yesterday');
      return dd.toLocaleDateString();
    };
    for (const it of items) {
      const key = it?.createdAt ? fmt(it.createdAt) : t('notifications.earlier');
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(it);
    }
    return Array.from(byKey.entries());
  }, [items, t]);

  const handleItemSelect = async (item) => {
    // Mark individual item as read if it's unread
    const wasUnread = unreadIdSet.has(item.id);
    
    if (wasUnread) {
      try {
        // Try to mark individual item as read
        await api.put(`/api/notifications/${item.id}/read`);
      } catch {
        // Fallback: update lastSeenAt to current time
        const now = new Date().toISOString();
        setLastSeenAt(now);
        localStorage.setItem(LS_KEY, now);
      }
      
      // Optimistic update: refresh counts and activity
      refetchCounts?.();
      refetchActivity?.();
    }
  };

  const markAll = async () => {
    try {
      const resp = await api.put("/api/notifications/seen");
      const serverSeen = resp?.data?.seenAt || new Date().toISOString();
      setLastSeenAt(serverSeen);
      localStorage.setItem(LS_KEY, serverSeen);
    } catch {
      const now = new Date().toISOString();
      setLastSeenAt(now);
      localStorage.setItem(LS_KEY, now);
    } finally {
      refetchCounts?.();
      refetchActivity?.();
    }
  };

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topbar}>
        <h1 className={styles.title}>{t('nav.notifications')}</h1>
        <div className={styles.actions}>
          <button type="button" onClick={markAll} className={styles.action}>
            {t('notifications.markAllAsRead')}
          </button>
          <Link to="/app/home" className={styles.action}>
            {t('nav.home')}
          </Link>
        </div>
      </div>

      {/* List */}
      <div role="list" className={styles.list}>
        {isLoading && <ListLoader count={8} showAvatar={true} />}

        {isError && !isLoading && (
          <div className={styles.loader}>
            {t('notifications.couldntLoad')}{" "}
            <button onClick={() => refetchActivity()} className={styles.action}>
              {t('common.retry')}
            </button>
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className={styles.empty}>{t('notifications.nothingYet')}</div>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <>
            {groups.map(([label, arr]) => (
              <section key={label} className={styles.group}>
                <div className={styles.groupLabel}>{label}</div>
                {arr.map((it) => (
                  <ActivityItem 
                    key={it.id} 
                    item={it} 
                    showMessage={false} 
                    forceUnread={unreadIdSet.has(it.id)}
                    onSelect={() => handleItemSelect(it)}
                  />
                ))}
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}