import { http } from "../client";
import type { UUID } from "../../types/order";

export type ApplyDiscountRequest = {
  type: "PERCENT" | "AMOUNT";
  value: string | number;
  note?: string | null;
};

export type DiscountResponse = {
  id: UUID;
  orderId: UUID;
  type: string;
  value: string | number;
  note?: string | null;
  createdBy?: UUID | null;
  createdAt?: string | null;
};

export const discountService = {
  apply: (orderId: UUID, body: ApplyDiscountRequest) =>
    http.post<DiscountResponse>(`/orders/${orderId}/discount`, body),

  remove: (orderId: UUID) => http.del<void>(`/orders/${orderId}/discount`),
};
