import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

interface TreeProps {
  lightsOn: boolean;
  isAssembled: boolean;
}

// --- CONFIGURATION ---
// Reduced count for a cleaner look (less "flying crumbs")
const FOLIAGE_COUNT = 2200; 
const RIBBON_PARTICLE_COUNT = 500;
// More baubles, but smaller
const BAUBLE_COUNT = 120;
const GIFT_COUNT = 35;
const COOKIE_COUNT = 35;

// Tree Geometry Constants
const TREE_HEIGHT = 9.5;
const TREE_RADIUS = 3.8;

// Reusable temporary objects
const tempObj = new THREE.Object3D();
const tempVec3 = new THREE.Vector3();

// --- MATERIALS ---

// 1. Emerald Foliage
const FOLIAGE_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#014421", // Deep Emerald
  emissive: "#001a0d",
  emissiveIntensity: 0.05,
  metalness: 0.8,
  roughness: 0.2,
  flatShading: true,
});

// 2. Gold (Ribbon & Baubles)
const GOLD_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#FFD700",
  metalness: 1.0,
  roughness: 0.15,
  emissive: "#B8860B",
  emissiveIntensity: 0.2,
});

// 3. Ruby (Gift Boxes)
const RUBY_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#8a0303", // Deep Red
  metalness: 0.9,
  roughness: 0.1,
  emissive: "#330000",
  emissiveIntensity: 0.2,
});

// 4. Copper (Gingerbread/Medallions)
const COPPER_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#B87333",
  metalness: 0.9,
  roughness: 0.4, // Slightly rougher like brushed metal or baked goods
  emissive: "#5c3a19",
  emissiveIntensity: 0.1,
});

// 5. Light (Star & Text)
const LIGHT_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#fffae5",
  emissive: "#fffae5",
  emissiveIntensity: 3,
  toneMapped: false
});

/**
 * Generic Morphing System for Instanced Meshes
 */
