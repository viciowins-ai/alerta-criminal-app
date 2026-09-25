import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./i18n/config";
import "./index.css";

// Automatically update PWA when new version is available
import { registerSW } from "virtual:pwa-register";
registerSW({ immediate: true });

// Suppress Mapbox GL JS aborted fetch errors and circular JSON errors
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message === 'Failed to fetch' && event.reason.stack?.includes('mapbox')) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  if (event.message?.includes('Converting circular structure to JSON')) {
    event.preventDefault();
  }
});

// Sanitize console.error and console.warn to protect against harness/extension JSON serialization of DOM nodes/React fibers
const sanitizeConsoleArg = (arg: any, seen = new WeakSet()): any => {
  if (arg === null || typeof arg !== 'object') {
    return arg;
  }
  if (typeof Element !== 'undefined' && arg instanceof Element) {
    return `[${arg.tagName.toLowerCase()}]`;
  }
  if (arg._reactName || arg.nativeEvent) {
    return `[SyntheticEvent ${arg.type || ''}]`;
  }
  if (arg instanceof Error) {
    return arg.message || String(arg);
  }
  if (seen.has(arg)) {
    return '[Circular]';
  }
  seen.add(arg);
  if (Array.isArray(arg)) {
    return arg.map(item => sanitizeConsoleArg(item, seen));
  }
  const clean: Record<string, any> = {};
  for (const key of Object.keys(arg)) {
    if (key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')) {
      continue;
    }
    try {
      clean[key] = sanitizeConsoleArg(arg[key], seen);
    } catch {
      clean[key] = '[Unserializable]';
    }
  }
  return clean;
};

const rawConsoleError = console.error;
console.error = (...args: any[]) => {
  const safeArgs = args.map(arg => {
    try {
      return sanitizeConsoleArg(arg);
    } catch {
      return typeof arg === 'object' && arg ? (arg.message || '[Object]') : String(arg);
    }
  });
  rawConsoleError.apply(console, safeArgs);
};

const rawConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  const safeArgs = args.map(arg => {
    try {
      return sanitizeConsoleArg(arg);
    } catch {
      return typeof arg === 'object' && arg ? (arg.message || '[Object]') : String(arg);
    }
  });
  rawConsoleWarn.apply(console, safeArgs);
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
);
// force sync
