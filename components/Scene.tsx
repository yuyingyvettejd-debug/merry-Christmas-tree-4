import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  ContactShadows, 
  Sparkles,
  Stars,
  Float
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise, ToneMapping } from '@react-three/postprocessing';
import { ChristmasTree } from './ChristmasTree';
import * as THREE from 'three';

interface SceneProps {
  lightsOn: boolean;
  isAssembled: boolean;
  rotationSpeed: number;
}

// A wrapper to handle the rotation of the entire tree group
const RotatingGroup = ({ children, speed }: { children?: React.ReactNode, speed: number }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * speed;
    }
  });
  return <group ref={ref}>{children}</group>;
};

export const Scene: React.FC<SceneProps> = ({ lightsOn, isAssembled, rotationSpeed }) => {
  return (
    <Canvas shadows dpr={[1, 2]}>
      <PerspectiveCamera makeDefault position={[0, 2, 12]} fov={45} />
      
      {/* --- LIGHTING --- */}
      <ambientLight intensity={0.2} color="#001a0d" />
      <spotLight 
        position={[10, 10, 10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={2} 
        color="#fff5b6" 
        castShadow 
      />
      <pointLight position={[-10, 5, -10]} intensity={1} color="#00ff88" />

      {/* --- ENVIRONMENT --- */}
      {/* Dark luxury environment reflection */}
      <Environment preset="city" environmentIntensity={0.5} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Floating Sparkles for Magic Atmosphere */}
      <Sparkles 
        count={200} 
        scale={12} 
        size={2} 
        speed={0.4} 
        opacity={0.5} 
        color="#FFD700"
      />

      {/* --- CONTENT --- */}
      <Suspense fallback={null}>
        <Float 
          speed={1} 
          rotationIntensity={0.2} 
          floatIntensity={0.5} 
          floatingRange={[-0.2, 0.2]}
        >
          <RotatingGroup speed={rotationSpeed}>
            <ChristmasTree lightsOn={lightsOn} isAssembled={isAssembled} />
          </RotatingGroup>
        </Float>
        
        <ContactShadows 
          opacity={0.5} 
          scale={20} 
          blur={2} 
          far={4} 
          resolution={256} 
          color="#000000" 
        />
      </Suspense>

      {/* --- CONTROLS --- */}
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={5}
        maxDistance={20}
      />

      {/* --- POST PROCESSING (Cinematic Look) --- */}
      <EffectComposer disableNormalPass>
        {/* Soft bloom for the magical glow */}
        <Bloom 
          luminanceThreshold={1.2} // Only very bright things glow (lights, reflections)
          mipmapBlur 
          intensity={1.5} 
          radius={0.6}
        />
        {/* Grain for filmic texture */}
        <Noise opacity={0.05} />
        {/* Vignette to focus center */}
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};
