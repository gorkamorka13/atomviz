import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateOrbitalPoints } from '../utils/physics';
import { OrbitalState } from '../types';
import { SimpleOrbitControls } from './SimpleOrbitControls';

interface OrbitalViewerProps {
  orbitals: OrbitalState[];
  pointCount: number;
  rotationSpeed: number;
}

interface CloudProps {
  orbital: OrbitalState;
  pointCount: number;
  rotationSpeed: number;
  color: string;
  opacity: number;
}

const ElectronCloud: React.FC<CloudProps> = ({ orbital, pointCount, rotationSpeed, color, opacity }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    // Generate points based on current orbital state and density slider
    return generateOrbitalPoints(orbital.n, orbital.l, orbital.m, pointCount);
  }, [orbital.n, orbital.l, orbital.m, pointCount]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      // Rotation automatique fluide contrôlée par le slider
      pointsRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  // Calcul dynamique de la taille des points
  // Pour les états très excités (n grand), le nuage est immense et les points très dispersés.
  // On augmente significativement la taille des points pour qu'ils restent visibles (surtout sur mobile).
  const pointSize = useMemo(() => {
    if (orbital.n >= 5) return 0.50; // Très gros points pour n=5, 6
    if (orbital.n === 4) return 0.35;
    if (orbital.n === 3) return 0.22;
    return 0.15; // Taille standard pour n=1, 2
  }, [orbital.n]);

  // Unique key for the memoized points
  const orbitalKey = `${orbital.n}-${orbital.l}-${orbital.m}-${pointCount}`;

  return (
    <points ref={pointsRef} key={orbitalKey}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={pointSize}
        color={color}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const Nucleus: React.FC = () => {
  return (
    <mesh>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial color="#ef4444" emissive="#7f1d1d" emissiveIntensity={0.5} />
    </mesh>
  );
};

const Axes: React.FC = () => {
  // Use axesHelper directly as a JSX element (native to R3F) to avoid recreating objects
  return <axesHelper args={[5]} />;
}

// Fonction pour déterminer la couleur en fonction de la couche (n) et sous-couche (l)
const getOrbitalColor = (n: number, l: number) => {
  // Couleurs plus saturées et distinctes pour le blending additif
  if (n === 1) return "#ff1111"; // Rouge pur pour le coeur 1s
  if (l === 0) return "#0066ff"; // Bleu électrique pour s (n>1)
  if (l === 1) return "#dd00ff"; // Violet/Magenta vibrant pour p
  if (l === 2) return "#00dd44"; // Vert vibrant pour d
  return "#00ffff"; // Cyan pour f/autres
};

const OrbitalViewer: React.FC<OrbitalViewerProps> = ({ orbitals, pointCount, rotationSpeed }) => {
  
  // Suppression de la logique qui réduisait le nombre de points par 0.7 en mode superposition.
  // Désormais, le slider contrôle exactement le nombre de points demandés à la génération.
  const targetPointCount = pointCount;

  // --- CALCUL DU ZOOM AUTOMATIQUE ---
  const { initialRadius, maxDistance } = useMemo(() => {
    // On trouve le 'n' maximum pour savoir à quel point l'atome est grand
    const maxN = orbitals.length > 0 ? Math.max(...orbitals.map(o => o.n)) : 1;
    
    // Le rayon de l'orbitale grandit approximativement comme n^2
    // On ajuste la position initiale de la caméra pour englober tout le nuage
    const radius = Math.max(15, maxN * maxN * 2.5);
    
    // On ajuste aussi la distance maximale de zoom pour permettre de s'éloigner suffisamment
    const distance = Math.max(250, radius * 2.5);
    
    return { initialRadius: radius, maxDistance: distance };
  }, [orbitals]);

  // Clé unique basée sur les orbitales pour forcer le reset de la caméra quand on change d'orbitale
  const controlsKey = orbitals.map(o => `${o.n}${o.l}${o.m}`).join('-');

  // Détection des types d'orbitales présentes pour la légende dynamique
  const has1s = orbitals.some(o => o.n === 1 && o.l === 0);
  const has2s = orbitals.some(o => o.n === 2 && o.l === 0);
  const has2p = orbitals.some(o => o.n === 2 && o.l === 1);

  return (
    <div 
      className="w-full h-full relative bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800"
      style={{ touchAction: 'none' }} // Sécurité supplémentaire pour empêcher le zoom navigateur
    >
      <Canvas camera={{ fov: 45 }}>
        {/* Fond noir pur */}
        <color attach="background" args={['#000000']} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <Axes />
        <Nucleus />
        
        {orbitals.map((orb) => (
          <ElectronCloud 
            // Fix: Remove index from key to prevent unnecessary remounts when filtering lists
            key={`${orb.n}-${orb.l}-${orb.m}`}
            orbital={orb} 
            pointCount={targetPointCount} 
            rotationSpeed={rotationSpeed}
            color={getOrbitalColor(orb.n, orb.l)}
            // Opacité ajustée : 
            // En mode superposition (>1), on garde le coeur brillant (0.9) et l'exterieur doux (0.5).
            // En mode unique, on augmente l'opacité globale (0.8 -> 0.9) pour compenser la dispersion sur mobile.
            opacity={orbitals.length > 1 ? (orb.n === 1 ? 0.9 : 0.5) : 0.85}
          />
        ))}

        {/* Contrôles manuels partagés */}
        <SimpleOrbitControls 
          // La clé force le composant à se recréer (et donc réinitialiser la position caméra) quand la liste change
          key={controlsKey}
          autoRotate={false}
          minDistance={2}
          maxDistance={maxDistance} 
          initialPosition={{
            radius: initialRadius, 
            theta: Math.PI / 4,
            phi: Math.acos(10 / 17.3)
          }}
        />
      </Canvas>
      
      {/* Crédit Centré en bas - Rétablissement */}
      <div className="absolute bottom-4 md:bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-600 pointer-events-none select-none z-10 font-mono">
        Michel ESPARSA 12/12/2025
      </div>
      
      {/* Légende - Remontée sur mobile (bottom-14) pour être au même niveau que le titre à droite */}
      <div className="absolute bottom-14 md:bottom-4 left-4 bg-black/80 border border-slate-800 backdrop-blur-md p-2 rounded text-xs text-slate-300 pointer-events-none z-20">
        <p>🔴 Noyau</p>
        {orbitals.length > 1 ? (
          <>
            {has1s && <p className="font-bold" style={{ color: getOrbitalColor(1, 0) }}>⬤ Couche K (1s)</p>}
            {has2s && <p className="font-bold" style={{ color: getOrbitalColor(2, 0) }}>⬤ Couche L (2s)</p>}
            {has2p && <p className="font-bold" style={{ color: getOrbitalColor(2, 1) }}>⬤ Couche L (2p)</p>}
          </>
        ) : (
          orbitals.length === 0 ? (
            <p className="text-gray-500 italic">Aucune orbitale</p>
          ) : (
            <p className="font-bold" style={{ color: getOrbitalColor(orbitals[0].n, orbitals[0].l) }}>
              ⬤ Densité de probabilité
            </p>
          )
        )}
        <p className="mt-1 opacity-70">🖱️ Rotation: Clic Gauche + Glisser</p>
      </div>
    </div>
  );
};

export default OrbitalViewer;