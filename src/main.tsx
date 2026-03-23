import './polyfill';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';

console.log('App starting...');

async function init() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  try {
    console.log('Importing App component...');
    const { default: App } = await import('./App');
    
    console.log('Rendering App...');
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('App rendered successfully');
  } catch (error) {
    console.error('CRITICAL ERROR during React initialization:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; background: #1a1a1a; color: #ff4444; font-family: monospace; border: 2px solid #ff4444;">
        <h1 style="margin-top: 0;">CRITICAL ERROR</h1>
        <p>React application failed to initialize. This usually means a module failed to load or a syntax error occurred.</p>
        <pre style="background: #000; padding: 10px; overflow: auto; border: 1px solid #333;">${error instanceof Error ? error.stack || error.message : String(error)}</pre>
        <p style="color: #888; font-size: 0.8em;">Check the browser console for more details.</p>
        <button onclick="window.location.reload()" style="background: #ff4444; color: white; border: none; padding: 10px 20px; cursor: pointer; font-weight: bold;">RELOAD APP</button>
      </div>
    `;
  }
}

init();
