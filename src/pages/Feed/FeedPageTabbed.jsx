/* @jsxRuntime classic */
// src/pages/Feed/FeedPageTabbed.jsx - Tabbed Feed with Card Layout
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuth from "../../hooks/useAuth";
import { fetchFeed } from "../../api/feed";
import styles from "./FeedPage.module.scss";
import { makeApiUrl } from "../../api/httpUrl";
import { CardGridLoader } from "../../components/ui/SectionLoader/SectionLoader";

const ALL_TYPES = ["home_swap", "rental", "service", "ads", "travel", "events"];
const FALLBACK_PIXEL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";

const TABS = [
  { key: "rental", label: "Rentals", icon: "🏠" },
  { key: "home_swap", label: "Home Swap", icon: "🔄" },
  { key: "service", label: "Services", icon: "🛠️" },
  { key: "travel", label: "Travel", icon: "✈️" },
  { key: "events", label: "Events", icon: "🎉" },
];

const isAbs = (s) => typeof s === "string" && /^(https?:)?\/\//i.test(s);

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

  // Check arrays for multiple photos
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
  if (t.includes("event")) return `/app/events/${id}`;
  return "#";
};

// Card Component
function Card({ item, type }) {
  const id = item?.id ?? item?._id ?? item?.listingId ?? item?.publicId;
  const title = (item?.title || "").trim() || "Untitled";
  const description = item?.description || item?.summary || "";
  const location = item?.location || item?.city || "";
  const price = item?.price || item?.rent || item?.cost;
  const src = toSrc(imgOf(item)) || FALLBACK_PIXEL;
  const href = detailsPath(type, id);

  return (
    <Link 
      to={href} 
      className={styles.card}
      data-reveal="up"
    >
      <div className={styles.cardImage}>
        <img
          src={src}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={(e) => (e.currentTarget.src = FALLBACK_PIXEL)}
        />
        {price && (
          <div className={styles.cardPrice}>
            ${typeof price === 'number' ? price.toLocaleString() : price}
          </div>
        )}
      </div>
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title}</h3>
        {location && (
          <div className={styles.cardLocation}>
            📍 {location}
          </div>
        )}
        {description && (
          <p className={styles.cardDescription}>
            {description.length > 100 ? description.slice(0, 97) + "..." : description}
          </p>
        )}
      </div>
    </Link>
  );
}

// Ads Section Component (always visible at bottom)
function AdsSection({ ads }) {
  if (!ads || ads.length === 0) return null;

  return (
    <section className={styles.adsSection} data-reveal="up">
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📢</span>
          Community Ads
        </h2>
        <Link to="/app/ads" className={styles.viewAllBtn}>
          View all
          <svg width="16" height="16" viewBox="0 0 24 24">
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
      <div className={styles.adsGrid}>
        {ads.slice(0, 6).map((ad, idx) => (
          <Card key={ad?.id || idx} item={ad} type="ads" />
        ))}
      </div>
    </section>
  );
}

// Main Component
export default function FeedPageTabbed() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth?.user;
  const userName = user?.firstName || user?.fullName || user?.name || user?.username || "Friend";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("rental");
  
  const [homeSwap, setHomeSwap] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [services, setServices] = useState([]);
  const [ads, setAds] = useState([]);
  const [travel, setTravel] = useState([]);
  const [events, setEvents] = useState([]);

  const requestedTypes = useMemo(() => ALL_TYPES, []);

  const partitionItems = useCallback((items) => {
    const hs = [], rs = [], ss = [], aa = [], tt = [], ee = [];
    for (const it of items) {
      const t = (it.type || "").toLowerCase();
      if (t === "home_swap" || t === "home-swap" || t === "homeswap") hs.push(it);
      else if (t === "rental" || t === "rentals") rs.push(it);
      else if (t === "service" || t === "services") ss.push(it);
      else if (t === "ad" || t === "ads" || t === "classified" || t === "classifieds" || t === "post") aa.push(it);
      else if (t === "travel" || t === "trip" || t === "trips" || t === "tour" || t === "tours") tt.push(it);
      else if (t === "event" || t === "events") ee.push(it);
    }
    return { hs, rs, ss, aa, tt, ee };
  }, []);

  const load = useCallback(
    async () => {
      const { items = [] } = await fetchFeed({
        types: requestedTypes,
        sort: "newest",
        limit: 50,
        hasPhotos: false,
      });
      const { hs, rs, ss, aa, tt, ee } = partitionItems(items);

      setHomeSwap(hs);
      setRentals(rs);
      setServices(ss);
      setAds(aa);
      setTravel(tt);
      setEvents(ee);
    },
    [requestedTypes, partitionItems]
  );

  // Initial fetch
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        await load();
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

  // Get current tab data
  const getCurrentTabData = () => {
    switch (activeTab) {
      case "rental":
        return { items: rentals, type: "rental", emptyMessage: "No rentals available" };
      case "home_swap":
        return { items: homeSwap, type: "home_swap", emptyMessage: "No home swaps available" };
      case "service":
        return { items: services, type: "service", emptyMessage: "No services available" };
      case "travel":
        return { items: travel, type: "travel", emptyMessage: "No travel listings available" };
      case "events":
        return { items: events, type: "events", emptyMessage: "No events available" };
      default:
        return { items: [], type: "", emptyMessage: "No items available" };
    }
  };

  const { items: currentItems, type: currentType, emptyMessage } = getCurrentTabData();

  if (error) {
    return (
      <div className={styles.errorState}>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>{t('buttons.retry')}</button>
      </div>
    );
  }

  return (
    <div className={styles.feedPageTabbed}>
      {/* Hero Section */}
      <section className={styles.heroTabbed} data-reveal="fade">
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Hello, {userName}</h1>
          <p className={styles.heroSubtitle}>
            Discover rentals, home swaps, services, and more in your community
          </p>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className={styles.tabsContainer} data-reveal="up">
        <div className={styles.tabsWrapper}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.tabButton} ${activeTab === tab.key ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab(tab.key)}
              aria-selected={activeTab === tab.key}
              role="tab"
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <main className={styles.mainContent}>
        {loading ? (
          <CardGridLoader count={6} />
        ) : (
          <>
            {/* Current Tab Content */}
            <section className={styles.tabContent} data-reveal="up">
              {currentItems.length > 0 ? (
                <div className={styles.cardsGrid}>
                  {currentItems.map((item, idx) => (
                    <Card key={item?.id || idx} item={item} type={currentType} />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>{emptyMessage}</p>
                </div>
              )}
            </section>

            {/* Ads Section - Always Visible */}
            <AdsSection ads={ads} />
          </>
        )}
      </main>
    </div>
  );
}
