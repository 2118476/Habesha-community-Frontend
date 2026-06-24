// src/components/notifications/MessageNotifications.jsx
//
// Headless: runs the message-notification watcher app-wide for the signed-in
// user, and (on native) registers the device for Firebase push. Mounted once,
// near the other global notification systems.

import { useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import useMessageNotifications from "../../hooks/useMessageNotifications";
import { registerPushForMessages } from "../../push/registerPush";

export default function MessageNotifications() {
  useMessageNotifications();
  const { user } = useAuth() || {};

  useEffect(() => {
    // Once the user is signed in, register this device for FCM push (no-op on web).
    if (user?.id) registerPushForMessages();
  }, [user?.id]);

  return null;
}
