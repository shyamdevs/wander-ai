import { ExternalLink, Globe, Phone } from "lucide-react";
import { dayDate } from "../../utils/dates";
import { openStatus } from "../../utils/hours";
import { stopMinutes } from "../../utils/schedule";
import { fmtDuration, fmtKm, fmtTime } from "../../utils/geo";
import { money } from "../../utils/format";
import Badge from "../ui/Badge";
import PlaceNotice from "./PlaceNotice";

const Fact = ({ label, badge, children }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
    <p className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-apple-muted">{label} {badge}</p>
    <div className="text-sm leading-relaxed">{children}</div>
  </div>
);

const LegText = ({ leg, name, dir }) => (
  <>
    {fmtKm(leg.km)} · {fmtDuration(leg.minutes)} <span className="text-apple-muted">{dir} {name}</span>
  </>
);

// Destination facts identify their provider when available; AI-generated details remain estimates.
export default function Overview({ stop, place, plan, day, index, legs, sched }) {
  const p = place.data;
  const prev = day.stops[index - 1];
  const next = day.stops[index + 1];
  const arrive = sched[index].arrive;
  const status = p ? openStatus(p.hours?.periods, dayDate(plan.startDate, day.day), arrive) : "unknown";

  return (
    <div className="space-y-3">
      {place.status !== "ready" && <PlaceNotice place={place} stop={stop} />}

      <Fact label="About" badge={<Badge kind={p?.summary ? "verified" : "ai"} label={p?.summary ? "Provider details" : "AI-written"} />}>
        <p>{p?.summary || stop.description}</p>
      </Fact>

      {stop.highlights?.length > 0 && (
        <Fact label="Highlights" badge={<Badge kind="ai" />}>
          <ul className="list-disc space-y-0.5 pl-4">{stop.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
        </Fact>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Fact label="Visit duration" badge={<Badge kind="estimate" />}>~{fmtDuration(stopMinutes(stop))}</Fact>
        <Fact label="Best time to visit" badge={<Badge kind="estimate" />}>{stop.bestTimeToVisit || "No tip available"}</Fact>
        <Fact label="Your plan" badge={<Badge kind="estimate" />}>
          Arrive ~{fmtTime(arrive)}, leave ~{fmtTime(sched[index].depart)}
        </Fact>
        <Fact label="Estimated cost" badge={<Badge kind="estimate" />}>
          {Number(stop.estimatedCost) > 0 ? `~${money(stop.estimatedCost, plan.currency)} (group estimate)` : "Free entry"}
        </Fact>
      </div>

      <Fact label="Getting here & onward">
        {prev ? <p>From previous: <LegText leg={legs[index]} name={prev.name} dir="from" /></p> : <p className="text-apple-muted">First stop of the day.</p>}
        {next ? <p className="mt-1">To next: <LegText leg={legs[index + 1]} name={next.name} dir="to" /></p> : <p className="mt-1 text-apple-muted">Last stop of the day.</p>}
        <p className="mt-1 text-[11px] text-apple-muted">
          {[legs[index], legs[index + 1]].filter(Boolean).every((l) => l.source && l.source !== "estimate") ? "Live route-provider directions." : "Some times are straight-line estimates."}
        </p>
      </Fact>

      {p?.address && <Fact label="Address" badge={<Badge kind={p.verified ? "verified" : "ai"} label={p.verified ? "Map provider" : "Approximate location"} />}>{p.address}</Fact>}
      {p && !p.verified && <p className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-relaxed text-amber-100/80">A map provider could not verify this exact venue. The map pin and directions use the itinerary coordinates; confirm the entrance and venue location before travelling.</p>}

      {p?.hours?.weekdayDescriptions?.length > 0 && (
        <Fact label="Opening hours" badge={<Badge kind="verified" />}>
          <ul className="space-y-0.5 text-[13px]">{p.hours.weekdayDescriptions.map((d) => <li key={d}>{d}</li>)}</ul>
          {status === "open" && <p className="mt-2 text-emerald-300">Open at your planned arrival ({fmtTime(arrive)}).</p>}
          {status === "closed" && <p className="mt-2 text-amber-300">May be closed at your planned arrival ({fmtTime(arrive)}). Consider moving this stop.</p>}
        </Fact>
      )}

      {(p?.website || p?.phone) && (
        <div className="flex flex-wrap gap-2">
          {p.website && /^https?:\/\//.test(p.website) && (
            <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 text-xs font-medium hover:bg-white/20">
              <Globe size={14} /> Website <ExternalLink size={12} />
            </a>
          )}
          {p.phone && (
            <a href={`tel:${p.phone.replace(/[^\d+]/g, "")}`} className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 text-xs font-medium hover:bg-white/20">
              <Phone size={14} /> {p.phone}
            </a>
          )}
        </div>
      )}
      <p className="pt-1 text-[11px] text-apple-muted">Place details come from Geoapify / OpenStreetMap where available. Photos are sourced separately from Wikimedia Commons. Costs are indicative AI/budget-based estimates, not official venue tariffs. Confirm ticket and menu prices before travelling.</p>
    </div>
  );
}
