// src/api/services/rbac.service.ts
import { http } from "../client";
import { unwrap } from "./_unwrap";
import type {
  EffectiveRbacResponse,
  RbacRole,
  UserRole,
  AssignUserRoleRequest,
} from "../../types/rbac";

export const rbacService = {
  // ✅ giữ nguyên phần cũ (đang dùng cho guard/permission)
  getEffective: (params?: { restaurantId?: string | null; outletId?: string | null }) =>
    http.get<EffectiveRbacResponse>("/rbac/effective", { params }),

  // =========================
  // ✅ NEW: phục vụ quản lý role
  // =========================
  listRoles: async () => {
    const res = await http.get<RbacRole[]>("/rbac/roles");
    return unwrap<RbacRole[]>(res);
  },

  listUserRoles: async (params: {
    userId: string;
    restaurantId?: string | null;
    outletId?: string | null;
  }) => {
    const res = await http.get<UserRole[]>("/rbac/user-roles", { params });
    return unwrap<UserRole[]>(res);
  },

  assignUserRole: async (payload: AssignUserRoleRequest) => {
    const res = await http.post<UserRole>("/rbac/user-roles", payload);
    return unwrap<UserRole>(res);
  },

  unassignUserRole: async (userRoleId: string) => {
    const anyHttp: any = http as any;
    const res =
      typeof anyHttp.del === "function"
        ? await anyHttp.del(`/rbac/user-roles/${userRoleId}`)
        : await http.del(`/rbac/user-roles/${userRoleId}`);
    return unwrap<void>(res);
  },
};
