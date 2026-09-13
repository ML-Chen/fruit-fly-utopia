import * as THREE from "three";

function hexGrid(ctx: CanvasRenderingContext2D, size: number, color: string, line: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = line;
  ctx.lineWidth = 1.2;
  const r = 7;
  const h = r * Math.sqrt(3);
  for (let row = -2; row < size / h + 2; row++) {
    for (let col = -2; col < size / (r * 1.5) + 2; col++) {
      const x = col * r * 1.5;
      const y = row * h + (col % 2 ? h / 2 : 0);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const px = x + r * Math.cos(a);
        const py = y + r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
}

export function makeEyeTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  hexGrid(ctx, size, "#6a1414", "#3a0808");
  const g = ctx.createRadialGradient(size * 0.35, size * 0.35, 10, size * 0.5, size * 0.5, size * 0.7);
  g.addColorStop(0, "rgba(255,180,140,0.28)");
  g.addColorStop(1, "rgba(20,0,0,0.35)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function makeAbdomenTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#c4a06a";
  ctx.fillRect(0, 0, size, size);
  const bands = [0.18, 0.34, 0.5, 0.66, 0.82];
  bands.forEach((y, i) => {
    ctx.fillStyle = i === bands.length - 1 ? "#2a221c" : "#3b2a1c";
    ctx.fillRect(0, y * size, size, size * 0.07);
  });
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(0, size * 0.88, size, size * 0.12);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

export function makeAgarTexture() {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#cfc6a8";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(90,80,50,${Math.random() * 0.07})`;
    ctx.fillRect(x, y, 2, 2);
  }
  const g = ctx.createRadialGradient(size / 2, size / 2, 40, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,240,0.08)");
  g.addColorStop(1, "rgba(40,36,24,0.22)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
