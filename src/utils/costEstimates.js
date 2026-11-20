const BUCKETS = ["transport", "stay", "food", "activities"];
const SHARES = { transport: 0.18, stay: 0.30, food: 0.25, activities: 0.27 };
const STOPS_PER_DAY = { transport: 2, stay: 1, food: 2, activities: 2 };
const STYLE_FACTOR = { budget: 0.82, balanced: 1, luxury: 1.65, relaxation: 1.2, adventure: 0.95, cultural: 0.95, foodie: 1.25 };
const bucketFor = (category) => category === "food" ? "food" : category === "stay" ? "stay" : category === "transport" ? "transport" : "activities";
const FREE_ENTRY = /\b(public park|park|parque|plaza|square|beach|public garden|garden|street|neighbourhood|neighborhood|promenade|waterfront|viewpoint|lake|riverwalk|bridge|market|botanical garden)\b/i;
const round = (value) => Math.max(0, Math.round(Number(value) || 0));

export function isLikelyFreeEntry(stop) {
  return ["sightseeing", "activity"].includes(stop?.category) && FREE_ENTRY.test(String(stop?.name || ""));
}

export function estimateStopCost(stop, plan) {
  const current = Number(stop?.estimatedCost);
  if (current > 0) return round(current);
  if (isLikelyFreeEntry(stop) || stop?.estimatedCostSource === "free-entry") return 0;

  const bucket = bucketFor(stop?.category);
  const days = Math.max(1, Number(plan?.durationDays) || plan?.itinerary?.length || 1);
  const budget = Math.max(0, Number(plan?.totalBudget) || 0);
  const style = STYLE_FACTOR[plan?.travelStyle] || 1;
  const stops = (plan?.itinerary || []).flatMap((day) => day.stops || []);
  const relevant = stops.filter((item) => bucketFor(item.category) === bucket && !isLikelyFreeEntry(item));
  const count = Math.max(STOPS_PER_DAY[bucket], relevant.length / days);
  const pool = Math.max(0, Number(plan?.breakdown?.[bucket]?.amount) || 0);
  const known = relevant.reduce((sum, item) => sum + Math.max(0, Number(item.estimatedCost) || 0), 0);
  const missingCount = Math.max(1, relevant.filter((item) => !(Number(item.estimatedCost) > 0)).length);
  const perDayBaseline = budget * SHARES[bucket] * style / days / count;
  const remainingPool = Math.max(0, pool - known) / missingCount;
  return round(Math.max(1, perDayBaseline, remainingPool));
}

/** Hydrates older saved trips and newly added places so no paid stop displays Unknown. */
export function withEstimatedCosts(plan) {
  if (!plan || !Array.isArray(plan.itinerary)) return plan;
  const itinerary = plan.itinerary.map((day) => ({
    ...day,
    stops: (day.stops || []).map((stop) => {
      const raw = Number(stop.estimatedCost);
      if (raw > 0) return { ...stop, estimatedCost: round(raw), estimatedCostSource: stop.estimatedCostSource || "ai-estimate" };
      if (isLikelyFreeEntry(stop)) return { ...stop, estimatedCost: 0, estimatedCostSource: "free-entry" };
      return { ...stop, estimatedCost: estimateStopCost(stop, plan), estimatedCostSource: "budget-estimate" };
    }),
  }));

  const stopTotals = Object.fromEntries(BUCKETS.map((key) => [key, 0]));
  itinerary.forEach((day) => day.stops.forEach((stop) => {
    stopTotals[bucketFor(stop.category)] += Math.max(0, Number(stop.estimatedCost) || 0);
  }));
  const breakdown = Object.fromEntries(BUCKETS.map((key) => [key, {
    ...(plan.breakdown?.[key] || {}),
    amount: Math.max(round(plan.breakdown?.[key]?.amount), round(stopTotals[key])),
    details: plan.breakdown?.[key]?.details || (stopTotals[key] ? "Includes the estimated charges shown on itinerary stops." : "Estimated trip allocation."),
  }]));
  const totalEstimated = BUCKETS.reduce((sum, key) => sum + breakdown[key].amount, 0);
  return { ...plan, itinerary, breakdown, totalEstimated, remaining: (Number(plan.totalBudget) || 0) - totalEstimated };
}

export const stopCostLabel = (stop, plan) => {
  const amount = estimateStopCost(stop, plan);
  return amount === 0 ? "Free entry" : `~${amount.toLocaleString()} ${plan?.currency || ""} est.`;
};
