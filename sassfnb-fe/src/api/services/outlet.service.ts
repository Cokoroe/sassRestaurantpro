// src/api/services/outlet.service.ts
import { http } from "../client";
import type { PageResponse } from "../../types/page";
import type {
  Outlet,
  OutletCreateRequest,
  OutletHoursUpdateRequest,
  OutletListParams,
  OutletUpdateRequest,
} from "../../types/outlet";

export const outletService = {
  // GET /outlets
  listOutlets: (params?: OutletListParams) => {
    return http.get<PageResponse<Outlet>>("/outlets", { params });
  },

  // alias nếu nơi khác còn dùng
  list: (params?: OutletListParams) => {
    return http.get<PageResponse<Outlet>>("/outlets", { params });
  },

  // POST /outlets
  create: (payload: OutletCreateRequest) => {
    return http.post<Outlet>("/outlets", payload);
  },

  // GET /outlets/{id}
  getById: (id: string) => {
    return http.get<Outlet>(`/outlets/${id}`);
  },

  // PUT /outlets/{id}
  update: (id: string, payload: OutletUpdateRequest) => {
    return http.put<Outlet>(`/outlets/${id}`, payload);
  },

  // DELETE /outlets/{id}
  delete: (id: string) => {
    return http.del<void>(`/outlets/${id}`);
  },

  // PATCH /outlets/{id}/make-default
  makeDefault: (id: string) => {
    // nếu client của bạn bắt buộc body, dùng {}
    return http.patch<void>(`/outlets/${id}/make-default`, {});
  },

  // GET /outlets/{id}/hours
  getHours: (id: string) => {
    return http.get<string>(`/outlets/${id}/hours`);
  },

  // PUT /outlets/{id}/hours
  updateHours: (id: string, payload: OutletHoursUpdateRequest) => {
    return http.put<void>(`/outlets/${id}/hours`, payload);
  },
};
