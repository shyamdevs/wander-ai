import { Check, Loader2, Pencil } from "lucide-react";
import { useTrip } from "../context/TripContext";
import useWeather from "../hooks/useWeather";
import { dayColor } from "../three/tripHelpers";
import DayCard from "./DayCard";
import ScrollRow from "./ui/ScrollRow";
import ModeSelector from "./ModeSelector";

const chip = (on) =>
  `flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-medium transition ${
    on ? "bg-sky-400 text-slate-950 shadow-cyan" : "glass-control text-apple-muted hover:text-apple-text"
  }`;

export default function ItineraryTimeline({ plan }) {
  const { activeDay, selectDay, editing, setEditing, editor } = useTrip();
  const weather = useWeather(plan);

  return (
    <section className="space-y-4">
      {/* Day chips filter the globe / map to that day */}
      <ScrollRow className="gap-1.5" role="group" aria-label="Show on map">
        <button className={chip(activeDay === "all")} onClick={() => selectDay("all")}>All days</button>
        {plan.itinerary.map((d) => (
          <button key={d.day} className={chip(activeDay === d.day)} onClick={() => selectDay(d.day)} aria-pressed={activeDay === d.day}>
            <span className="h-2 w-2 rounded-full" style={{ background: dayColor(d.day) }} /> Day {d.day}
          </button>
        ))}
      </ScrollRow>

      <ModeSelector />
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 text-[11px] leading-snug text-apple-muted">Transit times are estimates.</p>
        <button
          onClick={() => setEditing(!editing)}
          aria-pressed={editing}
          className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-medium transition ${
            editing ? "bg-sky-400 text-slate-950 shadow-cyan" : "glass-control hover:border-sky-400/40"
          }`}
        >
          {editing ? <Check size={14} /> : <Pencil size={14} />} {editing ? "Done" : "Edit"}
        </button>
      </div>

      {editor.busy && (
        <p role="status" className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm">
          <Loader2 size={16} className="animate-spin" /> {editor.busy}
        </p>
      )}

      <div className="space-y-3">
        {plan.itinerary.map((d) => (
          <DayCard key={d.day} day={d} plan={plan} weather={weather.forDay(d.day)} />
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-apple-muted">
        Times start at 9:00 AM and are suggestions. Stay times are AI estimates. Walking, cycling and driving use live route providers when available; otherwise the app clearly labels a straight-line estimate. Forecasts are indicative; verify conditions before travelling. Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline">Open-Meteo</a> (CC BY 4.0).
      </p>
    </section>
  );
}