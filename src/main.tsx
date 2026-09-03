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

// Suppress Mapbox GL JS aborted fetch errors in React 18 Strict Mode
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message === 'Failed to fetch' && event.reason.stack?.includes('mapbox')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
);
