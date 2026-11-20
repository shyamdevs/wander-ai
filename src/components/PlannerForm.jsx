import { useEffect, useState } from "react";
import { Sparkles, Loader2, MapPin } from "lucide-react";
import { useTrip } from "../context/TripContext";
import { isoDate } from "../utils/dates";
import GlassInput from "./GlassInput";
import PillButton from "./PillButton";

export const CURRENCIES = [["INR", "₹"], ["USD", "$"], ["EUR", "€"], ["GBP", "£"], ["AED", "AED"], ["JPY", "¥"]];
export const STYLES = ["budget", "balanced", "luxury", "adventure", "relaxation", "cultural", "foodie"];
const STEPS = [
  "Reading your budget…", "Pricing travel options…", "Finding stays that fit…",
  "Picking local food spots…", "Plotting your route…",
];

export const chip = (on) =>
  `min-h-[40px] rounded-full px-4 py-2 text-xs font-medium capitalize transition ${
    on ? "bg-sky-400 text-slate-950 shadow-cyan" : "glass-control text-apple-muted hover:text-apple-text"
  }`;

export default function PlannerForm() {
  const { form: f, setForm, planTrip, pick, clearPick, status, error } = useTrip();
  const [step, setStep] = useState(0);
  const loading = status === "loading";
  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const fromGlobe = pick?.state === "ok" && f.destination === pick.label;

  useEffect(() => {
    if (!loading) return setStep(0);
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 2200);
    return () => clearInterval(id);
  }, [loading]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); planTrip(); }} className="space-y-5">
      <div>
        <GlassInput
          label="Destination"
          value={f.destination}
          onChange={(e) => {
            set({ destination: e.target.value });
            if (pick && e.target.value !== pick.label) clearPick(); // typed over the pick
          }}
          placeholder="Type a place, or tap the globe"
        />
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-apple-muted">
          <MapPin size={12} className={fromGlobe ? "text-apple-blue" : ""} />
          {fromGlobe ? "Picked on the globe" : "Drag the globe and tap any place. Empty = “Anywhere”."}
        </p>
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-medium tracking-wide text-apple-muted">Currency</span>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.map(([code, sym]) => (
            <button type="button" key={code} onClick={() => set({ currency: code })} className={chip(f.currency === code)}>
              {sym} {code !== sym && code}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2">
        <GlassInput label="Total budget" type="number" min="1" inputMode="numeric" value={f.budget}
          onChange={(e) => set({ budget: e.target.value })} placeholder="e.g. 50000" />
        <GlassInput label="Travelers" type="number" min="1" max="20" inputMode="numeric" value={f.travelers}
          onChange={(e) => set({ travelers: e.target.value })} />
      </div>

      <GlassInput label="Start date" type="date" min={isoDate(new Date())} value={f.startDate}
        onChange={(e) => set({ startDate: e.target.value })} />

      <label className="block">
        <span className="mb-1.5 flex justify-between text-xs font-medium tracking-wide text-apple-muted">
          <span>Duration</span>
          <span className="text-apple-text">{f.days} {f.days === 1 ? "day" : "days"}</span>
        </span>
        <input type="range" min="1" max="14" value={f.days} onChange={(e) => set({ days: Number(e.target.value) })}
          className="h-8 w-full accent-sky-400" />
      </label>

      <div>
        <span className="mb-1.5 block text-xs font-medium tracking-wide text-apple-muted">Travel style</span>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <button type="button" key={s} onClick={() => set({ style: s })} className={chip(f.style === s)}>{s}</button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <PillButton type="submit" disabled={loading} className="min-h-[48px] w-full">
        {loading ? <><Loader2 size={16} className="animate-spin" /> {STEPS[step]}</> : <><Sparkles size={16} /> Plan my trip</>}
      </PillButton>
    </form>
  );
}
