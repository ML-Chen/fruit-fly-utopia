import { useProtocol } from "@/store/protocol";

export function Lights() {
  const stimulus = useProtocol((s) => s.stimulus);
  const key =
    stimulus === "utopia"
      ? "#f0ead8"
      : stimulus === "ethanol"
        ? "#c4a56a"
        : stimulus === "cocaine"
          ? "#e8e4dc"
          : stimulus === "doomscroll"
            ? "#9aa8c8"
            : stimulus === "sugar"
              ? "#e2d2a8"
              : "#d4d0c8";
  const fill = stimulus === "utopia" ? 0.55 : stimulus === "cocaine" ? 0.42 : stimulus === "doomscroll" ? 0.38 : 0.22;

  return (
    <>
      <ambientLight intensity={0.28} color="#c8c6c0" />
      <directionalLight
        position={[4, 7, 5]}
        intensity={1.15}
        color={key}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 3, -2]} intensity={fill} color="#8a9aa8" />
      <pointLight
        position={[1.15, 0.4, 0.15]}
        intensity={stimulus === "utopia" ? 1.4 : stimulus === "sugar" ? 0.35 : 0.12}
        color="#f2ead4"
        distance={4}
      />
      {stimulus === "doomscroll" && (
        <pointLight position={[1.2, 0.7, 0.05]} intensity={1.6} color="#7aa0ff" distance={3.5} />
      )}
    </>
  );
}
