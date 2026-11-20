import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { latLonToVector3, CITIES, ARC_PAIRS } from "./utils";

function Arc({ from, to, offset }) {
  const dot = useRef();

  const { curve, points } = useMemo(() => {
    const a = latLonToVector3(...CITIES[from], 1.005);
    const b = latLonToVector3(...CITIES[to], 1.005);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(1 + a.distanceTo(b) * 0.4);
    const c = new THREE.QuadraticBezierCurve3(a, mid, b);
    return { curve: c, points: c.getPoints(56) };
  }, [from, to]);

  // A small light travels along each arc
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * 0.14 + offset) % 1;
    dot.current.position.copy(curve.getPoint(t));
  });

  return (
    <group>
      <Line points={points} color="#7fb2ff" lineWidth={1} transparent opacity={0.4} />
      <mesh ref={dot}>
        <sphereGeometry args={[0.013, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

export default function TravelArcs() {
  return (
    <group>
      {Object.entries(CITIES).map(([name, [lat, lon]]) => (
        <mesh key={name} position={latLonToVector3(lat, lon, 1.006)}>
          <sphereGeometry args={[0.016, 12, 12]} />
          <meshBasicMaterial color="#a9c8ff" />
        </mesh>
      ))}
      {ARC_PAIRS.map(([from, to], i) => (
        <Arc key={`${from}-${to}`} from={from} to={to} offset={i / ARC_PAIRS.length} />
      ))}
    </group>
  );
}
