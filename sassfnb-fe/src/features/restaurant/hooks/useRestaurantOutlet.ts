// src/features/restaurant/hooks/useRestaurantOutlet.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { restaurantService } from "../../../api/services/restaurant.service";
import { outletService } from "../../../api/services/outlet.service";
import type { Restaurant, RestaurantUpdateRequest } from "../../../types/restaurant";
import type {
  Outlet,
  OutletCreateRequest,
  OutletUpdateRequest,
} from "../../../types/outlet";
import { useRbac } from "../../../hooks/useRbac";
import { useAppContextStore } from "../../../store/useAppContextStore";

export function useRestaurantOutlet() {
  const { isSuperUser, hasPermission } = useRbac();

  const setRestaurant = useAppContextStore((s) => s.setRestaurant);
  const setOutlet = useAppContextStore((s) => s.setOutlet);

  const [loading, setLoading] = useState(false);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);

  const canManageRestaurant = useMemo(
    () => isSuperUser && hasPermission("restaurant.manage"),
    [isSuperUser, hasPermission]
  );

  const canManageOutlet = useMemo(
    () => isSuperUser && hasPermission("outlet.manage"),
    [isSuperUser, hasPermission]
  );

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const page = await restaurantService.listOwnedRestaurants({ page: 0, size: 200 });
      const list: Restaurant[] = page?.content ?? [];
      setRestaurants(list);

      const stillExists =
        selectedRestaurantId !== null && list.some((r) => r.id === selectedRestaurantId);

      const picked = stillExists ? selectedRestaurantId : list[0]?.id ?? null;
      setSelectedRestaurantId(picked);
    } finally {
      setLoading(false);
    }
  }, [selectedRestaurantId]);

  const loadOutlets = useCallback(
    async (restaurantId: string) => {
      setLoading(true);
      try {
        const page = await outletService.listOutlets({ restaurantId, page: 0, size: 500 });
        const list: Outlet[] = page?.content ?? [];
        setOutlets(list);

        const stillExists =
          selectedOutletId !== null && list.some((o) => o.id === selectedOutletId);

        const picked =
          (stillExists ? selectedOutletId : null) ??
          list.find((o) => Boolean(o.isDefault))?.id ??
          list[0]?.id ??
          null;

        setSelectedOutletId(picked);
      } finally {
        setLoading(false);
      }
    },
    [selectedOutletId]
  );

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    if (!selectedRestaurantId) {
      setOutlets([]);
      setSelectedOutletId(null);
      return;
    }
    loadOutlets(selectedRestaurantId);
  }, [selectedRestaurantId, loadOutlets]);

  const applyContext = useCallback(() => {
    const r = restaurants.find((x) => x.id === selectedRestaurantId) || null;
    const o = outlets.find((x) => x.id === selectedOutletId) || null;

    setRestaurant({ restaurantId: r?.id ?? null, restaurantName: r?.name ?? null });
    setOutlet({ outletId: o?.id ?? null, outletName: o?.name ?? null });
  }, [restaurants, outlets, selectedRestaurantId, selectedOutletId, setRestaurant, setOutlet]);

  // ===== Restaurant actions =====
  const createRestaurant = useCallback(
    async (payload: RestaurantUpdateRequest) => {
      await restaurantService.create(payload);
      await loadRestaurants();
    },
    [loadRestaurants]
  );

  const updateRestaurant = useCallback(
    async (id: string, payload: RestaurantUpdateRequest) => {
      await restaurantService.update(id, payload);
      await loadRestaurants();
    },
    [loadRestaurants]
  );

  const toggleRestaurantStatus = useCallback(
    async (id: string, nextStatus: string) => {
      await restaurantService.patchStatus(id, { status: nextStatus } as any);
      await loadRestaurants();
    },
    [loadRestaurants]
  );

  const archiveRestaurant = useCallback(
    async (id: string) => {
      await restaurantService.delete(id);
      setSelectedRestaurantId((cur) => (cur === id ? null : cur));
      await loadRestaurants();
    },
    [loadRestaurants]
  );

  // ===== Outlet actions =====
  // FE KHÔNG truyền restaurantId, hook tự gán theo selectedRestaurantId
  const createOutlet = useCallback(
    async (payload: Omit<OutletCreateRequest, "restaurantId">) => {
      if (!selectedRestaurantId) return;
      await outletService.create({ ...payload, restaurantId: selectedRestaurantId });
      await loadOutlets(selectedRestaurantId);
    },
    [selectedRestaurantId, loadOutlets]
  );

  const updateOutlet = useCallback(
    async (id: string, payload: OutletUpdateRequest) => {
      if (!selectedRestaurantId) return;
      await outletService.update(id, payload);
      await loadOutlets(selectedRestaurantId);
    },
    [selectedRestaurantId, loadOutlets]
  );

  const archiveOutlet = useCallback(
    async (id: string) => {
      if (!selectedRestaurantId) return;
      await outletService.delete(id);
      setSelectedOutletId((cur) => (cur === id ? null : cur));
      await loadOutlets(selectedRestaurantId);
    },
    [selectedRestaurantId, loadOutlets]
  );

  const makeDefaultOutlet = useCallback(
    async (id: string) => {
      if (!selectedRestaurantId) return;
      await outletService.makeDefault(id);
      await loadOutlets(selectedRestaurantId);
    },
    [selectedRestaurantId, loadOutlets]
  );

  return {
    loading,
    restaurants,
    outlets,

    selectedRestaurantId,
    setSelectedRestaurantId,
    selectedOutletId,
    setSelectedOutletId,

    canManageRestaurant,
    canManageOutlet,

    applyContext,

    createRestaurant,
    updateRestaurant,
    toggleRestaurantStatus,
    archiveRestaurant,

    createOutlet,
    updateOutlet,
    archiveOutlet,
    makeDefaultOutlet,
  };
}
