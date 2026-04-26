import { useEffect, useRef } from "react";
import {
  Scene, Color, PerspectiveCamera, WebGLRenderer,
  BufferGeometry, Float32BufferAttribute, PointsMaterial, Points,
} from "three";

export default function Galaxy() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    for (let i = 0; i < 360; i++) {
      const t = i % 6;
      pos.push(Math.cos(t*Math.PI/3)*3 + (Math.random()-0.5)*1.4);
      pos.push(Math.sin(t*Math.PI/3)*3 + (Math.random()-0.5)*1.4);
      pos.push((t-2.5)*1.5 + (Math.random()-0.5)*1.4);
      col.push(...pal[t]);
    }
    geometry.setAttribute("position", new Float32BufferAttribute(pos, 3));
    geometry.setAttribute("color", new Float32BufferAttribute(col, 3));
    const points = new Points(geometry, new PointsMaterial({ size: 0.12, vertexColors: true, sizeAttenuation: true }));
    scene.add(points);

    let rx = 0, ry = 0, drag: any = null;
    const onDown = (e: MouseEvent) => drag = { x: e.clientX, y: e.clientY, rx, ry };
    const onUp = () => drag = null;
    const onMove = (e: MouseEvent) => {
      if (!drag) return;
      ry = drag.ry + (e.clientX - drag.x) * 0.01;
      rx = drag.rx + (e.clientY - drag.y) * 0.01;
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
  }, []);

  return (
    <div ref={wrapRef} className="relative" style={{ height: "calc(100vh - 73px)" }}>
      <div className="absolute top-6 left-6 glass rounded-2xl px-4 py-3 z-10 text-xs">
        <div className="font-medium text-on-surface mb-1">Knowledge Galaxy</div>
        <div className="text-on-surface-variant">360 videos · UMAP-3D · 6 clusters</div>
        <div className="text-on-surface-variant mt-1 opacity-70">drag to rotate · wheel to zoom</div>
      </div>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
