import { useEffect, useRef } from "react";
// A5: named imports so unused Three.js submodules can tree-shake.
import {
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  Points,
} from "three";

export default function Galaxy() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !wrapRef.current) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;

    const scene = new Scene();
    scene.background = new Color(0x0a0e1a);
    const camera = new PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new WebGLRenderer({ canvas, antialias: true });
    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

    const geometry = new BufferGeometry();
    const pos: number[] = [];
    const col: number[] = [];
    const topicPal = [
      [0.31, 0.76, 0.97], [1.0, 0.72, 0.42], [1.0, 0.42, 0.84],
      [0.35, 0.9, 0.65], [1.0, 0.42, 0.42], [0.94, 0.85, 0.42],
    ];
    const totalPts = 300;
    for (let i = 0; i < totalPts; i++) {
      const topic = i % 6;
      const cx = Math.cos((topic * Math.PI) / 3) * 3;
      const cy = Math.sin((topic * Math.PI) / 3) * 3;
      const cz = (topic - 2.5) * 1.5;
      pos.push(cx + (Math.random() - 0.5) * 1.4);
      pos.push(cy + (Math.random() - 0.5) * 1.4);
      pos.push(cz + (Math.random() - 0.5) * 1.4);
      col.push(topicPal[topic][0], topicPal[topic][1], topicPal[topic][2]);
    }
    geometry.setAttribute("position", new Float32BufferAttribute(pos, 3));
    geometry.setAttribute("color", new Float32BufferAttribute(col, 3));
    const mat = new PointsMaterial({ size: 0.12, vertexColors: true, sizeAttenuation: true });
    const points = new Points(geometry, mat);
    scene.add(points);

    let rx = 0, ry = 0;
    let drag: { x: number; y: number; rx: number; ry: number } | null = null;
    const onDown = (e: MouseEvent) => { drag = { x: e.clientX, y: e.clientY, rx, ry }; };
    const onUp = () => { drag = null; };
    const onMove = (e: MouseEvent) => {
      if (!drag) return;
      ry = drag.ry + (e.clientX - drag.x) * 0.01;
      rx = drag.rx + (e.clientY - drag.y) * 0.01;
    };
    const onWheel = (e: WheelEvent) => {
      camera.position.z = Math.max(3, Math.min(20, camera.position.z + e.deltaY * 0.01));
      e.preventDefault();
    };
    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    const ro = new ResizeObserver(resize); ro.observe(wrap);

    // A4: pause the RAF loop entirely when the tab is hidden.
    let raf = 0;
    let running = true;
    const loop = () => {
      if (!running) return;
      points.rotation.y = drag ? ry : points.rotation.y + 0.001;
      points.rotation.x = rx;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    const onVis = () => {
      if (document.visibilityState === "visible" && !running) {
        running = true;
        raf = requestAnimationFrame(loop);
      } else if (document.visibilityState !== "visible") {
        running = false;
        cancelAnimationFrame(raf);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    loop();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("wheel", onWheel);
      ro.disconnect();
      renderer.dispose();
      geometry.dispose();
      mat.dispose();
    };
  }, []);

  return (
    <div ref={wrapRef} className="w-full h-full relative">
      <div className="absolute top-4 left-4 bg-bg/80 border border-border px-3 py-2 text-xs z-10">
        <div><span className="text-dim">videos </span><span className="text-accent">300</span></div>
        <div><span className="text-dim">projection </span><span className="text-accent">UMAP-3D</span></div>
        <div><span className="text-dim">rotate </span><span className="text-accent">drag </span><span className="text-dim">zoom </span><span className="text-accent">wheel</span></div>
      </div>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
