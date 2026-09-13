import { GROUP_COUNT } from "./groups";

export type Stimulus =
  | "rest"
  | "sugar"
  | "ethanol"
  | "cocaine"
  | "doomscroll"
  | "hedonium";

export type BrainState = {
  sugar: number;
  bitter: number;
  oa: number;
  pam: number;
  ppl1: number;
  npf: number;
  kc: number;
  mbon: number;
  mn9: number;
  motor: number;
  visual: number;
  hedonic: number;
  loco: number;
  novelty: number;
};

export type EnvironmentInfo = {
  id: Stimulus;
  label: string;
  kicker: string;
  blurb: string;
};

export const ENVIRONMENTS: EnvironmentInfo[] = [
  {
    id: "rest",
    label: "Empty arena",
    kicker: "Baseline",
    blurb: "No stimulus. Grooming and short walks are the default ventral-nerve-cord motor programs.",
  },
  {
    id: "sugar",
    label: "Sugar water",
    kicker: "Appetitive",
    blurb: "Sweet GRNs fire MN9 (proboscis extension) and, via octopamine, the PAM dopamine neurons that write reward into the mushroom body.",
  },
  {
    id: "ethanol",
    label: "Ethanol",
    kicker: "Ferment",
    blurb: "Flies seek ethanol in rotting fruit. It raises octopamine, NPF and locomotion — the same pathway as a glass of wine, in miniature.",
  },
  {
    id: "cocaine",
    label: "Cocaine",
    kicker: "DAT block",
    blurb: "Blocks the fly dopamine transporter. Walking explodes. It is not sugar: MN9 stays quiet, so the fly never drinks.",
  },
  {
    id: "doomscroll",
    label: "Doomscroll",
    kicker: "Visual novelty",
    blurb: "The screen fills the compound eyes. Kenyon cells track novelty; when that prediction error dies, the fly skips — a locomotor 'scroll'.",
  },
  {
    id: "hedonium",
    label: "Hedonium",
    kicker: "Unbounded reward",
    blurb: "Every appetitive channel clamped on; aversive PPL1 silenced. The operational ceiling of this brain’s reward circuit.",
  },
];

const HISTORY = 240;

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function leaky(current: number, target: number, tau: number, dt: number) {
  const k = 1 - Math.exp(-dt / Math.max(tau, 0.001));
  return current + (target - current) * k;
}

export function emptyState(): BrainState {
  return {
    sugar: 0.02,
    bitter: 0.02,
    oa: 0.04,
    pam: 0.03,
    ppl1: 0.04,
    npf: 0.12,
    kc: 0.05,
    mbon: 0.03,
    mn9: 0.01,
    motor: 0.04,
    visual: 0.08,
    hedonic: 0,
    loco: 0.08,
    novelty: 0.1,
  };
}

export type Engine = {
  state: BrainState;
  rates: Float32Array;
  history: Float32Array;
  histHead: number;
  time: number;
  stimElapsed: number;
  stimulus: Stimulus;
};

export function createEngine(): Engine {
  return {
    state: emptyState(),
    rates: new Float32Array(GROUP_COUNT),
    history: new Float32Array(HISTORY),
    histHead: 0,
    time: 0,
    stimElapsed: 0,
    stimulus: "rest",
  };
}

/**
 * Reduced rate model of published Drosophila appetitive circuits.
 *
 * Sugar GRNs → octopamine (OA-VUM) → PAM DANs → Kenyon cells / MBONs → MN9 (PER).
 * PPL1 is tracked as the aversive counterpart but never driven by a user protocol.
 * Ethanol and cocaine are standard appetitive / pharmacological assays.
 * Doomscroll: visual novelty in the mushroom body, locomotor skip on habituation.
 *
 * Soma positions are real MaleCNS coordinates. The rates are a circuit-level
 * instrument, not a 125-million-synapse spike simulation.
 */
