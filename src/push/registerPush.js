// src/push/registerPush.js
//
// Native (Capacitor/Android) Firebase Cloud Messaging registration.
// Requests permission, registers with FCM, sends the device token to the
// backend, and routes notification taps to the right conversation.
//
// No-ops on the web (desktop uses the in-app Notifications API; optional FCM
// web push can be added later). Safe to call multiple times — it only sets up
// once per app session.

import { Capacitor } from "@capacitor/core";
import api from "../api/axiosInstance";

let started = false;

export async function registerPushForMessages() {
  if (started) return;
  if (!Capacitor?.isNativePlatform?.()) return; // native only

  let PushNotifications;
  try {
    ({ PushNotifications } = await import("@capacitor/push-notifications"));
  } catch {
    return; // plugin unavailable
  }

  started = true;

  try {
    // Listeners must be attached before register() so we catch the token.
    await PushNotifications.addListener("registration", async (token) => {
      try {
        await api.post("/api/push/register", {
          token: token?.value,
          platform: "ANDROID",
        });
      } catch {
        /* will retry on next app launch */
      }
    });

    await PushNotifications.addListener("registrationError", () => {
      /* ignore — nothing we can do client-side */
    });

    // Tapping a notification opens the relevant conversation.
    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const uid = action?.notification?.data?.userId;
      const url = uid ? `/app/messages/thread/${uid}` : "/app/messages";
      try {
        window.location.assign(url);
      } catch {
        /* ignore */
      }
    });

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") {
      started = false; // allow a retry later (e.g. after the user enables it)
      return;
    }

    await PushNotifications.register();
  } catch {
    started = false;
  }
}
