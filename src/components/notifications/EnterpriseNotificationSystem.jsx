import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Bell,
  Settings,
  Archive,
  Trash2,
  ExternalLink
} from 'lucide-react';
import styles from './EnterpriseNotificationSystem.module.scss';

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SYSTEM: 'system',
  MARKETING: 'marketing',
  SOCIAL: 'social'
};

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Icon mapping
const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.SUCCESS]: CheckCircle,
  [NOTIFICATION_TYPES.ERROR]: XCircle,
  [NOTIFICATION_TYPES.WARNING]: AlertTriangle,
  [NOTIFICATION_TYPES.INFO]: Info,
  [NOTIFICATION_TYPES.SYSTEM]: Settings,
  [NOTIFICATION_TYPES.MARKETING]: Bell,
  [NOTIFICATION_TYPES.SOCIAL]: Bell
};

// Notification manager class
class NotificationManager {
  constructor() {
    this.notifications = [];
    this.listeners = new Set();
    this.nextId = 1;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  add(notification) {
    const id = this.nextId++;
    const newNotification = {
      id,
      timestamp: new Date().toISOString(),
      read: false,
      dismissed: false,
      ...notification
    };

    // Debug logging
    console.log('NotificationManager: Adding notification', {
      id,
      title: newNotification.title,
      hasOnClick: !!newNotification.onClick,
      onClick: newNotification.onClick
    });

    this.notifications.unshift(newNotification);
    this.notify();

    // Auto-dismiss based on priority and type
    if (notification.autoDismiss !== false) {
      const timeout = this.getAutoDismissTimeout(notification.priority, notification.type);
      if (timeout > 0) {
        setTimeout(() => this.dismiss(id), timeout);
      }
    }

    return id;
  }

  dismiss(id) {
    this.notifications = this.notifications.map(n => 
      n.id === id ? { ...n, dismissed: true } : n
    );
    this.notify();

    // Remove after animation
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
      this.notify();
    }, 300);
  }

  markAsRead(id) {
    this.notifications = this.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.notify();
  }

  markAllAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.notify();
  }

  clear() {
    this.notifications = [];
    this.notify();
  }

  getAutoDismissTimeout(priority, type) {
    if (type === NOTIFICATION_TYPES.ERROR || priority === NOTIFICATION_PRIORITIES.CRITICAL) {
      return 0; // Don't auto-dismiss errors or critical notifications
    }
    
    switch (priority) {
      case NOTIFICATION_PRIORITIES.HIGH: return 8000;
      case NOTIFICATION_PRIORITIES.MEDIUM: return 6000;
      case NOTIFICATION_PRIORITIES.LOW: return 4000;
      default: return 5000;
    }
  }
}

// Global notification manager instance
export const notificationManager = new NotificationManager();

// Convenience methods
export const notify = {
  success: (title, message, options = {}) => 
    notificationManager.add({
      type: NOTIFICATION_TYPES.SUCCESS,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      title,
      message,
      ...options
    }),

  error: (title, message, options = {}) => 
    notificationManager.add({
      type: NOTIFICATION_TYPES.ERROR,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      title,
      message,
      autoDismiss: false,
      ...options
    }),

  warning: (title, message, options = {}) => 
    notificationManager.add({
      type: NOTIFICATION_TYPES.WARNING,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      title,
      message,
      ...options
    }),

  info: (title, message, options = {}) => 
    notificationManager.add({
      type: NOTIFICATION_TYPES.INFO,
      priority: NOTIFICATION_PRIORITIES.LOW,
      title,
      message,
      ...options
    }),

  system: (title, message, options = {}) => 
    notificationManager.add({
      type: NOTIFICATION_TYPES.SYSTEM,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      title,
      message,
      ...options
    }),

  // Action notification with buttons
  action: (title, message, actions = [], options = {}) => 
    notificationManager.add({
      type: NOTIFICATION_TYPES.INFO,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      title,
      message,
      actions,
      autoDismiss: false,
      ...options
    })
};

