import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Global error handler for mobile connector issues and Web3Modal bugs
window.addEventListener('error', (event) => {
  if (event.error?.message?.includes('ethereum') ||
      event.error?.message?.includes('Connector') ||
      event.error?.message?.includes('provider') ||
      event.error?.message?.includes('Cannot read properties of null') ||
      event.error?.message?.includes("reading 'some'")) {
    console.warn('Suppressed Web3Modal/connector error:', event.error);
    event.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
