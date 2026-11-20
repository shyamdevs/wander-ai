import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { TripProvider } from "./context/TripContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* "user": honour prefers-reduced-motion for every framer-motion transform/layout animation */}
    <MotionConfig reducedMotion="user">
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastProvider>
          <AuthProvider>
            <TripProvider>
              <App />
            </TripProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </MotionConfig>
  </React.StrictMode>
);
