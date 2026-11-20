import { Globe, Layers, Loader2, Minus, Plus } from "lucide-react";
import { useTrip } from "../context/TripContext";
import { zoomBy } from "../three/viewState";

const btn =
  "glass-control flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition hover:border-sky-400/40 active:scale-95";

// Top-right controls: globe zoom, switch between 3D globe and satellite map
export default function MapHud() {
  const { mapOpen, openMap, closeMap, status } = useTrip();

  return (
    <div className="pointer-events-auto fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 sm:right-4 flex items-center gap-2">
      {status === "loading" && (
        <span className={btn}>
          <Loader2 size={15} className="animate-spin" /> <span className="hidden sm:inline">Gemini is planning…</span>
        </span>
      )}
      {!mapOpen && (
        <div className="hidden gap-2 lg:flex">
          <button aria-label="Zoom out" className={`${btn} !w-11 !px-0`} onClick={() => zoomBy(1.3)}>
            <Minus size={16} />
          </button>
          <button aria-label="Zoom in" className={`${btn} !w-11 !px-0`} onClick={() => zoomBy(0.75) && openMap()}>
            <Plus size={16} />
          </button>
        </div>
      )}
      <button className={`${btn} ${!mapOpen ? "accent-gradient border-transparent" : ""}`} onClick={mapOpen ? closeMap : openMap}>
        {mapOpen ? <><Globe size={16} /> 3D Globe</> : <><Layers size={16} /> Satellite</>}
      </button>
    </div>
  );
}
