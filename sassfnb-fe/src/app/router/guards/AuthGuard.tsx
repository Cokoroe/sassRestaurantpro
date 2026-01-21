// src/app/router/guards/AuthGuard.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function AuthGuard({
  redirectTo = "/auth/login",
}: {
  redirectTo?: string;
}) {
  const location = useLocation();
  const token = localStorage.getItem("access_token");

  if (!token)
    return (
      <Navigate to={redirectTo} replace state={{ from: location.pathname }} />
    );
  return <Outlet />;
}
