import * as THREE from "three";
import { latLonToVector3 } from "./utils";

// Muted Apple system colours, one per itinerary day
export const DAY_COLORS = ["#0A84FF", "#30D158", "#FF9F0A", "#BF5AF2", "#FF453A", "#64D2FF", "#FFD60A"];
export const dayColor = (day) => DAY_COLORS[(day - 1) % DAY_COLORS.length];

export const sameStop = (a, b) =>
  !!a && !!b && (a.sid && b.sid
    ? a.sid === b.sid
    : a.name === b.name && a.latitude === b.latitude && a.longitude === b.longitude);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Where should the camera look? Averages the visible stops into one direction
 * on the sphere, then zooms based on how spread out they are.
 * Returns plain numbers only (safe to keep in React state).
 */
export function computeFocus(plan, activeDay, focusStop) {
  let pts;
  if (focusStop) pts = [focusStop];
  else {
    const days = activeDay === "all" ? plan.itinerary : plan.itinerary.filter((d) => d.day === activeDay);
    pts = days.flatMap((d) => d.stops);
  }
  if (!pts.length) pts = [plan.destinationCoords];

  const vecs = pts.map((p) => latLonToVector3(p.latitude, p.longitude, 1));
  const center = vecs.reduce((acc, v) => acc.add(v), new THREE.Vector3()).normalize();
  if (center.lengthSq() === 0) center.set(0, 0, 1);

  const spread = Math.max(...vecs.map((v) => Math.acos(clamp(center.dot(v), -1, 1))));
  const r = clamp(1.14 + spread * 2.6, 1.14, 3.4);
  return { dir: [center.x, center.y, center.z], r, pinSize: (r - 1) * 0.025 + 0.003 };
}

// Camera focus for a place the user tapped on the globe (before any plan exists)
export function pickFocus(pick) {
  const v = latLonToVector3(pick.lat, pick.lon, 1).normalize();
  return { dir: [v.x, v.y, v.z], r: 2.8, pinSize: 0.022 };
}

// Days currently shown: all of them, or just the selected one
export const visibleDays = (plan, activeDay) =>
  activeDay === "all" ? plan.itinerary : plan.itinerary.filter((d) => d.day === activeDay);
