import type { OrderStatus } from "../../../api/services/order.service";

export const orderStatusLabel = (s?: OrderStatus | string | null) => {
  const v = (s ?? "").toUpperCase();
  switch (v) {
    case "DRAFT":
      return "Nháp";
    case "OPEN":
      return "Đang mở";
    case "SUBMITTED":
      return "Đã gửi bếp";
    case "IN_PROGRESS":
      return "Đang làm";
    case "READY":
      return "Sẵn sàng";
    case "SERVED":
      return "Đã phục vụ";
    case "PAID":
      return "Đã thanh toán";
    case "CLOSED":
      return "Đã đóng";
    case "CANCELLED":
      return "Đã huỷ";
    default:
      return v || "-";
  }
};

export const canPayOrder = (s?: OrderStatus | string | null) => {
  const v = (s ?? "").toUpperCase();
  // cho thanh toán khi order đang hoạt động, tránh PAID/CLOSED/CANCELLED
  return !["PAID", "CLOSED", "CANCELLED"].includes(v);
};
