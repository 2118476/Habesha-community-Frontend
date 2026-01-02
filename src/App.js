// src/App.js
import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

/* ---------- Adaptive text colors for all modes ---------- */
import "./styles/adaptive-text.css";

/* ---------- Shared shells/guards ---------- */
import RequireAuth from "./components/RequireAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./layout/AppShell";
import useAuth from "./hooks/useAuth";
import useGlobalTheme from "./hooks/useGlobalTheme";

/* ---------- Loading components ---------- */
import { MinimalPageLoader } from "./components/ui/PageLoader/PageLoader";

/* ---------- Enterprise Notification System ---------- */
import EnterpriseNotificationSystem from "./components/notifications/EnterpriseNotificationSystem";

/* ---------- Small fallbacks ---------- */
const Fallback = () => <MinimalPageLoader />;

/* ---------- Error boundary so broken chunks don’t crash the app ---------- */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err, info) {
    // optional: report to your logger here
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h3 style={{ margin: 0 }}>Something went wrong.</h3>
          <p style={{ marginTop: 8, color: "#6b7280" }}>
            Please refresh the page or try again.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------- Scroll to top on route changes ---------- */
function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

/* ---------- Helper: lazy with optional .preload() ---------- */
function lazyWithPreload(factory, chunkName) {
  const Component = lazy(() =>
    factory().then((mod) => ({ default: mod.default || mod }))
  );
  Component.preload = factory;
  Component.chunkName = chunkName;
  return Component;
}

/* ---------- Public pages (lazy) ---------- */
const PublicExplore = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "public-explore" */ "./pages/PublicExplore"
    ),
  "public-explore"
);
const PublicAbout = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "public-about" */ "./pages/PublicAbout"
    ),
  "public-about"
);
const PublicContact = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "public-contact" */ "./pages/PublicContact"
    ),
  "public-contact"
);

/* NEW: Global search results page (used by header search “See all results…”) */
const SearchPage = lazyWithPreload(
  () => import(/* webpackChunkName: "search-page" */ "./pages/Search"),
  "search-page"
);

/* ---------- Auth (lazy) ---------- */
const Login = lazyWithPreload(
  () => import(/* webpackChunkName: "auth-login" */ "./pages/Auth/Login"),
  "auth-login"
);
const Register = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "auth-register" */ "./pages/Auth/Register"
    ),
  "auth-register"
);

/* Password reset (lazy) */
const ForgotPassword = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "auth-forgot-password" */ "./pages/Auth/ForgotPassword"
    ),
  "auth-forgot-password"
);
const ResetPasswordNew = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "auth-reset-password" */ "./pages/Auth/ResetPassword"
    ),
  "auth-reset-password"
);
const ResetPassword = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "auth-reset" */ "./features/auth/ResetPassword"
    ),
  "auth-reset"
);
const NewPassword = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "auth-new-password" */ "./features/auth/NewPassword"
    ),
  "auth-new-password"
);

/* ---------- NEW: Home Feed (lazy) ---------- */
const FeedPage = lazyWithPreload(
  () => import(/* webpackChunkName: "feed-page" */ "./pages/Feed/FeedPage"),
  "feed-page"
);

/* ---------- Home Swap (lazy) ---------- */
const HomeSwapHub = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "homeswap-hub" */ "./pages/HomeSwap/HomeSwapHub"
    ),
  "homeswap-hub"
);
const HomeSwapPost = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "homeswap-post" */ "./pages/HomeSwap/HomeSwapPost"
    ),
  "homeswap-post"
);
const HomeSwapDetails = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "homeswap-details" */ "./pages/HomeSwap/HomeSwapDetails"
    ),
  "homeswap-details"
);

// Edit HomeSwap (lazy loaded)
const HomeSwapEdit = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "homeswap-edit" */ "./pages/HomeSwap/HomeSwapEdit"
    ),
  "homeswap-edit"
);

/* ---------- Rentals (lazy) ---------- */
const RentalsList = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "rentals-list" */ "./pages/Rentals/List"
    ),
  "rentals-list"
);
const RentalDetails = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "rentals-details" */ "./pages/Rentals/Details"
    ),
  "rentals-details"
);
const RentalsPost = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "rentals-post" */ "./pages/Rentals/Post"
    ),
  "rentals-post"
);
const EditRental = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "rentals-edit" */ "./pages/Rentals/Edit"
    ),
  "rentals-edit"
);

/* ---------- Services (lazy) ---------- */
const ServicesList = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "services-list" */ "./pages/Services/List"
    ),
  "services-list"
);
const ServiceDetails = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "services-details" */ "./pages/Services/Details"
    ),
  "services-details"
);
const ServicePost = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "services-post" */ "./pages/Services/Post"
    ),
  "services-post"
);
const EditService = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "services-edit" */ "./pages/Services/Edit"
    ),
  "services-edit"
);

