"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, ContactShadows, Environment, Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { CrownSpotState } from "@/lib/crown-spots-data";
import { faviconFor } from "@/lib/format";

const GOLD = "#d4af37";
const GOLD_DARK = "#9a7b0a";

function gemMaterial(color: string, intensity = 0.45) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.05,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    transparent: true,
    opacity: 0.92,
  });
}

function Gem({
  position,
  scale,
  material,
}: {
  position: [number, number, number];
  scale: number;
  material: THREE.MeshPhysicalMaterial;
}) {
  return (
    <mesh position={position} material={material}>
      <octahedronGeometry args={[scale, 0]} />
    </mesh>
  );
}

function OrnateCrown() {
  const gold = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: GOLD,
        metalness: 0.95,
        roughness: 0.18,
        envMapIntensity: 1.5,
      }),
    []
  );

  const goldDark = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: GOLD_DARK,
        metalness: 0.9,
        roughness: 0.25,
        envMapIntensity: 1.2,
      }),
    []
  );

  const velvet = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2a1020",
        metalness: 0.05,
        roughness: 0.92,
      }),
    []
  );

  const diamondMat = useMemo(() => gemMaterial("#dbeafe", 0.55), []);
  const rubyMat = useMemo(() => gemMaterial("#f87171", 0.5), []);
  const emeraldMat = useMemo(() => gemMaterial("#34d399", 0.5), []);
  const sapphireMat = useMemo(() => gemMaterial("#60a5fa", 0.55), []);
  const amethystMat = useMemo(() => gemMaterial("#c084fc", 0.45), []);

  const arches = useMemo(() => {
    const count = 8;
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2;
      const r = 0.58;
      return {
        pos: [Math.sin(a) * r, 0.48, Math.cos(a) * r] as [number, number, number],
        rot: a,
        gem: [diamondMat, rubyMat, emeraldMat, sapphireMat, amethystMat][i % 5]!,
      };
    });
  }, [diamondMat, rubyMat, emeraldMat, sapphireMat, amethystMat]);

  const spikes = useMemo(() => {
    const count = 8;
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + Math.PI / 8;
      const r = 0.68;
      const h = i % 2 === 0 ? 0.42 : 0.32;
      return {
        pos: [Math.sin(a) * r, 0.28 + h * 0.5, Math.cos(a) * r] as [number, number, number],
        rot: a,
        h,
      };
    });
  }, []);

  const pearls = useMemo(() => {
    const count = 24;
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2;
      const r = 0.78;
      return [Math.sin(a) * r, -0.02, Math.cos(a) * r] as [number, number, number];
    });
  }, []);

  const bandGems = useMemo(() => {
    const count = 16;
    const mats = [diamondMat, rubyMat, emeraldMat, sapphireMat];
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2;
      const r = 0.74;
      return {
        pos: [Math.sin(a) * r, 0.1, Math.cos(a) * r] as [number, number, number],
        mat: mats[i % 4]!,
      };
    });
  }, [diamondMat, rubyMat, emeraldMat, sapphireMat]);

  return (
    <group position={[0, -0.08, 0]}>
      <mesh material={velvet} position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.95, 1.05, 0.14, 48]} />
      </mesh>
      <mesh material={velvet} position={[0, -0.14, 0]}>
        <torusGeometry args={[0.88, 0.05, 12, 64]} />
      </mesh>
      <mesh material={goldDark} position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.82, 0.88, 0.14, 48]} />
      </mesh>
      <mesh material={gold} position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.78, 0.055, 16, 64]} />
      </mesh>
      <mesh material={gold} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.68, 0.04, 16, 64]} />
      </mesh>
      {pearls.map((p, i) => (
        <mesh key={`pearl-${i}`} material={gold} position={p} scale={0.035}>
          <sphereGeometry args={[1, 12, 12]} />
        </mesh>
      ))}
      {bandGems.map((g, i) => (
        <Gem key={`band-gem-${i}`} position={g.pos} scale={0.045} material={g.mat} />
      ))}
      {spikes.map((s, i) => (
        <group key={`spike-${i}`} position={s.pos} rotation={[0, s.rot, 0]}>
          <mesh material={gold} rotation={[0.25, 0, 0]}>
            <coneGeometry args={[0.07, s.h, 4]} />
          </mesh>
          <Gem position={[0, s.h * 0.55, 0.04]} scale={0.05} material={diamondMat} />
        </group>
      ))}
      {arches.map((a, i) => (
        <group key={`arch-${i}`} position={a.pos} rotation={[0, a.rot, 0]}>
          <mesh material={gold} position={[0, 0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.14, 0.025, 8, 24, Math.PI]} />
          </mesh>
          <mesh material={gold} position={[0, 0.34, 0]} scale={0.065}>
            <sphereGeometry args={[1, 16, 16]} />
          </mesh>
          <Gem position={[0, 0.34, 0.05]} scale={0.038} material={a.gem} />
        </group>
      ))}
      <mesh material={gold} position={[0, 0.38, 0]}>
        <coneGeometry args={[0.12, 0.55, 4]} />
      </mesh>
      <mesh material={gold} position={[0, 0.72, 0]} scale={0.09}>
        <sphereGeometry args={[1, 20, 20]} />
      </mesh>
      <Gem position={[0, 0.72, 0.06]} scale={0.1} material={diamondMat} />
      <Gem position={[0, 0.52, 0.14]} scale={0.065} material={rubyMat} />
      <Gem position={[0, 0.28, 0.76]} scale={0.08} material={sapphireMat} />
      <Gem position={[-0.38, 0.22, 0.62]} scale={0.06} material={emeraldMat} />
      <Gem position={[0.38, 0.22, 0.62]} scale={0.06} material={amethystMat} />
      <Gem position={[0, 0.18, -0.68]} scale={0.055} material={diamondMat} />
    </group>
  );
}

