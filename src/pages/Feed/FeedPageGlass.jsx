/* @jsxRuntime classic */
// src/pages/Feed/FeedPageGlass.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { fetchFeed } from "../../api/feed";
import styles from "./FeedPageGlass.module.scss";
import { makeApiUrl } from "../../api/httpUrl";

const FALLBACK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const CATEGORIES = [
  { key: "all", label: "All Posts", icon: "🌟" },
  { key: "rental", label: "Home Rentals", icon: "🏠" },
  { key: "home_swap", label: "Home Swap", icon: "🔄" },
  { key: "service", label: "Services", icon: "🛠️" },
  { key: "ads", label: "Classifieds", icon: "📢" },
  { key: "travel", label: "Travel", icon: "✈️" },
  { key: "events", label: "Events", icon: "🎉" },
];

/* Helper Functions */
const getImageUrl = (item) => {
  if (!item) return null;
  
  const directUrl = item?.imageUrl || item?.firstPhotoUrl || item?.thumbnailUrl;
  if (directUrl) {
    if (directUrl.startsWith("http")) return directUrl;
    return makeApiUrl(directUrl);
  }
  
  const arrays = [item?.photos, item?.images, item?.pictures].filter(Boolean);
  for (const arr of arrays) {
    if (Array.isArray(arr) && arr.length > 0) {
      const first = arr[0];
      const url = typeof first === "string" ? first : first?.url;
      if (url) {
        return url.startsWith("http") ? url : makeApiUrl(url);
      }
    }
  }
  
  const id = item?.id;
  const type = (item?.type || "").toLowerCase();
  if (id && type.includes("rental")) return makeApiUrl(`/rentals/${id}/photos/first`);
  if (id && type.includes("swap")) return makeApiUrl(`/homeswap/${id}/photos/first`);
  if (id && (type.includes("ad") || type.includes("classified"))) return makeApiUrl(`/ads/${id}/photos/first`);
  
  return null;
};

const getDetailPath = (item) => {
  const id = item?.id;
  const type = (item?.type || "").toLowerCase();
  
  if (type.includes("rental")) return `/app/rentals/${id}`;
  if (type.includes("swap") || type.includes("home")) return `/app/homeswap/${id}`;
  if (type.includes("service")) return `/app/services/${id}`;
  if (type.includes("ad") || type.includes("classified")) return `/app/ads/${id}`;
  if (type.includes("travel") || type.includes("trip")) return `/app/travel/${id}`;
  if (type.includes("event")) return `/app/events/${id}`;
  
  return "#";
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const getUserAvatar = (userId) => {
  if (!userId) return FALLBACK_PIXEL;
  return makeApiUrl(`/users/${userId}/profile-image`);
};

/* Intersection Observer Hook for Scroll Reveals */
const useScrollReveal = () => {
  const elementsRef = useRef([]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealFade);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    
    elementsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    
    return () => observer.disconnect();
  }, []);
  
  return elementsRef;
};

