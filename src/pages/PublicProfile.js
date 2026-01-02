// src/pages/PublicProfile.js
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axiosInstance";
import { makeApiUrl } from "../api/httpUrl";
import { getRentalCoverUrl } from "../api/rentals";
import { toast } from "react-toastify";
import useAuth from "../hooks/useAuth";

import styles from "../stylus/sections/PublicProfile.module.scss";
import Avatar from "../components/Avatar";
import buttonStyles from "../stylus/components/Button.module.scss";

/* ============================ constants / utils ============================ */

const TABS = ["about", "ads", "rentals", "services", "events", "photos"];
const API_FRIENDS = "/api/friends";

const FALLBACK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const asArray = (v) => (Array.isArray(v) ? v : v?.content ?? v?.items ?? []);
const keyOf = (it, i) =>
  String(it?.id ?? it?._id ?? it?.uuid ?? it?.slug ?? `idx-${i}`);
const dedupe = (arr) => {
  const out = [];
  const seen = new Set();
  asArray(arr).forEach((it, i) => {
    const k = keyOf(it, i);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(it);
    }
  });
  return out;
};

/** resolve relative/partial image URLs to absolute */
const normalizeImg = (src) => {
  if (!src) return null;
  return /^(https?:)?\/\//i.test(src) || String(src).startsWith("data:")
    ? src
    : makeApiUrl(src);
};

/** date helpers */
const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return "";
  }
};
const fmtDateTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
};
const timeAgo = (iso) => {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};
const isOnline = (lastSeenIso) => {
  if (!lastSeenIso) return false;
  const diff = Date.now() - new Date(lastSeenIso).getTime();
  return diff < 5 * 60 * 1000; // 5 minutes
};

/**
 * does this item "belong" to this user id?
 *
 * NOTE: for ClassifiedAd, backend exposes posterId / poster (not ownerId),
 * so we include posterId and poster?.id here.
 */
const owns = (it, id) => {
  const ids = [
    it.userId,
    it.ownerId,
    it.createdById,
    it.authorId,
    it.organizerId,
    it.providerId,
    it.vendorId,
    it.hostId,
    it.profileId,
    it.uploaderId,
    it.sellerId,

    // ClassifiedAd
    it.posterId,

    // nested objects:
    it.user?.id,
    it.owner?.id,
    it.createdBy?.id,
    it.author?.id,
    it.organizer?.id,
    it.provider?.id,
    it.vendor?.id,
    it.host?.id,
    it.profile?.id,
    it.uploader?.id,
    it.poster?.id,
  ].filter((x) => x != null);

  return ids.some((v) => String(v) === String(id));
};

const notRepost = (it) =>
  !(
    it?.repostOf ||
    it?.sharedFrom ||
    it?.reshareOf ||
    it?.forwardedFrom ||
    it?.parentShareId
  );

const filterMine = (arr, id) =>
  dedupe(asArray(arr).filter((it) => owns(it, id) && notRepost(it)));

const browseRoute = (type, ownerId) =>
  `/app/${type}?ownerId=${encodeURIComponent(ownerId)}`;
const detailRoute = (type, id) =>
  `/app/${encodeURIComponent(type)}/${encodeURIComponent(id)}`;
const profileRoute = (user) =>
  user?.id
    ? `/app/profile/${user.id}`
    : user?.username
    ? `/app/u/${encodeURIComponent(user.username)}`
    : "/";

const firstString = (...vals) =>
  vals.find((v) => typeof v === "string" && v.trim().length > 0) || "";

/* ---------- rental thumb helpers ---------- */

const resolveRentalId = (item) => {
  return (
    item?.id ??
    item?.rentalId ??
    item?.listingId ??
    item?.publicId ??
    item?.uuid ??
    item?._id ??
    null
  );
};

/**
 * Try to get a thumbnail for a rental card.
 * Priority:
 *   1. item.firstPhotoUrl
 *   2. /rentals/{id}/photos/first
 *   3. getRentalCoverUrl(item)
 */
const getRentalThumbForProfile = (item) => {
  const rId = resolveRentalId(item);

  if (item?.firstPhotoUrl) {
    return makeApiUrl(item.firstPhotoUrl);
  }

  if (rId) {
    return makeApiUrl(`/rentals/${encodeURIComponent(rId)}/photos/first`);
  }

  if (typeof getRentalCoverUrl === "function") {
    const maybe = getRentalCoverUrl(item);
    if (maybe) return makeApiUrl(maybe);
  }

  return null;
};

/**
 * Generic thumbnail picker for non-rental visual types (ads, home-swap, etc.)
 */
const getGenericThumbForProfile = (it) => {
  if (!it) return null;

  const candidates = [
    it.coverUrl,
    it.coverImage,
    it.coverImageUrl,
    it.mainImageUrl,
    it.mainPhotoUrl,
    it.firstPhotoUrl,
    it.photoUrl,
    it.imageUrl,
    it.thumbnail,
    it.thumbUrl,
    it.coverPhoto,
    it.coverPhotoUrl,
    Array.isArray(it.photos) &&
      it.photos[0] &&
      (it.photos[0].url || it.photos[0]),
    Array.isArray(it.images) && it.images[0],
    Array.isArray(it.pictures) && it.pictures[0],
    Array.isArray(it.media) && it.media[0],
    Array.isArray(it.gallery) && it.gallery[0],
  ].filter(Boolean);

  if (!candidates.length) return null;
  return makeApiUrl(candidates[0]);
};

/* ---------- event helpers ---------- */
const formatEventWhen = (evt) => {
  const rawWhen =
    evt.startTime ||
    evt.startDate ||
    evt.date ||
    evt.when ||
    evt.start ||
    evt.start_at ||
    evt.beginAt ||
    evt.begin_at;
  if (!rawWhen) return null;
  return fmtDateTime(rawWhen);
};
const formatEventWhere = (evt) => {
  return (
    evt.location ||
    evt.venue ||
    evt.place ||
    evt.address ||
    evt.city ||
    evt.hostCity ||
    evt.area ||
    null
  );
};
const formatEventBlurb = (evt) => {
  return (
    evt.description ||
    evt.details ||
    evt.body ||
    evt.content ||
    evt.summary ||
    evt.about ||
    ""
  );
};

