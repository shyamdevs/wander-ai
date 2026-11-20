import * as THREE from "three";

// lat/lon (degrees) -> point on a sphere. Reused in Phase 3 for trip pins.
export function latLonToVector3(lat, lon, radius = 1) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Evenly distributed points on a sphere -> the dotted-globe look (no textures needed)
export function fibonacciSphere(count, radius = 1) {
  const arr = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = golden * i;
    arr.set([Math.cos(a) * r * radius, y * radius, Math.sin(a) * r * radius], i * 3);
  }
  return arr;
}

export const CITIES = {
  jaipur: [26.91, 75.79],
  london: [51.5, -0.12],
  newyork: [40.71, -74.0],
  tokyo: [35.68, 139.69],
  sydney: [-33.86, 151.2],
  dubai: [25.2, 55.27],
  capetown: [-33.92, 18.42],
  rio: [-22.9, -43.17],
};

export const ARC_PAIRS = [
  ["jaipur", "london"], ["jaipur", "tokyo"], ["london", "newyork"],
  ["dubai", "sydney"], ["newyork", "rio"], ["capetown", "dubai"],
  ["tokyo", "sydney"],
];

// Point on sphere (local coords) -> lat/lon in degrees. Inverse of latLonToVector3.
export function vectorToLatLon(v) {
  const r = v.length() || 1;
  const lat = (Math.asin(v.y / r) * 180) / Math.PI;
  let lon = (Math.atan2(v.z, -v.x) * 180) / Math.PI - 180;
  if (lon < -180) lon += 360;
  return { lat, lon };
}
