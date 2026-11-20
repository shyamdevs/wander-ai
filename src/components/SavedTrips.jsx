import { Copy, Link2, MapPin, Trash2 } from "lucide-react";
import { useTrip } from "../context/TripContext";
import { money } from "../utils/format";

export default function SavedTrips({ onOpen }) {
  const { trips, openTrip, removeTrip, duplicateTrip } = useTrip();

  if (!trips.length) {
    return (
      <div className="py-12 text-center">
        <MapPin size={28} className="mx-auto mb-3 text-apple-muted" />
        <p className="text-sm font-medium">No saved trips yet</p>
        <p className="mt-1 text-sm text-apple-muted">Plan a trip and tap Save. It will show up here.</p>
      </div>
    );
  }

  const icon = "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-apple-muted transition hover:bg-white/10";
  return (
    <ul className="space-y-2">
      {trips.map((t) => (
        <li key={t._id} className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1.5">
          <button
            onClick={async () => { await openTrip(t._id); onOpen(); }}
            className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/10"
          >
            <MapPin size={16} className="shrink-0 text-apple-blue" />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <span className="truncate">{t.title}</span>
                {t.shareId && <Link2 size={12} className="shrink-0 text-apple-muted" aria-label="Has a share link" />}
              </span>
              <span className="block truncate text-xs text-apple-muted">
                {t.destination} · {t.durationDays}d · {money(t.totalBudget, t.currency)}
              </span>
            </span>
          </button>
          <button onClick={() => duplicateTrip(t._id)} aria-label={`Duplicate ${t.title}`} className={`${icon} hover:text-apple-text`}><Copy size={15} /></button>
          <button
            onClick={() => window.confirm(`Delete “${t.title}”?`) && removeTrip(t._id)}
            aria-label={`Delete ${t.title}`}
            className={`${icon} hover:!text-red-300`}
          ><Trash2 size={15} /></button>
        </li>
      ))}
    </ul>
  );
}
