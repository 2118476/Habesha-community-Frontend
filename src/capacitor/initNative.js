// src/capacitor/initNative.js
//
// Native-only setup for the Capacitor Android/iOS shell. Every branch is
// guarded by Capacitor.isNativePlatform(), so on the web this is a no-op and
// the plugins are never loaded.

import { Capacitor } from "@capacitor/core";

export async function initNative() {
  if (!Capacitor?.isNativePlatform?.()) return;

  // Note: the status bar (overlay/colour/style) is managed per-route by
  // StatusBarController so the landing page can go full-bleed.

  // Android hardware back button: navigate back, or exit at the root.
  try {
    const { App } = await import("@capacitor/app");
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack && window.history.length > 1) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch {
    /* app plugin unavailable — ignore */
  }

  // Hide the splash once the web app has booted.
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    /* splash-screen plugin unavailable — ignore */
  }
}
