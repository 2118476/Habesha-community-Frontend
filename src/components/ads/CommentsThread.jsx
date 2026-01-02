import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import styles from "../../stylus/sections/Ads.module.scss";
import buttonStyles from "../../stylus/components/Button.module.scss";
import Avatar from "../Avatar.jsx";

import api from "../../api/axiosInstance";
import { makeApiUrl } from "../../api/httpUrl";
import useAuth from "../../hooks/useAuth";

/* -------------------------------------------------
   URL + avatar helpers (aligned with Ads/Details.js)
-------------------------------------------------- */

function normalizeUrl(u) {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return makeApiUrl(s);
  return makeApiUrl(`/uploads/${s}`);
}

function resolveAvatarUrl({ preview, inlineUrl, userId }) {
  // Prefer explicit inline if present
  if (inlineUrl) {
    return normalizeUrl(inlineUrl);
  }

  // Try preview object fields
  if (preview?.profileImageUrl) {
    return normalizeUrl(preview.profileImageUrl);
  }
  if (preview?.profile_image_url) {
    return normalizeUrl(preview.profile_image_url);
  }
  if (preview?.avatarUrl) {
    return normalizeUrl(preview.avatarUrl);
  }
  if (preview?.photoUrl) {
    return normalizeUrl(preview.photoUrl);
  }
  if (preview?.imageUrl) {
    return normalizeUrl(preview.imageUrl);
  }
  if (preview?.image_url) {
    return normalizeUrl(preview.image_url);
  }
  if (preview?.profilePictureUrl) {
    return normalizeUrl(preview.profilePictureUrl);
  }
  if (preview?.profile_picture_url) {
    return normalizeUrl(preview.profile_picture_url);
  }

  // Fallback: /users/{id}/profile-image (same pattern as ads poster)
  if (userId != null) {
    return normalizeUrl(`/users/${userId}/profile-image`);
  }

  return "";
}

/**
 * Build a user object in the shape Avatar expects.
 * Uses:
 * - explicit id/name/url from args
 * - plus preview (nested user) to fill gaps
 * - plus fallback /users/{id}/profile-image
 */
function buildAvatarUser(id, name, avatarUrl, preview) {
  const p =
    preview ||
    preview?.user || // in case preview is wrapper with .user
    null;

  const resolvedId =
    id ??
    p?.id ??
    p?.userId ??
    p?.user_id ??
    p?.user?.id ??
    p?.user?.userId ??
    p?.user?.user_id ??
    null;

  const baseName =
    name ||
    p?.fullName ||
    p?.name ||
    p?.username ||
    p?.userName ||
    p?.displayName ||
    p?.user?.fullName ||
    p?.user?.name ||
    p?.user?.username ||
    p?.user?.userName ||
    "User";

  const resolvedUrl = resolveAvatarUrl({
    preview: p?.user || p || null,
    inlineUrl:
      avatarUrl ||
      p?.avatarUrl ||
      p?.profileImageUrl ||
      p?.profile_image_url ||
      p?.photoUrl ||
      p?.imageUrl ||
      p?.image_url ||
      p?.profilePictureUrl ||
      p?.profile_picture_url ||
      p?.user?.avatarUrl ||
      p?.user?.profileImageUrl ||
      p?.user?.profile_image_url ||
      p?.user?.photoUrl ||
      p?.user?.imageUrl ||
      p?.user?.image_url ||
      "",
    userId: resolvedId,
  });

  return {
    id: resolvedId,
    fullName: baseName,
    name: baseName,
    username: p?.username || p?.userName || baseName,
    avatarUrl: resolvedUrl,
    profileImageUrl: resolvedUrl,
    profile_image_url: resolvedUrl,
  };
}

/**
 * Extract author data from many possible shapes:
 * - flat: authorId, authorName, avatarUrl, profileImageUrl, ...
 * - nested: author, user, owner, userPreview, commenter, createdBy, ...
 */
