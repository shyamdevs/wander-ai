import { useEffect, useMemo, useState } from "react";
import { dayDate, fmtDate, isoDate } from "../utils/dates";
import api from "../api/axios";

const cache = new Map();

// WMO weather codes -> a coarse kind
export function weatherKind(code) {
  if (code === 0 || code === 1) return { kind: "clear", label: "Clear" };
  if (code === 2 || code === 3) return { kind: "cloud", label: "Cloudy" };
  if (code === 45 || code === 48) return { kind: "fog", label: "Fog" };
  if (code >= 51 && code <= 67) return { kind: "rain", label: "Rain" };
  if (code >= 80 && code <= 82) return { kind: "rain", label: "Showers" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { kind: "snow", label: "Snow" };
  if (code >= 95) return { kind: "storm", label: "Thunderstorm" };
  return { kind: "cloud", label: "Mixed" };
}

/**
 * Real forecast from Open-Meteo. The public endpoint is for non-commercial use; commercial deployments need a paid key. Only covers the next ~16 days, so trips
 * further out simply show nothing rather than a guess.
 */
export default function useWeather(plan) {
  const lat = plan?.destinationCoords?.latitude;
  const lon = plan?.destinationCoords?.longitude;
  const [daily, setDaily] = useState(null);

  useEffect(() => {
    if (lat == null || lon == null) return setDaily(null);
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    let dead = false;
    if (!cache.has(key)) {
      cache.set(key, api.get("/weather", { params: { latitude: lat, longitude: lon } })
        .then((response) => response.data?.daily || null)
        .catch(() => { cache.delete(key); return null; }));
    }
    cache.get(key).then((d) => { if (!dead) setDaily(d); });
    return () => { dead = true; };
  }, [lat, lon]);

  return useMemo(() => {
    const forDay = (dayNo) => {
      const d = dayDate(plan?.startDate, dayNo);
      const i = d && daily ? daily.time.indexOf(isoDate(d)) : -1;
      if (i < 0) return null;
      return {
        ...weatherKind(daily.weather_code[i]),
        max: Math.round(daily.temperature_2m_max[i]),
        min: Math.round(daily.temperature_2m_min[i]),
        rain: daily.precipitation_probability_max[i],
      };
    };
    const lines = (plan?.itinerary || []).flatMap((day) => {
      const w = forDay(day.day);
      return w ? [`Day ${day.day} (${fmtDate(dayDate(plan.startDate, day.day))}): ${w.label}, ${w.min}-${w.max}°C, rain chance ${w.rain ?? "n/a"}%`] : [];
    });
    return { forDay, summary: lines.join("; ") };
  }, [plan, daily]);
}
