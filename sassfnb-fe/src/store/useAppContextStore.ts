// src/store/useAppContextStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "../types/auth";
import { contextStorage } from "../api/token";

export type AppContextState = {
  me: AuthUser | null;
  setMe: (me: AuthUser | null) => void;

  restaurantId: string | null;
  outletId: string | null;
  restaurantName: string | null;
  outletName: string | null;

  setRestaurant: (payload: { restaurantId: string | null; restaurantName?: string | null }) => void;
  setOutlet: (payload: { outletId: string | null; outletName?: string | null }) => void;

  hydrateFromMe: (me: AuthUser) => void;
  clearContext: () => void;
};

const fireContextChanged = () => window.dispatchEvent(new Event("app-context-changed"));

const mirrorToLegacy = (s: {
  restaurantId: string | null;
  restaurantName: string | null;
  outletId: string | null;
  outletName: string | null;
}) => {
  contextStorage.setRestaurant(s.restaurantId, s.restaurantName);
  contextStorage.setOutlet(s.outletId, s.outletName);
};

export const useAppContextStore = create<AppContextState>()(
  persist(
    (set, get) => ({
      me: null,
      setMe: (me) => set({ me }),

      restaurantId: null,
      outletId: null,
      restaurantName: null,
      outletName: null,

      setRestaurant: ({ restaurantId, restaurantName }) => {
        const cur = get();

        const next = {
          restaurantId,
          restaurantName:
            restaurantName ??
            (restaurantId ? cur.restaurantName : null) ??
            null,
          // đổi restaurant => reset outlet
          outletId: null,
          outletName: null,
        };

        set(next);
        mirrorToLegacy({
          restaurantId: next.restaurantId ?? null,
          restaurantName: next.restaurantName ?? null,
          outletId: next.outletId ?? null,
          outletName: next.outletName ?? null,
        });
        fireContextChanged();
      },

      setOutlet: ({ outletId, outletName }) => {
        const cur = get();

        const next = {
          outletId,
          outletName:
            outletName ??
            (outletId ? cur.outletName : null) ??
            null,
        };

        set(next);
        mirrorToLegacy({
          restaurantId: cur.restaurantId ?? null,
          restaurantName: cur.restaurantName ?? null,
          outletId: next.outletId ?? null,
          outletName: next.outletName ?? null,
        });
        fireContextChanged();
      },

      hydrateFromMe: (me: AuthUser) => {
        const cur = get();
        const anyMe: any = me;

        set({ me });

        // STAFF: thường có restaurantId/outletId cố định trong me
        // OWNER/ROOT: me có thể null restaurant/outlet => không overwrite selection đang có
        const next = {
          restaurantId: anyMe.restaurantId ?? cur.restaurantId ?? null,
          outletId: anyMe.outletId ?? cur.outletId ?? null,
          restaurantName: anyMe.restaurantName ?? cur.restaurantName ?? null,
          outletName: anyMe.outletName ?? cur.outletName ?? null,
        };

        set(next);
        mirrorToLegacy(next);
        fireContextChanged();
      },

      clearContext: () => {
        set({
          me: null,
          restaurantId: null,
          outletId: null,
          restaurantName: null,
          outletName: null,
        });

        mirrorToLegacy({
          restaurantId: null,
          restaurantName: null,
          outletId: null,
          outletName: null,
        });
        fireContextChanged();
      },
    }),
    {
      name: "sassfnb_context",
      partialize: (s) => ({
        me: s.me,
        restaurantId: s.restaurantId,
        outletId: s.outletId,
        restaurantName: s.restaurantName,
        outletName: s.outletName,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        mirrorToLegacy({
          restaurantId: state.restaurantId ?? null,
          restaurantName: state.restaurantName ?? null,
          outletId: state.outletId ?? null,
          outletName: state.outletName ?? null,
        });
      },
    }
  )
);
