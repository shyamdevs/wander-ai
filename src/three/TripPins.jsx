import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { latLonToVector3 } from "./utils";
import { dayColor, sameStop } from "./tripHelpers";
import { view } from "./viewState";

const UP = new THREE.Vector3(0, 0, 1);

export function Pin({ stop, size, dim, selected, delay, color: colorProp }) {
  const root = useRef();
  const ring = useRef();
  const born = useRef(null);
  const color = colorProp || dayColor(stop.day);

  const pos = useMemo(() => latLonToVector3(stop.latitude, stop.longitude, 1.004), [stop]);
  // Orient the pin so its +Z axis points straight out of the globe surface
  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(UP, pos.clone().normalize()),
    [pos]
  );

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (born.current === null) born.current = t + delay;
    const target = t < born.current ? 0.0001 : (dim ? 0.55 : 1) * (selected ? 1.4 : 1) * view.pinScale;
    const s = THREE.MathUtils.damp(root.current.scale.x, target, 6, dt);
    root.current.scale.setScalar(Math.max(s, 0.0001));

    const p = (t * 0.8 + delay) % 1; // soft sonar ring
    ring.current.scale.setScalar(1 + p * 2.4);
    ring.current.material.opacity = (1 - p) * (dim ? 0.15 : 0.6);
  });

  return (
    <group position={pos} quaternion={quat}>
      <group ref={root} scale={0.0001}>
        <mesh position={[0, 0, size * 1.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[size * 0.12, size * 0.12, size * 3, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 0, size * 3]}>
          <sphereGeometry args={[size, 20, 20]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh ref={ring} position={[0, 0, size * 0.1]}>
          <ringGeometry args={[size * 1.1, size * 1.5, 32]} />
          <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

// Day N selected -> ONLY Day N's places exist on the globe (and re-drop one by one)
export default function TripPins({ plan, activeDay, focusStop, pinSize }) {
  const days = activeDay === "all" ? plan.itinerary : plan.itinerary.filter((d) => d.day === activeDay);
  let n = 0;
  return (
    <group>
      {days.flatMap((d) =>
        d.stops.map((s) => {
          const stop = { ...s, day: d.day };
          const i = n++;
          return (
            <Pin
              key={`${d.day}-${s.name}-${s.latitude}-${s.longitude}`}
              stop={stop}
              size={pinSize}
              dim={false}
              selected={sameStop(stop, focusStop)}
              delay={Math.min(0.5 + i * 0.12, 4)}
            />
          );
        })
      )}
    </group>
  );
}