export function stepEngine(engine: Engine, dt: number, stimulus: Stimulus, intensity: number) {
  const d = Math.min(Math.max(dt, 0), 0.08);
  engine.time += d;
  if (engine.stimulus !== stimulus) {
    engine.stimulus = stimulus;
    engine.stimElapsed = 0;
  } else {
    engine.stimElapsed += d;
  }
  const I = clamp01(intensity);
  const s = engine.state;
  const tStim = engine.stimElapsed;

  let iSugar = 0;
  let iOa = 0;
  let iPam = 0;
  let iPpl1 = 0;
  let iNpf = 0;
  let iVis = 0.07;
  let locoBias = 0.08;
  let tNovelty = 0.08;

  if (stimulus === "sugar") {
    iSugar = 0.92 * I;
    locoBias = 0.18;
  } else if (stimulus === "hedonium") {
    iSugar = 1.0 * I;
    iOa = 0.95 * I;
    iPam = 1.0 * I;
    iNpf = 0.88 * I;
    iPpl1 = -0.95 * I;
    iVis = 0.28 * I;
    locoBias = 0.12;
    tNovelty = 0.2;
  } else if (stimulus === "ethanol") {
    // Appetitive ferment: keep the rising phase, skip the sedative collapse.
    iOa = 0.42 * I;
    iNpf = 0.38 * I;
    iPam = 0.28 * I;
    iSugar = 0.12 * I;
    locoBias = clamp01(0.22 + 0.55 * I);
  } else if (stimulus === "cocaine") {
    iPam = 0.92 * I;
    iOa = 0.14 * I;
    iNpf = 0.22 * I;
    locoBias = clamp01(0.2 + 0.85 * I);
  } else if (stimulus === "doomscroll") {
    const cycle = tStim % 4.6;
    tNovelty = clamp01(0.08 + 0.9 * I * Math.exp(-cycle / 1.15));
    iVis = 0.82 * I;
    iPam = 0.22 * I * tNovelty;
    iNpf = 0.12 * I * tNovelty;
    iOa = 0.06 * I;
    locoBias = tNovelty < 0.22 ? 0.62 : 0.06;
  }

  s.sugar = leaky(s.sugar, clamp01(iSugar), 0.07, d);
  s.bitter = leaky(s.bitter, 0.02, 0.2, d);

  const tOa = clamp01(0.06 + 0.62 * s.sugar + iOa);
  s.oa = leaky(s.oa, tOa, 0.22, d);

  const tNpf = clamp01(0.14 + 0.28 * s.sugar + iNpf);
  s.npf = leaky(s.npf, tNpf, 0.55, d);

  const tPpl1 = clamp01(0.04 + iPpl1 - 0.28 * s.pam);
  s.ppl1 = leaky(s.ppl1, tPpl1, 0.18, d);

  const tPam = clamp01(0.04 + 0.48 * s.oa + 0.32 * s.sugar + 0.18 * s.npf + iPam - 0.35 * s.ppl1);
  s.pam = leaky(s.pam, tPam, 0.16, d);

  s.novelty = leaky(s.novelty, tNovelty, 0.18, d);

  const tKc = clamp01(0.06 + 0.58 * s.pam + 0.16 * s.oa + 0.35 * s.novelty - 0.22 * s.ppl1);
  s.kc = leaky(s.kc, tKc, 0.14, d);

  const tMbon = clamp01(0.04 + 0.72 * s.kc * (0.35 + 0.65 * s.pam) - 0.28 * s.ppl1);
  s.mbon = leaky(s.mbon, tMbon, 0.12, d);

  const tMn9 = clamp01(0.015 + 0.48 * s.sugar + 0.38 * s.mbon + 0.18 * s.oa - 0.2 * s.ppl1);
  s.mn9 = leaky(s.mn9, tMn9, 0.09, d);

  s.visual = leaky(s.visual, clamp01(iVis + 0.05 * s.oa), 0.28, d);

  s.hedonic = clamp01(
    0.3 * s.pam +
      0.16 * s.oa +
      0.14 * s.sugar +
      0.12 * s.npf +
      0.16 * s.mn9 +
      0.12 * s.mbon -
      0.32 * s.ppl1,
  );

  const tMotor = clamp01(0.04 + 0.2 * s.mn9 + locoBias);
  s.motor = leaky(s.motor, tMotor, 0.22, d);
  s.loco = leaky(s.loco, clamp01(locoBias), 0.35, d);

  const r = engine.rates;
  r[0] = s.visual;
  r[1] = 0.06 + 0.42 * s.hedonic;
  r[2] = 0.05 + 0.45 * s.loco;
  r[3] = s.kc;
  r[4] = s.pam;
  r[5] = s.ppl1;
  r[6] = 0.08 + 0.22 * s.pam;
  r[7] = s.mbon;
  r[8] = s.sugar;
  r[9] = s.bitter;
  r[10] = 0.25 * s.sugar;
  r[11] = s.oa;
  r[12] = s.npf;
  r[13] = s.mn9;
  r[14] = s.motor;
  r[15] = 0.07 + 0.12 * s.hedonic;
  r[16] = 0.04;
  r[17] = 0.06 + 0.4 * s.loco;

  engine.history[engine.histHead] = s.hedonic;
  engine.histHead = (engine.histHead + 1) % HISTORY;
}

