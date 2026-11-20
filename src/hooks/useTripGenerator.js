import api from "../api/axios";

const errMsg = (e) => e.response?.data?.message || "Something went wrong. Please try again.";

// Generating a whole trip (form button, globe card, or "Adjust trip" settings)
export default function useTripGenerator({ form, setForm, pick, plan, show, setStatus, setError, onGenerationStart, onGenerationComplete }) {
  const generate = async (params) => {
    onGenerationStart?.();
    setStatus("loading");
    setError("");
    try {
      const nextPlan = (await api.post("/trips/generate", params)).data.plan;
      show(nextPlan);
      onGenerationComplete?.(nextPlan);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setStatus("idle");
    }
  };

  const base = (f) => ({
    totalBudget: Number(f.budget),
    currency: f.currency,
    durationDays: f.days,
    travelStyle: f.style,
    travelers: Number(f.travelers) || 1,
    startDate: f.startDate || undefined,
  });

  // If a globe pick is still the destination, its exact coordinates go to Gemini too
  const planTrip = () => {
    if (!(Number(form.budget) > 0)) return setError("Enter a budget greater than 0.");
    const usePick = pick?.state === "ok" && form.destination === pick.label;
    generate({
      ...base(form),
      destination: form.destination.trim() || "Anywhere",
      ...(usePick && { pickedCoords: { latitude: pick.lat, longitude: pick.lon } }),
    });
  };

  // Change duration / budget / style / group size for the current destination
  const regenerateWith = (values) => {
    setForm((f) => ({ ...f, ...values }));
    return generate({ ...base({ ...form, ...values }), destination: plan.destination, pickedCoords: plan.destinationCoords });
  };

  return { generate, planTrip, regenerateWith };
}
