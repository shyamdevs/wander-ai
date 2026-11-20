import { useEffect, useState } from "react";
import { useTrip } from "../context/TripContext";
import Modal from "./ui/Modal";
import GlassInput from "./GlassInput";
import PillButton from "./PillButton";
import { CURRENCIES, STYLES, chip } from "./PlannerForm";

// Change duration / budget / style / group size. Gemini rebuilds the whole trip for the same destination.
export default function TripSettingsDialog({ open, onClose }) {
  const { plan, regenerateWith } = useTrip();
  const [v, setV] = useState({});
  useEffect(() => {
    if (open && plan) setV({
      days: plan.durationDays, budget: plan.totalBudget, currency: plan.currency,
      style: plan.travelStyle, travelers: plan.travelers || 1, startDate: plan.startDate || "",
    });
  }, [open, plan]);

  const submit = (e) => {
    e.preventDefault();
    if (!(Number(v.budget) > 0)) return;
    onClose();
    regenerateWith(v);
  };

  return (
    <Modal open={open} onClose={onClose} title="Adjust trip">
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm leading-relaxed text-apple-muted">
          Gemini will plan <span className="text-apple-text">{plan?.destination}</span> again with these settings.
          To change only one day, use “Regenerate day” instead. You can undo nothing here, but your saved copy stays as it is.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <GlassInput label="Total budget" type="number" min="1" value={v.budget ?? ""} onChange={(e) => setV({ ...v, budget: e.target.value })} />
          <GlassInput label="Travelers" type="number" min="1" max="20" value={v.travelers ?? 1} onChange={(e) => setV({ ...v, travelers: e.target.value })} />
        </div>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.map(([c, sym]) => (
            <button type="button" key={c} onClick={() => setV({ ...v, currency: c })} className={chip(v.currency === c)}>{sym} {c !== sym && c}</button>
          ))}
        </div>
        <label className="block">
          <span className="mb-1.5 flex justify-between text-xs font-medium tracking-wide text-apple-muted">
            <span>Duration</span><span className="text-apple-text">{v.days} days</span>
          </span>
          <input type="range" min="1" max="14" value={v.days ?? 5} onChange={(e) => setV({ ...v, days: Number(e.target.value) })} className="h-8 w-full accent-white" />
        </label>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <button type="button" key={s} onClick={() => setV({ ...v, style: s })} className={chip(v.style === s)}>{s}</button>
          ))}
        </div>
        <PillButton type="submit" className="min-h-[48px] w-full">Regenerate trip</PillButton>
      </form>
    </Modal>
  );
}
