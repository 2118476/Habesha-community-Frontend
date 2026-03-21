// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import ToastProvider from './components/ToastProvider';
// ✅ React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Global styles (consolidated SCSS entry)
import './main.scss';

// Initialize scroll reveal animations
import './utils/scrollReveal';

// Initialize i18n BEFORE rendering
import './i18n';

// Hero text overrides — loaded last to ensure highest cascade priority
import './styles/hero-overrides.css';

// Initialize theme - LIGHT MODE IS DEFAULT
const initializeTheme = () => {
  // Check both localStorage keys (legacy "theme" and current "ui.theme")
  const savedTheme = localStorage.getItem('ui.theme') || localStorage.getItem('theme');
  
  // Default to light if no saved preference
  const finalTheme = savedTheme === 'dark' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', finalTheme);
  // Sync both keys so ThemeToggle and Settings stay consistent
  localStorage.setItem('ui.theme', finalTheme);
  localStorage.setItem('theme', finalTheme);
};

// Initialize theme before render
initializeTheme();

// Configure a QueryClient with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // we poll /api/counts anyway; avoid noisy refetch on focus
      refetchOnWindowFocus: false,
      // counts can be considered fresh for 15s
      staleTime: 15 * 1000,
      // retry once on transient errors
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ToastProvider />
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