const MorphingSystem = ({ 
  count, 
  geometry, 
  material, 
  generatePositions, 
  isAssembled,
  baseScale = 1,
  spinSpeed = 1,
  randomizeRotation = true
}: {
  count: number,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  generatePositions: (i: number) => { tree: THREE.Vector3, scatter: THREE.Vector3, scale: number, rotation?: THREE.Euler },
  isAssembled: boolean,
  baseScale?: number,
  spinSpeed?: number,
  randomizeRotation?: boolean
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const data = useMemo(() => {
    const treePositions = new Float32Array(count * 3);
    const scatterPositions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);
    // Store static rotations for tree state if needed
    const treeRotations = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const pos = generatePositions(i);
      
      treePositions[i * 3] = pos.tree.x;
      treePositions[i * 3 + 1] = pos.tree.y;
      treePositions[i * 3 + 2] = pos.tree.z;

      scatterPositions[i * 3] = pos.scatter.x;
      scatterPositions[i * 3 + 1] = pos.scatter.y;
      scatterPositions[i * 3 + 2] = pos.scatter.z;

      if (pos.rotation) {
        treeRotations[i * 3] = pos.rotation.x;
        treeRotations[i * 3 + 1] = pos.rotation.y;
        treeRotations[i * 3 + 2] = pos.rotation.z;
      } else {
        treeRotations[i * 3] = Math.random() * Math.PI;
        treeRotations[i * 3 + 1] = Math.random() * Math.PI;
        treeRotations[i * 3 + 2] = Math.random() * Math.PI;
      }

      scales[i] = pos.scale * baseScale;
      speeds[i] = 0.5 + Math.random() * 0.5;
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { treePositions, scatterPositions, scales, speeds, phases, treeRotations };
  }, [count, generatePositions, baseScale]);

  const factor = useRef(isAssembled ? 1 : 0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const target = isAssembled ? 1 : 0;
    // Morph speed
    factor.current = THREE.MathUtils.lerp(factor.current, target, delta * 1.5);
    
    const t = factor.current;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      
      // Position Interpolation
      const tx = data.treePositions[ix];
      const ty = data.treePositions[ix + 1];
      const tz = data.treePositions[ix + 2];

      const sx = data.scatterPositions[ix];
      const sy = data.scatterPositions[ix + 1];
      const sz = data.scatterPositions[ix + 2];

      // Per-particle timing offset
      const particleT = THREE.MathUtils.clamp(t * data.speeds[i] + (t > 0.5 ? 0.1 : -0.1), 0, 1);
      const smoothT = particleT * particleT * (3 - 2 * particleT); 

      tempVec3.set(
        THREE.MathUtils.lerp(sx, tx, smoothT),
        THREE.MathUtils.lerp(sy, ty, smoothT),
        THREE.MathUtils.lerp(sz, tz, smoothT)
      );

      // Subtle float
      const hoverAmp = THREE.MathUtils.lerp(0.5, 0.02, smoothT); 
      tempVec3.y += Math.sin(time + data.phases[i]) * hoverAmp;
      
      // Rotation
      if (randomizeRotation) {
        // Continuous spinning for particles like glitter/leaves
        tempObj.rotation.set(
          time * 0.2 * spinSpeed + data.phases[i],
          time * 0.1 * spinSpeed + data.phases[i],
          time * 0.15 * spinSpeed + data.phases[i]
        );
      } else {
        // Fixed orientation for ornaments, merging to specific rotation
        // Scatter rotation is random, Tree rotation is fixed
        const rTx = data.treeRotations[ix];
        const rTy = data.treeRotations[ix + 1];
        const rTz = data.treeRotations[ix + 2];
        
        // When scattered, rotate slowly
        const scatterRot = time * 0.5 + data.phases[i];

        tempObj.rotation.set(
            THREE.MathUtils.lerp(scatterRot, rTx, smoothT),
            THREE.MathUtils.lerp(scatterRot, rTy, smoothT),
            THREE.MathUtils.lerp(scatterRot, rTz, smoothT)
        );
      }
      
      tempObj.position.copy(tempVec3);
      
      // Scale Pulse
      const scalePulse = 1 + Math.sin(time * 2 + data.phases[i]) * 0.05;
      tempObj.scale.setScalar(data.scales[i] * scalePulse);

      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObj.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, count]} 
      castShadow 
      receiveShadow
    />
  );
};

