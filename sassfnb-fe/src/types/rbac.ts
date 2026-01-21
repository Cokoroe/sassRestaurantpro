// src/types/rbac.ts

export type FeatureFlags = {
  [group: string]: {
    [flag: string]: boolean;
  };
};

export type EffectiveRole = {
  id: string;
  code: string; // ROOT / OWNER / STAFF...
  name: string;
  description?: string | null;
  systemFlag?: boolean;
  featureFlags?: FeatureFlags | null;
};

export type EffectivePermission = {
  id: string;
  code: string; // menu.view / tables.manage...
  name: string;
  description?: string | null;
  systemFlag?: boolean;
};

export type EffectiveRbacResponse = {
  roles: EffectiveRole[];
  permissions: EffectivePermission[];
};

/* =========================
 *  EXTENDED RBAC (NEW)
 *  - phục vụ UI quản lý role riêng cho staff
 * ========================= */

export type RbacPermission = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
};

export type RbacRole = {
  id: string;
  code: string;
  name?: string | null;
  description?: string | null;
  systemFlag: boolean;
  featureFlags?: FeatureFlags | null;
  permissions?: RbacPermission[];
};

export type UserRole = {
  id: string;
  userId: string;
  roleId: string;
  restaurantId?: string | null;
  outletId?: string | null;
  assignedAt?: string | null;
  roleCode?: string | null;
  roleName?: string | null;
};

export type AssignUserRoleRequest = {
  userId: string;
  roleId: string;
  restaurantId?: string | null;
  outletId?: string | null;
};
