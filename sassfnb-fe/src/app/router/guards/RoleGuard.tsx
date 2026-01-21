// src/app/router/guards/RoleGuard.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRbac } from "../../../hooks/useRbac";

type Props = {
  permissionCode?: string;
  featureKey?: string;
};

export default function RoleGuard({ permissionCode, featureKey }: Props) {
  const location = useLocation();
  const token = localStorage.getItem("access_token");
  const { loading, hasPermission, getFeatureFlag, isSuperUser } = useRbac();

  if (!token)
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  if (loading) return <div className="p-6">Đang tải phân quyền…</div>;
  if (isSuperUser) return <Outlet />;

  let allowed = true;
  if (permissionCode && featureKey)
    allowed = hasPermission(permissionCode) || getFeatureFlag(featureKey);
  else if (permissionCode) allowed = hasPermission(permissionCode);
  else if (featureKey) allowed = getFeatureFlag(featureKey);

  if (!allowed) {
    return (
      <div className="p-6 text-center font-semibold text-white">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  return <Outlet />;
}
