// src/features/menu/components/MenuItemOptionsPanel.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowDown, Edit3, PlusCircle, Sliders, Trash2 } from "lucide-react";
import type {
  ItemDetailResponse,
  OptionCreateRequest,
  OptionUpdateRequest,
  OptionValueCreateRequest,
  OptionValueResponse,
  OptionValueUpdateRequest,
} from "../../../types/menu";
import { EmptyState, MenuThumb, StatChip, cx } from "./MenuSharedUI";
import OptionDialog from "./OptionDialog";
import { MenuService } from "../../../api/services/menu.service";

export default function MenuItemOptionsPanel(props: {
  loading: boolean;
  detail: ItemDetailResponse | null;
  selectedItemId: string | null;

  onCreateOption: (
    itemId: string,
    payload: OptionCreateRequest
  ) => Promise<void>;
  onUpdateOption: (
    optionId: string,
    payload: OptionUpdateRequest
  ) => Promise<void>;
  onDeleteOption: (optionId: string) => Promise<void>;

  onCreateValue: (
    optionId: string,
    payload: OptionValueCreateRequest
  ) => Promise<void>;
  onUpdateValue: (
    valueId: string,
    payload: OptionValueUpdateRequest
  ) => Promise<void>;
  onDeleteValue: (valueId: string) => Promise<void>;
}) {
  const item = props.detail?.item ?? null;
  const options = props.detail?.options ?? [];

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // values state (fetch theo option)
  const [values, setValues] = useState<OptionValueResponse[]>([]);
  const [loadingValues, setLoadingValues] = useState(false);
  const [valuesError, setValuesError] = useState<string | null>(null);

  const selectedOption = useMemo(() => {
    if (!selectedOptionId) return null;
    return options.find((o) => o.id === selectedOptionId) ?? null;
  }, [options, selectedOptionId]);

  // Auto select first option when options change / item change
  useEffect(() => {
    if (!props.selectedItemId) {
      setSelectedOptionId(null);
      setValues([]);
      setValuesError(null);
      return;
    }
    if (!options || options.length === 0) {
      setSelectedOptionId(null);
      setValues([]);
      setValuesError(null);
      return;
    }

    setSelectedOptionId((prev) => {
      // nếu prev còn tồn tại thì giữ
      const stillExist = prev && options.some((o) => o.id === prev);
      return stillExist ? prev : options[0].id;
    });
  }, [props.selectedItemId, options]);

  const extractErrMsg = (e: any) => {
    return (
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      "Thao tác thất bại"
    );
  };

  const refetchValues = async (optionId: string) => {
    try {
      setValuesError(null);
      setLoadingValues(true);
      const res = await MenuService.listValues(optionId);
      // http wrapper của bạn có thể trả AxiosResponse
      const data: any = (res as any)?.data ?? res;
      setValues(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setValues([]);
      setValuesError(extractErrMsg(e));
    } finally {
      setLoadingValues(false);
    }
  };

  // Fetch values whenever selecting option
  useEffect(() => {
    if (!selectedOptionId) {
      setValues([]);
      setValuesError(null);
      return;
    }
    refetchValues(selectedOptionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOptionId]);

  // dialogs
  const [optDialog, setOptDialog] = useState<{
    open: boolean;
    data: any | null;
  }>({
    open: false,
    data: null,
  });
  const [valDialog, setValDialog] = useState<{
    open: boolean;
    data: any | null;
  }>({
    open: false,
    data: null,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12">
      {/* LEFT: option groups */}
      <div className="col-span-1 lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-100">
        <div className="p-4 lg:p-6 border-b border-slate-100 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-blue-400" />
            <span className="text-xs font-black text-white uppercase tracking-tight">
              Cấu hình tùy chọn
            </span>
          </div>

          <button
            disabled={!props.selectedItemId}
            onClick={() => setOptDialog({ open: true, data: null })}
            className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-xl font-black text-[10px] hover:bg-white/20 transition-all uppercase tracking-widest disabled:opacity-50"
          >
            + Nhóm
          </button>
        </div>

        <div className="p-4 lg:p-6 space-y-3">
          {/* context item */}
          {item ? (
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MenuThumb src={item.imageUrl} name={item.name} size="sm" />
                <div>
                  <p className="font-black text-sm text-slate-800 uppercase truncate max-w-[160px]">
                    {item.name}
                  </p>
                  <div className="mt-1">
                    <StatChip status={item.status} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Chọn món để cấu hình
              </p>
            </div>
          )}

          <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
            {props.loading ? (
              <div className="text-sm text-slate-500">Đang tải cấu hình...</div>
            ) : !props.selectedItemId ? (
              <div className="h-[260px] flex flex-col items-center justify-center text-center opacity-30">
                <ArrowDown size={42} className="animate-bounce mb-3" />
                <p className="text-xs font-black uppercase tracking-widest">
                  Chọn món ở phía trên
                </p>
              </div>
            ) : (options?.length ?? 0) === 0 ? (
              <EmptyState
                title="Chưa có tùy chọn"
                desc="Tạo nhóm tùy chọn (ví dụ: Size, Đá, Topping...)"
              />
            ) : (
              (options ?? []).map((group: any) => {
                const active = selectedOptionId === group.id;

                return (
                  <div
                    key={group.id}
                    onClick={() => setSelectedOptionId(group.id)}
                    className={cx(
                      "p-4 rounded-[1.5rem] border cursor-pointer transition-all group/opt relative",
                      active
                        ? "bg-blue-50 border-blue-600 shadow-md"
                        : "bg-white border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p
                          className={cx(
                            "font-black text-sm uppercase tracking-tight",
                            active ? "text-blue-700" : "text-slate-800"
                          )}
                        >
                          {group.name}
                        </p>

                        <div className="flex gap-2 flex-wrap">
                          <span
                            className={cx(
                              "text-[9px] px-2 py-0.5 rounded-full font-black uppercase",
                              group.required
                                ? "bg-amber-100 text-amber-600"
                                : "bg-slate-100 text-slate-400"
                            )}
                          >
                            {group.required ? "Bắt buộc" : "Tự chọn"}
                          </span>

                          {/* ⛳ count values realtime: dùng state values nếu đang active */}
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 font-black uppercase">
                            {active ? values.length : "—"} giá trị
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover/opt:opacity-100 transition-all">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOptDialog({ open: true, data: group });
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Sửa nhóm"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm("Xóa nhóm tùy chọn này?")) return;
                            await props.onDeleteOption(group.id);
                            if (selectedOptionId === group.id) {
                              setSelectedOptionId(null);
                              setValues([]);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                          title="Xóa nhóm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {active && (
                      <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-10 bg-blue-600 rounded-full" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: option values */}
      <div className="col-span-1 lg:col-span-8">
        <div className="p-4 lg:p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle size={18} className="text-emerald-500" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">
              Nhóm: {selectedOption?.name || "..."}
            </span>
          </div>

          <button
            disabled={!selectedOptionId}
            onClick={() => setValDialog({ open: true, data: null })}
            className="px-4 py-2 lg:px-6 lg:py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] hover:bg-emerald-700 transition-all uppercase tracking-widest shadow-lg shadow-emerald-500/10 disabled:opacity-50"
          >
            + Giá trị
          </button>
        </div>

        <div className="p-4 lg:p-8 bg-slate-50/5 min-h-[420px]">
          {!selectedOptionId ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-10">
              <ArrowDown size={50} className="animate-bounce mb-4" />
              <p className="font-black text-slate-900 uppercase tracking-widest text-xs">
                Chọn nhóm bên trái
              </p>
            </div>
          ) : loadingValues ? (
            <div className="py-10 text-center text-slate-500 font-bold">
              Đang tải giá trị...
            </div>
          ) : valuesError ? (
            <div className="py-10 text-center text-rose-600 font-bold">
              {valuesError}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
              {values.map((val: any) => (
                <div
                  key={val.id}
                  className="p-4 lg:p-5 bg-white border border-slate-100 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all group/val flex items-center justify-between"
                >
                  <div>
                    <p className="font-black text-slate-800 text-sm">
                      {val.name}
                    </p>
                    <p className="text-[10px] font-black text-emerald-600 mt-0.5 uppercase tracking-widest">
                      Phụ phí: +{Number(val.extraPrice ?? 0).toLocaleString()}đ
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover/val:opacity-100 transition-all">
                    <button
                      onClick={() => setValDialog({ open: true, data: val })}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Sửa"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Xóa giá trị này?")) return;
                        await props.onDeleteValue(val.id);
                        // ✅ refresh list
                        await refetchValues(selectedOptionId);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {values.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Nhóm này đang trống.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialog: option group */}
      <OptionDialog
        open={optDialog.open}
        type="group"
        data={optDialog.data}
        onClose={() => setOptDialog({ open: false, data: null })}
        onSave={async (data) => {
          if (!props.selectedItemId) return;

          if (data?.id) {
            await props.onUpdateOption(data.id, data);
          } else {
            await props.onCreateOption(props.selectedItemId, data);
          }

          // Không refetch options ở đây vì bạn đang để “logic chung” trong hook useMenu.
          // Nếu hook đã refetch detail sau mutate thì UI tự cập nhật.
        }}
      />

      {/* Dialog: option value */}
      <OptionDialog
        open={valDialog.open}
        type="value"
        data={valDialog.data}
        onClose={() => setValDialog({ open: false, data: null })}
        onSave={async (data) => {
          if (!selectedOptionId) return;

          if (data?.id) {
            await props.onUpdateValue(data.id, data);
          } else {
            await props.onCreateValue(selectedOptionId, data);
          }

          // ✅ refresh values after success
          await refetchValues(selectedOptionId);
        }}
      />
    </div>
  );
}