export function historySeries(engine: Engine): number[] {
  const out = new Array<number>(HISTORY);
  for (let i = 0; i < HISTORY; i++) {
    out[i] = engine.history[(engine.histHead + i) % HISTORY];
  }
  return out;
}

export type FlyDrive = {
  walkSpeed: number;
  turnNoise: number;
  per: number;
  goal: "wander" | "droplet" | "circle" | "screen";
  wingDroop: number;
  tremor: number;
  groom: number;
  collapsed: number;
};

export function flyDrive(stimulus: Stimulus, s: BrainState, stimElapsed: number): FlyDrive {
  if (stimulus === "sugar") {
    return {
      walkSpeed: s.mn9 > 0.45 ? 0.04 : 0.55,
      turnNoise: 0.25,
      per: s.mn9,
      goal: "droplet",
      wingDroop: 0.15,
      tremor: 0.04,
      groom: 0,
      collapsed: 0,
    };
  }
  if (stimulus === "ethanol") {
    return {
      walkSpeed: 0.4 + 0.7 * s.loco,
      turnNoise: 1.1 + s.loco,
      per: 0.08 + 0.12 * s.sugar,
      goal: "wander",
      wingDroop: 0.15,
      tremor: 0.22,
      groom: 0,
      collapsed: 0,
    };
  }
  if (stimulus === "cocaine") {
    return {
      walkSpeed: 0.55 + 1.1 * s.loco,
      turnNoise: 1.4,
      per: 0.04,
      goal: "circle",
      wingDroop: 0,
      tremor: 0.55,
      groom: 0,
      collapsed: 0,
    };
  }
  if (stimulus === "doomscroll") {
    const scrolling = s.novelty < 0.22;
    return {
      walkSpeed: scrolling ? 0.55 : 0.03,
      turnNoise: scrolling ? 0.9 : 0.08,
      per: 0.02,
      goal: "screen",
      wingDroop: 0.08,
      tremor: 0.06 + s.novelty * 0.1,
      groom: 0,
      collapsed: 0,
    };
  }
  if (stimulus === "hedonium") {
    return {
      walkSpeed: s.mn9 > 0.5 ? 0.02 : 0.45,
      turnNoise: 0.12,
      per: Math.max(s.mn9, 0.85 * s.hedonic),
      goal: "droplet",
      wingDroop: 0.35,
      tremor: 0.12 * s.hedonic,
      groom: 0,
      collapsed: 0,
    };
  }
  return {
    walkSpeed: 0.22 + 0.15 * Math.sin(stimElapsed * 0.3) ** 2,
    turnNoise: 0.4,
    per: 0.02,
    goal: "wander",
    wingDroop: 0,
    tremor: 0,
    groom: 0.35,
    collapsed: 0,
  };
}

