import { create } from "zustand";

export type ModeName = "jarvis" | "minority" | "ops" | "samantha" | "mentat" | "scholar";

export interface LiveEvent { t: number; tag: string; text: string; }

interface ModeState {
  mode: ModeName;
  setMode: (m: ModeName) => void;
}
export const useModeStore = create<ModeState>((set) => ({
  mode: "jarvis",
  setMode: (m) => {
    document.documentElement.setAttribute("data-mode", m);
    set({ mode: m });
  },
}));

interface LiveState {
  events: LiveEvent[];
  pushEvent: (e: LiveEvent) => void;
  clearEvents: () => void;
}
export const useLiveStore = create<LiveState>((set) => ({
  events: [],
  pushEvent: (e) =>
    set((s) => {
      const next = [e, ...s.events];
      if (next.length > 200) next.length = 200;
      return { events: next };
    }),
  clearEvents: () => set({ events: [] }),
}));

interface UIState {
  paletteOpen: boolean;
  setPaletteOpen: (b: boolean) => void;
  wizardComplete: boolean;
  setWizardComplete: (b: boolean) => void;
}
export const useUIStore = create<UIState>((set) => ({
  paletteOpen: false,
  setPaletteOpen: (b) => set({ paletteOpen: b }),
  wizardComplete: localStorage.getItem("watchlight.wizard") === "done",
  setWizardComplete: (b) => {
    localStorage.setItem("watchlight.wizard", b ? "done" : "");
    set({ wizardComplete: b });
  },
}));
