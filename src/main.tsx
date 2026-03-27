import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

import { Buffer } from 'buffer';

// Polyfill for simple-peer in Vite
if (typeof global === 'undefined') {
  (window as any).global = window;
}
if (typeof process === 'undefined') {
  (window as any).process = { 
    env: {}, 
    nextTick: (fn: Function) => setTimeout(fn, 0),
    version: '',
    versions: {},
    platform: '',
    browser: true
  };
}
(window as any).Buffer = Buffer;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
