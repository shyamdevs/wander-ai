import { lazy, Suspense, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Images, Map, MapPin, Navigation, Star } from "lucide-react";
import { useTrip } from "../../context/TripContext";
import usePlace from "../../hooks/usePlace";
import useDestinationPhotos from "../../hooks/useDestinationPhotos";
import useDayLegs from "../../hooks/useDayLegs";
import { buildSchedule, stopMinutes } from "../../utils/schedule";
import { directionsUrl, estimateLeg, fmtDuration } from "../../utils/geo";
import { dayColor } from "../../three/tripHelpers";
import { CATEGORY_ICONS } from "../categoryIcons";
import Skeleton from "../ui/Skeleton";
import ImageWithLoader from "../ui/ImageWithLoader";
import Badge from "../ui/Badge";
import Overview from "./Overview";
import ScrollRow from "../ui/ScrollRow";

// Each heavy tab is its own chunk, loaded only when opened
const PhotoGallery = lazy(() => import("./PhotoGallery"));
const DestinationMap = lazy(() => import("./DestinationMap"));
const StreetViewPanel = lazy(() => import("./StreetViewPanel"));
const NearbyList = lazy(() => import("./NearbyList"));

const TABS = [["overview", "Overview"], ["photos", "Photos"], ["map", "Map"], ["street", "Street View"], ["nearby", "Nearby"]];
const ACTION = "glass-control flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-3 text-xs font-semibold transition hover:border-sky-400/40 hover:bg-sky-400/10 active:scale-95 sm:text-sm";
const ICON_BTN = "glass-control flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition disabled:opacity-30";

