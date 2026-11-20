import { useEffect, useMemo, useState } from "react";
import { routeLeg } from "../api/places";
import { estimateLeg } from "../utils/geo";

/** legs[i] is the route from stop i-1 to stop i; real provider data replaces estimates. */
export default function useDayLegs(stops, mode, enabled) {
  const sig = stops.map((s) => `${s.sid}:${s.latitude},${s.longitude}`).join("|") + mode;
  const estimates = useMemo(
    () => stops.map((s, i) => (i ? estimateLeg(stops[i - 1], s, mode) : null)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sig]
  );
  const [real, setReal] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let dead = false;
    setReal({});
    if (!enabled || stops.length < 2 || mode === "TRANSIT") { setLoading(false); return undefined; }
    setLoading(true);
    Promise.all(stops.slice(1).map(async (stop, index) => {
      const i = index + 1;
      const route = await routeLeg(stops[i - 1], stop, estimates[i].mode);
      if (!route || !route.distanceMeters || !route.durationSeconds) return [i, null];
      return [i, {
        km: route.distanceMeters / 1000,
        minutes: Math.max(1, Math.round(route.durationSeconds / 60)),
        mode: estimates[i].mode,
        source: route.source || "route-provider",
        path: route.geometry || null,
      }];
    })).then((entries) => {
      if (dead) return;
      setReal(Object.fromEntries(entries.filter(([, value]) => value)));
      setLoading(false);
    });
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, enabled]);

  return { legs: useMemo(() => estimates.map((estimate, index) => real[index] || estimate), [estimates, real]), loading };
}
