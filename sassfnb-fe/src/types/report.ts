// src/types/report.ts

export type Money = number; // backend trả số (450004.00)

export type ReportBaseQuery = {
  outletId?: string; // UUID
  fromDate: string;  // yyyy-MM-dd
  toDate: string;    // yyyy-MM-dd
};

export type SummaryResponse = {
  outletId?: string;
  fromDate: string;
  toDate: string;

  grossRevenue: Money;
  tipsTotal: Money;
  netRevenue?: Money;     // nếu BE có trả
  ordersCount: number;
};

export type TopItemsResponse = {
  outletId?: string;
  fromDate: string;
  toDate: string;
  limit: number;
  items: TopItemRow[];
};

export type TopItemRow = {
  menuItemId: string;
  itemName: string;
  categoryId?: string | null;
  categoryName?: string | null;
  qtySold: number;
  grossAmount: Money;
};

export type TopCategoriesResponse = {
  outletId?: string;
  fromDate: string;
  toDate: string;
  limit: number;
  categories: TopCategoryRow[]; // nếu BE đặt là categories
  // NOTE: nếu BE đang trả "items" thì bạn đổi ở component map lại
};

export type TopCategoryRow = {
  categoryId: string;
  categoryName: string;
  qtySold: number;
  grossAmount: Money;
};

export type PeakHoursResponse = {
  outletId?: string;
  fromDate: string;
  toDate: string;
  hours: PeakHourRow[];
};

export type PeakHourRow = {
  hourOfDay: number;       // 0..23
  ordersCount: number;
  grossRevenue: Money;
  tipsTotal: Money;
  netRevenue: Money;
};

export type TableTurnoverResponse = {
  outletId?: string;
  fromDate: string;
  toDate: string;
  tables: TableTurnoverRow[]; // nếu BE đặt là tables
};

export type TableTurnoverRow = {
  tableId: string;
  tableCode?: string | null;
  tableName?: string | null;
  groupCode?: string | null;

  ordersCount: number;
  grossRevenue: Money;
  netRevenue: Money;
  avgOccupancyMinutes: Money;
};

export type StaffPerformanceResponse = {
  outletId?: string;
  fromDate: string;
  toDate: string;
  staffs: StaffPerfRow[]; // nếu BE đặt là staffs
};

export type StaffPerfRow = {
  staffId: string;
  userId: string;
  staffCode?: string | null;
  position?: string | null;
  status?: string | null;

  ordersHandled: number;
  tipsTotal: Money;
  hoursWorked: Money;
};

export type PayrollSummaryResponse = {
  outletId?: string;
  fromDate: string;
  toDate: string;

  totalHours: Money;
  grossPay: Money;
  tipsAmount: Money;
  netPay: Money;
};
