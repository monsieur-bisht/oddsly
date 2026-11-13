import { useEffect, useRef } from "react";

// A rotating sphere of points with perspective, drawn on a plain 2D canvas (no 3D library, no extra bytes).
export default function Background3D() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const N = window.innerWidth < 640 ? 70 : 120; // fewer points on phones
    // Evenly spread points on a unit sphere (Fibonacci lattice).
    const pts = Array.from({ length: N }, (_, i) => {
      const y = 1 - (2 * i + 1) / N;
      const r = Math.sqrt(1 - y * y);
      const t = i * 2.399963;
      return [Math.cos(t) * r, y, Math.sin(t) * r];
    });

    let w = 0;
    let h = 0;
    let dpr = 1;
    let angle = 0;
    let raf = 0;
    let lastW = 0;
    let lastH = 0;

    const resize = () => {
      lastW = window.innerWidth;
      lastH = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5); // cap resolution to save battery
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // On a tall phone screen the content card would hide a centered sphere, so make it larger and sit lower.
      const portrait = h > w;
      const R = portrait ? h * 0.3 : Math.min(w, h) * 0.42;
      const cx = w * 0.5;
      const cy = portrait ? h * 0.62 : h * 0.5;
      const [ca, sa] = [Math.cos(angle), Math.sin(angle)];
      const [cb, sb] = [Math.cos(angle * 0.6), Math.sin(angle * 0.6)];

      const p = pts.map(([x, y, z]) => {
        const x1 = x * ca + z * sa; // spin around the vertical axis
        const z1 = -x * sa + z * ca;
        const y2 = y * cb - z1 * sb; // slow tilt
        const z2 = y * sb + z1 * cb;
        const s = 1.8 / (2.6 - z2); // perspective: nearer points are bigger
        return [cx + x1 * R * s, cy + y2 * R * s, z2];
      });

      const maxDist = R * 0.4;
      ctx.lineWidth = dpr;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const d = Math.hypot(p[i][0] - p[j][0], p[i][1] - p[j][1]);
          if (d < maxDist) {
            const depth = (p[i][2] + p[j][2] + 2) / 4; // 0 (far) to 1 (near)
            ctx.strokeStyle = `rgba(52, 211, 153, ${(1 - d / maxDist) * 0.35 * (0.3 + depth)})`;
            ctx.beginPath();
            ctx.moveTo(p[i][0], p[i][1]);
            ctx.lineTo(p[j][0], p[j][1]);
            ctx.stroke();
          }
        }
      }
      for (const [x, y, z] of p) {
        const depth = (z + 1) / 2;
        ctx.fillStyle = `rgba(110, 231, 183, ${0.25 + depth * 0.6})`;
        ctx.beginPath();
        ctx.arc(x, y, (1 + depth * 2.2) * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let last = 0;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      const dt = last ? t - last : 33; // last is 0 on the first frame, which draws right away
      if (dt < 33) return; // about 30fps is plenty for a slow spin and saves battery
      angle += 0.00018 * Math.min(dt, 100); // radians per millisecond: same speed on any screen, no jump after a stall
      last = t;
      draw();
    };
    // Animate only when visible and motion is allowed; otherwise draw one still frame.
    const start = () => {
      cancelAnimationFrame(raf);
      if (reduceMotion.matches || document.hidden) draw();
      else {
        last = 0; // restart the clock after a pause
        raf = requestAnimationFrame(loop);
      }
    };
    const onResize = () => {
      // Phone address bars hide and show while scrolling and change only the height; don't rebuild for that.
      if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 120) return;
      resize();
      start();
    };

    resize();
    start();
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", start);
    reduceMotion.addEventListener("change", start);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", start);
      reduceMotion.removeEventListener("change", start);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
