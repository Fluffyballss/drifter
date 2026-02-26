// Polyfill for browser environment
if (typeof window !== 'undefined') {
  (window as any).global = window;
  if (!(window as any).process) {
    (window as any).process = {
      env: { NODE_ENV: 'production' },
      version: '',
      nextTick: (cb: any) => setTimeout(cb, 0),
    };
  }
}
export {};
