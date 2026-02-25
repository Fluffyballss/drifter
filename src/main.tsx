import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Polyfill process and global for libraries that expect them in the browser
if (typeof window !== 'undefined') {
  window.global = window;
  if (!window.process) {
    (window as any).process = { 
      env: { NODE_ENV: 'production' },
      version: '',
      nextTick: (cb: any) => setTimeout(cb, 0)
    };
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
