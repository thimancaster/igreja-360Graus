import React from "react"; // Adicionar esta linha
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary.tsx"; // Importar ErrorBoundary

// Register push notification service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw-push.js").catch((err) => {
    console.log("SW registration failed:", err);
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);