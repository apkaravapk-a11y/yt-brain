import { create } from "zustand";

export interface LiveEvent { t: number; tag: string; text: string; }

// A3: split into two stores so mode changes don't re-render the event stream
// and event pushes don't re-render the whole mode-dependent UI.

interface ModeState {
  mode: string;
  setMode: (m: string) => void;
}
export const useModeStore = create<ModeState>((set) => ({
  mode: "jarvis",
  setMode: (m) => {
    document.body.className = `mode-${m}`;
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
      // Keep a 200-item cap, cheap unshift-and-truncate.
      const next = [e, ...s.events];
      if (next.length > 200) next.length = 200;
      return { events: next };
    }),
  clearEvents: () => set({ events: [] }),
}));

// Legacy compatibility — keep `useStore` as a combined view ONLY for code paths
// that still call it. All new code should use the split stores above with
// selectors to avoid full-app re-renders.
interface CompatState extends ModeState {
  events: LiveEvent[];
  pushEvent: (e: LiveEvent) => void;
}
export const useStore = (): CompatState => {
  const mode = useModeStore((s) => s.mode);
  const setMode = useModeStore((s) => s.setMode);
  const events = useLiveStore((s) => s.events);
  const pushEvent = useLiveStore((s) => s.pushEvent);
  return { mode, setMode, events, pushEvent };
};
