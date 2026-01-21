// src/types/billing.ts
export type UUID = string;

export type BillingScope = "ORDER" | "GROUP";

export type BillingTotalsResponse = {
  subTotal: string | number;
  discountTotal: string | number;
  serviceCharge: string | number;
  tax: string | number;
  grandTotal: string | number;
  paidTotal: string | number;
  dueTotal: string | number;
};

export type BillingGroupStatus = "OPEN" | "PAID" | "CLOSED" | "VOIDED" | string;

// ===== Prepare Group (UX helper)
export type BillingGroupPrepareItem = {
  tableId: UUID;
  tableCode?: string | null;
  tableName?: string | null;

  activeOrderId?: UUID | null;
  activeOrderStatus?: string | null;
  openedAt?: string | null; // OffsetDateTime ISO
};

export type BillingGroupPrepareResponse = {
  outletId: UUID;
  tables: BillingGroupPrepareItem[];
};

// ===== Create/Update Group
export type CreateGroupRequest = {
  outletId?: UUID;

  name?: string | null;
  note?: string | null;

  /**
   * Backward compatible:
   * - Nếu truyền orderIds => BE dùng thẳng
   * - Nếu không truyền orderIds mà truyền tableIds => BE tự resolve latest active order theo table
   */
  orderIds?: UUID[];
  tableIds?: UUID[];
};

export type UpdateGroupRequest = {
  name?: string | null;
  note?: string | null;
  addOrderIds?: UUID[];
  removeOrderIds?: UUID[];
};

export type BillingGroupSummary = {
  id: UUID;
  name?: string | null;
  note?: string | null;
  status: BillingGroupStatus;
  createdAt?: string | null;
};

export type BillingOrderInfo = {
  id: UUID;
  tableId?: UUID | null;
  status: string;
  openedAt?: string | null;
};

export type BillingOrderItemInfo = {
  id: UUID;
  orderId: UUID;
  menuItemId: UUID;
  quantity: number;
  unitPrice: string | number;
  discountAmount: string | number;
  totalAmount: string | number;
  status: string;
};

export type BillingGroupDetailResponse = {
  id: UUID;
  outletId: UUID;
  name?: string | null;
  note?: string | null;
  status: BillingGroupStatus;
  createdAt?: string | null;
  orders: BillingOrderInfo[];
  items: BillingOrderItemInfo[];
  totals: BillingTotalsResponse;
};

// ===== Payments
export type ManualPaymentRequest = {
  method: "CASH" | "TRANSFER";
  amount: string | number;
  note?: string | null;
  receivedAt?: string | null; // ISO string
};

export type ManualPaymentResponse = {
  paymentId: UUID;
  paidTotal: string | number;
  dueTotal: string | number;
};

/**
 * ✅ Response đúng theo BE /payments/sepay/qr/order/{orderId}?outletId=...
 */
export type SepayQrResponse = {
  ok: boolean;
  paymentCode: string;
  amount: string | number;
  bank: string;
  acc: string;
  qrImageUrl: string;
};

export type CloseResponse = {
  id: UUID;
  status: string;
  closedAt?: string | null;
};
