/* @jsxRuntime classic */
// src/components/feed/GlassFeedCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "../../pages/Feed/FeedPageGlass.module.scss";
import { makeApiUrl } from "../../api/httpUrl";
import prettyTime from "../../utils/prettyTime";

const FALLBACK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const CATEGORY_ICONS = {
  rental: "🏠",
  home_swap: "🔄",
  service: "🛠️",
  ads: "📢",
  travel: "✈️",
  events: "🎉",
};

const CATEGORY_LABELS = {
  rental: "Home Rental",
  home_swap: "Home Swap",
  service: "Service",
  ads: "Classified",
  travel: "Travel",
  events: "Event",
};

/* formatTimeAgo replaced by shared prettyTime util for i18n */

const getUserAvatar = (userId) => {
  if (!userId) return FALLBACK_PIXEL;
  return makeApiUrl(`/users/${userId}/profile-image`);
};

export default function GlassFeedCard({ 
  item, 
  onLike, 
  onComment, 
  onShare,
  className = "" 
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const imageUrl = item?.imageUrl;
  const detailPath = item?.detailPath || "#";
  const title = item?.title || "Untitled";
  const description = item?.description || item?.text || "";
  const authorName = item?.posterName || item?.user?.name || "Community Member";
  const authorId = item?.posterId || item?.userId;
  const createdAt = item?.createdAt || item?.postedAt;
  const location = item?.location || item?.city;
  const price = item?.price;
  const type = item?.type || "ads";
  const likeCount = item?.likeCount || 0;
  const commentCount = item?.commentCount || 0;
  const shareCount = item?.shareCount || 0;
  const isLiked = item?.isLiked || false;
  
  const cardClass = imageUrl 
    ? `${styles.feedItemWithImage} ${className}` 
    : `${styles.feedItem} ${className}`;
  
  const handleCardClick = () => {
    navigate(detailPath);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate(detailPath);
    }
  };
  
  const handleActionClick = (e, action) => {
    e.stopPropagation();
    if (action === "like" && onLike) onLike(item);
    if (action === "comment" && onComment) onComment(item);
    if (action === "share" && onShare) onShare(item);
  };
  
  return (
    <article
      className={cardClass}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyPress={handleKeyPress}
      aria-label={`${title} by ${authorName}`}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          className={styles.feedItemImage}
          loading="lazy"
          onError={(e) => (e.currentTarget.src = FALLBACK_PIXEL)}
        />
      )}
      
      <div className={styles.feedItemContent}>
        {/* Badge */}
        <div className={styles.feedItemBadge}>
          <span style={{ marginRight: "4px" }}>
            {CATEGORY_ICONS[type] || "📄"}
          </span>
          {CATEGORY_LABELS[type] || type}
        </div>
        
        {/* Header */}
        <div className={styles.feedItemHeader}>
          <img
            src={authorId ? getUserAvatar(authorId) : FALLBACK_PIXEL}
            alt={authorName}
            className={styles.feedItemAvatar}
            onError={(e) => (e.currentTarget.src = FALLBACK_PIXEL)}
          />
          <div className={styles.feedItemMeta}>
            <div className={styles.feedItemAuthor}>{authorName}</div>
            <div className={styles.feedItemTime}>
              {prettyTime(createdAt, t)}
              {location && ` • ${location}`}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <h3 className={styles.feedItemTitle}>{title}</h3>
        {description && (
          <p className={styles.feedItemDescription}>{description}</p>
        )}
        
        {/* Footer */}
        <div className={styles.feedItemFooter}>
          <button 
            className={styles.feedItemAction}
            onClick={(e) => handleActionClick(e, "like")}
            aria-label={`${isLiked ? "Unlike" : "Like"} post`}
            aria-pressed={isLiked}
            style={isLiked ? { color: "var(--brand)" } : {}}
          >
            <span>{isLiked ? "❤️" : "🤍"}</span>
            <span>{likeCount > 0 ? likeCount : "Like"}</span>
          </button>
          
          <button 
            className={styles.feedItemAction}
            onClick={(e) => handleActionClick(e, "comment")}
            aria-label="Comment on post"
          >
            <span>💬</span>
            <span>{commentCount > 0 ? commentCount : "Comment"}</span>
          </button>
          
          <button 
            className={styles.feedItemAction}
            onClick={(e) => handleActionClick(e, "share")}
            aria-label="Share post"
          >
            <span>↗️</span>
            <span>{shareCount > 0 ? shareCount : "Share"}</span>
          </button>
          
          {price && (
            <div 
              style={{ 
                marginLeft: "auto", 
                fontWeight: "700", 
                color: "var(--brand)",
                fontSize: "16px"
              }}
            >
              £{Number(price).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
