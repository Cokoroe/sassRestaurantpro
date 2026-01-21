// src/features/restaurant/components/OpenHoursPicker.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DAYS,
  type DayHours,
  defaultHours,
  parseOpenHoursToModel,
  buildOpenHoursJsonFromModel,
  formatOpenHoursCompactLines,
} from "../utils/openHours";

function clampTime(t: string, fallback = "08:00") {
  if (!t) return fallback;
  return /^\d{2}:\d{2}$/.test(t) ? t : fallback;
}

export default function OpenHoursPicker({
  valueJson,
  onChangeJson,
  disabled,
}: {
  valueJson?: string | null;
  onChangeJson: (json: string) => void;
  disabled?: boolean;
}) {
  const [model, setModel] = useState<DayHours[]>(
    defaultHours("08:00", "18:00")
  );

  const lastEmittedJsonRef = useRef<string | null>(null);
  const didInitRef = useRef(false);

  useEffect(() => {
    const incoming = valueJson ?? null;

    if (!didInitRef.current) {
      didInitRef.current = true;
      setModel(parseOpenHoursToModel(incoming));
      return;
    }

    if (incoming && incoming === lastEmittedJsonRef.current) return;

    setModel(parseOpenHoursToModel(incoming));
  }, [valueJson]);

  useEffect(() => {
    const json = buildOpenHoursJsonFromModel(model);

    if ((valueJson ?? null) === json) {
      lastEmittedJsonRef.current = json;
      return;
    }

    lastEmittedJsonRef.current = json;
    onChangeJson(json);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  const preview = useMemo(() => {
    const json = buildOpenHoursJsonFromModel(model);
    return formatOpenHoursCompactLines(json);
  }, [model]);

  const setAllEnabled = (enabled: boolean) => {
    setModel((prev) => prev.map((d) => ({ ...d, enabled })));
  };

  const setAllRange = (open: string, close: string) => {
    setModel((prev) =>
      prev.map((d) =>
        d.enabled
          ? {
              ...d,
              open: clampTime(open, d.open),
              close: clampTime(close, d.close),
            }
          : d
      )
    );
  };

  const copyToOtherEnabledDays = (idx: number) => {
    setModel((prev) => {
      const src = prev[idx];
      if (!src) return prev;
      return prev.map((d, j) =>
        j !== idx && d.enabled ? { ...d, open: src.open, close: src.close } : d
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
          Tóm tắt
        </div>
        <div className="flex flex-wrap gap-2">
          {preview.lines.map((line, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700"
              title={preview.full}
            >
              {line}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setAllEnabled(true)}
          className="h-10 px-4 rounded-2xl bg-white border border-slate-200 font-black text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Mở tất cả ngày
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setAllEnabled(false)}
          className="h-10 px-4 rounded-2xl bg-white border border-slate-200 font-black text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Nghỉ tất cả ngày
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setAllRange("08:00", "18:00")}
          className="h-10 px-4 rounded-2xl bg-white border border-slate-200 font-black text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Đặt 08:00-18:00
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-4 py-3 text-xs font-black text-slate-600">
          <div className="col-span-4">Ngày</div>
          <div className="col-span-3">Trạng thái</div>
          <div className="col-span-2">Mở</div>
          <div className="col-span-2">Đóng</div>
          <div className="col-span-1 text-right">Copy</div>
        </div>

        <div className="divide-y divide-slate-200">
          {model.map((row, idx) => {
            const label = DAYS.find((d) => d.key === row.day)?.label ?? row.day;

            return (
              <div
                key={row.day}
                className="grid grid-cols-12 items-center px-4 py-3"
              >
                <div className="col-span-4">
                  <div className="font-black text-slate-900">{label}</div>
                </div>

                <div className="col-span-3">
                  <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      disabled={disabled}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        setModel((prev) =>
                          prev.map((d) =>
                            d.day === row.day ? { ...d, enabled } : d
                          )
                        );
                      }}
                      className="h-5 w-5 rounded border-slate-300"
                    />
                    <span
                      className={`text-sm font-black ${
                        row.enabled ? "text-emerald-700" : "text-slate-500"
                      }`}
                    >
                      {row.enabled ? "Mở" : "Nghỉ"}
                    </span>
                  </label>
                </div>

                <div className="col-span-2">
                  <input
                    type="time"
                    value={row.open}
                    disabled={disabled || !row.enabled}
                    onChange={(e) => {
                      const open = clampTime(e.target.value, row.open);
                      setModel((prev) =>
                        prev.map((d) =>
                          d.day === row.day ? { ...d, open } : d
                        )
                      );
                    }}
                    className="w-full h-11 rounded-2xl border border-slate-200 px-3 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 disabled:bg-slate-100"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="time"
                    value={row.close}
                    disabled={disabled || !row.enabled}
                    onChange={(e) => {
                      const close = clampTime(e.target.value, row.close);
                      setModel((prev) =>
                        prev.map((d) =>
                          d.day === row.day ? { ...d, close } : d
                        )
                      );
                    }}
                    className="w-full h-11 rounded-2xl border border-slate-200 px-3 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 disabled:bg-slate-100"
                  />
                </div>

                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => copyToOtherEnabledDays(idx)}
                    className="h-9 px-3 rounded-xl bg-white border border-slate-200 font-black text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    title="Copy giờ này sang các ngày đang mở"
                  >
                    Copy
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <details className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-black text-slate-700">
          Xem JSON (tự sinh)
        </summary>
        <pre className="mt-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl p-3 overflow-auto">
          {buildOpenHoursJsonFromModel(model)}
        </pre>
      </details>
    </div>
  );
}
