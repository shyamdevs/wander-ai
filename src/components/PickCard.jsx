import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MapPin, Sparkles, X } from "lucide-react";
import { useTrip } from "../context/TripContext";
import { money } from "../utils/format";
import PillButton from "./PillButton";

const spring = { type: "spring", stiffness: 300, damping: 30 };

// Appears over the globe after the user taps a place
export default function PickCard() {
  const { pick, form, planTrip, clearPick } = useTrip();
  const budgetOk = Number(form.budget) > 0;

  return (
    <AnimatePresence>
      {pick && (
        <motion.div
          key={`${pick.lat}-${pick.lon}`}
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: spring }}
          exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }}
          className="glass-panel pointer-events-auto w-full max-w-sm rounded-3xl p-4 lg:w-80 lg:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300">
              {pick.state === "loading" ? <Loader2 size={17} className="animate-spin" /> : <MapPin size={17} className={pick.state === "error" ? "text-red-300" : "text-apple-blue"} />}
            </span>
            <div className="min-w-0 flex-1">
              {pick.state === "loading" && <p className="text-sm text-apple-muted">Finding this place…</p>}
              {pick.state === "error" && (
                <>
                  <p className="text-sm font-semibold">No land here</p>
                  <p className="text-xs text-apple-muted">That looks like open ocean. Tap a country or city.</p>
                </>
              )}
              {pick.state === "ok" && (
                <>
                  <p className="truncate text-sm font-semibold tracking-tight">{pick.label}</p>
                  <p className="text-xs text-apple-muted">
                    {form.days} {form.days === 1 ? "day" : "days"}
                    {budgetOk && ` · ${money(Number(form.budget), form.currency)}`}
                  </p>
                </>
              )}
            </div>
            <button onClick={clearPick} aria-label="Clear" className="text-apple-muted hover:text-apple-text">
              <X size={16} />
            </button>
          </div>

          {pick.state === "ok" && (
            <>
              <PillButton onClick={planTrip} disabled={!budgetOk} className="mt-4 w-full">
                <Sparkles size={16} /> Plan {form.days}-day trip here
              </PillButton>
              {!budgetOk && <p className="mt-2 text-center text-[11px] text-apple-muted">Enter your budget in the panel first.</p>}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
