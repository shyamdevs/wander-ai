import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { latLonToVector3 } from "./utils";
import { dayColor } from "./tripHelpers";

function Leg({ a, b, color, dotSize, phase }) {
  const line = useRef();
  const dot = useRef();

  const { curve, points, len } = useMemo(() => {
    const va = latLonToVector3(a.latitude, a.longitude, 1.012);
    const vb = latLonToVector3(b.latitude, b.longitude, 1.012);
    const mid = va.clone().add(vb).multiplyScalar(0.5).normalize();
    mid.multiplyScalar(1.012 + va.distanceTo(vb) * 0.45 + 0.004);
    const c = new THREE.QuadraticBezierCurve3(va, mid, vb);
    return { curve: c, points: c.getPoints(40), len: c.getLength() };
  }, [a, b]);

  useFrame(({ clock }, dt) => {
    // Flowing dashes + a light travelling along the leg
    if (line.current) line.current.material.dashOffset -= dt * len * 0.4;
    dot.current.position.copy(curve.getPoint((clock.elapsedTime * 0.25 + phase) % 1));
  });

  return (
    <group>
      <Line ref={line} points={points} color={color} lineWidth={2} dashed dashSize={len / 8} gapSize={len / 14} transparent opacity={0.9} />
      <mesh ref={dot}>
        <sphereGeometry args={[dotSize, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

// Curved animated arcs between consecutive stops — only for the visible day(s)
export default function TripRoute({ plan, activeDay, pinSize }) {
  const days = activeDay === "all" ? plan.itinerary : plan.itinerary.filter((d) => d.day === activeDay);
  return (
    <group>
      {days.flatMap((d) =>
        d.stops.slice(1).map((s, i) => (
          <Leg
            key={`${d.day}-${i}-${s.name}`}
            a={d.stops[i]}
            b={s}
            color={dayColor(d.day)}
            dotSize={pinSize * 0.45}
            phase={(i * 0.23 + d.day * 0.11) % 1}
          />
        ))
      )}
    </group>
  );
}
