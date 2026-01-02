// src/pages/Ads/Details.js
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import styles from "../../stylus/sections/Ads.module.scss";
import buttonStyles from "../../stylus/components/Button.module.scss";

import Avatar from "../../components/Avatar.jsx";
import CommentsThread from "../../components/ads/CommentsThread.jsx";
import ImageCarousel from "../../components/ImageCarousel.jsx";

import api from "../../api/axiosInstance";
import { getAdWithPhotos } from "../../api/ads";
import useAuth from "../../hooks/useAuth";
import { makeApiUrl } from "../../api/httpUrl";

/* -------------------------------------------------
   Helpers
--------------------------------------------------*/

/* Convert any avatar-like URL into a real absolute URL:
   - "http://..." or "https://..." => leave it
   - "/users/5/profile-image"      => makeApiUrl("/users/5/profile-image")
   - "myfile.jpg"                  => assume upload => makeApiUrl("/uploads/myfile.jpg")
   - null/undefined                => ""
*/
function normalizeUrl(u) {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) {
    return s; // already absolute
  }
  if (s.startsWith("/")) {
    return makeApiUrl(s); // backend-relative path
  }
  // bare filename / relative upload path
  return makeApiUrl(`/uploads/${s}`);
}

/* Try to guess avatar URL for any user.
   Priority:
   1. preview.profileImageUrl      (camelCase from /users/{id})
   2. preview.profile_image_url    (snake_case from /users/{id})
   3. inlineUrl (from ad dto or comment dto: authorAvatar, avatarUrl, etc.)
   4. fallback /users/{id}/profile-image
   Everything is normalized to absolute with normalizeUrl().
*/
function resolveAvatarUrl({ preview, inlineUrl, userId }) {
  if (preview?.profileImageUrl) {
    return normalizeUrl(preview.profileImageUrl);
  }
  if (preview?.profile_image_url) {
    return normalizeUrl(preview.profile_image_url);
  }
  if (inlineUrl) {
    return normalizeUrl(inlineUrl);
  }
  if (userId) {
    return normalizeUrl(`/users/${userId}/profile-image`);
  }
  return "";
}

/* Pick first available image from common ad fields */
function firstImage(it) {
  if (!it) return null;
  
  // First check for photos array (new system)
  if (Array.isArray(it?.photos) && it.photos.length > 0) {
    const f = it.photos[0];
    const u = typeof f === "string" ? f : f?.url || f?.src || f?.path || f?.secureUrl;
    if (u) return normalizeUrl(u);
  }
  
  // Then check for single image URL (old system)
  if (it?.imageUrl) {
    return normalizeUrl(it.imageUrl);
  }
  
  // Check other array formats
  const arrays = [
    it?.images,
    it?.pictures,
    it?.media,
    it?.gallery,
  ].filter(Boolean);

  for (const arr of arrays) {
    if (!Array.isArray(arr) || !arr.length) continue;
    const f = arr[0];
    const u =
      typeof f === "string"
        ? f
        : f?.url || f?.src || f?.path || f?.secureUrl;
    if (u) return normalizeUrl(u);
  }

  return normalizeUrl(
    it?.firstPhotoUrl || it?.coverUrl || null
  );
}

/* like bar summary text */
function likeSummaryText(likeCount, liked) {
  if (likeCount <= 0) return "0";

  if (liked) {
    if (likeCount === 1) return "You";
    return `You and ${likeCount - 1} other${
      likeCount - 1 === 1 ? "" : "s"
    }`;
  }

  return String(likeCount);
}

/* "3m", "2h", "1d", etc. */
function prettyTime(dateish) {
  const d = dateish ? new Date(dateish) : null;
  if (!d || isNaN(+d)) return "Just now";
  const sec = Math.max(0, (Date.now() - d.getTime()) / 1000);

  if (sec < 60) return "Just now";

  const mins = Math.floor(sec / 60);
  if (mins < 60) return `${mins}m`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;

  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;

  const years = Math.floor(days / 365);
  return `${years}y`;
}