function SpotMarker({
  spot,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  spot: CrownSpotState;
  hovered: boolean;
  selected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const active = hovered || selected;
  const [x, y, z] = spot.position;

  return (
    <Billboard position={[x, y, z]}>
      <Html transform occlude distanceFactor={4.2} style={{ pointerEvents: "auto" }} zIndexRange={[40, 0]}>
        <button
          type="button"
          className={`crown-surface-marker ${spot.hasOwner ? "crown-surface-marker--owned" : "crown-surface-marker--open"} ${active ? "crown-surface-marker--active" : ""}`}
          onPointerEnter={() => {
            onHover(spot.id);
            document.body.style.cursor = "pointer";
          }}
          onPointerLeave={() => {
            onHover(null);
            document.body.style.cursor = "auto";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(spot.id);
          }}
        >
          {spot.hasOwner && spot.ownerUrl ? (
            <img src={faviconFor(spot.ownerUrl)} alt="" width={36} height={36} />
          ) : (
            <>
              <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
                <path
                  fill="currentColor"
                  d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21 8 14 2 9.4h7.6L12 2z"
                />
              </svg>
              <span>Available</span>
            </>
          )}
        </button>
      </Html>
    </Billboard>
  );
}

function SceneBackground({ dark }: { dark: boolean }) {
  const { scene } = useThree();
  scene.background = new THREE.Color(dark ? "#1c1917" : "#e8e8ec");
  return null;
}

function CameraZoom({ zoom, baseDistance }: { zoom: number; baseDistance: number }) {
  const { camera } = useThree();
  useEffect(() => {
    const dist = baseDistance * (100 / zoom);
    camera.position.set(0, 0.32, dist);
    camera.updateProjectionMatrix();
  }, [zoom, baseDistance, camera]);
  return null;
}

function CrownScene({
  spots,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  paused,
  setPaused,
  zoom,
  dark,
}: {
  spots: CrownSpotState[];
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  paused: boolean;
  setPaused: (v: boolean) => void;
  zoom: number;
  dark: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const baseDistance = 2.65;

  useFrame((_, delta) => {
    if (!groupRef.current || paused) return;
    groupRef.current.rotation.y += delta * 0.14;
  });

  return (
    <>
      <SceneBackground dark={dark} />
      <ambientLight intensity={dark ? 0.35 : 0.55} />
      <directionalLight position={[5, 8, 4]} intensity={dark ? 1.2 : 1.6} color="#fffaf0" />
      <directionalLight position={[-4, 3, -3]} intensity={0.45} color="#fde68a" />
      <pointLight position={[0, 1.2, 2]} intensity={0.6} color="#fef3c7" />
      <Environment preset="city" />
      <group ref={groupRef}>
        <OrnateCrown />
        {spots.map((spot) => (
          <SpotMarker
            key={spot.id}
            spot={spot}
            hovered={hoveredId === spot.id}
            selected={selectedId === spot.id}
            onHover={onHover}
            onSelect={onSelect}
          />
        ))}
      </group>
      <ContactShadows position={[0, -0.38, 0]} opacity={dark ? 0.5 : 0.35} scale={4} blur={2.5} far={1.2} />
      <OrbitControls
        enablePan={false}
        minDistance={baseDistance * 0.65}
        maxDistance={baseDistance * 1.55}
        minPolarAngle={Math.PI / 4.5}
        maxPolarAngle={Math.PI / 1.85}
        onStart={() => setPaused(true)}
        target={[0, 0.25, 0]}
      />
      <CameraZoom zoom={zoom} baseDistance={baseDistance} />
    </>
  );
}

export function CrownArena3D({
  spots,
  selectedId,
  onSelect,
}: {
  spots: CrownSpotState[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return (
    <div
      className="crown-arena-canvas-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setHoveredId(null);
      }}
    >
      <Canvas camera={{ position: [0, 0.32, 2.65], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <CrownScene
            spots={spots}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onSelect={onSelect}
            paused={paused}
            setPaused={setPaused}
            zoom={zoom}
            dark={dark}
          />
        </Suspense>
      </Canvas>

      <div className="crown-zoom-controls" aria-label="Zoom controls">
        <button type="button" onClick={() => setZoom((z) => Math.min(140, z + 10))} aria-label="Zoom in">
          +
        </button>
        <span className="tabular">{zoom}%</span>
        <button type="button" onClick={() => setZoom((z) => Math.max(70, z - 10))} aria-label="Zoom out">
          −
        </button>
      </div>
    </div>
  );
}
