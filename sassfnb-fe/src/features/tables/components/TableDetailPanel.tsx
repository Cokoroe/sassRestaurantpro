// src/features/tables/components/TableDetailPanel.tsx
import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Copy,
  RotateCcw,
  Ban,
  Download,
  MapPin,
  Users,
  Hash,
  Clock,
  Info,
} from "lucide-react";
import type { Table } from "../../../types/table";
import type { DynamicQrDto, StaticQrDto } from "../../../types/table";
import StatusBadge from "./StatusBadge";

interface TableDetailPanelProps {
  table: Table | null;

  // data từ BE (hook đã fetch sẵn)
  dynamicQr: DynamicQrDto | null;
  staticQr: StaticQrDto | null;

  canManage: boolean;

  // ✅ cho phép return DTO (đúng với vm của bạn)
  onRotate: (ttlMinutes?: number) => Promise<DynamicQrDto> | DynamicQrDto;
  onDisableDynamic: () => Promise<void> | void;

  // QR tĩnh (return DTO)
  onGenerateStatic: (
    size?: number,
    force?: boolean
  ) => Promise<StaticQrDto> | StaticQrDto;

  onRefreshStatic: (size?: number) => Promise<StaticQrDto> | StaticQrDto;
}

const TableDetailPanel: React.FC<TableDetailPanelProps> = ({
  table,
  dynamicQr,
  staticQr,
  canManage,
  onRotate,
  onDisableDynamic,
  onGenerateStatic,
  onRefreshStatic,
}) => {
  const [ttl, setTtl] = useState<number>(60);
  const [dynamicQrDataUrl, setDynamicQrDataUrl] = useState<string | null>(null);

  // ✅ QR text để encode: ưu tiên qrUrl (bây giờ BE trả về FE link), fallback token
  const qrText = useMemo(() => {
    if (dynamicQr?.qrUrl) return dynamicQr.qrUrl;
    if (dynamicQr?.token) return dynamicQr.token;
    return "";
  }, [dynamicQr?.qrUrl, dynamicQr?.token]);

  useEffect(() => {
    let cancelled = false;

    async function gen() {
      if (!qrText) {
        setDynamicQrDataUrl(null);
        return;
      }
      try {
        const dataUrl = await QRCode.toDataURL(qrText, {
          width: 300,
          margin: 1,
          errorCorrectionLevel: "M",
        });
        if (!cancelled) setDynamicQrDataUrl(dataUrl);
      } catch {
        if (!cancelled) setDynamicQrDataUrl(null);
      }
    }

    gen();
    return () => {
      cancelled = true;
    };
  }, [qrText]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Đã copy vào bộ nhớ tạm!");
    } catch {
      alert("Không thể copy. Hãy thử lại.");
    }
  };

  if (!table) {
    return (
      <div className="bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 p-12 text-center text-slate-400 min-h-[400px] flex flex-col items-center justify-center">
        <MapPin size={64} className="mb-4 opacity-10" />
        <p className="text-sm font-black uppercase tracking-widest leading-relaxed">
          Chọn một bàn từ danh sách
          <br />
          để xem cấu hình chi tiết
        </p>
      </div>
    );
  }

  const hasDynamic = Boolean(dynamicQr?.token || dynamicQr?.qrUrl);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-10">
      {/* SECTION 1: CƠ BẢN */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Info size={20} className="text-blue-600" /> Thông tin bàn
          </h2>
          <StatusBadge status={(table.status as any) ?? "INACTIVE"} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
              Mã nội bộ
            </p>
            <p className="font-black text-slate-800">{table.code}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
              Sức chứa
            </p>
            <p className="font-black text-slate-800 flex items-center gap-1.5">
              <Users size={14} /> {table.capacity ?? 0} khách
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl col-span-2">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
              Khu vực / Phân nhóm
            </p>
            <p className="font-black text-slate-800 flex items-center gap-1.5">
              <MapPin size={14} /> {table.groupCode ?? "-"}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: QR ĐỘNG */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-blue-100 shadow-xl shadow-blue-500/5 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16" />

        <div className="flex items-center justify-between relative">
          <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <QrCode size={20} className="text-blue-600" /> QR Gọi món (Động)
          </h3>
          {hasDynamic ? (
            <span className="text-[10px] bg-blue-100 text-blue-700 font-black px-2 py-0.5 rounded uppercase">
              Active
            </span>
          ) : null}
        </div>

        <div className="bg-slate-50 rounded-[2rem] p-6 flex flex-col items-center gap-5 border border-slate-100 shadow-inner">
          {hasDynamic && dynamicQrDataUrl ? (
            <>
              <div className="w-52 h-52 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-200 relative group overflow-hidden">
                <img
                  src={dynamicQrDataUrl}
                  className="w-full h-full object-contain"
                  alt="Dynamic QR"
                />
                <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a
                    href={dynamicQrDataUrl}
                    download={`table-${table.code}-dynamic-qr.png`}
                    className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:scale-105 transition-transform"
                    title="Tải ảnh QR"
                  >
                    <Download size={24} />
                  </a>
                </div>
              </div>

              <div className="w-full space-y-2">
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase">
                    Token
                  </span>
                  <code className="text-xs font-black text-blue-600 truncate">
                    {dynamicQr?.token ?? "-"}
                  </code>
                  <button
                    onClick={() => copyToClipboard(dynamicQr?.token ?? "")}
                    className="p-1 text-slate-300 hover:text-blue-600"
                    title="Copy token"
                  >
                    <Copy size={14} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase">
                    Link (FE)
                  </span>
                  <code className="text-[11px] font-black text-slate-700 truncate">
                    {dynamicQr?.qrUrl ?? "-"}
                  </code>
                  <button
                    onClick={() => copyToClipboard(dynamicQr?.qrUrl ?? "")}
                    className="p-1 text-slate-300 hover:text-blue-600"
                    title="Copy link"
                  >
                    <Copy size={14} />
                  </button>
                </div>

                {dynamicQr?.expiresAt ? (
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase px-1">
                    <Clock size={12} className="text-blue-500" />
                    <span>
                      Hết hạn:{" "}
                      {new Date(dynamicQr.expiresAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="py-10 text-center space-y-3">
              <QrCode size={48} className="mx-auto text-slate-200" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                QR động chưa được kích hoạt
                <br />
                cho bàn này
              </p>
            </div>
          )}
        </div>

        {canManage ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Thời gian TTL (Phút)
                </label>
                <input
                  type="number"
                  value={ttl}
                  min={1}
                  onChange={(e) => setTtl(Number(e.target.value))}
                  className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-black outline-none focus:border-blue-300"
                />
              </div>

              <button
                onClick={() => onRotate(ttl)}
                className="h-11 px-5 bg-blue-600 text-white rounded-xl font-black text-[10px] flex items-center gap-2 hover:bg-blue-700 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20 self-end"
              >
                <RotateCcw size={16} /> Xoay mã
              </button>
            </div>

            <button
              onClick={() => onDisableDynamic()}
              className="w-full h-11 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 hover:bg-rose-100 transition-all uppercase tracking-widest"
            >
              <Ban size={16} /> Vô hiệu hóa QR động
            </button>
          </div>
        ) : null}
      </div>

      {/* SECTION 3: QR TĨNH */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />

        <div className="flex items-center justify-between">
          <h3 className="font-black uppercase tracking-tight text-sm flex items-center gap-2">
            <QrCode size={18} className="text-blue-400" /> QR In ấn (Tĩnh)
          </h3>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Permanent
          </span>
        </div>

        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 shadow-inner">
          <div className="w-24 h-24 bg-white rounded-2xl p-2 shrink-0 shadow-xl flex items-center justify-center">
            {staticQr?.imageUrl ? (
              <img
                src={staticQr.imageUrl}
                className="w-full h-full object-contain"
                alt="Static QR"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                <Hash size={24} />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Kích thước in
              </p>

              <select
                defaultValue="512"
                className="w-full h-9 bg-white/10 rounded-xl border-0 text-[10px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer"
                onChange={(e) => onRefreshStatic(Number(e.target.value))}
              >
                <option value="300" className="bg-slate-900">
                  Standard (300px)
                </option>
                <option value="512" className="bg-slate-900">
                  High Res (512px)
                </option>
                <option value="1024" className="bg-slate-900">
                  Print Card (1024px)
                </option>
              </select>
            </div>

            {/* ✅ Chỉ refresh ảnh, KHÔNG forceNewCode=true nữa */}
            <button
              onClick={() => onRefreshStatic(512)}
              className="w-full h-9 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all shadow-lg"
            >
              Làm mới ảnh
            </button>
          </div>
        </div>

        {/* Nếu muốn có nút “Tạo code mới” thì để riêng, còn mặc định không dùng */}
        {/* <button onClick={() => onGenerateStatic(512, true)} ...>Tạo code mới</button> */}
      </div>
    </div>
  );
};

export default TableDetailPanel;
