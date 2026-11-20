// The satellite canvas stays separate from the itinerary glass surfaces so map-provider
// credits and attribution remain visible at all viewport sizes.
export const MAP_BOX =
  "pointer-events-auto fixed z-0 overflow-hidden bg-neutral-950 inset-x-0 top-0 bottom-[var(--sheet-h,52dvh)] " +
  "lg:inset-y-4 lg:left-[472px] lg:right-4 lg:bottom-4 lg:rounded-[28px] lg:border lg:border-white/10";
