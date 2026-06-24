// src/components/notifications/EnableAlertsPrompt.jsx
//
// A small, dismissible inline prompt that asks the user to turn on message
// alerts. Renders only while permission is still "default" (not yet decided)
// and the user hasn't dismissed it. Safe to drop at the top of any page.

import React, { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import {
  getNotificationPermission,
  requestNotificationPermission,
} from "../../utils/messageNotifications";

const DISMISS_KEY = "msgAlertsPromptDismissed";

export default function EnableAlertsPrompt() {
  // Assume granted until we know otherwise, so nothing flashes on first paint.
  const [perm, setPerm] = useState("granted");
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let alive = true;
    getNotificationPermission().then((p) => {
      if (alive) setPerm(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (dismissed) return null;
  if (perm !== "default") return null; // granted / denied / unsupported → hide

  const remember = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const enable = async () => {
    const res = await requestNotificationPermission();
    setPerm(res);
    if (res !== "default") remember();
  };

  const dismiss = () => {
    setDismissed(true);
    remember();
  };

  return (
    <div
      role="region"
      aria-label="Enable message alerts"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        margin: "0 0 12px",
        borderRadius: 12,
        background: "linear-gradient(180deg, rgba(27,122,75,.10), rgba(27,122,75,.04))",
        border: "1px solid rgba(27,122,75,.25)",
        color: "var(--hc-ink, #1f2937)",
        fontSize: 14,
      }}
    >
      <Bell size={18} style={{ color: "#1b7a4b", flex: "0 0 auto" }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        Get notified about new messages, even when you're on another page.
      </span>
      <button
        type="button"
        onClick={enable}
        style={{
          border: 0,
          borderRadius: 8,
          padding: "7px 14px",
          fontWeight: 700,
          fontSize: 13,
          color: "#fff",
          background: "#1b7a4b",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Enable alerts
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        title="Not now"
        style={{
          border: 0,
          background: "transparent",
          color: "inherit",
          opacity: 0.6,
          cursor: "pointer",
          display: "inline-flex",
          padding: 4,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
