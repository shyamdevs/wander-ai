const R = 6371;
const rad = (d) => (d * Math.PI) / 180;

export function haversineKm(a, b) {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Compass heading (0-360) from a to b — used to aim Street View at the destination
export function bearing(a, b) {
  const dLon = rad(b.longitude - a.longitude);
  const y = Math.sin(dLon) * Math.cos(rad(b.latitude));
  const x =
    Math.cos(rad(a.latitude)) * Math.sin(rad(b.latitude)) -
    Math.sin(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export const suggestMode = (km) => (km < 1.5 ? "WALK" : "DRIVE");

const SPEED_KMH = { WALK: 4.5, CYCLE: 15, DRIVE: 24, TRANSIT: 16 };
const EXTRA_MIN = { WALK: 0, CYCLE: 2, DRIVE: 3, TRANSIT: 10 }; // parking / waiting
const DETOUR = 1.35; // roads are longer than straight lines

// ESTIMATE from straight-line distance. Replaced by real Routes API data when available.
export function estimateLeg(a, b, mode = "AUTO") {
  const km = haversineKm(a, b) * DETOUR;
  const m = mode === "AUTO" ? suggestMode(km) : mode;
  return { km, minutes: Math.max(1, Math.round((km / SPEED_KMH[m]) * 60 + EXTRA_MIN[m])), mode: m, source: "estimate" };
}

export const fmtKm = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`);

export function fmtDuration(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
}

export function fmtTime(min) {
  const t = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(t / 60);
  return `${((h + 11) % 12) + 1}:${String(t % 60).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

// Google Maps URLs launch maps/search/directions without a Maps Platform API key.
// Omitting origin lets Google Maps use the device's current location when available.
export function directionsUrl({ destination, mode = "DRIVE" }) {
  const modes = { AUTO: "driving", WALK: "walking", WALKING: "walking", CYCLE: "bicycling", CYCLING: "bicycling", DRIVE: "driving", DRIVING: "driving", TRANSIT: "transit" };
  const params = new URLSearchParams({
    api: "1",
    destination: `${destination.latitude},${destination.longitude}`,
    travelmode: modes[mode] || "driving",
    dir_action: "navigate",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function placeUrl({ latitude, longitude, placeId }) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
}