/* -------------------------------------------------
   Component
--------------------------------------------------*/
export default function AdDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth() || {};

  // Ad data
  const [ad, setAd] = useState(null);
  const [loadingAd, setLoadingAd] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Poster preview (/users/:posterId result)
  const [posterPreview, setPosterPreview] = useState(null);

  // Likes
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Comments preview
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [draftComment, setDraftComment] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [refreshComments, setRefreshComments] = useState(0); // Trigger for smooth refresh

  // Edit/Delete functionality
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
  });
  const [deleting, setDeleting] = useState(false);

  /* --- keep likes in sync after toggling --- */
  const refreshLikeState = useCallback(async () => {
    try {
      const res = await api.get(`/ads/${id}`);
      const data = res?.data;
      if (!data) return;
      if (typeof data.likeCount === "number") {
        setLikeCount(data.likeCount);
      }
      setLiked(!!data.likedByMe);
    } catch (err) {
      console.warn("refreshLikeState failed", err);
    }
  }, [id]);

  /* --- load ad details on mount / id change --- */
  useEffect(() => {
    let cancelled = false;
    async function loadAd() {
      setLoadingAd(true);
      setLoadError(false);

      try {
        // Try to get ad with photos first (like rentals do)
        let data = null;
        try {
          data = await getAdWithPhotos(id);
        } catch {
          // Fallback to regular ad details
          try {
            const res = await api.get(`/ads/${id}`);
            data = res?.data;
          } catch {
            // Final fallback to list search
          }
        }

        if ((!data || !data.id) && !cancelled) {
          try {
            const listRes = await api.get("/ads");
            const listData = Array.isArray(listRes?.data)
              ? listRes.data
              : [];
            data = listData.find(
              (a) => String(a.id) === String(id)
            );
          } catch {}
        }

        if (!data && !cancelled) {
          setAd(null);
          setLiked(false);
          setLikeCount(0);
          setLoadError(true);
          return;
        }

        if (!cancelled) {
          setAd(data);
          setLikeCount(
            typeof data.likeCount === "number"
              ? data.likeCount
              : 0
          );
          setLiked(!!data.likedByMe);
        }
      } catch (err) {
        console.error("Failed to load ad", err);
        if (!cancelled) {
          setAd(null);
          setLiked(false);
          setLikeCount(0);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) {
          setLoadingAd(false);
        }
      }
    }

    loadAd();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /* --- load comments preview --- */
  useEffect(() => {
    let cancelled = false;
    async function loadComments() {
      setLoadingComments(true);
      try {
        const res = await api.get(`/api/ads/${id}/comments`);
        const list = Array.isArray(res?.data)
          ? res.data
          : [];
        if (!cancelled) {
          setComments(list);
        }
      } catch (err) {
        console.warn("comments load failed", err);
        if (!cancelled) {
          setComments([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingComments(false);
        }
      }
    }

    loadComments();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /* --- poster info from ad dto --- */
  const posterId =
    ad?.posterId ??
    ad?.postedBy?.id ??
    ad?.owner?.id ??
    ad?.user?.id ??
    ad?.userId ??
    ad?.ownerId ??
    null;

  const posterNameRaw =
    ad?.posterName ??
    ad?.postedBy?.name ??
    ad?.postedBy?.fullName ??
    ad?.owner?.name ??
    ad?.owner?.fullName ??
    ad?.user?.fullName ??
    ad?.user?.username ??
    ad?.username ??
    "Community member";

  // raw inline avatar candidate from the ad dto
  const posterInlineAvatar =
    ad?.posterAvatar ??
    ad?.postedBy?.avatarUrl ??
    ad?.owner?.avatarUrl ??
    ad?.user?.avatarUrl ??
    ad?.user?.profileImageUrl ??
    ad?.avatarUrl ??
    ad?.imageUrl ??
    "";

  const postedAtRaw =
    ad?.createdAt ||
    ad?.createdDate ||
    ad?.created_on ||
    ad?.timestamp;

  const postedAgo = prettyTime(postedAtRaw);

  /* --- posterPreview fetch (/users/{posterId}) --- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!posterId) return;
      try {
        // Might 401 if /users/* is not permitAll(). That's fine;
        // we still have fallback via /users/{id}/profile-image.
        const res = await fetch(
          makeApiUrl(`/users/${posterId}`),
          { credentials: "include" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setPosterPreview(data);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [posterId]);

  /* --- final avatar URL for poster (always absolute) --- */
  const posterAvatarResolved = useMemo(() => {
    return resolveAvatarUrl({
      preview: posterPreview,
      inlineUrl: posterInlineAvatar,
      userId: posterId,
    });
  }, [posterPreview, posterInlineAvatar, posterId]);

  /* posterUser object for <Avatar/> */
  const posterUser = useMemo(
    () => ({
      id: posterId,
      fullName: posterNameRaw,
      name: posterNameRaw,
      username:
        ad?.posterUsername || ad?.user?.username || "",
      avatarUrl: posterAvatarResolved,
      profileImageUrl: posterAvatarResolved,
    }),
    [
      posterId,
      posterNameRaw,
      ad?.posterUsername,
      ad?.user?.username,
      posterAvatarResolved,
    ]
  );

  /* --- photos for carousel (like rentals) --- */
  const photos = useMemo(() => {
    if (!ad) return [];

    // case 1: server already sent an array of objects
    if (Array.isArray(ad.photos) && ad.photos.length > 0) {
        return ad.photos
          .map((p, i) => {
            const url =
              (typeof p?.url === "string" && p.url) ||
              (typeof p?.path === "string" && p.path) ||
              (p?.id ? `/ads/photos/${p.id}` : null);
            return {
              id: p?.id ?? p?.photoId ?? i,
              url: makeApiUrl(url) || null,
            };
          })
          .filter((p) => p.url);
    }

    // case 2: fallback to photosCount -> /ads/:id/photos/:i
    const count = Number(ad?.photosCount ?? ad?.photoCount ?? 0) || 0;
    return count > 0
      ? Array.from({ length: count }, (_, i) => ({
          id: i,
          url: makeApiUrl(`/ads/${id}/photos/${i}`),
        }))
      : [];
  }, [ad, id]);

  /* --- hero media (use photos array or fallback to old imageUrl) --- */
  const heroImg = useMemo(() => {
    // First try photos array
    if (photos.length > 0) {
      return photos[0].url;
    }
    // Fallback to old single image approach
    return firstImage(ad);
  }, [ad, photos]);

  /* --- newest comment preview w/ avatar --- */
  const newestCommentDisplay = useMemo(() => {
    if (!comments.length) return null;

    const base =
      comments[comments.length - 1] ||
      comments[0];

    const cid =
      base?.authorId || base?.userId || null;

    const replyCount = Array.isArray(base?.replies)
      ? base.replies.length
      : 0;

    const inlineAuthorAvatar =
      base?.authorAvatar ||
      base?.avatarUrl ||
      base?.profileImageUrl ||
      base?.profile_image_url ||
      "";

    const resolvedCommentAvatar = resolveAvatarUrl({
      preview: null, // we don't fetch preview for each commenter in preview mode
      inlineUrl: inlineAuthorAvatar,
      userId: cid,
    });

    return {
      ...base,
      replyCount,
      _avatarResolved: resolvedCommentAvatar,
      _authorId: cid,
    };
  }, [comments]);

  const commentCount = comments.length;

  // Check if current user is the owner
  const isOwner = useMemo(() => {
    if (!currentUser || !ad) return false;
    return String(currentUser.id) === String(posterId);
  }, [currentUser, ad, posterId]);

  // Initialize edit form when ad loads
  useEffect(() => {
    if (ad) {
      setEditForm({
        title: ad.title || "",
        description: ad.description || "",
        price: ad.price || "",
        category: ad.category || "",
      });
    }
  }, [ad]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (e) => {
      setShowMenu(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showMenu]);

  // Handle edit
  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      const response = await api.put(`/ads/${id}`, editForm);
      setAd(response.data);
      setIsEditing(false);
      toast.success("Ad updated successfully");
    } catch (err) {
      console.error("Failed to update ad", err);
      toast.error("Failed to update ad");
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (ad) {
      setEditForm({
        title: ad.title || "",
        description: ad.description || "",
        price: ad.price || "",
        category: ad.category || "",
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setShowMenu(false); // Close menu first
    
    if (!window.confirm("Are you sure you want to delete this ad? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/ads/${id}`);
      toast.success("Ad deleted successfully");
      navigate("/app/ads");
    } catch (err) {
      console.error("Failed to delete ad", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to delete ad";
      toast.error(errorMsg);
      setDeleting(false);
    }
  };

  /* --- like toggle w/ optimistic UI + sync --- */
  const handleToggleLike = async () => {
    if (!ad) return;

    const wasLiked = liked;
    const wasCount = likeCount;
    const nextLiked = !wasLiked;
    const nextCount = wasCount + (nextLiked ? 1 : -1);

    setLiked(nextLiked);
    setLikeCount(nextCount < 0 ? 0 : nextCount);

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

      await refreshLikeState();
    } catch (err) {
      console.error("Like toggle failed", err);
      setLiked(wasLiked);
      setLikeCount(wasCount);
      toast.error("Couldn't update like");
    }
  };

  /* --- DM seller shortcut --- */
  const contactSeller = async () => {
    const first =
      (posterNameRaw || "there").split(" ")[0] ||
      "there";

    const text = `Hi ${first}, I'm interested in "${
      ad?.title || "your ad"
    }".`;

    try {
      if (!posterId) {
        return navigate("/app/messages", {
          state: {
            selectedUserName: posterNameRaw,
            prefillMessage: text,
          },
        });
      }

      const ensure = await api.post(
        "/api/messages/ensure-thread",
        {
          userId: posterId,
          contextType: "ad",
          contextId: String(id),
        }
      );

      const threadId =
        ensure?.data?.threadId ||
        ensure?.data?.id ||
        ensure?.data?.thread?.id ||
        ensure?.data?.data?.id;

      navigate(`/app/messages/thread/${posterId}`, {
        state: {
          selectedUserId: String(posterId),
          selectedUserName: posterNameRaw,
          prefillMessage: text,
          focusComposer: true,
          threadId,
        },
      });
    } catch (e) {
      console.error(e);
      navigate("/app/messages", {
        state: {
          selectedUserName: posterNameRaw,
          prefillMessage: text,
        },
      });
    }
  };

  /* --- submit quick comment --- */
  async function handleSubmitQuickComment(e) {
    e.preventDefault();
    const txt = draftComment.trim();
    if (!txt) return;
    if (!ad) return;

    if (!currentUser) {
      toast.error("Please sign in to comment");
      return;
    }

    try {
      const res = await api.post(
        `/api/ads/${id}/comments`,
        { text: txt }
      );

      const created =
        res?.data || {
          text: txt,
          authorName:
            currentUser?.fullName ||
            "You",
          authorId: currentUser?.id,
          authorAvatar:
            currentUser?.avatarUrl ||
            currentUser?.profileImageUrl ||
            normalizeUrl(
              currentUser?.id
                ? `/users/${currentUser.id}/profile-image`
                : ""
            ),
          createdAt: new Date().toISOString(),
          replies: [],
        };

      // Add to local comments state for preview
      setComments((old) => [...old, created]);
      setDraftComment("");
      
      // Show all comments to display the new comment
      setShowAllComments(true);
      
      // Trigger a smooth refresh of CommentsThread after a short delay
      // This allows the backend to process the comment fully
      setTimeout(() => {
        setRefreshComments(prev => prev + 1);
      }, 100);
      
    } catch (err) {
      console.error(err);

      if (
        err?.response &&
        (err.response.status === 401 ||
          err.response.status === 403)
      ) {
        toast.error("Please sign in to comment");
      } else {
        toast.error("Couldn't post comment");
      }
    }
  }

  /* --- early returns --- */
  if (loadingAd) {
    return (
      <div className={styles.postShell}>
        Loading ad…
      </div>
    );
  }

  if (!ad) {
    return (
      <div className={styles.postShell}>
        <div className={styles.loadError}>
          {loadError
            ? "Sorry, this ad could not be loaded."
            : "Ad not found."}
        </div>
      </div>
    );
  }

  const priceText =
    ad.price != null && ad.price !== ""
      ? `£${ad.price}`
      : null;

  /* -------------------------------------------------
     Render (Facebook-style card)
  --------------------------------------------------*/
  return (
    <div className={styles.postShell}>
      {/* HEADER */}
      <header className={styles.postHeader}>
        <div className={styles.postHeaderLeft}>
          <div
            className={styles.postAuthorAvatar}
            onClick={() => {
              if (posterId)
                navigate(`/app/profile/${posterId}`);
            }}
            role="button"
          >
            <Avatar
              user={{
                id: posterId,
                fullName: posterNameRaw,
                name: posterNameRaw,
                username:
                  ad?.posterUsername ||
                  ad?.user?.username ||
                  "",
                avatarUrl: posterAvatarResolved,
                profileImageUrl: posterAvatarResolved,
              }}
              size={40}
              rounded
            />
          </div>

          <div className={styles.postAuthorMeta}>
            <button
              className={styles.postAuthorName}
              onClick={() => {
                if (posterId)
                  navigate(
                    `/app/profile/${posterId}`
                  );
              }}
            >
              {posterNameRaw}
            </button>

            <div className={styles.postTimestamp}>
              {postedAgo}
            </div>
          </div>
        </div>

        {/* 3-dot menu for owner */}
        {isOwner && (
          <div style={{ position: "relative" }}>
            <button
              className={styles.postMoreMenu}
              aria-label="More options"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              ⋯
            </button>
            
            {showMenu && (
              <div 
                className={styles.dropdownMenu}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={styles.menuItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                  disabled={deleting}
                >
                  ✏️ Edit Ad
                </button>
                <button
                  className={styles.menuItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  disabled={deleting}
                  style={{ color: "var(--danger, #dc3545)" }}
                >
                  {deleting ? "Deleting..." : "🗑️ Delete Ad"}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* BODY */}
      <section className={styles.postBody}>
        {isEditing ? (
          /* EDIT FORM */
          <div className={styles.editForm}>
            <div className={styles.formGroup}>
              <label htmlFor="edit-title">Title *</label>
              <input
                id="edit-title"
                type="text"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                placeholder="Ad title"
                required
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Describe your ad..."
                rows={6}
                className={styles.formTextarea}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="edit-price">Price (£)</label>
                <input
                  id="edit-price"
                  type="text"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm({ ...editForm, price: e.target.value })
                  }
                  placeholder="0.00"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="edit-category">Category</label>
                <input
                  id="edit-category"
                  type="text"
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                  placeholder="e.g., Electronics"
                  className={styles.formInput}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={`${buttonStyles.btn} ${buttonStyles.secondary}`}
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${buttonStyles.btn} ${buttonStyles.primary}`}
                onClick={handleSaveEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          /* DISPLAY MODE */
          <>
            {ad.title && (
              <h2 className={styles.postTitle}>
                {ad.title}
              </h2>
            )}

            {priceText && (
              <div className={styles.postPrice}>
                {priceText}
              </div>
            )}

            {ad.description && (
              <p className={styles.postText}>
                {ad.description}
              </p>
            )}

            {ad.category && (
              <div className={styles.postCategory}>
                {ad.category}
              </div>
            )}
          </>
        )}
      </section>

      {/* MEDIA */}
      {photos.length > 0 ? (
        <div className={styles.postMedia}>
          <ImageCarousel photos={photos} />
        </div>
      ) : heroImg ? (
        <div className={styles.postMedia}>
          <img
            className={styles.postMediaImg}
            src={heroImg}
            alt={ad.title || "Ad image"}
            onError={(e) => {
              console.error('Image failed to load:', heroImg);
              e.currentTarget.style.visibility = "hidden";
            }}
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}

      {/* SOCIAL BAR */}
      <div className={styles.socialBar}>
        <div className={styles.socialLeft}>
          <span className={styles.likesIcon}>
            👍
          </span>
          <span className={styles.likesCount}>
            {likeSummaryText(
              likeCount,
              liked
            )}
          </span>
        </div>

        <div
          className={styles.socialRight}
          onClick={() =>
            setShowAllComments(true)
          }
          role="button"
          tabIndex={0}
        >
          {loadingComments
            ? "…"
            : `${commentCount} comment${
                commentCount === 1
                  ? ""
                  : "s"
              }`}
        </div>
      </div>

      {/* DIVIDER */}
      <div className={styles.postDivider} />

      {/* ACTION ROW */}
      <div className={styles.postActionsRow}>
        <button
          className={`${styles.postActionBtn} ${
            liked
              ? styles.postActionActive
              : ""
          }`}
          onClick={handleToggleLike}
        >
          <span className={styles.actionIcon}>
            👍
          </span>
          <span className={styles.actionLabel}>
            {liked ? "Liked" : "Like"}
          </span>
        </button>

        <button
          className={styles.postActionBtn}
          onClick={() => {
            setShowAllComments(true);
          }}
        >
          <span className={styles.actionIcon}>
            💬
          </span>
          <span className={styles.actionLabel}>
            Comment
          </span>
        </button>

        <button
          className={styles.postActionBtn}
          onClick={contactSeller}
          disabled={!posterId}
        >
          <span className={styles.actionIcon}>
            💌
          </span>
          <span className={styles.actionLabel}>
            Message Seller
          </span>
        </button>
      </div>

      {/* DIVIDER */}
      <div className={styles.postDivider} />

      {/* COMMENTS SECTION */}
      <section className={styles.commentsSection}>
        {showAllComments ? (
          <CommentsThread 
            adId={id} 
            refreshTrigger={refreshComments}
          />
        ) : (
          <>
            {commentCount > 1 && (
              <button
                className={
                  styles.viewAllCommentsBtn
                }
                onClick={() =>
                  setShowAllComments(true)
                }
              >
                View all {commentCount}{" "}
                comments
              </button>
            )}

            {!loadingComments &&
              newestCommentDisplay && (
                <div
                  className={
                    styles.commentPreviewRow
                  }
                >
                  <div
                    className={
                      styles.commentAvatar
                    }
                    onClick={() => {
                      if (
                        newestCommentDisplay?._authorId
                      ) {
                        navigate(
                          `/app/profile/${newestCommentDisplay._authorId}`
                        );
                      }
                    }}
                    role="button"
                  >
                    <Avatar
                      user={{
                        id:
                          newestCommentDisplay?._authorId,
                        fullName:
                          newestCommentDisplay?.authorName ||
                          "User",
                        name:
                          newestCommentDisplay?.authorName ||
                          "User",
                        avatarUrl:
                          newestCommentDisplay?._avatarResolved ||
                          "",
                        profileImageUrl:
                          newestCommentDisplay?._avatarResolved ||
                          "",
                      }}
                      size={32}
                      rounded
                    />
                  </div>

                  <div
                    className={
                      styles.commentBubble
                    }
                  >
                    <div
                      className={
                        styles.commentHeader
                      }
                    >
                      <span
                        className={
                          styles.commentAuthorName
                        }
                        onClick={() => {
                          if (
                            newestCommentDisplay?._authorId
                          ) {
                            navigate(
                              `/app/profile/${newestCommentDisplay._authorId}`
                            );
                          }
                        }}
                        role="button"
                      >
                        {newestCommentDisplay.authorName ||
                          "Unknown user"}
                      </span>

                      <span
                        className={
                          styles.commentTimestamp
                        }
                      >
                        {prettyTime(
                          newestCommentDisplay.createdAt ||
                            newestCommentDisplay.createdDate ||
                            newestCommentDisplay.created_on
                        )}
                      </span>
                    </div>

                    <div
                      className={
                        styles.commentText
                      }
                    >
                      {
                        newestCommentDisplay.text
                      }
                    </div>

                    {newestCommentDisplay.replyCount >
                      0 && (
                      <button
                        className={
                          styles.viewRepliesBtn
                        }
                        onClick={() =>
                          setShowAllComments(
                            true
                          )
                        }
                      >
                        View replies (
                        {
                          newestCommentDisplay.replyCount
                        }
                        )
                      </button>
                    )}
                  </div>
                </div>
              )}
          </>
        )}

        {/* COMMENT INPUT FORM - Always visible */}
        <form
          className={
            styles.commentComposerRow
          }
          onSubmit={
            handleSubmitQuickComment
          }
        >
          <div
            className={
              styles.composerAvatar
            }
          >
            <Avatar
              user={{
                id: currentUser?.id,
                fullName:
                  currentUser?.fullName ||
                  currentUser?.name,
                name:
                  currentUser?.fullName ||
                  currentUser?.name,
                avatarUrl: resolveAvatarUrl({
                  preview: null,
                  inlineUrl:
                    currentUser?.avatarUrl ||
                    currentUser?.profileImageUrl ||
                    "",
                  userId:
                    currentUser?.id ||
                    null,
                }),
                profileImageUrl: resolveAvatarUrl({
                  preview: null,
                  inlineUrl:
                    currentUser?.avatarUrl ||
                    currentUser?.profileImageUrl ||
                    "",
                  userId:
                    currentUser?.id ||
                    null,
                }),
              }}
              size={32}
              rounded
            />
          </div>

          <input
            value={draftComment}
            onChange={(e) =>
              setDraftComment(
                e.target.value
              )
            }
            className={
              styles.commentInput
            }
            placeholder={
              currentUser
                ? "Write a comment…"
                : "Sign in to comment…"
            }
            disabled={!currentUser}
          />

          <button
            type="submit"
            className={`${buttonStyles.btn} ${buttonStyles.primary} ${styles.commentSendBtn}`}
            disabled={
              !currentUser ||
              !draftComment.trim()
            }
          >
            Post
          </button>
        </form>
      </section>
    </div>
  );
}