export function behaviorLabel(stimulus: Stimulus, s: BrainState, stimElapsed: number): string {
  const d = flyDrive(stimulus, s, stimElapsed);
  if (stimulus === "cocaine") return "Hypermotor";
  if (stimulus === "ethanol") return "Buzzed";
  if (stimulus === "doomscroll") return s.novelty < 0.22 ? "Scrolling" : "Watching";
  if (d.per > 0.55) return stimulus === "hedonium" ? "Locked PER" : "Drinking";
  if (d.groom > 0.4) return "Grooming";
  if (d.walkSpeed > 0.2) return "Walking";
  return "Still";
}

export type MotionExplain = {
  action: string;
  why: string;
  pathway: string;
};

export function explainMotion(stimulus: Stimulus, s: BrainState, stimElapsed: number): MotionExplain {
  const d = flyDrive(stimulus, s, stimElapsed);
  if (d.per > 0.55) {
    return {
      action: "Proboscis extension (PER)",
      why: "MN9, a real motor neuron in this connectome, drives the proboscis. Sweet GRNs can fire it innately; PAM dopamine and MBONs hold it on.",
      pathway: "Gr5a GRNs → OA-VUM → PAM DANs → KC/MBON → MN9",
    };
  }
  if (stimulus === "cocaine") {
    return {
      action: "Hypermotor circling",
      why: "Cocaine blocks dDAT, so dopamine lingers in the cleft. Descending neurons walk. MN9 never fires — this is wanting, not drinking.",
      pathway: "dDAT block → extrasynaptic DA → descending neurons",
    };
  }
  if (stimulus === "ethanol") {
    return {
      action: "Disinhibited walking",
      why: "Flies approach fermenting fruit. Ethanol lifts octopamine and NPF, which bias the central complex toward longer walking bouts.",
      pathway: "Ethanol → OA / NPF / PAM → CX → VNC",
    };
  }
  if (stimulus === "doomscroll" && s.novelty < 0.22) {
    return {
      action: "Scroll skip",
      why: "Kenyon cells stop signalling novelty once the clip is predicted. Habituated MBON output releases a short walk — the skip.",
      pathway: "R1–R8 → KC novelty → MBON habituation → locomotion",
    };
  }
  if (stimulus === "doomscroll") {
    return {
      action: "Visual fixation",
      why: "The screen fills the compound eyes. Lobula columnar neurons hold the gaze while Kenyon cells track novelty.",
      pathway: "Ommatidia → lamina / medulla / lobula → KC",
    };
  }
  if (d.groom > 0.35) {
    return {
      action: "Grooming",
      why: "The default idle program in the ventral nerve cord. No reward is required.",
      pathway: "VNC grooming CPG",
    };
  }
  if (d.goal === "droplet") {
    return {
      action: "Appetitive approach",
      why: "Sweet-associated mushroom-body output neurons bias walking toward the droplet until MN9 takes over and the fly drinks.",
      pathway: "PAM → KC → appetitive MBON → walking",
    };
  }
  return {
    action: "Exploratory walking",
    why: "Central-complex heading circuits plus descending neurons produce short bouts of walking in an empty arena.",
    pathway: "CX / descending neurons → VNC",
  };
}

/** Model-equivalent PAM firing. Not a patch-clamp recording. */
export function pamHz(s: BrainState) {
  return 1.2 + s.pam * 42;
}

export function hedonicIndex(s: BrainState) {
  return Math.round(s.hedonic * 100);
}

export const HEDONIC_TICKS = [
  { at: 8, label: "rest" },
  { at: 32, label: "scroll" },
  { at: 48, label: "cocaine" },
  { at: 64, label: "sugar" },
  { at: 96, label: "hedonium" },
] as const;