function deriveAuthorFromRaw(raw) {
  if (!raw) {
    return {
      authorId: null,
      authorName: "Unknown user",
      avatarUrl: "",
      authorPreview: null,
    };
  }

  const authorObj =
    raw.author ||
    raw.user ||
    raw.owner ||
    raw.userPreview ||
    raw.commenter ||
    raw.createdBy ||
    raw.created_by ||
    null;

  const authorId =
    raw.authorId ??
    raw.userId ??
    raw.user_id ??
    raw.commenterId ??
    raw.commenter_id ??
    raw.ownerId ??
    raw.owner_id ??
    authorObj?.id ??
    authorObj?.userId ??
    authorObj?.user_id ??
    null;

  const authorName =
    raw.authorName ||
    raw.userName ||
    raw.username ||
    raw.commenterName ||
    raw.displayName ||
    authorObj?.fullName ||
    authorObj?.name ||
    authorObj?.username ||
    authorObj?.userName ||
    authorObj?.displayName ||
    "Unknown user";

  const inlineAvatar =
    raw.authorAvatar ||
    raw.avatarUrl ||
    raw.profileImageUrl ||
    raw.profile_image_url ||
    raw.authorProfileImageUrl ||
    raw.userProfileImageUrl ||
    raw.userAvatarUrl ||
    raw.user_avatar_url ||
    raw.profilePictureUrl ||
    raw.profile_picture_url ||
    authorObj?.avatarUrl ||
    authorObj?.profileImageUrl ||
    authorObj?.profile_image_url ||
    authorObj?.photoUrl ||
    authorObj?.imageUrl ||
    authorObj?.image_url ||
    authorObj?.profilePictureUrl ||
    authorObj?.profile_picture_url ||
    "";

  const avatarUrl = resolveAvatarUrl({
    preview: authorObj || null,
    inlineUrl: inlineAvatar,
    userId: authorId,
  });

  return { authorId, authorName, avatarUrl, authorPreview: authorObj || null };
}

/* -------------------------------------------------
   Time helpers
-------------------------------------------------- */

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
   Permissions
-------------------------------------------------- */

/** Only the owner of a comment can delete it. */
function canDeleteComment(currentUser, c) {
  if (!currentUser || !c) return false;
  const me = String(currentUser.id);

  const authorA = c?.authorId != null ? String(c.authorId) : null;
  const authorB = c?.userId != null ? String(c.userId) : null;

  return authorA === me || authorB === me;
}

/* -------------------------------------------------
   Comment normalisation + tree building
   (supports flat lists or nested replies from backend)
-------------------------------------------------- */

function normalizeCommentShape(raw) {
  if (!raw) return null;

  const id = raw.id ?? raw.commentId ?? raw._id;
  if (id == null) return null; // need a stable id

  const text = (raw.text ?? raw.body ?? raw.comment ?? "").toString().trim();

  const createdAt =
    raw.createdAt ||
    raw.createdDate ||
    raw.created_on ||
    raw.created_at ||
    raw.timestamp ||
    raw.commentedAt ||
    null;

  const { authorId, authorName, avatarUrl, authorPreview } =
    deriveAuthorFromRaw(raw);

  const parentId =
    raw.parentId ??
    raw.parent_id ??
    raw.parentCommentId ??
    raw.rootCommentId ??
    null;

  const replies =
    Array.isArray(raw.replies) && raw.replies.length
      ? raw.replies.map(normalizeCommentShape).filter(Boolean)
      : [];

  return {
    id,
    text,
    createdAt,
    authorId,
    authorName,
    avatarUrl,
    author: authorPreview,
    parentId,
    replies,
  };
}

function sortThreadTree(list) {
  const sortByCreatedDesc = (a, b) => {
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  };

  const walk = (nodes) => {
    nodes.sort(sortByCreatedDesc);
    nodes.forEach((node) => {
      if (Array.isArray(node.replies) && node.replies.length) {
        walk(node.replies);
      }
    });
  };

  const copy = Array.isArray(list) ? [...list] : [];
  walk(copy);
  return copy;
}

