import { useMemo } from "react";
import {
  Activity,
  Bug,
  CircleDot,
  Droplets,
  FlaskConical,
  Info,
  Layers,
  Smartphone,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  behaviorLabel,
  ENVIRONMENTS,
  explainMotion,
  HEDONIC_TICKS,
  hedonicIndex,
  pamHz,
  type Stimulus,
} from "@/lib/brain/simulate";
import { cn, fmtPct } from "@/lib/utils";
import { useProtocol, type ViewMode } from "@/store/protocol";

const ICONS: Record<Stimulus, typeof Bug> = {
  rest: Bug,
  sugar: Droplets,
  ethanol: FlaskConical,
  cocaine: Zap,
  doomscroll: Smartphone,
  hedonium: CircleDot,
};

export function Overlay() {
  const stimulus = useProtocol((s) => s.stimulus);
  const setStimulus = useProtocol((s) => s.setStimulus);
  const snapshot = useProtocol((s) => s.snapshot);
  const history = useProtocol((s) => s.history);
  const stimElapsed = useProtocol((s) => s.stimElapsed);
  const viewMode = useProtocol((s) => s.viewMode);
  const setViewMode = useProtocol((s) => s.setViewMode);
  const focusCircuit = useProtocol((s) => s.focusCircuit);
  const setFocusCircuit = useProtocol((s) => s.setFocusCircuit);
  const aboutOpen = useProtocol((s) => s.aboutOpen);
  const setAboutOpen = useProtocol((s) => s.setAboutOpen);
  const env = ENVIRONMENTS.find((e) => e.id === stimulus)!;
  const behavior = behaviorLabel(stimulus, snapshot, stimElapsed);
  const motion = explainMotion(stimulus, snapshot, stimElapsed);
  const score = hedonicIndex(snapshot);
  const daHz = pamHz(snapshot);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6">
      <header className="pointer-events-auto flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.18em] text-muted uppercase">MaleCNS · Google × Janelia</p>
          <h1 className="font-display text-3xl font-medium tracking-tight text-fg sm:text-4xl">Hedonium</h1>
          <p className="mt-1 max-w-sm text-sm text-muted">A fruit fly given only things it wants. Watch the animal and the circuit at once.</p>
        </div>
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          className="flex size-11 items-center justify-center rounded-md border border-border bg-surface text-fg transition-colors duration-150 hover:border-border-strong"
          aria-label="About this model"
        >
          <Info className="size-4" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 items-stretch gap-4 pt-4">
        <nav className="pointer-events-auto hidden w-56 shrink-0 flex-col gap-1 self-end sm:flex lg:self-center">
          {ENVIRONMENTS.map((item) => {
            const Icon = ICONS[item.id];
            const active = item.id === stimulus;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStimulus(item.id)}
                className={cn(
                  "flex items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-[background-color,border-color] duration-150",
                  active
                    ? "border-border-strong bg-surface-2"
                    : "border-transparent bg-transparent hover:bg-surface",
                )}
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-muted" />
                <span>
                  <span className="block text-sm font-medium text-fg">{item.label}</span>
                  <span className="block font-mono text-[11px] tracking-wide text-subtle uppercase">{item.kicker}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="hidden min-w-0 flex-1 lg:block" />

        <aside className="pointer-events-auto ml-auto hidden w-[19.5rem] shrink-0 flex-col justify-end gap-3 lg:flex">
          <HappinessCard score={score} history={history} daHz={daHz} />
          <div className="rounded-lg border border-border bg-surface/90 p-4">
            <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">Why it moves</p>
            <p className="mt-1 font-display text-xl text-fg">{motion.action}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{motion.why}</p>
            <p className="mt-2 font-mono text-[11px] leading-relaxed tracking-wide text-subtle">{motion.pathway}</p>
            <p className="mt-3 text-sm text-fg">
              {behavior}
              <span className="text-muted"> · {env.label}</span>
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              <Meter label="PAM DA" value={snapshot.pam} />
              <Meter label="Octopamine" value={snapshot.oa} />
              <Meter label="MN9 / PER" value={snapshot.mn9} />
              <Meter label="Novelty" value={snapshot.novelty} />
            </dl>
          </div>
        </aside>
      </div>

      <footer className="pointer-events-auto mt-3 flex flex-col gap-3">
        <div className="rounded-lg border border-border bg-surface/90 p-3 lg:hidden">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">Hedonic index</p>
              <p className="font-display text-3xl tabular-nums text-fg">{score}</p>
            </div>
            <p className="max-w-[12rem] text-right text-xs leading-relaxed text-muted">{motion.action}</p>
          </div>
          <HedonicBar score={score} />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 sm:hidden">
          {ENVIRONMENTS.map((item) => {
            const Icon = ICONS[item.id];
            const active = item.id === stimulus;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStimulus(item.id)}
                className={cn(
                  "flex h-11 shrink-0 items-center gap-2 rounded-md border px-3 text-sm",
                  active ? "border-border-strong bg-surface-2 text-fg" : "border-border bg-surface text-muted",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={stimulus === "hedonium" ? "primary" : "ghost"}
            onClick={() => setStimulus("hedonium")}
          >
            Infuse hedonium
          </Button>
          <div className="flex rounded-md border border-border bg-surface p-1">
            {(["both", "fly", "brain"] as ViewMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={cn(
                  "h-9 rounded-sm px-3 font-mono text-xs uppercase tracking-wide transition-colors duration-150",
                  viewMode === m ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFocusCircuit(!focusCircuit)}
            className={cn(
              "flex h-11 items-center gap-2 rounded-md border px-3 text-sm",
              focusCircuit ? "border-border-strong bg-surface-2 text-fg" : "border-border bg-surface text-muted",
            )}
          >
            <Layers className="size-4" />
            Reward circuit
          </button>
          <p className="hidden font-mono text-xs text-subtle sm:block">
            {fmtPct(snapshot.hedonic)} hedonic · {daHz.toFixed(1)} Hz PAM · drag to orbit
          </p>
        </div>
      </footer>

      {aboutOpen && <About onClose={() => setAboutOpen(false)} />}
    </div>
  );
}

function HappinessCard({ score, history, daHz }: { score: number; history: number[]; daHz: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface/90 p-4">
      <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">Hedonic index</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="font-display text-5xl tabular-nums leading-none text-fg">{score}</p>
        <p className="pb-1 text-right font-mono text-[11px] leading-relaxed text-subtle">
          PAM {daHz.toFixed(1)} Hz
          <br />
          model rate, not a spike
        </p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Weighted PAM + octopamine + PER − PPL1. Not a feeling. Sugar tops out near 64. Hedonium is the clamp.
      </p>
      <Spark history={history} />
      <HedonicBar score={score} />
    </div>
  );
}

function HedonicBar({ score }: { score: number }) {
  return (
    <div className="mt-3">
      <div className="relative h-1.5 overflow-visible rounded-xs bg-surface-2">
        <div className="h-full rounded-xs bg-accent" style={{ width: `${score}%` }} />
        <span
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg"
          style={{ left: `${score}%` }}
        />
      </div>
      <div className="relative mt-1.5 h-4">
        {HEDONIC_TICKS.map((t) => (
          <span
            key={t.label}
            className="absolute -translate-x-1/2 font-mono text-[9px] tracking-wide text-subtle uppercase"
            style={{ left: `${t.at}%` }}
          >
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between font-mono text-[10px] tracking-wide text-subtle uppercase">
        <span>{label}</span>
        <span className="tabular-nums text-muted">{fmtPct(value)}</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-xs bg-surface-2">
        <div className="h-full rounded-xs bg-accent" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

function Spark({ history }: { history: number[] }) {
  const d = useMemo(() => {
    const w = 200;
    const h = 36;
    if (!history.length) return "";
    return history
      .map((v, i) => {
        const x = (i / (history.length - 1)) * w;
        const y = h - v * (h - 2) - 1;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [history]);
  return (
    <svg viewBox="0 0 200 36" className="mt-3 h-9 w-full text-accent" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function About({ onClose }: { onClose: () => void }) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-end justify-center bg-bg/70 p-4 sm:items-center">
      <div className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl text-fg">What this is</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-md border border-border"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
          <p>
            The point cloud is a stratified sample of real soma positions from the{" "}
            <span className="text-fg">MaleCNS v1.0</span> connectome (HHMI Janelia FlyEM, Google Research, Cambridge,
            MRC LMB; Cell 2026) — 166,691 neurons, ~125 million synapses, CC-BY. Every Kenyon cell, PAM dopamine
            neuron, MBON, octopamine cell and MN9 in that volume is plotted.
          </p>
          <p>
            The fly is a geometric male <em>Drosophila melanogaster</em>. Every environment is something a fly
            approaches: sugar water (proboscis-extension reflex), ethanol in fermenting fruit, cocaine (dopamine
            transporter block — a standard self-administration assay), a novel visual stream, or hedonium.
            There is no quinine, shock, or other aversive protocol.
          </p>
          <p>
            Flies almost certainly lack a mammalian opioid “liking” system. What they have is a layered reinforcement
            circuit: sweet taste → octopamine → PAM dopamine → mushroom body. The hedonic index is that circuit’s
            operational readout, not a feeling. Sugar saturates near 64. Hedonium clamps the same channels to the
            ceiling and silences aversive PPL1 cells until MN9 fires as if the fly were tasting unbounded sugar.
          </p>
          <p>
            Movement is not decoration. Approach is appetitive MBON output. Drinking is MN9. Cocaine circling is
            lingering dopamine onto descending neurons, with PER off. Doomscrolling is Kenyon-cell novelty decaying
            until a locomotor skip. The dynamics are a reduced rate model, not a full leaky-integrate-and-fire pass
            over 50 million synapses. Treat the numbers as an instrument, not a mind.
          </p>
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs text-subtle">
          <Activity className="size-3.5" />
          Shiu et al. 2024 · Burke et al. 2012 · MaleCNS 2026
        </div>
      </div>
    </div>
  );
}
