/* @jsxRuntime classic */
// src/pages/Feed/FeedPage.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuth from "../../hooks/useAuth";
import { fetchFeed } from "../../api/feed";
import styles from "./FeedPage.module.scss";
import { mountSectionReveals, mountHeroParallax } from "../../utils/scrollMotion";
import FeedGridSection from "../../components/feed/FeedGridSection";
import { apiBase, makeApiUrl } from "../../api/httpUrl";

/* NEW: wire actions */
import api from "../../api/axiosInstance";
import { enterpriseToast } from "../../components/ToastExports";
import { notify } from "../../components/notifications/EnterpriseNotificationSystem";

// Threaded comments (with reply support) for posts/ads
import CommentsThread from "../../components/ads/CommentsThread.jsx";

// Loading components
import { InlineSpinner } from "../../components/ui/Spinner/Spinner";

/* Hero sources (public folder) */
const HERO_DESKTOP = "/videos/hero-coffee.mp4";
const HERO_MOBILE = "/videos/mobile-hero.mp4";
const HERO_POSTER = "/images/hero-poster.jpg";

const ALL_TYPES = ["home_swap", "rental", "service", "ads", "travel"];
const FALLBACK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const NAV_ROUTES = {
  all: "/app/feed",
  rental: "/app/rentals",
  rentals: "/app/rentals",
  home_swap: "/app/homeswap",
  swap: "/app/homeswap",
  service: "/app/services",
  services: "/app/services",
  ads: "/app/ads",
  events: "/app/events",
  travel: "/app/travel",
};

const isAbs = (s) => typeof s === "string" && /^(https?:)?\/\//i.test(s);

// Normalize any photo-ish URL to absolute
const toSrc = (u) => {
  if (!u) return null;
  if (isAbs(u) || String(u).startsWith("data:")) return u;
  return makeApiUrl(u.startsWith("/") ? u : `/${u}`);
};

const imgOf = (it) => {
  if (!it) return null;

  // Check for absolute URLs first
  if (isAbs(it?.imageUrlAbsolute)) return it.imageUrlAbsolute;
  if (isAbs(it?.imageUrl)) return it.imageUrl;
  if (isAbs(it?.firstPhotoUrl)) return it.firstPhotoUrl;

  // Check for photos array first (new system for ads and rentals)
  if (Array.isArray(it?.photos) && it.photos.length > 0) {
    const first = it.photos[0];
    const u = typeof first === "string" ? first : first?.url || first?.src || first?.path;
    const norm = toSrc(u);
    if (norm) return norm;
  }

  // Check for single imageUrl field (used by ads) - convert to absolute
  if (it?.imageUrl && !isAbs(it.imageUrl)) {
    return toSrc(it.imageUrl);
  }

  // Check other arrays for multiple photos
  const arrays = [it?.images, it?.pictures, it?.media, it?.gallery].filter(Boolean);
  for (const arr of arrays) {
    if (!Array.isArray(arr) || !arr.length) continue;
    const first = arr[0];
    const u = typeof first === "string" ? first : first?.url || first?.src || first?.path;
    const norm = toSrc(u);
    if (norm) return norm;
  }

  // Fallback to API endpoints for specific types
  const id = it?.id ?? it?._id ?? it?.listingId ?? it?.publicId ?? null;
  const t = (it?.type || "").toLowerCase();
  if (id && t.includes("rental")) return makeApiUrl(`/rentals/${id}/photos/first`);
  if (id && (t.includes("home") || t.includes("swap"))) return makeApiUrl(`/homeswap/${id}/photos/first`);
  if (id && (t.includes("ad") || t.includes("classified"))) return makeApiUrl(`/ads/${id}/photos/first`);
  
  return null;
};

const detailsPath = (type, id) => {
  if (!id) return "#";
  const t = (type || "").toLowerCase();
  if (t.includes("rental")) return `/app/rentals/${id}`;
  if (t.includes("swap")) return `/app/homeswap/${id}`;
  if (t.includes("service")) return `/app/services/${id}`;
  if (t.includes("ad") || t.includes("classified")) return `/app/ads/${id}`;
  if (t.includes("travel") || t.includes("trip") || t.includes("tour")) return `/app/travel/${id}`;
  return "#";
};

const getAvatarUrl = (posterId) =>
  posterId ? `${apiBase}/users/${posterId}/profile-image` : null;

const getDisplayName = (it) =>
  it?.posterName ||
  it?.user?.name ||
  it?.user?.fullName ||
  it?.username ||
  it?.authorName ||
  it?.ownerName ||
  "Community Member";

const getCreatedAt = (it) =>
  it?.createdAt || it?.postedAt || it?.created_date || it?.createdDate || it?.timestamp || null;

