import React from 'react';
import { 
  notify, 
  NOTIFICATION_TYPES, 
  NOTIFICATION_PRIORITIES 
} from './EnterpriseNotificationSystem';
import { enterpriseToast } from '../ToastExports';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Settings,
  ExternalLink,
  Download,
  Trash2
} from 'lucide-react';
import styles from './NotificationDemo.module.scss';

export default function NotificationDemo() {
  const handleToastDemo = (type) => {
    switch (type) {
      case 'success':
        enterpriseToast.success('Profile updated successfully!');
        break;
      case 'error':
        enterpriseToast.error('Failed to save changes. Please try again.');
        break;
      case 'warning':
        enterpriseToast.warning('Your session will expire in 5 minutes.');
        break;
      case 'info':
        enterpriseToast.info('New features are now available in your dashboard.');
        break;
      case 'loading':
        const loadingId = enterpriseToast.loading('Uploading files...');
        setTimeout(() => {
          enterpriseToast.update(loadingId, 'Files uploaded successfully!', 'success');
        }, 3000);
        break;
      case 'action':
        enterpriseToast.action(
          'Update available',
          'Install Now',
          () => {
            enterpriseToast.success('Update installed successfully!');
          }
        );
        break;
      default:
        break;
    }
  };

  const handleInAppDemo = (type) => {
    switch (type) {
      case 'success':
        notify.success(
          'Payment Processed',
          'Your subscription has been renewed successfully.',
          { priority: NOTIFICATION_PRIORITIES.HIGH }
        );
        break;
      case 'error':
        notify.error(
          'Connection Failed',
          'Unable to connect to the server. Please check your internet connection.',
          { priority: NOTIFICATION_PRIORITIES.CRITICAL }
        );
        break;
      case 'warning':
        notify.warning(
          'Storage Almost Full',
          'You have used 90% of your storage quota. Consider upgrading your plan.',
          { 
            priority: NOTIFICATION_PRIORITIES.MEDIUM,
            actions: [
              {
                label: 'Upgrade Plan',
                variant: 'primary',
                icon: ExternalLink,
                onClick: () => console.log('Upgrade clicked')
              },
              {
                label: 'Manage Files',
                variant: 'secondary',
                icon: Settings,
                onClick: () => console.log('Manage clicked')
              }
            ]
          }
        );
        break;
      case 'info':
        notify.info(
          'New Feature Available',
          'Dark mode is now available in your display settings.',
          {
            actions: [
              {
                label: 'Try It Now',
                variant: 'primary',
                icon: Settings,
                onClick: () => console.log('Try dark mode clicked')
              }
            ]
          }
        );
        break;
      case 'system':
        notify.system(
          'Scheduled Maintenance',
          'System maintenance is scheduled for tonight at 2:00 AM EST.',
          {
            priority: NOTIFICATION_PRIORITIES.HIGH,
            actions: [
              {
                label: 'Learn More',
                variant: 'secondary',
                icon: Info,
                external: true,
                onClick: () => console.log('Learn more clicked')
              }
            ]
          }
        );
        break;
      case 'social':
        notify.action(
          'Friend Request',
          'John Doe wants to connect with you.',
          [
            {
              label: 'Accept',
              variant: 'primary',
              icon: CheckCircle,
              onClick: () => {
                notify.success('Friend Request Accepted', 'You are now connected with John Doe.');
              }
            },
            {
              label: 'Decline',
              variant: 'danger',
              icon: Trash2,
              onClick: () => console.log('Declined friend request')
            }
          ],
          { 
            type: NOTIFICATION_TYPES.SOCIAL,
            priority: NOTIFICATION_PRIORITIES.MEDIUM 
          }
        );
        break;
      default:
        break;
    }
  };

  return (
    <div className={styles.demo}>
      <div className={styles.section}>
        <h3 className={styles.title}>Toast Notifications</h3>
        <p className={styles.description}>
          Modern toast notifications with enterprise-level styling and animations.
        </p>
        <div className={styles.buttons}>
          <button 
            className={`${styles.button} ${styles.success}`}
            onClick={() => handleToastDemo('success')}
          >
            <CheckCircle size={16} />
            Success Toast
          </button>
          <button 
            className={`${styles.button} ${styles.error}`}
            onClick={() => handleToastDemo('error')}
          >
            <AlertTriangle size={16} />
            Error Toast
          </button>
          <button 
            className={`${styles.button} ${styles.warning}`}
            onClick={() => handleToastDemo('warning')}
          >
            <AlertTriangle size={16} />
            Warning Toast
          </button>
          <button 
            className={`${styles.button} ${styles.info}`}
            onClick={() => handleToastDemo('info')}
          >
            <Info size={16} />
            Info Toast
          </button>
          <button 
            className={`${styles.button} ${styles.loading}`}
            onClick={() => handleToastDemo('loading')}
          >
            <Download size={16} />
            Loading Toast
          </button>
          <button 
            className={`${styles.button} ${styles.action}`}
            onClick={() => handleToastDemo('action')}
          >
            <Settings size={16} />
            Action Toast
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.title}>In-App Notifications</h3>
        <p className={styles.description}>
          Persistent in-app notifications with actions, priorities, and enterprise features.
        </p>
        <div className={styles.buttons}>
          <button 
            className={`${styles.button} ${styles.success}`}
            onClick={() => handleInAppDemo('success')}
          >
            <CheckCircle size={16} />
            Success Notification
          </button>
          <button 
            className={`${styles.button} ${styles.error}`}
            onClick={() => handleInAppDemo('error')}
          >
            <AlertTriangle size={16} />
            Critical Error
          </button>
          <button 
            className={`${styles.button} ${styles.warning}`}
            onClick={() => handleInAppDemo('warning')}
          >
            <AlertTriangle size={16} />
            Warning with Actions
          </button>
          <button 
            className={`${styles.button} ${styles.info}`}
            onClick={() => handleInAppDemo('info')}
          >
            <Info size={16} />
            Feature Announcement
          </button>
          <button 
            className={`${styles.button} ${styles.system}`}
            onClick={() => handleInAppDemo('system')}
          >
            <Settings size={16} />
            System Notice
          </button>
          <button 
            className={`${styles.button} ${styles.social}`}
            onClick={() => handleInAppDemo('social')}
          >
            <CheckCircle size={16} />
            Social Interaction
          </button>
        </div>
      </div>

      <div className={styles.features}>
        <h4>Enterprise Features</h4>
        <ul>
          <li>✅ Modern glassmorphism design with backdrop blur</li>
          <li>✅ Priority-based styling and auto-dismiss timing</li>
          <li>✅ Action buttons with custom handlers</li>
          <li>✅ Accessibility compliant (ARIA, keyboard navigation)</li>
          <li>✅ Dark mode and high contrast support</li>
          <li>✅ Reduced motion support</li>
          <li>✅ Mobile responsive design</li>
          <li>✅ Stacked notifications with overflow handling</li>
          <li>✅ Loading states with progress indicators</li>
          <li>✅ Persistent notifications for critical messages</li>
        </ul>
      </div>
    </div>
  );
}