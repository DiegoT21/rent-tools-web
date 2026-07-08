import { create } from "zustand";
import { favoriteService } from "@/services/favoriteService";

interface FavoritesState {
  ids: string[];
  loaded: boolean;
  loading: boolean;
  loadIds: () => Promise<void>;
  isFavorite: (toolUuid: string) => boolean;
  toggle: (toolUuid: string) => Promise<void>;
  reset: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: [],
  loaded: false,
  loading: false,

  loadIds: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const ids = await favoriteService.listIds();
      set({ ids, loaded: true });
    } catch {
      set({ loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  isFavorite: (toolUuid: string) => get().ids.includes(toolUuid),

  toggle: async (toolUuid: string) => {
    const active = get().ids.includes(toolUuid);
    // Optimista
    set({ ids: active ? get().ids.filter((id) => id !== toolUuid) : [...get().ids, toolUuid] });
    try {
      if (active) await favoriteService.remove(toolUuid);
      else await favoriteService.add(toolUuid);
    } catch (err) {
      // Revertir si falla
      set({ ids: active ? [...get().ids, toolUuid] : get().ids.filter((id) => id !== toolUuid) });
      throw err;
    }
  },

  reset: () => set({ ids: [], loaded: false }),
}));
