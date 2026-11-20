import { lazy, Suspense, useState } from "react";
import { ExternalLink, ImageOff, LoaderCircle } from "lucide-react";
import ImageWithLoader from "../ui/ImageWithLoader";
import Skeleton from "../ui/Skeleton";

const Lightbox = lazy(() => import("./Lightbox"));

export default function PhotoGallery({
  photos = [], name, loading = false, failed = false, hasMore = false,
  loadingMore = false, providers = [], onLoadMore, onRetry, onBroken,
}) {
  const [at, setAt] = useState(null);
  if (loading && !photos.length) {
    return (
      <div className="space-y-3" aria-live="polite">
        <p className="text-xs text-apple-muted">Searching Wikimedia Commons, Openverse and nearby geotagged photos…</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className={item === 0 ? "col-span-2 aspect-[16/9] sm:col-span-3" : "aspect-square"} />)}
        </div>
      </div>
    );
  }
  if (!photos.length) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-apple-muted">
        <ImageOff size={24} />
        {failed ? "Photo providers are temporarily unavailable. Try again in a moment." : "No suitably matched, openly licensed photos were found for this place."}
        <p className="text-[11px]">Wander AI only displays real photos with a source and license link. It does not fill the gallery with unrelated or AI-generated pictures.</p>
        {hasMore && onLoadMore && <button disabled={loadingMore} onClick={onLoadMore} className="glass-control mt-2 inline-flex min-h-[42px] items-center gap-2 rounded-full px-5 text-xs font-semibold disabled:opacity-60">{loadingMore ? <><LoaderCircle size={14} className="animate-spin" /> Searching…</> : "Search more photos"}</button>}
        {failed && onRetry && <button onClick={onRetry} className="glass-control mt-2 min-h-[42px] rounded-full px-5 text-xs font-semibold">Retry photo search</button>}
      </div>
    );
  }
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="telemetry-chip text-slate-400">{photos.length} photos · verified source metadata</span>
        <span className="text-[10px] text-apple-muted">{providers.join(" · ")}</span>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <li key={photo.id || photo.uri} className={index === 0 ? "col-span-2 sm:col-span-3" : ""}>
            <button onClick={() => setAt(index)} aria-label={`Open photo ${index + 1} of ${photos.length}`}
              className={`group relative block w-full overflow-hidden rounded-2xl bg-white/5 ${index === 0 ? "aspect-[16/9]" : "aspect-square"}`}>
              <ImageWithLoader retryable={false} loading={index < 6 ? "eager" : "lazy"} onError={() => onBroken?.(photo)} src={photo.uri} alt={`${name}, ${photo.title || `photo ${index + 1}`}`} className={`h-full w-full ${index === 0 ? "aspect-[16/9]" : "aspect-square"}`} imageClassName="object-cover transition duration-300 group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/85 to-transparent px-2 pb-2 pt-7 text-left text-[10px] text-white/90">
                <span className="min-w-0 truncate">{photo.attributions?.[0]?.name || "Unknown contributor"} · {photo.license || "See source license"}</span>
                <ExternalLink size={12} className="shrink-0" />
              </span>
              {photo.matchLabel && <span className="absolute left-2 top-2 max-w-[80%] truncate rounded-full border border-white/15 bg-black/65 px-2 py-1 text-[9px] text-white/90 backdrop-blur">{photo.matchLabel}</span>}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-col items-center gap-2">
        <p className="text-center text-[11px] text-apple-muted">Every photo links to its original source and license. Confirm license terms before reuse outside Wander AI.</p>
        {hasMore && (
          <button disabled={loadingMore} onClick={onLoadMore} className="glass-control inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-xs font-semibold disabled:opacity-60">
            {loadingMore ? <><LoaderCircle size={14} className="animate-spin" /> Finding more photos…</> : "Load more photos"}
          </button>
        )}
      </div>
      {at !== null && photos[at] && <Suspense fallback={null}><Lightbox photos={photos} index={at} name={name} onIndex={setAt} onClose={() => setAt(null)} /></Suspense>}
    </>
  );
}
