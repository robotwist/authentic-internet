import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./fonts.css"; // Import fonts first
import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary"; // Global error handling

const rootElement = document.getElementById("root");

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
