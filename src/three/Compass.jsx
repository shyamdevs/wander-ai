import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { pointer } from "./pointer";

const TICKS = [0, 1, 2, 3].map((i) => (i * Math.PI) / 2);

// Floating compass that scales in on auth pages and follows the mouse
export default function Compass({ visible }) {
  const root = useRef();
  const needle = useRef();

  useFrame((_, dt) => {
    const s = THREE.MathUtils.damp(root.current.scale.x, visible ? 1 : 0, 4, dt);
    root.current.scale.setScalar(Math.max(s, 0.0001));
    root.current.visible = s > 0.01;
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, pointer.x * 0.7, 4, dt);
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, -pointer.y * 0.5, 4, dt);
    // Needle swings toward the cursor
    const target = Math.atan2(pointer.y, pointer.x) - Math.PI / 2;
    needle.current.rotation.z = THREE.MathUtils.damp(needle.current.rotation.z, target, 3, dt);
  });

  return (
    <group position={[1.25, 0.35, 1.1]}>
      <Float speed={1.6} floatIntensity={0.5} rotationIntensity={0.1}>
        <group ref={root} scale={0.0001}>
          <mesh>
            <torusGeometry args={[0.32, 0.012, 24, 96]} />
            <meshStandardMaterial color="#f5f5f7" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh>
            <circleGeometry args={[0.31, 64]} />
            <meshStandardMaterial color="#0b1430" transparent opacity={0.55} />
          </mesh>
          {TICKS.map((a) => (
            <mesh key={a} position={[Math.sin(a) * 0.27, Math.cos(a) * 0.27, 0.005]} rotation={[0, 0, -a]}>
              <boxGeometry args={[0.012, 0.05, 0.01]} />
              <meshStandardMaterial color="#86868b" />
            </mesh>
          ))}
          <group ref={needle}>
            <mesh position={[0, 0.1, 0.02]}>
              <coneGeometry args={[0.035, 0.2, 4]} />
              <meshStandardMaterial color="#f5f5f7" emissive="#5b8cff" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0, -0.1, 0.02]} rotation={[0, 0, Math.PI]}>
              <coneGeometry args={[0.035, 0.2, 4]} />
              <meshStandardMaterial color="#86868b" />
            </mesh>
          </group>
        </group>
      </Float>
    </group>
  );
}