function Body() {
  const { destination, plan, travelMode, closeDestination, openDestination, verifyStop } = useTrip();
  const { stop, day, index, prev, next } = destination;
  const [tab, setTab] = useState("overview");
  const place = usePlace(stop, plan.destination, (p) => verifyStop(stop.sid, p));
  const photoState = useDestinationPhotos({ name: stop.name, destination: plan.destination, latitude: stop.latitude, longitude: stop.longitude });
  const { legs } = useDayLegs(day.stops, travelMode, true);
  const sched = useMemo(() => buildSchedule(day.stops, legs), [day.stops, legs]);

  const loc = { latitude: stop.latitude, longitude: stop.longitude }; // provider-verified point once confirmed
  const photos = photoState.photos || [];
  const color = dayColor(day.day);
  const Icon = CATEGORY_ICONS[stop.category] || CATEGORY_ICONS.sightseeing;
  const mode = travelMode === "AUTO" ? (prev ? estimateLeg(prev, stop).mode : "DRIVE") : travelMode;
  const directions = directionsUrl({ destination: loc, mode });
  const fallback = <Skeleton className="h-64 w-full" />;

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-white/[0.025] p-3">
        <button onClick={closeDestination} className="glass-control flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition">
          <ArrowLeft size={16} /> Back to My Trip
        </button>
        <span className="min-w-0 flex-1 truncate text-center text-xs text-apple-muted">Day {day.day} · stop {index + 1} of {day.stops.length}</span>
        <button disabled={!prev} onClick={() => openDestination(prev)} aria-label={prev ? `Previous: ${prev.name}` : "No previous stop"} className={ICON_BTN}><ChevronLeft size={18} /></button>
        <button disabled={!next} onClick={() => openDestination(next)} aria-label={next ? `Next: ${next.name}` : "No next stop"} className={ICON_BTN}><ChevronRight size={18} /></button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button onClick={() => setTab("photos")} aria-label="Explore photos" className="relative block aspect-[16/9] w-full overflow-hidden bg-white/5 text-left lg:rounded-t-none">
          {photos[0] ? (
            <ImageWithLoader src={photos[0].uri} alt={stop.name} retryable={false} loading="eager" onError={() => photoState.markBroken(photos[0])} className="absolute inset-0 h-full w-full" imageClassName="object-cover" />
          ) : photoState.status === "loading" ? (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-900 via-sky-950/60 to-slate-900" aria-label="Loading destination photos" />
          ) : (
            <div className="flex h-full items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}66, transparent 70%)` }}>
              <Icon size={44} className="text-white/40" />
            </div>
          )}
          {photos[0]?.attributions?.[0] && (
            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8 text-[10px] text-white/90">Photo: {photos[0].attributions[0].name} · {photos[0].sourceName || photos[0].provider || "Open media"}</span>
          )}
        </button>

        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <div className="mb-2 flex items-center gap-2"><span className="telemetry-chip rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-1">Waypoint #{String(index + 1).padStart(2, "0")}</span><span className="telemetry-chip text-slate-500">Day {day.day}</span></div>
            <h2 className="text-2xl font-extrabold tracking-tight">{place.data?.name || stop.name}</h2>
            <p className="mt-1 flex items-start gap-1.5 text-sm text-apple-muted">
              <MapPin size={15} className="mt-0.5 shrink-0" />
              {place.data?.address || (place.status === "loading" ? "Checking place information…" : "Address not verified")}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {place.data?.rating != null && (
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5">
                  <Star size={12} className="fill-amber-300 text-amber-300" /> {place.data.rating.toFixed(1)}
                  {place.data.ratingCount ? <span className="text-apple-muted">({place.data.ratingCount.toLocaleString()})</span> : null}
                  <Badge kind="verified" />
                </span>
              )}
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">~{fmtDuration(stopMinutes(stop))} <Badge kind="estimate" /></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className={ACTION} onClick={() => setTab("photos")}><Images size={16} /> Explore Photos</button>
            <button className={ACTION} onClick={() => setTab("map")}><Map size={16} /> View on Map</button>
            <button className={ACTION} onClick={() => setTab("street")}><Eye size={16} /> Explore Street View</button>
            <a className={ACTION} href={directions} target="_blank" rel="noopener noreferrer"><Navigation size={16} /> Get Directions</a>
          </div>

          <ScrollRow role="tablist" className="gap-1">
            {TABS.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={`min-h-[44px] shrink-0 rounded-full px-4 text-sm font-medium transition ${tab === id ? "bg-sky-400 text-slate-950 shadow-cyan" : "text-apple-muted hover:bg-white/5 hover:text-apple-text"}`}>
                {label}
              </button>
            ))}
          </ScrollRow>

          <Suspense fallback={fallback}>
            {tab === "overview" && <Overview stop={stop} place={place} plan={plan} day={day} index={index} legs={legs} sched={sched} />}
            {tab === "photos" && <PhotoGallery photos={photos} name={stop.name} loading={photoState.status === "loading"} failed={photoState.failed || photoState.status === "error"} hasMore={photoState.hasMore} loadingMore={photoState.loadingMore} providers={photoState.providers} onLoadMore={photoState.loadMore} onRetry={photoState.retry} onBroken={photoState.markBroken} />}
            {tab === "map" && <DestinationMap location={loc} name={stop.name} />}
            {tab === "street" && <StreetViewPanel location={loc} onBack={() => setTab("map")} />}
            {tab === "nearby" && <NearbyList location={loc} dayNo={day.day} />}
          </Suspense>
        </div>
      </div>
    </>
  );
}

// Overlay: full-screen page on phones, a panel beside the itinerary on desktop.
// The itinerary stays mounted underneath, so closing returns to the exact same place.
export default function DestinationView() {
  const { destination } = useTrip();
  if (!destination) return null;
  return (
    <motion.div
      role="dialog"
      aria-label={`${destination.stop.name} details`}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 28 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="glass-panel pointer-events-auto fixed inset-0 z-40 flex flex-col overflow-hidden bg-slate-950/95 xl:inset-y-4 xl:left-[472px] xl:right-auto xl:w-[min(560px,calc(100vw-488px))] xl:rounded-3xl xl:shadow-2xl"
    >
      <Body key={destination.stop.sid} />
    </motion.div>
  );
}