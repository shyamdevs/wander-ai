import { ExternalLink } from "lucide-react";
import { placeUrl } from "../../utils/geo";
import Skeleton from "../ui/Skeleton";

export default function PlaceNotice({ place, stop }) {
  if (place.status === "loading") return <div className="space-y-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" /></div>;
  const text = {
    notfound: "We couldn't match this stop to a nearby place record. The pin uses the itinerary's AI-suggested coordinates; verify the location before travelling.",
    error: place.error || "Place providers are temporarily unavailable. The itinerary and map pin are still available.",
  }[place.status];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-apple-muted" role="status">
      <p>{text}</p>
      <a href={placeUrl(stop)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-apple-blue">
        Check location on Google Maps <ExternalLink size={14} />
      </a>
      <p className="mt-2 text-[10px]">Map data © <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>.</p>
    </div>
  );
}
