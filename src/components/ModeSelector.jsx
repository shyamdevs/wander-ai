import { Bike, Car, Footprints, Sparkles, TrainFront } from "lucide-react";
import { useTrip } from "../context/TripContext";

const MODES = [["AUTO", "Auto", Sparkles], ["WALK", "Walk", Footprints], ["DRIVE", "Drive", Car], ["CYCLE", "Cycle", Bike], ["TRANSIT", "Transit", TrainFront]];

// Auto = walk short hops, otherwise drive. Walk, cycling and driving use live route providers when configured; transit remains an estimate.
export default function ModeSelector() {
  const { travelMode, setTravelMode } = useTrip();
  return (
    <div role="radiogroup" aria-label="Travel mode" className="flex w-full rounded-full bg-black/30 p-1">
      {MODES.map(([id, label, Icon]) => (
        <button
          key={id}
          role="radio"
          aria-checked={travelMode === id}
          onClick={() => setTravelMode(id)}
          className={`flex min-h-[40px] min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-1.5 text-xs font-medium transition ${
            travelMode === id ? "bg-white/20 text-apple-text" : "text-apple-muted hover:text-apple-text"
          }`}
        >
          <Icon size={14} className="shrink-0" aria-hidden="true" /> <span className="truncate max-[380px]:sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