const formatRelative = (dateish) => {
  if (!dateish) return "";
  const d = new Date(dateish);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const sec = Math.max(1, Math.floor(diff / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo`;
  const yr = Math.floor(day / 365);
  return `${yr}y`;
};

const TABS = [
  { key: "rental", labelKey: "feed.tabs.homeRentals" },
  { key: "home_swap", labelKey: "feed.tabs.homeSwap" },
  { key: "service", labelKey: "feed.tabs.multiServices" },
  { key: "ads", labelKey: "feed.tabs.habeshaAds" },
  { key: "events", labelKey: "feed.tabs.events" },
  { key: "travel", labelKey: "feed.tabs.findTravelers" },
];

/* ===================== helpers/hooks ===================== */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange);
    };
  }, []);
  return reduced;
}

/** Choose hero video based on viewport */
function useHeroVideoSrc() {
  const pick = () => {
    if (typeof window === "undefined") return HERO_DESKTOP;
    const mqNarrow = window.matchMedia("(max-width: 700px)");
    const mqPortrait = window.matchMedia("(orientation: portrait)");
    const mobileish = mqNarrow.matches || mqPortrait.matches;
    return mobileish ? HERO_MOBILE : HERO_DESKTOP;
  };
  const [src, setSrc] = useState(pick);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mqNarrow = window.matchMedia("(max-width: 700px)");
    const mqPortrait = window.matchMedia("(orientation: portrait)");
    const update = () => setSrc(pick());

    const add = (mql) =>
      mql.addEventListener ? mql.addEventListener("change", update) : mql.addListener(update);
    const rm = (mql) =>
      mql.removeEventListener ? mql.removeEventListener("change", update) : mql.removeListener(update);

    add(mqNarrow);
    add(mqPortrait);
    window.addEventListener("resize", update);
    return () => {
      rm(mqNarrow);
      rm(mqPortrait);
      window.removeEventListener("resize", update);
    };
  }, []);

  return src;
}

/* Keyboard roving for tabs (Arrow/Home/End) */
function useRovingTabs() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const btns = () => Array.from(root.querySelectorAll("button[role='tab']"));
    const onKey = (e) => {
      const list = btns();
      if (!list.length) return;
      const i = list.findIndex((b) => b === document.activeElement);
      const key = e.key;
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(key)) return;
      e.preventDefault();
      let idx = i < 0 ? 0 : i;
      if (key === "ArrowRight") idx = (i + 1 + list.length) % list.length;
      if (key === "ArrowLeft") idx = (i - 1 + list.length) % list.length;
      if (key === "Home") idx = 0;
      if (key === "End") idx = list.length - 1;
      list[idx]?.focus();
    };
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, []);
  return ref;
}

/* ===================== small components ===================== */
function PeekStrip({ items = [], ariaLabel }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const rootRef = useRef(null);
  const finePointer =
    typeof window !== "undefined"
      ? !!window.matchMedia && window.matchMedia("(pointer: fine)").matches
      : false;

  // Autopause marquee when off-screen
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (reduced) {
      root.dataset.auto = "off";
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) root.dataset.auto = e.isIntersecting ? "on" : "off";
      },
      { threshold: 0.01, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(root);
    return () => io.disconnect();
  }, [reduced]);

  // 3D tilt on hover (transform-only)
  const handleMove = useCallback(
    (e) => {
      if (!finePointer) return;
      const item = e.currentTarget;
      const r = item.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const px = x / r.width - 0.5;
      const py = y / r.height - 0.5;
      const rx = (-py * 6).toFixed(2) + "deg";
      const ry = (px * 6).toFixed(2) + "deg";
      item.style.setProperty("--tilt-x", rx);
      item.style.setProperty("--tilt-y", ry);
      item.style.setProperty("--tilt-scale", 1.02);
    },
    [finePointer]
  );

  const handleLeave = useCallback((e) => {
    const item = e.currentTarget;
    item.style.setProperty("--tilt-x", "0deg");
    item.style.setProperty("--tilt-y", "0deg");
    item.style.setProperty("--tilt-scale", 1);
  }, []);

  if (!items.length) return <div className={styles.emptyInline}>{t('feed.nothingYet')}</div>;

  // loop a small set for the marquee illusion
  const base = items.slice(0, Math.max(3, items.length));
  const loop = base.concat(base);

  return (
    <div
      ref={rootRef}
      className={styles.peekStrip}
      role="list"
      aria-label={ariaLabel}
      data-auto="on"
    >
      <div className={styles.peekTrack}>
        {loop.map((it, i) => {
          const id = it?.id ?? it?._id ?? it?.listingId ?? it?.publicId ?? `x${i}`;
          const key = `peek-${id}-${i}`;
          const href = detailsPath(it?.type, id);
          const title = (it?.title || "").trim() || "Untitled";
          const location = it?.location || "";
          const src = toSrc(imgOf(it)) || FALLBACK_PIXEL;
          const isService = (it?.type || "").toLowerCase().includes("service");
          
          // Enhanced service details
          const serviceDetails = isService ? {
            category: it?.category || "",
            description: it?.description || "",
            estimatedTime: it?.estimatedTime || it?.estimated_time || it?.duration || "",
            basePrice: it?.basePrice || it?.base_price || it?.price || "",
            deliveryType: it?.deliveryType || it?.delivery_type || it?.serviceType || "",
            rating: it?.rating || it?.averageRating || "",
            reviewCount: it?.reviewCount || it?.review_count || it?.totalReviews || 0
          } : {};
          
          return (
            <Link
              key={key}
              to={href}
              className={`${styles.peekItem} ${isService ? styles.peekItemService : ''}`}
              role="listitem"
              onMouseMove={handleMove}
              onMouseLeave={handleLeave}
              onMouseEnter={handleMove}
            >
              <div className={styles.peekThumb}>
                <img
                  src={src}
                  alt={title}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => (e.currentTarget.src = FALLBACK_PIXEL)}
                />
                {isService && (
                  <div className={styles.peekOverlay}>
                    <div className={styles.peekOverlayContent}>
                      <div className={styles.peekServiceHeader}>
                        <div className={styles.peekServiceIcon}>🛠️</div>
                        {serviceDetails.category && (
                          <div className={styles.peekServiceCategory}>
                            {serviceDetails.category}
                          </div>
                        )}
                      </div>
                      
                      <div className={styles.peekOverlayTitle} title={title}>
                        {title.length > 35 ? title.slice(0, 32) + "…" : title}
                      </div>
                      
                      {serviceDetails.description && (
                        <div className={styles.peekServiceDescription}>
                          {serviceDetails.description.length > 60 
                            ? serviceDetails.description.slice(0, 57) + "…" 
                            : serviceDetails.description}
                        </div>
                      )}
                      
                      <div className={styles.peekServiceDetails}>
                        {serviceDetails.basePrice && (
                          <div className={styles.peekServicePrice}>
                            £{serviceDetails.basePrice}
                          </div>
                        )}
                        
                        {serviceDetails.estimatedTime && (
                          <div className={styles.peekServiceTime}>
                            ⏱️ {serviceDetails.estimatedTime}
                          </div>
                        )}
                      </div>
                      
                      {serviceDetails.deliveryType && (
                        <div className={styles.peekServiceDelivery}>
                          📍 {serviceDetails.deliveryType}
                        </div>
                      )}
                      
                      {location && (
                        <div className={styles.peekOverlayLoc}>
                          📍 {location}
                        </div>
                      )}
                      
                      {serviceDetails.rating && (
                        <div className={styles.peekServiceRating}>
                          ⭐ {serviceDetails.rating} 
                          {serviceDetails.reviewCount > 0 && (
                            <span className={styles.peekReviewCount}>
                              ({serviceDetails.reviewCount})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {!isService && (
                <div className={styles.peekMeta}>
                  <div className={styles.peekTitle} title={title}>
                    {title.length > 60 ? title.slice(0, 57) + "…" : title}
                  </div>
                  {location && <div className={styles.peekLoc}>{location}</div>}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** Facebook-style post status component */
function PostStatusBox({ user, onPostClick, onPostSuccess }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const userAvatar = user?.id 
    ? `${apiBase}/users/${user.id}/profile-image` 
    : FALLBACK_PIXEL;
    
  const userName = user?.firstName || user?.fullName || user?.name || user?.username || "Friend";

  const handleCreateAd = () => {
    // Navigate to the ads post page which we know works
    navigate('/app/ads/post');
  };

  const handleQuickPost = () => {
    // For now, also redirect to ads post page until inline form is fixed
    navigate('/app/ads/post');
  };

  return (
    <div className={styles.postStatusBox}>
      <div className={styles.postStatusHeader}>
        <img 
          src={userAvatar} 
          alt={userName}
          className={styles.postStatusAvatar}
          onError={(e) => (e.currentTarget.src = FALLBACK_PIXEL)}
        />
        <button 
          className={styles.postStatusInput}
          onClick={handleQuickPost}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleQuickPost();
            }
          }}
          aria-label={t('feed.postStatus.placeholderAria')}
        >
          {t('feed.postStatus.placeholder', { name: userName })}
        </button>
      </div>
      
      <div className={styles.postStatusActions}>
        <button 
          className={styles.postStatusAction}
          onClick={handleCreateAd}
          aria-label={t('feed.postStatus.createAd')}
        >
          <span className={styles.postStatusIcon}>📝</span>
          <span>{t('feed.postStatus.createAd')}</span>
        </button>
        
        <button 
          className={styles.postStatusAction}
          onClick={handleCreateAd}
          aria-label={t('feed.postStatus.addPhoto')}
        >
          <span className={styles.postStatusIcon}>📷</span>
          <span>{t('feed.postStatus.addPhoto')}</span>
        </button>
        
        <button 
          className={styles.postStatusAction}
          onClick={() => onPostClick && onPostClick()}
          aria-label={t('feed.postStatus.moreOptions')}
        >
          <span className={styles.postStatusIcon}>➕</span>
          <span>{t('feed.postStatus.moreOptions')}</span>
        </button>
      </div>
    </div>
  );
}

/** Wired: Inline timeline for Community Posts & Ads (Like/Comment/Share) */
function AdsFeedTimeline({ items = [] }) {
  // Hooks first — never after an early return
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [postState, setPostState] = useState({});
  const [drafts, setDrafts] = useState({});
  const [openComments, setOpenComments] = useState({});

  // IMPORTANT: now includes adId / ad_id so endpoints use real IDs from ads
  const getId = (it, idx = 0) =>
    it?.id ??
    it?.adId ??
    it?.ad_id ??
    it?._id ??
    it?.postId ??
    it?.publicId ??
    it?.listingId ??
    `p${idx}`;

  const num = (v, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };

  // Parse like-count from multiple possible server shapes
  const parseCount = (data) => {
    if (data == null) return null;
    if (typeof data === "number") return data;
    if (Array.isArray(data)) return data.length;
    if (typeof data === "object") {
      // direct keys
      for (const k of ["count", "likesCount", "likeCount", "total", "value"]) {
        if (typeof data[k] === "number") return data[k];
        if (Array.isArray(data[k])) return data[k].length;
        if (data[k] && typeof data[k].size === "number") return data[k].size;
      }
      // nested wrappers
      if (typeof data.data === "number") return data.data;
      if (data.data && typeof data.data.count === "number") return data.data.count;
      if (Array.isArray(data.data)) return data.data.length;
      if (typeof data.size === "number") return data.size;
    }
    return null;
  };

  const bootstrapFrom = (it) => {
    // liked flag from various fields
    const liked =
      !!it?.likedByMe || !!it?.liked || !!it?.userLiked || !!it?.viewerLiked;

    // count can be number or derived from arrays
    const likeCount =
      num(it?.likesCount) ||
      num(it?.likeCount) ||
      num(it?.reactionsCount) ||
      (Array.isArray(it?.likes) ? it.likes.length : 0) ||
      (Array.isArray(it?.likedUserIds) ? it.likedUserIds.length : 0);

    const commentsCount =
      num(it?.commentsCount) ||
      num(it?.commentCount) ||
      (Array.isArray(it?.comments) ? it.comments.length : 0);

    const sharesCount =
      num(it?.sharesCount) ||
      num(it?.shareCount) ||
      (Array.isArray(it?.shares) ? it.shares.length : 0);

    return {
      liked,
      likeCount: Number.isFinite(likeCount) ? likeCount : 0,
      commentsCount: Number.isFinite(commentsCount) ? commentsCount : 0,
      sharesCount: Number.isFinite(sharesCount) ? sharesCount : 0,
      comments: [],
      loaded: false,         // full comments list loaded
      loadedLikes: false,    // likes loaded from /ads/:id
      commentsLoaded: false, // comment COUNT loaded from /api/ads/:id/comments
    };
  };

  // ensure there's a state entry for every item
  useEffect(() => {
    setPostState((prev) => {
      const next = { ...prev };
      items.forEach((it, i) => {
        const id = getId(it, i);
        if (!next[id]) next[id] = bootstrapFrom(it);
      });
      return next;
    });
  }, [items]);

  // ---------- Like count from /ads/:id ----------
  const fetchAndSetLikeCount = async (id, seed) => {
    if (!id || String(id).startsWith("p")) return; // skip fake ids
    try {
      const res = await api.get(`/ads/${id}`);
      const data = res?.data;
      const c = parseCount(data);
      setPostState((s) => ({
        ...s,
        [id]: {
          ...(s[id] || seed || {}),
          likeCount: Number.isFinite(c) ? Math.max(0, c) : (s[id]?.likeCount ?? 0),
          liked: !!(data && data.likedByMe),
          loadedLikes: true,
        },
      }));
    } catch (err) {
      console.warn("fetch like count failed", err);
      setPostState((s) => ({
        ...s,
        [id]: { ...(s[id] || seed || {}), loadedLikes: true },
      }));
    }
  };

  useEffect(() => {
    const entries = Object.entries(postState);
    const toFetch = entries
      .slice(0, 20) // small throttle
      .filter(([, st]) => !st?.loadedLikes)
      .map(([id]) => id);

    if (!toFetch.length) return;

    toFetch.forEach((id) => {
      fetchAndSetLikeCount(id, postState[id]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postState, items]);

  // ---------- Comment count from /api/ads/:id/comments ----------
  const fetchAndSetCommentCount = async (id, seed) => {
    if (!id || String(id).startsWith("p")) return; // skip fake ids
    try {
      const res = await api.get(`/api/ads/${id}/comments`);
      const data = res?.data;

      // Use the SAME shape logic as CommentsThread
      const rawListBase = Array.isArray(data)
        ? data
        : Array.isArray(data?.comments)
        ? data.comments
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const list = Array.isArray(rawListBase) ? rawListBase : [];

      setPostState((s) => ({
        ...s,
        [id]: {
          ...(s[id] || seed || {}),
          commentsCount: list.length,
          commentsLoaded: true,
        },
      }));
    } catch (err) {
      console.warn("fetch comment count failed", err);
      setPostState((s) => ({
        ...s,
        [id]: { ...(s[id] || seed || {}), commentsLoaded: true },
      }));
    }
  };

  useEffect(() => {
    const entries = Object.entries(postState);
    const toFetch = entries
      .slice(0, 20) // throttle
      .filter(([, st]) => !st?.commentsLoaded)
      .map(([id]) => id);

    if (!toFetch.length) return;

    toFetch.forEach((id) => {
      fetchAndSetCommentCount(id, postState[id]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postState, items]);

  // ---------- Like toggle ----------
  const toggleLike = async (it, idx) => {
    const id = getId(it, idx);
    const st = postState[id] || bootstrapFrom(it);

    const wasLiked = !!st.liked;
    const wasCount = Number.isFinite(st.likeCount) ? st.likeCount : 0;
    const nextLiked = !wasLiked;
    const nextCount = Math.max(0, wasCount + (nextLiked ? 1 : -1));

    // optimistic update
    setPostState((s) => ({
      ...s,
      [id]: { ...(s[id] || st), liked: nextLiked, likeCount: nextCount },
    }));

    try {
      if (nextLiked) {
        await api
          .post(`/ads/${id}/like`)
          .catch(async () => {
            try {
              await api.put(`/ads/${id}/like`);
            } catch (_) {}
          });
      } else {
        await api
          .delete(`/ads/${id}/like`)
          .catch(async () => {
            try {
              await api.post(`/ads/${id}/unlike`);
            } catch (_) {}
          });
      }

      // Refresh from backend
      try {
        const res = await api.get(`/ads/${id}`);
        const data = res?.data;
        if (data) {
          setPostState((s) => ({
            ...s,
            [id]: {
              ...(s[id] || st),
              liked: !!data.likedByMe,
              likeCount:
                typeof data.likeCount === "number"
                  ? Math.max(0, data.likeCount)
                  : (s[id]?.likeCount ?? nextCount),
              loadedLikes: true,
            },
          }));
        }
      } catch (err) {
        console.warn("refreshLikeState in feed failed", err);
      }
    } catch (e) {
      // revert on error
      console.error("Like toggle failed", e);
      setPostState((s) => ({ ...s, [id]: st }));
      enterpriseToast.error("Couldn't update like. Please try again.");
    }
  };

  // ---------- Comments: load full list when section opened ----------
  const ensureCommentsLoaded = async (it, idx) => {
    const id = getId(it, idx);
    const st = postState[id];
    if (st?.loaded) return;
    if (!id || String(id).startsWith("p")) return; // skip fake ids

    try {
      const res = await api.get(`/api/ads/${id}/comments`);
      const data = res?.data;
      const list = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];
      setPostState((s) => ({
        ...s,
        [id]: {
          ...(s[id] || bootstrapFrom(it)),
          comments: list,
          commentsCount: list.length,
          loaded: true,
          commentsLoaded: true,
        },
      }));
    } catch (err) {
      console.warn("comments load failed (feed)", err);
      // ignore; still allow posting
    }
  };

  // ---------- Quick comment composer on feed card ----------
  const submitComment = async (it, idx) => {
    const id = getId(it, idx);
    const text = String(drafts[id] || "").trim();
    if (!text) return;

    const st = postState[id] || bootstrapFrom(it);
    const optimistic = {
      id: `local-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      user: { name: "You" },
    };

    // optimistic add
    setPostState((s) => ({
      ...s,
      [id]: {
        ...st,
        comments: [optimistic, ...(st.comments || [])],
        commentsCount: (st.commentsCount || 0) + 1,
        loaded: true,
        commentsLoaded: true,
      },
    }));
    setDrafts((d) => ({ ...d, [id]: "" }));

    try {
      await api.post(`/api/ads/${id}/comments`, { text });
      // CommentsThread will refresh its own list when mounted.
    } catch (e) {
      console.error("Couldn't post comment", e);
      // revert optimistic
      setPostState((s) => {
        const cur = s[id] || st;
        return {
          ...s,
          [id]: {
            ...cur,
            comments: (cur.comments || []).filter((c) => c !== optimistic),
            commentsCount: Math.max(0, (cur.commentsCount || 1) - 1),
          },
        };
      });
      enterpriseToast.error("Couldn't post comment. Please try again.");
    }
  };

  // ---------- Share ----------
  const sharePost = async (it, idx) => {
    const id = getId(it, idx);
    const href = detailsPath("ads", id);
    const url = window.location.origin + href;

    // optimistic bump
    setPostState((s) => ({
      ...s,
      [id]: { ...(s[id] || bootstrapFrom(it)), sharesCount: (s[id]?.sharesCount || 0) + 1 },
    }));

    try {
      if (navigator.share) {
        await navigator.share({
          url,
          title: it?.title || t('nav.habeshaCommunity'),
          text: it?.text || "",
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        enterpriseToast.success("Link copied to clipboard");
      } else {
        const tmp = document.createElement("input");
        tmp.value = url;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand("copy");
        tmp.remove();
        enterpriseToast.success("Link copied to clipboard");
      }
    } catch (e) {
      setPostState((s) => ({
        ...s,
        [id]: {
          ...(s[id] || bootstrapFrom(it)),
          sharesCount: Math.max(0, (s[id]?.sharesCount || 1) - 1),
        },
      }));
      enterpriseToast.error("Couldn't share this post. Please try again.");
    }
  };

  // Enterprise-style small helper
  const formatCount = (n) => {
    n = Number(n || 0);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 ? 1 : 0) + "K";
    return String(n);
  };

  // Pinned posts first (it.pinned / it.isPinned), then newest
  const orderedItems = useMemo(() => {
    if (!Array.isArray(items) || !items.length) return [];
    const copy = items.slice();
    copy.sort((a, b) => {
      const aPinned = !!(a?.pinned || a?.isPinned);
      const bPinned = !!(b?.pinned || b?.isPinned);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;

      const ad = new Date(getCreatedAt(a) || 0).getTime() || 0;
      const bd = new Date(getCreatedAt(b) || 0).getTime() || 0;
      return bd - ad;
    });
    return copy;
  }, [items]);

  if (!orderedItems.length) {
    return <div className={styles.emptyInline}>{t('empty.noPosts')}</div>;
  }

  return (
    <div className={styles.adsList} role="feed" aria-busy="false">
      {orderedItems.map((it, idx) => {
        const id = getId(it, idx);
        const href = detailsPath("ads", id);
        const userId = it?.posterId || it?.userId || it?.ownerId;
        const avatar =
          toSrc(getAvatarUrl(userId)) || FALLBACK_PIXEL;
        const name = getDisplayName(it);
        const when = formatRelative(getCreatedAt(it));
        
        // Build comprehensive post content for ads
        const buildAdContent = (ad) => {
          const parts = [];
          
          // Add title if available
          if (ad?.title && String(ad.title).trim()) {
            parts.push(String(ad.title).trim());
          }
          
          // Add price if available
          if (ad?.price != null && ad.price !== "" && ad.price !== 0) {
            const priceValue = typeof ad.price === 'number' ? ad.price : parseFloat(ad.price);
            if (!isNaN(priceValue) && priceValue > 0) {
              parts.push(`£${priceValue}`);
            }
          }
          
          // Add description if available (this might contain contact info)
          if (ad?.description && String(ad.description).trim()) {
            const desc = String(ad.description).trim();
            parts.push(desc);
          }
          
          // Add category if available
          if (ad?.category && String(ad.category).trim()) {
            parts.push(String(ad.category).trim());
          }
          
          // Add any additional text fields that might contain content
          const additionalFields = [
            ad?.text,
            ad?.content,
            ad?.summary,
            ad?.details,
            ad?.body,
            ad?.message
          ];
          
          additionalFields.forEach(field => {
            if (field && String(field).trim()) {
              const fieldText = String(field).trim();
              // Only add if not already included in other parts
              if (!parts.some(part => part.includes(fieldText) || fieldText.includes(part))) {
                parts.push(fieldText);
              }
            }
          });
          
          // Add contact info if stored separately
          if (ad?.contact && String(ad.contact).trim()) {
            const contactText = String(ad.contact).trim();
            // Only add if not already included in description
            if (!parts.some(part => part.toLowerCase().includes(contactText.toLowerCase()))) {
              parts.push(`Contact: ${contactText}`);
            }
          }
          
          // Add phone if available
          if (ad?.phone && String(ad.phone).trim()) {
            parts.push(`Phone: ${String(ad.phone).trim()}`);
          }
          
          // Add email if available  
          if (ad?.email && String(ad.email).trim()) {
            parts.push(`Email: ${String(ad.email).trim()}`);
          }
          
          // Add location if available
          if (ad?.location && String(ad.location).trim()) {
            parts.push(`Location: ${String(ad.location).trim()}`);
          }
          
          return parts.join('\n\n');
        };
        
        const bodyRaw = buildAdContent(it) || 
          it?.text || it?.description || it?.title || (it?.content && String(it.content)) || "";
        const body = String(bodyRaw);

        const mediaCandidate =
          imgOf(it) ||
          (Array.isArray(it?.images) && (it.images[0]?.url || it.images[0])) ||
          (Array.isArray(it?.photos) && (it.photos[0]?.url || it.photos[0])) ||
          null;
        const media = toSrc(
          typeof mediaCandidate === "string"
            ? mediaCandidate
            : mediaCandidate?.url || mediaCandidate
        );

        const st = postState[id] || bootstrapFrom(it);
        const draft = drafts[id] || "";
        const commentsOpen = !!openComments[id];
        const pinned = !!(it?.pinned || it?.isPinned);

        const longBody = body.length > 1200;
        const shortBody = longBody ? body.slice(0, 1200) + "…" : body;

        return (
          <article
            key={`ad-${id}`}
            className={styles.post}
            role="article"
            aria-describedby={`meta-${id}`}
            data-liked={st.liked ? "true" : "false"}
            data-pinned={pinned ? "true" : "false"}
          >
            {/* Header */}
            <header className={styles.postHead}>
              <button
                className={styles.postAvatarBtn}
                onClick={() => userId && navigate(`/app/profile/${userId}`)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && userId) {
                    e.preventDefault();
                    navigate(`/app/profile/${userId}`);
                  }
                }}
                disabled={!userId}
                aria-label={t('feed.a11y.viewProfile', { name })}
              >
                <img
                  src={avatar}
                  alt=""
                  onError={(e) => (e.currentTarget.src = FALLBACK_PIXEL)}
                  className={styles.postAvatar}
                  loading="lazy"
                  decoding="async"
                />
              </button>
              <div className={styles.postWho} id={`meta-${id}`}>
                <button
                  className={styles.postNameBtn}
                  onClick={() => userId && navigate(`/app/profile/${userId}`)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && userId) {
                      e.preventDefault();
                      navigate(`/app/profile/${userId}`);
                    }
                  }}
                  disabled={!userId}
                  aria-label={t('feed.a11y.viewProfile', { name })}
                >
                  <strong className={styles.postName}>
                    {name}
                    {pinned && <span className={styles.postPinnedBadge}>{t('feed.pinned')}</span>}
                  </strong>
                </button>
                {when && (
                  <span className={styles.postWhen} title={getCreatedAt(it) || ""}>
                    {when} {t('feed.ago')}
                  </span>
                )}
              </div>
            </header>

            {/* Text body and Media - Enhanced layout for text-only posts */}
            {(body || it?.title || it?.category) && !media ? (
              /* Text-only post: Display content in prominent card format */
              <Link 
                to={href} 
                className={`${styles.postTextCard} ${(body || it?.title || '').length < 100 ? styles.postTextCardShort : ''}`}
                aria-label={t('feed.a11y.openPostDetails')}
              >
                <div className={styles.postTextCardContent}>
                  <div className={styles.postTextIcon}>💭</div>
                  {shortBody || it?.title || it?.category || t('feed.communityPost', 'Community Post')}
                  {longBody && (
                    <span className={styles.postMore}>
                      {t('feed.seeMore')}
                    </span>
                  )}
                </div>
              </Link>
            ) : (
              /* Post with media or regular layout */
              <>
                {(body || it?.title || it?.category) && (
                  <div className={styles.postBody}>
                    {shortBody || it?.title || it?.category || t('feed.communityPost', 'Community Post')}
                    {longBody && (
                      <Link to={href} className={styles.postMore}>
                        {t('feed.seeMore')}
                      </Link>
                    )}
                  </div>
                )}

                {/* Media */}
                {media && (
                  <Link to={href} className={styles.postMedia} aria-label={t('feed.a11y.openPostMedia')}>
                    <img
                      src={media}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={(e) => (e.currentTarget.src = FALLBACK_PIXEL)}
                    />
                  </Link>
                )}
              </>
            )}

            {/* Counters */}
            <div
              style={{
                display: "flex",
                gap: 12,
                color: "var(--text-2)",
                fontSize: 12.5,
                paddingTop: 6,
              }}
            >
              <span aria-label={t('feed.a11y.likesCount', { count: st.likeCount })}>👍 {formatCount(st.likeCount)}</span>
              <span aria-label={t('feed.a11y.commentsCount', { count: st.commentsCount })}>
                💬 {formatCount(st.commentsCount)}
              </span>
              <span aria-label={t('feed.a11y.sharesCount', { count: st.sharesCount })}>
                ↗ {formatCount(st.sharesCount)}
              </span>
            </div>

            {/* Actions */}
            <div
              className={styles.postActions}
              role="group"
              aria-label={t('feed.a11y.postActions')}
              style={{ gap: 8 }}
            >
              <button
                type="button"
                className={styles.viewAllBtn}
                aria-pressed={st.liked ? "true" : "false"}
                onClick={() => toggleLike(it, idx)}
                title={st.liked ? t('feed.unlike') : t('feed.like')}
              >
                {st.liked ? `♥ ${t('feed.like')}` : `♡ ${t('feed.like')}`} · {formatCount(st.likeCount)}
              </button>

              <button
                type="button"
                className={styles.viewAllBtn}
                onClick={() => {
                  setOpenComments((o) => ({ ...o, [id]: !o[id] }));
                  if (!openComments[id]) {
                    // Optional: prefetch comments list so the thread feels instant
                    ensureCommentsLoaded(it, idx);
                  }
                }}
                title={t('feed.comments')}
              >
                💬 {t('feed.comment')} · {formatCount(st.commentsCount)}
              </button>

              <button
                type="button"
                className={styles.viewAllBtn}
                onClick={() => sharePost(it, idx)}
                title={t('feed.share')}
              >
                ↗ {t('feed.share')} · {formatCount(st.sharesCount)}
              </button>

              <Link to={href} className={styles.viewAllBtn} aria-label={t('feed.openPost')}>
                {t('common.open')}
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M8 4l8 8-8 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>

            {/* Comments */}
            {commentsOpen && (
              <div style={{ display: "grid", gap: 8 }} className={styles.commentsWrap}>
                {/* Top-level comment composer */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitComment(it, idx);
                  }}
                  className={styles.newsletter}
                >
                  <input
                    type="text"
                    placeholder={t('feed.writeComment')}
                    value={draft}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [id]: e.target.value }))
                    }
                    aria-label={t('feed.writeComment')}
                    required
                  />
                  <button type="submit">{t('feed.post')}</button>
                </form>

                {/* Full threaded comments for ads */}
               {/* Full threaded comments for ads (FB-style, but composer handled by Feed card) */}
