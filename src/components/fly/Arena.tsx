import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { makeAgarTexture } from "@/lib/fly/textures";
import { useProtocol } from "@/store/protocol";
import type { Stimulus } from "@/lib/brain/simulate";

function dropletColor(s: Stimulus) {
  if (s === "hedonium") return "#f2efe6";
  return "#d8c48a";
}

export function Arena() {
  const agar = useMemo(() => makeAgarTexture(), []);
  const stimulus = useProtocol((s) => s.stimulus);
  const showDrop = stimulus === "sugar" || stimulus === "hedonium";
  const showEthanol = stimulus === "ethanol";
  const showCocaine = stimulus === "cocaine";
  const showPhone = stimulus === "doomscroll";

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <circleGeometry args={[2.45, 64]} />
        <meshStandardMaterial map={agar} roughness={0.85} color="#c8bfa4" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[2.45, 2.58, 64]} />
        <meshStandardMaterial color="#8a8d92" metalness={0.55} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[2.52, 2.52, 0.44, 64, 1, true]} />
        <meshPhysicalMaterial
          color="#c5c8cc"
          transparent
          opacity={0.18}
          roughness={0.08}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {showDrop && <Droplet color={dropletColor(stimulus)} glow={stimulus === "hedonium"} />}
      {showEthanol && <EthanolPool />}
      {showCocaine && <CocainePile />}
      {showPhone && <Phone />}
    </group>
  );
}

function Droplet({ color, glow }: { color: string; glow: boolean }) {
  return (
    <mesh position={[1.15, 0.09, 0.15]}>
      <sphereGeometry args={[0.13, 24, 16]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.08}
        transmission={0.55}
        thickness={0.4}
        ior={1.33}
        transparent
        opacity={0.85}
        emissive={glow ? "#f0e6c8" : "#000000"}
        emissiveIntensity={glow ? 0.65 : 0}
      />
    </mesh>
  );
}

function EthanolPool() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshPhysicalMaterial;
      m.opacity = 0.34 + Math.sin(clock.elapsedTime * 1.4) * 0.04;
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <circleGeometry args={[1.85, 48]} />
      <meshPhysicalMaterial
        color="#8a6a32"
        roughness={0.12}
        transparent
        opacity={0.35}
        transmission={0.3}
        thickness={0.2}
      />
    </mesh>
  );
}

function CocainePile() {
  const grains = useMemo(() => {
    const pos = new Float32Array(90 * 3);
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() ** 0.6 * 0.28;
      pos[i * 3] = 0.85 + Math.cos(a) * r;
      pos[i * 3 + 1] = 0.03 + Math.random() * 0.04;
      pos[i * 3 + 2] = -0.7 + Math.sin(a) * r;
    }
    return pos;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[grains, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#f4f1ea" size={0.035} sizeAttenuation />
    </points>
  );
}

function Phone() {
  const screen = useRef<THREE.MeshStandardMaterial>(null);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 448;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, texture: t };
  }, []);

  useFrame(({ clock }) => {
    const ctx = tex.canvas.getContext("2d");
    if (!ctx) return;
    const t = clock.elapsedTime;
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, 256, 448);
    for (let i = 0; i < 6; i++) {
      const y = ((t * 40 + i * 80) % 520) - 60;
      ctx.fillStyle = i % 2 === 0 ? "#3d5a9e" : "#6a8fd4";
      ctx.fillRect(16, y, 224, 70);
      ctx.fillStyle = "#dce6ff";
      ctx.fillRect(28, y + 14, 120, 8);
      ctx.fillStyle = "#8aa0c8";
      ctx.fillRect(28, y + 30, 180, 6);
    }
    tex.texture.needsUpdate = true;
    if (screen.current) screen.current.emissiveIntensity = 0.85 + Math.sin(t * 4) * 0.12;
  });

  return (
    <group position={[1.22, 0.62, 0.08]} rotation={[0, -0.55, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.42, 0.78, 0.04]} />
        <meshStandardMaterial color="#1a1c20" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.022]}>
        <planeGeometry args={[0.36, 0.7]} />
        <meshStandardMaterial
          ref={screen}
          map={tex.texture}
          emissive="#6a8fd4"
          emissiveIntensity={0.9}
          emissiveMap={tex.texture}
        />
      </mesh>
      <mesh position={[0, -0.42, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.18]} />
        <meshStandardMaterial color="#2a2c30" roughness={0.5} />
      </mesh>
    </group>
  );
}
