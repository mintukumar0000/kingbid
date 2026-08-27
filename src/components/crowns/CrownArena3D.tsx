"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { CrownSpotState } from "@/lib/crown-spots-data";
import { faviconFor } from "@/lib/format";

const CROWN_URL = "/models/royal-crown.glb";
const CROWN_TARGET: [number, number, number] = [0, 0.28, 0];
const BASE_DISTANCE = 1.85;

useGLTF.preload(CROWN_URL);

export interface ProjectedSpot {
  id: string;
  x: number;
  y: number;
  visible: boolean;
  scale: number;
}

function RankbidStar() {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} aria-hidden className="crown-spot-star">
      <path
        fill="currentColor"
        d="M8 1.2 9.1 5.4 13.2 6.5 9.1 7.6 8 11.8 6.9 7.6 2.8 6.5 6.9 5.4 8 1.2z"
      />
    </svg>
  );
}

function outlineSize(tier: CrownSpotState["tier"]): { w: number; h: number } {
  switch (tier) {
    case "crown":
      return { w: 92, h: 80 };
    case "diamond":
      return { w: 76, h: 68 };
    case "royal":
      return { w: 64, h: 56 };
    default:
      return { w: 56, h: 48 };
  }
}

function spotBrand(spot: CrownSpotState): string {
  const raw = spot.ownerHandle ?? spot.ownerTitle ?? "";
  return raw.replace(/^@/, "").toUpperCase().slice(0, 16);
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
      }
    });
    return root;
  }, [scene]);
  return <primitive object={clone} />;
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

function SpotProjector({
  spots,
  crownGroup,
  hoveredId,
  selectedId,
  onProject,
}: {
  spots: CrownSpotState[];
  crownGroup: RefObject<THREE.Group | null>;
  hoveredId: string | null;
  selectedId: string | null;
  onProject: (projected: ProjectedSpot[]) => void;
}) {
  const { camera, gl } = useThree();
  const vec = useMemo(() => new THREE.Vector3(), []);
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const center = useMemo(() => new THREE.Vector3(), []);
  const onProjectRef = useRef(onProject);
  onProjectRef.current = onProject;

  useFrame(() => {
    const group = crownGroup.current;
    if (!group || !spots.length) return;

    const w = gl.domElement.clientWidth;
    const h = gl.domElement.clientHeight;
    if (!w || !h) return;

    center.set(...CROWN_TARGET);
    group.localToWorld(center);

    const projected: ProjectedSpot[] = spots.map((spot) => {
      const active = spot.id === hoveredId || spot.id === selectedId;
      worldPos.set(...spot.position);
      group.localToWorld(worldPos);

      const outward = worldPos.clone().sub(center);
      if (outward.lengthSq() > 0.0001) outward.normalize();
      else outward.set(0, 0, 1);

      const toCam = camera.position.clone().sub(worldPos).normalize();
      const facing = outward.dot(toCam) > 0.08;

      vec.copy(worldPos);
      vec.project(camera);
      const behind = vec.z > 1;
      const visible = !behind && (facing || active);

      const x = (vec.x * 0.5 + 0.5) * w;
      const y = (-vec.y * 0.5 + 0.5) * h;

      const dist = camera.position.distanceTo(worldPos);
      const scale = THREE.MathUtils.clamp(1.85 / dist, 0.72, 1.12);

      return { id: spot.id, x, y, visible, scale };
    });

    onProjectRef.current(projected);
  });

  return null;
}

function CrownScene({
  spots,
  selectedId,
  hoveredId,
  onProject,
  paused,
  setPaused,
  zoom,
  dark,
}: {
  spots: CrownSpotState[];
  selectedId: string | null;
  hoveredId: string | null;
  onProject: (projected: ProjectedSpot[]) => void;
  paused: boolean;
  setPaused: (v: boolean) => void;
  zoom: number;
  dark: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current || paused || selectedId) return;
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
        <SpotProjector
          spots={spots}
          crownGroup={groupRef}
          hoveredId={hoveredId}
          selectedId={selectedId}
          onProject={onProject}
        />
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

function CrownSpotOverlay({
  spots,
  projected,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
}: {
  spots: CrownSpotState[];
  projected: ProjectedSpot[];
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const byId = useMemo(() => new Map(projected.map((p) => [p.id, p])), [projected]);
  const selectedSpot = selectedId ? spots.find((s) => s.id === selectedId) : null;
  const selectedPin = selectedId ? byId.get(selectedId) : null;

  return (
    <div className="crown-spot-overlay" aria-hidden={false}>
      {selectedSpot && selectedPin?.visible && (
        <div
          className={`crown-spot-outline crown-spot-outline--${selectedSpot.tier}`}
          style={{
            left: selectedPin.x,
            top: selectedPin.y,
            width: outlineSize(selectedSpot.tier).w * selectedPin.scale,
            height: outlineSize(selectedSpot.tier).h * selectedPin.scale,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="crown-spot-outline-inner">
            {selectedSpot.hasOwner && selectedSpot.ownerUrl ? (
              <>
                <img src={faviconFor(selectedSpot.ownerUrl)} alt="" width={28} height={28} />
                <span className="crown-spot-brand">{spotBrand(selectedSpot)}</span>
              </>
            ) : (
              <>
                <RankbidStar />
                <span className="crown-spot-available">Available</span>
              </>
            )}
          </div>
        </div>
      )}

      {spots.map((spot) => {
        const pin = byId.get(spot.id);
        if (!pin?.visible) return null;
        const isSelected = spot.id === selectedId;
        if (isSelected) return null;

        const active = spot.id === hoveredId;

        return (
          <button
            key={spot.id}
            type="button"
            className={`crown-spot-pin crown-spot-pin--${spot.tier} ${spot.hasOwner ? "crown-spot-pin--owned" : "crown-spot-pin--open"} ${active ? "crown-spot-pin--active" : ""}`}
            style={{
              left: pin.x,
              top: pin.y,
              transform: `translate(-50%, -50%) scale(${pin.scale})`,
            }}
            onPointerEnter={() => {
              onHover(spot.id);
              document.body.style.cursor = "pointer";
            }}
            onPointerLeave={() => {
              onHover(null);
              document.body.style.cursor = "auto";
            }}
            onClick={() => onSelect(spot.id)}
          >
            {spot.hasOwner && spot.ownerUrl ? (
              <>
                <img src={faviconFor(spot.ownerUrl)} alt="" width={20} height={20} />
                <span className="crown-spot-brand">{spotBrand(spot)}</span>
              </>
            ) : (
              <>
                <RankbidStar />
                <span className="crown-spot-available">Available</span>
              </>
            )}
          </button>
        );
      })}
    </div>
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
  const [projected, setProjected] = useState<ProjectedSpot[]>([]);

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
            onProject={setProjected}
            paused={paused}
            setPaused={setPaused}
            zoom={zoom}
            dark={dark}
          />
        </Suspense>
      </Canvas>

      <CrownSpotOverlay
        spots={spots}
        projected={projected}
        hoveredId={hoveredId}
        selectedId={selectedId}
        onHover={setHoveredId}
        onSelect={onSelect}
      />

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
