import { useEffect, useState } from "react";
import { ExternalLink, Map, Maximize2, Minimize2, ImageOff, LoaderCircle, Compass } from "lucide-react";
import { streetImagery } from "../../api/places";
import Skeleton from "../ui/Skeleton";
import ImageWithLoader from "../ui/ImageWithLoader";

const GOOGLE_STREET_URL = ({ latitude, longitude }) =>
  `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;

export default function StreetViewPanel({ location, onBack }) {
  const [state, setState] = useState({ status: "loading", images: [], viewerLinks: [], providerStatus: [] });
  const [full, setFull] = useState(false);
  const [broken, setBroken] = useState(() => new Set()); // images that failed to load are dropped, not shown as errors

  useEffect(() => {
    let dead = false;
    setState({ status: "loading", images: [], viewerLinks: [], providerStatus: [] });
    setBroken(new Set());
    streetImagery(location)
      .then((data) => { if (!dead) setState({ status: "ready", ...data }); })
      .catch(() => { if (!dead) setState({ status: "error", images: [], viewerLinks: [] }); });
    return () => { dead = true; };
  }, [location.latitude, location.longitude]);

  // The expanded view covers the whole screen, so it needs a keyboard way out.
  useEffect(() => {
    if (!full) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  const images = (state.images || []).filter((photo) => !broken.has(photo.id));
  const hadImages = (state.images || []).length > 0;
  const viewerLinks = state.viewerLinks?.length ? state.viewerLinks : [
    { name: "KartaView", url: `https://kartaview.org/map/@${location.latitude},${location.longitude},16z` },
    { name: "Google Maps Street View", url: GOOGLE_STREET_URL(location) },
  ];

  return (
    <div className={full ? "fixed inset-0 z-[100] space-y-3 overflow-y-auto bg-neutral-950 p-4" : "space-y-3"} {...(full ? { role: "dialog", "aria-modal": "true", "aria-label": "Street-level imagery" } : {})}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Community street-level imagery</p>
          <p className="text-[11px] text-apple-muted">Searching Mapillary, KartaView and Panoramax together. Coverage varies by location.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFull((value) => !value)} className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 text-xs">
            {full ? <Minimize2 size={14} /> : <Maximize2 size={14} />} {full ? "Exit" : "Expand"}
          </button>
          <button onClick={onBack} className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 text-xs"><Map size={14} /> Back to map</button>
        </div>
      </div>

      {state.status === "loading" && (
        <div className="space-y-2" aria-live="polite">
          <div className="flex items-center gap-2 text-xs text-sky-300"><LoaderCircle size={14} className="animate-spin" /> Checking three community imagery networks…</div>
          <div className="grid grid-cols-2 gap-2">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="aspect-[4/3]" />)}</div>
        </div>
      )}

      {state.status === "error" && <p role="status" className="rounded-2xl bg-white/5 p-4 text-sm text-apple-muted">Street imagery services could not be reached. You can still open the destination in an external street-view map below.</p>}

      {state.status === "ready" && state.providerStatus?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {state.providerStatus.map((provider) => (
            <span key={provider.name} className={`rounded-full border px-2.5 py-1 text-[10px] ${provider.status === "available" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/5 text-apple-muted"}`}>
              {provider.name}{provider.status === "available" ? ` · ${provider.count}` : provider.status === "not-configured" ? " · token needed" : provider.status === "no-coverage" ? " · no nearby photos" : " · offline"}
            </span>
          ))}
        </div>
      )}

      {state.status === "ready" && images.length > 0 && state.searchRadiusM > 500 && (
        <p role="status" className="rounded-xl bg-white/5 px-3 py-2 text-[11px] text-apple-muted">No imagery exactly here, so this shows the closest community photos within about {state.searchRadiusM >= 1000 ? `${state.searchRadiusM / 1000} km` : `${state.searchRadiusM} m`}. Distances are shown on each photo.</p>
      )}

      {state.status === "ready" && images.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <ImageOff size={26} className="text-apple-muted" />
          <p className="text-sm text-apple-muted">{hadImages ? "The nearby photos could not be loaded right now." : state.providersUnavailable ? "Street imagery providers are not configured or temporarily unavailable." : "No community street-level images were found within about 4 km of this location."}</p>
          <p className="text-[11px] text-apple-muted">Try an external coverage viewer. It may show a nearby panorama even when this location has no exact image.</p>
        </div>
      )}

      {images.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {images.map((photo) => (
            <li key={photo.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="block" aria-label={`Open original ${photo.source} imagery`}>
                <ImageWithLoader retryable={false} onError={() => setBroken((prev) => new Set(prev).add(photo.id))} src={photo.imageUrl} alt={`Street-level image from ${photo.source}`} className="aspect-[4/3] w-full" imageClassName="object-cover" />
              </a>
              <div className="flex items-center justify-between gap-2 p-3 text-[11px] text-apple-muted">
                <div className="min-w-0">
                  <p className="truncate">{photo.source} · {photo.credit}</p>
                  {photo.license && <p className="mt-0.5 truncate text-[10px] text-slate-500">License: {photo.license}</p>}
                  <p className="mt-0.5 flex flex-wrap items-center gap-2">
                    {photo.capturedAt && <span>{new Date(photo.capturedAt).toLocaleDateString()}</span>}
                    {photo.distanceKm != null && <span>{photo.distanceKm < 1 ? `${Math.round(photo.distanceKm * 1000)} m away` : `${photo.distanceKm.toFixed(1)} km away`}</span>}
                    {photo.heading != null && <span className="inline-flex items-center gap-1"><Compass size={10} /> {Math.round(photo.heading)}°</span>}
                  </p>
                </div>
                <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${photo.source}`}><ExternalLink size={13} /></a>
              </div>
            </li>
          ))}
        </ul>
      )}

      <a href={GOOGLE_STREET_URL(location)} target="_blank" rel="noopener noreferrer" className="accent-gradient flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold">
        Open Google Street View <ExternalLink size={14} />
      </a>
      <div className="flex flex-wrap gap-2">
        {viewerLinks.filter((link) => link.name !== "Google Maps Street View").map((link) => (
          <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 text-xs font-medium hover:border-sky-400/40 hover:bg-sky-400/10">
            {link.name} <ExternalLink size={13} />
          </a>
        ))}
      </div>
      <p className="text-[11px] text-apple-muted">Community imagery remains hosted by each provider. Capture dates, contributor credits and source links are shown when the source supplies them. Google Maps is an external fallback only; no Maps API is called.</p>
    </div>
  );
}
