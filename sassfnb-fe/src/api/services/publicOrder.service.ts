// src/api/services/publicOrder.service.ts
import { publicHttp } from "../publicClient";
import type {
  PublicOrder,
  PublicCreateOrderRequest,
  PublicAddItemRequest,
  PublicPatchItemRequest,
  PublicOrderSubmitResponse,
} from "../../types/publicOrder";

export const publicOrderService = {
  // POST /api/v1/public/orders
  create: async (payload: PublicCreateOrderRequest) => {
    const res = await publicHttp.post<PublicOrder>("/public/orders", payload);
    return res.data;
  },

  // GET /api/v1/public/orders/{orderId}
  get: async (orderId: string) => {
    const res = await publicHttp.get<PublicOrder>(`/public/orders/${orderId}`);
    return res.data;
  },

  // POST /api/v1/public/orders/{orderId}/items
  addItems: async (orderId: string, items: PublicAddItemRequest[]) => {
    const res = await publicHttp.post<PublicOrder>(
      `/public/orders/${orderId}/items`,
      items
    );
    return res.data;
  },

  // PATCH /api/v1/public/orders/{orderId}/items/{itemId}
  patchItem: async (
    orderId: string,
    itemId: string,
    payload: PublicPatchItemRequest
  ) => {
    const res = await publicHttp.patch<PublicOrder>(
      `/public/orders/${orderId}/items/${itemId}`,
      payload
    );
    return res.data;
  },

  // DELETE /api/v1/public/orders/{orderId}/items/{itemId}
  deleteItem: async (orderId: string, itemId: string) => {
    const res = await publicHttp.delete<PublicOrder>(
      `/public/orders/${orderId}/items/${itemId}`
    );
    return res.data;
  },

  // POST /api/v1/public/orders/{orderId}/submit?outletId=...
  submit: async (orderId: string, outletId: string) => {
    const res = await publicHttp.post<PublicOrderSubmitResponse>(
      `/public/orders/${orderId}/submit`,
      null,
      { params: { outletId } }
    );
    return res.data;
  },

  // optional: reopen
  reopen: async (orderId: string, outletId: string, payload?: any) => {
    const res = await publicHttp.post(
      `/public/orders/${orderId}/reopen`,
      payload ?? null,
      { params: { outletId } }
    );
    return res.data;
  },
};
