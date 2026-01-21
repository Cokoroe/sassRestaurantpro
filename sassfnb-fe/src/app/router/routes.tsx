// src/app/router/routes.tsx
import { createBrowserRouter } from "react-router-dom";
import AuthGuard from "./guards/AuthGuard";

import Homepage from "../../features/landing/pages/Homepage";
import AuthPage from "../../features/auth/pages/AuthPage";
import AppLayout from "../../layout/AppLayout";

import DashboardPage from "../../features/dashboard/pages/DashboardPage";
import RestaurantOutletPage from "../../features/restaurant/pages/RestaurantOutletPage";
import MenuPage from "../../features/menu/pages/MenuPage";
import TablesPage from "../../features/tables/pages/TablesPage";

import StaffPage from "../../features/staff/pages/StaffPage";
import ShiftsPage from "../../features/shifts/pages/ShiftsPage";
import AttendancePage from "../../features/attendance/pages/AttendancePage";
import MyCheckinPage from "../../features/attendance/pages/MyCheckinPage";

// PUBLIC (khách quét QR)
import PublicQrEntryPage from "../../features/publicOrder/pages/PublicQrEntryPage";
import PublicStaticQrEntryPage from "../../features/publicOrder/pages/PublicStaticQrEntryPage";
import PublicOrderPage from "../../features/publicOrder/pages/PublicOrderPage";

import KdsPage from "../../features/kds/pages/KdsPage";

import { BillingGroupCreatePage } from "../../features/billing/pages/BillingGroupCreatePage";
import { BillingGroupsPage } from "../../features/billing/pages/BillingGroupsPage";
import { BillingGroupDetailPage } from "../../features/billing/pages/BillingGroupDetailPage";

import OrdersPage from "../../features/orders/pages/OrdersPage";
import OrderDetailPage from "../../features/orders/pages/OrderDetailPage";

import PayrollRatesPage from "../../features/payroll/pages/PayrollRatesPage";
import PayrollPeriodsPage from "../../features/payroll/pages/PayrollPeriodsPage";
import PayrollPeriodDetailPage from "../../features/payroll/pages/PayrollPeriodDetailPage";

import MyPayrollPage from "../../features/payroll/pages/MyPayrollPage";

import ReportsPage from "../../features/reports/pages/ReportsPage";

function NotFound() {
  return <div className="p-6">404 Not Found</div>;
}

export const router = createBrowserRouter([
  { path: "/", element: <Homepage /> },
  { path: "/auth", element: <AuthPage /> },
  { path: "/auth/login", element: <AuthPage /> },

  // ✅ PUBLIC ROUTES
  { path: "/qr", element: <PublicQrEntryPage /> }, // /qr?token=...
  { path: "/qr/t/:code", element: <PublicStaticQrEntryPage /> }, // QR tĩnh
  { path: "/order/:orderId", element: <PublicOrderPage /> },

  // ✅ APP (đăng nhập)
  {
    element: <AuthGuard />,
    children: [
      {
        path: "/app",
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "restaurant", element: <RestaurantOutletPage /> },
          { path: "menu", element: <MenuPage /> },
          { path: "tables", element: <TablesPage /> },

          { path: "staff", element: <StaffPage /> },
          { path: "shifts", element: <ShiftsPage /> },

          // staff self check-in/out
          { path: "checkin", element: <MyCheckinPage /> },

          // manager attendance report
          { path: "attendance", element: <AttendancePage /> },

          { path: "kds", element: <KdsPage /> },

          // Billing groups
          { path: "billing/groups", element: <BillingGroupsPage /> },
          { path: "billing/groups/new", element: <BillingGroupCreatePage /> },
          {
            path: "billing/groups/:groupId",
            element: <BillingGroupDetailPage />,
          },

          // Orders
          { path: "orders", element: <OrdersPage /> },
          { path: "orders/:orderId", element: <OrderDetailPage /> },

          // Payroll
          { path: "payroll/rates", element: <PayrollRatesPage /> },
          { path: "payroll/periods", element: <PayrollPeriodsPage /> },
          {
            path: "payroll/periods/:periodId",
            element: <PayrollPeriodDetailPage />,
          },
          { path: "my-payroll", element: <MyPayrollPage /> },

          { path: "reports", element: <ReportsPage /> },
        ],
      },
    ],
  },

  { path: "*", element: <NotFound /> },
]);
