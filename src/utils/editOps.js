// Pure itinerary edits: (plan, ...) -> new plan. Budget lines move by the cost of what changed.
export const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const withIds = (plan) => ({
  ...plan,
  itinerary: plan.itinerary.map((d) => ({ ...d, stops: d.stops.map((s) => (s.sid ? s : { ...s, sid: uid() })) })),
});

export function findStop(plan, sid) {
  for (const day of plan.itinerary) {
    const index = day.stops.findIndex((s) => s.sid === sid);
    if (index >= 0) return { day, index, stop: day.stops[index] };
  }
  return null;
}

const bucket = (c) => (c === "food" ? "food" : c === "stay" ? "stay" : c === "transport" ? "transport" : "activities");

function adjustCost(plan, delta, category) {
  if (!delta) return plan;
  const b = bucket(category);
  const cur = plan.breakdown[b].amount;
  const amount = Math.max(0, Math.round(cur + delta));
  const totalEstimated = plan.totalEstimated + (amount - cur);
  return {
    ...plan,
    breakdown: { ...plan.breakdown, [b]: { ...plan.breakdown[b], amount } },
    totalEstimated,
    remaining: plan.totalBudget - totalEstimated,
  };
}

const mapDay = (plan, dayNo, fn) => ({ ...plan, itinerary: plan.itinerary.map((d) => (d.day === dayNo ? fn(d) : d)) });

export function removeStop(plan, sid) {
  const f = findStop(plan, sid);
  if (!f) return plan;
  const next = mapDay(plan, f.day.day, (d) => ({ ...d, stops: d.stops.filter((s) => s.sid !== sid) }));
  return adjustCost(next, -(f.stop.estimatedCost || 0), f.stop.category);
}

export function moveStop(plan, sid, dir) {
  const f = findStop(plan, sid);
  const j = f ? f.index + dir : -1;
  if (!f || j < 0 || j >= f.day.stops.length) return plan;
  return mapDay(plan, f.day.day, (d) => {
    const stops = [...d.stops];
    [stops[f.index], stops[j]] = [stops[j], stops[f.index]];
    return { ...d, stops };
  });
}

export function moveStopToDay(plan, sid, toDay) {
  const f = findStop(plan, sid);
  if (!f || f.day.day === toDay || !plan.itinerary.some((d) => d.day === toDay)) return plan;
  const removed = mapDay(plan, f.day.day, (d) => ({ ...d, stops: d.stops.filter((s) => s.sid !== sid) }));
  return mapDay(removed, toDay, (d) => ({ ...d, stops: [...d.stops, f.stop] }));
}

export function insertStop(plan, dayNo, stop, index) {
  const s = stop.sid ? stop : { ...stop, sid: uid() };
  const next = mapDay(plan, dayNo, (d) => {
    const stops = [...d.stops];
    stops.splice(index ?? stops.length, 0, s);
    return { ...d, stops };
  });
  return adjustCost(next, s.estimatedCost || 0, s.category);
}

export function replaceStop(plan, sid, stop) {
  const f = findStop(plan, sid);
  if (!f) return plan;
  const s = { ...stop, sid: stop.sid || uid() };
  const next = mapDay(plan, f.day.day, (d) => ({ ...d, stops: d.stops.map((x) => (x.sid === sid ? s : x)) }));
  return adjustCost(adjustCost(next, -(f.stop.estimatedCost || 0), f.stop.category), s.estimatedCost || 0, s.category);
}

export function replaceDay(plan, dayNo, newDay) {
  const old = plan.itinerary.find((d) => d.day === dayNo);
  if (!old) return plan;
  let next = mapDay(plan, dayNo, () => ({ ...newDay, day: dayNo }));
  old.stops.forEach((s) => { next = adjustCost(next, -(s.estimatedCost || 0), s.category); });
  newDay.stops.forEach((s) => { next = adjustCost(next, s.estimatedCost || 0, s.category); });
  return next;
}