<CommentsThread
  adId={id}
  showComposer={false}
  onCountChange={(count) => {
    if (typeof count !== "number") return;
    setPostState((s) => ({
      ...s,
      [id]: {
        ...(s[id] || bootstrapFrom(it)),
        commentsCount: count,
        commentsLoaded: true,
      },
    }));
  }}
/>

              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

/* ============================ Page ============================ */
export default function FeedPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tabsRef = useRovingTabs();
  const reduced = useReducedMotion();

  const auth = useAuth();
  const user = auth?.user;
  const userName =
    user?.firstName || user?.fullName || user?.name || user?.username || "Friend";

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [homeSwap, setHomeSwap] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [services, setServices] = useState([]);
  const [ads, setAds] = useState([]);
  const [, setTravel] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);

  // Infinite scroll ref
  const loadingRef = useRef(false);

  // Subheader visibility when hero scrolls out
  const [subActive, setSubActive] = useState(false);

  const requestedTypes = useMemo(() => ALL_TYPES, []);

  // Keep hero header style only while hero is visible + toggle subheader
  useEffect(() => {
    document.body.setAttribute("data-hero", "true");
    const heroSection = document.querySelector(".section--hero");
    if (!heroSection)
      return () => {
        document.body.removeAttribute("data-hero");
      };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          document.body.setAttribute("data-hero-contrast", "light");
          setSubActive(false);
        } else {
          document.body.removeAttribute("data-hero-contrast");
          setSubActive(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(heroSection);
    return () => {
      io.disconnect();
      document.body.removeAttribute("data-hero");
      document.body.removeAttribute("data-hero-contrast");
    };
  }, []);

  // Mount section reveals + hero parallax
  useEffect(() => {
    const offReveal = mountSectionReveals({
      threshold: 0.18,
      rootMargin: "0px 0px -12% 0px",
    });
    const offParallax = mountHeroParallax(".section--hero", 0.18, {
      damping: 0.18,
      scaleEntrance: true,
    });
    return () => {
      offReveal?.();
      offParallax?.();
    };
  }, []);

  const partitionItems = useCallback((items) => {
    const hs = [],
      rs = [],
      ss = [],
      aa = [],
      tt = [];
    for (const it of items) {
      const t = (it.type || "").toLowerCase();
      if (t === "home_swap" || t === "home-swap" || t === "homeswap") hs.push(it);
      else if (t === "rental" || t === "rentals") rs.push(it);
      else if (t === "service" || t === "services") ss.push(it);
      else if (
        t === "ad" ||
        t === "ads" ||
        t === "classified" ||
        t === "classifieds" ||
        t === "post"
      )
        aa.push(it);
      else if (
        t === "travel" ||
        t === "trip" ||
        t === "trips" ||
        t === "tour" ||
        t === "tours"
      )
        tt.push(it);
    }
    return { hs, rs, ss, aa, tt };
  }, []);

  const load = useCallback(
    async (cursor) => {
      const { items = [], nextCursor: nc } = await fetchFeed({
        types: requestedTypes,
        sort: "newest",
        limit: 36,
        cursor,
        hasPhotos: false,
      });
      const { hs, rs, ss, aa, tt } = partitionItems(items);

      if (cursor) {
        setHomeSwap((p) => [...p, ...hs]);
        setRentals((p) => [...p, ...rs]);
        setServices((p) => [...p, ...ss]);
        setAds((p) => [...p, ...aa]);
        setTravel((p) => [...p, ...tt]);
      } else {
        setHomeSwap(hs);
        setRentals(rs);
        setServices(ss);
        setAds(aa);
        setTravel(tt);
      }
      setNextCursor(nc || null);
    },
    [requestedTypes, partitionItems]
  );

  // initial fetch
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        await load(null);
      } catch (e) {
        console.error(e);
        if (!ignore) setError("Failed to load feed");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [load]);

  // Infinite scroll functionality
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !nextCursor || loadingMore || loading) return;
    
    loadingRef.current = true;
    try {
      setLoadingMore(true);
      await load(nextCursor);
    } catch (e) {
      console.error("Load more failed:", e);
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [nextCursor, loadingMore, loading, load]);

  useEffect(() => {
    const handleScroll = () => {
      if (loadingRef.current || !nextCursor || loadingMore || loading) return;

      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      // Trigger load more when user is 80% down the page
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, nextCursor, loadingMore, loading]);

  const onTabClick = useCallback(
    (key) => navigate(NAV_ROUTES[key] || "/app/feed"),
    [navigate]
  );

  // Pause hero video when page hidden or reduced motion
  const videoRef = useRef(null);
  const heroSrc = useHeroVideoSrc();
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onVis = () => {
      if (document.hidden || reduced) v.pause();
      else v.play().catch(() => {});
    };
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [reduced]);

  // ===== Self-animating tab hotspot + pointer magnet (desktop) =====
  useEffect(() => {
    const root = tabsRef.current;
    if (!root) return;

    const btns = Array.from(root.querySelectorAll("button[role='tab']"));
    // initialize variables so gradient/3D shows even before first RAF tick
    btns.forEach((b) => {
      b.style.setProperty("--gx", "50%");
      b.style.setProperty("--gy", "50%");
      b.style.setProperty("--mx", "0px");
      b.style.setProperty("--my", "0px");
      b.style.setProperty("--rx", "0deg");
      b.style.setProperty("--ry", "0deg");
      b.style.setProperty("--elev", "0px");
    });

    if (reduced) return; // respect reduced-motion

    // different phase per tab to avoid in-sync motion
    const phases = new Map(btns.map((b, i) => [b, (i * Math.PI * 2) / Math.max(1, btns.length)]));

    // hovered elements will use pointer values; we skip auto-drive for them
    const hovered = new WeakSet();
    const onEnter = (e) => hovered.add(e.currentTarget);
    const onLeave = (e) => hovered.delete(e.currentTarget);

    btns.forEach((b) => {
      b.addEventListener("pointerenter", onEnter);
      b.addEventListener("pointerleave", onLeave);
    });

    let rafId;
    let t0;
    const animate = (now) => {
      if (!t0) t0 = now;
      const t = (now - t0) / 1000; // seconds

      btns.forEach((b) => {
        if (hovered.has(b)) return; // let pointer handlers own it while hovered

        const phase = phases.get(b) || 0;
        // Lissajous-style orbit (soft)
        const rx = 18; // radius in %
        const ry = 12; // y radius in %
        const px = 50 + Math.sin(t * 0.75 + phase) * rx;
        const py = 50 + Math.cos(t * 0.95 + phase) * ry;

        b.style.setProperty("--gx", `${px}%`);
        b.style.setProperty("--gy", `${py}%`);

        // tiny magnetic drift (transform-only)
        const dx = (px - 50) / 50; // -1..1
        const dy = (py - 50) / 50;
        b.style.setProperty("--mx", `${dx * 2.5}px`);
        b.style.setProperty("--my", `${dy * 2.0}px`);
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      btns.forEach((b) => {
        b.removeEventListener("pointerenter", onEnter);
        b.removeEventListener("pointerleave", onLeave);
      });
    };
  }, [tabsRef, reduced]);

  // ===== Mobile 3D tilt: gyroscope preferred, RAF fallback =====
  useEffect(() => {
    const root = tabsRef.current;
    if (!root) return;
    if (reduced) return;

    const coarse =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(pointer: coarse)").matches;

    if (!coarse) return; // only phones/tablets

    const btns = Array.from(root.querySelectorAll("button[role='tab']"));
    if (!btns.length) return;

    // init vars so there’s visible depth immediately
    btns.forEach((b) => {
      b.style.setProperty("--rx", "0deg");
      b.style.setProperty("--ry", "0deg");
      b.style.setProperty("--elev", "1.5px");
    });

    let usingGyro = false;
    let rafId = null;

    const applyAll = (rxDeg, ryDeg, elevPx) => {
      for (const b of btns) {
        b.style.setProperty("--rx", `${rxDeg}deg`);
        b.style.setProperty("--ry", `${ryDeg}deg`);
        b.style.setProperty("--elev", `${elevPx}px`);
      }
    };

    // Fallback: gentle autonomous tilt loop (when no sensors)
    const startBreathe = () => {
      let t0 = null;
      const loop = (now) => {
        if (t0 === null) t0 = now;
        const t = (now - t0) / 1000;
        const rx = Math.sin(t * 0.7) * 2.6; // deg
        const ry = Math.cos(t * 0.6) * 3.2; // deg
        const elev = 1.8 + (Math.abs(rx) + Math.abs(ry)) * 0.12;
        applyAll(rx, ry, elev);
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    };

    // Try to use the device orientation sensor
    const handleOrient = (e) => {
      // beta (X: front↔back), gamma (Y: left↔right)
      const beta = Math.max(-30, Math.min(30, e.beta ?? 0)); // clamp
      const gamma = Math.max(-25, Math.min(25, e.gamma ?? 0));
      const rx = (-beta / 30) * 6.0; // tilt up/down
      const ry = (gamma / 25) * 6.8; // tilt left/right
      const elev = 2 + (Math.abs(rx) + Math.abs(ry)) * 0.12;
      applyAll(rx, ry, elev);
    };

    const startGyro = async () => {
      try {
        if (typeof DeviceOrientationEvent === "undefined") return false;
        if (typeof DeviceOrientationEvent.requestPermission === "function") {
          const ask = await DeviceOrientationEvent.requestPermission();
          if (ask !== "granted") return false;
        }
        window.addEventListener("deviceorientation", handleOrient, true);
        usingGyro = true;
        return true;
      } catch {
        return false;
      }
    };

    const tapToEnable = async () => {
      root.removeEventListener("click", tapToEnable);
      const ok = await startGyro();
      if (!ok) startBreathe();
    };

    (async () => {
      const ok = await startGyro();
      if (!ok) {
        root.addEventListener("click", tapToEnable, { once: true });
        startBreathe(); // start breathing now; gyro (if granted) will override
      }
    })();

    // Pause when off-screen
    const io = new IntersectionObserver(
      (entries) => {
        const onScreen = entries.some((en) => en.isIntersecting);
        if (!onScreen && rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        } else if (onScreen && !usingGyro && !rafId) {
          // resume fallback breathe
          startBreathe();
        }
      },
      { threshold: 0.01, rootMargin: "0px 0px -20% 0px" }
    );
    io.observe(root);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      io.disconnect();
      window.removeEventListener("deviceorientation", handleOrient, true);
      root.removeEventListener("click", tapToEnable);
    };
  }, [tabsRef, reduced]);

  return (
    <div className={styles.page} aria-busy={loading ? "true" : "false"}>
      
      {/* ===== HERO ===== */}
      <section
        className={`${styles.heroWrap} feedSection section--hero`}
        data-motion="parallax"
        data-dur="520"
        data-amp="1"
        role="banner"
        aria-label="Welcome"
        data-visible="true"
      >
        <div className={`${styles.hero} ${styles.hasVideo}`}>
          <div className={styles.heroStage} aria-hidden="true">
            <video
              key={heroSrc}
              ref={videoRef}
              className={styles.heroVideo}
              src={heroSrc}
              autoPlay={!reduced}
              muted
              loop
              playsInline
              preload="metadata"
              poster={HERO_POSTER}
              onLoadedData={(e) =>
                !reduced && e.currentTarget.play().catch(() => {})
              }
              onError={() =>
                console.warn("Hero video failed to load. Check /public/videos paths.")
              }
            />
          </div>

          <div className={styles.heroScrim} aria-hidden="true" />

          <div className={styles.heroInner}>
            <h1 className={styles.title}>{t('feed.hello')}, {userName}</h1>
            <p className={styles.subtitle}>
              {t('feed.welcomeMessage')}
            </p>
          </div>

          <div
            className={styles.heroTabsWrap}
            role="tablist"
            aria-label="Feed categories"
            ref={tabsRef}
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                data-key={tab.key}
                role="tab"
                aria-selected="false"
                className={`${styles.tab} tab-magnet`}
                onClick={() => onTabClick(tab.key)}
                onPointerMove={(e) => {
                  // magnetic + hotspot follows pointer while hovered
                  const r = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - r.left) / r.width;
                  const y = (e.clientY - r.top) / r.height;
                  const dx = (x - 0.5) * 6;
                  const dy = (y - 0.5) * 6;

                  e.currentTarget.style.setProperty("--gx", `${x * 100}%`);
                  e.currentTarget.style.setProperty("--gy", `${y * 100}%`);
                  e.currentTarget.style.setProperty("--mx", `${dx}px`);
                  e.currentTarget.style.setProperty("--my", `${dy}px`);

                  // pointer-driven 3D tilt
                  e.currentTarget.style.setProperty(
                    "--rx",
                    `${(-dy * 1.6).toFixed(2)}deg`
                  );
                  e.currentTarget.style.setProperty(
                    "--ry",
                    `${(dx * 1.8).toFixed(2)}deg`
                  );
                  e.currentTarget.style.setProperty(
                    "--elev",
                    `${(1.5 + (Math.abs(dx) + Math.abs(dy)) * 0.12).toFixed(
                      2
                    )}px`
                  );
                }}
                onPointerLeave={(e) => {
                  // release back to auto-drive; easing handled by CSS transitions
                  e.currentTarget.style.setProperty("--mx", `0px`);
                  e.currentTarget.style.setProperty("--my", `0px`);
                  e.currentTarget.style.setProperty("--rx", `0deg`);
                  e.currentTarget.style.setProperty("--ry", `0deg`);
                  e.currentTarget.style.setProperty("--elev", `0px`);
                }}
              >
                <span className={styles.tabLabel}>{t(tab.labelKey)}</span>
              </button>
            ))}
          </div>

          <div className={styles.heroGradientBottom} aria-hidden="true" />
        </div>
      </section>

      {/* ===== Subheader (shows after hero) ===== */}
      <div className={`${styles.subHeader} ${subActive ? styles.isActive : ""}`}>
        <div className={styles.subInner}>
          <div className={styles.subTitle}>{t('feed.explore')}</div>
          <div className={styles.subTabs} role="tablist" aria-label="Quick categories">
            {TABS.map((tab) => (
              <button key={`sub-${tab.key}`} onClick={() => onTabClick(tab.key)}>
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Rentals ===== */}
      <section
        className={`${styles.sectionRow} feedSection section--rentals`}
        data-motion="lift"
        data-dur="420"
        data-delay="40"
        data-amp="1.0"
        aria-labelledby="rentals-title"
        aria-busy={loading ? "true" : "false"}
      >
        <header className={styles.sectionHeader}>
          <h2 id="rentals-title" className={styles.sectionTitle}>
            {t('feed.sections.rentals')}
          </h2>
          <Link
            className={styles.viewAllBtn}
            to="/app/rentals"
            aria-label={t('feed.viewAll') + ' rentals'}
          >
            <span>{t('feed.viewAll')}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M8 4l8 8-8 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </header>
        <PeekStrip items={rentals} ariaLabel={`Latest rentals (${rentals.length})`} />
      </section>

      {/* ===== Home Swap ===== */}
      <section
        className={`${styles.sectionRow} feedSection section--homeswap`}
        data-motion="slide-right"
        data-dur="460"
        data-delay="70"
        data-amp="1.1"
        aria-labelledby="swap-title"
        aria-busy={loading ? "true" : "false"}
      >
        <header className={styles.sectionHeader}>
          <h2 id="swap-title" className={styles.sectionTitle}>
            {t('feed.sections.homeSwap')}
          </h2>
          <Link
            className={styles.viewAllBtn}
            to="/app/homeswap"
            aria-label={t('feed.viewAll') + ' home swaps'}
          >
            <span>{t('feed.viewAll')}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M8 4l8 8-8 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </header>
        <PeekStrip
          items={homeSwap}
          ariaLabel={`Latest home swaps (${homeSwap.length})`}
        />
      </section>

      {/* ===== Services ===== */}
      <section
        className={`${styles.sectionRow} feedSection section--services`}
        data-motion="tilt-up"
        data-dur="440"
        data-delay="80"
        data-amp="1.0"
        aria-labelledby="services-title"
        aria-busy={loading ? "true" : "false"}
      >
        <header className={styles.sectionHeader}>
          <h2 id="services-title" className={styles.sectionTitle}>
            {t('feed.sections.services')}
          </h2>
          <Link
            className={styles.viewAllBtn}
            to="/app/services"
            aria-label={t('feed.viewAll') + ' services'}
          >
            <span>{t('feed.viewAll')}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M8 4l8 8-8 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </header>
        <PeekStrip items={services} ariaLabel={`Latest services (${services.length})`} />
      </section>

      {/* ===== Ads (wired inline timeline) ===== */}
      <section
        className={`${styles.sectionRow} feedSection section--ads`}
        data-motion="scale-pop"
        data-dur="400"
        data-delay="50"
        data-amp="0.9"
        aria-labelledby="ads-title"
        aria-busy={loading ? "true" : "false"}
      >
        <header className={styles.sectionHeader}>
          <h2 id="ads-title" className={styles.sectionTitle}>
            {t('feed.sections.communityPostsAds')}
          </h2>
        </header>

        <PostStatusBox 
          user={user} 
          onPostClick={() => navigate('/app/ads/post')}
          onPostSuccess={() => {
            // Refresh the ads feed when a new post is created
            window.location.reload(); // Simple refresh for now
          }}
        />

        <AdsFeedTimeline items={ads} />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <Link
            className={styles.viewAllBtn}
            to="/app/ads"
            aria-label={t('feed.a11y.viewAllPostsAds')}
          >
            <span>{t('feed.viewAll')}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M8 4l8 8-8 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* Status + skeletons */}
      {error && (
        <div className={styles.error} role="alert" aria-live="polite">
          {error}{" "}
          <button
            className={styles.viewAllBtn}
            onClick={async () => {
              try {
                setError("");
                setLoading(true);
                await load(null);
              } catch (e) {
                console.error(e);
                setError("Failed to load feed");
              } finally {
                setLoading(false);
              }
            }}
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      {loading && (
        <div className={styles.skeletonGrid} aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`sk-${i}`} className={styles.skelCard} />
          ))}
        </div>
      )}

      {/* Loading more indicator */}
      {loadingMore && !loading && (
        <div className={styles.loadMoreWrap}>
          <div className={styles.loadingIndicator}>
            <InlineSpinner size="sm" color="var(--text-2)" />
            <span>{t('feed.loadingMore', 'Loading more posts...')}</span>
          </div>
        </div>
      )}

      {/* End of feed indicator */}
      {!nextCursor && !loading && !error && (ads.length > 0 || rentals.length > 0 || homeSwap.length > 0 || services.length > 0) && (
        <div className={styles.endOfFeed}>
          <span>{t('feed.endOfFeed', "You've reached the end of the feed")}</span>
        </div>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerCard}>
            <h4>{t('feed.safetyTips')}</h4>
            <ul>
              <li>{t('feed.meetInPublic')}</li>
              <li>{t('feed.useInAppMessages')}</li>
              <li>{t('feed.noSensitiveDocs')}</li>
            </ul>
          </div>
          <div className={styles.footerCard}>
            <h4>{t('feed.comingSoonApp')}</h4>
            <p>{t('feed.fasterAccess')}</p>
            <div className={styles.badges}>
              <a href="#" className={styles.storeBadge}>
                {t('feed.appStore')}
              </a>
              <a href="#" className={styles.storeBadge}>
                {t('feed.googlePlay')}
              </a>
            </div>
          </div>
          <div className={styles.footerCard}>
            <h4>{t('feed.stayInLoop')}</h4>
            <form
              className={styles.newsletter}
              onSubmit={(e) => {
                e.preventDefault();
                alert("Subscribed!");
              }}
            >
              <input type="email" placeholder={t('feed.emailAddress')} required />
              <button>{t('feed.subscribe')}</button>
            </form>
          </div>
          <div className={styles.footerCard}>
            <h4>{t('feed.quickLinks')}</h4>
            <nav className={styles.quickLinks}>
              <Link to="/app/about">{t('feed.about')}</Link>
              <Link to="/app/terms">{t('feed.terms')}</Link>
              <Link to="/app/privacy">{t('feed.privacy')}</Link>
            </nav>
          </div>
        </div>
        <div className={styles.copy}>© {new Date().getFullYear()} {t('nav.habeshaCommunity')}</div>
      </footer>
    </div>
  );
}
