"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, ContactShadows, Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { CrownSpotState } from "@/lib/crown-spots-data";
import { faviconFor } from "@/lib/format";

const CROWN_URL = "/models/royal-crown.glb";
const CROWN_TARGET: [number, number, number] = [0, 0.28, 0];
const BASE_DISTANCE = 1.85;

useGLTF.preload(CROWN_URL);

function RankbidStar() {
  return (
    <svg viewBox="0 0 24 24" width={12} height={12} aria-hidden className="crown-spot-star">
      <path
        fill="currentColor"
        d="M12 2l1.2 4.1L17 7.5l-4.1 1.2L12 12.7 9.1 8.7 5 7.5l4.1-1.4L12 2z"
      />
    </svg>
  );
}

function markerDistance(tier: CrownSpotState["tier"], active: boolean): number {
  const base = tier === "crown" ? 38 : tier === "diamond" ? 42 : tier === "royal" ? 44 : 46;
  return active ? base - 4 : base;
}

function logoSize(tier: CrownSpotState["tier"]): number {
  return tier === "crown" ? 22 : tier === "diamond" ? 18 : 16;
}

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
          });
        }
      }
    });
    return root;
  }, [scene]);

  return <primitive object={clone} />;
}

function spotBrand(spot: CrownSpotState): string {
  const raw = spot.ownerHandle ?? spot.ownerTitle ?? "";
  return raw.replace(/^@/, "").toUpperCase().slice(0, 18);
}

function SpotMarker({
  spot,
  crownGroup,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  spot: CrownSpotState;
  crownGroup: RefObject<THREE.Group | null>;
  hovered: boolean;
  selected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const active = hovered || selected;
  const { camera } = useThree();
  const [visible, setVisible] = useState(true);
  const visibleRef = useRef(true);

  useFrame(() => {
    const group = crownGroup.current;
    if (!group) return;

    const [x, y, z] = spot.position;
    if (Math.hypot(x, z) < 0.01) {
      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }
      return;
    }

    const camLocal = camera.position.clone();
    group.worldToLocal(camLocal);
    const spotPos = new THREE.Vector3(x, y, z);
    const outward = new THREE.Vector3(x, 0, z).normalize();
    const toCam = camLocal.sub(spotPos);
    toCam.y = 0;
    if (toCam.lengthSq() < 0.0001) {
      return;
    }
    toCam.normalize();
    const facing = outward.dot(toCam) > 0.15;
    const shouldShow = facing || active;
    if (shouldShow !== visibleRef.current) {
      visibleRef.current = shouldShow;
      setVisible(shouldShow);
    }
  });

  if (!visible) return null;

  return (
    <Billboard position={spot.position} follow>
      <Html
        center
        occlude
        distanceFactor={markerDistance(spot.tier, active)}
        style={{ pointerEvents: "auto" }}
        zIndexRange={[active ? 50 : 10, 0]}
      >
        <button
          type="button"
          className={`crown-surface-marker crown-surface-marker--${spot.tier} ${spot.hasOwner ? "crown-surface-marker--owned" : "crown-surface-marker--open"} ${active ? "crown-surface-marker--active" : ""}`}
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
            <>
              <img
                src={faviconFor(spot.ownerUrl)}
                alt=""
                width={logoSize(spot.tier)}
                height={logoSize(spot.tier)}
              />
              <span className="crown-spot-brand">{spotBrand(spot)}</span>
            </>
          ) : (
            <>
              <RankbidStar />
              <span className="crown-spot-available">Available</span>
            </>
          )}
        </button>
      </Html>
    </Billboard>
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
    groupRef.current.rotation.y += delta * 0.1;
  });

  return (
    <>
      <SceneBackground dark={dark} />
      <ambientLight intensity={dark ? 0.45 : 0.7} />
      <directionalLight position={[4, 6, 3]} intensity={dark ? 1.15 : 1.5} color="#fffaf0" castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#fde68a" />
      <Environment preset="studio" />
      <group ref={groupRef}>
        <GLBCrown />
        {spots.map((spot) => (
          <SpotMarker
            key={spot.id}
            spot={spot}
            crownGroup={groupRef}
            hovered={hoveredId === spot.id}
            selected={selectedId === spot.id}
            onHover={onHover}
            onSelect={onSelect}
          />
        ))}
      </group>
      <ContactShadows position={[0, 0, 0]} opacity={dark ? 0.4 : 0.28} scale={2.2} blur={2.5} far={0.9} />
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
