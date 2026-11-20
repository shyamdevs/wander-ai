import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { ProtectedRoute, GuestRoute } from "./components/RouteGuards";

// Heavy screens load on demand so the landing page paints before three.js and the planner download.
const Scene = lazy(() => import("./three/Scene"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SharedTrip = lazy(() => import("./pages/SharedTrip"));

export default function App() {
  const location = useLocation();
  return (
    <>
      {/* Persistent 3D background: stays mounted while pages swap above it */}
      <Suspense fallback={null}><Scene /></Suspense>
      <div className="pointer-events-none relative z-10">
        <AnimatePresence mode="wait">
          <Suspense key={location.pathname} fallback={<p className="sr-only" role="status">Loading…</p>}>
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/shared/:shareId" element={<SharedTrip />} />
            <Route path="*" element={<Landing />} />
          </Routes>
          </Suspense>
        </AnimatePresence>
      </div>
    </>
  );
}
