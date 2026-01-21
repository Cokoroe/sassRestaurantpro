// src/features/tables/components/StatusBadge.tsx
import React from "react";
import type { TableStatus } from "../../../types/table";

interface StatusBadgeProps {
  status: TableStatus | string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config: Record<
    string,
    { label: string; classes: string; dot: string }
  > = {
    AVAILABLE: {
      label: "Sẵn sàng",
      classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    },
    OCCUPIED: {
      label: "Đang dùng",
      classes: "bg-amber-100 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    },
    RESERVED: {
      label: "Đã đặt",
      classes: "bg-blue-100 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
    },
    INACTIVE: {
      label: "Bảo trì",
      classes: "bg-rose-100 text-rose-700 border-rose-200",
      dot: "bg-rose-500",
    },
    OUT_OF_SERVICE: {
      label: "Bảo trì",
      classes: "bg-rose-100 text-rose-700 border-rose-200",
      dot: "bg-rose-500",
    },
  };

  const item = config[String(status)] ?? config.INACTIVE;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${item.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot} animate-pulse`} />
      {item.label}
    </span>
  );
};

export default StatusBadge;
