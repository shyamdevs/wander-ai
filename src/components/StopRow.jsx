import { useState } from "react";
import { ChevronRight, Crosshair } from "lucide-react";
import { useTrip } from "../context/TripContext";
import { sameStop } from "../three/tripHelpers";
import { stopMinutes } from "../utils/schedule";
import { fmtDuration, fmtTime } from "../utils/geo";
import { money } from "../utils/format";
import { CATEGORY_ICONS } from "./categoryIcons";
import TravelConnector from "./TravelConnector";
import StopEditControls from "./StopEditControls";
import PromptDialog from "./PromptDialog";

const COLS = "grid grid-cols-[4.25rem_1.5rem_minmax(0,1fr)] gap-x-2";

// One timeline entry: arrival/departure, the card (click = open destination details), edit tools
export default function StopRow({ stop, dayNo, days, index, count, sched, leg, legLoading, color, currency }) {
  const { openDestination, focusStop, setFocusStop, editing, editor } = useTrip();
  const [replacing, setReplacing] = useState(false);
  const selected = sameStop(stop, focusStop);
  const Icon = CATEGORY_ICONS[stop.category] || CATEGORY_ICONS.sightseeing;
  const stopCost = Number(stop.estimatedCost) || 0;

  return (
    <li id={`stop-${stop.sid}`} className="scroll-mt-4">
      {leg && (
        <div className={COLS}>
          <span />
          <span className="mx-auto w-px bg-white/15" />
          <TravelConnector leg={leg} loading={legLoading} />
        </div>
      )}
      <div className={COLS}>
        <div className="pt-3.5 text-right">
          <p className="telemetry-chip text-[10px] font-semibold">{fmtTime(sched.arrive)}</p>
          <p className="text-[10px] text-apple-muted">to {fmtTime(sched.depart)}</p>
        </div>
        <div className="flex flex-col items-center">
          <span
            className="mt-4 h-3 w-3 shrink-0 rounded-full transition"
            style={{ background: color, boxShadow: selected ? `0 0 0 4px ${color}66` : "none" }}
          />
          {index < count - 1 && <span className="mt-1 w-px flex-1 bg-white/15" />}
        </div>
        <div className="min-w-0 pb-2">
          <div className={`flex items-stretch rounded-2xl border transition ${selected ? "border-sky-400/35 bg-sky-400/[0.08]" : "border-white/10 bg-slate-900/45 hover:border-white/20 hover:bg-slate-900/70"}`}>
            <button
              onClick={() => openDestination(stop)}
              aria-label={`Open details for ${stop.name}`}
              aria-current={selected ? "true" : undefined}
              className="flex min-h-[56px] min-w-0 flex-1 items-center gap-3 rounded-2xl p-3 text-left"
            >
              <Icon size={16} className="shrink-0 text-apple-muted" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{stop.name}</span>
                <span className="block truncate text-[11px] text-apple-muted">
                  ~{fmtDuration(stopMinutes(stop))} stay · {stopCost > 0 ? `~${money(stopCost, currency)} est.` : "Free entry"}
                </span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-apple-muted" />
            </button>
            <button
              onClick={() => setFocusStop(selected ? null : { ...stop, day: dayNo })}
              aria-label={`Show ${stop.name} on the map`}
              className="flex w-11 shrink-0 items-center justify-center text-apple-muted transition hover:text-apple-text"
            >
              <Crosshair size={16} />
            </button>
          </div>
          {editing && (
            <StopEditControls stop={stop} index={index} count={count} dayNo={dayNo} days={days} editor={editor} onReplace={() => setReplacing(true)} />
          )}
        </div>
      </div>

      <PromptDialog
        open={replacing}
        onClose={() => setReplacing(false)}
        title={`Replace “${stop.name}”`}
        description="AI will suggest a real place near the rest of this day and explain the change. You can undo it."
        label="What kind of place? (optional)"
        placeholder="e.g. a quieter museum, local street food"
        submitLabel="Find replacement"
        onSubmit={(text) => editor.replaceStopAI(stop.sid, text)}
      />
    </li>
  );
}
