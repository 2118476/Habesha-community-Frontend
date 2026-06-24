// src/hooks/useMessageNotifications.js
//
// Watches the current user's message threads and raises an OS notification
// (desktop browser or native mobile) whenever a NEW inbound message arrives
// while the relevant conversation isn't already in front of the user.
//
// Delivery is best-effort and runs while the app/tab is alive (foreground or
// a briefly-backgrounded tab). True background/closed-app push would need
// FCM/APNs — see notes in the PR description.

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import api from "../api/axiosInstance";
import useAuth from "./useAuth";
import {
  getNotificationPermission,
  showOsNotification,
} from "../utils/messageNotifications";

const POLL_MS = 20000;

export default function useMessageNotifications() {
  const { user } = useAuth() || {};
  const navigate = useNavigate();

  // userId -> last-seen message timestamp (ms). Primed silently on first poll.
  const seenRef = useRef(new Map());
  const primedRef = useRef(false);
  const activeRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return undefined;

    activeRef.current = true;
    seenRef.current = new Map();
    primedRef.current = false;

    const poll = async () => {
      if (!activeRef.current) return;

      let data;
      try {
        const res = await api.get("/messages/threads", { params: { limit: 50 } });
        data = res?.data;
      } catch {
        try {
          const res = await api.get("/api/messages/threads", { params: { limit: 50 } });
          data = res?.data;
        } catch {
          return; // not authed / offline — try again next tick
        }
      }

      const list = Array.isArray(data) ? data : data?.items ?? data?.content ?? [];
      const perm = await getNotificationPermission();

      // Don't pop a notification for a chat the user is already looking at.
      const path = `${window.location.pathname}${window.location.hash}`;
      const onMessages = /\/messages/i.test(path);
      const visible = document.visibilityState === "visible";

      for (const t of list) {
        const uid = t?.userId ?? t?.id;
        if (uid == null) continue;

        const unread = Number(t?.unread ?? t?.unreadCount ?? 0);
        const lastAtMs = t?.lastAt ? Date.parse(t.lastAt) : 0;
        const prev = seenRef.current.get(uid) ?? 0;

        if (lastAtMs > prev) {
          seenRef.current.set(uid, lastAtMs);

          const shouldNotify =
            primedRef.current &&
            unread > 0 &&
            perm === "granted" &&
            !(visible && onMessages);

          if (shouldNotify) {
            showOsNotification({
              title: t?.userName || "New message",
              body: t?.lastText || "You have a new message",
              tag: `msg-${uid}`,
              data: { url: `/app/messages/thread/${uid}`, userId: uid },
            });
          }
        }
      }

      primedRef.current = true;
    };

    poll();
    const id = setInterval(poll, POLL_MS);

    const onKick = () => poll();
    const onVisibility = () => {
      if (document.visibilityState === "visible") poll();
    };
    window.addEventListener("messages:updated", onKick);
    window.addEventListener("focus", onKick);
    document.addEventListener("visibilitychange", onVisibility);

    // Native: tapping the notification opens the conversation.
    let removeTap;
    if (Capacitor?.isNativePlatform?.()) {
      import("@capacitor/local-notifications")
        .then(({ LocalNotifications }) =>
          LocalNotifications.addListener("localNotificationActionPerformed", (ev) => {
            const uid = ev?.notification?.extra?.userId;
            navigate(uid ? `/app/messages/thread/${uid}` : "/app/messages");
          })
        )
        .then((handle) => {
          removeTap = () => handle?.remove?.();
        })
        .catch(() => {});
    }

    return () => {
      activeRef.current = false;
      clearInterval(id);
      window.removeEventListener("messages:updated", onKick);
      window.removeEventListener("focus", onKick);
      document.removeEventListener("visibilitychange", onVisibility);
      removeTap?.();
    };
  }, [user?.id, navigate]);
}
