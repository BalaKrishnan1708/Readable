import { Navigate, Outlet } from "react-router-dom";

import { authStore } from "../stores/authStore";
import type { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  roles?: UserRole[];
}

export const ProtectedRoute = ({ roles }: ProtectedRouteProps) => {
  const { token, role } = authStore();
  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
