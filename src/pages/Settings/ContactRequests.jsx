// src/pages/Settings/ContactRequests.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api/axiosInstance";
import styles from "../../stylus/sections/Settings.module.scss";
import Avatar from "../../components/Avatar";
import { Link } from "react-router-dom";
import { enterpriseToast } from "../../components/ToastExports";
import { TableLoader } from "../../components/ui/SectionLoader/SectionLoader";
import { getProfileLink } from "../../utils/profileLinks";

export default function ContactRequests() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("incoming"); // "incoming" | "outgoing"
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(null); // requestId currently being actioned

  // ---- Helpers --------------------------------------------------------------

  // Get the CONTACT REQUEST id reliably across DTO variants
  const reqIdOf = (r) =>
    r?.id ??
    r?.requestId ??
    r?.contactRequestId ??
    r?.contactRequestID ??
    r?.requestID ??
    null;

  // Very tolerant user normalizer
  const normalizeUser = (raw) => {
    if (!raw) return { id: null, username: "", displayName: "", avatarUrl: null };

    const u = raw.user || raw.profile || raw;

    const id =
      u.id ??
      u.userId ??
      u._id ??
      u.userID ??
      u.uuid ??
      raw.requesterId ??
      raw.requesterID ??
      raw.requesterUserId ??
      raw.targetId ??
      raw.targetID ??
      raw.targetUserId ??
      raw.userId ??
      raw.userID ??
      null;

    let username =
      u.username ??
      u.handle ??
      u.userName ??
      u.user_name ??
      u.login ??
      raw.requesterUsername ??
      raw.targetUsername ??
      raw.username ??
      "";

    // Clean up username - remove @ prefix if present and ensure it's not empty/generic
    if (username) {
      username = username.replace(/^@/, '');
      if (username.toLowerCase() === 'user' || username.toLowerCase() === 'unknown') {
        username = "";
      }
    }

    const displayName =
      u.displayName ??
      u.fullName ??
      u.name ??
      (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : (u.firstName || u.lastName)) ??
      raw.requesterName ??
      raw.targetName ??
      raw.requesterDisplayName ??
      raw.targetDisplayName ??
      raw.fullName ??
      raw.name ??
      "";

    const avatarUrl =
      u.avatarUrl ??
      u.profileImageUrl ??
      u.photoUrl ??
      u.imageUrl ??
      (typeof u.avatar === "string"
        ? u.avatar
        : u.avatar && (u.avatar.secureUrl || u.avatar.url)) ??
      (u.profile && (u.profile.avatarUrl || u.profile.photoUrl)) ??
      raw.requesterAvatarUrl ??
      raw.targetAvatarUrl ??
      raw.avatarUrl ??
      raw.photoUrl ??
      raw.imageUrl ??
      null;

    return { id, username, displayName, avatarUrl };
  };

  // Pick "the other person" based on the active tab
  const personOf = (r) => {
    let userData;
    if (tab === "incoming") {
      // For incoming requests, we want the requester's info
      userData = {
        id: r.requesterId,
        username: r.requesterUsername,
        displayName: r.requesterName,
        avatarUrl: r.requesterAvatarUrl,
        // Fallback to nested objects
        ...r.requester,
        user: r.requester || r.from || r.requesterUser
      };
    } else {
      // For outgoing requests, we want the target's info
      userData = {
        id: r.targetId,
        username: r.targetUsername,
        displayName: r.targetName,
        avatarUrl: r.targetAvatarUrl,
        // Fallback to nested objects
        ...r.target,
        user: r.target || r.to || r.targetUser
      };
    }
    
    const normalized = normalizeUser(userData);
    
    // Debug logging
    console.log(`Person data for ${tab} request:`, {
      raw: userData,
      normalized: normalized,
      originalRequest: r
    });
    
    return normalized;
  };

  const personLink = (u) => {
    return getProfileLink(u);
  };

  const niceStatus = (r) => {
    const s = String(r?.status ?? "PENDING").toUpperCase();
    if (s === "APPROVED") return "approved";
    if (s === "REJECTED") return "rejected";
    if (s === "CANCELLED" || s === "CANCELED") return "cancelled";
    return "pending";
  };

  const timeOf = (r) => {
    const v = r.createdAt || r.requestedAt || r.created;
    if (!v) return "-";
    try {
      return new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(v));
    } catch {
      return String(v);
    }
  };

  const typeOf = (r) => {
    if (Array.isArray(r.fields) && r.fields.length) return r.fields.join(", ");
    const t = r.type || r.requestType || "-";
    return typeof t === "string" ? t.toUpperCase() : String(t);
  };

  // ---- Fetch ---------------------------------------------------------------

  const load = async (which = tab) => {
    setLoading(true);
    setErr("");
    try {
      const path =
        which === "incoming" ? "/contact/requests/incoming" : "/contact/requests/outgoing";
      const { data } = await api.get(path);
      const list = Array.isArray(data) ? data : data?.content || [];
      
      // Debug logging to help troubleshoot
      console.log(`Contact requests (${which}):`, list);
      if (list.length > 0) {
        console.log('Sample request data:', list[0]);
      }
      
      setItems(list);
    } catch (error) {
      console.error('Failed to load contact requests:', error);
      setErr(t('settings.contactRequests.failedToLoadRequests'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const sorted = useMemo(() => {
    return (items || []).slice().sort((a, b) => {
      const ta = Date.parse(a.createdAt || a.requestedAt || a.created || 0) || 0;
      const tb = Date.parse(b.createdAt || b.requestedAt || b.created || 0) || 0;
      return tb - ta; // newest first
    });
  }, [items]);

  // ---- Lazy enrich missing user fields (names/avatars) ---------------------

  const userCacheRef = useRef(new Map());

  const otherIdFor = (r) => {
    const raw =
      tab === "incoming"
        ? r.requester || r.from || r.requesterUser || r.user
        : r.target || r.to || r.targetUser || r.user;
    const u = raw && typeof raw === "object" ? raw : r;
    return (
      u?.id ??
      u?.userId ??
      u?._id ??
      r?.requesterId ??
      r?.targetId ??
      r?.userId ??
      null
    );
  };

  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) return;
    let cancelled = false;
    (async () => {
      const next = [...items];
      let changed = false;

      for (let i = 0; i < next.length; i++) {
        const r = next[i];
        const id = otherIdFor(r);
        if (!id) continue;

        const cur = personOf(r);
        const looksEmpty =
          !cur ||
          ((!cur.username || cur.username.toLowerCase() === "user") &&
            !cur.displayName &&
            !cur.avatarUrl);
        if (!looksEmpty) continue;

        if (userCacheRef.current.has(id)) {
          next[i] = { ...r, _otherUser: userCacheRef.current.get(id) };
          changed = true;
          continue;
        }

        try {
          const { data } = await api.get(`/users/${id}`);
          if (cancelled) return;
          if (data) {
            userCacheRef.current.set(id, data);
            next[i] = { ...r, _otherUser: data };
            changed = true;
          }
        } catch {
          // ignore missing profile; keep fallbacks
        }
      }

      if (!cancelled && changed) setItems(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, tab]);

  // ---- Actions -------------------------------------------------------------

  const respond = async (requestId, accept) => {
    if (!requestId) return;
    setBusy(requestId);

    // optimistic UI
    const prev = items;
    setItems((cur) =>
      cur.map((r) =>
        reqIdOf(r) === requestId ? { ...r, status: accept ? "APPROVED" : "REJECTED" } : r
      )
    );

    try {
      await api.post(`/contact/requests/${requestId}/respond`, null, { params: { accept } });
      enterpriseToast.success(accept ? t('settings.contactRequests.requestAccepted') : t('settings.contactRequests.requestRejected'));
      await load();
    } catch {
      setItems(prev);
      enterpriseToast.error(t('settings.contactRequests.actionFailed'));
    } finally {
      setBusy(null);
    }
  };

  // For outgoing "Cancel", use the same respond endpoint with accept=false.
  // (Your controller exposes /requests/{id}/respond; we’ll use that.)
  const cancelOutgoing = async (requestId) => {
    if (!requestId) return;
    if (!window.confirm(t('settings.contactRequests.confirmCancelRequest'))) return;

    setBusy(requestId);
    const prev = items;
    setItems((cur) =>
      cur.map((r) => (reqIdOf(r) === requestId ? { ...r, status: "CANCELLED" } : r))
    );

    try {
      await api.post(`/contact/requests/${requestId}/respond`, null, { params: { accept: false } });
      enterpriseToast.success(t('settings.contactRequests.requestCancelled'));
      await load("outgoing");
    } catch {
      setItems(prev);
      enterpriseToast.error(t('settings.contactRequests.couldNotCancel'));
    } finally {
      setBusy(null);
    }
  };

  // ---- Render --------------------------------------------------------------

  return (
    <div className={styles.panel}>
      <div className={styles.headerRow}>
        <h1>{t('settings.contactRequests.title')}</h1>

        <div className={styles.tabs} role="tablist" aria-label={t('settings.contactRequests.contactRequestTabs')}>
          <button
            className={tab === "incoming" ? styles.tabActive : styles.tab}
            onClick={() => setTab("incoming")}
            type="button"
            role="tab"
            aria-selected={tab === "incoming"}
          >
            {t('settings.contactRequests.incoming')}
          </button>
          <button
            className={tab === "outgoing" ? styles.tabActive : styles.tab}
            onClick={() => setTab("outgoing")}
            type="button"
            role="tab"
            aria-selected={tab === "outgoing"}
          >
            {t('settings.contactRequests.outgoing')}
          </button>
        </div>
      </div>

      {err && (
        <p className={styles.help} role="alert" aria-live="polite">
          {err}
        </p>
      )}

      <div
        className={styles.table}
        role="table"
        aria-label={t('settings.contactRequests.title')}
        aria-busy={loading ? "true" : "false"}
      >
        <div className={styles.th} role="columnheader">{t('settings.contactRequests.user')}</div>
        <div className={styles.th} role="columnheader">{t('settings.contactRequests.type')}</div>
        <div className={styles.th} role="columnheader">{t('settings.contactRequests.status')}</div>
        <div className={styles.th} role="columnheader">{t('settings.contactRequests.when')}</div>
        <div className={styles.th} role="columnheader">{t('settings.contactRequests.actions')}</div>

        {loading && (
          <TableLoader rows={3} columns={5} />
        )}

        {!loading && sorted.length === 0 && (
          <div className={styles.tr} role="row">
            <div role="cell" className={styles.help}>{tab === 'incoming' ? t('settings.contactRequests.noIncomingRequests') : t('settings.contactRequests.noOutgoingRequests')}</div>
            <div role="cell">-</div>
            <div role="cell">-</div>
            <div role="cell">-</div>
            <div role="cell">-</div>
          </div>
        )}

        {!loading &&
          sorted.map((r) => {
            const requestId = reqIdOf(r);
            const u = personOf(r);
            const link = personLink(u);
            const isBusy = busy === requestId;
            const status = niceStatus(r);

            // Display name resolution
            const primary = u.username ? `@${u.username}` : (u.displayName || t('settings.blocked.unknownUser'));
            const secondary = u.username && u.displayName ? u.displayName : "—";

            return (
              <div key={requestId} className={styles.tr} role="row">
                <div role="cell" className={styles.userCell}>
                  <div className={styles.userMini}>
                    <Avatar user={u} src={u.avatarUrl} size={32} rounded />
                    <div>
                      <div className={styles.primary}>
                        {link ? (
                          <Link to={link} title={`View ${u.displayName || u.username || 'user'}'s profile`}>
                            {primary}
                          </Link>
                        ) : (
                          <span>{primary}</span>
                        )}
                      </div>
                      <div className={styles.secondary}>{secondary}</div>
                    </div>
                  </div>
                </div>

                <div role="cell">{typeOf(r)}</div>
                <div role="cell" className={styles.status}>{status}</div>
                <div role="cell">{timeOf(r)}</div>

                <div role="cell" className={styles.actions}>
                  {tab === "incoming" ? (
                    <>
                      <button
                        className={styles.btnPrimary}
                        onClick={() => respond(requestId, true)}
                        type="button"
                        disabled={isBusy}
                        aria-busy={isBusy ? "true" : "false"}
                      >
                        {isBusy ? t('settings.contactRequests.accepting') : t('settings.contactRequests.accept')}
                      </button>
                      <button
                        className={styles.btnSecondary}
                        onClick={() => respond(requestId, false)}
                        type="button"
                        disabled={isBusy}
                      >
                        {isBusy ? t('settings.contactRequests.rejecting') : t('settings.contactRequests.reject')}
                      </button>
                    </>
                  ) : (
                    <button
                      className={styles.btnSecondary}
                      onClick={() => cancelOutgoing(requestId)}
                      type="button"
                      disabled={isBusy}
                      aria-busy={isBusy ? "true" : "false"}
                    >
                      {isBusy ? t('settings.contactRequests.cancelling') : t('settings.contactRequests.cancel')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