/* Main Component */
export default function FeedPageGlass() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const [activeCategory, setActiveCategory] = useState("all");
  const [feedData, setFeedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const revealRefs = useScrollReveal();
  
  // Fetch feed data
  useEffect(() => {
    const loadFeed = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchFeed();
        setFeedData(data || {});
      } catch (err) {
        console.error("Failed to load feed:", err);
        setError("Failed to load feed. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadFeed();
  }, []);
  
  // Combine all feed items
  const allItems = [
    ...(feedData.rentals || []).map(item => ({ ...item, type: "rental" })),
    ...(feedData.homeSwaps || []).map(item => ({ ...item, type: "home_swap" })),
    ...(feedData.services || []).map(item => ({ ...item, type: "service" })),
    ...(feedData.ads || []).map(item => ({ ...item, type: "ads" })),
    ...(feedData.travel || []).map(item => ({ ...item, type: "travel" })),
    ...(feedData.events || []).map(item => ({ ...item, type: "events" })),
  ].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.postedAt || 0);
    const dateB = new Date(b.createdAt || b.postedAt || 0);
    return dateB - dateA;
  });
  
  // Filter items by category
  const filteredItems = activeCategory === "all" 
    ? allItems 
    : allItems.filter(item => item.type === activeCategory);
  
  const userName = user?.fullName || user?.name || user?.username || "Guest";
  const userAvatarUrl = user?.id ? getUserAvatar(user.id) : FALLBACK_PIXEL;
  
  return (
    <div className={styles.pageContainer}>
      {/* Animated Background */}
      <div className={styles.backgroundPattern} aria-hidden="true" />
      
      {/* Main Layout */}
      <div className={styles.feedLayout}>
        {/* Left Sidebar - User & Filters */}
        <aside className={styles.sidebar}>
          {/* User Card */}
          <div className={styles.userCard}>
            <img 
              src={userAvatarUrl} 
              alt={userName}
              className={styles.userAvatar}
              onError={(e) => e.currentTarget.src = FALLBACK_PIXEL}
            />
            <h2 className={styles.userName}>{userName}</h2>
            <p className={styles.userBio}>
              Welcome to your community feed
            </p>
          </div>
          
          {/* Filter Card */}
          <div className={styles.filterCard}>
            <h3 className={styles.filterTitle}>Categories</h3>
            <ul className={styles.filterList}>
              {CATEGORIES.map((category) => (
                <li key={category.key}>
                  <button
                    className={`${styles.filterItem} ${
                      activeCategory === category.key ? styles.active : ""
                    }`}
                    onClick={() => setActiveCategory(category.key)}
                  >
                    <span style={{ marginRight: "8px" }}>{category.icon}</span>
                    {category.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Quick Stats */}
          <div className={styles.filterCard}>
            <h3 className={styles.filterTitle}>Quick Stats</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: "14px" }}>
                <span>Total Posts</span>
                <strong style={{ color: "var(--text-primary)" }}>{allItems.length}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: "14px" }}>
                <span>Rentals</span>
                <strong style={{ color: "var(--text-primary)" }}>{feedData.rentals?.length || 0}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: "14px" }}>
                <span>Services</span>
                <strong style={{ color: "var(--text-primary)" }}>{feedData.services?.length || 0}</strong>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main Feed Column */}
        <main className={styles.mainFeed}>
          {/* Feed Header */}
          <header className={styles.feedHeader}>
            <h1 className={styles.feedTitle}>
              Discover Your Community
            </h1>
            <p className={styles.feedSubtitle}>
              Connect with neighbors, find services, and explore opportunities
            </p>
          </header>
          
          {/* Loading State */}
          {loading && (
            <div style={{ display: "grid", gap: "var(--space-lg)" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className={styles.glassCard} style={{ textAlign: "center", padding: "var(--space-xl)" }}>
              <p style={{ color: "var(--text-secondary)", margin: 0 }}>{error}</p>
            </div>
          )}
          
          {/* Feed Items */}
          {!loading && !error && filteredItems.length === 0 && (
            <div className={styles.glassCard} style={{ textAlign: "center", padding: "var(--space-xl)" }}>
              <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                No posts found in this category.
              </p>
            </div>
          )}
          
          {!loading && !error && filteredItems.map((item, index) => {
            const imageUrl = getImageUrl(item);
            const detailPath = getDetailPath(item);
            const title = item?.title || "Untitled";
            const description = item?.description || item?.text || "";
            const authorName = item?.posterName || item?.user?.name || "Community Member";
            const authorId = item?.posterId || item?.userId;
            const createdAt = item?.createdAt || item?.postedAt;
            const location = item?.location || item?.city;
            const price = item?.price;
            
            const CardComponent = imageUrl ? "div" : "div";
            const cardClass = imageUrl ? styles.feedItemWithImage : styles.feedItem;
            
            return (
              <article
                key={`${item.type}-${item.id}-${index}`}
                className={cardClass}
                ref={(el) => (revealRefs.current[index] = el)}
                onClick={() => navigate(detailPath)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(detailPath);
                  }
                }}
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={title}
                    className={styles.feedItemImage}
                    loading="lazy"
                    onError={(e) => e.currentTarget.src = FALLBACK_PIXEL}
                  />
                )}
                
                <div className={styles.feedItemContent}>
                  {/* Badge */}
                  <div className={styles.feedItemBadge}>
                    {CATEGORIES.find(c => c.key === item.type)?.label || item.type}
                  </div>
                  
                  {/* Header */}
                  <div className={styles.feedItemHeader}>
                    <img
                      src={authorId ? getUserAvatar(authorId) : FALLBACK_PIXEL}
                      alt={authorName}
                      className={styles.feedItemAvatar}
                      onError={(e) => e.currentTarget.src = FALLBACK_PIXEL}
                    />
                    <div className={styles.feedItemMeta}>
                      <div className={styles.feedItemAuthor}>{authorName}</div>
                      <div className={styles.feedItemTime}>
                        {formatTimeAgo(createdAt)}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle like
                      }}
                    >
                      <span>👍</span>
                      <span>Like</span>
                    </button>
                    <button 
                      className={styles.feedItemAction}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(detailPath);
                      }}
                    >
                      <span>💬</span>
                      <span>Comment</span>
                    </button>
                    <button 
                      className={styles.feedItemAction}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle share
                      }}
                    >
                      <span>↗️</span>
                      <span>Share</span>
                    </button>
                    {price && (
                      <div style={{ marginLeft: "auto", fontWeight: "700", color: "var(--brand)" }}>
                        £{Number(price).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </main>
        
        {/* Right Sidebar - Widgets */}
        <aside className={styles.widgetSidebar}>
          {/* Trending Widget */}
          <div className={styles.widget}>
            <h3 className={styles.widgetTitle}>🔥 Trending Now</h3>
            <ul className={styles.widgetList}>
              {allItems.slice(0, 5).map((item, index) => (
                <li key={`trending-${index}`}>
                  <Link 
                    to={getDetailPath(item)} 
                    className={styles.widgetItem}
                  >
                    <div className={styles.widgetItemIcon}>
                      {getImageUrl(item) ? (
                        <img 
                          src={getImageUrl(item)} 
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius-sm)" }}
                          onError={(e) => e.currentTarget.src = FALLBACK_PIXEL}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "var(--surface-glass)" }} />
                      )}
                    </div>
                    <div className={styles.widgetItemText}>
                      <div className={styles.widgetItemTitle}>
                        {item?.title || "Untitled"}
                      </div>
                      <div className={styles.widgetItemSubtitle}>
                        {formatTimeAgo(item?.createdAt || item?.postedAt)}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Quick Links Widget */}
          <div className={styles.widget}>
            <h3 className={styles.widgetTitle}>⚡ Quick Actions</h3>
            <ul className={styles.widgetList}>
              <li>
                <Link to="/app/ads/post" className={styles.widgetItem}>
                  <div className={styles.widgetItemText}>
                    <div className={styles.widgetItemTitle}>Post an Ad</div>
                    <div className={styles.widgetItemSubtitle}>Share with community</div>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/app/rentals/post" className={styles.widgetItem}>
                  <div className={styles.widgetItemText}>
                    <div className={styles.widgetItemTitle}>List a Rental</div>
                    <div className={styles.widgetItemSubtitle}>Find tenants</div>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/app/services/post" className={styles.widgetItem}>
                  <div className={styles.widgetItemText}>
                    <div className={styles.widgetItemTitle}>Offer a Service</div>
                    <div className={styles.widgetItemSubtitle}>Grow your business</div>
                  </div>
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
