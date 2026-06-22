// src/capacitor/StatusBarController.jsx
//
// Route-aware status bar for the native app. The signed-out landing page ("/")
// goes full-bleed (transparent status bar, hero video under it). Every other
// route keeps a solid brand bar above the webview so menus/text stay clear of
// the phone's clock. No-ops entirely on the web.

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

// Routes that should draw under a transparent status bar (dark hero behind it).
const IMMERSIVE = new Set(["/"]);

export default function StatusBarController() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!Capacitor?.isNativePlatform?.()) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        if (cancelled) return;

        if (IMMERSIVE.has(pathname)) {
          // Full-bleed: webview draws under a transparent bar; dark hero -> light icons
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.setStyle({ style: Style.Light });
        } else {
          // Solid brand bar above the webview (white icons on brand blue)
          await StatusBar.setOverlaysWebView({ overlay: false });
          await StatusBar.setStyle({ style: Style.Light });
          if (Capacitor.getPlatform() === "android") {
            await StatusBar.setBackgroundColor({ color: "#0ea5e9" });
          }
        }
      } catch {
        /* status-bar plugin unavailable — ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
