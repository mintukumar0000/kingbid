"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { CrownSpotState } from "@/lib/crown-spots-data";
import { faviconFor } from "@/lib/format";

const CROWN_URL = "/models/royal-crown.glb";
const CROWN_TARGET: [number, number, number] = [0, 0.28, 0];
const BASE_DISTANCE = 1.85;

useGLTF.preload(CROWN_URL);

function GLBCrown() {
  const { scene } = useGLTF(CROWN_URL);
  const clone = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((mat) => {
            if ("envMapIntensity" in mat) mat.envMapIntensity = 1.35;
            if ("metalness" in mat && typeof mat.metalness === "number") {
              mat.metalness = Math.min(1, mat.metalness + 0.05);
            }
          });
        }
      }
    });
    return root;
  }, [scene]);

  return <primitive object={clone} />;
}

function spotRotation(position: [number, number, number]): [number, number, number] {
  const [x, , z] = position;
  return [0, Math.atan2(x, z), 0];
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

  return (
    <group position={spot.position} rotation={spotRotation(spot.position)}>
      <Html
        transform
        occlude="blending"
        distanceFactor={spot.tier === "crown" ? 9 : spot.tier === "diamond" ? 10 : 11}
        style={{ pointerEvents: "auto" }}
        zIndexRange={[40, 0]}
      >
        <button
          type="button"
          className={`crown-surface-marker ${spot.hasOwner ? "crown-surface-marker--owned" : "crown-surface-marker--open"} ${active ? "crown-surface-marker--active" : ""} crown-surface-marker--${spot.tier}`}
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
            <img src={faviconFor(spot.ownerUrl)} alt="" width={spot.tier === "crown" ? 44 : 32} height={spot.tier === "crown" ? 44 : 32} />
          ) : (
            <>
              <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden>
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
    </group>
  );
}

function SceneBackground({ dark }: { dark: boolean }) {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color(dark ? "#1c1917" : "#e8e8ec");
  }, [dark, scene]);
  return null;
}

function CameraZoom({ zoom }: { zoom: number }) {
  const { camera } = useThree();
  useEffect(() => {
    const dist = BASE_DISTANCE * (100 / zoom);
    camera.position.set(0, 0.28, dist);
    camera.updateProjectionMatrix();
  }, [zoom, camera]);
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

  useFrame((_, delta) => {
    if (!groupRef.current || paused) return;
    groupRef.current.rotation.y += delta * 0.12;
  });

  return (
    <>
      <SceneBackground dark={dark} />
      <ambientLight intensity={dark ? 0.4 : 0.65} />
      <directionalLight position={[4, 6, 3]} intensity={dark ? 1.1 : 1.45} color="#fffaf0" castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} color="#fde68a" />
      <pointLight position={[0, 0.8, 1.5]} intensity={0.45} color="#fef3c7" />
      <Environment preset="city" />
      <group ref={groupRef}>
        <GLBCrown />
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
      <ContactShadows position={[0, 0, 0]} opacity={dark ? 0.45 : 0.32} scale={2.2} blur={2.2} far={0.9} />
      <OrbitControls
        enablePan={false}
        minDistance={BASE_DISTANCE * 0.7}
        maxDistance={BASE_DISTANCE * 1.45}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 1.75}
        onStart={() => setPaused(true)}
        target={CROWN_TARGET}
      />
      <CameraZoom zoom={zoom} />
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
      <Canvas
        camera={{ position: [0, 0.28, BASE_DISTANCE], fov: 36 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        shadows
      >
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
