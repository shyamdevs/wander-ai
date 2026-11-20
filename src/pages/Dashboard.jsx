import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTrip } from "../context/TripContext";
import useMediaQuery from "../hooks/useMediaQuery";
import GlassCard from "../components/GlassCard";
import BottomSheet from "../components/BottomSheet";
import PlanPanel from "../components/PlanPanel";
import TripOverlay from "../components/TripOverlay";
import MapHud from "../components/MapHud";

// Heavy pieces are only downloaded when first needed
const SatelliteMap = lazy(() => import("../components/SatelliteMap")); // Leaflet + Esri imagery; no Google key required
const DestinationView = lazy(() => import("../components/destination/DestinationView"));
const AssistantPanel = lazy(() => import("../components/AssistantPanel"));
const MapView = SatelliteMap;
const spring = { type: "spring", stiffness: 300, damping: 30 };

export default function Dashboard() {
  const desktop = useMediaQuery("(min-width: 1200px)");
  const { plan, mapOpen, closeMap, loadTrips, destination, pick } = useTrip();
  const [snap, setSnap] = useState(1);

  useEffect(() => { loadTrips(); }, [loadTrips]);
  useEffect(() => () => closeMap(), []); // eslint-disable-line react-hooks/exhaustive-deps
  // Give the sheet room when there is something to look at
  useEffect(() => { if (plan || pick) setSnap(1); }, [!!plan, !!pick]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    // Wrapper ignores the mouse so the globe / map underneath still reacts
    <motion.div className="pointer-events-none relative h-[100dvh]" exit={{ opacity: 0, transition: { duration: 0.2 } }}>
      <AnimatePresence>
        {mapOpen && (
          <Suspense key="map" fallback={null}>
            <MapView />
          </Suspense>
        )}
      </AnimatePresence>
      <MapHud />

      {desktop ? (
        <div className="pointer-events-none flex h-full gap-4 p-4">
          <GlassCard
            className="workspace-sidebar glass-panel pointer-events-auto relative z-10 flex h-full w-[min(420px,36vw)] min-w-[340px] shrink-0 flex-col overflow-hidden rounded-[28px]"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={spring}
          >
            <PlanPanel />
          </GlassCard>
          <TripOverlay />
        </div>
      ) : (
        <BottomSheet snap={snap} setSnap={setSnap}>
          <PlanPanel mobile />
        </BottomSheet>
      )}

      <Suspense fallback={null}>
        <AnimatePresence>{destination && <DestinationView key="destination" />}</AnimatePresence>
        {plan && <AssistantPanel />}
      </Suspense>
    </motion.div>
  );
}
