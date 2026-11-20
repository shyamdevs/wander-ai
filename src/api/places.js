import api from "./axios";

// Request-level caches keep repeat interactions fast without persisting third-party place content.
const places = new Map();
const nearby = new Map();
const legs = new Map();
const streets = new Map();
const photoPages = new Map();
const keyOf = (s) => s.sid || `${s.name}|${s.latitude}|${s.longitude}`;

export function lookupPlace(stop, destination, radius) {
  const key = `${keyOf(stop)}|${radius || ""}`;
  if (!places.has(key)) {
    places.set(key, api.post("/places/lookup", {
      name: stop.name, latitude: stop.latitude, longitude: stop.longitude, destination, radius,
    }).then((r) => r.data).catch((error) => { places.delete(key); throw error; }));
  }
  return places.get(key);
}

export function nearbyPlaces({ latitude, longitude, kind }) {
  const key = `${latitude.toFixed(4)},${longitude.toFixed(4)},${kind}`;
  if (!nearby.has(key)) {
    nearby.set(key, api.post("/places/nearby", { latitude, longitude, kind })
      .then((r) => r.data.places || []).catch((error) => { nearby.delete(key); throw error; }));
  }
  return nearby.get(key);
}

export function searchDestinationPhotos({ name, destination, latitude, longitude, page = 1 }) {
  const key = `${name}|${destination || ""}|${latitude ?? ""},${longitude ?? ""}|${page}`;
  if (!photoPages.has(key)) {
    if (photoPages.size >= 200) photoPages.delete(photoPages.keys().next().value);
    photoPages.set(key, api.post("/places/photos", { name, destination, latitude, longitude, page })
      .then((r) => r.data).catch((error) => { photoPages.delete(key); throw error; }));
  }
  return photoPages.get(key);
}

const point = (stop) => ({ latitude: stop.latitude, longitude: stop.longitude });
export function routeLeg(origin, destination, mode) {
  const key = `${origin.latitude},${origin.longitude}|${destination.latitude},${destination.longitude}|${mode}`;
  if (!legs.has(key)) {
    legs.set(key, api.post("/places/route", { origin: point(origin), destination: point(destination), mode })
      .then((r) => {
        const route = r.data.route || null;
        if (!route) legs.delete(key);
        return route;
      })
      .catch(() => { legs.delete(key); return null; }));
  }
  return legs.get(key);
}

export function streetImagery({ latitude, longitude }) {
  const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  if (!streets.has(key)) {
    streets.set(key, api.get("/places/street", { params: { latitude, longitude } })
      .then((r) => r.data).catch((error) => { streets.delete(key); throw error; }));
  }
  return streets.get(key);
}
