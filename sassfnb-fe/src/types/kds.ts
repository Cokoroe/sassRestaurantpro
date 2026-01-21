// src/types/kds.ts

export type KdsItemStatus =
  | "NEW"
  | "FIRED"
  | "IN_PROGRESS"
  | "READY"
  | "SERVED"
  | "VOIDED";

export type KdsBoardItem = {
  itemId: string;
  itemStatus: KdsItemStatus;

  quantity: number;
  note?: string | null;

  menuItemId: string;
  priceId?: string | null;

  unitPrice: number;     // BE BigDecimal -> FE number (đang dùng vậy)
  totalAmount: number;   // BE BigDecimal -> FE number
  itemCreatedAt: string; // Instant ISO

  orderId: string;
  orderStatus?: string | null;
  tableId?: string | null;
  people?: number | null;
  orderNote?: string | null;
  openedAt?: string | null;
};

export type KdsBoardsResponse = {
  outletId: string;
  since?: string | null;
  statuses?: string[] | null;
  items: KdsBoardItem[];
};

export type KdsBoardsParams = {
  since?: string;     // ISO string
  status?: string[];  // repeat params: status=FIRED&status=IN_PROGRESS
};

export type PatchKdsItemStatusRequest = {
  status: "IN_PROGRESS" | "READY";
};

export type PatchKdsItemStatusResponse = {
  itemId: string;
  oldStatus: string;
  newStatus: string;
  updatedAt: string;
};
