import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Global error handler for mobile connector issues
window.addEventListener('error', (event) => {
  if (event.error?.message?.includes('ethereum') ||
      event.error?.message?.includes('Connector') ||
      event.error?.message?.includes('provider')) {
    console.warn('Suppressed connector error:', event.error);
    event.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