/**
 * Build a nested comment tree from a flat list that uses `parentId`.
 * If there is no parentId, items become top-level.
 */
function buildThreadTree(rawList) {
  const flat = rawList.map(normalizeCommentShape).filter(Boolean);
  if (!flat.length) return [];

  const byId = new Map();
  flat.forEach((c) => {
    byId.set(String(c.id), { ...c, replies: [] });
  });

  const roots = [];

  flat.forEach((c) => {
    const id = String(c.id);
    const pid =
      c.parentId !== undefined && c.parentId !== null
        ? String(c.parentId)
        : null;

    if (pid && pid !== id && byId.has(pid)) {
      const parent = byId.get(pid);
      parent.replies.push(byId.get(id));
    } else {
      roots.push(byId.get(id));
    }
  });

  return sortThreadTree(roots);
}

/**
 * Remove a comment (and any nested replies) from a thread tree.
 */
function removeCommentById(list, id) {
  const target = String(id);
  return (Array.isArray(list) ? list : [])
    .filter((item) => String(item.id) !== target)
    .map((item) => ({
      ...item,
      replies: item.replies ? removeCommentById(item.replies, id) : [],
    }));
}

/* -------------------------------------------------
   Small style constants (avoid re-creating objects)
-------------------------------------------------- */

const pillButtonStyle = {
  background: "none",
  border: 0,
  fontSize: "0.75rem",
  lineHeight: 1.2,
  color: "var(--ads-ink-2)",
  cursor: "pointer",
  padding: 0,
  marginLeft: "6px",
};

const replyPillButtonStyle = {
  ...pillButtonStyle,
  fontSize: "0.7rem",
};

const loadMoreButtonStyle = {
  ...pillButtonStyle,
  marginLeft: "40px",
  marginTop: "4px",
};

const loadingTextStyle = {
  fontSize: ".875rem",
  color: "var(--ads-ink-2)",
};

const emptyTextStyle = {
  fontSize: ".8125rem",
  color: "var(--ads-ink-2)",
};

const threadRootStyle = {
  display: "flex",
  flexDirection: "column",
  rowGap: "12px",
};

const commentRowStyle = {
  flexDirection: "column",
  alignItems: "stretch",
};

const commentMainRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  columnGap: 8,
};

const replyFormStyle = {
  marginLeft: "40px",
  marginTop: "6px",
};

/* -------------------------------------------------
   Component
-------------------------------------------------- */

