// src/api/services/kds.service.ts
import { http } from "../client";
import type {
  KdsBoardsParams,
  KdsBoardsResponse,
  PatchKdsItemStatusRequest,
  PatchKdsItemStatusResponse,
} from "../../types/kds";

const buildBoardsUrl = (params?: KdsBoardsParams) => {
  if (!params) return "/kds/boards";

  const sp = new URLSearchParams();

  if (params.since) sp.append("since", params.since);

  // repeat keys => status=FIRED&status=IN_PROGRESS
  (params.status ?? []).forEach((s) => sp.append("status", s));

  const qs = sp.toString();
  return qs ? `/kds/boards?${qs}` : "/kds/boards";
};

// compatible axios-like { data } or custom wrapper returns data directly
const unwrap = <T,>(res: any): T => (res?.data ?? res) as T;

export const kdsService = {
  boards: async (params?: KdsBoardsParams) => {
    const res = await http.get<KdsBoardsResponse>(buildBoardsUrl(params));
    return unwrap<KdsBoardsResponse>(res);
  },

  patchItemStatus: async (itemId: string, body: PatchKdsItemStatusRequest) => {
    const res = await http.patch<PatchKdsItemStatusResponse>(
      `/kds/items/${itemId}/status`,
      body
    );
    return unwrap<PatchKdsItemStatusResponse>(res);
  },

  /**
   * READY -> SERVED
   * Dựa theo endpoint Order (nếu BE có):
   * PATCH /api/v1/orders/{orderId}/items/{itemId}/served
   */
  markServed: async (orderId: string, itemId: string) => {
    const res = await http.patch<PatchKdsItemStatusResponse>(
      `/orders/${orderId}/items/${itemId}/served`,
      {}
    );
    return unwrap<PatchKdsItemStatusResponse>(res);
  },
};
