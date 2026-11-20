import { Children, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const arrow =
  "absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/90 text-white shadow-lg backdrop-blur transition hover:border-sky-400/50 hover:bg-slate-900 [@media(hover:hover)_and_(pointer:fine)]:flex";

/**
 * Horizontally scrolling row that also works with a mouse: arrow buttons appear while there is
 * more to see, and the wheel scrolls it sideways (only while it can still move that way, so page
 * scrolling is never trapped). Padding around the chips leaves room for their glow, which
 * overflow-x clips otherwise.
 */
export default function ScrollRow({ children, className = "", ...rest }) {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ left: false, right: false });
  const count = Children.count(children);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    const onWheel = (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return; // already a sideways gesture
      const canLeft = el.scrollLeft > 0;
      const canRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      if ((event.deltaY > 0 && canRight) || (event.deltaY < 0 && canLeft)) {
        event.preventDefault();
        el.scrollLeft += event.deltaY;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => { observer.disconnect(); el.removeEventListener("wheel", onWheel); };
  }, [update, count]);

  const nudge = (direction) => ref.current?.scrollBy({ left: direction * ref.current.clientWidth * 0.7, behavior: "smooth" });

  return (
    <div className="relative">
      {edge.left && <button type="button" tabIndex={-1} aria-label="Scroll left" onClick={() => nudge(-1)} className={`${arrow} left-0`}><ChevronLeft size={16} /></button>}
      <div ref={ref} onScroll={update} className={`flex overflow-x-auto px-1 py-1.5 no-scrollbar ${className}`} {...rest}>
        {children}
      </div>
      {edge.right && <button type="button" tabIndex={-1} aria-label="Scroll right" onClick={() => nudge(1)} className={`${arrow} right-0`}><ChevronRight size={16} /></button>}
    </div>
  );
}