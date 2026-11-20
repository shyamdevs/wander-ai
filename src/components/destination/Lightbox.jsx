import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import ImageWithLoader from "../ui/ImageWithLoader";

const nav = "absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70";

// Full-screen photo viewer with keyboard + button navigation and the required author credit
export default function Lightbox({ photos, index, name, onIndex, onClose }) {
  const go = useCallback((direction) => onIndex((index + direction + photos.length) % photos.length), [index, onIndex, photos.length]);
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const p = photos[index];
  const author = p.attributions?.[0];
  return (
    <div role="dialog" aria-modal="true" aria-label={`${name} photos`} className="pointer-events-auto fixed inset-0 z-[95] flex flex-col bg-black/95">
      <div className="flex items-center justify-between p-3 text-sm text-white">
        <span className="tabular-nums text-white/70">{index + 1} / {photos.length}</span>
        <button onClick={onClose} aria-label="Close photo viewer" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"><X size={20} /></button>
      </div>
      <div className="relative min-h-0 flex-1">
        <ImageWithLoader src={p.uri} alt={`${name}${author ? `, photo by ${author.name}` : ""}`} loading="eager" className="absolute inset-0 h-full w-full" imageClassName="object-contain" />
        {photos.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous photo" className={`${nav} left-3`}><ChevronLeft size={22} /></button>
            <button onClick={() => go(1)} aria-label="Next photo" className={`${nav} right-3`}><ChevronRight size={22} /></button>
          </>
        )}
      </div>
      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 p-3 text-center text-xs text-white/70">
        {author ? <>Photo by {author.name}</> : "Photo"} · {p.license || "License details on source page"}
        {p.sourceUrl && <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">View original source</a>}
        {p.licenseUrl && <a href={p.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">License</a>}
      </p>
    </div>
  );
}
