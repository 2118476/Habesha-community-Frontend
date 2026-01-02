import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

/**
 * Drop-in supplemental routes without touching your existing router.
 * Mount <RoutesPatch /> once, below your main <Routes> block.
 */

// Lazy import patch pages
const TravelHub = lazy(() => import('../pages/Travel/TravelHub'));
const HomeSwapHub = lazy(() => import('../pages/HomeSwap/HomeSwapHub'));
const OtherUserProfile = lazy(() => import('../pages/OtherUserProfile/OtherUserProfile'));

// Optional: your existing pages (if already present, these routes just expose links)
const TravelPost = lazy(() => import('../pages/Travel/Post'));
const TravelMine = lazy(() => import('../pages/Travel/Mine'));
const HomeSwapPost = lazy(() => import('../pages/HomeSwap/Post'));

// Messages deep-link reuses your Messages page
const Messages = lazy(() => import('../pages/Messages/Messages'));

export default function RoutesPatch() {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Discoverability hubs */}
        <Route path="/app/travel" element={<TravelHub />} />
        <Route path="/app/homeswap" element={<HomeSwapHub />} />

        {/* Expose post/create routes explicitly */}
        <Route path="/app/travel/post" element={<TravelPost />} />
        <Route path="/app/travel/mine" element={<TravelMine />} />
        <Route path="/app/homeswap/post" element={<HomeSwapPost />} />

        {/* Public profile of other users — choose one route style and keep consistent */}
        {/* Username-based */}
        <Route path="/app/u/:username" element={<OtherUserProfile />} />
        {/* If you prefer id-based, duplicate: <Route path="/app/profile/:userId" element={<OtherUserProfile />} /> */}

        {/* Messaging deep-link to auto-select a thread */}
        <Route path="/app/messages/thread/:threadId" element={<Messages />} />
      </Routes>
    </Suspense>
  );
}
