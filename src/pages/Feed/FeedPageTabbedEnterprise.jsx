/* @jsxRuntime classic */
// src/pages/Feed/FeedPageTabbedEnterprise.jsx - Enterprise-Level Tabbed Feed
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { enterpriseToast } from "../../components/ToastExports";
import { notify } from "../../components/notifications/EnterpriseNotificationSystem";
import NotificationDemo from "../../components/notifications/NotificationDemo";
import useAuth from "../../hooks/useAuth";
import { fetchFeed } from "../../api/feed";
import FeedItemCard from "../../components/feed/FeedItemCard";
import styles from "./FeedPage.module.scss";
import { makeApiUrl } from "../../api/httpUrl";

/* ===================================================================
 * CONSTANTS & CONFIGURATION
 * =================================================================== */

const ALL_TYPES = ["home_swap", "rental", "service", "ads", "travel", "events"];

const getTabs = (t) => [
  { key: "rental", label: t('sidebar.rentals'), icon: "🏠", description: t('rentals.rentals') },
  { key: "home_swap", label: t('sidebar.swap'), icon: "🔄", description: t('homeSwap.homeSwap') },
  { key: "service", label: t('sidebar.services'), icon: "🛠️", description: t('services.services') },
  { key: "travel", label: t('sidebar.travel'), icon: "✈️", description: t('travel.travel') },
  { key: "events", label: t('sidebar.events'), icon: "🎉", description: t('events.events') },
];

const ITEMS_PER_PAGE = 24;
const SCROLL_THRESHOLD = 0.8;

/* ===================================================================
 * UTILITY FUNCTIONS
 * =================================================================== */

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