/* ---------- Events (lazy) ---------- */
const EventsList = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "events-list" */ "./pages/Events/List"
    ),
  "events-list"
);
const EventDetails = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "events-details" */ "./pages/Events/Details"
    ),
  "events-details"
);
const EventPost = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "events-post" */ "./pages/Events/Post"
    ),
  "events-post"
);
const EditEvent = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "events-edit" */ "./pages/Events/Edit"
    ),
  "events-edit"
);

/* ---------- Travel (lazy) ---------- */
const TravelList = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "travel-list" */ "./pages/Travel/List"
    ),
  "travel-list"
);
const TravelDetails = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "travel-details" */ "./pages/Travel/Details"
    ),
  "travel-details"
);
const TravelPost = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "travel-post" */ "./pages/Travel/Post"
    ),
  "travel-post"
);

/* ---------- Ads (lazy) ---------- */
const AdsList = lazyWithPreload(
  () => import(/* webpackChunkName: "ads-list" */ "./pages/Ads/List"),
  "ads-list"
);
const AdDetails = lazyWithPreload(
  () => import(/* webpackChunkName: "ads-details" */ "./pages/Ads/Details"),
  "ads-details"
);
const AdPost = lazyWithPreload(
  () => import(/* webpackChunkName: "ads-post" */ "./pages/Ads/Post"),
  "ads-post"
);

/* ---------- People (lazy) ---------- */
const MessagesPage = lazyWithPreload(
  () => import(/* webpackChunkName: "messages" */ "./pages/Messages"),
  "messages"
);
const FriendsPage = lazyWithPreload(
  () => import(/* webpackChunkName: "friends" */ "./pages/Friends"),
  "friends"
);
const FriendsRequests = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "friends-requests" */ "./pages/FriendsRequests"
    ),
  "friends-requests"
);
const FindFriends = lazyWithPreload(
  () => import(/* webpackChunkName: "friends-find" */ "./pages/FindFriends"),
  "friends-find"
);
const PublicProfile = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "public-profile" */ "./pages/PublicProfile"
    ),
  "public-profile"
);
const PublicProfileById = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "public-profile-by-id" */ "./pages/PublicProfileById"
    ),
  "public-profile-by-id"
);
const Profile = lazyWithPreload(
  () => import(/* webpackChunkName: "profile" */ "./pages/Profile"),
  "profile"
);

/* ---------- Notifications (lazy) ---------- */
const NotificationsPage = lazyWithPreload(
  () => import(/* webpackChunkName: "notifications-page" */ "./pages/NotificationsPage"),
  "notifications-page"
);

/* ---------- Settings (lazy/nested) ---------- */
const SettingsLayout = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "settings-layout" */ "./pages/Settings/Layout"
    ),
  "settings-layout"
);
const AccountSettings = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "settings-account" */ "./pages/Settings/Account"
    ),
  "settings-account"
);
const PrivacySettings = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "settings-privacy" */ "./pages/Settings/Privacy"
    ),
  "settings-privacy"
);
const SecuritySettings = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "settings-security" */ "./pages/Settings/Security"
    ),
  "settings-security"
);
const BlockedUsersSettings = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "settings-blocked-users" */ "./pages/Settings/BlockedUsers"
    ),
  "settings-blocked-users"
);

/* ---------- Contact Requests (lazy) ---------- */
const ContactRequests = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "settings-contacts" */ "./pages/Settings/ContactRequests"
    ),
  "settings-contacts"
);

/* ---------- 404 ---------- */
const NotFound = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "app-not-found" */ "./pages/NotFound"
    ),
  "app-not-found"
);

/* ---------- RBAC dashboards (lazy) ---------- */
const AdminDashboard = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "admin-dashboard" */ "./pages/admin/AdminDashboard"
    ),
  "admin-dashboard"
);
const ModeratorDashboard = lazyWithPreload(
  () =>
    import(
      /* webpackChunkName: "mod-dashboard" */ "./pages/mod/ModeratorDashboard"
    ),
  "mod-dashboard"
);

/* ---- Feature flag: new feed as default home ---- */
const FEED_ENABLED =
  typeof process !== "undefined" &&
  process?.env?.REACT_APP_FEED_ENABLED === "false"
    ? false
    : true;

/* ---------- Preload critical chunks after auth ---------- */
function PreloadAfterAuth() {
  const { user } = useAuth() || {};
  useEffect(() => {
    // preload frequently hit private pages
    FeedPage.preload?.();
    MessagesPage.preload?.();
    FriendsPage.preload?.();
    NotificationsPage.preload?.();
    ContactRequests.preload?.();
    // Also preload global search so “See all results…” feels instant
    SearchPage.preload?.();

    const roles = (user?.roles || []).map((r) => String(r).toUpperCase());
    if (roles.includes("ADMIN")) {
      AdminDashboard.preload?.();
      ModeratorDashboard.preload?.();
    } else if (roles.includes("MODERATOR")) {
      ModeratorDashboard.preload?.();
    }
  }, [user]);
  return null;
}

