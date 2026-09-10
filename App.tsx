import React, { useState, useRef, useEffect } from 'react';
import OrbitalViewer from './components/OrbitalViewer';
import Controls from './components/Controls';
import SchematicThumbnail from './components/SchematicThumbnail';
import { OrbitalState } from './types';
import { getLocalOrbitalDescription, getSuperpositionDescription } from './utils/physics';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  // Mode Selection: 'single' or 'superposition'
  const [isSuperposition, setIsSuperposition] = useState<boolean>(false);

  // Initial State for Single Mode: 1s orbital
  const [singleOrbital, setSingleOrbital] = useState<OrbitalState>({
    n: 1,
    l: 0,
    m: 0,
    name: '1s'
  });

  // Available Orbitals for Superposition Mode (Master List)
  const availableSuperpositionOrbitals: OrbitalState[] = [
    { n: 1, l: 0, m: 0, name: '1s' },        // Index 0: Coeur
    { n: 2, l: 0, m: 0, name: '2s' },        // Index 1: Valence Sphérique
    { n: 2, l: 1, m: -1, name: '2p (x)' },   // Index 2: Px
    { n: 2, l: 1, m: 0, name: '2p (z)' },    // Index 3: Pz
    { n: 2, l: 1, m: 1, name: '2p (y)' },    // Index 4: Py
  ];

  // State to track which superposition orbitals are active (by index)
  // Default: All active (Neon configuration)
  const [activeSuperpositionIndices, setActiveSuperpositionIndices] = useState<number[]>([0, 1, 2, 3, 4]);

  // UI State: Sidebar visibility on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  // Helper to toggle orbitals
  const toggleSuperpositionOrbital = (index: number) => {
    setActiveSuperpositionIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index].sort((a, b) => a - b);
      }
    });
  };

  // Determine which orbitals to render based on mode
  const currentOrbitals = isSuperposition 
    ? availableSuperpositionOrbitals.filter((_, index) => activeSuperpositionIndices.includes(index))
    : [singleOrbital];

  // State for cloud density (number of points)
  const [pointCount, setPointCount] = useState<number>(15000);

  // State for rotation speed
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.1);

  // Calcul de la description (dépend du mode et des orbitales actives)
  const explanation = isSuperposition 
    ? getSuperpositionDescription(currentOrbitals) 
    : getLocalOrbitalDescription(singleOrbital.n, singleOrbital.l, singleOrbital.m);


  // --- Swipe Gesture Logic ---
  const handleTouchStart = (e: React.TouchEvent) => {
    // On capture la position de départ (X et Y pour vérifier que le mouvement est horizontal)
    touchStartRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    
    const diffX = touchStartRef.current.x - currentX;
    const diffY = touchStartRef.current.y - currentY;

    // Vérifier que le mouvement est principalement horizontal (pour éviter conflit avec le scroll vertical si présent)
    if (Math.abs(diffX) > Math.abs(diffY)) {
      
      // Swipe Left (Ouvrir -> Fermer) : Mouvement de droite à gauche (> 50px)
      if (diffX > 50 && isSidebarOpen) {
        setIsSidebarOpen(false);
        touchStartRef.current = null;
      }
      
      // Swipe Right (Fermer -> Ouvrir) : Mouvement de gauche à droite (< -50px)
      // CONDITION SUPPLÉMENTAIRE : Le geste doit commencer près du bord gauche (< 40px)
      // pour éviter d'ouvrir le menu quand on veut juste tourner l'atome au centre.
      if (diffX < -50 && !isSidebarOpen && touchStartRef.current.x < 40) {
        setIsSidebarOpen(true);
        touchStartRef.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  // Fermer la sidebar automatiquement quand on change de mode sur mobile
  useEffect(() => {
     if (window.innerWidth < 768) {
       // Optionnel : ne pas fermer à chaque changement, mais ici c'est souvent mieux UX
     }
  }, [isSuperposition]);


  return (
    <div 
      className="flex flex-col md:flex-row h-[100dvh] w-screen bg-slate-900 text-white overflow-hidden relative"
      // Déplacement des écouteurs sur le conteneur principal pour capturer le swipe partout (y compris sur le Canvas)
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* Mobile Header / Burger Button Overlay - Shown ONLY when closed */}
      {!isSidebarOpen && (
        <div className="fixed top-4 left-4 z-[100] md:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-slate-800/90 backdrop-blur-md border border-slate-600 rounded-lg text-white shadow-lg hover:bg-slate-700 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu size={24} />
          </button>
        </div>
      )}

      {/* Sidebar Controls Container */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out
          md:relative md:transform-none md:translate-x-0 md:w-80 md:flex-shrink-0 md:z-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Controls 
          orbital={singleOrbital} 
          setOrbital={setSingleOrbital} 
          isSuperposition={isSuperposition} 
          setIsSuperposition={setIsSuperposition}
          availableSuperpositionOrbitals={availableSuperpositionOrbitals}
          activeSuperpositionIndices={activeSuperpositionIndices}
          toggleSuperpositionOrbital={toggleSuperpositionOrbital}
          explanation={explanation}
          pointCount={pointCount}
          setPointCount={setPointCount}
          rotationSpeed={rotationSpeed}
          setRotationSpeed={setRotationSpeed}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        {/* Mobile Swipe Hint Overlay (only visual indication when open) */}
        <div className="md:hidden absolute top-1/2 -right-3 transform -translate-y-1/2 w-1 h-12 bg-slate-600 rounded-full opacity-50 pointer-events-none" />
      </div>

      {/* Overlay to close sidebar on click outside (Mobile only) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Visualization Area */}
      <div className="flex-1 relative bg-black h-full w-full">
        
        {/* Schematic View Thumbnail (Top Right) - Hide in Superposition mode */}
        {!isSuperposition && <SchematicThumbnail orbital={singleOrbital} />}

        {/* The 3D Point Cloud Canvas */}
        <OrbitalViewer 
          orbitals={currentOrbitals} 
          pointCount={pointCount} 
          rotationSpeed={rotationSpeed}
        />
        
        {/* Orbital info overlay - Remonté sur mobile (bottom-14) pour visibilité */}
        <div className="absolute bottom-14 right-6 md:bottom-6 z-10 text-right pointer-events-none max-w-[200px] md:max-w-none">
          <h2 className="text-3xl md:text-4xl font-bold text-white opacity-20 select-none truncate">
            {isSuperposition ? "Superposition" : `${singleOrbital.n}${singleOrbital.name.slice(1)}`}
          </h2>
          <div className="text-xs md:text-sm font-mono text-blue-400 opacity-60 mt-1">
             {isSuperposition 
                ? `${activeSuperpositionIndices.length} Orbitale(s) Active(s)` 
                : `n=${singleOrbital.n} l=${singleOrbital.l} m=${singleOrbital.m}`
             }
          </div>
          <div className="text-[10px] md:text-xs font-mono text-slate-500 opacity-60 mt-1">
             {(isSuperposition ? pointCount * 0.7 * activeSuperpositionIndices.length : pointCount).toLocaleString()} points total
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;