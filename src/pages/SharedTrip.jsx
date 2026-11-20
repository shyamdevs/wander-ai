import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import api from "../api/axios";
import GlassCard from "../components/GlassCard";
import PillButton from "../components/PillButton";
import Skeleton from "../components/ui/Skeleton";
import { withIds } from "../utils/editOps";
import { buildSchedule, stopMinutes } from "../utils/schedule";
import { dayDate, fmtDate } from "../utils/dates";
import { fmtDuration, fmtTime, placeUrl } from "../utils/geo";
import { money } from "../utils/format";
import { withEstimatedCosts } from "../utils/costEstimates";
import { dayColor } from "../three/tripHelpers";

// Public, read-only view of a trip someone shared. No login needed.
export default function SharedTrip() {
  const { shareId } = useParams();
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let dead = false;
    api.get(`/share/${encodeURIComponent(shareId)}`)
      .then((r) => !dead && setState({ status: "ready", trip: withIds(withEstimatedCosts(r.data.trip)) }))
      .catch((e) => !dead && setState({ status: "error", message: e.response?.data?.message || "Couldn't load this trip." }));
    return () => { dead = true; };
  }, [shareId]);

  const trip = state.trip;
  const schedules = useMemo(() => (trip ? trip.itinerary.map((d) => buildSchedule(d.stops)) : []), [trip]);

  return (
    <div className="pointer-events-auto fixed inset-0 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-10">
        <GlassCard className="p-5 sm:p-8">
          {state.status === "loading" && <div className="space-y-3"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-40 w-full" /></div>}
          {state.status === "error" && (
            <div className="py-8 text-center">
              <p className="text-lg font-semibold">Trip not found</p>
              <p className="mt-1 text-sm text-apple-muted">{state.message}</p>
              <PillButton to="/" className="mt-5">Go to Wander AI</PillButton>
            </div>
          )}
          {trip && (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-apple-blue">Shared trip · view only</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">{trip.title}</h1>
              <p className="mt-1 text-sm text-apple-muted">
                {trip.destination} · {trip.durationDays} days{trip.travelers > 1 && ` · ${trip.travelers} travelers`}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-apple-muted">{trip.summary}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <p className="rounded-2xl bg-white/5 p-3"><span className="block text-[11px] text-apple-muted">Planned (AI estimate)</span>{money(trip.totalEstimated, trip.currency)}</p>
                <p className="rounded-2xl bg-white/5 p-3"><span className="block text-[11px] text-apple-muted">Per person</span>{money(trip.totalEstimated / (trip.travelers || 1), trip.currency)}</p>
              </div>

              <div className="mt-6 space-y-6">
                {trip.itinerary.map((d, di) => {
                  const date = dayDate(trip.startDate, d.day);
                  return (
                    <section key={d.day}>
                      <h2 className="mb-2 flex items-center gap-2 text-base font-semibold">
                        <span className="grid h-7 w-7 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: dayColor(d.day) }}>{d.day}</span>
                        {d.title}{date && <span className="text-xs font-normal text-apple-muted">· {fmtDate(date)}</span>}
                      </h2>
                      <ol className="space-y-2">
                        {d.stops.map((s, i) => (
                          <li key={s.sid} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                            <span className="w-16 shrink-0 text-xs font-semibold tabular-nums">{fmtTime(schedules[di][i].arrive)}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{s.name}</p>
                              <p className="text-[11px] text-apple-muted">~{fmtDuration(stopMinutes(s))}{Number(s.estimatedCost) > 0 ? ` · ~${money(s.estimatedCost, trip.currency)} est.` : " · Free entry"}</p>
                              <a href={placeUrl(s)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-[32px] items-center gap-1 text-xs text-apple-blue">
                                Open in Google Maps <ExternalLink size={11} />
                              </a>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </section>
                  );
                })}
              </div>
              <p className="mt-6 text-[11px] leading-relaxed text-apple-muted">Times assume a 9:00 AM start. Stop costs are indicative AI/budget-based estimates, not official venue tariffs. Confirm ticket, meal and hotel prices before booking.</p>
              <Link to="/signup" className="mt-5 inline-block text-sm text-apple-blue">Plan your own trip with Wander AI →</Link>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
