import { useEffect, useRef, useState } from "react";
import { ExternalLink, MapPinned } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { placeUrl } from "../../utils/geo";
import { SAT, LABELS, ATTR } from "../mapHelpers";

export default function DestinationMap({ location, name }) {
  const box = useRef(null);
  const map = useRef(null);
  const [type, setType] = useState("satellite");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!box.current) return undefined;
    const center = [location.latitude, location.longitude];
    const instance = L.map(box.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false }).setView(center, 16);
    const satellite = L.layerGroup([
      L.tileLayer(SAT, { maxNativeZoom: 18, maxZoom: 19, attribution: ATTR }),
      L.tileLayer(LABELS, { maxNativeZoom: 18, maxZoom: 19, opacity: 0.9, attribution: ATTR }),
    ]).addTo(instance);
    const streets = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
    });
    L.circleMarker(center, { radius: 9, color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 })
      .addTo(instance).bindTooltip(name, { direction: "top" });
    const resize = new ResizeObserver(() => instance.invalidateSize());
    resize.observe(box.current);
    instance.on("tileerror", () => setError(true));
    map.current = { instance, satellite, streets };
    return () => { resize.disconnect(); instance.remove(); map.current = null; };
  }, [location.latitude, location.longitude, name]);

  useEffect(() => {
    if (!map.current) return;
    const { instance, satellite, streets } = map.current;
    if (type === "satellite") { streets.remove(); satellite.addTo(instance); }
    else { satellite.remove(); streets.addTo(instance); }
  }, [type]);

  return (
    <div>
      <div className="relative h-[min(52dvh,420px)] overflow-hidden rounded-2xl bg-white/5">
        <div ref={box} className="h-full w-full" />
        <div className="absolute left-3 top-3 z-[500] flex rounded-full border border-white/20 bg-black/65 p-1 backdrop-blur-xl" role="group" aria-label="Map layer">
          {[ ["satellite", "Satellite"], ["street", "Road map"] ].map(([id, label]) => (
            <button key={id} onClick={() => setType(id)} aria-pressed={type === id}
              className={`min-h-[36px] rounded-full px-3 text-xs font-medium ${type === id ? "bg-white text-black" : "text-white"}`}>{label}</button>
          ))}
        </div>
        {error && <span className="absolute bottom-3 left-3 z-[500] rounded-lg bg-black/70 px-2 py-1 text-[10px] text-white">Satellite imagery is partially unavailable; the location pin remains usable</span>}
      </div>
      <a href={placeUrl(location)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-sm text-apple-blue">
        <MapPinned size={14} /> Open in Google Maps <ExternalLink size={14} />
      </a>
      <p className="mt-1 text-[11px] text-apple-muted">Satellite imagery © Esri and its imagery providers. Road map © OpenStreetMap contributors.</p>
    </div>
  );
}
