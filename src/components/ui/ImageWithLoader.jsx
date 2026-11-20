import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, RotateCw } from "lucide-react";

/**
 * Image frame with an Obsidian Cartography shimmer state.
 * The frame reserves its dimensions before the remote image is ready, preventing layout shifts.
 */
export default function ImageWithLoader({
  src,
  alt = "",
  className = "",
  imageClassName = "",
  loading = "lazy",
  decoding = "async",
  showLoadingLabel = true,
  unavailableLabel = "Image unavailable",
  retryable = true,
  aspectRatio,
  onLoad,
  onError,
  ...imageProps
}) {
  const imageRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0); // bumping this remounts <img>, which re-requests the file

  useEffect(() => {
    setStatus("loading");
    setAttempt(0);
    const image = imageRef.current;
    // Cached images can finish before the effect runs, so inspect the element as well.
    if (image?.complete) {
      setStatus(image.naturalWidth > 0 ? "loaded" : "error");
    }
  }, [src]);

  const handleLoad = (event) => {
    setStatus("loaded");
    onLoad?.(event);
  };

  const retry = (event) => {
    event.preventDefault();
    event.stopPropagation(); // do not trigger a parent click such as opening the lightbox
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  const handleError = (event) => {
    setStatus("error");
    onError?.(event);
  };

  return (
    <span
      className={`image-loading-frame relative isolate block overflow-hidden bg-slate-900/70 ${className}`}
      data-image-state={status}
      aria-busy={status === "loading"}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {status === "loading" && (
        <span className="image-loading-surface absolute inset-0 z-10 flex items-center justify-center" aria-hidden="true">
          <span className="flex flex-col items-center gap-2 text-sky-100/75">
            <span className="image-loading-orbit" aria-hidden="true">
              <ImageIcon size={18} strokeWidth={1.7} />
            </span>
            {showLoadingLabel && <span className="text-[10px] font-medium tracking-[0.12em] uppercase">Loading image</span>}
          </span>
        </span>
      )}

      {status === "error" && (
        <span className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-950/80 px-3 text-center text-slate-400" role="status">
          <ImageIcon size={20} strokeWidth={1.6} />
          <span className="text-[10px] font-medium tracking-wide">{unavailableLabel}</span>
          {retryable && (
            <button
              type="button"
              onClick={retry}
              className="pointer-events-auto inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-sky-300/40 px-3 text-[11px] font-semibold text-sky-200 transition hover:bg-sky-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              <RotateCw size={12} aria-hidden="true" /> Retry
            </button>
          )}
        </span>
      )}

      <img
        {...imageProps}
        key={attempt}
        ref={imageRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={handleLoad}
        onError={handleError}
        className={`absolute inset-0 z-0 h-full w-full transition-opacity duration-500 ease-out ${status === "loaded" ? "opacity-100" : "opacity-0"} ${imageClassName}`}
      />
    </span>
  );
}
