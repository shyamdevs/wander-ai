import { useEffect } from "react";

// Normalised mouse position (-1..1), shared by every 3D object.
// Tracked on window so HTML overlays never block the 3D reaction.
export const pointer = { x: 0, y: 0 };

export function usePointerTracking() {
  useEffect(() => {
    const onMove = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
}
