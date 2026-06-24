// src/utils/messageNotifications.js
//
// Platform-aware OS notifications for new chat messages.
//  - Native (Capacitor Android/iOS): @capacitor/local-notifications
//  - Web (desktop browsers): the standard Notifications API
//
// Everything degrades gracefully: if a platform can't notify, the helpers
// simply no-op so callers never have to branch.

import { Capacitor } from "@capacitor/core";

const isNative = () => !!Capacitor?.isNativePlatform?.();

// Lazy-load the native plugin only on a device, so the web bundle never
// touches it.
let nativePluginPromise = null;
async function getNative() {
  if (!isNative()) return null;
  if (!nativePluginPromise) {
    nativePluginPromise = import("@capacitor/local-notifications")
      .then((m) => m.LocalNotifications)
      .catch(() => null);
  }
  return nativePluginPromise;
}

/**
 * Current permission state, normalised across platforms:
 *   'granted' | 'denied' | 'default' | 'unsupported'
 */
export async function getNotificationPermission() {
  if (isNative()) {
    const LN = await getNative();
    if (!LN) return "unsupported";
    try {
      const res = await LN.checkPermissions();
      if (res.display === "granted") return "granted";
      if (res.display === "denied") return "denied";
      return "default";
    } catch {
      return "unsupported";
    }
  }
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission; // 'granted' | 'denied' | 'default'
}

/**
 * Ask the user for permission. On the web this MUST be called from a user
 * gesture (e.g. a button click). Returns the resulting permission state.
 */
export async function requestNotificationPermission() {
  if (isNative()) {
    const LN = await getNative();
    if (!LN) return "unsupported";
    try {
      const res = await LN.requestPermissions();
      return res.display === "granted" ? "granted" : "denied";
    } catch {
      return "denied";
    }
  }
  if (typeof Notification === "undefined") return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

// 32-bit-safe id generator for native notifications.
const nativeId = () => Math.floor(Math.random() * 2147483000) + 1;

/**
 * Show an OS notification. No-ops unless permission is already granted.
 *   { title, body, tag, data: { url, userId } }
 * On web, clicking focuses the window and navigates to data.url.
 */
export async function showOsNotification({ title, body, tag, data } = {}) {
  const perm = await getNotificationPermission();
  if (perm !== "granted") return;

  if (isNative()) {
    const LN = await getNative();
    if (!LN) return;
    try {
      await LN.schedule({
        notifications: [
          {
            id: nativeId(),
            title: title || "New message",
            body: body || "",
            extra: data || {},
          },
        ],
      });
    } catch {
      /* ignore scheduling errors */
    }
    return;
  }

  // Web
  try {
    const n = new Notification(title || "New message", {
      body: body || "",
      tag: tag || undefined,
      renotify: !!tag,
      icon: `${process.env.PUBLIC_URL || ""}/icons/app-icon.svg`,
      badge: `${process.env.PUBLIC_URL || ""}/icons/app-icon.svg`,
    });
    n.onclick = () => {
      try {
        window.focus();
      } catch {
        /* ignore */
      }
      const url = data?.url;
      if (url) {
        try {
          window.location.assign(url);
        } catch {
          /* ignore */
        }
      }
      n.close();
    };
  } catch {
    /* ignore — some browsers throw if constructed without a SW in certain contexts */
  }
}
