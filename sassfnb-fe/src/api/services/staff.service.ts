// src/api/services/staff.service.ts
import { http } from "../client";
import { unwrap } from "./_unwrap";
import type { PageResponse } from "../../types/page";
import type {
  Staff,
  StaffCreateRequest,
  StaffListParams,
  StaffOption,
  StaffStatusUpdateRequest,
  StaffUpdateRequest,
} from "../../types/staff";

export const staffService = {
  list: async (params: StaffListParams) => {
    const res = await http.get<PageResponse<Staff>>("/staffs", { params });
    return unwrap<PageResponse<Staff>>(res);
  },

  get: async (id: string) => {
    const res = await http.get<Staff>(`/staffs/${id}`);
    return unwrap<Staff>(res);
  },

  create: async (payload: StaffCreateRequest) => {
    const res = await http.post<Staff>("/staffs", payload);
    return unwrap<Staff>(res);
  },

  update: async (id: string, payload: StaffUpdateRequest) => {
    const res = await http.patch<Staff>(`/staffs/${id}`, payload);
    return unwrap<Staff>(res);
  },

  remove: async (id: string) => {
    const anyHttp: any = http as any;
    const res =
      typeof anyHttp.del === "function"
        ? await anyHttp.del(`/staffs/${id}`)
        : await http.del(`/staffs/${id}`);
    return unwrap<void>(res);
  },

  updateStatus: async (id: string, payload: StaffStatusUpdateRequest) => {
    const res = await http.patch<Staff>(`/staffs/${id}/status`, payload);
    return unwrap<Staff>(res);
  },

  options: async (outletId: string) => {
    const res = await http.get<StaffOption[]>("/staffs/options", {
      params: { outletId },
    });
    return unwrap<StaffOption[]>(res);
  },

  me: async () => {
    const res = await http.get<Staff>("/staffs/me");
    return unwrap<Staff>(res);
  },

  // ✅ NEW: upload avatar (multipart/form-data, field = "file")
  uploadAvatar: async (staffId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);

    // NOTE: với axios: headers multipart tự set boundary nếu để trống,
    // nhưng vẫn ok nếu set MediaType
    const res = await http.post<Staff>(`/staffs/${staffId}/avatar`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return unwrap<Staff>(res);
  },
};
