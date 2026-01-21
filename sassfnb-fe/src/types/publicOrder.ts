// src/types/publicOrder.ts

export type PublicCreateOrderRequest = {
  outletId: string;
  tableId: string;
  qrSessionId: string;
  note?: string | null;
  people?: number | null;
};

// 1 option -> 1 value
export type PublicSelectedOptionRequest = {
  optionId: string;
  valueId: string;
};

export type PublicAddItemRequest = {
  menuItemId: string;
  priceId?: string | null;
  quantity: number;
  note?: string | null;
  selectedOptions?: PublicSelectedOptionRequest[];
};

export type PublicPatchItemRequest = {
  quantity?: number | null;
  note?: string | null;
};

export type PublicSelectedOptionResponse = {
  optionId: string;
  valueId: string;
  optionName: string;
  valueName: string;
  extraPrice: string; // BigDecimal -> string
};

export type PublicOrderItem = {
  id: string;
  menuItemId: string;
  priceId: string | null;

  quantity: number;

  unitPrice: string | null;
  discountAmount: string | null;
  totalAmount: string | null;

  status: string; // NEW/FIRED/...
  note: string | null;

  createdAt: string;
  updatedAt: string | null;

  selectedOptions: PublicSelectedOptionResponse[];
};

export type PublicOrder = {
  id: string;
  tenantId: string;
  outletId: string;
  tableId: string;
  qrSessionId: string;

  status: string; // DRAFT/OPEN/...

  note: string | null;
  people: number | null;

  openedAt: string | null;
  createdAt: string;
  updatedAt: string | null;

  grandTotal: string; // BigDecimal -> string
  items: PublicOrderItem[];
};

export type PublicOrderSubmitResponse = {
  id: string;
  status: string;
};
