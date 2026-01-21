// src/features/tables/components/TableCard.tsx
import React from "react";
import { Users, MapPin, Edit3, Trash2 } from "lucide-react";
import type { Table } from "../../../types/table";
import StatusBadge from "./StatusBadge";

interface TableCardProps {
  table: Table;
  active: boolean;
  canManage: boolean;
  onSelect: (id: string) => void;
  onEdit: (table: Table) => void;
  onDelete: (id: string) => void;
}

const TableCard: React.FC<TableCardProps> = ({
  table,
  active,
  canManage,
  onSelect,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      onClick={() => onSelect(table.id)}
      className={`
        group relative p-5 bg-white rounded-[2rem] border transition-all cursor-pointer overflow-hidden
        ${
          active
            ? "border-blue-600 shadow-xl shadow-blue-500/10 ring-2 ring-blue-600/5"
            : "border-slate-100 hover:border-blue-200 hover:shadow-md"
        }
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <h3
            className={`text-xl font-black tracking-tight ${
              active ? "text-blue-700" : "text-slate-800"
            }`}
          >
            {table.name ?? "Không tên"}
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {table.code}
          </p>
        </div>

        {canManage ? (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(table);
              }}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              title="Sửa"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(table.id);
              }}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              title="Xóa"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4 text-slate-500 text-xs font-bold uppercase tracking-tight">
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-slate-300" /> {table.capacity ?? 0}
          </div>
          <div className="flex items-center gap-1.5 truncate max-w-[140px]">
            <MapPin size={14} className="text-slate-300" />{" "}
            {table.groupCode ?? "-"}
          </div>
        </div>

        <StatusBadge status={(table.status as any) ?? "INACTIVE"} />
      </div>

      <div
        className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full transition-all duration-500 ${
          active ? "bg-blue-600/5 scale-150" : "bg-transparent"
        }`}
      />
    </div>
  );
};

export default TableCard;
