// src/pages/Messages.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { enterpriseToast } from "../components/ToastExports";
import { useQueryClient } from "@tanstack/react-query";

import api from "../api/axiosInstance";
import useAuth from "../hooks/useAuth";

import styles from "../stylus/sections/Messages.module.scss";
import buttonStyles from "../stylus/components/Button.module.scss";
import Avatar from "../components/Avatar";
import ProfileLink from "../components/ProfileLink";
import { ListLoader, SectionLoader } from "../components/ui/SectionLoader/SectionLoader";

const POLL_MS = 10000;
const MOBILE_BREAKPOINT = 900;
const TABLET_BREAKPOINT = 1200;
const DEBUG = false;

/* ================================ utils ================================= */
const isSmall = () =>
  typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT;

const parseBool = (v) =>
  v === true || v === "true" || v === 1 || v === "1" || v === "yes";

const avatarOf = (u) =>
  (typeof u?.avatar === "string" && u?.avatar) ||
  u?.avatarUrl ||
  u?.friendAvatarUrl ||
  (u?.avatar && (u.avatar.secureUrl || u.avatar.url)) ||
  u?.photoUrl ||
  u?.profileImageUrl ||
  u?.imageUrl ||
  (u?.profile && u.profile.avatarUrl) ||
  null;

const capCount = (n, max = 99) => (n > max ? `${max}+` : String(n));

const fmtClockOrDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString();
};

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const dateLabel = (iso, t) => {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const yday = new Date();
  yday.setDate(today.getDate() - 1);
  if (sameDay(d, today)) return t('messages.today');
  if (sameDay(d, yday)) return t('messages.yesterday');
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const timeAgo = (iso, t) => {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s ${t('messages.ago')}`;
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ${t('messages.ago')}`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ${t('messages.ago')}`;
  const d = h / 24;
  return `${Math.floor(d)}d ${t('messages.ago')}`;
};

/** Normalize server shapes + include system/meta for event cards */
function normalizeMessage(raw) {
  const extractContent = (val) => {
    if (val == null) return "";
    if (typeof val === "string") return val;
    if (Array.isArray(val)) {
      try {
        return String.fromCharCode(...val);
      } catch {
        return JSON.stringify(val);
      }
    }
    if (typeof val === "object") {
      try {
        return val.text ?? val.content ?? JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val);
  };

  const type =
    (raw?.type && String(raw.type).toUpperCase()) ||
    (raw?.system ? "SYSTEM" : "TEXT");

  const meta = raw?.meta || raw?.payload || null;

  return {
    id: raw?.id ?? raw?.messageId ?? raw?._id ?? null,
    content: extractContent(raw?.content ?? raw?.text),
    type,
    meta,
    senderId: raw?.senderId ?? raw?.sender?.id ?? null,
    recipientId: raw?.recipientId ?? raw?.recipient?.id ?? null,
    createdAt: raw?.sentAt ?? raw?.createdAt ?? raw?.timestamp ?? null,
  };
}

/* ============================ local metadata ============================ */
const LS = {
  PINNED: "messages.pinned",
  STARRED: "messages.starred",
  ARCHIVED: "messages.archived",
  SNOOZED: "messages.snoozed.map", // { id: ts }
  PREFS: "messages.prefs",
  PANE_W: "messages.pane.width",
};

const lsGetSet = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
};
const lsSaveSet = (key, set) => {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {}
};
const lsGetMap = (key) => {
  try {
    return new Map(Object.entries(JSON.parse(localStorage.getItem(key) || "{}")));
  } catch {
    return new Map();
  }
};
const lsSaveMap = (key, map) => {
  try {
    const obj = {};
    for (const [k, v] of map.entries()) obj[k] = v;
    localStorage.setItem(key, JSON.stringify(obj));
  } catch {}
};
const lsGetPrefs = () => {
  try {
    return JSON.parse(localStorage.getItem(LS.PREFS)) || {};
  } catch {
    return {};
  }
};
const lsSavePrefs = (obj) => {
  try {
    localStorage.setItem(LS.PREFS, JSON.stringify(obj || {}));
  } catch {}
};

/* ============================== UI pieces =============================== */

function ThreadItem({
  data,
  active,
  onClick,
  onTogglePin,
  onToggleStar,
  onToggleArchive,
  onToggleSnooze,
  selectionMode,
  selected,
  onToggleSelect,
}) {
  const { t } = useTranslation();
  return (
    <li
      className={[
        styles.friendItem,
        active ? styles.friendItemActive : "",
        data.unread > 0 ? styles.friendItemUnread : "",
        data.pinned ? styles.friendItemPinned : "",
        data.starred ? styles.friendItemStarred : "",
        data.archived ? styles.friendItemArchived : "",
        data.snoozedUntil && Date.now() < data.snoozedUntil
          ? styles.friendItemSnoozed
          : "",
      ].join(" ")}
      onClick={onClick}
    >
      {selectionMode && (
        <input
          type="checkbox"
          className={styles.selectBox}
          checked={!!selected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(data.id);
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label={t('messages.selectConversation')}
        />
      )}

      <Avatar
        user={{ id: data.id, name: data.name, avatarUrl: data.avatar }}
        size="md"
        className={styles.friendAvatar}
      />
      <div className={styles.friendMain}>
        <div className={styles.friendTop}>
          <span
            className={styles.friendName}
            onClick={(e) => e.stopPropagation()}
          >
            <ProfileLink userId={data.id}>{data.name}</ProfileLink>
          </span>
          <span className={styles.friendTime}>
            {data.snoozedUntil && Date.now() < data.snoozedUntil
              ? t('messages.snoozed')
              : fmtClockOrDate(data.lastAt)}
          </span>
        </div>
        <div className={styles.friendBottom}>
          <span className={styles.friendLast}>{data.lastText || ""}</span>
          <div className={styles.friendMeta}>
            {data.unread > 0 && (
              <span className={styles.badge}>{capCount(data.unread)}</span>
            )}
            {data.starred && (
              <span className={styles.starGlyph} title={t('messages.starred')}>
                ★
              </span>
            )}
            {data.pinned && (
              <span className={styles.pinGlyph} title={t('messages.pinned')}>
                📌
              </span>
            )}
            {data.snoozedUntil && Date.now() < data.snoozedUntil && (
              <span className={styles.snoozeGlyph} title={t('messages.snoozed')}>
                ⏰
              </span>
            )}
          </div>
        </div>
      </div>

      {/* tiny inline quick actions (still available on hover) */}
      <div
        className={styles.friendQuickActions}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={`${styles.iconBtn} ${
            data.pinned ? styles.iconBtnActive : ""
          }`}
          title={data.pinned ? t('messages.unpin') : t('messages.pin')}
          onClick={() => onTogglePin(data.id)}
          aria-label={data.pinned ? t('messages.unpinConversation') : t('messages.pinConversation')}
        >
          📌
        </button>
        <button
          className={`${styles.iconBtn} ${
            data.starred ? styles.iconBtnActive : ""
          }`}
          title={data.starred ? t('messages.unstar') : t('messages.star')}
          onClick={() => onToggleStar(data.id)}
          aria-label={data.starred ? t('messages.unstarConversation') : t('messages.starConversation')}
        >
          ★
        </button>
        <button
          className={`${styles.iconBtn} ${
            data.archived ? styles.iconBtnActiveDanger : ""
          }`}
          title={data.archived ? t('messages.unarchive') : t('messages.archive')}
          onClick={() => onToggleArchive(data.id)}
          aria-label={
            data.archived ? t('messages.unarchiveConversation') : t('messages.archiveConversation')
          }
        >
          🗂️
        </button>
        <button
          className={`${styles.iconBtn} ${
            data.snoozedUntil && Date.now() < data.snoozedUntil
              ? styles.iconBtnActive
              : ""
          }`}
          title={
            data.snoozedUntil && Date.now() < data.snoozedUntil
              ? t('messages.unsnooze')
              : t('messages.snooze8h')
          }
          onClick={() => onToggleSnooze(data.id)}
          aria-label={t('messages.toggleSnooze')}
        >
          ⏰
        </button>
      </div>
    </li>
  );
}

/** Message bubble (for normal chat messages) */
function Bubble({ mine, children }) {
  return (
    <div
      className={[
        styles.msgBubble,
        mine ? styles.msgBubbleMine : styles.msgBubbleTheirs,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/** Inline event card for contact-request system messages */
function ContactEventCard({ msg, currentUserId, partner }) {
  const { t } = useTranslation();
  const n = normalizeMessage(msg);
  const fields = n?.meta?.fields || [];
  const status = (n?.meta?.status || "pending").toLowerCase();
  const isMine = String(n.senderId) === String(currentUserId);

  return (
    <div
      className={[styles.eventCard, styles[`event-${status}`] || ""].join(" ")}
      data-dedupe-key={n?.meta?.dedupeKey || undefined}
    >
      <div className={styles.eventEmoji} aria-hidden>
        🔐
      </div>
      <div className={styles.eventBody}>
        <div className={styles.eventTitle}>
          {isMine ? t('messages.youRequested') : t('messages.theyRequested')} {fields.join(" & ")}
        </div>
        <div className={styles.eventStatus}>
          {t('messages.status')}:{" "}
          <strong className={styles[`eventStatus-${status}`]}>{status}</strong>
        </div>
        <div className={styles.eventTime}>{fmtClockOrDate(n.createdAt)}</div>
      </div>
    </div>
  );
}

/** Row that decides between bubble vs event card */
function MessageRow({ raw, myId, selected, selectedDetails }) {
  const { t } = useTranslation();
  const n = normalizeMessage(raw);
  const mine = myId && n.senderId && String(n.senderId) === String(myId);

  const copy = () => {
    try {
      navigator.clipboard?.writeText(n.content || "");
      enterpriseToast.success(t('messages.copiedMessage'));
    } catch {}
  };

  if (
    n.type === "SYSTEM" &&
    n.meta &&
    (n.meta.kind === "contact_request" || n.meta.category === "contact_request")
  ) {
    return (
      <div className={styles.msgRowEvent} data-mid={n.id || ""}>
        <ContactEventCard
          msg={raw}
          currentUserId={myId}
          partner={selectedDetails || selected}
        />
      </div>
    );
  }

  return (
    <div
      className={[
        styles.msgRow,
        mine ? styles.msgRowMine : styles.msgRowTheirs,
      ].join(" ")}
      onDoubleClick={copy}
      title={t('messages.doubleClickToCopy')}
      data-mid={n.id || ""}
    >
      {!mine && (
        <span onClick={(e) => e.stopPropagation()}>
          <ProfileLink userId={n.senderId}>
            <Avatar
              user={{
                id: n.senderId,
                name:
                  (selectedDetails &&
                    (selectedDetails.displayName || selectedDetails.name)) ||
                  selected?.name,
                avatarUrl:
                  (selectedDetails &&
                    (selectedDetails.avatarUrl ||
                      selectedDetails.profileImageUrl)) ||
                  (selected && selected.avatar) ||
                  null,
              }}
              size="sm"
              className={styles.msgAvatar}
            />
          </ProfileLink>
        </span>
      )}

      <Bubble mine={mine}>{n.content}</Bubble>

      {mine && (
        <span onClick={(e) => e.stopPropagation()}>
          <ProfileLink userId={myId}>
            <Avatar user="me" size="sm" className={styles.msgAvatar} />
          </ProfileLink>
        </span>
      )}
    </div>
  );
}

/* ============================== Main page =============================== */

export default function Messages() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const myId = user?.id != null ? String(user.id) : null;

  const location = useLocation();
  const navigate = useNavigate();
  const { threadId: paramUserId } = useParams();

  const queryClient = useQueryClient();

  // helper: invalidate counts + notify header hooks (useUnreadCount/useCounts)
  const kickCounts = useCallback(() => {
    try {
      queryClient.invalidateQueries({ queryKey: ["counts"] });
    } catch {}
    try {
      window.dispatchEvent(new Event("messages:updated"));
    } catch {}
  }, [queryClient]);

  const search = new URLSearchParams(location.search || "");
  const prefillFromQuery = search.get("compose") || "";
  const focusFromQuery = parseBool(search.get("focus"));

  const selectedUserIdFromNav = useMemo(() => {
    const s =
      (paramUserId ?? location.state?.selectedUserId ?? "").toString().trim();
    return s || null;
  }, [paramUserId, location.state?.selectedUserId]);

  const selectedUserNameFromNav = location.state?.selectedUserName || null;
  const prefillMessageFromNav =
    location.state?.prefillMessage || prefillFromQuery || "";
  const focusComposerFromNav =
    !!(location.state?.focusComposer || focusFromQuery);
  const hasDeepLinkTarget = !!selectedUserIdFromNav;

  /* ------------------------------ UI state ------------------------------ */
  const [showThreads, setShowThreads] = useState(
    () => !isSmall() || !hasDeepLinkTarget
  );
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);

  const [selected, setSelected] = useState(() =>
    hasDeepLinkTarget
      ? {
          id: String(selectedUserIdFromNav),
          name: selectedUserNameFromNav || t('messages.user'),
          temp: true,
        }
      : null
  );

  const [messages, setMessages] = useState([]);
  const [initialLoadingMessages, setInitialLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [selectedDetails, setSelectedDetails] = useState(null);

  /* -------- Toolbar state (search / filters / sort / prefs / bulk) ------- */
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  const [filter, setFilter] = useState("all"); // all | unread | pinned | snoozed | archived

  const [pinned, setPinned] = useState(() => lsGetSet(LS.PINNED));
  const [starred, setStarred] = useState(() => lsGetSet(LS.STARRED));
  const [archived, setArchived] = useState(() => lsGetSet(LS.ARCHIVED));
  const [snoozed, setSnoozed] = useState(() => lsGetMap(LS.SNOOZED)); // id -> ts

  const [prefs, setPrefs] = useState(() => ({
    compact: !!lsGetPrefs().compact,
    hideRead: !!lsGetPrefs().hideRead, // hide read in "all"
  }));

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  // pane resizer
  const [paneW, setPaneW] = useState(() => {
    try {
      return localStorage.getItem(LS.PANE_W) || "";
    } catch {
      return "";
    }
  });
  const resizingRef = useRef(false);

  // Menus
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showConvMenu, setShowConvMenu] = useState(false);
  const mainMenuRef = useRef(null);
  const convMenuRef = useRef(null);

  // Find-in-chat
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [findIndex, setFindIndex] = useState(0);

  /* --------------------------------- refs -------------------------------- */
  const endRef = useRef(null);
  const composerRef = useRef(null);
  const pollRef = useRef(null);
  const currentFetchCtrl = useRef(null);
  const lastMsgIdRef = useRef(null);
  const deepLinkReconciledRef = useRef(false);
  const prevUnreadChatsRef = useRef(null);

  // floating “jump to bottom” button
  const [showJump, setShowJump] = useState(false);
  const scrollAreaRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  };

  /* ---------------------- prepare list + date separators ------------------ */
  const prepared = useMemo(() => {
    const seen = new Set();
    const unique = [];
    for (const m of messages) {
      const n = normalizeMessage(m);
      const key = n.id || n?.meta?.dedupeKey;
      if (!key || !seen.has(key)) {
        if (key) seen.add(key);
        unique.push(m);
      }
    }

    const out = [];
    let last = "";
    for (const m of unique) {
      const n = normalizeMessage(m);
      const label = dateLabel(n.createdAt, t);
      if (label !== last) {
        out.push({ type: "date", label, key: `sep-${label}-${n.createdAt}` });
        last = label;
      }
      out.push({
        type: "msg",
        msg: m,
        key: n.id || n?.meta?.dedupeKey || Math.random().toString(36),
      });
    }
    return out;
  }, [messages]);

  // Plain list of normalized msgs for search-in-chat
  const chatMsgs = useMemo(
    () =>
      prepared
        .filter((x) => x.type === "msg")
        .map((x) => normalizeMessage(x.msg)),
    [prepared]
  );

  const findMatches = useMemo(() => {
    const q = (findQuery || "").trim().toLowerCase();
    if (!q) return [];
    return chatMsgs.filter((m) => (m.content || "").toLowerCase().includes(q));
  }, [chatMsgs, findQuery]);

  const activeFindMsgId = findMatches[findIndex]?.id || null;

  useEffect(() => {
    // Reset index if query changed
    setFindIndex(0);
  }, [findQuery]);

  useEffect(() => {
    if (!activeFindMsgId) return;
    // Scroll the match into view
    const el = document.querySelector(`[data-mid="${activeFindMsgId}"]`);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeFindMsgId]);

  /* -------------------- ensure thread & reconcile deep link --------------- */
  useEffect(() => {
    if (!hasDeepLinkTarget || deepLinkReconciledRef.current) return;
    const toId = String(selectedUserIdFromNav);
    (async () => {
      try {
        await api.post("/api/messages/ensure-thread", { userId: toId });
      } catch (e) {
        if (DEBUG) console.error("ensure-thread failed:", e);
      } finally {
        deepLinkReconciledRef.current = true;
        setSelected((prev) => {
          if (!prev || String(prev.id) !== toId) {
            return {
              id: toId,
              name: selectedUserNameFromNav || "User",
              temp: true,
            };
          }
          return prev;
        });
        navigate(`/app/messages/thread/${toId}${location.search || ""}`, {
          replace: true,
          state: { selectedUserId: toId },
        });
        if (isSmall()) setShowThreads(false);
        if (prefillMessageFromNav)
          setNewMessage((prev) => prev || prefillMessageFromNav);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDeepLinkTarget, selectedUserIdFromNav]);

  /* ------------------------------ load threads ---------------------------- */
  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const { data } = await api.get("/api/messages/threads", {
        params: { limit: 120 },
      });
      const listRaw = Array.isArray(data)
        ? data
        : data?.items ?? data?.content ?? [];
      const norm = listRaw.map((t) => {
        const id = String(t.userId ?? t.id ?? t.partnerId);
        const snoozeUntil = Number(snoozed.get(id) || 0);
        return {
          id,
          name: t.userName || t.name || t('messages.unknown'),
          avatar: avatarOf(t) || null,
          lastText: t.lastText || "",
          lastAt: t.lastAt || t.lastTime || null,
          unread: Number(t.unread || t.unreadCount || 0),
          pinned: pinned.has(id),
          starred: starred.has(id),
          archived: archived.has(id),
          snoozedUntil: snoozeUntil > 0 ? snoozeUntil : null,
        };
      });

      // recency
      norm.sort((a, b) => {
        const at = a.lastAt ? new Date(a.lastAt).getTime() : 0;
        const bt = b.lastAt ? new Date(b.lastAt).getTime() : 0;
        return bt - at;
      });

      setThreads(norm);

      // Detect unread-chats change and kick header if needed
      const unreadChats = norm.reduce(
        (n, t) => n + (t.unread > 0 ? 1 : 0),
        0
      );
      if (prevUnreadChatsRef.current === null) {
        prevUnreadChatsRef.current = unreadChats;
      } else if (prevUnreadChatsRef.current !== unreadChats) {
        prevUnreadChatsRef.current = unreadChats;
        kickCounts();
      }
    } catch (e) {
      if (DEBUG) console.error(e);
      toast.error("Couldn’t load conversations");
    } finally {
      setLoadingThreads(false);
    }
  }, [kickCounts, pinned, starred, archived, snoozed]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (hasDeepLinkTarget || !threads.length) return;
    setSelected((prev) => prev ?? threads[0] ?? null);
  }, [threads, hasDeepLinkTarget]);

  /* ------------------------- contact request lists ------------------------ */
  const loadContactRequests = useCallback(async () => {
    try {
      const [inc, out] = await Promise.all([
        api.get("/contact/requests/incoming"),
        api.get("/contact/requests/outgoing"),
      ]);
      setIncomingRequests(Array.isArray(inc.data) ? inc.data : []);
      setOutgoingRequests(Array.isArray(out.data) ? out.data : []);
    } catch (e) {
      if (DEBUG) console.error("contact requests:", e);
    }
  }, []);
  useEffect(() => {
    loadContactRequests();
    const t = setInterval(loadContactRequests, POLL_MS * 2);
    return () => clearInterval(t);
  }, [loadContactRequests]);

  /* -------------------- cancel in-flight & initial load ------------------- */
  const cancelInFlight = () => {
    try {
      currentFetchCtrl.current?.abort();
    } catch {}
  };

  const loadConversationInitial = useCallback(
    async (peerId) => {
      if (!peerId) return;
      cancelInFlight();
      const ctrl = new AbortController();
      currentFetchCtrl.current = ctrl;
      setInitialLoadingMessages(true);
      try {
        const { data } = await api.get(
          `/api/messages/conversation/${peerId}`,
          {
            signal: ctrl.signal,
          }
        );
        const list = (Array.isArray(data) ? data : []).map(normalizeMessage);
        setMessages(list);
        lastMsgIdRef.current = list.at(-1)?.id ?? null;

        try {
          await api.post(`/api/messages/read/${peerId}`);
          kickCounts();
        } catch {}
        setThreads((prev) =>
          prev.map((t) =>
            String(t.id) === String(peerId) ? { ...t, unread: 0 } : t
          )
        );
        setTimeout(() => scrollToBottom(false), 0);
      } catch (e) {
        if (e?.name !== "CanceledError" && e?.name !== "AbortError") {
          toast.error("Couldn’t load messages");
        }
      } finally {
        setInitialLoadingMessages(false);
      }
    },
    [kickCounts]
  );

  const loadConversationSilent = useCallback(
    async (peerId) => {
      if (!peerId) return;
      try {
        const { data } = await api.get(`/api/messages/conversation/${peerId}`);
        const list = (Array.isArray(data) ? data : []).map(normalizeMessage);
        const latest = list.at(-1)?.id ?? null;
        if (latest !== lastMsgIdRef.current || list.length !== messages.length) {
          lastMsgIdRef.current = latest;
          setMessages(list);
          scrollToBottom(true);
        }
      } catch {}
    },
    [messages.length]
  );

  useEffect(() => {
    if (selected?.id) loadConversationInitial(selected.id);
    return () => cancelInFlight();
  }, [selected?.id, loadConversationInitial]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      loadThreads();
      if (selected?.id) loadConversationSilent(selected.id);
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [selected?.id, loadThreads, loadConversationSilent]);

  /* ------------------------ selected user details ------------------------ */
  useEffect(() => {
    const run = async () => {
      if (!selected?.id) {
        setSelectedDetails(null);
        return;
      }
      try {
        const { data } = await api.get(`/api/users/${selected.id}`);
        setSelectedDetails(data);
      } catch (e) {
        setSelectedDetails(null);
        if (DEBUG) console.error("user details:", e);
      }
    };
    run();
  }, [selected?.id]);

  /* ---------------------------- focus & prefill --------------------------- */
  useEffect(() => {
    if ((focusComposerFromNav || prefillMessageFromNav) && selected?.id) {
      if (prefillMessageFromNav && !newMessage) {
        setNewMessage(prefillMessageFromNav);
      }
      if (composerRef.current) composerRef.current.focus();
      scrollToBottom(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusComposerFromNav, prefillMessageFromNav, selected?.id]);

  /* ----------------------------- toolbar logic ---------------------------- */
  const filteredSortedThreads = useMemo(() => {
    let list = threads.slice();

    const now = Date.now();
    const isSnoozedActive = (t) => t.snoozedUntil && now < t.snoozedUntil;

    if (filter !== "archived") list = list.filter((t) => !t.archived);

    if (prefs.hideRead && filter === "all") list = list.filter((t) => t.unread > 0);

    if (filter === "unread") list = list.filter((t) => t.unread > 0 && !isSnoozedActive(t));
    if (filter === "pinned") list = list.filter((t) => t.pinned && !isSnoozedActive(t));
    if (filter === "archived") list = list.filter((t) => t.archived);
    if (filter === "snoozed") list = list.filter((t) => isSnoozedActive(t));

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => {
        const name = (t.name || "").toLowerCase();
        const last = (t.lastText || "").toLowerCase();
        return name.includes(q) || last.includes(q);
      });
    }

    // Default sort: pinned top (except archived view), then by recent activity
    list.sort((a, b) => {
      if (filter !== "archived") {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
      }
      // Always sort by recent activity (most recent first)
      const at = a.lastAt ? new Date(a.lastAt).getTime() : 0;
      const bt = b.lastAt ? new Date(b.lastAt).getTime() : 0;
      return bt - at;
    });

    return list;
  }, [threads, filter, query, prefs.hideRead]);

  const counts = useMemo(() => {
    const now = Date.now();
    const total = threads.length;
    const unread = threads.filter((t) => t.unread > 0 && !t.archived).length;
    const pinnedCount = threads.filter((t) => t.pinned && !t.archived).length;
    const archivedCount = threads.filter((t) => t.archived).length;
    const snoozedCount = threads.filter(
      (t) => t.snoozedUntil && now < t.snoozedUntil
    ).length;
    return {
      total,
      unread,
      pinned: pinnedCount,
      archived: archivedCount,
      snoozed: snoozedCount,
    };
  }, [threads]);

  /* ---------------------------- toolbar actions --------------------------- */
  const togglePref = (key) => {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] };
      lsSavePrefs(next);
      return next;
    });
  };

  const onTogglePin = (id) => {
    setPinned((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      lsSaveSet(LS.PINNED, next);
      setThreads((list) =>
        list.map((t) => (t.id === id ? { ...t, pinned: next.has(id) } : t))
      );
      return next;
    });
  };

  const onToggleStar = (id) => {
    setStarred((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      lsSaveSet(LS.STARRED, next);
      setThreads((list) =>
        list.map((t) => (t.id === id ? { ...t, starred: next.has(id) } : t))
      );
      return next;
    });
  };

  const onToggleArchive = (id) => {
    setArchived((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      lsSaveSet(LS.ARCHIVED, next);
      setThreads((list) =>
        list.map((t) => (t.id === id ? { ...t, archived: next.has(id) } : t))
      );
      return next;
    });
  };

  const setSnoozeForHours = (id, hours) => {
    setSnoozed((prev) => {
      const next = new Map(prev);
      if (!hours) {
        next.delete(id); // unsnooze
      } else {
        const until = Date.now() + hours * 60 * 60 * 1000;
        next.set(id, until);
      }
      lsSaveMap(LS.SNOOZED, next);
      setThreads((list) =>
        list.map((t) =>
          t.id === id ? { ...t, snoozedUntil: next.get(id) || null } : t
        )
      );
      return next;
    });
  };

  const onToggleSnooze = (id) => {
    const until = Number(snoozed.get(id) || 0);
    if (until && Date.now() < until) setSnoozeForHours(id, 0);
    else setSnoozeForHours(id, 8);
  };

  const markAllRead = async () => {
    const targets = threads.filter((t) => t.unread > 0 && !t.archived);
    if (!targets.length) {
      toast.info(t('messages.allCaughtUp'));
      return;
    }
    try {
      await Promise.allSettled(
        targets.map((t) => api.post(`/api/messages/read/${t.id}`))
      );
      setThreads((prev) =>
        prev.map((t) => (t.unread > 0 ? { ...t, unread: 0 } : t))
      );
      kickCounts();
      toast.success(t('messages.markedAllAsRead'));
    } catch {
      toast.error("Couldn’t mark all as read");
    }
  };

  const refresh = () => loadThreads();

  const startNewChatById = async (id) => {
    const userId = String(id || "").trim();
    if (!userId) return;
    try {
      await api.post("/api/messages/ensure-thread", { userId });
    } catch {}
    navigate(`/app/messages/thread/${userId}`, {
      replace: true,
      state: { selectedUserId: userId, focusComposer: true },
    });
  };

  const exportConversation = () => {
    if (!selected?.id || !prepared?.length) {
      toast.info(t('messages.nothingToExport'));
      return;
    }
    const lines = [];
    for (const it of prepared) {
      if (it.type === "date") {
        lines.push(`--- ${it.label} ---`);
        continue;
      }
      const n = normalizeMessage(it.msg);
      const who = String(n.senderId) === String(myId) ? "Me" : "Them";
      const when = n.createdAt ? new Date(n.createdAt).toLocaleString() : "";
      lines.push(`[${when}] ${who}: ${n.content}`);
    }
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `chat-${selected.id}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Bulk selection helpers
  const toggleSelectionMode = () => {
    setSelectionMode((s) => !s);
    setSelectedIds(new Set());
  };
  const onToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const bulkPin = () => {
    for (const id of selectedIds) onTogglePin(id);
    setSelectedIds(new Set());
  };
  const bulkArchive = () => {
    for (const id of selectedIds) onToggleArchive(id);
    setSelectedIds(new Set());
  };
  const bulkMarkRead = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    try {
      await Promise.allSettled(
        ids.map((id) => api.post(`/api/messages/read/${id}`))
      );
      setThreads((prev) =>
        prev.map((t) => (ids.includes(t.id) ? { ...t, unread: 0 } : t))
      );
      kickCounts();
    } catch {}
    setSelectedIds(new Set());
  };

  /* ----------------------------- keyboard nav ---------------------------- */
  // Keyboard navigation removed for cleaner UI

  /* --------------------------- presence + title --------------------------- */
  const presence = useMemo(() => {
    const d = selectedDetails;
    if (!d) return "";
    if (d.online === true || d.status === "online") return t('messages.online');
    const last =
      d.lastSeen || d.lastActive || d.lastLogin || d.updatedAt || d.lastSeenAt;
    if (last) return `${t('messages.lastSeen')} ${timeAgo(last, t)}`;
    return "";
  }, [selectedDetails]);

  useEffect(() => {
    // show unread total in tab title
    const unreadTotal = threads.reduce((n, t) => n + (t.unread || 0), 0);
    const base = "Messages";
    document.title = unreadTotal > 0 ? `(${capCount(unreadTotal)}) ${base}` : base;
    return () => {
      document.title = base;
    };
  }, [threads]);

  /* --------------------------------- resizer ------------------------------ */
  const onStartResize = (e) => {
    if (isSmall()) return;
    e.preventDefault();
    resizingRef.current = true;
    document.body.classList.add(styles.bodyResizing || "");
  };
  useEffect(() => {
    const onMove = (e) => {
      if (!resizingRef.current) return;
      const x = e.clientX || (e.touches && e.touches[0]?.clientX) || 320;
      const clamped = Math.max(240, Math.min(window.innerWidth * 0.5, x));
      const css = `${Math.round(clamped)}px`;
      setPaneW(css);
      try {
        localStorage.setItem(LS.PANE_W, css);
      } catch {}
      document.documentElement.style.setProperty("--threads-w", css);
    };
    const onUp = () => {
      if (!resizingRef.current) return;
      resizingRef.current = false;
      document.body.classList.remove(styles.bodyResizing || "");
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);
  useEffect(() => {
    if (paneW) document.documentElement.style.setProperty("--threads-w", paneW);
  }, [paneW]);

  /* ------------------------ jump-to-bottom visibility --------------------- */
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const onScroll = () => {
      const away = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowJump(away > 200);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollAreaRef.current]);

  /* ------------------------- close menus on outside ----------------------- */
  useEffect(() => {
    const onClick = (e) => {
      if (showMainMenu && !mainMenuRef.current?.contains(e.target)) {
        setShowMainMenu(false);
      }
      if (showConvMenu && !convMenuRef.current?.contains(e.target)) {
        setShowConvMenu(false);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [showMainMenu, showConvMenu]);

  /* -------------------------------- actions ------------------------------- */
  const handleRespondContact = useCallback(
    async (requestId, accept) => {
      try {
        await api.post(
          `/contact/requests/${requestId}/respond?accept=${accept}`
        );
        await loadContactRequests();
        toast.success(accept ? t('friends.requestAccepted') : t('friends.requestRejected'));
      } catch (e) {
        toast.error(t('friends.failedToUpdateRequest'));
      }
    },
    [loadContactRequests]
  );

  const sendMessage = useCallback(async () => {
    const text = newMessage.trim();
    if (!selected?.id || !text) return;

    try {
      try {
        await api.post("/api/messages/ensure-thread", {
          userId: String(selected.id),
        });
      } catch {}

      await api.post("/api/messages/send", {
        recipientId: String(selected.id),
        content: text,
        viaSms: false,
      });

      setNewMessage("");

      const now = new Date().toISOString();
      const optimistic = {
        id: `tmp-${Date.now()}`,
        content: text,
        senderId: myId,
        recipientId: String(selected.id),
        createdAt: now,
      };

      setMessages((prev) => {
        const next = [...prev, optimistic];
        lastMsgIdRef.current = optimistic.id;
        return next;
      });

      setThreads((prev) =>
        prev.map((t) =>
          String(t.id) === String(selected.id)
            ? { ...t, lastText: text, lastAt: now }
            : t
        )
      );

      scrollToBottom(true);
      loadConversationSilent(selected.id);
      kickCounts();
    } catch {
      toast.error(t('messages.failedToSendMessage'));
    }
  }, [newMessage, selected?.id, myId, loadConversationSilent, kickCounts]);

  const selectThread = (t) => {
    const id = String(t.id);
    if (!selected || String(selected.id) !== id) {
      setSelected(t);
      navigate(`/app/messages/thread/${id}`, {
        replace: true,
        state: { selectedUserId: id },
      });
    }
    if (isSmall()) setShowThreads(false);
  };

  /* --------------------------------- render ------------------------------- */
  return (
    <div className={styles.messagesPageWrapper}>
      <div
        className={styles.layout}
        style={{ "--threads-w": paneW || undefined }}
      >
      {/* THREADS LIST */}
      <aside
        className={[
          styles.threads,
          prefs.compact ? styles.threadsCompact : "",
          !showThreads ? styles.mobileHidden : "",
        ].join(" ")}
      >
        <div className={styles.threadsHeader}>
          <div className={styles.toolbar}>
            {/* row 1: title + minimalist actions */}
            <div className={styles.toolbarRow}>
              <div className={styles.toolbarTitle}>
                <span>Messages</span>
                <span className={styles.toolbarCounts}>
                  <span className={styles.countPill} title="Total threads">
                    {counts.total}
                  </span>
                  <span className={styles.separator}>•</span>
                  <span className={styles.countPillUnread} title="Unread">
                    {counts.unread}
                  </span>
                </span>
              </div>

              <div className={styles.minActions}>
                <button
                  className={styles.iconTextBtn}
                  onClick={() =>
                    startNewChatById(prompt("Enter User ID") || "")
                  }
                  title="Start new chat"
                >
                  ➕ <span>New</span>
                </button>

                {/* Kebab menu (moves most actions here) */}
                <div className={styles.kebabWrap} ref={mainMenuRef}>
                  <button
                    className={styles.kebabBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMainMenu((s) => !s);
                    }}
                    aria-haspopup="menu"
                    aria-expanded={showMainMenu}
                    title="More"
                  >
                    ⋯
                  </button>

                  {showMainMenu && (
                    <div className={styles.menu} role="menu">
                      <div className={styles.menuGroup}>
                        <button className={styles.menuItem} onClick={refresh}>
                          ↻ {t('common.refresh')}
                        </button>
                        <button className={styles.menuItem} onClick={markAllRead}>
                          ✅ Mark all read
                        </button>
                        <button
                          className={styles.menuItem}
                          onClick={toggleSelectionMode}
                        >
                          ☑️ {selectionMode ? "Exit select" : "Bulk select"}
                        </button>
                      </div>

                      <div className={styles.menuGroup}>
                        <button
                          className={styles.menuItem}
                          onClick={() => togglePref("compact")}
                        >
                          {prefs.compact ? "☑︎" : "☐"} Compact list
                        </button>
                        <button
                          className={styles.menuItem}
                          onClick={() => togglePref("hideRead")}
                        >
                          {prefs.hideRead ? "☑︎" : "☐"} Hide read (All)
                        </button>
                      </div>

                      <div className={styles.menuGroup}>
                        <button
                          className={styles.menuItem}
                          onClick={() => setFilter("all")}
                        >
                          • Filter: All
                        </button>
                        <button
                          className={styles.menuItem}
                          onClick={() => setFilter("unread")}
                        >
                          • Filter: Unread ({counts.unread})
                        </button>
                        <button
                          className={styles.menuItem}
                          onClick={() => setFilter("pinned")}
                        >
                          • Filter: Pinned ({counts.pinned})
                        </button>
                        <button
                          className={styles.menuItem}
                          onClick={() => setFilter("snoozed")}
                        >
                          • Filter: Snoozed ({counts.snoozed})
                        </button>
                        <button
                          className={styles.menuItem}
                          onClick={() => setFilter("archived")}
                        >
                          • Filter: Archived ({counts.archived})
                        </button>
                      </div>

                      <div className={styles.menuGroup}>
                        <button
                          className={styles.menuItem}
                          onClick={() => {
                            setPaneW("");
                            localStorage.removeItem(LS.PANE_W);
                            document.documentElement.style.removeProperty(
                              "--threads-w"
                            );
                            toast.success(t('messages.layoutReset'));
                          }}
                        >
                          🧹 Reset layout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* row 2: search only (kept visible) */}
            <div className={styles.toolbarRow}>
              <div className={styles.toolbarSearch}>
                <input
                  ref={searchRef}
                  className={styles.searchInput}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('messages.searchChatsPlaceholder')}
                  aria-label="Search chats"
                />
              </div>
            </div>

            {/* row 3: compact chips + sort (simple) */}
            <div className={styles.toolbarRow}>
              <div
                className={styles.toolbarChips}
                role="tablist"
                aria-label="Filters"
              >
                {["all", "unread", "pinned", "snoozed", "archived"].map((k) => (
                  <button
                    key={k}
                    role="tab"
                    className={`${styles.chip} ${
                      filter === k ? styles.chipActive : ""
                    }`}
                    onClick={() => setFilter(k)}
                    title={k[0].toUpperCase() + k.slice(1)}
                  >
                    {k[0].toUpperCase() + k.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loadingThreads ? (
          <ListLoader count={5} showAvatar={true} />
        ) : filteredSortedThreads.length ? (
          <ul className={styles.threadList}>
            {filteredSortedThreads.map((t) => {
              const active =
                selected?.id && String(selected.id) === String(t.id);
              const isSelected = selectedIds.has(t.id);
              return (
                <ThreadItem
                  key={t.id}
                  data={t}
                  active={!!active}
                  onClick={() =>
                    selectionMode ? onToggleSelect(t.id) : selectThread(t)
                  }
                  onTogglePin={onTogglePin}
                  onToggleStar={onToggleStar}
                  onToggleArchive={onToggleArchive}
                  onToggleSnooze={onToggleSnooze}
                  selectionMode={selectionMode}
                  selected={isSelected}
                  onToggleSelect={onToggleSelect}
                />
              );
            })}
          </ul>
        ) : (
          <div className={styles.threadsEmpty}>
            {query
              ? "No matches for your search."
              : filter === "archived"
              ? "No archived conversations."
              : filter === "pinned"
              ? "No pinned conversations yet."
              : filter === "unread"
              ? "No unread conversations."
              : filter === "snoozed"
              ? "No snoozed conversations."
              : "No conversations yet — start one from a profile!"}
          </div>
        )}
      </aside>

      {/* resizer divider (desktop only) */}
      {!isSmall() && (
        <div
          className={styles.divider}
          onMouseDown={onStartResize}
          onTouchStart={onStartResize}
          title="Drag to resize"
        />
      )}

      {/* CONVERSATION */}
      <section
        className={[styles.conversation, showThreads ? styles.mobileHidden : ""].join(" ")}
      >
        {selected ? (
          <>
            <div className={styles.convHeader}>
              {isSmall() && (
                <button
                  className={styles.backButton}
                  onClick={() => setShowThreads(true)}
                >
                  ← Back
                </button>
              )}

              {(() => {
                const name =
                  (selectedDetails &&
                    (selectedDetails.displayName || selectedDetails.name)) ||
                  selected.name ||
                  "User";
                const headerAvatar =
                  avatarOf(selectedDetails) || avatarOf(selected) || null;
                return (
                  <>
                    <Avatar
                      user={{ id: selected.id, name, avatarUrl: headerAvatar }}
                      size="md"
                      className={styles.convAvatar}
                    />
                    <div className={styles.convHeaderNameWrap}>
                      <ProfileLink userId={selected.id} className={styles.convName}>
                        {name}
                      </ProfileLink>
                      {presence && (
                        <div className={styles.convPresence}>{presence}</div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Conversation kebab (per-thread actions) */}
              <div className={styles.convMenuWrap} ref={convMenuRef}>
                <button
                  className={styles.kebabBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConvMenu((s) => !s);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={showConvMenu}
                  title="Conversation menu"
                >
                  ⋯
                </button>
                {showConvMenu && (
                  <div className={styles.menu} role="menu">
                    <div className={styles.menuGroup}>
                      <button
                        className={styles.menuItem}
                        onClick={() => setShowFind((v) => !v)}
                      >
                        🔎 Find in chat
                      </button>
                      <button
                        className={styles.menuItem}
                        onClick={() =>
                          window.open(`/app/u/${selected.id}`, "_blank")
                        }
                      >
                        👤 View profile
                      </button>
                    </div>

                    <div className={styles.menuGroup}>
                      <button
                        className={styles.menuItem}
                        onClick={() =>
                          onTogglePin(selected.id)
                        }
                      >
                        {pinned.has(selected.id) ? "📌 Unpin" : "📌 Pin"}
                      </button>
                      <button
                        className={styles.menuItem}
                        onClick={() =>
                          setSnoozeForHours(selected.id, 8)
                        }
                      >
                        ⏰ Snooze 8h
                      </button>
                      <button
                        className={styles.menuItem}
                        onClick={() =>
                          setSnoozeForHours(selected.id, 24)
                        }
                      >
                        ⏰ Snooze 1 day
                      </button>
                      <button
                        className={styles.menuItem}
                        onClick={() =>
                          setSnoozeForHours(selected.id, 24 * 7)
                        }
                      >
                        ⏰ Snooze 1 week
                      </button>
                      <button
                        className={styles.menuItem}
                        onClick={() => setSnoozeForHours(selected.id, 0)}
                      >
                        ⏰ Unsnooze
                      </button>
                    </div>

                    <div className={styles.menuGroup}>
                      <button
                        className={styles.menuItem}
                        onClick={() => onToggleArchive(selected.id)}
                      >
                        {archived.has(selected.id)
                          ? "🗂️ Unarchive"
                          : "🗂️ Archive"}
                      </button>
                      <button className={styles.menuItem} onClick={exportConversation}>
                        ⬇️ Export (.txt)
                      </button>
                    </div>

                    <div className={styles.menuGroup}>
                      <button
                        className={styles.menuItem}
                        onClick={() => {
                          toast.info("Marked unread (local)");
                          setThreads((prev) =>
                            prev.map((t) =>
                              t.id === selected.id ? { ...t, unread: 1 } : t
                            )
                          );
                          kickCounts();
                        }}
                      >
                        🔔 Mark unread (local)
                      </button>
                      <button
                        className={`${styles.menuItem} ${styles.menuDanger}`}
                        onClick={() => toast.success("Reported (placeholder)")}
                      >
                        🚩 Report / Block
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Inline banners */}
            <div className={styles.contactBanners}>
              {incomingRequests
                .filter((r) => String(r.requesterId) === String(selected.id))
                .map((r) => (
                  <div key={r.id} className={styles.bannerIncoming}>
                    <div>
                      {r.requesterName} requested your {r.type?.toLowerCase()}.
                    </div>
                    <div className={styles.bannerActions}>
                      <button
                        className={`${buttonStyles.btn} ${buttonStyles.primary}`}
                        onClick={() => handleRespondContact(r.id, true)}
                      >
                        Accept
                      </button>
                      <button
                        className={`${buttonStyles.btn} ${buttonStyles.danger}`}
                        onClick={() => handleRespondContact(r.id, false)}
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}

              {outgoingRequests
                .filter((r) => String(r.targetId) === String(selected.id))
                .map((r) => (
                  <div key={r.id} className={styles.bannerOutgoing}>
                    <div>
                      {t('messages.youRequestedTheir')} {r.type?.toLowerCase()}. {t('messages.status')}:{" "}
                      {(r.status || "").toLowerCase()}.
                    </div>
                    {r.status === "APPROVED" && selectedDetails && (
                      <div className={styles.bannerReveal}>
                        {r.type === "EMAIL" && selectedDetails.email && (
                          <span>Email: {selectedDetails.email}</span>
                        )}
                        {r.type === "PHONE" && selectedDetails.phone && (
                          <span>Phone: {selectedDetails.phone}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Find-in-chat bar */}
            {showFind && (
              <div className={styles.findBar}>
                <input
                  className={styles.findInput}
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  placeholder={t('messages.findInConversation')}
                  autoFocus
                />
                <div className={styles.findCount}>
                  {findMatches.length
                    ? `${findIndex + 1} / ${findMatches.length}`
                    : "0 / 0"}
                </div>
                <button
                  className={styles.findBtn}
                  disabled={!findMatches.length}
                  onClick={() =>
                    setFindIndex((i) =>
                      i - 1 < 0 ? findMatches.length - 1 : i - 1
                    )
                  }
                  title="Previous match"
                >
                  ↑
                </button>
                <button
                  className={styles.findBtn}
                  disabled={!findMatches.length}
                  onClick={() =>
                    setFindIndex((i) => (i + 1) % (findMatches.length || 1))
                  }
                  title="Next match"
                >
                  ↓
                </button>
                <button
                  className={styles.findClose}
                  onClick={() => {
                    setShowFind(false);
                    setFindQuery("");
                  }}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            )}

            <div className={styles.messagesWindow} ref={scrollAreaRef}>
              {initialLoadingMessages ? (
                <SectionLoader message="Loading messages..." />
              ) : prepared.length ? (
                prepared.map((it) =>
                  it.type === "date" ? (
                    <div key={it.key} className={styles.dateSeparator}>
                      {it.label}
                    </div>
                  ) : (
                    <MessageRow
                      key={it.key}
                      raw={it.msg}
                      myId={myId}
                      selected={selected}
                      selectedDetails={selectedDetails}
                    />
                  )
                )
              ) : (
                <div className={styles.threadsEmpty}>
                  No messages yet — say hi 👋
                </div>
              )}
              <div ref={endRef} />
            </div>

            {showJump && (
              <button
                className={styles.jumpToBottom}
                onClick={() => scrollToBottom(true)}
                title="Jump to latest"
              >
                ↓ New
              </button>
            )}

            <div className={styles.sendBox}>
              <textarea
                className={styles.textarea}
                ref={composerRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={t('messages.typeMessage')}
                rows={2}
              />
              <button className={styles.sendButton} onClick={sendMessage}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className={styles.noConversation}>
            <span style={{ fontSize: "2rem" }}>💬</span>
            <p>Select a conversation to start chatting.</p>
          </div>
        )}
      </section>
    </div>
    </div>
  );
}
