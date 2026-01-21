// src/api/services/order.service.ts
import { http } from "../client";
import type { PageResponse } from "../../types/page";

export type OrderStatus =
  | "DRAFT"
  | "OPEN"
  | "SUBMITTED"
  | "IN_PROGRESS"
  | "READY"
  | "SERVED"
  | "PAID"
  | "CLOSED"
  | "CANCELLED"
  | "VOIDED";

export type OrderSummary = {
  id: string;
  code?: string | null;

  status: OrderStatus | string;

  createdAt?: string | null;
  updatedAt?: string | null;

  // BE chắc chắn có tableId (nếu order thuộc bàn)
  tableId?: string | null;

  // grandTotal có trong OrderResponse
  grandTotal?: string | number | null;

  // ⚠️ hiện tại list API của bạn không trả paidTotal/dueTotal
  // nếu sau này BE có thì giữ lại
  paidTotal?: string | number | null;
  dueTotal?: string | number | null;
};

export type OrderItemLine = {
  id: string;
  menuItemId: string;
  name?: string | null;

  quantity: number;
  unitPrice?: string | number | null;
  totalAmount?: string | number | null;

  status?: string | null;
};

export type OrderDetail = {
  id: string;
  status: OrderStatus | string;

  tableId?: string | null;

  // BE trả items
  items?: OrderItemLine[];

  // BE trả grandTotal (mình thêm để detail dùng luôn, không cần tự tính)
  grandTotal?: string | number | null;

  createdAt?: string | null;
  updatedAt?: string | null;
};

export type OrderListParams = {
  outletId?: string;
  q?: string;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export const orderService = {
  list: (params: OrderListParams) =>
    http.get<PageResponse<OrderSummary>>("/orders", { params }),

  get: (orderId: string) => http.get<OrderDetail>(`/orders/${orderId}`),
};
