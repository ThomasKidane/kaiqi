"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type ExtractionObject = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  type: "document" | "data" | "field" | "vendor" | "amount" | "receipt";
  depth: number;
  extractionProgress: number;
  startTime: number;
  cycleDuration: number;
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

function DocumentExtractionField({ count = 60, seed = 1 }: { count?: number; seed?: number }) {
  const progress = useScrollProgress();
  const group = useRef<THREE.Group>(null);

  const objects = useMemo<ExtractionObject[]>(() => {
    let s = seed >>> 0;
    const rng = () => {
      s = (1664525 * s + 1013904223) >>> 0;
      return (s & 0xffffffff) / 0x100000000;
    };

    const documents: ExtractionObject[] = [];
    const dataPoints: ExtractionObject[] = [];
    const fields: ExtractionObject[] = [];
    const vendors: ExtractionObject[] = [];
    const amounts: ExtractionObject[] = [];
    const receipts: ExtractionObject[] = [];

    // Create source documents
    for (let i = 0; i < count * 0.2; i++) {
      const depth = rng() * 0.8 + 0.2;
      const spread = 20 + depth * 20;
      const x = (rng() * 2 - 1) * spread;
      const y = (rng() * 2 - 1) * spread * 0.6;
      const z = -(depth * 40 + 10);
      const scale = 0.8 + rng() * 0.4;
      const rotation = new THREE.Euler(rng() * 0.4 - 0.2, rng() * Math.PI, rng() * 0.1 - 0.05);
      const position = new THREE.Vector3(x, y, z);
      const cycleDuration = 4 + rng() * 2;
      const startTime = rng() * cycleDuration;
      
      documents.push({ 
        position, 
        rotation, 
        scale, 
        type: "document", 
        depth,
        extractionProgress: rng(),
        startTime,
        cycleDuration
      });
    }

    // Create extracted data points (blue spheres)
    for (let i = 0; i < count * 0.15; i++) {
      const depth = rng() * 0.6 + 0.4;
      const spread = 15 + depth * 15;
      const x = (rng() * 2 - 1) * spread;
      const y = (rng() * 2 - 1) * spread * 0.6;
      const z = -(depth * 30 + 5);
      const scale = 0.3 + rng() * 0.2;
      const rotation = new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      const position = new THREE.Vector3(x, y, z);
      const cycleDuration = 3 + rng() * 1.5;
      const startTime = rng() * cycleDuration;
      
      dataPoints.push({ 
        position, 
        rotation, 
        scale, 
        type: "data", 
        depth,
        extractionProgress: rng(),
        startTime,
        cycleDuration
      });
    }

    // Create vendor labels (green rectangles)
    for (let i = 0; i < count * 0.15; i++) {
      const depth = rng() * 0.4 + 0.6;
      const spread = 10 + depth * 10;
      const x = (rng() * 2 - 1) * spread;
      const y = (rng() * 2 - 1) * spread * 0.6;
      const z = -(depth * 20 + 2);
      const scale = 0.2 + rng() * 0.1;
      const rotation = new THREE.Euler(0, rng() * Math.PI * 2, 0);
      const position = new THREE.Vector3(x, y, z);
      const cycleDuration = 2.5 + rng() * 1;
      const startTime = rng() * cycleDuration;
      
      vendors.push({ 
        position, 
        rotation, 
        scale, 
        type: "vendor", 
        depth,
        extractionProgress: rng(),
        startTime,
        cycleDuration
      });
    }

    // Create amount labels (yellow rectangles)
    for (let i = 0; i < count * 0.15; i++) {
      const depth = rng() * 0.4 + 0.6;
      const spread = 10 + depth * 10;
      const x = (rng() * 2 - 1) * spread;
      const y = (rng() * 2 - 1) * spread * 0.6;
      const z = -(depth * 20 + 2);
      const scale = 0.2 + rng() * 0.1;
      const rotation = new THREE.Euler(0, rng() * Math.PI * 2, 0);
      const position = new THREE.Vector3(x, y, z);
      const cycleDuration = 2.5 + rng() * 1;
      const startTime = rng() * cycleDuration;
      
      amounts.push({ 
        position, 
        rotation, 
        scale, 
        type: "amount", 
        depth,
        extractionProgress: rng(),
        startTime,
        cycleDuration
      });
    }

    // Create receipt labels (purple rectangles)
    for (let i = 0; i < count * 0.15; i++) {
      const depth = rng() * 0.4 + 0.6;
      const spread = 10 + depth * 10;
      const x = (rng() * 2 - 1) * spread;
      const y = (rng() * 2 - 1) * spread * 0.6;
      const z = -(depth * 20 + 2);
      const scale = 0.2 + rng() * 0.1;
      const rotation = new THREE.Euler(0, rng() * Math.PI * 2, 0);
      const position = new THREE.Vector3(x, y, z);
      const cycleDuration = 2.5 + rng() * 1;
      const startTime = rng() * cycleDuration;
      
      receipts.push({ 
        position, 
        rotation, 
        scale, 
        type: "receipt", 
        depth,
        extractionProgress: rng(),
        startTime,
        cycleDuration
      });
    }

    // Create field labels (gray rectangles)
    for (let i = 0; i < count * 0.2; i++) {
      const depth = rng() * 0.4 + 0.6;
      const spread = 10 + depth * 10;
      const x = (rng() * 2 - 1) * spread;
      const y = (rng() * 2 - 1) * spread * 0.6;
      const z = -(depth * 20 + 2);
      const scale = 0.2 + rng() * 0.1;
      const rotation = new THREE.Euler(0, rng() * Math.PI * 2, 0);
      const position = new THREE.Vector3(x, y, z);
      const cycleDuration = 2.5 + rng() * 1;
      const startTime = rng() * cycleDuration;
      
      fields.push({ 
        position, 
        rotation, 
        scale, 
        type: "field", 
        depth,
        extractionProgress: rng(),
        startTime,
        cycleDuration
      });
    }

    return [...documents, ...dataPoints, ...fields, ...vendors, ...amounts, ...receipts];
  }, [count, seed]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    // Only show animation after hero section (after 10% scroll)
    const heroThreshold = 0.1;
    const isAfterHero = progress > heroThreshold;
    
    if (group.current) {
      // Only animate camera movement after hero section
      if (isAfterHero) {
        const px = (progress - 0.5) * 8;
        const py = Math.sin(progress * Math.PI) * 4;
        group.current.position.x = THREE.MathUtils.damp(group.current.position.x, px, 2, 0.2);
        group.current.position.y = THREE.MathUtils.damp(group.current.position.y, py, 2, 0.2);
        group.current.rotation.y = THREE.MathUtils.damp(
          group.current.rotation.y,
          (progress - 0.5) * 0.6,
          2,
          0.2
        );
      }
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

      if (kind === "document" && isAfterHero) {
        // Documents stay in place with gentle floating
        const floatY = Math.sin(t * 0.8 + base) * (0.1 + (1 - depth) * 0.3);
        child.position.x = bx;
        child.position.y = by + floatY;
        child.position.z = bz;
        
        // Gentle rotation for documents
        child.rotation.y += 0.001 * (1 - depth);
      } else if (kind === "data" && isAfterHero) {
        // Data points extract upward from documents
        const cycleTime = (t + startTime) % cycleDuration;
        const cycleProgress = cycleTime / cycleDuration;
        
        // Extraction animation - data points move upward
        const extractionY = Math.sin(cycleProgress * Math.PI * 2) * 3;
        const floatY = Math.sin(t * 0.5 + base) * (0.1 + (1 - depth) * 0.2);
        
        child.position.x = bx;
        child.position.y = by + floatY + extractionY;
        child.position.z = bz;
        
        // Rotation during extraction
        child.rotation.x += 0.004 * (1 - depth);
        child.rotation.y += 0.006 * (1 - depth);
        child.rotation.z += 0.002 * (1 - depth);
      } else if ((kind === "vendor" || kind === "amount" || kind === "receipt" || kind === "field") && isAfterHero) {
        // Extracted fields float around
        const cycleTime = (t + startTime) % cycleDuration;
        const cycleProgress = cycleTime / cycleDuration;
        
        const floatY = Math.sin(t * 0.3 + base) * (0.1 + (1 - depth) * 0.2);
        const floatX = Math.sin(cycleProgress * Math.PI * 2) * 1;
        
        child.position.x = bx + floatX;
        child.position.y = by + floatY;
        child.position.z = bz;
        
        // Gentle rotation for fields
        child.rotation.y += 0.001 * (1 - depth);
      } else if (!isAfterHero) {
        // Hide all objects when in hero section
        child.visible = false;
      }
    });
  });

  return (
    <group ref={group}>
      {objects.map((obj, idx) => (
        obj.type === "document" ? (
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
              kind: "document",
              startTime: obj.startTime,
              cycleDuration: obj.cycleDuration,
            }}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.8, 1.1, 0.03]} />
            <meshStandardMaterial color={new THREE.Color(0xf8f9fa)} metalness={0.1} roughness={0.4} />
          </mesh>
        ) : obj.type === "data" ? (
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
              kind: "data",
              startTime: obj.startTime,
              cycleDuration: obj.cycleDuration,
            }}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[0.15, 8, 6]} />
            <meshStandardMaterial color={new THREE.Color(0x3498db)} metalness={0.3} roughness={0.2} />
          </mesh>
        ) : obj.type === "vendor" ? (
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
              kind: "vendor",
              startTime: obj.startTime,
              cycleDuration: obj.cycleDuration,
            }}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.4, 0.1, 0.1]} />
            <meshStandardMaterial color={new THREE.Color(0x2ecc71)} metalness={0.2} roughness={0.3} />
          </mesh>
        ) : obj.type === "amount" ? (
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
              kind: "amount",
              startTime: obj.startTime,
              cycleDuration: obj.cycleDuration,
            }}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.4, 0.1, 0.1]} />
            <meshStandardMaterial color={new THREE.Color(0xf39c12)} metalness={0.2} roughness={0.3} />
          </mesh>
        ) : obj.type === "receipt" ? (
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
              kind: "receipt",
              startTime: obj.startTime,
              cycleDuration: obj.cycleDuration,
            }}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.4, 0.1, 0.1]} />
            <meshStandardMaterial color={new THREE.Color(0x9b59b6)} metalness={0.2} roughness={0.3} />
          </mesh>
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
              kind: "field",
              startTime: obj.startTime,
              cycleDuration: obj.cycleDuration,
            }}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.4, 0.1, 0.1]} />
            <meshStandardMaterial color={new THREE.Color(0x95a5a6)} metalness={0.2} roughness={0.3} />
          </mesh>
        )
      ))}
    </group>
  );
}

function ExtractionScene() {
  const progress = useScrollProgress();
  const light = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (light.current) {
      // Only animate lighting after hero section
      const heroThreshold = 0.1;
      const isAfterHero = progress > heroThreshold;
      
      if (isAfterHero) {
        light.current.position.x = THREE.MathUtils.damp(
          light.current.position.x,
          8 * (progress - 0.5),
          2,
          0.2
        );
        light.current.position.y = THREE.MathUtils.damp(
          light.current.position.y,
          6 * (0.5 - Math.abs(progress - 0.5)),
          2,
          0.2
        );
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        ref={light}
        position={[4, 6, 4]}
        intensity={1.2}
        castShadow
      />
      <fog attach="fog" color="#e8f4fd" near={50} far={180} />
      <DocumentExtractionField count={80} seed={13} />
    </>
  );
}

export const DocumentExtractionBackground = () => {
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
        camera={{ position: [0, 0, 10], fov: 55, near: 0.1, far: 200 }}
      >
        <ExtractionScene />
      </Canvas>
    </div>
  );
};

export default DocumentExtractionBackground;
