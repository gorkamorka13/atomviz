import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Box, Minus } from 'lucide-react';
import { OrbitalState } from '../types';
import { SimpleOrbitControls } from './SimpleOrbitControls';
import * as THREE from 'three';

interface SchematicThumbnailProps {
  orbital: OrbitalState;
}

// Matériau partagé pour un look "Premium" (Plastique brillant / Céramique)
const sharedMaterialProps = {
  roughness: 0.2,
  metalness: 0.1,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  emissiveIntensity: 0.25,
};

// Composant utilitaire pour un Lobe
const Lobe: React.FC<{ 
  position: [number, number, number]; 
  rotation?: [number, number, number]; 
  scale?: [number, number, number];
  color?: string; 
}> = ({ position, rotation = [0, 0, 0], scale = [1, 1, 1], color = "#60a5fa" }) => {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhysicalMaterial 
        color={color} 
        emissive={color}
        {...sharedMaterialProps}
      />
    </mesh>
  );
};

const Torus: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  radius?: number;
  tube?: number;
  color?: string;
}> = ({ position = [0, 0, 0], rotation = [Math.PI/2, 0, 0], radius = 0.8, tube = 0.15, color = "#f472b6" }) => {
  return (
    <mesh position={position} rotation={rotation}>
      <torusGeometry args={[radius, tube, 32, 64]} />
      <meshPhysicalMaterial 
        color={color} 
        emissive={color}
        {...sharedMaterialProps}
      />
    </mesh>
  );
};

