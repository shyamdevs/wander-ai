import { useMemo, useState } from "react";
import { ChevronDown, Map, Plus, RotateCw, Route } from "lucide-react";
import { useTrip } from "../context/TripContext";
import useDayLegs from "../hooks/useDayLegs";
import { buildSchedule } from "../utils/schedule";
import { dayDate, fmtDate } from "../utils/dates";
import { fmtDuration, fmtKm, fmtTime } from "../utils/geo";
import { money } from "../utils/format";
import { dayColor } from "../three/tripHelpers";
import StopRow from "./StopRow";
import WeatherChip from "./WeatherChip";
import PromptDialog from "./PromptDialog";
import Badge from "./ui/Badge";

const tool = "glass-control flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition hover:border-sky-400/40 disabled:opacity-40";

// A collapsible day: header (date, weather, cost), timeline of stops, per-day tools
export default function DayCard({ day, plan, weather }) {
  const { activeDay, selectDay, expanded, toggleDay, travelMode, editing, editor } = useTrip();
  const open = !!expanded[day.day];
  const [dialog, setDialog] = useState(null); // "add" | "regen"
  const { legs, loading } = useDayLegs(day.stops, travelMode, open);
  const sched = useMemo(() => buildSchedule(day.stops, legs), [day.stops, legs]);

  const color = dayColor(day.day);
  const active = activeDay === day.day;
  const date = dayDate(plan.startDate, day.day);
  const cost = day.stops.reduce((s, x) => s + (x.estimatedCost || 0), 0);
  const km = legs.reduce((s, l) => s + (l?.km || 0), 0);
  const travel = legs.reduce((s, l) => s + (l?.minutes || 0), 0);
  const allReal = day.stops.length > 1 && legs.slice(1).every((l) => Boolean(l?.source && l.source !== "estimate"));
  const days = plan.itinerary.map((d) => d.day);
  const off = !!editor.busy;

  return (
    <section id={`day-${day.day}`} className={`scroll-mt-4 rounded-3xl border transition ${active ? "border-sky-400/35 bg-sky-400/[0.07] shadow-[0_0_24px_-14px_rgba(56,189,248,.6)]" : "border-white/10 bg-slate-900/35 hover:bg-slate-900/55"}`}>
      <div className="flex items-stretch">
        <button
          onClick={() => toggleDay(day.day)}
          aria-expanded={open}
          aria-controls={`day-body-${day.day}`}
          className="flex min-h-[64px] min-w-0 flex-1 items-center gap-3 rounded-3xl p-3 text-left"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: color }}>{day.day}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold tracking-tight">{day.title}</span>
            <span className="block truncate text-[11px] text-apple-muted">
              {date && `${fmtDate(date)} · `}{day.stops.length} stops · ~{money(cost, plan.currency)} est.
            </span>
          </span>
          <WeatherChip w={weather} />
          <ChevronDown size={16} className={`shrink-0 text-apple-muted transition ${open ? "rotate-180" : ""}`} />
        </button>
        <button
          onClick={() => selectDay(active ? "all" : day.day)}
          aria-pressed={active}
          aria-label={active ? `Show all days on the map` : `Show Day ${day.day} on the map`}
          className={`m-2 flex w-11 shrink-0 items-center justify-center rounded-2xl transition ${active ? "bg-sky-400 text-slate-950 shadow-cyan" : "text-apple-muted hover:bg-white/10 hover:text-apple-text"}`}
        >
          <Map size={16} />
        </button>
      </div>

      {open && (
        <div id={`day-body-${day.day}`} className="px-3 pb-3">
          {day.stops.length > 1 && (
            <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-[11px] text-apple-muted">
              <Route size={13} /> {fmtKm(km)} between stops · ~{fmtDuration(travel)} travelling · ends ~{fmtTime(sched.at(-1).depart)}
              <Badge kind={allReal ? "verified" : "estimate"} label={allReal ? "Live routes" : loading ? "Checking routes…" : "Estimates"} />
            </p>
          )}

          {editing && (
            <div className="mb-3 flex flex-wrap gap-2">
              <button className={tool} disabled={off} onClick={() => setDialog("add")}><Plus size={14} /> Add place</button>
              <button className={tool} disabled={off} onClick={() => setDialog("regen")}><RotateCw size={14} /> Regenerate day</button>
              <button className={tool} disabled={off || day.stops.length < 3} onClick={() => editor.optimize(day.day)}><Route size={14} /> Optimize</button>
            </div>
          )}

          {day.stops.length === 0 && <p className="px-1 py-4 text-sm text-apple-muted">No stops yet. Turn on Edit and add a place.</p>}
          <ol>
            {day.stops.map((s, i) => (
              <StopRow
                key={s.sid}
                stop={s}
                dayNo={day.day}
                days={days}
                index={i}
                count={day.stops.length}
                sched={sched[i]}
                leg={legs[i]}
                legLoading={loading}
                color={color}
                currency={plan.currency}
              />
            ))}
          </ol>
        </div>
      )}

      <PromptDialog
        open={dialog === "add"}
        onClose={() => setDialog(null)}
        title={`Add a place to Day ${day.day}`}
        description="We verify place names and coordinates with Geoapify / OpenStreetMap where possible. If no match is found, AI can suggest an alternative."
        label="Place name"
        placeholder="e.g. Albert Hall Museum"
        submitLabel="Add place"
        required
        onSubmit={(t) => editor.addPlace(day.day, t)}
      />
      <PromptDialog
        open={dialog === "regen"}
        onClose={() => setDialog(null)}
        title={`Regenerate Day ${day.day}`}
        description="Only this day is rebuilt. Other days stay exactly as they are, and the changes are explained. You can undo it."
        label="Anything specific? (optional)"
        placeholder="e.g. more food, less walking"
        submitLabel="Regenerate day"
        onSubmit={(t) => editor.regenerateDay(day.day, t)}
      />
    </section>
  );
}