/* ============================ small UI helpers ============================ */

/** role / trust badges under the name */
function RoleBadges({ profile }) {
  if (!profile) return null;

  const badges = [];

  // Verified
  if (profile.verified) {
    badges.push({ label: "Verified", kind: "verified" });
  }

  // roles array (ADMIN, MODERATOR, SERVICE_PROVIDER...)
  const roles = Array.isArray(profile.roles) ? profile.roles : [];
  roles.forEach((r) => {
    const R = String(r).toUpperCase();
    if (R.includes("ADMIN")) {
      badges.push({ label: "Admin", kind: "admin" });
    } else if (R.includes("MOD")) {
      badges.push({ label: "Moderator", kind: "mod" });
    } else if (R.includes("SERVICE")) {
      badges.push({ label: "Service Provider", kind: "service" });
    }
  });

  if (!badges.length) return null;

  return (
    <div className={styles.badgeRow} aria-label="User badges">
      {badges.map((b, i) => (
        <span
          key={i}
          className={`${styles.badgeChip} ${
            styles["badge_" + b.kind] || ""
          }`}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}

/** "Reach me" card inside About */
function ContactInfo({ profile }) {
  const { t } = useTranslation();
  
  if (!profile) return null;

  const phone =
    profile.phone || profile.phoneNumber || profile.mobile || profile.contactPhone;
  const whatsapp =
    profile.whatsapp ||
    profile.whatsApp ||
    profile.whatsappNumber ||
    profile.contactWhatsapp;
  const email =
    profile.emailPublic ||
    profile.contactEmail ||
    profile.email ||
    profile.businessEmail;
  const website = profile.website || profile.link || profile.url;

  // if they haven't shared anything public, don't render the card at all
  if (!phone && !whatsapp && !email && !website) return null;

  const copy = async (val, label) => {
    try {
      await navigator.clipboard.writeText(val);
      toast.success(`${label} copied`);
    } catch {
      toast.info(val);
    }
  };

  return (
    <div className={styles.contactCard}>
      <div className={styles.contactHeader}>
        <h3 className={styles.contactTitle}>{t("profile.reachMe")}</h3>
      </div>

      <ul className={styles.contactList}>
        {phone && (
          <li className={styles.contactItem}>
            <span className={styles.contactKey}>{t("profile.phone")}:</span>
            <button
              className={styles.contactVal}
              onClick={() => copy(phone, "Phone")}
            >
              {phone}
            </button>
          </li>
        )}

        {whatsapp && (
          <li className={styles.contactItem}>
            <span className={styles.contactKey}>{t("profile.whatsapp")}:</span>
            <button
              className={styles.contactVal}
              onClick={() => copy(whatsapp, "WhatsApp")}
            >
              {whatsapp}
            </button>
          </li>
        )}

        {email && (
          <li className={styles.contactItem}>
            <span className={styles.contactKey}>{t("profile.email")}:</span>
            <button
              className={styles.contactVal}
              onClick={() => copy(email, "Email")}
            >
              {email}
            </button>
          </li>
        )}

        {website && (
          <li className={styles.contactItem}>
            <span className={styles.contactKey}>{t("profile.website")}:</span>
            <a
              className={styles.contactValLink}
              href={website}
              target="_blank"
              rel="noopener noreferrer"
            >
              {website}
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}

/** the little stat row (Ads / Rentals / … / Photos) */
function QuickStatsBar({ counts, onJump }) {
  const { t } = useTranslation();
  
  const order = [
    ["ads", t("profile.tabs.ads")],
    ["rentals", t("profile.tabs.rentals")],
    ["services", t("profile.tabs.services")],
    ["events", t("profile.tabs.events")],
    ["swaps", t("homeSwap.homeSwap")],
    ["photos", t("profile.tabs.photos")],
  ];

  return (
    <div
      className={styles.quickStatsBar}
      role="navigation"
      aria-label="Quick stats"
    >
      {order.map(([key, label]) => {
        const val = counts[key] || 0;
        // hide swaps if none, because Home Swap is optional
        if (key === "swaps" && !val) return null;
        return (
          <button
            key={key}
            className={styles.statBtn}
            onClick={() => onJump(key === "swaps" ? "home-swap" : key)}
          >
            <span className={styles.statNum}>{val}</span>
            <span className={styles.statLabel}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================ Report Modal ============================ */
function ReportModal({ open, onClose, onSubmit, submitting, targetName }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.reportOverlay} role="dialog" aria-modal="true">
      <div className={styles.reportCard}>
        <div className={styles.reportTitle}>
          Report {targetName || "this user"}
        </div>
        <div className={styles.reportNote}>
          Please tell us briefly why you’re reporting. Your message will be sent
          to site moderators and admins. They may contact you for more details.
        </div>

        <textarea
          className={styles.reportTextarea}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Example: harassment / scam / fake account / inappropriate content"
        />

        <div className={styles.reportFooterRow}>
          <button
            type="button"
            className={styles.reportBtnCancel}
            onClick={onClose}
            disabled={submitting}
          >
            {t("profile.cancel")}
          </button>

          <button
            type="button"
            className={styles.reportBtnSubmit}
            onClick={() => onSubmit(reason)}
            disabled={submitting || !reason.trim()}
          >
            {submitting ? "Sending…" : "Send report"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ Main component ============================ */
export default function PublicProfile() {
  const { t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // FRIEND STATE
  const [friendState, setFriendState] = useState("NONE");
  const [incomingReqId, setIncomingReqId] = useState(null);
  const [outgoingReqId, setOutgoingReqId] = useState(null);

  // CONTACT REQUEST STATE
  // "NONE" | "REQUEST_SENT" | "APPROVED"
  const [contactState, setContactState] = useState("NONE");

  // BLOCK STATE
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  // sections
  const [mutual, setMutual] = useState([]);
  const [ads, setAds] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [services, setServices] = useState([]);
  const [events, setEvents] = useState([]);
  const [swaps, setSwaps] = useState([]); // Home Swap
  const [photos, setPhotos] = useState([]);

  // tab UI
  const [activeTab, setActiveTab] = useState(() => {
    const q = new URLSearchParams(location.search);
    return q.get("tab") && TABS.includes(q.get("tab")) ? q.get("tab") : "about";
  });

  // report modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSending, setReportSending] = useState(false);

  // refs for scroll targets
  const sectionRefs = {
    about: useRef(null),
    ads: useRef(null),
    rentals: useRef(null),
    services: useRef(null),
    events: useRef(null),
    photos: useRef(null),
  };

  const routeKey = params.id
    ? `id:${params.id}`
    : params.username
    ? `u:${params.username}`
    : "none";

  /* ---------------- Profile + content loader ---------------- */
  useEffect(() => {
    const ac = new AbortController();
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const { signal } = ac;

        // 1. load profile
        const profResp = params.id
          ? await api.get(`/api/users/${params.id}`, { signal })
          : await api.get(
              `/api/users/by-username/${encodeURIComponent(
                params.username
              )}`,
              { signal }
            );
        const prof = profResp.data;
        if (!mounted) return;
        setProfile(prof);

        // 2. friend status (only if viewing someone else)
        if (currentUser && prof && prof.id !== currentUser.id) {
          await resolveFriendState(
            prof.id,
            setFriendState,
            setIncomingReqId,
            setOutgoingReqId,
            signal
          );
        } else {
          setFriendState("NONE");
          setIncomingReqId(null);
          setOutgoingReqId(null);
        }

        // 3. contact request status (only if viewing someone else)
        if (currentUser && prof && prof.id !== currentUser.id) {
          try {
            // GET /contact/status/{targetUserId}
            const stRes = await api.get(`/contact/status/${prof.id}`, {
              signal,
            });
            if (mounted) {
              setContactState(
                stRes.data?.status
                  ? String(stRes.data.status).toUpperCase()
                  : "NONE"
              );
            }
          } catch (err) {
            if (mounted) setContactState("NONE");
          }
        } else {
          setContactState("NONE");
        }

        // 4. check block status (only if viewing someone else)
        if (currentUser && prof && prof.id !== currentUser.id) {
          try {
            const blockRes = await api.get(`/api/relationship/check?targetId=${prof.id}`, {
              signal,
            });
            if (mounted) {
              setIsBlocked(blockRes.data?.isBlocked || false);
            }
          } catch (err) {
            if (mounted) setIsBlocked(false);
          }
        } else {
          setIsBlocked(false);
        }

        // 4. mutual friends
        try {
          const m = (await api.get(`/friends/mutual/${prof.id}`, { signal }))
            .data;
          if (mounted) setMutual(dedupe(m));
        } catch {
          if (mounted) setMutual([]);
        }

        // 5. ads / rentals / services / events / swaps
        const reqs = await Promise.allSettled([
          api.get(`/api/ads`, {
            params: { ownerId: prof.id, limit: 50 },
            signal,
          }),
          api.get(`/api/rentals`, {
            params: { ownerId: prof.id, limit: 50 },
            signal,
          }),
          api.get(`/api/services`, {
            params: { ownerId: prof.id, limit: 50 },
            signal,
          }),
          api.get(`/api/events`, {
            params: { ownerId: prof.id, limit: 50 },
            signal,
          }),
          api.get(`/homeswap`, {
            params: { ownerId: prof.id, limit: 50 },
            signal,
          }),
        ]);
        if (!mounted) return;

        const rawAds =
          reqs[0].status === "fulfilled" ? reqs[0].value.data : [];
        const rawRentals =
          reqs[1].status === "fulfilled" ? reqs[1].value.data : [];
        const rawServices =
          reqs[2].status === "fulfilled" ? reqs[2].value.data : [];
        const rawEvents =
          reqs[3].status === "fulfilled" ? reqs[3].value.data : [];
        const rawSwaps =
          reqs[4].status === "fulfilled" ? reqs[4].value.data : [];

        setAds(filterMine(rawAds, prof.id));
        setRentals(filterMine(rawRentals, prof.id));
        setServices(filterMine(rawServices, prof.id));
        setEvents(filterMine(rawEvents, prof.id));
        setSwaps(filterMine(rawSwaps, prof.id));

        // 6. photos
        const rp = dedupe(prof?.photos ?? []);
        setPhotos(
          asArray(rp).filter((p) => {
            const ownerish =
              p?.uploaderId ??
              p?.ownerId ??
              p?.userId ??
              p?.user?.id ??
              p?.uploader?.id;
            return ownerish ? String(ownerish) === String(prof.id) : true;
          })
        );
      } catch (e) {
        if (!ac.signal.aborted) {
          console.error(e);
          toast.error("Failed to load profile");
          if (mounted) setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey, currentUser?.id]);

  /* ---------------- Sticky tab scroll-spy ---------------- */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (top?.target?.id && TABS.includes(top.target.id)) {
          setActiveTab(top.target.id);
        }
      },
      { rootMargin: "-56px 0px -60% 0px", threshold: [0.2, 0.4, 0.6, 0.8] }
    );

    TABS.forEach((t) => {
      const el = sectionRefs[t]?.current;
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- reflect active tab in URL (?tab=) ---------------- */
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get("tab") !== activeTab) {
      q.set("tab", activeTab);
      navigate({ search: q.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const isSelf = useMemo(
    () => !!(currentUser && profile && profile.id === currentUser.id),
    [currentUser, profile]
  );

  /* ---------------- Friend actions ---------------- */
  const sendFriendRequest = async () => {
    try {
      await api.post(`${API_FRIENDS}/request/${profile.id}`);
      setFriendState("REQUEST_SENT");
      await resolveFriendState(
        profile.id,
        setFriendState,
        setIncomingReqId,
        setOutgoingReqId
      );
      toast.success("Friend request sent");
    } catch (err) {
      toast.error(err?.response?.data || "Failed to send friend request");
    }
  };

  const acceptRequest = async () => {
    try {
      await api.post(`${API_FRIENDS}/accept/${profile.id}`);
      setFriendState("FRIENDS");
      setIncomingReqId(null);
      toast.success("Friend request accepted");
    } catch (err) {
      toast.error(err?.response?.data || "Failed to accept request");
    }
  };

  const declineRequest = async () => {
    try {
      await api.post(`${API_FRIENDS}/decline/${profile.id}`);
      setFriendState("NONE");
      setIncomingReqId(null);
      toast.success("Friend request declined");
    } catch (err) {
      toast.error(err?.response?.data || "Failed to decline request");
    }
  };

  const cancelOutgoing = async () => {
    try {
      if (outgoingReqId) {
        await api.post(`/friends/requests/cancel`, {
          requestId: outgoingReqId,
        });
      }
      setFriendState("NONE");
      setOutgoingReqId(null);
      toast.info("Friend request cancelled");
    } catch (err) {
      toast.error(err?.response?.data || "Failed to cancel request");
    }
  };

  const removeFriend = async () => {
    const ok = window.confirm(
      `Remove ${firstString(
        profile.displayName,
        profile.username,
        "this user"
      )} from your friends?`
    );
    if (!ok) return;
    try {
      await api.delete(`${API_FRIENDS}/${profile.id}`);
      setFriendState("NONE");
      toast.success("Friend removed");
    } catch (err) {
      toast.error(err?.response?.data || "Failed to remove friend");
    }
  };

  /* ---------------- Contact request actions ---------------- */
  // POST /contact/request  body: { targetUserId, type: "phone" | "email" }
  const requestContact = async (contactType = "phone") => {
    if (!profile?.id) return;
    try {
      await api.post(`/contact/request`, {
        targetUserId: profile.id,
        type: String(contactType).toLowerCase(), // IMPORTANT: backend needs lowercase
      });
      setContactState("REQUEST_SENT");
      toast.success("Contact request sent");
    } catch (err) {
      console.error("[contact request] failed", err);
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to request contact"
      );
    }
  };

  /* ---------------- Messaging deep-link ---------------- */
  const onMessage = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const mod = await import("../ensureThreadAndNavigate").catch(() => null);
      if (mod?.ensureThreadAndNavigate) {
        await mod.ensureThreadAndNavigate(navigate, profile.id, api);
        return;
      }
    } catch {
      /* ignore */
    }
    navigate(`/app/messages?to=${encodeURIComponent(profile.id)}`);
  }, [navigate, profile?.id]);

  /* ---------------- Share / Report / Block ---------------- */
  const onShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied");
    } catch {
      toast.info(url);
    }
  };

  const onOpenReport = () => {
    if (isSelf) {
      toast.info("You can't report yourself.");
      return;
    }
    setReportOpen(true);
  };

  const onCloseReport = () => {
    if (!reportSending) setReportOpen(false);
  };

  // aligned with /api/reports/user
  const onSubmitReport = async (text) => {
    if (!text.trim()) return;
    setReportSending(true);

    try {
      await api.post("/api/reports/user", {
        targetUserId: profile.id,
        reason: text.trim(),
      });

      toast.success("Report sent to moderators.");
      setReportOpen(false);
    } catch (err) {
      console.error("[Report] failed:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Could not send report.";
      toast.error(String(msg));
    } finally {
      setReportSending(false);
    }
  };

  const onBlock = async () => {
    if (isBlocked) {
      toast.info("User is already blocked");
      return;
    }
    
    const ok = window.confirm(
      `Block ${firstString(
        profile.displayName,
        profile.username,
        "this user"
      )}? They won't be able to view your profile and you won't see theirs.`
    );
    if (!ok) return;
    
    setBlockLoading(true);
    try {
      await api.post(`/api/users/me/blocks/${profile.id}`);
      setIsBlocked(true);
      toast.success("User blocked successfully");
      
      // Optionally navigate away after blocking
      setTimeout(() => {
        navigate('/app/home');
      }, 1500);
    } catch (err) {
      console.error("[Block] failed:", err);
      const msg = err?.response?.data?.message || err?.response?.data || "Failed to block user";
      toast.error(String(msg));
    } finally {
      setBlockLoading(false);
    }
  };

  const onUnblock = async () => {
    if (!isBlocked) {
      toast.info("User is not blocked");
      return;
    }
    
    const ok = window.confirm(
      `Unblock ${firstString(
        profile.displayName,
        profile.username,
        "this user"
      )}?`
    );
    if (!ok) return;
    
    setBlockLoading(true);
    try {
      // First get the block ID
      const { data: blocks } = await api.get('/api/users/me/blocks');
      const blockRecord = blocks.find(b => b.userId === profile.id);
      
      if (blockRecord) {
        await api.delete(`/api/users/me/blocks/${blockRecord.id}`);
        setIsBlocked(false);
        toast.success("User unblocked successfully");
      } else {
        toast.error("Block record not found");
      }
    } catch (err) {
      console.error("[Unblock] failed:", err);
      const msg = err?.response?.data?.message || err?.response?.data || "Failed to unblock user";
      toast.error(String(msg));
    } finally {
      setBlockLoading(false);
    }
  };

  /* ---------------- helpers ---------------- */
  const scrollTo = (tabKey) => {
    // swaps lives under id="home-swap"
    const el =
      tabKey === "home-swap"
        ? document.getElementById("home-swap")
        : sectionRefs[tabKey]?.current;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goBrowse = useCallback(
    (type) => {
      if (!profile?.id) return;
      navigate(browseRoute(type, profile.id));
    },
    [navigate, profile?.id]
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonHero} />
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
      </div>
    );
  }
  if (!profile)
    return <div className={styles.container}>Profile not found</div>;

  // Show blocked message if user is blocked
  if (isBlocked && !isSelf) {
    return (
      <div className={styles.container}>
        <div className={styles.blockedMessage}>
          <h2>User Blocked</h2>
          <p>You have blocked this user. You cannot view their profile.</p>
          <div className={styles.blockedActions}>
            <button
              className={`${buttonStyles.btn} ${buttonStyles.primary}`}
              onClick={onUnblock}
              disabled={blockLoading}
            >
              {blockLoading ? "Unblocking..." : "Unblock User"}
            </button>
            <button
              className={`${buttonStyles.btn} ${buttonStyles.outline}`}
              onClick={() => navigate('/app/home')}
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = firstString(
    profile.displayName,
    profile.fullName,
    profile.username,
    "User"
  );

  const lastSeenText = isOnline(profile.lastSeenAt)
    ? "Online"
    : profile.lastSeenAt
    ? `Last seen ${timeAgo(profile.lastSeenAt)}`
    : null;

  const counts = {
    ads: ads.length,
    rentals: rentals.length,
    services: services.length,
    events: events.length,
    swaps: swaps.length,
    photos: photos.length,
  };

  /* ============================ RENDER ============================ */
  return (
    <div className={styles.container}>
      {/* Report modal */}
      <ReportModal
        open={reportOpen}
        onClose={onCloseReport}
        onSubmit={onSubmitReport}
        submitting={reportSending}
        targetName={displayName}
      />

      {/* ============================ HERO ============================ */}
      <section className={styles.hero} data-contrast="auto">
        <div
          className={styles.cover}
          style={{
            backgroundImage: profile.bannerUrl
              ? `url(${normalizeImg(profile.bannerUrl)})`
              : undefined,
          }}
          aria-label="Profile cover"
        />

        <div className={styles.heroOverlay}>
          <div className={styles.identityRow}>
            {/* avatar + presence dot */}
            <div className={styles.avatarWrapOuter}>
              <Avatar
                src={profile.avatarUrl || profile.profileImageUrl}
                size={120}
                rounded
                alt={displayName || "Avatar"}
              />
              <span
                className={`${styles.presenceDot} ${
                  isOnline(profile.lastSeenAt) ? styles.online : styles.offline
                }`}
                title={lastSeenText || "Offline"}
              />
            </div>

            {/* name / handle / meta / actions */}
            <div className={styles.identity}>
              <div className={styles.nameRow}>
                <h1 className={styles.name}>{displayName}</h1>
              </div>

              <RoleBadges profile={profile} />

              <div className={styles.metaRow}>
                {profile.username && (
                  <span className={styles.handle}>@{profile.username}</span>
                )}

                {lastSeenText && (
                  <span
                    className={
                      isOnline(profile.lastSeenAt)
                        ? styles.metaOnline
                        : styles.meta
                    }
                  >
                    {lastSeenText}
                  </span>
                )}

                {profile.location && (
                  <span className={styles.meta}>{profile.location}</span>
                )}

                {profile.joinDate && (
                  <span className={styles.meta}>
                    {t("profile.joined")} {fmtDate(profile.joinDate)}
                  </span>
                )}
              </div>

              {/* Actions row */}
              <div
                className={styles.actions}
                role="group"
                aria-label="Profile actions"
              >
                {isSelf ? (
                  <>
                    <button
                      className={`${buttonStyles.btn} ${buttonStyles.primary}`}
                      onClick={() => navigate("/app/settings/profile")}
                    >
                      {t("profile.editProfile")}
                    </button>

                    <button
                      className={`${buttonStyles.btn} ${buttonStyles.outline}`}
                      onClick={() =>
                        navigate(
                          profile.username
                            ? `/app/u/${encodeURIComponent(
                                profile.username
                              )}?publicView=1`
                            : `/app/profile/${profile.id}?publicView=1`
                        )
                      }
                    >
                      View as public
                    </button>
                  </>
                ) : (
                  <>
                    {/* Friend relationship */}
                    {friendState === "NONE" && (
                      <button
                        className={`${buttonStyles.btn} ${buttonStyles.primary}`}
                        onClick={sendFriendRequest}
                      >
                        {t("profile.addFriend")}
                      </button>
                    )}

                    {friendState === "REQUEST_SENT" && (
                      <div
                        className={
                          buttonStyles.btnGroup +
                          " " +
                          buttonStyles.segmented
                        }
                      >
                        <button
                          className={`${buttonStyles.btn} ${buttonStyles.subtle}`}
                          disabled
                        >
                          {t("profile.requestSent")}
                        </button>
                        <button
                          className={`${buttonStyles.btn} ${buttonStyles.ghost}`}
                          onClick={cancelOutgoing}
                        >
                          {t("profile.cancel")}
                        </button>
                      </div>
                    )}

                    {friendState === "REQUEST_RECEIVED" && (
                      <div
                        className={
                          buttonStyles.btnGroup +
                          " " +
                          buttonStyles.segmented
                        }
                      >
                        <button
                          className={`${buttonStyles.btn} ${buttonStyles.primary}`}
                          onClick={acceptRequest}
                        >
                          {t("profile.accept")}
                        </button>
                        <button
                          className={`${buttonStyles.btn} ${buttonStyles.danger}`}
                          onClick={declineRequest}
                        >
                          {t("profile.decline")}
                        </button>
                      </div>
                    )}

                    {friendState === "FRIENDS" && (
                      <button
                        className={`${buttonStyles.btn} ${buttonStyles.danger}`}
                        onClick={removeFriend}
                      >
                        {t("profile.removeFriend")}
                      </button>
                    )}

                    {/* message */}
                    <button
                      className={`${buttonStyles.btn} ${buttonStyles.outline}`}
                      onClick={onMessage}
                    >
                      💬 {t("profile.message")}
                    </button>

                    {/* contact request */}
                    {contactState === "NONE" && (
                      <div
                        className={
                          buttonStyles.btnGroup +
                          " " +
                          buttonStyles.segmented
                        }
                        title="Ask this user to share their contact"
                      >
                        <button
                          className={`${buttonStyles.btn} ${buttonStyles.dangerGhost}`}
                          onClick={() => requestContact("phone")}
                          title="Ask for phone number"
                        >
                          📞 {t("profile.phone")}
                        </button>
                        <button
                          className={`${buttonStyles.btn} ${buttonStyles.dangerGhost}`}
                          onClick={() => requestContact("email")}
                          title="Ask for email"
                        >
                          ✉ {t("profile.email")}
                        </button>
                      </div>
                    )}

                    {contactState === "REQUEST_SENT" && (
                      <button
                        className={`${buttonStyles.btn} ${buttonStyles.subtle}`}
                        disabled
                        title="Waiting for approval"
                      >
                        Pending…
                      </button>
                    )}

                    {contactState === "APPROVED" && (
                      <button
                        className={`${buttonStyles.btn} ${buttonStyles.subtle}`}
                        disabled
                        title="Your request was approved"
                      >
                        Contact approved
                      </button>
                    )}
                  </>
                )}

                <div className={styles.moreMenu}>
                  <button
                    className={`${buttonStyles.btn} ${buttonStyles.ghost}`}
                    onClick={onShare}
                  >
                    {t("profile.share")}
                  </button>

                  {!isSelf && (
                    <>
                      <button
                        className={`${buttonStyles.btn} ${buttonStyles.ghost}`}
                        onClick={onOpenReport}
                      >
                        {t("profile.report")}
                      </button>

                      {isBlocked ? (
                        <button
                          className={`${buttonStyles.btn} ${buttonStyles.danger}`}
                          onClick={onUnblock}
                          disabled={blockLoading}
                        >
                          {blockLoading ? "Unblocking..." : "Blocked ✓"}
                        </button>
                      ) : (
                        <button
                          className={`${buttonStyles.btn} ${buttonStyles.ghost}`}
                          onClick={onBlock}
                          disabled={blockLoading}
                        >
                          {blockLoading ? "Blocking..." : t("profile.block")}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* quick stats row (Ads / Rentals / … / Photos) */}
              <QuickStatsBar counts={counts} onJump={scrollTo} />
            </div>
          </div>

          {/* Sticky tabs */}
          <nav
            className={styles.tabRail}
            aria-label="Profile sections"
            data-contrast="auto"
          >
            {TABS.map((tab) => {
              const count =
                tab === "about"
                  ? null
                  : tab === "ads"
                  ? ads.length
                  : tab === "rentals"
                  ? rentals.length
                  : tab === "services"
                  ? services.length
                  : tab === "events"
                  ? events.length
                  : photos.length;

              const label = t("profile.tabs." + tab);
              return (
                <button
                  key={tab}
                  className={`${styles.tabBtn} ${
                    activeTab === tab ? styles.tabActive : ""
                  }`}
                  onClick={() => scrollTo(tab)}
                  aria-current={activeTab === tab ? "page" : undefined}
                  data-active={activeTab === tab || undefined}
                >
                  <span className={styles.tabText}>{label}</span>
                  {count ? (
                    <span className={styles.tabCount} aria-hidden="true">
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
      </section>

      {/* ============================ ABOUT ============================ */}
      <section id="about" ref={sectionRefs.about} className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("profile.tabs.about")}</h2>

        {profile.bio ? (
          <p className={styles.bio}>{profile.bio}</p>
        ) : (
          <p className={styles.empty}>{t("profile.noBioYet")}</p>
        )}

        <ContactInfo profile={profile} />

        {!!mutual.length && (
          <div className={styles.subcard}>
            <div className={styles.subcardHeader}>
              <h3 className={styles.subcardTitle}>{t("profile.mutualFriends")}</h3>
              <button
                className={buttonStyles.btn}
                onClick={() =>
                  navigate(`/app/friends?userId=${profile.id}&type=mutual`)
                }
              >
                {t("profile.seeAll")} ({mutual.length})
              </button>
            </div>

            <div className={styles.mutualGrid}>
              {mutual.map((m, i) => {
                const id = m.id ?? m.userId ?? m._id;
                return (
                  <div
                    key={id ?? i}
                    className={styles.mutualItem}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate(profileRoute({ id, username: m.username }))
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      navigate(profileRoute({ id, username: m.username }))
                    }
                    title="Open profile"
                  >
                    <Avatar
                      src={m.avatarUrl || m.profileImageUrl}
                      size={44}
                      rounded
                    />
                    <span className={styles.mutualName}>
                      {m.displayName || m.fullName || m.username || "Friend"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ============================ ADS ============================ */}
      <SectionWithSeeAll
        id="ads"
        title={t("profile.tabs.ads")}
        count={ads.length}
        onSeeAll={() => goBrowse("ads")}
        refEl={sectionRefs.ads}
      >
        <ListGrid type="ads" items={ads} />
      </SectionWithSeeAll>

      {/* ============================ RENTALS ============================ */}
      <SectionWithSeeAll
        id="rentals"
        title={t("profile.tabs.rentals")}
        count={rentals.length}
        onSeeAll={() => goBrowse("rentals")}
        refEl={sectionRefs.rentals}
      >
        <ListGrid type="rentals" items={rentals} />
      </SectionWithSeeAll>

      {/* ============================ SERVICES ============================ */}
      <SectionWithSeeAll
        id="services"
        title={t("profile.tabs.services")}
        count={services.length}
        onSeeAll={() => goBrowse("services")}
        refEl={sectionRefs.services}
      >
        <ListGrid type="services" items={services} />
      </SectionWithSeeAll>

      {/* ============================ EVENTS ============================ */}
      <SectionWithSeeAll
        id="events"
        title={t("profile.tabs.events")}
        count={events.length}
        onSeeAll={() => goBrowse("events")}
        refEl={sectionRefs.events}
      >
        <ListGrid type="events" items={events} />
      </SectionWithSeeAll>

      {/* ============================ HOME SWAP (optional) ============================ */}
      {!!swaps.length && (
        <SectionWithSeeAll
          id="home-swap"
          title={t("homeSwap.homeSwap")}
          count={swaps.length}
          onSeeAll={() => goBrowse("home-swap")}
          refEl={undefined}
        >
          <ListGrid type="home-swap" items={swaps} />
        </SectionWithSeeAll>
      )}

      {/* ============================ PHOTOS ============================ */}
      <SectionWithSeeAll
        id="photos"
        title={t("profile.tabs.photos")}
        count={photos.length}
        onSeeAll={() => goBrowse("photos")}
        refEl={sectionRefs.photos}
      >
        {photos?.length ? (
          <div className={styles.photoGrid}>
            {photos.map((p, i) => {
              const open = () => {
                const pid = p.id ?? p._id ?? null;
                if (pid) navigate(detailRoute("photos", pid));
                else
                  navigate(
                    `${browseRoute("photos", profile.id)}&index=${i}`
                  );
              };
              return (
                <img
                  key={p.id ?? p.url ?? i}
                  src={p.url || p.imageUrl || p}
                  alt={p.alt || "Photo"}
                  loading="lazy"
                  role="button"
                  onClick={open}
                  onKeyDown={(e) => e.key === "Enter" && open()}
                  tabIndex={0}
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_PIXEL;
                  }}
                />
              );
            })}
          </div>
        ) : (
          <p className={styles.empty}>No photos yet.</p>
        )}
      </SectionWithSeeAll>
    </div>
  );
}

/* ============================ Section wrapper ============================ */
function SectionWithSeeAll({ id, title, count, onSeeAll, refEl, children }) {
  const { t } = useTranslation();
  
  return (
    <section id={id} ref={refEl} className={styles.section}>
      <div className={styles.sectionHeaderRow}>
        <h2 className={styles.sectionTitle}>
          {title}{" "}
          {typeof count === "number" ? (
            <span className={styles.sectionCount}>({count})</span>
          ) : null}
        </h2>
        <button className={buttonStyles.btn} onClick={onSeeAll}>
          {t("profile.seeAll")}{typeof count === "number" ? ` (${count})` : ""}
        </button>
      </div>
      {children}
    </section>
  );
}

/* ============================ Flat list grid ============================ */
function ListGrid({ items, type }) {
  const navigate = useNavigate();

  const openDetail = (it) => {
    const id =
      it.id ?? it._id ?? it.uuid ?? it.listingId ?? it.publicId;
    if (!id) return;
    navigate(detailRoute(type, id));
  };

  const safe = dedupe(items);
  if (!safe?.length) return <p className={styles.empty}>Nothing to show.</p>;

  return (
    <ul className={styles.listGrid}>
      {safe.map((it, i) => {
        const key = keyOf(it, i);
        const title = it.title || it.name || "Untitled";

        // shared info
        const price = it.price || it.rent || it.cost;
        const metaGuess =
          it.category ||
          it.type ||
          it.subtype ||
          it.location ||
          it.city ||
          it.hostCity;

        /* --------- ADS layout (text block left, like services/events) --------- */
        if (type === "ads") {
          const adDesc =
            it.description ||
            it.details ||
            it.body ||
            it.content ||
            it.summary ||
            it.about ||
            it.postText ||
            it.post ||
            it.message ||
            "";

          return (
            <li
              key={key}
              className={styles.listItem}
              role="button"
              tabIndex={0}
              onClick={() => openDetail(it)}
              onKeyDown={(e) => e.key === "Enter" && openDetail(it)}
              title="Open details"
            >
              {/* LEFT: ad text box */}
              <div
                className={styles.listThumb}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(0,0,0,0.05)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  padding: "8px",
                  fontSize: "0.8rem",
                  lineHeight: 1.4,
                  color: "var(--pf-ink-2,#64748b)",
                  overflow: "hidden",
                  wordBreak: "break-word",
                  textAlign: "left",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 6,
                  maxHeight: "100%",
                }}
              >
                <div
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 6,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    wordBreak: "break-word",
                    whiteSpace: "pre-line",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {adDesc || "No description provided."}
                </div>
              </div>

              {/* RIGHT: title / price / category */}
              <div className={styles.listMeta}>
                <div className={styles.itemTitle} title={title}>
                  {title}
                </div>

                <div className={styles.itemSubtle}>
                  {price ? (
                    <span className={styles.price}>£{String(price)}</span>
                  ) : null}
                  {metaGuess ? <span className={styles.dot}>•</span> : null}
                  {metaGuess ? <span>{metaGuess}</span> : null}
                </div>
              </div>
            </li>
          );
        }

        /* --------- SERVICES layout (big text box left) --------- */
        if (type === "services") {
          const serviceDesc =
            it.description ||
            it.details ||
            it.body ||
            it.content ||
            it.summary ||
            it.about ||
            "";

          return (
            <li
              key={key}
              className={styles.listItem}
              role="button"
              tabIndex={0}
              onClick={() => openDetail(it)}
              onKeyDown={(e) => e.key === "Enter" && openDetail(it)}
              title="Open details"
            >
              {/* LEFT: service description instead of image */}
              <div
                className={styles.listThumb}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(0,0,0,0.05)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  padding: "8px",
                  fontSize: "0.8rem",
                  lineHeight: 1.4,
                  color: "var(--pf-ink-2,#64748b)",
                  overflow: "hidden",
                  wordBreak: "break-word",
                  textAlign: "left",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 6,
                  maxHeight: "100%",
                }}
              >
                <div
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 6,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    wordBreak: "break-word",
                    whiteSpace: "pre-line",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {serviceDesc || "No description provided."}
                </div>
              </div>

              {/* RIGHT: title / price / metaGuess */}
              <div className={styles.listMeta}>
                <div className={styles.itemTitle} title={title}>
                  {title}
                </div>

                <div className={styles.itemSubtle}>
                  {price ? (
                    <span className={styles.price}>£{String(price)}</span>
                  ) : null}
                  {metaGuess ? <span className={styles.dot}>•</span> : null}
                  {metaGuess ? <span>{metaGuess}</span> : null}
                </div>
              </div>
            </li>
          );
        }

        /* --------- EVENTS layout (info box left) --------- */
        if (type === "events") {
          const whenLine = formatEventWhen(it);
          const whereLine = formatEventWhere(it);
          const blurb = formatEventBlurb(it);

          return (
            <li
              key={key}
              className={styles.listItem}
              role="button"
              tabIndex={0}
              onClick={() => openDetail(it)}
              onKeyDown={(e) => e.key === "Enter" && openDetail(it)}
              title="Open details"
            >
              {/* LEFT: event meta box */}
              <div
                className={styles.listThumb}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(0,0,0,0.05)",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  padding: "8px",
                  fontSize: "0.8rem",
                  lineHeight: 1.4,
                  color: "var(--pf-ink-2,#64748b)",
                  overflow: "hidden",
                  wordBreak: "break-word",
                  textAlign: "left",
                }}
              >
                {whenLine ? (
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      color: "var(--pf-ink-1,#0f172a)",
                      marginBottom: "4px",
                    }}
                  >
                    {whenLine}
                  </div>
                ) : null}

                {whereLine ? (
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--pf-ink-1,#0f172a)",
                      marginBottom: "4px",
                    }}
                  >
                    📍 {whereLine}
                  </div>
                ) : null}

                <div
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    wordBreak: "break-word",
                    whiteSpace: "pre-line",
                    flex: 1,
                    minWidth: 0,
                    color: "var(--pf-ink-2,#64748b)",
                  }}
                >
                  {blurb || "No description provided."}
                </div>
              </div>

              {/* RIGHT: title / price / metaGuess */}
              <div className={styles.listMeta}>
                <div className={styles.itemTitle} title={title}>
                  {title}
                </div>

                <div className={styles.itemSubtle}>
                  {price ? (
                    <span className={styles.price}>£{String(price)}</span>
                  ) : null}
                  {metaGuess ? <span className={styles.dot}>•</span> : null}
                  {metaGuess ? <span>{metaGuess}</span> : null}
                </div>
              </div>
            </li>
          );
        }

        /* --------- DEFAULT layout (rentals, home-swap, etc.) --------- */
        const img =
          type === "rentals"
            ? getRentalThumbForProfile(it)
            : getGenericThumbForProfile(it);

        return (
          <li
            key={key}
            className={styles.listItem}
            role="button"
            tabIndex={0}
            onClick={() => openDetail(it)}
            onKeyDown={(e) => e.key === "Enter" && openDetail(it)}
            title="Open details"
          >
            <div className={styles.listThumb}>
              {img ? (
                <img
                  src={img || FALLBACK_PIXEL}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_PIXEL;
                  }}
                />
              ) : (
                <div className={styles.thumbBlank} />
              )}
            </div>

            <div className={styles.listMeta}>
              <div className={styles.itemTitle} title={title}>
                {title}
              </div>

              <div className={styles.itemSubtle}>
                {price ? (
                  <span className={styles.price}>£{String(price)}</span>
                ) : null}
                {metaGuess ? <span className={styles.dot}>•</span> : null}
                {metaGuess ? <span>{metaGuess}</span> : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ============================ Friend-state resolver ============================ */
async function resolveFriendState(
  targetUserId,
  setState,
  setIncomingReqId,
  setOutgoingReqId,
  signal
) {
  try {
    // 1. already friends?
    try {
      const { data } = await api.get(`${API_FRIENDS}/me`, {
        params: { page: 0, size: 200 },
        signal,
      });
      const friends = asArray(data);
      if (
        friends.some(
          (u) => String(u?.id ?? u?.userId) === String(targetUserId)
        )
      ) {
        setState("FRIENDS");
        setIncomingReqId(null);
        setOutgoingReqId(null);
        return;
      }
    } catch {
      /* ignore */
    }

    // 2. incoming request from them to me?
    try {
      const { data } = await api.get(`/friends/requests/incoming`, {
        signal,
      });
      const incoming = asArray(data);
      const match = incoming.find(
        (r) =>
          String(r?.requesterId ?? r?.requester?.id) ===
          String(targetUserId)
      );
      if (match) {
        setState("REQUEST_RECEIVED");
        setIncomingReqId(match.id ?? null);
        setOutgoingReqId(null);
        return;
      }
    } catch {
      /* ignore */
    }

    // 3. outgoing request from me to them?
    try {
      const { data } = await api.get(`/friends/requests/outgoing`, {
        signal,
      });
      const outgoing = asArray(data);
      const match = outgoing.find(
        (r) =>
          String(r?.targetId ?? r?.target?.id) ===
          String(targetUserId)
      );
      if (match) {
        setState("REQUEST_SENT");
        setOutgoingReqId(match.id ?? null);
        setIncomingReqId(null);
        return;
      }
    } catch {
      /* ignore */
    }

    // 4. default
    setState("NONE");
    setIncomingReqId(null);
    setOutgoingReqId(null);
  } catch {
    setState("NONE");
  }
}