// Logique de construction géométrique
const OrbitalShape: React.FC<{ orbital: OrbitalState }> = ({ orbital }) => {
  const { l, m } = orbital;
  const absM = Math.abs(m);

  // --- S (l=0) ---
  if (l === 0) {
    return (
      <group>
        <Lobe position={[0, 0, 0]} scale={[1.3, 1.3, 1.3]} color="#3b82f6" />
      </group>
    );
  }

  // --- P (l=1) ---
  if (l === 1) {
    // Axe principal selon m
    let rot: [number, number, number] = [0, 0, 0];
    if (m === 1) rot = [0, 0, -Math.PI / 2]; // x
    if (m === -1) rot = [Math.PI / 2, 0, 0]; // y
    // m=0 => z (default)

    return (
      <group rotation={rot}>
        {/* Les lobes sont légèrement rapprochés pour fusionner visuellement au centre */}
        <Lobe position={[0, 0.95, 0]} scale={[0.7, 1.1, 0.7]} color="#3b82f6" />
        <Lobe position={[0, -0.95, 0]} scale={[0.7, 1.1, 0.7]} color="#ec4899" />
      </group>
    );
  }

  // --- D (l=2) ---
  if (l === 2) {
    // dz^2 (m=0)
    if (m === 0) {
      return (
        <group>
          <Lobe position={[0, 1.3, 0]} scale={[0.6, 1.3, 0.6]} color="#3b82f6" />
          <Lobe position={[0, -1.3, 0]} scale={[0.6, 1.3, 0.6]} color="#3b82f6" />
          <Torus radius={0.9} tube={0.2} color="#ec4899" />
        </group>
      );
    }
    
    // dxz, dyz (|m|=1) -> Trèfle vertical
    // dx^2-y^2, dxy (|m|=2) -> Trèfle horizontal
    
    let groupRot: [number, number, number] = [0, 0, 0];
    let lobeRot: number = 0;

    if (absM === 1) {
        if (m === 1) groupRot = [Math.PI/2, 0, 0]; 
        if (m === -1) groupRot = [0, Math.PI/2, Math.PI/2];
    } else {
        if (m === -2) lobeRot = Math.PI/4;
    }

    return (
      <group rotation={groupRot}>
        <group rotation={[0, 0, lobeRot]}>
            <Lobe position={[1.1, 0, 0]} scale={[1.1, 0.5, 0.5]} color="#3b82f6" />
            <Lobe position={[-1.1, 0, 0]} scale={[1.1, 0.5, 0.5]} color="#3b82f6" />
            <Lobe position={[0, 1.1, 0]} scale={[0.5, 1.1, 0.5]} color="#ec4899" />
            <Lobe position={[0, -1.1, 0]} scale={[0.5, 1.1, 0.5]} color="#ec4899" />
        </group>
      </group>
    );
  }

  // --- F (l=3) ---
  if (l === 3) {
    // 1. f z^3 (m=0) : Lobes + 2 Anneaux
    if (m === 0) {
      return (
        <group>
          <Lobe position={[0, 1.4, 0]} scale={[0.6, 1.2, 0.6]} color="#3b82f6" />
          <Lobe position={[0, -1.4, 0]} scale={[0.6, 1.2, 0.6]} color="#ec4899" />
          <Torus position={[0, 0, 0.5]} rotation={[Math.PI/2, 0, 0]} radius={0.8} tube={0.12} color="#ec4899" />
          <Torus position={[0, 0, -0.5]} rotation={[Math.PI/2, 0, 0]} radius={0.8} tube={0.12} color="#3b82f6" />
        </group>
      );
    }

    // 2. f xz^2 / yz^2 (|m|=1)
    if (absM === 1) {
        const planeRot: [number, number, number] = m === 1 ? [Math.PI/2, 0, 0] : [0, Math.PI/2, Math.PI/2];
        return (
            <group rotation={planeRot}>
                <Lobe position={[0, 1.4, 0]} scale={[0.5, 1.2, 0.5]} color="#3b82f6" />
                <Lobe position={[0, -1.4, 0]} scale={[0.5, 1.2, 0.5]} color="#3b82f6" />
                <Lobe position={[1.1, 0.7, 0]} rotation={[0, 0, 0.6]} scale={[0.45, 1.1, 0.45]} color="#ec4899" />
                <Lobe position={[-1.1, 0.7, 0]} rotation={[0, 0, -0.6]} scale={[0.45, 1.1, 0.45]} color="#ec4899" />
                <Lobe position={[1.1, -0.7, 0]} rotation={[0, 0, -0.6]} scale={[0.45, 1.1, 0.45]} color="#ec4899" />
                <Lobe position={[-1.1, -0.7, 0]} rotation={[0, 0, 0.6]} scale={[0.45, 1.1, 0.45]} color="#ec4899" />
            </group>
        );
    }

    // 3. f xyz / z(x^2-y^2) (|m|=2)
    if (absM === 2) {
        const offset = m === 2 ? 0 : Math.PI/4;
        return (
            <group rotation={[0, offset, 0]}>
                 {[1, -1].map(ySign => (
                    <group key={ySign} scale={[1, ySign, 1]}>
                        <Lobe position={[0.8, 0.8, 0.8]} scale={[0.6, 0.6, 0.6]} color="#3b82f6" />
                        <Lobe position={[-0.8, 0.8, 0.8]} scale={[0.6, 0.6, 0.6]} color="#ec4899" />
                        <Lobe position={[0.8, 0.8, -0.8]} scale={[0.6, 0.6, 0.6]} color="#ec4899" />
                        <Lobe position={[-0.8, 0.8, -0.8]} scale={[0.6, 0.6, 0.6]} color="#3b82f6" />
                    </group>
                 ))}
            </group>
        );
    }

    // 4. f hex (|m|=3)
    if (absM === 3) {
        const offset = m === 3 ? 0 : Math.PI/6;
        const lobes = [];
        for(let i=0; i<6; i++) {
            const angle = (i * Math.PI / 3);
            const isPos = i % 2 === 0;
            lobes.push(
                <Lobe 
                    key={i}
                    position={[Math.cos(angle)*1.4, Math.sin(angle)*1.4, 0]} 
                    rotation={[0, 0, angle + Math.PI/2]}
                    scale={[0.5, 1.2, 0.5]}
                    color={isPos ? "#3b82f6" : "#ec4899"}
                />
            );
        }
        return (
            <group rotation={[0, 0, offset]}>
                {lobes}
            </group>
        );
    }
  }

  // --- G et plus (l >= 4) ---
  const petalCount = l * 2;
  const rings = [];
  
  for (let i = 0; i < petalCount; i++) {
     const angle = (i / petalCount) * Math.PI * 2;
     const isPositive = i % 2 === 0;
     rings.push(
       <group key={i} rotation={[0, 0, angle]}>
          <Lobe 
            position={[0, 1.8, 0]} 
            scale={[0.4, 1.2, 0.4]} 
            color={isPositive ? "#3b82f6" : "#ec4899"} 
          />
       </group>
     );
  }
  
  if (l >= 5) {
      rings.push(
        <Torus key="inner" radius={1} tube={0.1} color="white" />
      );
  }

  return (
    <group>
      {rings}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="white" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

const SchematicThumbnail: React.FC<SchematicThumbnailProps> = ({ orbital }) => {
  const [isMinimized, setIsMinimized] = useState(true);

  if (isMinimized) {
    return (
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center justify-center w-10 h-10 bg-slate-800/80 hover:bg-slate-700 text-blue-400 rounded-lg border border-slate-600 shadow-lg transition-all backdrop-blur-sm"
          title="Afficher le modèle schématique"
        >
          <Box size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-20 w-48 h-56 flex flex-col bg-slate-900/95 border border-slate-600 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
      
      {/* Barre de titre */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/90 border-b border-slate-700">
        <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider flex items-center gap-2">
          <Box size={12} className="text-blue-400" />
          <span>Schéma 3D</span>
        </div>
        <button 
          onClick={() => setIsMinimized(true)}
          className="text-slate-400 hover:text-white transition-colors"
          title="Réduire"
        >
          <Minus size={14} />
        </button>
      </div>

      {/* Contenu Canvas */}
      <div className="flex-1 relative bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          {/* Éclairage Studio pour mise en valeur */}
          <ambientLight intensity={0.4} />
          
          {/* Key Light (Principale) - Blanche chaude */}
          <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
          
          {/* Fill Light (Débouchage) - Bleutée */}
          <pointLight position={[-5, 0, 5]} intensity={0.5} color="#a5f3fc" />
          
          {/* Rim Light (Contre-jour) - Pour détacher le modèle du fond */}
          <pointLight position={[0, 5, -5]} intensity={1.2} color="#e879f9" />
          
          <group scale={[0.8, 0.8, 0.8]}>
             <OrbitalShape orbital={orbital} />
          </group>

          <SimpleOrbitControls 
            autoRotate={true}
            autoRotateSpeed={1.5}
            minDistance={3}
            maxDistance={15}
            initialPosition={{ radius: 8, theta: 0.5, phi: Math.PI / 2.5 }}
          />
        </Canvas>
        
        {/* Légende rapide des couleurs */}
        <div className="absolute bottom-2 left-2 flex gap-2 text-[9px] font-mono opacity-60">
            <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-blue-200">Phase +</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                <span className="text-pink-200">Phase -</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SchematicThumbnail;