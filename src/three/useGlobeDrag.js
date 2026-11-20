import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { zoomBy } from "./viewState";

// Drag to rotate (360°); wheel / pinch zoom only when an onDeepZoom handler is given (dashboard). Only starts on the canvas itself,
// never on UI panels above it. Globe reads and clears { dx, dy } every frame.
export function useGlobeDrag(enabled, onDeepZoom) {
  const { gl } = useThree();
  const state = useRef({ dx: 0, dy: 0, inertia: 0, dragging: false });
  const deep = useRef(onDeepZoom);
  deep.current = onDeepZoom;

  useEffect(() => {
    if (!enabled) return;
    const el = gl.domElement;
    const s = state.current;
    const pts = new Map();
    let last = null;
    let pinch = 0;
    const dist = () => {
      const [a, b] = [...pts.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const down = (e) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) { pinch = dist(); s.dragging = false; last = null; return; }
      last = { x: e.clientX, y: e.clientY };
      s.dragging = true;
      s.inertia = 0;
    };
    const move = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const d = dist();
        if (deep.current && pinch > 0 && zoomBy(pinch / d)) deep.current();
        pinch = d;
        return;
      }
      if (!last) return;
      const dx = e.clientX - last.x;
      s.dx += dx;
      s.dy += e.clientY - last.y;
      s.inertia = dx * 0.006;
      last = { x: e.clientX, y: e.clientY };
    };
    const up = (e) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = 0;
      if (pts.size === 0) { last = null; s.dragging = false; }
    };
    const wheel = (e) => {
      if (!deep.current) return; // no zoom here (landing page): let the page scroll normally
      e.preventDefault();
      if (zoomBy(Math.exp(e.deltaY * 0.0012))) deep.current?.();
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [enabled, gl]);

  return state;
}