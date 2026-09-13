import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import type { Somata } from "@/lib/brain/load-somata";
import { getEngine, useProtocol } from "@/store/protocol";

const vertex = /* glsl */ `
  attribute float aGroup;
  attribute float aSeed;
  uniform float uRates[18];
  uniform float uTime;
  uniform float uFocus;
  uniform float uHedonic;
  varying vec3 vColor;
  varying float vAlpha;

  vec3 groupColor(float g) {
    int i = int(g + 0.5);
    if (i == 0) return vec3(0.35, 0.40, 0.48);
    if (i == 1) return vec3(0.55, 0.55, 0.52);
    if (i == 2) return vec3(0.40, 0.42, 0.44);
    if (i == 3) return vec3(0.86, 0.80, 0.68);
    if (i == 4) return vec3(0.95, 0.93, 0.86);
    if (i == 5) return vec3(0.72, 0.42, 0.38);
    if (i == 6) return vec3(0.70, 0.55, 0.50);
    if (i == 7) return vec3(0.90, 0.84, 0.70);
    if (i == 8) return vec3(0.92, 0.82, 0.55);
    if (i == 9) return vec3(0.55, 0.42, 0.36);
    if (i == 10) return vec3(0.70, 0.62, 0.48);
    if (i == 11) return vec3(0.72, 0.82, 0.74);
    if (i == 12) return vec3(0.78, 0.70, 0.82);
    if (i == 13) return vec3(0.96, 0.94, 0.88);
    if (i == 14) return vec3(0.60, 0.58, 0.54);
    if (i == 15) return vec3(0.62, 0.70, 0.68);
    return vec3(0.50, 0.50, 0.52);
  }

  bool isReward(int i) {
    return i == 3 || i == 4 || i == 7 || i == 8 || i == 11 || i == 12 || i == 13;
  }

  void main() {
    int i = int(aGroup + 0.5);
    float rate = 0.05;
    if (i >= 0 && i < 18) rate = uRates[i];
    float pulse = 0.85 + 0.15 * sin(uTime * (2.2 + aSeed * 6.0) + aSeed * 12.0);
    float bright = rate * pulse;
    vec3 col = groupColor(aGroup);
    col += bright * vec3(0.25, 0.18, 0.08);
    if (isReward(i)) col += uHedonic * 0.35 * vec3(0.4, 0.32, 0.18);
    vColor = col;
    float focusMul = 1.0;
    if (uFocus > 0.5) {
      focusMul = isReward(i) || i == 5 || i == 9 ? 1.0 : 0.12;
    }
    vAlpha = (0.12 + bright * 0.85) * focusMul;
    float size = mix(3.4, 9.5, bright);
    if (isReward(i)) size *= 1.35;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = size * (180.0 / -mv.z);
  }
`;

const fragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float d = dot(p, p);
    if (d > 1.0) discard;
    float fall = exp(-d * 2.6);
    gl_FragColor = vec4(vColor, vAlpha * fall);
  }
`;

export function BrainCloud({ somata, scale = 0.42 }: { somata: Somata; scale?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const rates = useMemo(() => new Array<number>(18).fill(0.05), []);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(somata.positions, 3));
    g.setAttribute("aGroup", new THREE.BufferAttribute(somata.groups, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(somata.seeds, 1));
    return g;
  }, [somata]);

  const uniforms = useMemo(
    () => ({
      uRates: { value: rates },
      uTime: { value: 0 },
      uFocus: { value: 0 },
      uHedonic: { value: 0 },
    }),
    [rates],
  );

  useEffect(() => {
    return () => {
      geom.dispose();
    };
  }, [geom]);

  useFrame((_, dt) => {
    const engine = getEngine();
    const { focusCircuit } = useProtocol.getState();
    if (mat.current) {
      const u = mat.current.uniforms;
      u.uTime.value += dt;
      for (let i = 0; i < 18; i++) rates[i] = engine.rates[i] ?? 0;
      u.uRates.value = rates;
      u.uFocus.value = focusCircuit ? 1 : 0;
      u.uHedonic.value = engine.state.welfare;
    }
  });

  return (
    <points geometry={geom} scale={scale} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function PathwayRibbons({
  centroids,
  scale = 0.42,
}: {
  centroids: Record<string, [number, number, number, number]>;
  scale?: number;
}) {
  const keys = useMemo(
    () =>
      [
        ["sugar", "oa"],
        ["oa", "pam"],
        ["pam", "kenyon"],
        ["kenyon", "mbon"],
        ["sugar", "mn9"],
      ] as const,
    [],
  );
  const paths = useMemo(() => {
    return keys
      .map(([a, b]) => {
        const A = centroids[a];
        const B = centroids[b];
        if (!A || !B) return null;
        const pts: [number, number, number][] = [];
        for (let i = 0; i <= 12; i++) {
          const t = i / 12;
          pts.push([
            A[0] + (B[0] - A[0]) * t,
            A[1] + (B[1] - A[1]) * t + Math.sin(t * Math.PI) * 0.25,
            A[2] + (B[2] - A[2]) * t,
          ]);
        }
        return pts;
      })
      .filter((p): p is [number, number, number][] => p !== null);
  }, [centroids, keys]);

  const welfare = useProtocol((s) => s.snapshot.welfare);

  return (
    <group scale={scale}>
      {paths.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color="#d6d2c8"
          transparent
          opacity={0.12 + welfare * 0.4}
          lineWidth={1}
        />
      ))}
    </group>
  );
}
