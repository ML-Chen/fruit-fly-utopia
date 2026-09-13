import { useEffect, useState, type ComponentType } from "react";
import { Overlay } from "@/components/hud/Overlay";
import { loadMeta, loadSomata, type Meta, type Somata } from "@/lib/brain/load-somata";

type SceneProps = { somata: Somata; meta: Meta };

const boot =
  typeof window === "undefined"
    ? null
    : Promise.all([loadSomata(), loadMeta(), import("@/components/scene/WorldCanvas")]);

export function Experience() {
  const [data, setData] = useState<SceneProps | null>(null);
  const [Scene, setScene] = useState<ComponentType<SceneProps> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boot) return;
    let live = true;
    boot
      .then(([somata, meta, mod]) => {
        if (!live) return;
        setScene(() => mod.WorldCanvas);
        setData({ somata, meta });
      })
      .catch((err: unknown) => {
        if (!live) return;
        setError(err instanceof Error ? err.message : "Failed to load connectome");
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg">
      {error ? (
        <div className="flex h-full items-center justify-center p-6 text-center">
          <p className="max-w-md text-sm text-muted">{error}</p>
        </div>
      ) : !Scene || !data ? (
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <p className="font-display text-2xl text-fg">Fruit fly utopia</p>
          <p className="font-mono text-xs tracking-wide text-muted uppercase">Loading MaleCNS somata</p>
        </div>
      ) : (
        <Scene somata={data.somata} meta={data.meta} />
      )}
      <Overlay />
    </div>
  );
}