const AppRoutes = () => (
  <ErrorBoundary>
    <Suspense fallback={<Fallback />}>
      <ScrollToTop />
      <PreloadAfterAuth />
      <EnterpriseNotificationSystem />
      <Routes>
        {/* Public landing */}
        <Route path="/" element={<PublicExplore />} />

        {/* Informational */}
        <Route path="/about" element={<PublicAbout />} />
        <Route path="/contact" element={<PublicContact />} />

        {/* Public global search (used by header search & /search?q=) */}
        <Route path="/search" element={<SearchPage />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Password reset */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPasswordNew />} />
        <Route path="/resetPassword" element={<ResetPassword />} />
        <Route path="/reset-password/:resetToken" element={<NewPassword />} />
        <Route path="/new-password/:resetToken" element={<NewPassword />} />

        {/* Private app shell */}
        <Route
          path="/app/*"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          {/* Default redirect for /app */}
          <Route
            index
            element={<Navigate to={FEED_ENABLED ? "feed" : "home"} replace />}
          />

          {/* Unified Home Feed */}
          <Route path="feed" element={<FeedPage />} />

          {/* Keep legacy /app/home alive (same feed) */}
          <Route path="home" element={<FeedPage />} />

          {/* Home Swapping */}
          <Route path="home-swap" element={<HomeSwapHub />} />
          <Route path="home-swap/post" element={<HomeSwapPost />} />
          <Route path="home-swap/:id" element={<HomeSwapDetails />} />
          <Route path="home-swap/:id/edit" element={<HomeSwapEdit />} />
          <Route path="homeswap" element={<HomeSwapHub />} />
          <Route path="homeswap/post" element={<HomeSwapPost />} />
          <Route path="homeswap/:id" element={<HomeSwapDetails />} />
          <Route path="homeswap/:id/edit" element={<HomeSwapEdit />} />

          {/* Rentals */}
          <Route path="rentals" element={<RentalsList />} />
          <Route path="rentals/post" element={<RentalsPost />} />
          <Route path="rentals/:id" element={<RentalDetails />} />
          <Route path="rentals/:id/edit" element={<EditRental />} />

          {/* Services */}
          <Route path="services" element={<ServicesList />} />
          <Route path="services/post" element={<ServicePost />} />
          <Route path="services/:id" element={<ServiceDetails />} />
          <Route path="services/:id/edit" element={<EditService />} />

          {/* Events */}
          <Route path="events" element={<EventsList />} />
          <Route path="events/post" element={<EventPost />} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="events/:id/edit" element={<EditEvent />} />

          {/* Travel */}
          <Route path="travel" element={<TravelList />} />
          <Route path="travel/post" element={<TravelPost />} />
          <Route path="travel/:id" element={<TravelDetails />} />

          {/* Ads */}
          <Route path="ads" element={<AdsList />} />
          <Route path="ads/post" element={<AdPost />} />
          <Route path="ads/:id" element={<AdDetails />} />

          {/* People */}
          <Route path="profile/:id" element={<PublicProfile />} />
          <Route path="u/:username" element={<PublicProfileById />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/thread/:threadId" element={<MessagesPage />} />

          {/* Contact Requests (top-level under /app) */}
          <Route path="contact-requests" element={<ContactRequests />} />

          {/* Friends */}
          <Route path="friends" element={<FriendsPage />} />
          <Route path="friends/requests" element={<FriendsRequests />} />
          <Route path="friends/find" element={<FindFriends />} />

          {/* My Profile */}
          <Route path="profile" element={<Profile />} />

          {/* NEW: Notifications page */}
          <Route path="notifications" element={<NotificationsPage />} />

          {/* Admin Dashboard */}
          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="admin" element={<AdminDashboard />} />
          </Route>

          {/* Moderator Dashboard */}
          <Route element={<ProtectedRoute roles={["ADMIN", "MODERATOR"]} />}>
            <Route path="mod" element={<ModeratorDashboard />} />
          </Route>

          {/* Settings (nested) */}
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="account" replace />} />
            <Route path="account" element={<AccountSettings />} />
            <Route path="privacy" element={<PrivacySettings />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="blocked-users" element={<BlockedUsersSettings />} />
            <Route path="contacts" element={<ContactRequests />} />
            
            {/* Redirects for old settings URLs */}
            <Route path="profile" element={<Navigate to="../account" replace />} />
            <Route path="notifications" element={<Navigate to="../account" replace />} />
            <Route path="display" element={<Navigate to="../account" replace />} />
            <Route path="my-ads" element={<Navigate to="../account" replace />} />
            <Route path="payments" element={<Navigate to="../account" replace />} />
            <Route path="subscriptions" element={<Navigate to="../account" replace />} />
            <Route path="ai" element={<Navigate to="../account" replace />} />
          </Route>

          {/* App search (legacy redirect) – quick search still uses /search (public) */}
          <Route path="search" element={<Navigate to="../feed" replace />} />

          {/* App 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Catch-all (outside app) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </ErrorBoundary>
);

const App = () => {
  // Apply global theme settings on app startup
  useGlobalTheme();
  
  return <AppRoutes />;
};

export default App;
