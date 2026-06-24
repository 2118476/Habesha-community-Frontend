// src/components/notifications/MessageNotifications.jsx
//
// Headless: runs the message-notification watcher app-wide for the signed-in
// user. Mounted once, near the other global notification systems.

import useMessageNotifications from "../../hooks/useMessageNotifications";

export default function MessageNotifications() {
  useMessageNotifications();
  return null;
}
