import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { BrainCloud, PathwayRibbons } from "@/components/brain/BrainCloud";
import { Arena } from "@/components/fly/Arena";
import { FruitFly } from "@/components/fly/FruitFly";
import { Lights } from "@/components/scene/Lights";
import type { Meta, Somata } from "@/lib/brain/load-somata";
import { publishSnapshot, useProtocol } from "@/store/protocol";

const TARGETS: Record<string, THREE.Vector3> = {
  both: new THREE.Vector3(0.1, 0.45, 0.05),
  fly: new THREE.Vector3(0.2, 0.32, 0.05),
  brain: new THREE.Vector3(-2.45, 1.7, -0.4),
};

const CAM: Record<string, THREE.Vector3> = {
  both: new THREE.Vector3(1.85, 1.2, 2.65),
  fly: new THREE.Vector3(1.05, 0.78, 1.55),
  brain: new THREE.Vector3(-2.9, 2.05, 3.6),
};

type OrbitApi = { target: THREE.Vector3 };

function SimAndCamera() {
  const { camera } = useThree();
  const viewMode = useProtocol((s) => s.viewMode);
  const controls = useRef<OrbitApi>(null);
  const frame = useRef(0);
  const blend = useRef(1);

  useEffect(() => {
    blend.current = 1;
  }, [viewMode]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    useProtocol.getState().tick(dt);
    frame.current++;
    if (frame.current % 4 === 0) publishSnapshot();

    if (blend.current > 0.02 && controls.current) {
      const k = 1 - Math.exp(-dt * 2.2);
      camera.position.lerp(CAM[viewMode], k);
      controls.current.target.lerp(TARGETS[viewMode], k);
      blend.current *= Math.exp(-dt * 2.2);
    }
  });

  const autoRotate = useProtocol((s) => s.stimulus === "rest");

  return (
    <OrbitControls
      ref={controls as never}
      enableDamping
      dampingFactor={0.08}
      autoRotate={autoRotate}
      autoRotateSpeed={0.35}
      minDistance={1.05}
      maxDistance={14}
      maxPolarAngle={Math.PI * 0.49}
      target={[0.2, 0.32, 0.05]}
    />
  );
}

export function WorldCanvas({ somata, meta }: { somata: Somata; meta: Meta }) {
  const viewMode = useProtocol((s) => s.viewMode);
  const showFly = viewMode !== "brain";
  const showBrain = viewMode !== "fly";

  return (
    <Canvas
      className="h-full w-full touch-none"
      dpr={[1, 2]}
      shadows
      gl={{ antialias: true, alpha: false }}
      camera={{ position: [1.85, 1.2, 2.65], fov: 38, near: 0.08, far: 80 }}
    >
      <color attach="background" args={["#0b0c0e"]} />
      <fog attach="fog" args={["#0b0c0e", 8, 18]} />
      <Lights />
      <SimAndCamera />
      <group visible={showFly}>
        <Arena />
        <FruitFly />
      </group>
      <group visible={showBrain} position={[-2.15, 1.45, -0.45]} rotation={[0.1, 0.4, 0]}>
        <BrainCloud somata={somata} scale={0.28} />
        <PathwayRibbons centroids={meta.centroids} scale={0.28} />
      </group>
      {showFly && showBrain && (
        <Line
          points={[
            [0.12, 0.42, 0.22],
            [-0.9, 0.95, -0.1],
            [-2.15, 1.45, -0.45],
          ]}
          color="#3a3b40"
          transparent
          opacity={0.4}
          lineWidth={1}
        />
      )}
    </Canvas>
  );
}
