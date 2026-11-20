import { useState } from "react";
import { ArrowLeft, Bookmark, BookmarkCheck, FileDown, Loader2, Share2, SlidersHorizontal } from "lucide-react";
import { useTrip } from "../context/TripContext";
import { useToast } from "../context/ToastContext";
import { exportTripPdf } from "../utils/exportPdf";
import BudgetBreakdown from "./BudgetBreakdown";
import ItineraryTimeline from "./ItineraryTimeline";
import ChangeLog from "./ChangeLog";
import TripSettingsDialog from "./TripSettingsDialog";

const action =
  "glass-control flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-3 text-xs font-semibold transition hover:border-sky-400/40 hover:bg-sky-400/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm whitespace-nowrap";

export default function PlanResult() {
  const { plan, savedId, dirty, status, save, shareTrip, clearPlan } = useTrip();
  const toast = useToast();
  const [view, setView] = useState("itinerary");
  const [settings, setSettings] = useState(false);
  if (!plan) return null;

  const saving = status === "saving";
  const SaveIcon = saving ? Loader2 : savedId && !dirty ? BookmarkCheck : Bookmark;
  const tab = (on) => `flex-1 min-h-[44px] rounded-full text-sm font-semibold transition ${on ? "bg-sky-400 text-slate-950 shadow-cyan" : "text-apple-muted hover:bg-white/5 hover:text-apple-text"}`;

  return (
    <div className="space-y-5">
      <div>
        <button onClick={clearPlan} className="-ml-2 mb-1 flex min-h-[44px] items-center gap-1 px-2 text-xs text-apple-muted hover:text-apple-text">
          <ArrowLeft size={14} /> New plan
        </button>
        <div className="mb-2 flex items-center gap-2"><span className="telemetry-chip rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1">Active itinerary</span><span className="telemetry-chip text-slate-500">{plan.currency || "USD"} · {plan.durationDays} day(s)</span></div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">{plan.title}</h2>
        <p className="mt-0.5 text-sm text-apple-blue">
          {plan.destination} · {plan.durationDays} days{plan.travelers > 1 && ` · ${plan.travelers} travelers`}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-apple-muted">{plan.summary}</p>

        {status === "loading" && (
          <div role="status" className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-apple-muted">
            <Loader2 size={15} className="shrink-0 animate-spin text-apple-blue" />
            <span>Rebuilding your itinerary… the globe is rotating while Wander AI updates your trip.</span>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className={action} onClick={save} disabled={saving || (!!savedId && !dirty)}>
            <SaveIcon size={16} className={saving ? "animate-spin" : ""} />
            {!savedId ? "Save trip" : dirty ? "Save changes" : "Saved"}
          </button>
          <button className={action} onClick={shareTrip} disabled={saving}><Share2 size={16} /> Share</button>
          <button className={action} onClick={() => !exportTripPdf(plan) && toast.error("Allow pop-ups for this site to export the PDF.")}>
            <FileDown size={16} /> PDF
          </button>
          <button className={action} onClick={() => setSettings(true)}><SlidersHorizontal size={16} /> Adjust</button>
        </div>
      </div>

      <ChangeLog />

      <div role="tablist" className="flex rounded-full border border-white/10 bg-slate-950/70 p-1">
        <button role="tab" aria-selected={view === "itinerary"} className={tab(view === "itinerary")} onClick={() => setView("itinerary")}>Itinerary</button>
        <button role="tab" aria-selected={view === "budget"} className={tab(view === "budget")} onClick={() => setView("budget")}>Budget</button>
      </div>

      {view === "itinerary" ? <ItineraryTimeline plan={plan} /> : <BudgetBreakdown plan={plan} />}
      <TripSettingsDialog open={settings} onClose={() => setSettings(false)} />
    </div>
  );
}
