// src/pages/FriendsRequests.jsx
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import api from "../api/axiosInstance";
import { toast } from "react-toastify";
import buttonStyles from "../stylus/components/Button.module.scss";
import styles from "../stylus/sections/Friends.module.scss";
import Avatar from "../components/Avatar";
import ProfileLink from "../components/ProfileLink";

/** ---- Config ---- */
const REFRESH_MS = 15000; // auto refresh lists
const DEBUG = false;

/** ---- Small utils ---- */
const safe = (v, f) => (v == null ? f : v);
const toList = (x) => (Array.isArray(x) ? x : []);
const cx = (...c) => c.filter(Boolean).join(" ");

const timeAgo = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

const avatarOf = (u) =>
  (typeof u?.avatar === "string" && u.avatar) ||
  u?.avatarUrl ||
  (u?.avatar && (u.avatar.url || u.avatar.secureUrl)) ||
  u?.photoUrl ||
  u?.profileImageUrl ||
  u?.imageUrl ||
  (u?.profile && u.profile.avatarUrl) ||
  null;

/** ---- State machine ---- */
const initialState = {
  incoming: [],
  outgoing: [],
  loading: true,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true, error: null };
    case "LOAD_SUCCESS":
      return {
        ...state,
        loading: false,
        error: null,
        incoming: action.incoming,
        outgoing: action.outgoing,
      };
    case "LOAD_ERROR":
      return { ...state, loading: false, error: action.error || "Failed to load" };
    case "OPTIMISTIC_ACCEPT": {
      const id = String(action.id);
      return {
        ...state,
        incoming: state.incoming.filter((r) => String(r.id) !== id),
      };
    }
    case "OPTIMISTIC_DECLINE": {
      const id = String(action.id);
      return {
        ...state,
        incoming: state.incoming.filter((r) => String(r.id) !== id),
      };
    }
    case "OPTIMISTIC_CANCEL_OUT": {
      const id = String(action.id);
      return {
        ...state,
        outgoing: state.outgoing.filter((r) => String(r.id) !== id),
      };
    }
    case "REVERT": // full revert on error
      return { ...state, incoming: action.incoming, outgoing: action.outgoing };
    default:
      return state;
  }
}

/** ---- Row components ---- */
function IncomingCard({ req, onAccept, onDecline }) {
  const sender = {
    id: safe(req.senderId, req.requesterId),
    name: safe(req.senderName, req.requesterName) || "User",
    avatar: avatarOf(req.sender || req.requester) || req.senderAvatar || req.requesterAvatar || null,
  };
  return (
    <li className={cx(styles.listItem, styles.card)} aria-label={`Incoming request from ${sender.name}`}>
      <div className={styles.cardLeft}>
        <Avatar user={{ id: sender.id, name: sender.name, avatarUrl: sender.avatar }} size="md" />
      </div>
      <div className={styles.cardMain}>
        <div className={styles.cardTitle}>
          <ProfileLink userId={sender.id}>{sender.name}</ProfileLink>
        </div>
        <div className={styles.cardMeta}>
          <span>sent {timeAgo(req.createdAt)}</span>
          {req.mutualCount > 0 && <span className={styles.dot}>•</span>}
          {req.mutualCount > 0 && <span>{req.mutualCount} mutual</span>}
        </div>
      </div>
      <div className={styles.cardActions}>
        <button
          onClick={() => onAccept(req.id)}
          className={cx(buttonStyles.btn, buttonStyles.primary)}
          aria-label={`Accept ${sender.name}'s request`}
        >
          Accept
        </button>
        <button
          onClick={() => onDecline(req.id)}
          className={cx(buttonStyles.btn, buttonStyles.ghost)}
          aria-label={`Decline ${sender.name}'s request`}
        >
          Decline
        </button>
      </div>
    </li>
  );
}

function OutgoingCard({ req, onCancel }) {
  const target = {
    id: safe(req.receiverId, req.targetId),
    name: safe(req.receiverName, req.targetName) || "User",
    avatar:
      avatarOf(req.receiver || req.target) || req.receiverAvatar || req.targetAvatar || null,
  };
  return (
    <li className={cx(styles.listItem, styles.card)} aria-label={`Outgoing request to ${target.name}`}>
      <div className={styles.cardLeft}>
        <Avatar user={{ id: target.id, name: target.name, avatarUrl: target.avatar }} size="md" />
      </div>
      <div className={styles.cardMain}>
        <div className={styles.cardTitle}>
          <ProfileLink userId={target.id}>{target.name}</ProfileLink>
        </div>
        <div className={styles.cardMeta}>
          <span>sent {timeAgo(req.createdAt)}</span>
          {req.status && (
            <>
              <span className={styles.dot}>•</span>
              <span className={cx(styles.badge, styles.badgeNeutral)}>
                {(req.status || "").toLowerCase()}
              </span>
            </>
          )}
        </div>
      </div>
      <div className={styles.cardActions}>
        <button
          onClick={() => onCancel(req.id)}
          className={cx(buttonStyles.btn, buttonStyles.danger)}
          aria-label={`Cancel request to ${target.name}`}
        >
          Cancel
        </button>
      </div>
    </li>
  );
}

