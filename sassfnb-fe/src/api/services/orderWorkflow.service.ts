import { http } from "../client";

export const orderWorkflowService = {
  totals: (orderId: string) => http.get(`/orders/${orderId}/totals`),

  finalize: (orderId: string, payload?: { note?: string | null }) =>
    http.post(`/orders/${orderId}/finalize`, payload ?? null),

  submit: (orderId: string) => http.post(`/orders/${orderId}/submit`, null),

  reopen: (orderId: string, payload?: { reason?: string | null }) =>
    http.post(`/orders/${orderId}/reopen`, payload ?? null),

  fire: (orderId: string, payload: { all?: boolean; itemIds?: string[] }) =>
    http.post(`/orders/${orderId}/fire`, payload),

  voidItem: (orderId: string, itemId: string, payload?: { reason?: string | null }) =>
    http.post(`/orders/${orderId}/items/${itemId}/void`, payload ?? null),

  voidOrder: (orderId: string, payload?: { reason?: string | null }) =>
    http.post(`/orders/${orderId}/void`, payload ?? null),

  patchNote: (orderId: string, payload: { note?: string | null }) =>
    http.patch(`/orders/${orderId}/note`, payload),
};
