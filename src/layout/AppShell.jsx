// src/layout/AppShell.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import BottomBar from "../components/BottomBar";
import QuickActionsFab from "../components/QuickActionsFab";
import MobileNav from "./MobileNav";

import styles from "./AppShell.module.scss";

export default function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // true = hidden
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 900px)").matches
      : false
  );

  const location = useLocation();
  const sidebarRef = useRef(null);

  // Keep an up-to-date isMobile flag (and debounce resize)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 900px)");
    const onChange = () => setIsMobile(mql.matches);
    try {
      mql.addEventListener("change", onChange);
    } catch {
      // Safari fallback
      mql.addListener(onChange);
    }
    setIsMobile(mql.matches);
    return () => {
      try {
        mql.removeEventListener("change", onChange);
      } catch {
        mql.removeListener(onChange);
      }
    };
  }, []);

  // One global toggle event: mobile => open MobileNav; desktop => overlay Sidebar
  useEffect(() => {
    const onToggle = () => {
      if (isMobile) setMobileNavOpen((v) => !v);
      else setSidebarCollapsed((v) => !v);
    };
    window.addEventListener("app:toggle-drawer", onToggle);
    return () => window.removeEventListener("app:toggle-drawer", onToggle);
  }, [isMobile]);

  // Close drawers on navigation (prevents stale open panes)
  useEffect(() => {
    setMobileNavOpen(false);
    setSidebarCollapsed(true);
    // Scroll to top on route change (feels snappier)
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    
    // Trigger scroll reveal refresh for new content
    window.dispatchEvent(new CustomEvent('routechange'));
  }, [location.pathname, location.search, location.hash]);

  // Click outside to close desktop sidebar
  useEffect(() => {
    if (isMobile) return;
    const onPointerDown = (e) => {
      if (sidebarCollapsed) return;
      const node = sidebarRef.current;
      if (!node) return;
      if (!node.contains(e.target)) setSidebarCollapsed(true);
    };
    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => document.removeEventListener("pointerdown", onPointerDown, { capture: true });
  }, [isMobile, sidebarCollapsed]);

  // Escape to close desktop sidebar
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (!isMobile) setSidebarCollapsed(true);
        setMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile]);

  // Lock scroll when any overlay/drawer is open
  useEffect(() => {
    const lock = (mobileNavOpen || (!isMobile && !sidebarCollapsed));
    document.documentElement.classList.toggle("no-scroll", lock);
    document.body.classList.toggle("no-scroll", lock);
    return () => {
      document.documentElement.classList.remove("no-scroll");
      document.body.classList.remove("no-scroll");
    };
  }, [isMobile, mobileNavOpen, sidebarCollapsed]);

  // Route key for subtle page entrance animation
  const routeKey = useMemo(
    () => `${location.pathname}${location.search}${location.hash}`,
    [location.pathname, location.search, location.hash]
  );

  return (
    <div
      className={[
        styles.shell,
        !sidebarCollapsed && !isMobile ? styles.sidebarShown : "",
        "app-shell",
      ].join(" ").trim()}
    >
      <Header onOpenMobileNav={() => setMobileNavOpen(true)} />

      {/* Desktop sidebar + scrim */}
      <div className={styles.main}>
        <aside
          className={styles.sidebarArea}
          ref={sidebarRef}
          aria-hidden={sidebarCollapsed || isMobile ? "true" : "false"}
        >
          <Sidebar />
        </aside>

        {/* Scrim only for desktop overlay sidebar */}
        {!isMobile && !sidebarCollapsed ? (
          <button
            aria-label="Close sidebar overlay"
            className={styles.scrim}
            onClick={() => setSidebarCollapsed(true)}
          />
        ) : null}

        {/* Page content with route-change animation */}
        <main className={styles.content}>
          <div key={routeKey} className={styles.routeStage} data-route>
            <Outlet />
          </div>
        </main>
      </div>

      {QuickActionsFab ? <QuickActionsFab /> : null}
      {BottomBar ? <BottomBar /> : null}

      <Footer />

      {/* Mobile drawer handled by its own component */}
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
}
