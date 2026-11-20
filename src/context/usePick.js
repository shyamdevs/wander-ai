import { useRef, useState } from "react";

const GEOCODE = "https://nominatim.openstreetmap.org/reverse";
const fmt = (lat, lon) =>
  `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;

/**
 * Place picked by tapping the globe. Reverse-geocodes with OpenStreetMap (plain fetch,
 * so our JWT is never sent to a third party). Open ocean -> state "error".
 */
export default function usePick(onLabel) {
  const [pick, setPick] = useState(null); // { lat, lon, label, state: loading | ok | error }
  const seq = useRef(0);

  const clearPick = () => { seq.current++; setPick(null); };

  const pickPlace = async (lat, lon) => {
    const id = ++seq.current;
    setPick({ lat, lon, label: "", state: "loading" });
    let result = { label: fmt(lat, lon), state: "ok" }; // fallback if geocoder is offline
    try {
      const qs = new URLSearchParams({
        format: "jsonv2", lat: lat.toFixed(5), lon: lon.toFixed(5), zoom: "10", "accept-language": "en",
      });
      const data = await (await fetch(`${GEOCODE}?${qs}`)).json();
      if (data.error) result = { label: "", state: "error" };
      else {
        const a = data.address || {};
        const place = a.city || a.town || a.village || a.municipality || a.county || a.state_district || a.state || data.name;
        result = { label: [place, a.country].filter(Boolean).join(", ") || result.label, state: "ok" };
      }
    } catch { /* keep coordinate label */ }

    if (id !== seq.current) return; // user tapped somewhere else meanwhile
    setPick({ lat, lon, ...result });
    if (result.state === "ok") onLabel(result.label);
  };

  return { pick, pickPlace, clearPick };
}
