import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ProfileChip from "../ProfileChip";
import prettyTime from "../../utils/prettyTime";

// ---- helpers (outside component = no hooks) ----
const clamp = (s, max) =>
  typeof s === "string" && s.length > max ? s.slice(0, max - 1) + "…" : s;

/* formatAgo replaced by shared prettyTime util for i18n */

const TYPE_LABEL = {
  EVENT_CREATED: "event created",
  SERVICE_CREATED: "service posted",
  RENTAL_CREATED: "rental listed",
  TRAVEL_POSTED: "travel posted",
  FRIEND_ACCEPTED: "friend accepted",
  MESSAGE_RECEIVED: "message received",
  AD_LIKED: "ad liked",
  AD_COMMENTED: "ad commented",
};

function ActivityItem({ item, showMessage = true, onSelect = () => {}, newSince, forceUnread }) {
  const { t } = useTranslation();
  if (!item) return null;

  const entity = String(item.entityType || "").toLowerCase();
  const type = String(item.type || "");
  const typeLabel = TYPE_LABEL[type] || type.replace(/_/g, " ").toLowerCase();

  const whenAgo = prettyTime(item?.createdAt, t);

  const baseTitle =
    item.title || (item.entityType ? `${item.entityType} #${item.entityId}` : "");
  const title = clamp(baseTitle, 160);

  const actorName = item.actor?.displayName || item.actor?.username || "Someone";

  // Compute unread state with priority order
  let isUnread = false;
  
  if (typeof forceUnread === 'boolean') {
    // 1. If forceUnread is provided → use it (highest priority)
    isUnread = forceUnread;
  } else if (typeof item.isRead === 'boolean') {
    // 2. If API gives item.isRead → unread = !item.isRead
    isUnread = !item.isRead;
  } else if (item.readAt) {
    // 3. If item.readAt exists → unread = false
    isUnread = false;
  } else if (newSince && item.createdAt) {
    // 4. Fallback to old newSince comparison
    const itemTime = new Date(item.createdAt).getTime();
    const seenTime = new Date(newSince).getTime();
    isUnread = Number.isFinite(itemTime) && Number.isFinite(seenTime) && itemTime > seenTime;
  }

  // routing (no hooks)
  const id = item.entityId;
  let to = "/app/home";
  switch (entity) {
    case "ad":
    case "classified_ad":
      to = `/app/ads/${id}`; break;
    case "event":
      to = `/app/events/${id}`; break;
    case "service":
      to = `/app/services/${id}`; break;
    case "rental":
      to = `/app/rentals/${id}`; break;
    case "travel":
      to = `/app/travel/${id}`; break;
    case "message":
      to = item.threadId
        ? `/app/messages/thread/${item.threadId}`
        : item.actor?.id
        ? `/app/messages/thread/${item.actor.id}`
        : `/app/messages`;
      break;
    case "friend":
      to = `/app/friends`; break;
    default:
      to = `/app/home`;
  }

  const aria =
    `${actorName} • ${typeLabel}` +
    (title ? ` • ${title}` : "") +
    (whenAgo ? ` • ${whenAgo}` : "") +
    (isUnread ? " • new" : "");

  return (
    <Link
      to={to}
      onClick={onSelect}
      aria-label={aria}
      role="listitem"
      data-entity={entity || ""}
      data-type={type || ""}
      data-unread={isUnread ? "true" : "false"}
      className="notification-item"
    >
      {/* Left: Professional avatar with notification icon */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <ProfileChip 
          user={item.actor} 
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%"
          }}
        />
        {/* Notification type icon */}
        <div
          style={{
            position: "absolute",
            bottom: "-2px",
            right: "-2px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: type === "AD_LIKED" ? "#1877f2" : 
                       type === "AD_COMMENTED" ? "#42b883" : 
                       type === "MESSAGE_RECEIVED" ? "#1877f2" : "#65676b",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "8px",
            border: "2px solid #ffffff",
          }}
        >
          {type === "AD_LIKED" ? "👍" : 
           type === "AD_COMMENTED" ? "💬" : 
           type === "MESSAGE_RECEIVED" ? "✉️" : "🔔"}
        </div>
      </div>

      {/* Right: Professional notification content */}
      <div style={{ 
        flex: 1, 
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        justifyContent: 'flex-start'
      }}>
        <div className="notification-title">
          <strong>{actorName}</strong> {typeLabel}
          {title && (
            <span className="notification-subtitle"> • {title}</span>
          )}
        </div>
        <div className="notification-time">
          {whenAgo}
        </div>
      </div>

      {/* New indicator dot - only show if unread */}
      {isUnread && (
        <div
          className="notification-dot"
          aria-label="new"
          title="New notification"
        />
      )}
    </Link>
  );
}

export default React.memo(ActivityItem);
