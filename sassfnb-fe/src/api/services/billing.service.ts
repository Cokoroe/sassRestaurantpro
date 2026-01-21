// src/api/services/billing.service.ts
import { http } from "../client";
import type { PageResponse } from "../../types/order";
import type {
  BillingScope,
  BillingTotalsResponse,
  BillingGroupPrepareResponse,
  CreateGroupRequest,
  UpdateGroupRequest,
  BillingGroupSummary,
  BillingGroupDetailResponse,
  ManualPaymentRequest,
  ManualPaymentResponse,
  SepayQrResponse,
  CloseResponse,
  UUID,
} from "../../types/billing";

// ===== DELETE helper (compatible với wrapper khác nhau)
const del = (url: string, config?: any) => {
  const anyHttp: any = http as any;
  if (typeof anyHttp.del === "function") return anyHttp.del(url, config);
  if (typeof anyHttp.delete === "function") return anyHttp.delete(url, config);
  if (typeof anyHttp.request === "function")
    return anyHttp.request({ url, method: "DELETE", ...(config ?? {}) });
  throw new Error("HTTP client does not support DELETE");
};

export const billingService = {
  // GET /api/v1/billing/totals?scope=ORDER&orderId=... OR scope=GROUP&groupId=...
  totals: (scope: BillingScope, args: { orderId?: UUID; groupId?: UUID }) =>
    http.get<BillingTotalsResponse>("/billing/totals", {
      params: { scope, ...args },
    }),

  // ===== Groups
  // GET /api/v1/billing/groups/prepare?outletId=...
  prepareGroup: (params?: { outletId?: UUID }) =>
    http.get<BillingGroupPrepareResponse>("/billing/groups/prepare", { params }),

  // POST /api/v1/billing/groups
  createGroup: (body: CreateGroupRequest) => http.post<UUID>("/billing/groups", body),

  // GET /api/v1/billing/groups
  listGroups: (params: {
    outletId?: UUID;
    status?: string;
    q?: string;
    page?: number;
    size?: number;
  }) => http.get<PageResponse<BillingGroupSummary>>("/billing/groups", { params }),

  // GET /api/v1/billing/groups/{groupId}
  getGroup: (groupId: UUID) =>
    http.get<BillingGroupDetailResponse>(`/billing/groups/${groupId}`),

  // PATCH /api/v1/billing/groups/{groupId}
  updateGroup: (groupId: UUID, body: UpdateGroupRequest) =>
    http.patch<void>(`/billing/groups/${groupId}`, body),

  // DELETE /api/v1/billing/groups/{groupId}
  deleteGroup: (groupId: UUID) => del(`/billing/groups/${groupId}`),

  // ===== Manual payments
  manualPayOrder: (orderId: UUID, body: ManualPaymentRequest) =>
    http.post<ManualPaymentResponse>(`/orders/${orderId}/payments/manual`, body),

  manualPayGroup: (groupId: UUID, body: ManualPaymentRequest) =>
    http.post<ManualPaymentResponse>(`/billing/groups/${groupId}/payments/manual`, body),

  // ===== SePay (NEW)
  // GET /api/v1/payments/sepay/qr/order/{orderId}?outletId=...
  sepayQrOrder: (orderId: UUID, outletId: UUID) =>
    http.get<SepayQrResponse>(`/payments/sepay/qr/order/${orderId}`, {
      params: { outletId },
    }),

  // ===== Close
  closeOrder: (orderId: UUID) => http.post<CloseResponse>(`/orders/${orderId}/close`),
  closeGroup: (groupId: UUID) => http.post<CloseResponse>(`/billing/groups/${groupId}/close`),
};
