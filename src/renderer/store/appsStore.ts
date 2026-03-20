import { create } from "zustand";
import type { TrackedAppDto } from "../../main/ipc/dto/TrackedAppDto";
import { bridge } from "../api/bridge";

interface AppsState {
  apps: TrackedAppDto[];
  loading: boolean;
  checkingIds: Set<string>;
  error: string | null;

  loadApps: () => Promise<void>;
  addApp: (name: string, sourceUrl: string) => Promise<void>;
  removeApp: (id: string) => Promise<void>;
  checkAll: () => Promise<void>;
  checkOne: (id: string) => Promise<void>;
  applyUpdates: (updates: Array<{ id: string; latestVersion: string }>) => void;
}

export const useAppsStore = create<AppsState>((set, get) => ({
  apps: [],
  loading: false,
  checkingIds: new Set(),
  error: null,

  loadApps: async () => {
    set({ loading: true, error: null });
    try {
      const apps = await bridge.getAllApps();
      set({ apps, loading: false });
    } catch (err) {
      set({ loading: false, error: String(err) });
    }
  },

  addApp: async (name, sourceUrl) => {
    set({ error: null });
    await bridge.addApp({ name, sourceUrl });
    await get().loadApps();
  },

  removeApp: async (id) => {
    set({ error: null });
    await bridge.removeApp(id);
    set((s) => ({ apps: s.apps.filter((a) => a.id !== id) }));
  },

  checkAll: async () => {
    set({ error: null });
    const { results } = await bridge.checkAllUpdates();
    get().applyUpdates(
      results
        .filter((r) => r.updateAvailable)
        .map((r) => ({ id: r.id, latestVersion: r.latestVersion })),
    );
    await get().loadApps();
  },

  checkOne: async (id) => {
    set((s) => ({ checkingIds: new Set([...s.checkingIds, id]) }));
    try {
      const { results } = await bridge.checkOneUpdate(id);
      get().applyUpdates(
        results
          .filter((r) => r.updateAvailable)
          .map((r) => ({ id: r.id, latestVersion: r.latestVersion })),
      );
      await get().loadApps();
    } finally {
      set((s) => {
        const next = new Set(s.checkingIds);
        next.delete(id);
        return { checkingIds: next };
      });
    }
  },

  applyUpdates: (updates) => {
    if (updates.length === 0) return;
    const map = new Map(updates.map((u) => [u.id, u.latestVersion]));
    set((s) => ({
      apps: s.apps.map((a) =>
        map.has(a.id)
          ? { ...a, latestVersion: map.get(a.id)!, hasUpdateAvailable: true }
          : a,
      ),
    }));
  },
}));
