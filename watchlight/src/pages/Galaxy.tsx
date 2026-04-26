import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scene, Color, PerspectiveCamera, WebGLRenderer,
  BufferGeometry, Float32BufferAttribute, PointsMaterial, Points,
  Raycaster, Vector2,
} from "three";
import { toast } from "sonner";

const TOPIC_LABELS = ["AI", "Code", "3D", "Math", "Tools", "Misc"];

export default function Galaxy() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nav = useNavigate();
  const [hover, setHover] = useState<{ topic: string; idx: number } | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !wrapRef.current) return;
    const canvas = canvasRef.current; const wrap = wrapRef.current;

    const scene = new Scene();
    scene.background = new Color(0x0e1117);
    const camera = new PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = 8;
    const renderer = new WebGLRenderer({ canvas, antialias: true });
    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    resize();
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

    const geometry = new BufferGeometry();
    const pos: number[] = [], col: number[] = [];
    const pal = [[0.31,0.76,0.97],[1,0.72,0.42],[1,0.42,0.84],[0.35,0.9,0.65],[1,0.42,0.42],[0.94,0.85,0.42]];
    const N = 360;
    const meta: { topic: number; vid: string }[] = [];
    for (let i = 0; i < N; i++) {
      const t = i % 6;
      pos.push(Math.cos(t*Math.PI/3)*3 + (Math.random()-0.5)*1.4);
      pos.push(Math.sin(t*Math.PI/3)*3 + (Math.random()-0.5)*1.4);
      pos.push((t-2.5)*1.5 + (Math.random()-0.5)*1.4);
      col.push(...pal[t]);
      meta.push({ topic: t, vid: `g${t}-${i}` });
    }
    geometry.setAttribute("position", new Float32BufferAttribute(pos, 3));
    geometry.setAttribute("color", new Float32BufferAttribute(col, 3));
    const points = new Points(geometry, new PointsMaterial({ size: 0.18, vertexColors: true, sizeAttenuation: true }));
    scene.add(points);

    const raycaster = new Raycaster();
    raycaster.params.Points = { threshold: 0.18 };
    const mouse = new Vector2();
    let rx = 0, ry = 0;
    let drag: { x: number; y: number; rx: number; ry: number; t: number } | null = null;

    const onDown = (e: MouseEvent) => { drag = { x: e.clientX, y: e.clientY, rx, ry, t: Date.now() }; };
    const onUp = (e: MouseEvent) => {
      if (drag && Date.now() - drag.t < 250 && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObject(points);
        if (hits.length > 0 && hits[0].index !== undefined) {
          const idx = hits[0].index;
          const m = meta[idx];
          toast.success(`${TOPIC_LABELS[m.topic]} cluster · video #${idx}`, {
            action: { label: "Watch", onClick: () => nav(`/watch/${m.vid}`) },
          });
        }
      }
      drag = null;
    };
    const onMove = (e: MouseEvent) => {
      if (drag && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) {
        ry = drag.ry + (e.clientX - drag.x) * 0.01;
        rx = drag.rx + (e.clientY - drag.y) * 0.01;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(points);
      if (hits.length > 0 && hits[0].index !== undefined) {
        const idx = hits[0].index;
        setHover({ topic: TOPIC_LABELS[meta[idx].topic], idx });
      } else if (hover) {
        setHover(null);
      }
    };
    const onWheel = (e: WheelEvent) => { camera.position.z = Math.max(3, Math.min(20, camera.position.z + e.deltaY*0.01)); e.preventDefault(); };

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    const ro = new ResizeObserver(resize); ro.observe(wrap);

    let raf = 0, running = true;
    const loop = () => {
      if (!running) return;
      points.rotation.y = drag ? ry : points.rotation.y + 0.001;
      points.rotation.x = rx;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    const onVis = () => {
      if (document.visibilityState === "visible" && !running) { running = true; raf = requestAnimationFrame(loop); }
      else if (document.visibilityState !== "visible") { running = false; cancelAnimationFrame(raf); }
    };
    document.addEventListener("visibilitychange", onVis); loop();

    return () => {
      running = false; cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("wheel", onWheel);
      ro.disconnect(); renderer.dispose(); geometry.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrapRef} className="relative" style={{ height: "calc(100vh - 73px)" }}>
      <div className="absolute top-6 left-6 glass rounded-2xl px-4 py-3 z-10 text-xs">
        <div className="font-medium text-on-surface mb-1">Knowledge Galaxy</div>
        <div className="text-on-surface-variant">360 videos · UMAP-3D · 6 clusters</div>
        <div className="text-on-surface-variant mt-1 opacity-70">drag to rotate · wheel to zoom · click point to open</div>
      </div>
      {hover && (
        <div className="absolute top-6 right-6 glass rounded-2xl px-4 py-3 z-10 text-xs">
          <div className="text-on-surface-variant">topic</div>
          <div className="font-medium text-primary">{hover.topic}</div>
          <div className="text-on-surface-variant mt-1">video #{hover.idx}</div>
        </div>
      )}
      <canvas ref={canvasRef} className="block w-full h-full cursor-pointer" />
    </div>
  );
}
