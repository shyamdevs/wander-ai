import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { fibonacciSphere, vectorToLatLon } from "./utils";

// Tried in order. Put your own 2:1 equirectangular map at client/public/textures/earth.jpg to override.
export const EARTH_TEXTURES = [
  "/textures/earth.jpg",
  "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg",
  "https://cdn.jsdelivr.net/npm/three-globe@2.31.0/example/img/earth-blue-marble.jpg",
];

function useEarthTexture() {
  const [tex, setTex] = useState(null);
  useEffect(() => {
    let dead = false;
    let loaded = null;
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const attempt = (i) => {
      if (dead || i >= EARTH_TEXTURES.length) return; // all failed -> dotted fallback stays
      loader.load(
        EARTH_TEXTURES[i],
        (t) => {
          if (dead) return t.dispose();
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = coarse ? 2 : 8; // 8x anisotropic filtering is wasted GPU time on phones
          loaded = t;
          setTex(t);
        },
        undefined,
        () => attempt(i + 1)
      );
    };
    attempt(0);
    return () => { dead = true; loaded?.dispose(); }; // free GPU memory when the globe unmounts
  }, []);
  return tex;
}

// Real Earth when a texture loads, dotted globe otherwise. Tapping it calls onPick({lat, lon}).
export default function Earth({ onPick }) {
  const tex = useEarthTexture();
  const dots = useMemo(() => fibonacciSphere(5200, 1), []);
  const segments = useMemo(() => (window.matchMedia?.("(pointer: coarse)").matches ? 64 : 96), []);

  const handleClick = (e) => {
    if (!onPick || e.delta > 5) return; // ignore drags
    e.stopPropagation();
    // Convert the hit point into the globe's own (rotating) coordinate space
    onPick(vectorToLatLon(e.object.worldToLocal(e.point.clone())));
  };

  return (
    <>
      <mesh
        onClick={handleClick}
        onPointerOver={() => onPick && (document.body.style.cursor = "crosshair")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <sphereGeometry args={[tex ? 1 : 0.985, segments, segments]} />
        {tex ? (
          <meshStandardMaterial key="tex" map={tex} roughness={0.85} metalness={0.05} />
        ) : (
          <meshStandardMaterial key="plain" color="#0a1226" roughness={0.85} metalness={0.15} />
        )}
      </mesh>
      {!tex && (
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={dots.length / 3} array={dots} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial size={0.017} color="#8ab4ff" transparent opacity={0.85} sizeAttenuation depthWrite={false} />
        </points>
      )}
    </>
  );
}
