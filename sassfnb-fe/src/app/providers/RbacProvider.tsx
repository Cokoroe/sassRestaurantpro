// src/app/providers/RbacProvider.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { rbacService } from "../../api/services/rbac.service";
import { contextStorage } from "../../api/token";
import type {
  EffectivePermission,
  EffectiveRole,
  FeatureFlags,
} from "../../types/rbac";
import { useAppContextStore } from "../../store/useAppContextStore";

type RbacContextValue = {
  loading: boolean;
  roles: EffectiveRole[];
  permissions: EffectivePermission[];
  isSuperUser: boolean;
  hasPermission: (code: string) => boolean;
  getFeatureFlag: (key: string) => boolean;
  refresh: () => Promise<void>;
};

const SUPER_ROLE_CODES = ["OWNER", "ROOT"] as const;

export const RbacContext = createContext<RbacContextValue | undefined>(
  undefined
);

const flattenFeatureFlags = (roles: EffectiveRole[]) => {
  const result: Record<string, boolean> = {};
  roles.forEach((role) => {
    const ff: FeatureFlags | null | undefined = role.featureFlags ?? undefined;
    if (!ff) return;

    Object.entries(ff).forEach(([group, flags]) => {
      Object.entries(flags || {}).forEach(([flag, value]) => {
        if (value) result[`${group}.${flag}`] = true;
      });
    });
  });
  return result;
};

export function RbacProvider({ children }: { children: ReactNode }) {
  // ✅ fallback theo me.roles (cực quan trọng)
  const me = useAppContextStore((s) => s.me);
  const meRoles: string[] = (me as any)?.roles ?? [];
  const isSuperByMe = meRoles.includes("OWNER") || meRoles.includes("ROOT");

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<EffectiveRole[]>([]);
  const [permissions, setPermissions] = useState<EffectivePermission[]>([]);
  const [permissionCodes, setPermissionCodes] = useState<string[]>([]);
  const [featureMap, setFeatureMap] = useState<Record<string, boolean>>({});

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setRoles([]);
      setPermissions([]);
      setPermissionCodes([]);
      setFeatureMap({});
      return;
    }

    const restaurantId = contextStorage.getRestaurantId() ?? undefined;
    const outletId = contextStorage.getOutletId() ?? undefined;

    setLoading(true);
    try {
      const data = await rbacService.getEffective({ restaurantId, outletId });

      const rolesData: EffectiveRole[] = data.roles ?? [];
      const permsData: EffectivePermission[] = data.permissions ?? [];

      setRoles(rolesData);
      setPermissions(permsData);
      setPermissionCodes(permsData.map((p) => p.code));
      setFeatureMap(flattenFeatureFlags(rolesData));
    } catch (e) {
      console.error("Failed to load RBAC effective permissions", e);
      // ✅ vẫn giữ fallback OWNER/ROOT bằng me.roles → sidebar vẫn hiện
      setRoles([]);
      setPermissions([]);
      setPermissionCodes([]);
      setFeatureMap({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("app-context-changed", handler);
    return () => window.removeEventListener("app-context-changed", handler);
  }, [refresh]);

  // ✅ isSuperUser = (RBAC roles) OR (me.roles)
  const isSuperUser = useMemo(() => {
    const byRbac = roles.some((r) => SUPER_ROLE_CODES.includes(r.code as any));
    return isSuperByMe || byRbac;
  }, [roles, isSuperByMe]);

  const hasPermission = useCallback(
    (code: string) => {
      // ✅ super luôn true
      if (isSuperUser) return true;

      // ✅ trong lúc loading RBAC lần đầu, cho phép show menu để không trống UI
      // (tuỳ bạn: nếu muốn “ẩn” khi loading thì bỏ dòng này)
      if (loading) return true;

      if (!code) return true;
      return permissionCodes.includes(code);
    },
    [isSuperUser, loading, permissionCodes]
  );

  const getFeatureFlag = useCallback(
    (key: string) => {
      if (isSuperUser) return true;
      if (loading) return true;
      if (!key) return true;
      return !!featureMap[key];
    },
    [isSuperUser, loading, featureMap]
  );

  const value: RbacContextValue = {
    loading,
    roles,
    permissions,
    isSuperUser,
    hasPermission,
    getFeatureFlag,
    refresh,
  };

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}

export const useRbacContext = () => {
  const ctx = useContext(RbacContext);
  if (!ctx) throw new Error("useRbacContext must be used within RbacProvider");
  return ctx;
};
