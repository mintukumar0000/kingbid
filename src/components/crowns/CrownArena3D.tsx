"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { CrownSpotState } from "@/lib/crown-spots-data";
import { faviconFor } from "@/lib/format";

const GOLD = new THREE.Color("#c9a227");
const DIAMOND = new THREE.Color("#3b82f6");

function ProceduralCrown() {
  const bandRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (bandRef.current) bandRef.current.rotation.y += delta * 0.02;
  });

  const gold = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: GOLD,
        metalness: 0.92,
        roughness: 0.22,
        envMapIntensity: 1.2,
      }),
    []
  );

  const gem = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: DIAMOND,
        metalness: 0.1,
        roughness: 0.05,
        emissive: DIAMOND,
        emissiveIntensity: 0.35,
      }),
    []
  );

  const spikes = useMemo(() => {
    const items: { pos: [number, number, number]; scale: number; rot: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      items.push({
        pos: [Math.sin(a) * 0.55, 0.35, Math.cos(a) * 0.55],
        scale: 0.22,
        rot: a,
      });
    }
    return items;
  }, []);

  return (
    <group ref={bandRef} position={[0, -0.15, 0]}>
      <mesh material={gold} position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.82, 0.92, 0.18, 48]} />
      </mesh>
      <mesh material={gold} position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.06, 16, 64]} />
      </mesh>
      <mesh material={gold} position={[0, 0.52, 0]}>
        <coneGeometry args={[0.18, 0.55, 4]} />
      </mesh>
      {spikes.map((s, i) => (
        <mesh key={i} material={gold} position={s.pos} rotation={[0, s.rot, 0]}>
          <coneGeometry args={[s.scale * 0.5, s.scale * 1.8, 4]} />
        </mesh>
      ))}
      <mesh material={gem} position={[0, 0.72, 0.52]}>
        <octahedronGeometry args={[0.08, 0]} />
      </mesh>
      <mesh material={gem} position={[-0.52, 0.65, 0.08]}>
        <octahedronGeometry args={[0.07, 0]} />
      </mesh>
      <mesh material={gem} position={[0.52, 0.65, 0.08]}>
        <octahedronGeometry args={[0.07, 0]} />
      </mesh>
      <mesh material={gem} position={[0, 0.62, -0.5]}>
        <octahedronGeometry args={[0.06, 0]} />
      </mesh>
    </group>
  );
}

function LogoPlate({
  spot,
  hovered,
  selected,
}: {
  spot: CrownSpotState;
  hovered: boolean;
  selected: boolean;
}) {
  const [x, y, z] = spot.position;
  const len = Math.hypot(x, z) || 1;
  const nx = x / len;
  const nz = z / len;
  const offset = 0.04;

  if (!spot.hasOwner || !spot.ownerUrl) return null;

  const logoUrl = faviconFor(spot.ownerUrl);

  return (
    <Suspense fallback={null}>
      <LogoPlane
        url={logoUrl}
        position={[x + nx * offset, y, z + nz * offset]}
        scale={spot.hotspotScale * 1.4}
        glow={hovered || selected}
      />
    </Suspense>
  );
}

function LogoPlane({
  url,
  position,
  scale,
  glow,
}: {
  url: string;
  position: [number, number, number];
  scale: number;
  glow: boolean;
}) {
  const texture = useTexture(url);
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        map={texture}
        transparent
        metalness={0.6}
        roughness={0.35}
        emissive={glow ? GOLD : new THREE.Color("#000")}
        emissiveIntensity={glow ? 0.25 : 0}
        depthWrite={false}
      />
    </mesh>
  );
}

function SpotHotspot({
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
  const meshRef = useRef<THREE.Mesh>(null);
  const active = hovered || selected;
  const tierColor =
    spot.tier === "crown" ? GOLD : spot.tier === "diamond" ? DIAMOND : new THREE.Color("#fbbf24");

  useFrame((state) => {
    if (!meshRef.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.08;
    meshRef.current.scale.setScalar(spot.hotspotScale * (active ? 1.35 * pulse : spot.hasOwner ? 0.6 : 0.85));
  });

  return (
      <mesh
      ref={meshRef}
      position={spot.position}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(spot.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(spot.id);
      }}
    >
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={tierColor}
        emissive={tierColor}
        emissiveIntensity={active ? 1.2 : spot.hasOwner ? 0.15 : 0.55}
        transparent
        opacity={active ? 0.95 : spot.hasOwner ? 0.25 : 0.65}
        metalness={0.8}
        roughness={0.2}
      />
      {active && (
        <Html center distanceFactor={6} style={{ pointerEvents: "none" }}>
          <div className="crown-spot-hover-label">
            <span>{spot.shortLabel}</span>
            <strong>{spot.hasOwner ? `$${spot.currentBid}` : "Open"}</strong>
          </div>
        </Html>
      )}
    </mesh>
  );
}

function CrownScene({
  spots,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  paused,
  setPaused,
}: {
  spots: CrownSpotState[];
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  paused: boolean;
  setPaused: (v: boolean) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current || paused) return;
    groupRef.current.rotation.y += delta * 0.18;
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 3]} intensity={1.4} castShadow />
      <directionalLight position={[-3, 2, -4]} intensity={0.5} color="#fff7ed" />
      <Environment preset="studio" />
      <group ref={groupRef}>
        <ProceduralCrown />
        {spots.map((spot) => (
          <group key={spot.id}>
            <SpotHotspot
              spot={spot}
              hovered={hoveredId === spot.id}
              selected={selectedId === spot.id}
              onHover={onHover}
              onSelect={onSelect}
            />
            <LogoPlate spot={spot} hovered={hoveredId === spot.id} selected={selectedId === spot.id} />
          </group>
        ))}
      </group>
      <OrbitControls
        enablePan={false}
        minDistance={2.4}
        maxDistance={5}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 1.6}
        onStart={() => setPaused(true)}
      />
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

  return (
    <div
      className="crown-arena-canvas-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setHoveredId(null);
      }}
    >
      <Canvas camera={{ position: [0, 0.35, 2.8], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <CrownScene
            spots={spots}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onSelect={onSelect}
            paused={paused}
            setPaused={setPaused}
          />
        </Suspense>
      </Canvas>
      <p className="crown-arena-hint">Drag to explore · Click a spot to bid</p>
    </div>
  );
}