// Individual notification component
function NotificationItem({ notification, onDismiss, onMarkAsRead, onAction }) {
  const [isExiting, setIsExiting] = useState(false);
  const notificationRef = useRef(null);
  const Icon = NOTIFICATION_ICONS[notification.type] || Info;

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(notification.id), 250);
  }, [notification.id, onDismiss]);

  const handleNotificationClick = useCallback((e) => {
    // Don't trigger if clicking on buttons
    if (e.target.closest('button')) {
      return;
    }
    
    // Mark as read
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    
    // Execute onClick handler if it exists
    if (notification.onClick) {
      try {
        notification.onClick(notification);
      } catch (error) {
        console.error('Error executing notification onClick:', error);
      }
    }
  }, [notification, onMarkAsRead]);

  const handleAction = useCallback((action) => {
    if (action.onClick) {
      action.onClick(notification);
    }
    if (action.dismissOnClick !== false) {
      handleDismiss();
    }
    if (onAction) {
      onAction(action, notification);
    }
  }, [notification, handleDismiss, onAction]);

  useEffect(() => {
    if (notification.dismissed) {
      setIsExiting(true);
    }
  }, [notification.dismissed]);

  const priorityClass = `${styles.notification}--${notification.priority || 'medium'}`;
  const typeClass = `${styles.notification}--${notification.type}`;
  const statusClass = notification.read ? styles.read : styles.unread;
  const exitClass = isExiting ? styles.exiting : '';

  return (
    <div
      ref={notificationRef}
      className={`${styles.notification} ${priorityClass} ${typeClass} ${statusClass} ${exitClass}`}
      role="alert"
      aria-live={notification.priority === NOTIFICATION_PRIORITIES.CRITICAL ? 'assertive' : 'polite'}
      onClick={handleNotificationClick}
      onMouseDown={(e) => {
        console.log('NotificationItem: MouseDown event', e);
      }}
      tabIndex={notification.onClick ? 0 : -1}
      onKeyDown={(e) => {
        if (notification.onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleNotificationClick(e);
        }
      }}
      style={{ 
        cursor: notification.onClick ? 'pointer' : 'default',
        userSelect: 'none'
      }}
    >
      <div className={styles.notification__icon}>
        <Icon size={20} />
      </div>

      <div className={styles.notification__content}>
        <div className={styles.notification__header}>
          <h4 className={styles.notification__title}>{notification.title}</h4>
          <span className={styles.notification__timestamp}>
            {new Date(notification.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>

        {notification.message && (
          <p className={styles.notification__message}>{notification.message}</p>
        )}

        {notification.actions && notification.actions.length > 0 && (
          <div className={styles.notification__actions}>
            {notification.actions.map((action, index) => (
              <button
                key={index}
                className={`${styles.notification__action} ${styles[`notification__action--${action.variant || 'primary'}`]}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(action);
                }}
              >
                {action.icon && <action.icon size={14} />}
                {action.label}
                {action.external && <ExternalLink size={12} />}
              </button>
            ))}
          </div>
        )}

        {!notification.read && (
          <div className={styles.notification__indicator} aria-label="Unread notification" />
        )}
      </div>

      <button
        className={styles.notification__dismiss}
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// Main notification system component
export default function EnterpriseNotificationSystem({ 
  position = 'top-right',
  maxVisible = 5,
  showInAppNotifications = true,
  className = ''
}) {
  const [notifications, setNotifications] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const handleDismiss = useCallback((id) => {
    notificationManager.dismiss(id);
  }, []);

  const handleMarkAsRead = useCallback((id) => {
    notificationManager.markAsRead(id);
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    notificationManager.markAllAsRead();
  }, []);

  const handleClearAll = useCallback(() => {
    notificationManager.clear();
  }, []);

  const visibleNotifications = notifications
    .filter(n => !n.dismissed)
    .slice(0, isMinimized ? 0 : maxVisible);

  const unreadCount = notifications.filter(n => !n.read && !n.dismissed).length;
  const hasNotifications = visibleNotifications.length > 0;

  if (!showInAppNotifications) {
    return null;
  }

  const containerClass = `${styles.container} ${styles[`container--${position}`]} ${className}`;

  return createPortal(
    <div className={containerClass} ref={containerRef}>
      {/* Notification Header (when minimized or has notifications) */}
      {(hasNotifications || unreadCount > 0) && (
        <div className={styles.header}>
          <div className={styles.header__info}>
            <Bell size={16} />
            <span className={styles.header__count}>
              {unreadCount > 0 ? `${unreadCount} new` : 'Notifications'}
            </span>
          </div>
          
          <div className={styles.header__actions}>
            {unreadCount > 0 && (
              <button
                className={styles.header__action}
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                <Archive size={14} />
              </button>
            )}
            
            <button
              className={styles.header__action}
              onClick={handleClearAll}
              title="Clear all"
            >
              <Trash2 size={14} />
            </button>
            
            <button
              className={styles.header__action}
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? 'Show notifications' : 'Hide notifications'}
            >
              {isMinimized ? '▲' : '▼'}
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {hasNotifications && (
        <div className={styles.notifications}>
          {visibleNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onDismiss={handleDismiss}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
          
          {notifications.length > maxVisible && (
            <div className={styles.overflow}>
              +{notifications.length - maxVisible} more notifications
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}