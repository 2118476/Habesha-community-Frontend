import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  useDeferredValue,
} from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axiosInstance";
import { toast } from "react-toastify";
import useAuth from "../hooks/useAuth";

import styles from "../stylus/sections/Friends.module.scss";
import formStyles from "../stylus/components/Form.module.scss";
import buttonStyles from "../stylus/components/Button.module.scss";
import ProfileChip from "../components/ProfileChip";

/* ----------------------------- helpers ----------------------------- */

const API_V2 = "/api/friends";

const asArray = (v) => (Array.isArray(v) ? v : v?.content ?? []);
const idOf = (u) =>
  u?.id ?? u?.userId ?? u?._id ?? u?.profileId ?? u?.accountId ?? null;
const usernameOf = (u) => u?.username ?? u?.userName ?? u?.handle ?? null;
const nameOf = (u) =>
  u?.displayName || u?.name || u?.fullName || usernameOf(u) || "User";
const avatarOf = (u) =>
  u?.avatarUrl ||
  u?.friendAvatarUrl ||
  u?.avatar?.secureUrl ||
  u?.avatar?.url ||
  u?.photoUrl ||
  u?.profileImageUrl ||
  u?.imageUrl ||
  u?.profile?.avatarUrl ||
  null;

const normalizeUser = (u) =>
  !u
    ? null
    : {
        ...u,
        id: idOf(u),
        username: usernameOf(u),
        displayName: nameOf(u),
        avatarUrl: avatarOf(u),
      };

/* route + display helpers */
const isEmailish = (s) => typeof s === "string" && s.includes("@");
const safeHandle = (u) => {
  const un = (usernameOf(u) || "").trim();
  return un && !isEmailish(un) ? `@${un}` : null;
};
const profileUrlOf = (u) => {
  const id = idOf(u);
  const un = (usernameOf(u) || "").trim();
  if (id != null) return `/app/profile/${id}`;
  if (un && !isEmailish(un)) return `/app/u/${encodeURIComponent(un)}`;
  return "/app/profile/unknown";
};

const TABS = [
  { id: "friends", label: "Friends" },
  { id: "incoming", label: "Incoming" },
  { id: "outgoing", label: "Outgoing" },
  { id: "suggestions", label: "Suggestions" },
  { id: "search", label: "Search" },
];

/* optional icons (falls back to text) */
let Icons = {};
try {
  Icons = require("lucide-react");
} catch {}
const {
  Users = () => null,
  UserPlus = () => null,
  UserMinus = () => null,
  UserSearch = () => null,
  X = () => null,
  Check = () => null,
} = Icons;

/* ----------------------------- tiny UI atoms ----------------------------- */

const cx = (...c) => c.filter(Boolean).join(" ");

const Icon = ({ I, label, size = 18, className }) =>
  typeof I === "function" ? (
    <span
      aria-hidden="true"
      className={cx("ui-icon", className)}
      style={{ display: "inline-grid", placeItems: "center", width: size, height: size }}
    >
      {React.createElement(I, { size, strokeWidth: 2 })}
    </span>
  ) : (
    <span aria-hidden="true" className={cx("ui-icon", className)}>
      {label ?? ""}
    </span>
  );

/* shimmer skeleton */
const Shimmer = ({ height = 56, rounded = 12 }) => (
  <div
    className="friends-shimmer"
    style={{
      height,
      borderRadius: rounded,
      background:
        "linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.10), rgba(0,0,0,0.06))",
      backgroundSize: "200% 100%",
      animation: "friendsShimmer 1.2s linear infinite",
    }}
  />
);

/* keyframes inject once */
const ensureKeyframes = (() => {
  let done = false;
  return () => {
    if (done) return;
    const s = document.createElement("style");
    s.innerHTML = `
      @keyframes friendsShimmer { 
        from { background-position: 200% 0; } 
        to { background-position: -200% 0; } 
      }
    `;
    document.head.appendChild(s);
    done = true;
  };
})();

