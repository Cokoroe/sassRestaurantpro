export type UUID = string;

export type OrderStatus = "DRAFT" | "OPEN" | "SUBMITTED" | "PAID" | "CLOSED" | "VOIDED" | string;
export type OrderItemStatus = "NEW" | "FIRED" | "IN_PROGRESS" | "READY" | "SERVED" | "VOIDED" | string;

export type OrderItemResponse = {
  id: UUID;
  menuItemId: UUID;
  priceId?: UUID | null;
  quantity: number;
  unitPrice?: string | number | null;
  discountAmount?: string | number | null;
  totalAmount?: string | number | null;
  status: OrderItemStatus;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderResponse = {
  id: UUID;
  tenantId: UUID;
  outletId: UUID;
  tableId?: UUID | null;
  reservationId?: UUID | null;
  openedBy?: UUID | null;
  qrSessionId?: UUID | null;
  people?: number | null;
  openedAt?: string | null;
  closedAt?: string | null;
  status: OrderStatus;
  note?: string | null;
  grandTotal?: string | number | null;
  items: OrderItemResponse[];
  createdAt?: string;
  updatedAt?: string;
};

export type PageResponse<T> = {
  content: T[];
  number: number; // page index
  size: number;
  totalElements: number;
  totalPages: number;
};

export type OrderListParams = {
  outletId: UUID;
  status?: string;
  tableId?: UUID;
  q?: string;
  page?: number;
  size?: number;
};

export type SubmitOrderResponse = { id: UUID; status: string; updatedAt: string };
export type ReopenOrderRequest = { reason?: string };
export type ReopenOrderResponse = { id: UUID; status: string; updatedAt: string };

export type FireOrderRequest = { all?: boolean; itemIds?: UUID[] };
export type VoidItemRequest = { reason?: string };
export type VoidOrderRequest = { reason?: string };
export type PatchOrderNoteRequest = { note?: string | null };

export type OrderTotalsResponse = {
  orderId: UUID;
  subTotal: string | number;
  discountTotal: string | number;
  surchargeTotal: string | number;
  grandTotal: string | number;
  calculatedAt: string;
};

export type CloseOrderResponse = {
  id: UUID;
  status: string;
  closedAt?: string | null;
  updatedAt?: string | null;
};
