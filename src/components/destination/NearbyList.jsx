import { useEffect, useState } from "react";
import { BedDouble, Coffee, ExternalLink, Landmark, Plus, ShoppingBag, Star, Utensils } from "lucide-react";
import { nearbyPlaces } from "../../api/places";
import { useTrip } from "../../context/TripContext";
import { fmtKm } from "../../utils/geo";
import Skeleton from "../ui/Skeleton";
import ScrollRow from "../ui/ScrollRow";

const KINDS = [
  ["restaurants", "Restaurants", Utensils], ["cafes", "Cafés", Coffee], ["hotels", "Hotels", BedDouble],
  ["shopping", "Shopping", ShoppingBag], ["attractions", "Attractions", Landmark],
];
const PRICE = { PRICE_LEVEL_FREE: "Free", PRICE_LEVEL_INEXPENSIVE: "$", PRICE_LEVEL_MODERATE: "$$", PRICE_LEVEL_EXPENSIVE: "$$$", PRICE_LEVEL_VERY_EXPENSIVE: "$$$$" };

// Nearby OpenStreetMap / Geoapify place records. "Add" puts one into this day.
export default function NearbyList({ location, dayNo }) {
  const { editor } = useTrip();
  const [kind, setKind] = useState("restaurants");
  const [state, setState] = useState({ status: "loading", items: [] });

  useEffect(() => {
    let dead = false;
    setState({ status: "loading", items: [] });
    nearbyPlaces({ latitude: location.latitude, longitude: location.longitude, kind })
      .then((items) => !dead && setState({ status: "ready", items }))
      .catch((e) => !dead && setState({
        status: "error",
        items: [], message: e.response?.data?.message,
      }));
    return () => { dead = true; };
  }, [kind, location.latitude, location.longitude]);

  const btn = "glass-control flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition hover:border-sky-400/40 disabled:opacity-40";
  const mapsSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${kind} near ${location.latitude},${location.longitude}`)}`;
  return (
    <div>
      <ScrollRow className="mb-3 gap-1.5" role="group" aria-label="Category">
        {KINDS.map(([id, label, Icon]) => (
          <button key={id} onClick={() => setKind(id)} aria-pressed={kind === id}
            className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-medium transition ${kind === id ? "bg-sky-400 text-slate-950 shadow-cyan" : "glass-control text-apple-muted hover:text-apple-text"}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </ScrollRow>

      {state.status === "loading" && <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div>}
      
      {(state.status === "error" || (state.status === "ready" && !state.items.length)) && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p role="status" className="text-sm text-apple-muted">
            {state.status === "error"
              ? "Community place data is temporarily unavailable for this area. The trip pin and map still work."
              : "No community-mapped places were found within 2 km. This does not mean there are no businesses nearby."}
          </p>
          <a href={mapsSearch} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-black">
            Search {kind} in Google Maps <ExternalLink size={13} />
          </a>
        </div>
      )}

      <ul className="space-y-2">
        {state.items.map((p) => (
          <li key={p.placeId} className="glass-surface rounded-2xl p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-apple-muted">
                  {p.rating != null && <span className="inline-flex items-center gap-0.5"><Star size={11} className="fill-amber-300 text-amber-300" />{p.rating.toFixed(1)}{p.ratingCount ? ` (${p.ratingCount.toLocaleString()})` : ""}</span>}
                  {PRICE[p.priceLevel] && <span>{PRICE[p.priceLevel]}</span>}
                  <span>{fmtKm(p.distanceKm)} away</span>
                </p>
                {p.address && <p className="mt-0.5 truncate text-[11px] text-apple-muted">{p.address}</p>}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.mapsUri && <a href={p.mapsUri} target="_blank" rel="noopener noreferrer" className={btn}>Open Google Maps <ExternalLink size={12} /></a>}
              <button className={btn} disabled={!!editor.busy} onClick={() => editor.addVerified(dayNo, { ...p, kind })}><Plus size={13} /> Add to Day {dayNo}</button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-apple-muted">Place records from Geoapify / OpenStreetMap. Community data may not include ratings, prices or opening hours. © OpenStreetMap contributors.</p>
    </div>
  );
}