// src/layout/components/navConfig.tsx
import React from "react";
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  Table2,
  ClipboardList,
  Users,
  CalendarClock,
  Clock4,
  BadgeCheck,
  Flame,
  ReceiptText,
  Wallet,
  BarChart3,
} from "lucide-react";

export type NavItem = {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
  feature?: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Bảng điều khiển",
    path: "/app/dashboard",
    icon: <LayoutDashboard size={20} />,
    permission: "dashboard.view",
  },
  {
    key: "restaurant",
    label: "Nhà hàng & Chi nhánh",
    path: "/app/restaurant",
    icon: <Store size={20} />,
    permission: "restaurant.view",
  },
  {
    key: "menu",
    label: "Thực đơn",
    path: "/app/menu",
    icon: <UtensilsCrossed size={20} />,
    permission: "menu.view",
  },
  {
    key: "tables",
    label: "Bàn",
    path: "/app/tables",
    icon: <Table2 size={20} />,
    permission: "table.view",
  },

  {
    key: "staff",
    label: "Nhân sự",
    path: "/app/staff",
    icon: <Users size={20} />,
    permission: "staff.view",
  },
  {
    key: "shifts",
    label: "Ca làm",
    path: "/app/shifts",
    icon: <CalendarClock size={20} />,
    permission: "shift.view",
  },

  // ✅ NEW: Staff check-in/out + history + request adjust
  {
    key: "checkin",
    label: "Điểm danh",
    path: "/app/checkin",
    icon: <BadgeCheck size={20} />, // dùng chung permission attendance (đỡ phải thêm quyền mới)
  },

  // Manager view + approve adjustments
  {
    key: "attendance",
    label: "Chấm công",
    path: "/app/attendance",
    icon: <Clock4 size={20} />,
    permission: "attendance.view",
  },

  {
    key: "kds",
    label: "KDS (Bếp/Bar)",
    path: "/app/kds",
    icon: <Flame size={20} />,
    // permission: bạn có thể dùng chung order.view hoặc kds.view (tuỳ bạn có tạo permission hay chưa)
    permission: "order.view",
  },

  {
    key: "orders",
    label: "Đơn hàng",
    path: "/app/orders",
    icon: <ClipboardList size={20} />,
    permission: "order.view",
  },
  {
    key: "billing_groups",
    label: "Hóa đơn nhóm",
    path: "/app/billing/groups",
    icon: <ReceiptText size={20} />,
    permission: "order.view",
  },
  {
    key: "payroll",
    label: "Trả lương",
    path: "/app/payroll/periods",
    icon: <Wallet size={20} />,
    permission: "attendance.view",
  },

  // ✅ NEW: Pay rate (mức lương)
  {
    key: "pay_rates",
    label: "Mức lương",
    path: "/app/payroll/rates",
    icon: <Wallet size={20} />,
    permission: "attendance.view", // hoặc payroll.view nếu sau này bạn tách quyền
  },

  {
    key: "my_payroll",
    label: "Lương của tôi",
    path: "/app/my-payroll",
    icon: <Wallet size={20} />,
  },
  {
    key: "reports",
    label: "Báo cáo",
    path: "/app/reports",
    icon: <BarChart3 size={20} />,
    permission: "dashboard.view", // tạm dùng chung, sau này tách report.view
  },
];
