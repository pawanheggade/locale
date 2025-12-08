import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AppProviders } from './contexts/AppProviders';
import ErrorBoundary from './components/ErrorBoundary';

// Aggressive cache-busting for stale HTML
// This checks for a version flag set in the new index.html. If not present,
// it means the browser served a cached HTML file, so we force a hard reload.
if (!(window as any).__APP_VERSION__ || (window as any).__APP_VERSION__ !== 'v115') {
  if (!window.location.search.includes('_cache_bust')) {
    console.warn('Stale HTML detected, forcing a hard reload...');
    window.location.href = window.location.pathname + '?_cache_bust=' + Date.now();
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </ErrorBoundary>
  </React.StrictMode>
);