/** ---- Main Page ---- */
export default function FriendsRequests() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const snapshotRef = useRef(initialState);
  const abortRef = useRef(null);
  const [activeTab, setActiveTab] = useState("incoming"); // 'incoming' | 'outgoing'
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    dispatch({ type: "LOAD_START" });
    try {
      const [incRes, outRes] = await Promise.all([
        api.get("/friends/requests/incoming", { signal: ctrl.signal }),
        api.get("/friends/requests/outgoing", { signal: ctrl.signal }),
      ]);
      const incoming = toList(incRes.data);
      const outgoing = toList(outRes.data);
      snapshotRef.current = { incoming, outgoing, loading: false, error: null };
      dispatch({ type: "LOAD_SUCCESS", incoming, outgoing });
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      if (DEBUG) console.error(err);
      toast.error("Failed to load friend requests");
      dispatch({ type: "LOAD_ERROR", error: err?.message });
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  /** Actions (optimistic) */
  const respond = useCallback(
    async (requestId, accept) => {
      const id = String(requestId);
      const before = snapshotRef.current;
      // optimistic remove from incoming
      dispatch({ type: accept ? "OPTIMISTIC_ACCEPT" : "OPTIMISTIC_DECLINE", id });
      try {
        await api.post("/friends/respond", { requestId: id, accept: !!accept });
        toast.success(accept ? "Request accepted" : "Request declined");
        // refresh counts softly
        load();
      } catch (err) {
        toast.error("Failed to respond. Reverting…");
        dispatch({ type: "REVERT", incoming: before.incoming, outgoing: before.outgoing });
      }
    },
    [load]
  );

  const cancelOutgoing = useCallback(
    async (requestId) => {
      const id = String(requestId);
      const before = snapshotRef.current;
      dispatch({ type: "OPTIMISTIC_CANCEL_OUT", id });
      try {
        // Prefer a dedicated cancel endpoint if your backend has one:
        // await api.post("/friends/cancel", { requestId: id });
        // Otherwise, decline your own outgoing on the same endpoint if supported:
        await api.post("/friends/respond", { requestId: id, accept: false });
        toast.success("Request canceled");
        load();
      } catch (err) {
        toast.error("Failed to cancel. Reverting…");
        dispatch({ type: "REVERT", incoming: before.incoming, outgoing: before.outgoing });
      }
    },
    [load]
  );

  /** Filters */
  const filteredIncoming = useMemo(() => {
    if (!q) return state.incoming;
    const qq = q.toLowerCase();
    return state.incoming.filter((r) =>
      (safe(r.senderName, r.requesterName) || "").toLowerCase().includes(qq)
    );
  }, [q, state.incoming]);

  const filteredOutgoing = useMemo(() => {
    if (!q) return state.outgoing;
    const qq = q.toLowerCase();
    return state.outgoing.filter((r) =>
      (safe(r.receiverName, r.targetName) || "").toLowerCase().includes(qq)
    );
  }, [q, state.outgoing]);

  const incCount = state.incoming.length;
  const outCount = state.outgoing.length;

  return (
    <div className={styles.container} role="region" aria-label="Friend Requests">
      <header className={styles.header}>
        <h2 className={styles.title}>Friend Requests</h2>

        <div className={styles.headerRight}>
          <input
            className={cx(styles.searchInput)}
            type="search"
            placeholder="Search requests…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search friend requests"
          />
          <button
            onClick={load}
            className={cx(buttonStyles.btn, buttonStyles.ghost)}
            aria-label="Refresh friend requests"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className={styles.tabs} aria-label="Requests tabs">
        <button
          className={cx(styles.tab, activeTab === "incoming" && styles.tabActive)}
          onClick={() => setActiveTab("incoming")}
          role="tab"
          aria-selected={activeTab === "incoming"}
        >
          Incoming <span className={styles.tabBadge}>{incCount}</span>
        </button>
        <button
          className={cx(styles.tab, activeTab === "outgoing" && styles.tabActive)}
          onClick={() => setActiveTab("outgoing")}
          role="tab"
          aria-selected={activeTab === "outgoing"}
        >
          Outgoing <span className={styles.tabBadge}>{outCount}</span>
        </button>
      </nav>

      {/* Content */}
      {state.loading ? (
        <div className={styles.skeletonWrap} aria-live="polite">
          {/* lightweight skeletons */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      ) : state.error ? (
        <div className={styles.errorBox}>
          <p>Couldn’t load requests.</p>
          <button className={cx(buttonStyles.btn, buttonStyles.primary)} onClick={load}>
            Try again
          </button>
        </div>
      ) : (
        <div className={styles.contentWrap}>
          {activeTab === "incoming" ? (
            filteredIncoming.length === 0 ? (
              <EmptyState
                title="No incoming requests"
                subtitle={q ? "No matches for your search." : "You’ll see requests from people who add you."}
              />
            ) : (
              <ul className={styles.list}>
                {filteredIncoming.map((req) => (
                  <IncomingCard
                    key={req.id}
                    req={req}
                    onAccept={(id) => respond(id, true)}
                    onDecline={(id) => respond(id, false)}
                  />
                ))}
              </ul>
            )
          ) : filteredOutgoing.length === 0 ? (
            <EmptyState
              title="No outgoing requests"
              subtitle={q ? "No matches for your search." : "Send requests from people’s profiles."}
            />
          ) : (
            <ul className={styles.list}>
              {filteredOutgoing.map((req) => (
                <OutgoingCard key={req.id} req={req} onCancel={cancelOutgoing} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Minimal empty state */
function EmptyState({ title, subtitle }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon} aria-hidden>👥</div>
      <h4 className={styles.emptyTitle}>{title}</h4>
      {subtitle && <p className={styles.emptySub}>{subtitle}</p>}
    </div>
  );
}