export default function CommentsThread({
  adId,
  onCountChange,
  /** Optional: show only the first N comments (e.g. in feed). Default: all. */
  initialLimit,
  /** Optional: if parent handles main composer, we may just show thread */
  showComposer = true,
  /** Optional: trigger to refresh comments smoothly */
  refreshTrigger,
}) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth() || {};

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyTargetId, setReplyTargetId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [loadToastShown, setLoadToastShown] = useState(false);
  const [postingReplyFor, setPostingReplyFor] = useState(null);

  const effectiveInitialLimit =
    typeof initialLimit === "number" && initialLimit > 0
      ? initialLimit
      : Number.POSITIVE_INFINITY;

  const [visibleCount, setVisibleCount] = useState(effectiveInitialLimit);

  // Keep visibleCount in sync if parent changes initialLimit
  useEffect(() => {
    setVisibleCount(effectiveInitialLimit);
  }, [effectiveInitialLimit]);

  // top-level count (for the parent / Feed)
  const topLevelCount = useMemo(
    () => (Array.isArray(comments) ? comments.length : 0),
    [comments]
  );

  // Visible list (for "View more" behaviour)
  const visibleComments = useMemo(() => {
    if (!Array.isArray(comments) || !comments.length) return [];
    return comments.slice(0, visibleCount);
  }, [comments, visibleCount]);

  const hasMore = useMemo(
    () => Array.isArray(comments) && comments.length > visibleCount,
    [comments, visibleCount]
  );

  // Notify parent (Feed) when the number of TOP-LEVEL comments changes
  useEffect(() => {
    if (typeof onCountChange === "function") {
      try {
        onCountChange(topLevelCount);
      } catch {
        // ignore
      }
    }
  }, [onCountChange, topLevelCount]);

  // fetch comments for the ad (IMPORTANT: /api/ads/:id/comments)
  const loadComments = useCallback(
    async (silent = false) => {
      if (!adId) return;
      if (!silent) setLoading(true);
      try {
        const { data } = await api.get(`/api/ads/${adId}/comments`);

        const rawListBase = Array.isArray(data)
          ? data
          : Array.isArray(data?.comments)
          ? data.comments
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const rawList = Array.isArray(rawListBase) ? rawListBase : [];

        const hasNested = rawList.some(
          (c) => Array.isArray(c?.replies) && c.replies.length > 0
        );

        let nextComments;
        if (hasNested) {
          // Backend already returns nested replies
          const normalized = rawList
            .map(normalizeCommentShape)
            .filter(Boolean);
          nextComments = sortThreadTree(normalized);
        } else {
          // Flat list with parentId → build tree
          nextComments = buildThreadTree(rawList);
        }

        setComments(nextComments);
        setLoadToastShown(false); // reset error toast if it worked
      } catch (err) {
        console.error("[CommentsThread] load failed", err);
        setComments([]);
        if (!loadToastShown) {
          try {
            toast.error("Failed to load comments");
          } catch {
            /* ignore */
          }
          setLoadToastShown(true);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [adId, loadToastShown]
  );

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Handle refresh trigger from parent (smooth reload)
  useEffect(() => {
    if (refreshTrigger > 0) {
      // Reload comments silently (without showing loading state)
      loadComments(true);
    }
  }, [refreshTrigger, loadComments]);

  const handleStartReply = useCallback(
    (topCommentId) => {
      if (!currentUser) {
        toast.error("Please sign in to reply");
        return;
      }
      setReplyTargetId(String(topCommentId));
      setReplyDraft("");
    },
    [currentUser]
  );

  // submit reply – try dedicated reply endpoint first, then fallback to old one
  const handleSubmitReply = useCallback(
    async (e, parentId) => {
      e.preventDefault();
      const text = replyDraft.trim();
      if (!currentUser) {
        toast.error("Please sign in to reply");
        return;
      }
      if (!text) return;

      setPostingReplyFor(String(parentId));
      try {
        let newReplyRaw = null;

        // 1) Preferred: dedicated reply endpoint
        try {
          const { data } = await api.post(
            `/api/ads/${adId}/comments/${parentId}/reply`,
            { text }
          );
          newReplyRaw = data?.reply || data;
        } catch (err) {
          const status = err?.response?.status;
          // If the endpoint doesn't exist, gracefully fall back
          if (status && [404, 405, 501].includes(status)) {
            console.warn(
              "[CommentsThread] /reply endpoint not available, falling back to /comments with parentId.",
              err
            );
          } else {
            // Real error (400/500/etc.) → rethrow
            throw err;
          }
        }

        // 2) Fallback: original comments endpoint with parent info in body
        if (!newReplyRaw) {
          const payload = {
            parentId,
            parentCommentId: parentId, // cover both possible field names
            text,
          };
          const { data } = await api.post(
            `/api/ads/${adId}/comments`,
            payload
          );
          newReplyRaw = data?.reply || data;
        }

        const newReply = normalizeCommentShape(newReplyRaw);

        if (!newReply) {
          throw new Error("Invalid reply payload");
        }

        // Optimistic local insert under the parent comment
        setComments((prev) =>
          (prev || []).map((c) => {
            if (String(c.id) !== String(parentId)) return c;
            const replies = Array.isArray(c.replies) ? [...c.replies] : [];
            replies.push(newReply);
            return { ...c, replies: sortThreadTree(replies) };
          })
        );

        setReplyDraft("");
        setReplyTargetId(null);
      } catch (err) {
        console.error("[CommentsThread] reply failed", err);
        try {
          toast.error("Failed to post reply");
        } catch {
          /* ignore */
        }
      } finally {
        setPostingReplyFor(null);
      }
    },
    [adId, currentUser, replyDraft]
  );

  // delete comment (assumes /api/comments/:id)
  const handleDelete = useCallback(
    async (commentId) => {
      const idStr = String(commentId);

      // Optimistic removal
      setComments((prev) => removeCommentById(prev || [], idStr));

      try {
        await api.delete(`/api/comments/${commentId}`);
      } catch (err) {
        console.warn(
          "[CommentsThread] delete failed, reloading from server.",
          err
        );
        try {
          toast.error("Couldn't delete comment. Refreshing thread…");
        } catch {
          /* ignore */
        }
        // Re-sync from server (silent spinner)
        loadComments(true);
      }
    },
    [loadComments]
  );

  /* ---------------- render helpers ---------------- */

  const renderReply = useCallback(
    (reply, parentTopCommentId, parentAuthorName, index) => {
      if (!reply) return null;

      const replyUserId = reply.authorId ?? reply.userId ?? null;
      const replyUser = buildAvatarUser(
        replyUserId,
        reply.authorName || parentAuthorName || "User",
        reply.avatarUrl,
        reply.author
      );

      const youCanDelete = canDeleteComment(currentUser, reply);

      return (
        <div
          key={reply.id ?? `reply-${parentTopCommentId}-${index}`}
          className={styles.replyRow}
        >
          {/* avatar */}
          <div
            className={styles.replyAvatar}
            onClick={() => {
              if (replyUserId) {
                navigate(`/app/profile/${replyUserId}`);
              }
            }}
            role="button"
          >
            <Avatar user={replyUser} size={28} rounded />
          </div>

          {/* bubble */}
          <div className={styles.replyBubble}>
            <div className={styles.replyHeader}>
              <span
                className={styles.replyAuthorName}
                onClick={() => {
                  if (replyUserId) {
                    navigate(`/app/profile/${replyUserId}`);
                  }
                }}
                role="button"
              >
                {replyUser.fullName || "Unknown user"}
              </span>

              <span className={styles.replyTimestamp}>
                {prettyTime(reply.createdAt)}
              </span>

              {/* Reply button (reply to TOP comment, not nested deeper) */}
              <button
                type="button"
                onClick={() => handleStartReply(parentTopCommentId)}
                style={replyPillButtonStyle}
              >
                Reply
              </button>

              {youCanDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(reply.id)}
                  style={replyPillButtonStyle}
                >
                  Delete
                </button>
              )}
            </div>

            <div className={styles.replyText}>{reply.text}</div>
          </div>
        </div>
      );
    },
    [currentUser, handleDelete, handleStartReply, navigate]
  );

  const renderComment = useCallback(
    (c, index) => {
      if (!c) return null;

      const cid = c.authorId ?? c.userId ?? null;
      const commentUser = buildAvatarUser(
        cid,
        c.authorName,
        c.avatarUrl,
        c.author
      );

      const youCanDelete = canDeleteComment(currentUser, c);
      const isReplyOpen = replyTargetId === String(c.id);
      const replyCount = Array.isArray(c.replies) ? c.replies.length : 0;

      return (
        <div
          key={c.id ?? `c-${index}`}
          className={styles.commentPreviewRow}
          style={commentRowStyle}
        >
          {/* main row */}
          <div style={commentMainRowStyle}>
            {/* avatar */}
            <div
              className={styles.commentAvatar}
              onClick={() => {
                if (cid) {
                  navigate(`/app/profile/${cid}`);
                }
              }}
              role="button"
            >
              <Avatar user={commentUser} size={32} rounded />
            </div>

            {/* bubble */}
            <div className={styles.commentBubble}>
              <div className={styles.commentHeader}>
                <span
                  className={styles.commentAuthorName}
                  onClick={() => {
                    if (cid) {
                      navigate(`/app/profile/${cid}`);
                    }
                  }}
                  role="button"
                >
                  {commentUser.fullName || "Unknown user"}
                </span>

                <span className={styles.commentTimestamp}>
                  {prettyTime(c.createdAt)}
                </span>

                {replyCount > 0 && (
                  <span className={styles.commentReplyCount}>
                    · {replyCount} {replyCount === 1 ? "reply" : "replies"}
                  </span>
                )}

                {/* Reply button */}
                <button
                  type="button"
                  onClick={() => handleStartReply(c.id)}
                  style={pillButtonStyle}
                >
                  Reply
                </button>

                {youCanDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    style={pillButtonStyle}
                  >
                    Delete
                  </button>
                )}
              </div>

              <div className={styles.commentText}>{c.text}</div>
            </div>
          </div>

          {/* replies */}
          {Array.isArray(c.replies) && c.replies.length > 0 && (
            <div className={styles.replyList}>
              {c.replies.map((r, i) =>
                renderReply(r, c.id, c.authorName, i)
              )}
            </div>
          )}

          {/* reply composer (only under the parent comment we're replying to) */}
          {isReplyOpen && (
            <form
              onSubmit={(e) => handleSubmitReply(e, c.id)}
              className={styles.commentComposerRow}
              style={replyFormStyle}
            >
              <div className={styles.composerAvatar}>
                <Avatar
                  user={buildAvatarUser(
                    currentUser?.id || null,
                    currentUser?.fullName ||
                      currentUser?.name ||
                      currentUser?.username ||
                      "You",
                    currentUser?.avatarUrl ||
                      currentUser?.profileImageUrl ||
                      currentUser?.profile_image_url ||
                      "",
                    currentUser || null
                  )}
                  size={28}
                  rounded
                />
              </div>

              <input
                className={styles.commentInput}
                placeholder={
                  currentUser ? "Write a reply…" : "Sign in to reply…"
                }
                disabled={!currentUser || postingReplyFor === String(c.id)}
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
              />

              <button
                type="submit"
                className={`${buttonStyles.btn} ${buttonStyles.primary} ${styles.commentSendBtn}`}
                disabled={
                  !currentUser ||
                  !replyDraft.trim() ||
                  postingReplyFor === String(c.id)
                }
                style={{
                  fontSize: ".75rem",
                  lineHeight: "1.2",
                  padding: "6px 10px",
                }}
              >
                {postingReplyFor === String(c.id) ? "Sending…" : "Reply"}
              </button>
            </form>
          )}
        </div>
      );
    },
    [
      currentUser,
      handleDelete,
      handleStartReply,
      handleSubmitReply,
      navigate,
      renderReply,
      replyTargetId,
      replyDraft,
      postingReplyFor,
    ]
  );

  /* ---------------- render root ---------------- */

  if (loading && !comments.length) {
    return <div style={loadingTextStyle}>Loading comments…</div>;
  }

  if (!loading && !comments.length) {
    return (
      <div style={emptyTextStyle}>
        No comments yet.
        {showComposer ? " Be the first to comment." : ""}
      </div>
    );
  }

  return (
    <div style={threadRootStyle}>
      {visibleComments.map((c, index) => renderComment(c, index))}

      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleCount((n) => n + 5)}
          style={loadMoreButtonStyle}
        >
          View more comments
        </button>
      )}

      {loading && comments.length > 0 && (
        <div className={styles.commentsLoadingMore} style={loadingTextStyle}>
          Updating…
        </div>
      )}
    </div>
  );
}
