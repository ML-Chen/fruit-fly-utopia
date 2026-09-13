export type Somata = {
  n: number;
  positions: Float32Array;
  groups: Float32Array;
  seeds: Float32Array;
};

export async function loadSomata(): Promise<Somata> {
  const res = await fetch("/data/somata.bin");
  if (!res.ok) throw new Error(`Failed to load connectome somata (${res.status})`);
  const buf = await res.arrayBuffer();
  const header = new DataView(buf, 0, 8);
  const magic = String.fromCharCode(
    header.getUint8(0),
    header.getUint8(1),
    header.getUint8(2),
    header.getUint8(3),
  );
  if (magic !== "HED1") throw new Error("Unrecognized somata file");
  const n = header.getUint32(4, true);
  const positions = new Float32Array(n * 3);
  const groups = new Float32Array(n);
  const seeds = new Float32Array(n);
  const dv = new DataView(buf, 8);
  for (let i = 0; i < n; i++) {
    const o = i * 16;
    positions[i * 3] = dv.getFloat32(o, true);
    positions[i * 3 + 1] = dv.getFloat32(o + 4, true);
    positions[i * 3 + 2] = dv.getFloat32(o + 8, true);
    groups[i] = dv.getUint8(o + 12);
    seeds[i] = ((i * 1103515245 + 12345) >>> 0) / 4294967296;
  }
  return { n, positions, groups, seeds };
}

export type Meta = {
  source: string;
  attribution: string;
  license: string;
  paper: string;
  url: string;
  counts: {
    publishedNeurons: number;
    publishedSynapses: number;
    viz: number;
    groups: Record<string, number>;
    vizGroups: Record<string, number>;
  };
  centroids: Record<string, [number, number, number, number]>;
  groups: string[];
};

export async function loadMeta(): Promise<Meta> {
  const res = await fetch("/data/meta.json");
  if (!res.ok) throw new Error("Failed to load connectome metadata");
  return res.json();
}