/* ===================================================================
 * ERROR BOUNDARY
 * =================================================================== */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Feed Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorState}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || "An unexpected error occurred"}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ===================================================================
 * SKELETON LOADING COMPONENTS
 * =================================================================== */

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard} aria-busy="true" aria-label="Loading">
      <div className={styles.skeletonImage} />
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonText} />
        <div className={styles.skeletonText} style={{ width: "60%" }} />
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 8 }) {
  return (
    <div className={styles.cardsGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/* ===================================================================
 * ADS SECTION COMPONENT
 * =================================================================== */

const AdsSection = React.memo(function AdsSection({ ads, t }) {
  if (!ads || ads.length === 0) return null;

  return (
    <section className={styles.adsSection} data-reveal="up">
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📢</span>
          {t('sidebar.ads')}
        </h2>
        <Link to="/app/ads" className={styles.viewAllBtn}>
          {t('feed.viewAll')}
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
      <div className={styles.adsGrid} data-reveal="list-up">
        {ads.slice(0, 6).map((ad, idx) => {
          const imgSrc = imgOf(ad);
          const key = ad?.id || ad?._id || idx;
          return (
            <FeedItemCard
              key={key}
              item={ad}
              kind="ads"
              index={idx}
              imgSrc={imgSrc}
              role="listitem"
            />
          );
        })}
      </div>
    </section>
  );
});

/* ===================================================================
 * MAIN COMPONENT
 * =================================================================== */

export default function FeedPageTabbedEnterprise() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const auth = useAuth();
  const user = auth?.user;
  const userName = user?.firstName || user?.fullName || user?.name || user?.username || "Friend";

  // Get initial tab from URL or default to rental
  const initialTab = searchParams.get("tab") || "rental";
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [hasMore, setHasMore] = useState(true);
  
  const [homeSwap, setHomeSwap] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [services, setServices] = useState([]);
  const [ads, setAds] = useState([]);
  const [travel, setTravel] = useState([]);
  const [events, setEvents] = useState([]);

  const [cursors, setCursors] = useState({
    rental: null,
    home_swap: null,
    service: null,
    travel: null,
    events: null,
  });

  const loadingRef = useRef(false);

  const requestedTypes = useMemo(() => ALL_TYPES, []);

  /* ===================================================================
   * TEST NOTIFICATION WITH ONCLICK
   * =================================================================== */

  const testNotificationWithClick = useCallback(() => {
    console.log('Test button clicked! Creating notifications...');
    
    // Test 1: Action notification (like the demo)
    console.log('Creating action notification like the demo...');
    const id1 = notify.action(
      'Test Action Notification',
      'This notification has action buttons like the demo.',
      [
        {
          label: 'Test Action',
          variant: 'primary',
          onClick: () => {
            console.log('Test action clicked!');
            enterpriseToast.success('Action worked!', 'The action button onClick handler is working.');
          }
        }
      ],
      { 
        type: 'info',
        priority: 'medium'
      }
    );
    console.log('Action notification created with ID:', id1);

    // Test 2: Try notification with main onClick (our approach)
    setTimeout(() => {
      console.log('Creating notification with main onClick...');
      const id2 = notify.info(
        'Test Main onClick',
        'Click anywhere on this notification to test main onClick.',
        {
          onClick: (notification) => {
            console.log('Main onClick executed!', notification);
            enterpriseToast.success('Main onClick worked!', 'The main notification onClick handler is working.');
          }
        }
      );
      console.log('Main onClick notification created with ID:', id2);
    }, 1000);

    // Test 3: Combined approach
    setTimeout(() => {
      console.log('Creating notification with both main onClick and actions...');
      const id3 = notify.warning(
        'Combined Test',
        'This has both main onClick and action buttons.',
        {
          onClick: (notification) => {
            console.log('Combined main onClick executed!', notification);
            enterpriseToast.info('Main onClick!', 'You clicked the notification body.');
          },
          actions: [
            {
              label: 'Action Button',
              variant: 'primary',
              onClick: () => {
                console.log('Combined action clicked!');
                enterpriseToast.success('Action Button!', 'You clicked the action button.');
              }
            }
          ]
        }
      );
      console.log('Combined notification created with ID:', id3);
    }, 2000);
  }, []);

  /* ===================================================================
   * DATA PARTITIONING
   * =================================================================== */

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

  /* ===================================================================
   * DATA LOADING
   * =================================================================== */

  const load = useCallback(
    async (cursor = null, append = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      try {
        const { items = [], nextCursor: nc } = await fetchFeed({
          types: requestedTypes,
          sort: "newest",
          limit: ITEMS_PER_PAGE,
          cursor,
          hasPhotos: false,
        });

        const { hs, rs, ss, aa, tt, ee } = partitionItems(items);

        if (append) {
          setHomeSwap((p) => [...p, ...hs]);
          setRentals((p) => [...p, ...rs]);
          setServices((p) => [...p, ...ss]);
          setAds((p) => [...p, ...aa]);
          setTravel((p) => [...p, ...tt]);
          setEvents((p) => [...p, ...ee]);
        } else {
          setHomeSwap(hs);
          setRentals(rs);
          setServices(ss);
          setAds(aa);
          setTravel(tt);
          setEvents(ee);
        }

        setHasMore(!!nc);
        setCursors((prev) => ({
          ...prev,
          [activeTab]: nc || null,
        }));
      } catch (e) {
        console.error("Feed load error:", e);
        throw e;
      } finally {
        loadingRef.current = false;
      }
    },
    [requestedTypes, partitionItems, activeTab]
  );

  // Initial fetch
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        await load(null, false);
      } catch (e) {
        console.error(e);
        if (!ignore) {
          setError("Failed to load feed. Please try again.");
          toast.error("Failed to load feed");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [load]);

  /* ===================================================================
   * INFINITE SCROLL
   * =================================================================== */

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;

    const cursor = cursors[activeTab];
    if (!cursor) return;

    try {
      setLoadingMore(true);
      await load(cursor, true);
    } catch (e) {
      console.error("Load more error:", e);
      toast.error("Failed to load more items");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, cursors, activeTab, load]);

  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore) return;

      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight * SCROLL_THRESHOLD) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMore, loadingMore, hasMore]);

  /* ===================================================================
   * TAB MANAGEMENT
   * =================================================================== */

  const handleTabChange = useCallback((tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // Analytics hook (if you have analytics)
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "tab_change", {
        event_category: "feed",
        event_label: tabKey,
      });
    }
  }, [setSearchParams]);

  /* ===================================================================
   * KEYBOARD SHORTCUTS
   * =================================================================== */

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only if not typing in input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      const currentIndex = TABS.findIndex((t) => t.key === activeTab);

      if (e.key === "ArrowRight" && currentIndex < TABS.length - 1) {
        e.preventDefault();
        handleTabChange(TABS[currentIndex + 1].key);
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        e.preventDefault();
        handleTabChange(TABS[currentIndex - 1].key);
      } else if (e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (TABS[index]) {
          handleTabChange(TABS[index].key);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [activeTab, handleTabChange]);

  /* ===================================================================
   * GET CURRENT TAB DATA
   * =================================================================== */

  const getCurrentTabData = useCallback(() => {
    switch (activeTab) {
      case "rental":
        return { items: rentals, type: "rental", emptyMessage: t('empty.noRentals') };
      case "home_swap":
        return { items: homeSwap, type: "home_swap", emptyMessage: t('empty.noSwaps') };
      case "service":
        return { items: services, type: "service", emptyMessage: t('empty.noServices') };
      case "travel":
        return { items: travel, type: "travel", emptyMessage: t('empty.noTravel') };
      case "events":
        return { items: events, type: "events", emptyMessage: t('empty.noEvents') };
      default:
        return { items: [], type: "", emptyMessage: t('empty.noResults') };
    }
  }, [activeTab, rentals, homeSwap, services, travel, events, t]);

  const { items: currentItems, type: currentType, emptyMessage } = getCurrentTabData();

  const TABS = useMemo(() => getTabs(t), [t]);

  /* ===================================================================
   * SEO & META
   * =================================================================== */

  useEffect(() => {
    const currentTab = TABS.find((tab) => tab.key === activeTab);
    if (currentTab) {
      document.title = `${currentTab.label} - Habesha Community`;
    }
  }, [activeTab, TABS]);

  /* ===================================================================
   * RENDER
   * =================================================================== */

  if (error && !loading) {
    return (
      <ErrorBoundary>
        <div className={styles.errorState}>
          <h2>Unable to Load Feed</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            {t('buttons.retry')}
          </button>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className={styles.feedPageTabbed}>

        {/* Hero Section */}
        <section className={styles.heroTabbed} data-reveal="fade">
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{t('feed.hello')}, {userName}</h1>
            <p className={styles.heroSubtitle}>
              {t('feed.welcomeMessage')}
            </p>
            {/* Test Notification Button */}
            <button 
              onClick={testNotificationWithClick}
              style={{
                marginTop: '16px',
                padding: '12px 20px',
                backgroundColor: '#0a84ff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              🔔 Test Notifications with onClick Handlers
            </button>
          </div>
        </section>

        {/* Tabs Navigation */}
        <div className={styles.tabsContainer} data-reveal="up">
          <div className={styles.tabsWrapper} role="tablist" aria-label="Feed categories">
            {TABS.map((tab, index) => (
              <button
                key={tab.key}
                className={`${styles.tabButton} ${activeTab === tab.key ? styles.tabButtonActive : ""}`}
                onClick={() => handleTabChange(tab.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleTabChange(tab.key);
                  }
                }}
                aria-selected={activeTab === tab.key}
                aria-controls={`tabpanel-${tab.key}`}
                aria-label={`${tab.label} - ${tab.description}. Press ${index + 1} for quick access`}
                role="tab"
                tabIndex={activeTab === tab.key ? 0 : -1}
              >
                <span className={styles.tabIcon} aria-hidden="true">{tab.icon}</span>
                <span className={styles.tabLabel}>{tab.label}</span>
              </button>
            ))}
          </div>
          <div className={styles.tabsHint}>
            {t('feed.tabsHint', 'Use arrow keys or 1-5 to switch tabs')}
          </div>
        </div>

        {/* Content Area */}
        <main className={styles.mainContent}>
          {loading ? (
            <div className={styles.tabContent}>
              <SkeletonGrid count={8} />
            </div>
          ) : (
            <>
              {/* Current Tab Content */}
              <section
                className={styles.tabContent}
                id={`tabpanel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`tab-${activeTab}`}
                data-reveal="up"
              >
                {currentItems.length > 0 ? (
                  <>
                    <div className={styles.cardsGrid} data-reveal="list-up">
                      {currentItems.map((item, idx) => {
                        const imgSrc = imgOf(item);
                        const key = item?.id || item?._id || idx;
                        return (
                          <FeedItemCard
                            key={key}
                            item={item}
                            kind={currentType}
                            index={idx}
                            imgSrc={imgSrc}
                            role="listitem"
                          />
                        );
                      })}
                    </div>

                    {/* Load More Indicator */}
                    {loadingMore && (
                      <div className={styles.loadingMore}>
                        <div className={styles.spinner} />
                        <p>{t('common.loading')}</p>
                      </div>
                    )}

                    {/* End of Results */}
                    {!hasMore && currentItems.length > 0 && (
                      <div className={styles.endMessage}>
                        {t('feed.endOfResults', "You've reached the end")}
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📭</div>
                    <p>{emptyMessage}</p>
                    <Link to="/app/feed" className={styles.emptyAction}>
                      {t('feed.exploreOtherCategories', 'Explore other categories')}
                    </Link>
                  </div>
                )}
              </section>

              {/* Ads Section - Always Visible */}
              <AdsSection ads={ads} t={t} />

              {/* Enterprise Notification Demo Section */}
              {activeTab === "rental" && (
                <section className={styles.notificationDemo} data-reveal="up">
                  <div className={styles.demoHeader}>
                    <h2>🚀 Enterprise Notification System</h2>
                    <p>Experience our modern, high-level notification system with glassmorphism design and enterprise features.</p>
                  </div>
                  <NotificationDemo />
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
