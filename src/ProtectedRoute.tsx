import { Navigate } from "react-router-dom";
import { isLoggedIn } from "./auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) {
    return <Navigate to="/" replace />;
  }

  return children;
}
