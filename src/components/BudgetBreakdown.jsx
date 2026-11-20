import { motion } from "framer-motion";
import { Plane, BedDouble, UtensilsCrossed, Ticket } from "lucide-react";
import { money } from "../utils/format";
import Badge from "./ui/Badge";

const CATS = [
  { key: "transport", label: "Travel", icon: Plane, color: "#38BDF8" },
  { key: "stay", label: "Stay", icon: BedDouble, color: "#A78BFA" },
  { key: "food", label: "Food & Dining", icon: UtensilsCrossed, color: "#F59E0B" },
  { key: "activities", label: "Activities & entry fees", icon: Ticket, color: "#34D399" },
];

const Stat = ({ label, value, over }) => (
  <div className="glass-surface min-w-0 rounded-2xl p-3">
    <p className="text-[11px] text-apple-muted">{label}</p>
    <p className={`mt-0.5 truncate text-sm font-semibold tracking-tight ${over ? "text-red-300" : ""}`}>{value}</p>
  </div>
);

export default function BudgetBreakdown({ plan }) {
  const { currency, totalBudget, totalEstimated, remaining, breakdown } = plan;
  const people = plan.travelers || 1;
  const days = Math.max(1, Number(plan.durationDays) || 1);
  const dailyBudget = totalBudget / days;
  const dailyPlanned = totalEstimated / days;
  const pct = (n) => (totalBudget > 0 ? Math.min(100, (n / totalBudget) * 100) : 0);

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold tracking-tight">Budget</h3>
        <Badge kind="estimate" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Your budget" value={money(totalBudget, currency)} />
        <Stat label="Planned" value={money(totalEstimated, currency)} />
        <Stat label={remaining < 0 ? "Over budget" : "Left over"} value={money(Math.abs(remaining), currency)} over={remaining < 0} />
        <Stat label={people > 1 ? `Per person (${people})` : "Per person"} value={money(totalEstimated / people, currency)} />
        <Stat label="Budget per day" value={money(dailyBudget, currency)} />
        <Stat label="Planned per day" value={money(dailyPlanned, currency)} />
      </div>

      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-white/10" role="img" aria-label="Budget split by category">
        {CATS.map((c, i) => (
          <motion.div
            key={c.key}
            style={{ background: c.color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct(breakdown[c.key].amount)}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 24, delay: 0.2 + i * 0.1 }}
          />
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {CATS.map(({ key, label, icon: Icon, color }) => (
          <li key={key} className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}26`, color }}>
              <Icon size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-sm font-semibold tabular-nums">{money(breakdown[key].amount, currency)}</p>
              </div>
              <p className="text-xs leading-relaxed text-apple-muted">{breakdown[key].details}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] leading-relaxed text-apple-muted">
        All amounts are estimates for the whole group, not official venue tariffs. Paid stops with missing prices receive a budget-based estimate; confirm ticket, menu and hotel prices before booking. Editing stops updates these totals.
      </p>
    </section>
  );
}
