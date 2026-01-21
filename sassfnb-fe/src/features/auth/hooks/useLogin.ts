// src/features/auth/hooks/useLogin.ts
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../../api/services/auth.service";
import { restaurantService } from "../../../api/services/restaurant.service";
import { outletService } from "../../../api/services/outlet.service";
import { tokenStorage } from "../../../api/token";
import { useAppContextStore } from "../../../store/useAppContextStore";
import { useRbac } from "../../../hooks/useRbac";

type LoginResult = { ok: true } | { ok: false; message: string };

export function useLogin() {
  const navigate = useNavigate();
  const { refresh: refreshRbac } = useRbac();

  const hydrateFromMe = useAppContextStore((s) => s.hydrateFromMe);
  const setRestaurant = useAppContextStore((s) => s.setRestaurant);
  const setOutlet = useAppContextStore((s) => s.setOutlet);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (username: string, password: string): Promise<LoginResult> => {
    setLoading(true);
    setError(null);

    try {
      // 1) login -> tokens
      const tokens = await authService.login({ username, password });
      tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);

      // 2) me -> hydrate store
      const me = await authService.me();
      hydrateFromMe(me);

      const roles = (me.roles ?? []) as string[];
      const isOwnerOrRoot = roles.includes("OWNER") || roles.includes("ROOT");

      // 3) STAFF bắt buộc có context
      if (!isOwnerOrRoot) {
        if (!me.restaurantId || !me.outletId) {
          throw new Error("STAFF chưa được gán restaurant/outlet. Vui lòng liên hệ quản trị.");
        }
        // refresh RBAC sau khi chắc chắn context OK
        await refreshRbac();
        navigate("/app/dashboard", { replace: true });
        return { ok: true };
      }

      // 4) OWNER/ROOT: nếu đã có context trong store/local thì đi luôn
      const rid = localStorage.getItem("restaurant_id");
      const oid = localStorage.getItem("outlet_id");
      if (rid && oid) {
        await refreshRbac();
        navigate("/app/dashboard", { replace: true });
        return { ok: true };
      }

      // 5) auto-pick restaurant/outlet cho OWNER/ROOT
      const rPage = await restaurantService.listOwnedRestaurants({ page: 0, size: 50 });
      const restaurants = rPage.content ?? [];
      const first = restaurants[0];

      if (first?.id) {
        setRestaurant({ restaurantId: first.id, restaurantName: first.name });

        const oPage = await outletService.listOutlets({ restaurantId: first.id, page: 0, size: 200 });
        const outlets = oPage.content ?? [];

        const preferred =
          outlets.find((o: any) => Boolean((o as any).isDefault)) ?? outlets[0];

        if (preferred?.id) {
          setOutlet({ outletId: preferred.id, outletName: preferred.name ?? null });
        }
      }

      await refreshRbac();
      navigate("/app/dashboard", { replace: true });
      return { ok: true };
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? "Đăng nhập thất bại";
      setError(msg);
      return { ok: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
