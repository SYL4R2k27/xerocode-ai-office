
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { ErrorBoundary } from "./app/components/shared/ErrorBoundary";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary name="root">
      <App />
    </ErrorBoundary>
  );

  // Register service worker (PWA)
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("SW registration failed:", err);
      });
    });
  }
