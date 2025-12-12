import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SimpleOrbitControlsProps {
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  minDistance?: number;
  maxDistance?: number;
  initialPosition?: { radius: number; theta: number; phi: number };
  enableDamping?: boolean;
  dampingFactor?: number;
}

export const SimpleOrbitControls: React.FC<SimpleOrbitControlsProps> = ({
  autoRotate = false,
  autoRotateSpeed = 0.5,
  minDistance = 2,
  maxDistance = 50,
  initialPosition = { radius: 10, theta: Math.PI / 4, phi: Math.PI / 3 },
  enableDamping = true,
  dampingFactor = 0.1
}) => {
  const { camera, gl } = useThree();
  
  // -- ÉTAT CIBLE (Où la caméra VEUT aller) --
  const targetSpherical = useRef(new THREE.Spherical(initialPosition.radius, initialPosition.phi, initialPosition.theta));
  
  // -- ÉTAT ACTUEL (Où la caméra EST actuellement - pour l'inertie) --
  const currentSpherical = useRef(new THREE.Spherical(initialPosition.radius, initialPosition.phi, initialPosition.theta));

  // -- GESTION DES POINTEURS --
  // On stocke les positions brutes des doigts
  const pointers = useRef<Map<number, { x: number, y: number }>>(new Map());
  
  // Pour calculer le mouvement relatif (Delta) manuellement au lieu de faire confiance à e.movementX/Y
  const lastCentroid = useRef<{ x: number, y: number } | null>(null);
  const lastPinchDist = useRef<number | null>(null);
  
  const isInteracting = useRef(false);

  useEffect(() => {
    const canvas = gl.domElement;
    
    // Initialiser la caméra
    currentSpherical.current.set(initialPosition.radius, initialPosition.phi, initialPosition.theta);
    targetSpherical.current.copy(currentSpherical.current);

    // --- UTILITAIRES ---
    const getCentroid = (ptrList: { x: number, y: number }[]) => {
      const sum = ptrList.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      return { x: sum.x / ptrList.length, y: sum.y / ptrList.length };
    };

    const getPinchDistance = (p1: { x: number, y: number }, p2: { x: number, y: number }) => {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    };

    // --- HANDLERS ---
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      isInteracting.current = true;

      // Reset des ancrages pour éviter les sauts
      const ptrList = Array.from(pointers.current.values()) as { x: number, y: number }[];
      lastCentroid.current = getCentroid(ptrList);
      
      if (ptrList.length === 2) {
        lastPinchDist.current = getPinchDistance(ptrList[0], ptrList[1]);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      canvas.releasePointerCapture(e.pointerId);
      pointers.current.delete(e.pointerId);
      
      if (pointers.current.size === 0) {
        isInteracting.current = false;
        lastCentroid.current = null;
        lastPinchDist.current = null;
      } else {
        // S'il reste des doigts (ex: on passe de 2 à 1 doigt), on réinitialise l'ancrage
        // pour que la caméra ne saute pas vers la position du doigt restant.
        const ptrList = Array.from(pointers.current.values()) as { x: number, y: number }[];
        lastCentroid.current = getCentroid(ptrList);
        lastPinchDist.current = null;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      
      // Mise à jour de la position du pointer courant
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const ptrList = Array.from(pointers.current.values()) as { x: number, y: number }[];
      const centroid = getCentroid(ptrList);

      // --- 1. ROTATION (1 Doigt) ---
      if (ptrList.length === 1 && lastCentroid.current) {
        // Calcul manuel du delta (plus fiable que e.movementX sur mobile)
        const deltaX = centroid.x - lastCentroid.current.x;
        const deltaY = centroid.y - lastCentroid.current.y;
        
        const sensitivity = 0.005;

        targetSpherical.current.theta -= deltaX * sensitivity;
        targetSpherical.current.phi -= deltaY * sensitivity;

        // Clamp Phi (Vertical) pour éviter le retournement
        targetSpherical.current.phi = Math.max(0.001, Math.min(Math.PI - 0.001, targetSpherical.current.phi));
      }

      // --- 2. ZOOM (2 Doigts) ---
      if (ptrList.length === 2) {
        const currentDist = getPinchDistance(ptrList[0], ptrList[1]);
        
        if (lastPinchDist.current !== null) {
          const deltaDist = currentDist - lastPinchDist.current;
          
          // Zoom dynamique : plus on est loin, plus on va vite
          const zoomFactor = targetSpherical.current.radius * 0.005; 
          
          targetSpherical.current.radius -= deltaDist * zoomFactor;
          
          // Clamp Radius
          targetSpherical.current.radius = Math.max(minDistance, Math.min(maxDistance, targetSpherical.current.radius));
        }
        
        lastPinchDist.current = currentDist;
        // En mode zoom, on peut aussi permettre une légère rotation si on veut, 
        // mais pour la stabilité, on met souvent à jour le centroid seulement
        // pour éviter que la rotation ne "saute" si on relâche un doigt.
      }

      lastCentroid.current = centroid;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.001;
      targetSpherical.current.radius += e.deltaY * zoomSpeed * targetSpherical.current.radius;
      targetSpherical.current.radius = Math.max(minDistance, Math.min(maxDistance, targetSpherical.current.radius));
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [gl.domElement, minDistance, maxDistance]);

  useFrame((state, delta) => {
    // 1. Auto-rotation
    if (autoRotate && !isInteracting.current) {
      targetSpherical.current.theta -= delta * autoRotateSpeed;
    }

    // 2. Damping (Lissage)
    if (enableDamping) {
      // Interpolation linéaire (Lerp) de current vers target
      // Cela crée l'effet de fluidité et supprime les saccades
      // Le facteur 1 - Math.exp(...) rend le damping indépendant du framerate
      const smoothFactor = 1 - Math.exp(-dampingFactor * 60 * delta);

      currentSpherical.current.phi += (targetSpherical.current.phi - currentSpherical.current.phi) * smoothFactor;
      currentSpherical.current.theta += (targetSpherical.current.theta - currentSpherical.current.theta) * smoothFactor;
      currentSpherical.current.radius += (targetSpherical.current.radius - currentSpherical.current.radius) * smoothFactor;
    } else {
      currentSpherical.current.copy(targetSpherical.current);
    }

    // 3. Mise à jour de la caméra
    // .makeSafe() assure que phi ne dépasse jamais strictement les pôles (évite les NaN)
    currentSpherical.current.makeSafe();

    // Conversion Sphérique -> Cartésien
    const position = new THREE.Vector3();
    position.setFromSpherical(currentSpherical.current);

    camera.position.copy(position);
    camera.lookAt(0, 0, 0);
  });

  return null;
};