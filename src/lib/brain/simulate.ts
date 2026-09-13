import { GROUP_COUNT } from "./groups";

export type Stimulus =
  | "rest"
  | "sugar"
  | "ethanol"
  | "cocaine"
  | "doomscroll"
  | "utopia";

export type BrainState = {
  sugar: number;
  bitter: number;
  oa: number;
  pamTaste: number;
  pamNutrient: number;
  pamFlood: number;
  pam: number;
  ppl1: number;
  npf: number;
  kc: number;
  mbonApp: number;
  mbonAv: number;
  mbon: number;
  mn9: number;
  motor: number;
  visual: number;
  loco: number;
  novelty: number;
  agitation: number;
  valence: number;
  palatability: number;
  welfare: number;
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
    blurb: "Sweet GRNs fire PER innately (TH-VUM / MN9). Octopamine teaches PAM taste-DANs; a slower PAM subset writes nutritional value. That is a meal, not a mood.",
  },
  {
    id: "ethanol",
    label: "Ethanol",
    kicker: "Ferment",
    blurb: "Flies seek ethanol in rotting fruit. NPF and octopamine rise. Wanting goes up; the proboscis does not lock the way it does on sugar.",
  },
  {
    id: "cocaine",
    label: "Cocaine",
    kicker: "DAT block",
    blurb: "Extrasynaptic dopamine, not a compartmental reward pulse. The fly walks. PER stays off. Welfare falls — this is wanting without a meal.",
  },
  {
    id: "doomscroll",
    label: "Doomscroll",
    kicker: "Visual novelty",
    blurb: "Ommatidia see a changing screen. Kenyon cells track novelty; when it habituates, a locomotor skip. Novelty is not consumption.",
  },
  {
    id: "utopia",
    label: "Utopia",
    kicker: "Welfare clamp",
    blurb: "Unbounded sweet taste and postingestive PAM, PPL1 off, PER locked, locomotion calm. Not a PAM flood — flooding reward DANs can make the fly acutely averse.",
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
    pamTaste: 0.03,
    pamNutrient: 0.03,
    pamFlood: 0,
    pam: 0.03,
    ppl1: 0.05,
    npf: 0.12,
    kc: 0.05,
    mbonApp: 0.35,
    mbonAv: 0.35,
    mbon: 0.35,
    mn9: 0.01,
    motor: 0.04,
    visual: 0.08,
    loco: 0.08,
    novelty: 0.1,
    agitation: 0.02,
    valence: 0.5,
    palatability: 0.02,
    welfare: 0.1,
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
 * Reduced rate model of published Drosophila appetitive circuitry.
 *
 * Innate palatability (PER) is parallel to learning, not downstream of it:
 *   Gr5a GRNs → TH-VUM (SOG) → MN9   (Marella et al. 2012)
 *
 * Reinforcement is layered (Burke et al. 2012; Huetteroth / Yamagata 2015):
 *   sweet taste → octopamine → PAM taste-DANs (short-term)
 *   nutrition  → PAM nutrient-DANs (γ5 / α1, slower, OA-independent)
 *
 * Valence at the mushroom body (Aso et al. 2014; Bennett et al. 2021):
 *   PAM depresses avoidance MBONs → net approach
 *   PPL1 depresses approach MBONs → net avoidance
 *   valence ≈ approach − avoidance
 *
 * Cohn et al. 2015: sugar activates PAM and inhibits PPL1.
 * 2025 PAM paper: activating the whole reward-PAM population can drive
 * acute aversion even while writing a positive memory. Flooding PAM is
 * therefore not welfare.
 *
 * Welfare is OUR objective, not a feeling:
 *   consumption + nutrient − punishment − agitation
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
  let iPamTaste = 0;
  let iPamNutrient = 0;
  let iFlood = 0;
  let iPpl1 = 0;
  let iNpf = 0;
  let iVis = 0.07;
  let iPer = 0;
  let locoBias = 0.08;
  let tNovelty = 0.08;

  if (stimulus === "sugar") {
    iSugar = 0.92 * I;
    iPer = 0.88 * I;
    locoBias = 0.16;
  } else if (stimulus === "utopia") {
    // Physiological-high sweet + nutrient, PPL1 off, PER locked, calm.
    // Do not slam every PAM cell: that is the 2025 acute-aversion regime.
    iSugar = 1.0 * I;
    iOa = 0.55 * I;
    iPamTaste = 0.35 * I;
    iPamNutrient = 0.55 * I;
    iPpl1 = -0.95 * I;
    iNpf = 0.35 * I;
    iPer = 1.0 * I;
    iVis = 0.12;
    locoBias = 0.06;
    tNovelty = 0.12;
  } else if (stimulus === "ethanol") {
    iOa = 0.4 * I;
    iNpf = 0.48 * I;
    iPamTaste = 0.12 * I;
    iPamNutrient = 0.18 * I;
    iSugar = 0.1 * I;
    iPer = 0.12 * I;
    locoBias = clamp01(0.22 + 0.5 * I);
  } else if (stimulus === "cocaine") {
    iFlood = 0.9 * I;
    iOa = 0.08 * I;
    iNpf = 0.16 * I;
    locoBias = clamp01(0.22 + 0.85 * I);
  } else if (stimulus === "doomscroll") {
    const cycle = tStim % 4.6;
    tNovelty = clamp01(0.08 + 0.9 * I * Math.exp(-cycle / 1.15));
    iVis = 0.82 * I;
    iPamTaste = 0.16 * I * tNovelty;
    iNpf = 0.1 * I * tNovelty;
    locoBias = tNovelty < 0.22 ? 0.62 : 0.06;
  }

  s.sugar = leaky(s.sugar, clamp01(iSugar), 0.07, d);
  s.bitter = leaky(s.bitter, 0.02, 0.2, d);
  s.novelty = leaky(s.novelty, tNovelty, 0.18, d);
  s.visual = leaky(s.visual, clamp01(iVis), 0.28, d);

  const tOa = clamp01(0.05 + 0.62 * s.sugar + iOa);
  s.oa = leaky(s.oa, tOa, 0.22, d);

  const tNpf = clamp01(0.12 + 0.22 * s.sugar + iNpf);
  s.npf = leaky(s.npf, tNpf, 0.55, d);

  const tPamTaste = clamp01(0.03 + 0.55 * s.oa + 0.22 * s.sugar + iPamTaste);
  s.pamTaste = leaky(s.pamTaste, tPamTaste, 0.16, d);

  const tPamNutrient = clamp01(0.03 + 0.48 * s.sugar + iPamNutrient);
  s.pamNutrient = leaky(s.pamNutrient, tPamNutrient, 0.7, d);

  s.pamFlood = leaky(s.pamFlood, clamp01(iFlood), 0.2, d);

  const pamReward = 0.55 * s.pamTaste + 0.45 * s.pamNutrient;
  s.pam = clamp01(0.65 * pamReward + 0.55 * s.pamFlood);

  // Sugar inhibits PPL1 (Cohn 2015). Flood does not.
  const tPpl1 = clamp01(0.05 + iPpl1 - 0.4 * s.sugar - 0.22 * pamReward + 0.08 * s.pamFlood);
  s.ppl1 = leaky(s.ppl1, tPpl1, 0.18, d);

  // Whole-cluster / extrasynaptic DA → innate agitation, not a meal.
  const tAgit = clamp01(0.02 + 0.85 * s.pamFlood + 0.35 * Math.max(0, s.pam - 0.78) + 0.15 * (s.loco - 0.5));
  s.agitation = leaky(s.agitation, tAgit, 0.28, d);

  const tKc = clamp01(0.05 + 0.4 * pamReward + 0.2 * s.oa + 0.32 * s.novelty + 0.12 * s.visual);
  s.kc = leaky(s.kc, tKc, 0.14, d);

  const tAv = clamp01(0.32 + 0.55 * s.ppl1 - 0.48 * pamReward + 0.28 * s.agitation);
  s.mbonAv = leaky(s.mbonAv, tAv, 0.14, d);

  const tApp = clamp01(0.32 + 0.48 * pamReward - 0.5 * s.ppl1 - 0.22 * s.agitation);
  s.mbonApp = leaky(s.mbonApp, tApp, 0.14, d);
  s.mbon = s.mbonApp;
  s.valence = clamp01(0.5 + 0.5 * (s.mbonApp - s.mbonAv));

  // Innate PER: sugar GRNs → TH-VUM → MN9. Not via the mushroom body.
  const tMn9 = clamp01(0.015 + 0.72 * s.sugar + 0.55 * iPer + 0.12 * s.oa - 0.45 * s.agitation - 0.15 * s.ppl1);
  s.mn9 = leaky(s.mn9, tMn9, 0.09, d);
  s.palatability = s.mn9;

  const tLoco = clamp01(locoBias + 0.55 * s.agitation - 0.25 * s.mn9);
  s.loco = leaky(s.loco, tLoco, 0.32, d);
  s.motor = leaky(s.motor, clamp01(0.04 + 0.2 * s.mn9 + s.loco), 0.22, d);

  // Explicit human-chosen welfare. Not liking. Not a fly-computed scalar.
  s.welfare = clamp01(
    0.4 * s.mn9 +
      0.2 * s.sugar +
      0.16 * s.pamNutrient +
      0.1 * s.oa * (1 - s.agitation) +
      0.12 * (1 - s.ppl1) +
      0.06 * s.npf * (1 - s.agitation) -
      0.22 * s.agitation -
      0.1 * s.pamFlood,
  );

  const r = engine.rates;
  r[0] = s.visual;
  r[1] = 0.06 + 0.42 * s.welfare;
  r[2] = 0.05 + 0.45 * s.loco;
  r[3] = s.kc;
  r[4] = s.pam;
  r[5] = s.ppl1;
  r[6] = 0.08 + 0.22 * s.pam;
  r[7] = s.mbonApp;
  r[8] = s.sugar;
  r[9] = s.bitter;
  r[10] = 0.25 * s.sugar;
  r[11] = s.oa;
  r[12] = s.npf;
  r[13] = s.mn9;
  r[14] = s.motor;
  r[15] = 0.07 + 0.12 * s.welfare;
  r[16] = 0.04;
  r[17] = 0.06 + 0.4 * s.loco;

  engine.history[engine.histHead] = s.welfare;
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
      tremor: 0.45 + 0.4 * s.agitation,
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
  if (stimulus === "utopia") {
    return {
      walkSpeed: s.mn9 > 0.5 ? 0.02 : 0.45,
      turnNoise: 0.1,
      per: s.mn9,
      goal: "droplet",
      wingDroop: 0.28,
      tremor: 0.04,
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
  if (d.per > 0.55) return stimulus === "utopia" ? "Locked PER" : "Drinking";
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
      why: "Sweet GRNs fire MN9 through TH-VUM in the SOG. That path does not go through the mushroom body. PER is palatability, not a learned value.",
      pathway: "Gr5a GRNs → TH-VUM → MN9",
    };
  }
  if (stimulus === "cocaine") {
    return {
      action: "Hypermotor circling",
      why: "dDAT block spills dopamine into the cleft. Descending neurons walk. MN9 never fires. High PAM is not a meal — and whole-cluster PAM activation can even be acutely aversive.",
      pathway: "dDAT block → extrasynaptic DA → descending neurons",
    };
  }
  if (stimulus === "ethanol") {
    return {
      action: "Disinhibited walking",
      why: "Flies approach fermenting fruit. Ethanol lifts octopamine and NPF, which bias the central complex toward longer walking bouts.",
      pathway: "Ethanol → OA / NPF → CX → VNC",
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
      why: "PAM taste-DANs depress avoidance MBONs, so net mushroom-body output biases walking toward the droplet. PER takes over when the labellum hits sugar.",
      pathway: "PAM → KC → ↓ avoidance MBON → walking",
    };
  }
  return {
    action: "Exploratory walking",
    why: "Central-complex heading circuits plus descending neurons produce short bouts of walking in an empty arena.",
    pathway: "CX / descending neurons → VNC",
  };
}

/** Model-equivalent PAM cluster rate. Not a patch-clamp recording. */
export function pamHz(s: BrainState) {
  return 1.2 + s.pam * 28;
}

export function welfareIndex(s: BrainState) {
  return Math.round(s.welfare * 100);
}

export const WELFARE_TICKS = [
  { at: 3, label: "cocaine" },
  { at: 14, label: "rest" },
  { at: 33, label: "ethanol" },
  { at: 86, label: "sugar" },
  { at: 97, label: "utopia" },
] as const;
