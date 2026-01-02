import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import useCounts from "../../hooks/useCounts";
import useRecentActivity from "../../hooks/useRecentActivity";
import NoticeBadge from "../Nav/NoticeBadge";
import ActivityItem from "../activity/ActivityItem";
import styles from "./NotificationBell.module.scss";
import api from "../../api/axiosInstance";
import { ListLoader } from "../ui/SectionLoader/SectionLoader";

const LS_KEY = "notif.seenAt";
const qMicro = typeof queueMicrotask === "function"
  ? queueMicrotask
  : (fn) => Promise.resolve().then(fn);

export default function NotificationBell() {
  const { data: counts, refetch: refetchCounts } = useCounts();
  const unread = counts?.unreadNotifications ?? counts?.notifications ?? 0;

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const headerId = "notif-panel-header";

  // Persisted "last seen" to highlight new items across sessions
  const [, setLastSeenAt] = useState(() => {
    const v = localStorage.getItem(LS_KEY);
    return v || null;
  });

  const {
    data: rawItems = [],
    isLoading,
    isError,
    refetch: refetchActivity,
  } = useRecentActivity(20, String(unread ?? ""));

  // Deduplicate by id (defensive)
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

  // Close on outside click + Esc
  useEffect(() => {
    const onDown = (e) => {
      if (!buttonRef.current || !panelRef.current) return;
      if (!buttonRef.current.contains(e.target) && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("pointerdown", onDown, { capture: true });
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("pointerdown", onDown, { capture: true });
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Calculate position when opening
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelWidth = 400;
      const panelHeight = 500;
      
      let top = rect.bottom + 10;
      let right = window.innerWidth - rect.right;
      
      // Flip above if would go off bottom
      if (top + panelHeight > window.innerHeight - 12) {
        top = rect.top - panelHeight - 10;
      }
      
      // Clamp to viewport
      if (right < 0) right = 12;
      if (window.innerWidth - right - panelWidth < 12) {
        right = window.innerWidth - panelWidth - 12;
      }
      
      setPosition({ top, right });
    }
  }, [open]);

  // When opening: mark seen with delay, refetch counts & list, focus panel + poll
  useEffect(() => {
    let intervalId;
    let markSeenTimeout;
    
    if (open) {
      qMicro(() => {
        panelRef.current?.focus();
        const candidate = panelRef.current?.querySelector("a,button,[tabindex]");
        candidate?.focus?.();
      });

      // Mark as seen after a short delay (500ms) to allow user to see unread items first
      markSeenTimeout = setTimeout(async () => {
        try {
          const resp = await api.put("/api/notifications/seen");
          const serverSeen = resp?.data?.seenAt || new Date().toISOString();
          setLastSeenAt(serverSeen);
          localStorage.setItem(LS_KEY, serverSeen);
          
          // Optimistic update: immediately update counts
          refetchCounts?.();
          refetchActivity?.();
        } catch {
          const now = new Date().toISOString();
          setLastSeenAt(now);
          localStorage.setItem(LS_KEY, now);
          refetchCounts?.();
          refetchActivity?.();
        }
      }, 500);

      intervalId = window.setInterval(() => {
        refetchActivity?.();
        refetchCounts?.();
      }, 20000);
    }
    
    return () => {
      if (intervalId) window.clearInterval(intervalId);
      if (markSeenTimeout) clearTimeout(markSeenTimeout);
    };
  }, [open, refetchActivity, refetchCounts]);

  // Keep list fresh when unread changes
  useEffect(() => {
    refetchActivity?.();
  }, [unread, refetchActivity]);

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
    
    setOpen(false);
  };

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

  // Group by day (Today / Yesterday / Date)
  const groups = useMemo(() => {
    const byKey = new Map();
    const fmt = (d) => {
      const now = new Date();
      const dd = new Date(d);
      const diffDays = Math.floor((now - dd) / 86400000);
      if (diffDays < 1 && now.getDate() === dd.getDate()) return "Today";
      if (diffDays <= 1 && new Date(now - 86400000).getDate() === dd.getDate())
        return "Yesterday";
      return dd.toLocaleDateString();
    };
    for (const it of items) {
      const key = it?.createdAt ? fmt(it.createdAt) : "Earlier";
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(it);
    }
    return Array.from(byKey.entries());
  }, [items]);

  return (
    <div className={styles.bellWrap}>
      {/* live region announces count updates to screen readers */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {unread > 0 ? `${unread} new notifications` : "No new notifications"}
      </span>

      <button
        type="button"
        ref={buttonRef}
        className={styles.button}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="notif-panel"
        aria-label={unread > 0 ? `Notifications, ${unread} new` : "Notifications"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <NoticeBadge icon="bell" value={unread} tone="accent" plainTile />
      </button>

      {/* Portal dropdown to document.body */}
      {open && createPortal(
        <div
          id="notif-panel"
          role="dialog"
          aria-labelledby={headerId}
          aria-modal="false"
          ref={panelRef}
          tabIndex={-1}
          className={styles.panel}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            right: `${position.right}px`,
            zIndex: 100000,
          }}
        >
          {/* Header */}
          <div className={styles.header}>
            <div>
              <div id={headerId} className={styles.headerTitle}>
                Notifications
              </div>
              <div className={styles.headerSubtitle}>
                {unread > 0 ? `${unread} new notifications` : 'All caught up'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
              className={styles.closeButton}
            >
              ×
            </button>
          </div>

          {/* Actions */}
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.action}
              onClick={async () => {
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
              }}
            >
              Mark all as read
            </button>

            <Link
              to="/app/notifications"
              className={styles.action}
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>

          {/* List */}
          <div
            role="list"
            ref={listRef}
            aria-busy={isLoading ? "true" : "false"}
            className={styles.list}
          >
            {isLoading && (
              <div className={styles.loading}>
                <ListLoader />
              </div>
            )}

            {isError && !isLoading && (
              <div className={styles.empty}>
                <div>Couldn't load notifications</div>
                <button
                  type="button"
                  onClick={() => refetchActivity?.()}
                  className={styles.action}
                >
                  Try again
                </button>
              </div>
            )}

            {!isLoading && !isError && items.length === 0 && (
              <div className={styles.empty}>
                <div>All caught up!</div>
                <div>No new notifications to show</div>
              </div>
            )}

            {!isLoading && !isError && items.length > 0 && (
              <>
                {groups.map(([label, arr]) => (
                  <div key={label} className={styles.group}>
                    <div className={styles.groupLabel}>
                      {label}
                    </div>
                    {arr.map((it) => (
                      <ActivityItem
                        key={it.id}
                        item={it}
                        showMessage={false}
                        forceUnread={unreadIdSet.has(it.id)}
                        onSelect={() => handleItemSelect(it)}
                      />
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}