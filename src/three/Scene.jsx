import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useLocation } from "react-router-dom";
import { usePointerTracking } from "./pointer";
import { useTrip } from "../context/TripContext";
import CameraRig from "./CameraRig";
import Globe from "./Globe";
import Compass from "./Compass";
import useMediaQuery from "../hooks/useMediaQuery";

// True while the browser tab is visible; the globe stops rendering when it is hidden.
function usePageVisible() {
  const [visible, setVisible] = useState(() => document.visibilityState !== "hidden");
  useEffect(() => {
    const on = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  return visible;
}

const routeToPreset = (path) =>
  path === "/" || path.startsWith("/shared") ? "landing" : path === "/login" ? "login" : path === "/signup" ? "signup" : "app";

export default function Scene() {
  const { pathname } = useLocation();
  // R3F can't read React context inside <Canvas>, so state is read here and passed down as props
  const { plan, focus, activeDay, focusStop, status, generationKey, pick, pickPlace, mapOpen, openMap } = useTrip();
  const preset = routeToPreset(pathname);
  const isAuth = preset === "login" || preset === "signup";
  const isApp = preset === "app";
  const loading = isApp && status === "loading";
  const showTrip = isApp && !loading; // while Gemini thinks: zoom out + spin fast, then fly in
  const pickable = showTrip && !plan; // tapping the Earth only picks a destination before a plan exists
  usePointerTracking();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const touch = useMediaQuery("(pointer: coarse)");
  const pageVisible = usePageVisible();

  return (
    <div
      className="fixed inset-0 z-0"
      style={{ background: "radial-gradient(ellipse at 50% 42%, #10233a 0%, #070b14 52%, #03060c 100%)" }}
    >
      <Canvas
        // Cap pixel ratio on phones: 3x devices would render 9x the pixels for little visible gain
        dpr={touch ? [1, 1.5] : [1, 2]}
        gl={{ antialias: !touch, powerPreference: touch ? "low-power" : "default" }}
        // The satellite map covers the canvas and a hidden tab cannot be seen, so stop rendering in both cases
        frameloop={(isApp && mapOpen) || !pageVisible ? "never" : "always"}
        style={{ touchAction: "none" }}
        camera={{ fov: 45, position: [0, 0.5, 4.1], near: 0.05, far: 200 }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 3, 5]} intensity={2.2} color="#dbe7ff" />
        <directionalLight position={[-5, -2, -3]} intensity={0.7} color="#6b8cff" />
        <Stars radius={70} depth={50} count={touch ? 1500 : 3500} factor={3.2} saturation={0} fade speed={reducedMotion ? 0 : 0.6} />
        <CameraRig preset={preset} radius={showTrip && focus ? focus.r : undefined} />
        <Globe
          spin={reducedMotion ? (loading ? 0.25 : 0) : loading ? 1.15 : isAuth ? 0.09 : 0.05}
          focus={showTrip ? focus : null}
          spinTrigger={generationKey}
          plan={showTrip ? plan : null}
          activeDay={activeDay}
          focusStop={focusStop}
          pick={pickable ? pick : null}
          onPick={pickable ? (p) => pickPlace(p.lat, p.lon) : null}
          onDeepZoom={isApp ? openMap : null}
          interactive={isApp || preset === "landing"}
          showArcs={!isApp}
        />
        <Compass visible={isAuth} />
      </Canvas>
    </div>
  );
}