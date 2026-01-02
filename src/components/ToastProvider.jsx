
import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ToastProvider.scss';

// Enhanced toast methods with enterprise-level styling
export const enterpriseToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      className: 'enterprise-toast enterprise-toast--success',
      progressClassName: 'enterprise-toast__progress--success',
      ...options,
    });
  },
  
  error: (message, options = {}) => {
    return toast.error(message, {
      className: 'enterprise-toast enterprise-toast--error',
      progressClassName: 'enterprise-toast__progress--error',
      autoClose: 5000, // Longer for errors
      ...options,
    });
  },
  
  warning: (message, options = {}) => {
    return toast.warning(message, {
      className: 'enterprise-toast enterprise-toast--warning',
      progressClassName: 'enterprise-toast__progress--warning',
      ...options,
    });
  },
  
  info: (message, options = {}) => {
    return toast.info(message, {
      className: 'enterprise-toast enterprise-toast--info',
      progressClassName: 'enterprise-toast__progress--info',
      ...options,
    });
  },
  
  // Custom enterprise notification with action buttons
  action: (message, actionText, onAction, options = {}) => {
    return toast(
      <div className="enterprise-toast__content">
        <span>{message}</span>
        <button 
          className="enterprise-toast__action"
          onClick={() => {
            onAction();
            toast.dismiss();
          }}
        >
          {actionText}
        </button>
      </div>,
      {
        className: 'enterprise-toast enterprise-toast--action',
        progressClassName: 'enterprise-toast__progress--action',
        autoClose: false,
        closeButton: true,
        ...options,
      }
    );
  },
  
  // Loading toast with spinner
  loading: (message, options = {}) => {
    return toast(
      <div className="enterprise-toast__loading">
        <div className="enterprise-toast__spinner"></div>
        <span>{message}</span>
      </div>,
      {
        className: 'enterprise-toast enterprise-toast--loading',
        progressClassName: 'enterprise-toast__progress--loading',
        autoClose: false,
        closeButton: false,
        ...options,
      }
    );
  },
  
  // Update existing toast
  update: (toastId, message, type = 'info', options = {}) => {
    return toast.update(toastId, {
      render: message,
      type,
      className: `enterprise-toast enterprise-toast--${type}`,
      progressClassName: `enterprise-toast__progress--${type}`,
      ...options,
    });
  },
  
  // Dismiss toast
  dismiss: (toastId) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }
};

export default function ToastProvider() {
  return (
    <ToastContainer 
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      limit={5}
      stacked
      className="enterprise-toast-container"
      toastClassName="enterprise-toast"
      bodyClassName="enterprise-toast__body"
      progressClassName="enterprise-toast__progress"
      closeButton={({ closeToast }) => (
        <button 
          className="enterprise-toast__close"
          onClick={closeToast}
          aria-label="Close notification"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path 
              d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    />
  );
}
