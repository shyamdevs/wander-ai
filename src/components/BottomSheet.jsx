import { useEffect, useRef, useState } from "react";
import { motion, useDragControls } from "framer-motion";

const SNAPS = [0.14, 0.52, 0.92]; // visible fraction of the screen: peek / half / full

// Draggable bottom sheet for phones. Drag the handle (or tap it) to change height.
export default function BottomSheet({ snap, setSnap, children }) {
  const controls = useDragControls();
  const dragged = useRef(false); // a drag that ends over the handle also fires a click; ignore that one
  const [vh, setVh] = useState(() => window.innerHeight);
  useEffect(() => {
    const on = () => setVh(window.innerHeight);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--sheet-h", `${vh * SNAPS[snap]}px`);
    return () => document.documentElement.style.removeProperty("--sheet-h");
  }, [vh, snap]);

  const full = vh * SNAPS[2];
  const yFor = (i) => full - vh * SNAPS[i];

  const onDragEnd = (_, info) => {
    // Cleared on the next tick, after the trailing click event has been (and been ignored).
    setTimeout(() => { dragged.current = false; }, 0);
    const end = yFor(snap) + info.offset.y + info.velocity.y * 0.15;
    let best = 0;
    SNAPS.forEach((_s, i) => { if (Math.abs(end - yFor(i)) < Math.abs(end - yFor(best))) best = i; });
    setSnap(best);
  };

  return (
    <motion.div
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-10 flex flex-col glass-panel rounded-t-3xl border-b-0 bg-slate-950/85 shadow-2xl"
      style={{ height: full, "--hidden": `${yFor(snap)}px` }}
      animate={{ y: yFor(snap) }}
      transition={{ type: "spring", stiffness: 300, damping: 34 }}
      drag="y"
      dragControls={controls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: yFor(0) }}
      dragElastic={0.04}
      onDragStart={() => { dragged.current = true; }}
      onDragEnd={onDragEnd}
    >
      <button
        onPointerDown={(e) => controls.start(e)}
        onClick={() => { if (!dragged.current) setSnap((snap + 1) % SNAPS.length); }}
        aria-label="Resize panel"
        className="flex h-8 shrink-0 cursor-grab touch-none items-center justify-center"
      >
        <span className="h-1.5 w-10 rounded-full bg-white/30" />
      </button>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </motion.div>
  );
}
