import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary.tsx";

// ── Apply dark mode by default (user preference via localStorage, else dark) ──
const savedTheme = localStorage.getItem("igreja360-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (savedTheme === "light") {
  document.documentElement.classList.add("light");
} else {
  // Default: dark
  document.documentElement.classList.add("dark");
}

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