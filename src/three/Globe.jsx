import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { pointer } from "./pointer";
import { view } from "./viewState";
import { useGlobeDrag } from "./useGlobeDrag";
import { vectorToLatLon } from "./utils";
import Atmosphere from "./Atmosphere";
import Earth from "./Earth";
import TravelArcs from "./TravelArcs";
import TripPins, { Pin } from "./TripPins";
import TripRoute from "./TripRoute";

const MARKER = 0.022;
const AX = new THREE.Vector3(1, 0, 0);
const AY = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3();

// Damp an angle along the shortest way round
function dampAngle(cur, target, lambda, dt) {
  const d = ((((target - cur + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
  return cur + d * (1 - Math.exp(-lambda * dt));
}

/**
 * focus       { dir, pinSize }  globe turns so this direction faces the camera
 * plan        pins + routes (only the active day's, or all days)
 * pick        place the user tapped (white pin, red if open ocean)
 * onPick      called with {lat, lon} when the user taps the Earth
 * onDeepZoom  user kept zooming in at the closest distance -> open satellite map
 * interactive drag 360° on or off (wheel / pinch zoom also needs onDeepZoom, i.e. the dashboard)
 */
export default function Globe({
  spin = 0.05, focus = null, plan = null, activeDay = "all", focusStop = null,
  pick = null, onPick = null, onDeepZoom = null, interactive = false, showArcs = true, spinTrigger = 0,
}) {
  const tilt = useRef();
  const spinner = useRef();
  const free = useRef(false); // user has taken manual control
  const tiltBase = useRef(0);
  const drag = useGlobeDrag(interactive, onDeepZoom);

  // A new focus (or leaving the dashboard) hands control back to the camera logic
  useEffect(() => {
    free.current = false;
    drag.current.inertia = 0;
    view.scale = 1;
  }, [focus, interactive, drag]);

  // Every new/adjusted plan resets manual globe control and starts a fresh spin.
  useEffect(() => {
    free.current = false;
    drag.current.inertia = 0;
    tiltBase.current = 0;
    view.scale = 1;
  }, [spinTrigger, drag]);

  useFrame(({ camera }, dt) => {
    const s = spinner.current;
    const d = drag.current;
    // Rotate slower the closer we are, so zoomed-in dragging stays precise
    const sens = THREE.MathUtils.clamp((camera.position.length() - 1) * 0.45, 0.04, 1);

    if (Math.abs(d.dx) + Math.abs(d.dy) > 3) {
      free.current = true;
      s.rotation.y += d.dx * 0.006 * sens;
      tiltBase.current = THREE.MathUtils.clamp(tiltBase.current + d.dy * 0.006 * sens, -1.45, 1.45);
    }
    if (!d.dragging || free.current) { d.dx = 0; d.dy = 0; }

    if (free.current) {
      if (!d.dragging) { s.rotation.y += d.inertia * sens; d.inertia *= 0.95; }
    } else if (focus) {
      const [x, y, z] = focus.dir;
      s.rotation.y = dampAngle(s.rotation.y, Math.atan2(-x, z), 3, dt);
      tiltBase.current = THREE.MathUtils.damp(tiltBase.current, Math.atan2(y, Math.hypot(x, z)), 3, dt);
    } else {
      s.rotation.y += dt * spin;
      tiltBase.current = THREE.MathUtils.damp(tiltBase.current, -pointer.y * 0.22, 3, dt);
    }

    tilt.current.rotation.x = THREE.MathUtils.damp(tilt.current.rotation.x, tiltBase.current, 6, dt);
    tilt.current.rotation.z = THREE.MathUtils.damp(
      tilt.current.rotation.z, focus || free.current ? 0 : -pointer.x * 0.08, 3, dt
    );

    // Which lat/lon is facing the camera? (undo tilt, then spin) -> used to open the map there
    tmp.set(0, 0, 1).applyAxisAngle(AX, -tilt.current.rotation.x).applyAxisAngle(AY, -s.rotation.y);
    const ll = vectorToLatLon(tmp);
    view.lat = ll.lat;
    view.lon = ll.lon;
  });

  const pinSize = focus?.pinSize ?? 0.01;

  return (
    // Float is off while zoomed in, otherwise pins would drift off-centre
    <Float speed={1.2} rotationIntensity={focus ? 0 : 0.05} floatIntensity={focus ? 0 : 0.25}>
      <group ref={tilt}>
        <group ref={spinner}>
          <Earth onPick={onPick} />

          {plan ? (
            <>
              <TripRoute plan={plan} activeDay={activeDay} pinSize={pinSize} />
              <TripPins plan={plan} activeDay={activeDay} focusStop={focusStop} pinSize={pinSize} />
            </>
          ) : (
            showArcs && <TravelArcs />
          )}

          {pick && !plan && (
            <Pin
              key={`${pick.lat}-${pick.lon}`}
              stop={{ name: "pick", latitude: pick.lat, longitude: pick.lon, day: 1 }}
              size={MARKER}
              color={pick.state === "error" ? "#FF453A" : "#ffffff"}
              dim={false}
              selected
              delay={0}
            />
          )}
        </group>
        <Atmosphere />
      </group>
    </Float>
  );
}