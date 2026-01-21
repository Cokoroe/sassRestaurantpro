import { useAppContextStore } from "../../../store/useAppContextStore";
import { useMemo } from "react";

const getCtxIds = (s: any) => {
  const outletId =
    s.currentOutletId ||
    s.outletId ||
    s.selectedOutletId ||
    s.currentOutlet?.id ||
    s.outlet?.id ||
    null;

  const restaurantId =
    s.currentRestaurantId ||
    s.restaurantId ||
    s.selectedRestaurantId ||
    s.currentRestaurant?.id ||
    s.restaurant?.id ||
    null;

  return { outletId, restaurantId };
};

export function useCtxIds() {
  const ctx = useAppContextStore();
  return useMemo(() => getCtxIds(ctx as any), [ctx]);
}
