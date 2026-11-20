import { Car, Footprints, TrainFront } from "lucide-react";
import { fmtDuration, fmtKm } from "../utils/geo";
import Badge from "./ui/Badge";
import Skeleton from "./ui/Skeleton";

const ICON = { WALK: Footprints, DRIVE: Car, TRANSIT: TrainFront };

// Distance + travel time between two consecutive stops, labelled as Google data or an estimate
export default function TravelConnector({ leg, loading }) {
  const Icon = ICON[leg.mode] || Car;
  const checking = loading && leg.source === "estimate";
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5 text-[11px] text-apple-muted">
      <Icon size={13} />
      <span className="tabular-nums">{fmtKm(leg.km)} · {fmtDuration(leg.minutes)}</span>
      {checking ? <Skeleton className="h-4 w-16 !rounded-full" /> : (
        <Badge kind={Boolean(leg.source && leg.source !== "estimate") ? "verified" : "estimate"} label={Boolean(leg.source && leg.source !== "estimate") ? "Live route" : "Estimate"} />
      )}
    </div>
  );
}
