import { create } from "zustand";
import {
  createEngine,
  emptyState,
  historySeries,
  stepEngine,
  type BrainState,
  type Stimulus,
} from "@/lib/brain/simulate";

const engine = createEngine();

export type ViewMode = "both" | "fly" | "brain";

type ProtocolStore = {
  stimulus: Stimulus;
  intensity: number;
  focusCircuit: boolean;
  aboutOpen: boolean;
  viewMode: ViewMode;
  snapshot: BrainState;
  history: number[];
  stimElapsed: number;
  setStimulus: (s: Stimulus) => void;
  setIntensity: (n: number) => void;
  setFocusCircuit: (v: boolean) => void;
  setAboutOpen: (v: boolean) => void;
  setViewMode: (v: ViewMode) => void;
  tick: (dt: number) => void;
};

export const useProtocol = create<ProtocolStore>((set, get) => ({
  stimulus: "rest",
  intensity: 1,
  focusCircuit: false,
  aboutOpen: false,
  viewMode: "both",
  snapshot: emptyState(),
  history: Array.from({ length: 240 }, () => 0),
  stimElapsed: 0,
  setStimulus: (stimulus) => set({ stimulus }),
  setIntensity: (intensity) => set({ intensity }),
  setFocusCircuit: (focusCircuit) => set({ focusCircuit }),
  setAboutOpen: (aboutOpen) => set({ aboutOpen }),
  setViewMode: (viewMode) => set({ viewMode }),
  tick: (dt) => {
    const { stimulus, intensity } = get();
    stepEngine(engine, dt, stimulus, intensity);
  },
}));

export function getEngine() {
  return engine;
}

export function publishSnapshot() {
  useProtocol.setState({
    snapshot: { ...engine.state },
    history: historySeries(engine),
    stimElapsed: engine.stimElapsed,
  });
}
