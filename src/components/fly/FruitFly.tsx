import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { flyDrive } from "@/lib/brain/simulate";
import { makeAbdomenTexture, makeEyeTexture } from "@/lib/fly/textures";
import { getEngine, useProtocol } from "@/store/protocol";

const DROPLET = new THREE.Vector3(1.15, 0.02, 0.15);
const SCREEN = new THREE.Vector3(0.55, 0, 0.12);
const DISH_R = 2.15;
const tmp = new THREE.Vector3();
void tmp;

type Pose = {
  x: number;
  z: number;
  yaw: number;
  per: number;
  groom: number;
  bob: number;
};

export function FruitFly() {
  const root = useRef<THREE.Group>(null);
  const proboscis = useRef<THREE.Group>(null);
  const wings = useRef<[THREE.Mesh | null, THREE.Mesh | null]>([null, null]);
  const pose = useRef<Pose>({ x: -0.4, z: 0.3, yaw: 0.4, per: 0, groom: 0, bob: 0 });
  const eyeTex = useMemo(() => makeEyeTexture(), []);
  const abdTex = useMemo(() => makeAbdomenTexture(), []);
  const mats = useMemo(() => {
    const body = new THREE.MeshStandardMaterial({
      color: "#c9a36a",
      roughness: 0.55,
      metalness: 0.04,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: "#2a221c",
      roughness: 0.62,
    });
    const eye = new THREE.MeshStandardMaterial({
      map: eyeTex,
      color: "#b42323",
      roughness: 0.28,
      metalness: 0.12,
      emissive: "#4a0c0c",
      emissiveIntensity: 0.18,
    });
    const wing = new THREE.MeshPhysicalMaterial({
      color: "#dfe8e4",
      transparent: true,
      opacity: 0.28,
      roughness: 0.12,
      transmission: 0.65,
      thickness: 0.05,
      side: THREE.DoubleSide,
    });
    return { body, dark, eye, wing };
  }, [eyeTex]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const { stimulus } = useProtocol.getState();
    const engine = getEngine();
    const drive = flyDrive(stimulus, engine.state, engine.stimElapsed);
    const p = pose.current;
    const t = engine.time;

    let targetX = p.x;
    let targetZ = p.z;
    if (drive.goal === "droplet") {
      targetX = DROPLET.x - 0.42;
      targetZ = DROPLET.z;
    } else if (drive.goal === "screen") {
      const skip = drive.walkSpeed > 0.2 ? Math.sin(t * 2.4) * 0.35 : 0;
      targetX = SCREEN.x + skip;
      targetZ = SCREEN.z + skip * 0.2;
    } else if (drive.goal === "circle") {
      const a = t * (1.4 + drive.walkSpeed);
      targetX = Math.cos(a) * 1.15;
      targetZ = Math.sin(a) * 1.15;
    } else if (drive.goal === "wander") {
      targetX = Math.cos(t * 0.17) * 1.05 + Math.sin(t * 0.41) * 0.35;
      targetZ = Math.sin(t * 0.13) * 1.05;
    }

    const dx = targetX - p.x;
    const dz = targetZ - p.z;
    const dist = Math.hypot(dx, dz);
    let desiredYaw = Math.atan2(dx, dz);
    if (drive.goal === "screen" && drive.walkSpeed < 0.2) {
      desiredYaw = Math.atan2(1.22 - p.x, 0.08 - p.z);
    }
    let yawErr = desiredYaw - p.yaw;
    while (yawErr > Math.PI) yawErr -= Math.PI * 2;
    while (yawErr < -Math.PI) yawErr += Math.PI * 2;
    const turn = THREE.MathUtils.clamp(yawErr, -2.6 * dt, 2.6 * dt);
    p.yaw += turn + (Math.sin(t * 7.3) * drive.turnNoise * 0.35 + (Math.random() - 0.5) * drive.tremor) * dt;

    const step = drive.walkSpeed * dt;
    if (dist > 0.04) {
      p.x += Math.sin(p.yaw) * step;
      p.z += Math.cos(p.yaw) * step;
    }
    const r = Math.hypot(p.x, p.z);
    if (r > DISH_R - 0.25) {
      const k = (DISH_R - 0.25) / r;
      p.x *= k;
      p.z *= k;
    }

    p.per = THREE.MathUtils.damp(p.per, drive.per, 6, dt);
    p.groom = THREE.MathUtils.damp(p.groom, drive.groom, 4, dt);
    p.bob = Math.sin(t * (6 + drive.walkSpeed * 8)) * 0.012 * (drive.walkSpeed + 0.15);

    const g = root.current;
    if (g) {
      g.position.set(p.x, 0.04 + p.bob, p.z);
      g.rotation.set(0, p.yaw, Math.sin(t * 11) * drive.tremor * 0.08);
    }
    if (proboscis.current) {
      const ext = p.per;
      proboscis.current.rotation.x = 0.15 + ext * 1.05;
      proboscis.current.scale.setScalar(0.7 + ext * 0.85);
      proboscis.current.position.y = -0.02 - ext * 0.04;
    }
    const flap = 0.18 + drive.walkSpeed * 0.12;
    const droop = drive.wingDroop;
    wings.current.forEach((w, i) => {
      if (!w) return;
      const side = i === 0 ? 1 : -1;
      w.rotation.z = side * (0.22 + droop * 0.5);
      w.rotation.x = -0.15 - droop * 0.4 + Math.sin(t * 42 + i) * flap * (1 - droop);
    });
  });

  return (
    <group ref={root}>
      <group scale={5.4} position={[0, 0.34, 0]}>
        <mesh position={[0, 0.07, 0.02]} castShadow material={mats.dark}>
          <sphereGeometry args={[0.11, 20, 16]} />
        </mesh>
        <mesh position={[0, 0.05, -0.16]} rotation={[0.18, 0, 0]} castShadow>
          <sphereGeometry args={[0.1, 18, 14]} />
          <meshStandardMaterial map={abdTex} roughness={0.58} color="#d4b07a" />
        </mesh>
        <mesh position={[0, 0.04, -0.26]} rotation={[0.28, 0, 0]} scale={[0.72, 0.62, 1]} castShadow>
          <sphereGeometry args={[0.08, 14, 12]} />
          <meshStandardMaterial map={abdTex} roughness={0.6} color="#a07848" />
        </mesh>
        <mesh position={[0, 0.085, 0.14]} castShadow material={mats.body}>
          <sphereGeometry args={[0.085, 20, 16]} />
        </mesh>
        <mesh position={[0.07, 0.09, 0.16]} rotation={[0, 0.45, 0.12]} scale={[1.05, 1.2, 1.35]} castShadow material={mats.eye}>
          <sphereGeometry args={[0.058, 16, 12]} />
        </mesh>
        <mesh position={[-0.07, 0.09, 0.16]} rotation={[0, -0.45, -0.12]} scale={[1.05, 1.2, 1.35]} castShadow material={mats.eye}>
          <sphereGeometry args={[0.058, 16, 12]} />
        </mesh>
        <mesh position={[0.02, 0.14, 0.18]} rotation={[0.6, 0.3, 0]} material={mats.dark}>
          <cylinderGeometry args={[0.004, 0.004, 0.08, 6]} />
        </mesh>
        <mesh position={[-0.02, 0.14, 0.18]} rotation={[0.6, -0.3, 0]} material={mats.dark}>
          <cylinderGeometry args={[0.004, 0.004, 0.08, 6]} />
        </mesh>
        <group ref={proboscis} position={[0, 0.04, 0.2]}>
          <mesh>
            <cylinderGeometry args={[0.012, 0.008, 0.11, 8]} />
            <meshStandardMaterial color="#6a4a3a" roughness={0.5} />
          </mesh>
        </group>
        <mesh
          ref={(n) => {
            wings.current[0] = n;
          }}
          position={[0.12, 0.1, -0.02]}
          material={mats.wing}
        >
          <planeGeometry args={[0.28, 0.16]} />
        </mesh>
        <mesh
          ref={(n) => {
            wings.current[1] = n;
          }}
          position={[-0.12, 0.1, -0.02]}
          material={mats.wing}
        >
          <planeGeometry args={[0.28, 0.16]} />
        </mesh>
        <Leg side={1} dark={mats.dark} />
        <Leg side={-1} dark={mats.dark} />
      </group>
    </group>
  );
}

function Leg({ side, dark }: { side: number; dark: THREE.Material }) {
  return (
    <group position={[side * 0.08, 0.02, 0.02]}>
      <mesh position={[side * 0.04, -0.08, 0.06]} rotation={[0.4, 0, side * 0.5]} material={dark}>
        <cylinderGeometry args={[0.008, 0.006, 0.16, 6]} />
      </mesh>
      <mesh position={[side * 0.05, -0.08, -0.02]} rotation={[0.15, 0, side * 0.45]} material={dark}>
        <cylinderGeometry args={[0.008, 0.006, 0.16, 6]} />
      </mesh>
      <mesh position={[side * 0.04, -0.08, -0.1]} rotation={[-0.25, 0, side * 0.4]} material={dark}>
        <cylinderGeometry args={[0.008, 0.006, 0.16, 6]} />
      </mesh>
    </group>
  );
}
