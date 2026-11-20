import test from "node:test";
import assert from "node:assert/strict";
import { withEstimatedCosts } from "../src/utils/costEstimates.js";

test("hydrates old itinerary rows with a group cost or free-entry status", () => {
  const plan = withEstimatedCosts({
    destination: "Buenos Aires", durationDays: 1, totalBudget: 1000, currency: "USD", travelers: 2, travelStyle: "balanced",
    breakdown: {
      transport: { amount: 100 }, stay: { amount: 300 }, food: { amount: 200 }, activities: { amount: 300 },
    },
    itinerary: [{ day: 1, stops: [
      { sid: "meal", name: "Restaurant", category: "food", estimatedCost: 0 },
      { sid: "museum", name: "Fine Arts Museum", category: "activity", estimatedCost: 0 },
      { sid: "park", name: "Parque Central", category: "sightseeing", estimatedCost: 0 },
    ] }],
  });
  const [meal, museum, park] = plan.itinerary[0].stops;
  assert.ok(meal.estimatedCost > 0);
  assert.ok(museum.estimatedCost > 0);
  assert.equal(park.estimatedCost, 0);
  assert.equal(park.estimatedCostSource, "free-entry");
  assert.equal(plan.totalEstimated, 900);
});
