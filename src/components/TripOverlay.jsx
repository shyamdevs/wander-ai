import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useTrip } from "../context/TripContext";
import { dayColor } from "../three/tripHelpers";
import { CATEGORY_ICONS } from "./categoryIcons";
import { money } from "../utils/format";
import PickCard from "./PickCard";

const spring = { type: "spring", stiffness: 300, damping: 30 };

// Sits over the globe: before a plan -> "plan here" card; after -> day filter + stop details.
// On phones it sits just above the bottom sheet.
export default function TripOverlay() {
  const { plan, activeDay, selectDay, focusStop, setFocusStop, openDestination, status } = useTrip();
  if (status === "loading") return null;

  const Icon = focusStop && (CATEGORY_ICONS[focusStop.category] || CATEGORY_ICONS.sightseeing);
  const pill = (on) =>
    `flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
      on ? "bg-sky-400 text-slate-950 shadow-cyan" : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="pointer-events-none relative z-10 order-1 flex flex-col items-center justify-end gap-3 xl:order-2 xl:flex-1 xl:pb-2">
      {!plan && <PickCard />}

      {plan && (
        <>
          <AnimatePresence>
            {focusStop && (
              <motion.div
                key={focusStop.name}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: spring }}
                exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }}
                className="glass-panel pointer-events-auto w-full max-w-sm rounded-3xl p-4 lg:w-80 lg:p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${dayColor(focusStop.day)}30`, color: dayColor(focusStop.day) }}>
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold tracking-tight">{focusStop.name}</p>
                    <p className="text-[11px] capitalize text-apple-muted">Day {focusStop.day} · {focusStop.timeOfDay} · {Number(focusStop.estimatedCost) > 0 ? `~${money(focusStop.estimatedCost, plan.currency)} est.` : "Free entry"}</p>
                  </div>
                  <button onClick={() => setFocusStop(null)} aria-label="Close" className="text-apple-muted hover:text-apple-text">
                    <X size={16} />
                  </button>
                </div>
                <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-apple-muted">{focusStop.description}</p>
                <button onClick={() => openDestination(focusStop)} className="accent-gradient mt-3 flex min-h-[44px] w-full items-center justify-center rounded-full text-sm font-bold transition">
                  Open details, photos &amp; Street View
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="glass-panel pointer-events-auto flex max-w-full gap-1 overflow-x-auto rounded-full p-1 no-scrollbar">
            <button className={pill(activeDay === "all")} onClick={() => selectDay("all")}>All days</button>
            {plan.itinerary.map((d) => (
              <button key={d.day} className={pill(activeDay === d.day)} onClick={() => selectDay(d.day)}>
                <span className="h-2 w-2 rounded-full" style={{ background: dayColor(d.day) }} />
                Day {d.day}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
