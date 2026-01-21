// src/layout/components/OutletSwitcher.tsx
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Store } from "lucide-react";
import { useAppContextStore } from "../../store/useAppContextStore";
import { restaurantService } from "../../api/services/restaurant.service";
import { outletService } from "../../api/services/outlet.service";
import type { Restaurant } from "../../types/restaurant";
import type { Outlet } from "../../types/outlet";

export default function OutletSwitcher() {
  const me = useAppContextStore((s) => s.me);
  const restaurantId = useAppContextStore((s) => s.restaurantId);
  const outletId = useAppContextStore((s) => s.outletId);
  const restaurantName = useAppContextStore((s) => s.restaurantName);
  const outletName = useAppContextStore((s) => s.outletName);
  const setRestaurant = useAppContextStore((s) => s.setRestaurant);
  const setOutlet = useAppContextStore((s) => s.setOutlet);

  const meRoles: string[] = (me as any)?.roles ?? [];
  const canSwitch =
    meRoles.includes("OWNER") ||
    meRoles.includes("ROOT") ||
    meRoles.includes("ADMIN");

  const [open, setOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(false);

  // load restaurants (owner/root/admin)
  useEffect(() => {
    if (!canSwitch) return;

    const run = async () => {
      setLoading(true);
      try {
        const page = await restaurantService.listOwnedRestaurants({
          page: 0,
          size: 50,
        });
        const list = page?.content ?? [];
        setRestaurants(list);

        // auto pick restaurant if missing
        const pickedId = restaurantId ?? list?.[0]?.id ?? null;
        if (pickedId && pickedId !== restaurantId) {
          const pickedName = list.find((r) => r.id === pickedId)?.name ?? null;
          setRestaurant({ restaurantId: pickedId, restaurantName: pickedName });
        } else if (restaurantId && !restaurantName) {
          const pickedName =
            list.find((r) => r.id === restaurantId)?.name ?? null;
          setRestaurant({ restaurantId, restaurantName: pickedName });
        }
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSwitch]);

  // load outlets when restaurant changes
  useEffect(() => {
    if (!canSwitch) return;
    if (!restaurantId) {
      setOutlets([]);
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const page = await outletService.list({
          restaurantId,
          page: 0,
          size: 200,
        });
        const list = page?.content ?? [];
        setOutlets(list);

        // auto pick outlet if missing
        if (!outletId) {
          const preferred = list.find((o) => o.isDefault) ?? list[0];
          if (preferred?.id) {
            setOutlet({
              outletId: preferred.id,
              outletName: preferred.name ?? null,
            });
          }
        } else if (outletId && !outletName) {
          const pickedName = list.find((o) => o.id === outletId)?.name ?? null;
          setOutlet({ outletId, outletName: pickedName });
        }
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSwitch, restaurantId]);

  const titleTop = useMemo(
    () => restaurantName || "Chọn nhà hàng",
    [restaurantName]
  );
  const titleBottom = useMemo(
    () => outletName || "Chọn chi nhánh",
    [outletName]
  );

  // STAFF: chỉ hiển thị context, không dropdown
  if (!canSwitch) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600 border border-slate-200">
          <Store size={16} />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">
            {titleTop}
          </p>
          <p className="text-sm font-semibold text-slate-700 leading-none">
            {titleBottom}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600 border border-slate-200 group-hover:border-blue-200">
          <Store size={16} />
        </div>

        <div className="hidden sm:block text-left">
          <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">
            {titleTop}
          </p>
          <p className="text-sm font-semibold text-slate-700 leading-none">
            {titleBottom}
          </p>
        </div>

        <ChevronDown
          size={14}
          className="text-slate-400 group-hover:text-slate-600 ml-1"
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-3 w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-20">
            <div className="text-xs font-semibold text-slate-500 mb-2">
              Chọn nhà hàng & chi nhánh
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nhà hàng
                </label>
                <select
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  value={restaurantId ?? ""}
                  disabled={loading}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    const name =
                      restaurants.find((r) => r.id === id)?.name ?? null;
                    setRestaurant({ restaurantId: id, restaurantName: name });
                  }}
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name || r.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Chi nhánh
                </label>
                <select
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  value={outletId ?? ""}
                  disabled={loading || !restaurantId}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    const name = outlets.find((o) => o.id === id)?.name ?? null;
                    setOutlet({ outletId: id, outletName: name });
                  }}
                >
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name || o.id}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="w-full h-10 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                onClick={() => setOpen(false)}
                disabled={!restaurantId || !outletId}
              >
                Xong
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