export const ChristmasTree: React.FC<TreeProps> = ({ lightsOn, isAssembled }) => {
  const starRef = useRef<THREE.Mesh>(null);
  const textGroupRef = useRef<THREE.Group>(null);

  // --- POSITION GENERATORS ---

  // 1. Foliage: Strict Surface Shell
  const generateFoliage = (i: number) => {
    // Bias towards bottom for density
    const level = Math.pow(Math.random(), 0.8); 
    const y = (1 - level) * TREE_HEIGHT - (TREE_HEIGHT / 2);
    
    // Strict Cone Radius calculation
    const radiusAtY = TREE_RADIUS * level;
    
    // Shell thickness: Very small (5%) to keep silhouette sharp
    const thickness = 0.05; 
    const rNorm = (1 - thickness) + (Math.random() * thickness);
    const r = radiusAtY * rNorm;
    
    const angle = Math.random() * Math.PI * 2;
    
    const tree = new THREE.Vector3(
      Math.cos(angle) * r,
      y,
      Math.sin(angle) * r
    );

    // Scatter: Wide sphere
    const scatterR = 10 + Math.random() * 5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const scatter = new THREE.Vector3(
      scatterR * Math.sin(phi) * Math.cos(theta),
      scatterR * Math.sin(phi) * Math.sin(theta),
      scatterR * Math.cos(phi)
    );

    return { tree, scatter, scale: 0.5 + Math.random() * 0.5 };
  };

  // Helper for generating ornament positions on surface
  const getSpiralPos = (i: number, total: number, offsetAngle: number = 0) => {
    const yNorm = 1 - (i / (total - 1)); // 1 at bottom, 0 at top
    // Clamp slightly to avoid very top tip and very bottom edge
    const yClamped = 0.1 + (yNorm * 0.85); 
    
    const y = yClamped * TREE_HEIGHT - (TREE_HEIGHT / 2);
    const r = TREE_RADIUS * (1 - yClamped); // Linear cone slope
    
    // Push out slightly to sit ON TOP of foliage
    const rPush = r + 0.3; 

    // Golden Angle spiral
    const phi = Math.PI * (3 - Math.sqrt(5)); 
    const theta = (phi * i * 20) + offsetAngle; 

    const tree = new THREE.Vector3(
      Math.cos(theta) * rPush,
      y,
      Math.sin(theta) * rPush
    );

    // Orientation: Face outwards
    const rotation = new THREE.Euler(0, -theta, 0);

    const scatter = new THREE.Vector3(
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 15
    );

    return { tree, scatter, rotation };
  };

  const generateBaubles = (i: number) => {
    const { tree, scatter, rotation } = getSpiralPos(i, BAUBLE_COUNT, 0);
    // Smaller scale: 0.3-0.6
    return { tree, scatter, rotation, scale: 0.3 + Math.random() * 0.3 };
  };

  const generateGifts = (i: number) => {
    // Offset phase so they don't overlap with baubles
    const { tree, scatter, rotation } = getSpiralPos(i, GIFT_COUNT, 2.5);
    
    // Add some random tilt to boxes so they look "placed" not rigid
    rotation.x += (Math.random() - 0.5) * 0.5;
    rotation.z += (Math.random() - 0.5) * 0.5;

    return { tree, scatter, rotation, scale: 0.6 + Math.random() * 0.3 };
  };

  const generateCookies = (i: number) => {
     // Offset phase
    const { tree, scatter, rotation } = getSpiralPos(i, COOKIE_COUNT, 4.5);
    // Face outward but tilt slightly like hanging
    rotation.x = Math.PI / 2; // Lie flat against surface? Or hang? Let's make them face out like medallions
    rotation.z = 0; 

    return { tree, scatter, rotation, scale: 0.5 + Math.random() * 0.2 };
  };

  // Ribbon Generator
  const generateRibbon = (i: number) => {
    const t = i / RIBBON_PARTICLE_COUNT;
    const loops = 6;
    
    const y = (1 - t) * TREE_HEIGHT - (TREE_HEIGHT / 2);
    const rBase = (TREE_RADIUS * t);
    const r = rBase + 0.4; // Hover outside
    const angle = t * Math.PI * 2 * loops;

    const tree = new THREE.Vector3(
      Math.cos(angle) * r,
      y,
      Math.sin(angle) * r
    );

    const scatterAngle = Math.random() * Math.PI * 2;
    const scatterR = 8 + Math.random() * 2;
    const scatter = new THREE.Vector3(
      Math.cos(scatterAngle) * scatterR,
      (Math.random() - 0.5) * 5,
      Math.sin(scatterAngle) * scatterR
    );

    return { tree, scatter, scale: 0.15 + Math.random() * 0.1 };
  };

  // --- GEOMETRIES ---
  // Small tetrahedron for leaves
  const foliageGeo = useMemo(() => new THREE.TetrahedronGeometry(1, 0), []); 
  const ribbonGeo = useMemo(() => new THREE.BoxGeometry(0.8, 0.8, 0.8), []);
  const baubleGeo = useMemo(() => new THREE.SphereGeometry(0.6, 32, 32), []);
  const giftGeo = useMemo(() => new THREE.BoxGeometry(0.8, 0.8, 0.8), []); // Cube
  const cookieGeo = useMemo(() => new THREE.CylinderGeometry(0.6, 0.6, 0.2, 6), []); // Hexagon medallion

  // Custom 5-Point Star Shape
  const starGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.8;
    const innerRadius = 0.4;
    
    for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const a = (i / (points * 2)) * Math.PI * 2;
        // Rotate -Math.PI / 2 to make the point face up (normally starts at right)
        const x = Math.cos(a + Math.PI / 2) * r;
        const y = Math.sin(a + Math.PI / 2) * r;
        
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
    }
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
        depth: 0.2,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.05,
        bevelSegments: 2
    });
  }, []);

  // --- STAR & TEXT ANIMATION ---
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    // Star animation
    if (starRef.current) {
       const targetPos = new THREE.Vector3(0, TREE_HEIGHT/2 + 0.4, 0);
       const scatterPos = new THREE.Vector3(0, 10, 0);
       
       const alpha = isAssembled ? 0.05 : 0.02;
       starRef.current.position.lerp(isAssembled ? targetPos : scatterPos, alpha);
       starRef.current.rotation.y += 0.01;
       const scale = 1 + Math.sin(t * 3) * 0.1;
       starRef.current.scale.setScalar(scale);
    }

    // Text animation
    if (textGroupRef.current) {
        const targetPos = new THREE.Vector3(0, TREE_HEIGHT/2 + 2, 0);
        const scatterPos = new THREE.Vector3(0, 15, 0);
        textGroupRef.current.position.lerp(isAssembled ? targetPos : scatterPos, 0.05);
        textGroupRef.current.lookAt(state.camera.position);
        
        // Gentle float
        textGroupRef.current.position.y += Math.sin(t * 2) * 0.005;
    }
  });

  return (
    <group>
      {/* 1. Foliage: The Solid Shell */}
      <MorphingSystem 
        count={FOLIAGE_COUNT}
        geometry={foliageGeo}
        material={FOLIAGE_MATERIAL}
        generatePositions={generateFoliage}
        isAssembled={isAssembled}
        baseScale={0.3} // Small leaves
        spinSpeed={0.5}
      />

      {/* 2. Ribbon: Gold Dust Stream */}
      <MorphingSystem 
        count={RIBBON_PARTICLE_COUNT}
        geometry={ribbonGeo}
        material={GOLD_MATERIAL}
        generatePositions={generateRibbon}
        isAssembled={isAssembled}
        spinSpeed={3}
      />

      {/* 3. Gold Baubles */}
      <MorphingSystem 
        count={BAUBLE_COUNT}
        geometry={baubleGeo}
        material={GOLD_MATERIAL}
        generatePositions={generateBaubles}
        isAssembled={isAssembled}
        randomizeRotation={false}
      />

      {/* 4. Ruby Gift Boxes */}
      <MorphingSystem 
        count={GIFT_COUNT}
        geometry={giftGeo}
        material={RUBY_MATERIAL}
        generatePositions={generateGifts}
        isAssembled={isAssembled}
        randomizeRotation={false}
      />

      {/* 5. Copper Medallions */}
      <MorphingSystem 
        count={COOKIE_COUNT}
        geometry={cookieGeo}
        material={COPPER_MATERIAL}
        generatePositions={generateCookies}
        isAssembled={isAssembled}
        randomizeRotation={false}
      />

      {/* Star Topper */}
      <mesh ref={starRef} castShadow geometry={starGeo} material={LIGHT_MATERIAL}>
        <pointLight 
          color="#fffae5" 
          intensity={lightsOn ? 3 : 0} 
          distance={15} 
          decay={2} 
        />
      </mesh>

      {/* Glowing Text */}
      <group ref={textGroupRef}>
        <Text
            fontSize={0.8}
            letterSpacing={0.1}
            color="#FFD700"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#B8860B"
        >
            Merry Christmas
            <meshBasicMaterial color="#FFD700" toneMapped={false} />
        </Text>
      </group>

      {/* Internal "Soul" Light */}
      <pointLight 
        position={[0, 0, 0]} 
        intensity={isAssembled && lightsOn ? 2 : 0} 
        color="#00ff88" 
        distance={8}
        decay={2}
      />
    </group>
  );
};