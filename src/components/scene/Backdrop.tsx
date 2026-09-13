import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles, Stars } from "@react-three/drei";
import * as THREE from "three";

const AURORA_VERT = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const AURORA_FRAG = /* glsl */ `
uniform float uTime;
uniform float uAmp;
varying vec3 vWorld;

vec3 hsl2rgb(float h, float s, float l) {
  vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
}

void main() {
  vec3 dir = normalize(vWorld);
  float elev = dir.y;
  float az = atan(dir.z, dir.x);
  float t = uTime;
  float wave = sin(az * 3.2 + t * 0.18 + elev * 5.0);
  float wave2 = sin(az * 6.0 - t * 0.11 + elev * 2.4);
  float h = fract(az / 6.2831853 + t * 0.028 + elev * 0.22 + wave * 0.04);
  vec3 a = hsl2rgb(h, 0.88, 0.48);
  vec3 b = hsl2rgb(fract(h + 0.18 + wave2 * 0.04), 0.75, 0.38);
  vec3 mixed = mix(a, b, 0.5 + 0.5 * wave);
  float curtain = smoothstep(-0.15, 0.72, elev) * (0.28 + 0.55 * (0.55 + 0.45 * wave));
  curtain *= uAmp;
  vec3 well = vec3(0.035, 0.036, 0.042);
  vec3 col = mix(well, mixed, clamp(curtain, 0.0, 1.0));
  float n = fract(sin(dot(dir.xy * 40.0, vec2(12.9898, 78.233))) * 43758.5453);
  col += vec3(0.85, 0.9, 1.0) * step(0.997, n) * smoothstep(0.0, 0.5, elev);
  gl_FragColor = vec4(col, 1.0);
}
`;

function AuroraSky({ amp }: { amp: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const ampRef = useRef(amp);
  ampRef.current = amp;
  useFrame(({ clock }) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value = clock.elapsedTime;
    mat.current.uniforms.uAmp.value = THREE.MathUtils.damp(mat.current.uniforms.uAmp.value, ampRef.current, 1.4, 0.016);
  });
  return (
    <mesh scale={[-1, 1, 1]} renderOrder={-10}>
      <sphereGeometry args={[22, 48, 32]} />
      <shaderMaterial
        ref={mat}
        vertexShader={AURORA_VERT}
        fragmentShader={AURORA_FRAG}
        uniforms={{ uTime: { value: 0 }, uAmp: { value: amp } }}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

function SpectrumHalo() {
  const mesh = useRef<THREE.Group>(null);
  const geo = useMemo(() => {
    const g = new THREE.TorusGeometry(6.4, 0.035, 10, 160);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const h = (Math.atan2(pos.getY(i), pos.getX(i)) / Math.PI + 1) * 0.5;
      c.setHSL(h, 0.95, 0.58);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  useFrame((_, dt) => {
    if (mesh.current) mesh.current.rotation.z += dt * 0.05;
  });
  return (
    <group ref={mesh} position={[0, 1.6, -1.4]} rotation={[0.55, 0.2, 0]}>
      <mesh geometry={geo}>
        <meshBasicMaterial vertexColors transparent opacity={0.8} toneMapped={false} />
      </mesh>
      <mesh geometry={geo} scale={[1.08, 1.08, 1.08]}>
        <meshBasicMaterial vertexColors transparent opacity={0.22} toneMapped={false} />
      </mesh>
    </group>
  );
}

const ORB_HUES = [0, 0.08, 0.16, 0.33, 0.5, 0.62, 0.75, 0.88];

function SpectrumOrbs() {
  const group = useRef<THREE.Group>(null);
  const lights = useRef<THREE.PointLight[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (group.current) group.current.rotation.y = t * 0.07;
    lights.current.forEach((l, i) => {
      if (!l) return;
      l.intensity = 0.22 + Math.sin(t * 0.9 + i) * 0.08;
    });
  });
  return (
    <group ref={group}>
      {ORB_HUES.map((h, i) => {
        const a = (i / ORB_HUES.length) * Math.PI * 2;
        const y = 1.15 + Math.sin(i * 1.7) * 0.85;
        const r = 4.6 + (i % 2) * 0.7;
        const color = new THREE.Color().setHSL(h, 0.9, 0.58);
        return (
          <group key={h} position={[Math.cos(a) * r, y, Math.sin(a) * r]}>
            <mesh>
              <sphereGeometry args={[0.07, 12, 10]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            <mesh scale={2.4}>
              <sphereGeometry args={[0.07, 10, 8]} />
              <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} toneMapped={false} />
            </mesh>
            <pointLight
              ref={(n) => {
                if (n) lights.current[i] = n;
              }}
              color={color}
              intensity={0.25}
              distance={7}
              decay={2}
            />
          </group>
        );
      })}
    </group>
  );
}

function MirrorFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
      <circleGeometry args={[11, 64]} />
      <meshStandardMaterial color="#0c0d10" metalness={0.82} roughness={0.22} envMapIntensity={0.8} />
    </mesh>
  );
}

export function Backdrop({ amp = 1 }: { amp?: number }) {
  return (
    <group>
      <AuroraSky amp={amp} />
      <SpectrumHalo />
      <SpectrumOrbs />
      <MirrorFloor />
      <Stars radius={28} depth={18} count={1200} factor={3.2} fade speed={0.4} />
      <Sparkles count={70} scale={[16, 7, 16]} size={2.6} speed={0.28} opacity={0.45} color="#f2f0ff" />
      <Sparkles count={40} scale={[14, 6, 14]} size={4} speed={0.18} opacity={0.28} color="#7ad0ff" />
    </group>
  );
}
