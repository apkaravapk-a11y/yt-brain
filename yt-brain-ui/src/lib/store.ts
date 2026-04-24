import { create } from "zustand";

interface LiveEvent { t: number; tag: string; text: string; }

interface State {
  mode: string;
  setMode: (m: string) => void;
  events: LiveEvent[];
  pushEvent: (e: LiveEvent) => void;
}

export const useStore = create<State>((set) => ({
  mode: "jarvis",
  setMode: (m) => {
    document.body.className = `mode-${m}`;
    set({ mode: m });
  },
  events: [],
  pushEvent: (e) =>
    set((s) => ({ events: [e, ...s.events].slice(0, 200) })),
}));
