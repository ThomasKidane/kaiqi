"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type FloatObject = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  type: "doc" | "folder";
  depth: number;
  target?: THREE.Vector3;
  startTime: number; // when this doc starts its journey
  cycleDuration: number; // how long each cycle takes
  isVisible: boolean; // whether doc is currently visible
};

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / total));
      setProgress(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

function FloatingField({ count = 80, seed = 1 }: { count?: number; seed?: number }) {
  const progress = useScrollProgress();
  const group = useRef<THREE.Group>(null);

  // Generate folder anchors (fixed positions) and document items that fly into them
  const objects = useMemo<FloatObject[]>(() => {
    let s = seed >>> 0;
    const rng = () => {
      s = (1664525 * s + 1013904223) >>> 0;
      return (s & 0xffffffff) / 0x100000000;
    };

    // Create a small grid of folders as anchors
    const folders: FloatObject[] = [];
    const docs: FloatObject[] = [];

    const rows = 2;
    const cols = 4;
    const spacingX = 10;
    const spacingY = 6;
    const baseZ = -35; // mid depth so docs can fly toward them

    const anchors: THREE.Vector3[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - (cols - 1) / 2) * spacingX + (rng() - 0.5) * 1.2;
        const y = (r - (rows - 1) / 2) * spacingY + (rng() - 0.5) * 1.0;
        const z = baseZ + (rng() - 0.5) * 3;
        const depth = 0.6 + rng() * 0.3;
        const scale = 1.1 + rng() * 0.4;
        const rotation = new THREE.Euler(0, rng() * Math.PI * 2, 0);
        const pos = new THREE.Vector3(x, y, z);
        anchors.push(pos.clone());
        folders.push({ 
          position: pos, 
          rotation, 
          scale, 
          type: "folder", 
          depth,
          startTime: 0,
          cycleDuration: 0,
          isVisible: true
        });
      }
    }

    // Create documents scattered around that will fly into nearest/random folder
    const docCount = Math.max(0, count - folders.length);
    for (let i = 0; i < docCount; i++) {
      const depth = rng() * 0.9 + 0.1;
      const spread = 24 + depth * 36;
      const x = (rng() * 2 - 1) * spread;
      const y = (rng() * 2 - 1) * spread * 0.6;
      const z = -(depth * 50 + 8);
      const scale = 0.9 + rng() * 0.8;
      const rotation = new THREE.Euler(rng() * 0.6 - 0.3, rng() * Math.PI, rng() * 0.2 - 0.1);
      const position = new THREE.Vector3(x, y, z);
      const target = anchors[Math.floor(rng() * anchors.length)]?.clone() ?? new THREE.Vector3(0, 0, baseZ);
      const cycleDuration = 3 + rng() * 2; // 3-5 seconds per cycle
      const startTime = rng() * cycleDuration; // stagger start times
      
      docs.push({ 
        position, 
        rotation, 
        scale, 
        type: "doc", 
        depth, 
        target,
        startTime,
        cycleDuration,
        isVisible: true
      });
    }

    return [...folders, ...docs];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, seed]);

  // Looping animation: files fly to folders, disappear, reappear, repeat
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
        // Smooth fade transitions based on scroll progress
        const heroThreshold = 0.1; // Start fading at 10% scroll
        const fadeOutThreshold = 0.3; // Completely hidden at 30% scroll
        
        // Calculate smooth fade opacity based on scroll progress
        let heroOpacity = 1;
        if (progress > heroThreshold) {
          if (progress < fadeOutThreshold) {
            // Smooth fade out using easing function
            const fadeProgress = (progress - heroThreshold) / (fadeOutThreshold - heroThreshold);
            heroOpacity = 1 - THREE.MathUtils.smoothstep(fadeProgress, 0, 1);
          } else {
            // Completely hidden
            heroOpacity = 0;
          }
        }
    
    if (group.current) {
      // Apply smooth camera movement with fade
      const px = (progress - 0.5) * 10;
      const py = Math.sin(progress * Math.PI) * 6;
      group.current.position.x = THREE.MathUtils.damp(group.current.position.x, px, 2, 0.2);
      group.current.position.y = THREE.MathUtils.damp(group.current.position.y, py, 2, 0.2);
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        (progress - 0.5) * 0.8,
        2,
        0.2
      );
      
      // Individual object visibility is handled in the loop below
    }

    group.current?.children.forEach((child, i) => {
      const depth = (child.userData.depth as number) || 0.5;
      const base = (i % 10) * 0.37;
      const kind = child.userData.kind as string;
      const startTime = child.userData.startTime as number;
      const cycleDuration = child.userData.cycleDuration as number;

      const bx = child.userData.baseX as number;
      const by = child.userData.baseY as number;
      const bz = child.userData.baseZ as number;

      const tx = child.userData.tx as number;
      const ty = child.userData.ty as number;
      const tz = child.userData.tz as number;

        if (kind === "folder") {
          // Folders stay in place with gentle floating
          const floatY = Math.sin(t * 0.6 + base) * (0.1 + (1 - depth) * 0.3);
          child.position.x = bx;
          child.position.y = by + floatY;
          child.position.z = bz;
          
          // Gentle rotation for folders
          child.rotation.y += 0.001 * (1 - depth);
          
          // Apply smooth opacity fade to folders (handle multiple meshes)
          child.visible = true;
          child.children.forEach((mesh) => {
            if (mesh instanceof THREE.Mesh && mesh.material) {
              mesh.material.opacity = heroOpacity;
              mesh.material.transparent = true;
            }
          });
        } else if (kind === "doc") {
        // Documents fly to folders in looping animation
        const cycleTime = (t + startTime) % cycleDuration;
        const cycleProgress = cycleTime / cycleDuration;
        
        // Define animation phases
        const appearPhase = 0.1; // 10% of cycle - appearing
        const flyPhase = 0.7; // 70% of cycle - flying to folder
        const disappearPhase = 0.2; // 20% of cycle - disappearing
        
        let visibility = 1;
        let flyProgress = 0;
        
        if (cycleProgress < appearPhase) {
          // Appearing phase
          visibility = cycleProgress / appearPhase;
          flyProgress = 0;
        } else if (cycleProgress < appearPhase + flyPhase) {
          // Flying phase
          visibility = 1;
          flyProgress = (cycleProgress - appearPhase) / flyPhase;
        } else {
          // Disappearing phase
          visibility = 1 - ((cycleProgress - appearPhase - flyPhase) / disappearPhase);
          flyProgress = 1;
        }
        
        // Apply smooth opacity fade (combine animation visibility with scroll fade)
        const combinedOpacity = visibility * heroOpacity;
        child.visible = combinedOpacity > 0.01; // Keep visible for very low opacity
        if (child instanceof THREE.Mesh && child.material) {
          child.material.opacity = combinedOpacity;
          child.material.transparent = true;
        }
        
        // Smooth interpolation from start to target
        const smoothProgress = THREE.MathUtils.smoothstep(flyProgress, 0, 1);
        
        // Position interpolation
        child.position.x = bx + (tx - bx) * smoothProgress;
        child.position.y = by + (ty - by) * smoothProgress;
        child.position.z = bz + (tz - bz) * smoothProgress;
        
        // Rotation during flight
        child.rotation.x += 0.003 * (1 - depth);
        child.rotation.y += 0.005 * (1 - depth);
        child.rotation.z += 0.001 * (1 - depth);
        
        // Scale effect during flight
        const scaleEffect = 1 + Math.sin(flyProgress * Math.PI) * 0.1;
        child.scale.setScalar(scaleEffect);
      }
    });
  });

  return (
    <group ref={group}>
      {objects.map((obj, idx) => (
        obj.type === "folder" ? (
          <group
            key={idx}
            position={[obj.position.x, obj.position.y, obj.position.z]}
            rotation={[obj.rotation.x, obj.rotation.y, obj.rotation.z]}
            scale={obj.scale}
            userData={{
              depth: obj.depth,
              baseX: obj.position.x,
              baseY: obj.position.y,
              baseZ: obj.position.z,
              kind: "folder",
              startTime: obj.startTime,
              cycleDuration: obj.cycleDuration,
            }}
            castShadow
            receiveShadow
          >
            {/* Folder body */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.6, 1.0, 0.22]} />
              <meshStandardMaterial color={new THREE.Color(0xf1c40f)} metalness={0.2} roughness={0.7} transparent />
            </mesh>
            {/* Folder tab */}
            <mesh position={[-0.4, 0.65, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.6, 0.28, 0.22]} />
              <meshStandardMaterial color={new THREE.Color(0xe0b000)} metalness={0.2} roughness={0.7} transparent />
            </mesh>
          </group>
        ) : (
          <mesh
            key={idx}
            position={[obj.position.x, obj.position.y, obj.position.z]}
            rotation={[obj.rotation.x, obj.rotation.y, obj.rotation.z]}
            scale={obj.scale}
            userData={{
              depth: obj.depth,
              baseX: obj.position.x,
              baseY: obj.position.y,
              baseZ: obj.position.z,
              tx: obj.target?.x,
              ty: obj.target?.y,
              tz: obj.target?.z,
              kind: "doc",
              startTime: obj.startTime,
              cycleDuration: obj.cycleDuration,
            }}
            castShadow
            receiveShadow
          >
            {/* Document sheet (slim box) */}
            <boxGeometry args={[0.9, 1.25, 0.04]} />
            <meshStandardMaterial color={new THREE.Color(0xffffff)} metalness={0.05} roughness={0.35} transparent />
          </mesh>
        )
      ))}
    </group>
  );
}

function Scene() {
  const progress = useScrollProgress();
  const light = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (light.current) {
      // Only animate lighting in hero section
      const heroThreshold = 0.1;
      const isInHero = progress < heroThreshold;
      
      if (isInHero) {
        light.current.position.x = THREE.MathUtils.damp(
          light.current.position.x,
          10 * (progress - 0.5),
          2,
          0.2
        );
        light.current.position.y = THREE.MathUtils.damp(
          light.current.position.y,
          8 * (0.5 - Math.abs(progress - 0.5)),
          2,
          0.2
        );
      }
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        ref={light}
        position={[5, 8, 5]}
        intensity={1.4}
        castShadow
      />

      {/* Softer fog so objects aren't washed out */}
      <fog attach="fog" args={["#dde7ff", 60, 200]} />

      {/* Parallax floating objects */}
      <FloatingField count={120} seed={7} />
    </>
  );
}

export const Parallax3DBackground = () => {
  // Guard for SSR hydration mismatch: render only on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 h-full w-full">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 12], fov: 55, near: 0.1, far: 200 }}
      >
        <Scene />
      </Canvas>
    </div>
  );
};

export default Parallax3DBackground;