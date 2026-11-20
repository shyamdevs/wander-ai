import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Dashboard etc. — requires a valid session
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

// Login / Signup — bounce logged-in users to the dashboard
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}