/* Section wrapper */
const Section = ({ title, actions, children, className }) => (
  <section className={cx(styles.block, "friends-block", className)}>
    <div
      className={cx(styles.blockHeader, "friends-block__header")}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
      }}
    >
      <h4 className={cx(styles.blockTitle, "friends-block__title")}>{title}</h4>
      {actions}
    </div>
    {children}
  </section>
);

/* Row — left side is a single Link (avatar + name + subtext all clickable) */
const PersonRow = ({ user, subtext, right, revealDelay = 0 }) => {
  const to = profileUrlOf(user);
  return (
    <li
      className={cx(styles.listItem, "friends-list__item")}
      data-reveal="up"
      style={{ "--reveal-delay": `${revealDelay}ms` }}
    >
      <Link
        to={to}
        className={cx(styles.rowLink, "friends-row__link")}
        aria-label={`Open ${user?.displayName || user?.username}'s profile`}
      >
        <ProfileChip
          user={user}
          subtext={subtext}
          className="friends-chip"
          data-hide-email="true"
        />
      </Link>

      <div
        className={cx(styles.rowActions, "friends-row__actions")}
        style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}
      >
        {right}
      </div>
    </li>
  );
};

/* ----------------------------- component ----------------------------- */

export default function FriendsPage() {
  const { t } = useTranslation();
  const { user: me, authReady } = useAuth();

  // data
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // UI state
  const [active, setActive] = useState("friends");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // search
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // refs
  const mountedRef = useRef(true);
  const searchDebounceRef = useRef(null);
  const searchInputRef = useRef(null);
  const lastLoadKeyRef = useRef(0);
  const tabScrollRef = useRef(new Map());

  const counts = useMemo(
    () => ({
      friends: friends.length,
      incoming: incoming.length,
      outgoing: outgoing.length,
      suggestions: suggestions.length,
      search: searchResults.length,
    }),
    [friends, incoming, outgoing, suggestions, searchResults]
  );

  /* effects (no loadAll) */
  useEffect(() => {
    ensureKeyframes();
  }, []);

  useEffect(() => {
    if (active === "search") setTimeout(() => searchInputRef.current?.focus(), 0);
  }, [active]);

  const onSwitchTab = useCallback(
    (id) => {
      tabScrollRef.current.set(active, window.scrollY);
      setActive(id);
      requestAnimationFrame(() => {
        const y = tabScrollRef.current.get(id) ?? 0;
        window.scrollTo({ top: y, behavior: "auto" });
      });
    },
    [active]
  );

  /* ----------------------------- API calls ----------------------------- */

  const loadFriends = useCallback(async () => {
    try {
      const { data } = await api.get(`${API_V2}/me`, { params: { page: 0, size: 200 } });
      const list = asArray(data).map(normalizeUser).filter(Boolean);
      if (mountedRef.current) setFriends(list);
    } catch (e) {
      console.error("friends/me:", e?.response?.data || e.message);
      if (mountedRef.current) setFriends([]);
      throw e;
    }
  }, []);

  const loadIncoming = useCallback(async () => {
    try {
      const { data } = await api.get(`/friends/requests/incoming`);
      const list = asArray(data)
        .map((req) =>
          normalizeUser({
            id: req.senderId,
            displayName: req.senderName,
            username: req.senderUsername,
            avatarUrl: req.senderAvatarUrl,
            mutualCount: req.mutualCount,
            lastActive: req.senderLastActive,
            _request: req,
          })
        )
        .filter(Boolean);
      if (mountedRef.current) setIncoming(list);
    } catch (e) {
      console.error("friends/requests/incoming:", e?.response?.data || e.message);
      if (mountedRef.current) setIncoming([]);
      throw e;
    }
  }, []);

  const loadOutgoing = useCallback(async () => {
    try {
      const { data } = await api.get(`/friends/requests/outgoing`);
      const list = asArray(data)
        .map((req) =>
          normalizeUser({
            id: req.receiverId,
            displayName: req.receiverName,
            username: req.receiverUsername,
            avatarUrl: req.receiverAvatarUrl,
            mutualCount: req.mutualCount,
            lastActive: req.receiverLastActive,
            _request: req,
          })
        )
        .filter(Boolean);
      if (mountedRef.current) setOutgoing(list);
    } catch (e) {
      console.error("friends/requests/outgoing:", e?.response?.data || e.message);
      if (mountedRef.current) setOutgoing([]);
      throw e;
    }
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      const { data } = await api.get(`${API_V2}/suggestions`, { params: { limit: 24 } });
      const list = asArray(data).map(normalizeUser).filter(Boolean);
      if (mountedRef.current) setSuggestions(list);
    } catch (e) {
      console.error("friends/suggestions:", e?.response?.data || e.message);
      if (mountedRef.current) setSuggestions([]);
      // optional; don't throw
    }
  }, []);

  const loadAll = useCallback(async () => {
    setError(null);
    setLoading(true);
    const key = ++lastLoadKeyRef.current;
    try {
      await Promise.all([loadFriends(), loadIncoming(), loadOutgoing(), loadSuggestions()]);
    } catch (e) {
      if (mountedRef.current) setError(e?.response?.data || e.message || "Failed to load.");
    } finally {
      if (mountedRef.current && key === lastLoadKeyRef.current) setLoading(false);
    }
  }, [loadFriends, loadIncoming, loadOutgoing, loadSuggestions]);

  /* effects that DO touch loadAll */
  useEffect(() => {
    if (!authReady) return;
    mountedRef.current = true;
    (async () => {
      await loadAll();
    })();
    return () => {
      mountedRef.current = false;
      window.clearTimeout(searchDebounceRef.current);
    };
  }, [authReady, me?.id, loadAll]);

  // shortcut: "/" focuses search
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea";
      if (!typing && e.key === "/") {
        e.preventDefault();
        setActive("search");
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ----------------------------- actions ----------------------------- */

  const sendRequest = useCallback(
    async (receiverId) => {
      setSuggestions((prev) => prev.filter((u) => u.id !== receiverId));
      setSearchResults((prev) => prev.filter((u) => u.id !== receiverId));
      try {
        await api.post(`${API_V2}/request/${receiverId}`);
        toast.success("Friend request sent.");
        await Promise.all([loadIncoming(), loadOutgoing(), loadSuggestions()]);
      } catch (e) {
        toast.error(e?.response?.data || "Could not send friend request.");
      }
    },
    [loadIncoming, loadOutgoing, loadSuggestions]
  );

  const acceptFromUser = useCallback(
    async (senderId) => {
      setIncoming((prev) => prev.filter((u) => u.id !== senderId));
      try {
        await api.post(`${API_V2}/accept/${senderId}`);
        toast.success("Request accepted.");
        await Promise.all([loadFriends(), loadIncoming(), loadSuggestions()]);
      } catch (e) {
        toast.error("Failed to accept request.");
        loadIncoming();
      }
    },
    [loadFriends, loadIncoming, loadSuggestions]
  );

  const declineFromUser = useCallback(
    async (senderId) => {
      setIncoming((prev) => prev.filter((u) => u.id !== senderId));
      try {
        await api.post(`${API_V2}/decline/${senderId}`);
        toast.success("Request declined.");
        await loadSuggestions();
      } catch (e) {
        toast.error("Failed to decline request.");
        loadIncoming();
      }
    },
    [loadIncoming, loadSuggestions]
  );

  const cancelOutgoing = useCallback(
    async (requestId) => {
      setOutgoing((prev) => prev.filter((u) => u?._request?.id !== requestId));
      try {
        await api.post(`/friends/requests/cancel`, { requestId });
        toast.success("Request cancelled.");
        await loadOutgoing();
      } catch (e) {
        toast.error(e?.response?.data || "Could not cancel request.");
        loadOutgoing();
      }
    },
    [loadOutgoing]
  );

  const unfriend = useCallback(
    async (userId) => {
      setFriends((prev) => prev.filter((f) => f.id !== userId));
      try {
        await api.delete(`${API_V2}/${userId}`);
        toast.success("Removed from friends.");
        await loadSuggestions();
      } catch (e) {
        toast.error("Failed to remove friend.");
      }
    },
    [loadSuggestions]
  );

  /* ----------------------------- search helpers ----------------------------- */

  useEffect(() => {
    window.clearTimeout(searchDebounceRef.current);
    if (!deferredSearch.trim()) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = window.setTimeout(
      () => performSearch(deferredSearch),
      350
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch]);

  const performSearch = useCallback(
    async (raw) => {
      const q = (raw ?? searchQuery).trim();
      if (!q) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      const key = ++lastLoadKeyRef.current;
      try {
        const { data } = await api.get(`/friends/search`, {
          params: { query: q, page: 0, size: 25 },
        });
        const results = asArray(data).map(normalizeUser).filter(Boolean);
        if (mountedRef.current && key === lastLoadKeyRef.current)
          setSearchResults(results);
      } catch (e) {
        console.error("friends/search:", e?.response?.data || e.message);
        toast.error("Search failed.");
        if (mountedRef.current && key === lastLoadKeyRef.current)
          setSearchResults([]);
      } finally {
        if (mountedRef.current && key === lastLoadKeyRef.current)
          setSearching(false);
      }
    },
    [searchQuery]
  );

  const onSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    } else if (e.key === "Escape") {
      clearSearch();
    }
  };
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  /* ----------------------------- header + tabs ----------------------------- */

  const tablistId = useId();
  const onKeyTabs = (e) => {
    const idx = TABS.findIndex((t) => t.id === active);
    if (idx < 0) return;
    if (e.key === "ArrowRight") {
      onSwitchTab(TABS[(idx + 1) % TABS.length].id);
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      onSwitchTab(TABS[(idx - 1 + TABS.length) % TABS.length].id);
      e.preventDefault();
    }
  };

  const Tab = ({ id, label, icon: I }) => {
    const isActive = active === id;
    const count = typeof counts[id] === "number" ? counts[id] : undefined;
    return (
      <button
        role="tab"
        aria-selected={isActive}
        aria-controls={`${tablistId}-${id}`}
        id={`${tablistId}-tab-${id}`}
        tabIndex={isActive ? 0 : -1}
        onClick={() => onSwitchTab(id)}
        className={cx(
          styles.tabBtn,
          "friends-tab",
          isActive && "friends-tab--active"
        )}
      >
        <Icon I={I} />
        <span className="friends-tab__label">{label}</span>
        {typeof count === "number" && (
          <span className="friends-tab__badge" aria-label={`${count} ${label}`}>
            {count}
          </span>
        )}
      </button>
    );
  };

  /* ----------------------------- render ----------------------------- */

  return (
    <div className={cx(styles.container, "friends-page")}>
      {/* Sticky header / tabs */}
      <header
        className={cx(styles.headerRow, "friends-header")}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 3,
          backdropFilter: "saturate(1.2) blur(6px)",
          WebkitBackdropFilter: "saturate(1.2) blur(6px)",
        }}
      >
        <div className="friends-header__titleRow">
          <h2 className={cx(styles.title, "friends-title")}>
            <Icon I={Users} className="friends-title__icon" />
            <span>{t('friends.friends')}</span>
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Friends tabs"
          onKeyDown={onKeyTabs}
          className="friends-tabs"
        >
          <Tab id="friends" label="Friends" icon={Users} />
          <Tab id="incoming" label="Incoming" icon={UserPlus} />
          <Tab id="outgoing" label="Outgoing" icon={UserMinus} />
          <Tab id="suggestions" label="Suggestions" icon={Users} />
          <Tab id="search" label="Search" icon={UserSearch} />
        </div>

        {/* Big search */}
        <div className="friends-searchDock">
          <div className={cx(styles.searchBar, "friends-search")}>
            <Icon I={UserSearch} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search people by name or username  (Press / to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (active !== "search") setActive("search");
                onSearchKeyDown(e);
              }}
              className={cx(formStyles.input, "friends-search__input")}
              aria-label="Search people"
            />
            {!!searchQuery && (
              <button
                className={cx(
                  buttonStyles.btn,
                  buttonStyles.ghost,
                  "friends-search__clear"
                )}
                onClick={clearSearch}
                aria-label="Clear search"
                title="Clear"
              >
                <Icon I={X} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (active !== "search") setActive("search");
                performSearch();
              }}
              className={cx(buttonStyles.btn, "friends-search__submit")}
              disabled={searching}
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div
          role="status"
          className="friends-error"
          style={{
            margin: "10px 0",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(220,38,38,.25)",
            background:
              "linear-gradient(180deg, rgba(255,0,0,.05), rgba(255,0,0,.02))",
            color: "#991b1b",
          }}
        >
          {String(error)}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Section title="Loading" className="friends-block--loading">
          <ul
            className={cx(styles.list, "friends-list")}
            aria-busy="true"
            aria-live="polite"
          >
            {[...Array(6)].map((_, i) => (
              <li key={i} className={cx(styles.listItem, "friends-list__item")}>
                <Shimmer height={56} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Search */}
      {!loading && active === "search" && (
        <Section
          title="Search results"
          actions={
            (searchResults.length > 0 || searchQuery) && (
              <button
                type="button"
                onClick={clearSearch}
                className={cx(
                  buttonStyles.btn,
                  buttonStyles.ghost,
                  "friends-btn friends-btn--ghost"
                )}
              >
                Clear
              </button>
            )
          }
          className="friends-block--search"
        >
          {searchResults.length === 0 && searchQuery && !searching && (
            <p className={cx(styles.empty, "friends-empty")}>
              No users found for “{searchQuery}”.
            </p>
          )}

          {searchResults.length > 0 && (
            <ul
              className={cx(styles.list, "friends-list")}
              id={`${tablistId}-search`}
              role="tabpanel"
              aria-labelledby={`${tablistId}-tab-search`}
            >
              {searchResults.map((u, i) => (
                <PersonRow
                  key={u.id}
                  user={u}
                  subtext={safeHandle(u)}
                  revealDelay={i * 40}
                  right={
                    <button
                      type="button"
                      className={cx(
                        buttonStyles.btn,
                        "friends-btn friends-btn--primary"
                      )}
                      onClick={() => sendRequest(u.id)}
                    >
                      <Icon I={UserPlus} />
                      <span>Add</span>
                    </button>
                  }
                />
              ))}
            </ul>
          )}
        </Section>
      )}

      {/* Incoming */}
      {!loading && active === "incoming" && (
        <Section title="Incoming requests" className="friends-block--incoming">
          {incoming.length === 0 ? (
            <p className={cx(styles.empty, "friends-empty")}>
              No incoming requests.
            </p>
          ) : (
            <ul
              className={cx(styles.list, "friends-list")}
              id={`${tablistId}-incoming`}
              role="tabpanel"
              aria-labelledby={`${tablistId}-tab-incoming`}
            >
              {incoming.map((u, i) => {
                const req = u._request;
                const when =
                  req?.createdAt &&
                  (new Date(req.createdAt).toLocaleDateString?.() || "");
                const mutual =
                  typeof u.mutualCount === "number" && u.mutualCount > 0
                    ? `${u.mutualCount} mutual`
                    : null;

                return (
                  <PersonRow
                    key={req?.id ?? u.id}
                    user={u}
                    subtext={mutual || (when ? `Requested ${when}` : "Requested")}
                    revealDelay={i * 40}
                    right={
                      <>
                        <button
                          type="button"
                          onClick={() => acceptFromUser(u.id)}
                          className={cx(
                            buttonStyles.btn,
                            buttonStyles.primary,
                            "friends-btn friends-btn--primary"
                          )}
                        >
                          <Icon I={Check} />
                          <span>{t('friends.accept')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => declineFromUser(u.id)}
                          className={cx(buttonStyles.btn, "friends-btn")}
                        >
                          <Icon I={X} />
                          <span>{t('friends.decline')}</span>
                        </button>
                      </>
                    }
                  />
                );
              })}
            </ul>
          )}
        </Section>
      )}

      {/* Outgoing */}
      {!loading && active === "outgoing" && (
        <Section title="Outgoing requests" className="friends-block--outgoing">
          {outgoing.length === 0 ? (
            <p className={cx(styles.empty, "friends-empty")}>
              No outgoing requests.
            </p>
          ) : (
            <ul
              className={cx(styles.list, "friends-list")}
              id={`${tablistId}-outgoing`}
              role="tabpanel"
              aria-labelledby={`${tablistId}-tab-outgoing`}
            >
              {outgoing.map((u, i) => {
                const req = u._request;
                return (
                  <PersonRow
                    key={req?.id ?? u.id}
                    user={u}
                    subtext={
                      u?.mutualCount > 0 ? `${u.mutualCount} mutual` : "Pending…"
                    }
                    revealDelay={i * 40}
                    right={
                      req?.id ? (
                        <button
                          type="button"
                          className={cx(buttonStyles.btn, "friends-btn")}
                          onClick={() => cancelOutgoing(req.id)}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className={cx(styles.muted, "friends-muted")}>
                          Pending…
                        </span>
                      )
                    }
                  />
                );
              })}
            </ul>
          )}
        </Section>
      )}

      {/* Suggestions */}
      {!loading && active === "suggestions" && (
        <Section
          title="People you may know"
          className="friends-block--suggestions"
        >
          {suggestions.length === 0 ? (
            <div className={cx(styles.empty, "friends-empty")}>
              <p>{t('friends.noSuggestions')}</p>
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className={cx(buttonStyles.btn, "friends-btn")}
                  onClick={() => onSwitchTab("search")}
                >
                  Try searching
                </button>
              </div>
            </div>
          ) : (
            <ul
              className={cx(styles.list, "friends-list")}
              id={`${tablistId}-suggestions`}
              role="tabpanel"
              aria-labelledby={`${tablistId}-tab-suggestions`}
            >
              {suggestions.map((u, i) => (
                <PersonRow
                  key={u.id}
                  user={u}
                  revealDelay={i * 40}
                  subtext={
                    typeof u.mutualCount === "number" && u.mutualCount > 0
                      ? `${u.mutualCount} mutual`
                      : null
                  }
                  right={
                    <button
                      type="button"
                      className={cx(
                        buttonStyles.btn,
                        "friends-btn friends-btn--primary"
                      )}
                      onClick={() => sendRequest(u.id)}
                    >
                      <Icon I={UserPlus} />
                      <span>Add</span>
                    </button>
                  }
                />
              ))}
            </ul>
          )}
        </Section>
      )}

      {/* Friends */}
      {!loading && active === "friends" && (
        <Section title="Your friends" className="friends-block--friends">
          {friends.length === 0 ? (
            <div className={cx(styles.empty, "friends-empty")}>
              <p>{t('friends.noFriendsYet')}</p>
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className={cx(buttonStyles.btn, "friends-btn")}
                  onClick={() => onSwitchTab("suggestions")}
                >
                  Find people to add
                </button>
              </div>
            </div>
          ) : (
            <ul
              className={cx(styles.list, "friends-list")}
              id={`${tablistId}-friends`}
              role="tabpanel"
              aria-labelledby={`${tablistId}-tab-friends`}
            >
              {friends.map((u, i) => (
                <PersonRow
                  key={u.id}
                  user={u}
                  subtext={safeHandle(u)}
                  revealDelay={i * 35}
                  right={
                    <button
                      type="button"
                      className={cx(
                        buttonStyles.btn,
                        buttonStyles.ghost,
                        "friends-btn friends-btn--ghost"
                      )}
                      onClick={() => unfriend(u.id)}
                    >
                      Unfriend
                    </button>
                  }
                />
              ))}
            </ul>
          )}
        </Section>
      )}
    </div>
  );
}
