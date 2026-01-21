// src/api/services/table.service.ts
import { http } from "../client";
import type { PageResponse } from "../../types/page";
import type {
  Table,
  TableListParams,
  TableCreatePayload,
  TableUpdatePayload,
  TableStatus,
  TableStatusPatchPayload,
  DynamicQrDto,
  RotateQrPayload,
  StaticQrDto,
  StaticQrGenerateParams,
  StaticQrRefreshParams,
} from "../../types/table";

export const TableService = {
  // ===== TABLE CRUD =====
  list: (params: TableListParams) =>
    http.get<PageResponse<Table>>("/tables", { params }),

  get: (id: string) => http.get<Table>(`/tables/${id}`),

  create: (payload: TableCreatePayload) => http.post<Table>("/tables", payload),

  update: (id: string, payload: TableUpdatePayload) =>
    http.put<Table>(`/tables/${id}`, payload),

  patchStatus: (id: string, status: TableStatus | string) =>
    http.patch<void>(`/tables/${id}/status`, { status } satisfies TableStatusPatchPayload),

  delete: (id: string) => http.del<void>(`/tables/${id}`),

  // ===== DYNAMIC QR =====
  getDynamicQr: (tableId: string) =>
    http.get<DynamicQrDto>(`/tables/${tableId}/qr`),

  rotateDynamicQr: (tableId: string, payload?: RotateQrPayload) =>
    http.post<DynamicQrDto>(`/tables/${tableId}/qr/rotate`, payload ?? null),

  disableDynamicQr: (tableId: string) =>
    http.post<void>(`/tables/${tableId}/qr/disable`, null),

  // ===== STATIC QR =====
  getStaticQr: (tableId: string) =>
    http.get<StaticQrDto>(`/tables/${tableId}/qr/static`),

  generateStaticQr: (tableId: string, params?: StaticQrGenerateParams) =>
    http.post<StaticQrDto>(`/tables/${tableId}/qr/static/generate`, null, { params }),

  refreshStaticQr: (tableId: string, params?: StaticQrRefreshParams) =>
    http.put<StaticQrDto>(`/tables/${tableId}/qr/static/refresh`, null, { params }),
};

export default TableService;
