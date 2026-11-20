import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { pointer } from "./pointer";
import { view } from "./viewState";

// Spherical camera targets per route: r = distance, az = left/right orbit, pol = height
export const PRESETS = {
  landing: { r: 4.1, az: 0, pol: 1.45 },
  login: { r: 3.1, az: -0.5, pol: 1.4 },
  signup: { r: 3.1, az: 0.5, pol: 1.68 },
  app: { r: 3.4, az: 0, pol: 1.5 },
};

const MIN_R = 1.1;
const MAX_R = 8;

/**
 * `radius` (optional) = fly-in distance on the dashboard. The user's wheel/pinch zoom
 * (view.scale) multiplies it. Desktop: globe sits right of the side panel.
 * Phone: globe moves up, above the bottom sheet.
 */
export default function CameraRig({ preset, radius }) {
  const cur = useRef({ ...PRESETS.landing, lx: 0, ly: 0 });

  useFrame(({ camera, size }, dt) => {
    const t = PRESETS[preset];
    const c = cur.current;
    const isApp = preset === "app";
    const wide = size.width >= 1024;

    const base = (isApp && radius ? radius : t.r) * (isApp && !wide ? 1.55 : 1);
    let tr = base;
    if (isApp) {
      tr = THREE.MathUtils.clamp(base * view.scale, MIN_R, MAX_R);
      view.scale = tr / base; // stop "winding up" past the limits
      view.atMin = tr <= MIN_R + 0.02;
    }
    const tlx = isApp && wide ? -tr * 0.2 : 0;
    const tly = isApp && !wide ? -tr * 0.23 : 0;

    c.r = THREE.MathUtils.damp(c.r, tr, 3, dt);
    c.az = THREE.MathUtils.damp(c.az, t.az, 2.2, dt);
    c.pol = THREE.MathUtils.damp(c.pol, t.pol, 2.2, dt);
    c.lx = THREE.MathUtils.damp(c.lx, tlx, 2.4, dt);
    c.ly = THREE.MathUtils.damp(c.ly, tly, 2.4, dt);

    // Pins keep a readable size however far the user zooms
    view.pinScale = isApp ? THREE.MathUtils.clamp((c.r - 1) / Math.max(base - 1, 0.1), 0.3, 3) : 1;

    // Mouse parallax shrinks when zoomed in so pins stay put
    const f = THREE.MathUtils.clamp((c.r - 1) / 2, 0.15, 1);
    const az = c.az + pointer.x * 0.12 * f;
    const pol = c.pol - pointer.y * 0.08 * f;

    camera.position.set(
      c.r * Math.sin(pol) * Math.sin(az) + c.lx,
      c.r * Math.cos(pol) + c.ly,
      c.r * Math.sin(pol) * Math.cos(az)
    );
    camera.lookAt(c.lx, c.ly, 0);
  });

  return null;
}
