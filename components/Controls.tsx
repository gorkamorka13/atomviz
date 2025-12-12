import React from 'react';
import { OrbitalState, OrbitalDescription } from '../types';
import { Atom, Sliders, Info, Zap, Calculator, Grid3x3, RotateCw, FileText, AlertTriangle, Layers, CheckCircle2, Circle, X } from 'lucide-react';

interface ControlsProps {
  orbital: OrbitalState;
  setOrbital: (orbital: OrbitalState) => void;
  isSuperposition: boolean;
  setIsSuperposition: (v: boolean) => void;
  availableSuperpositionOrbitals?: OrbitalState[];
  activeSuperpositionIndices?: number[];
  toggleSuperpositionOrbital?: (index: number) => void;
  explanation: OrbitalDescription;
  pointCount: number;
  setPointCount: (count: number) => void;
  rotationSpeed: number;
  setRotationSpeed: (speed: number) => void;
  onClose?: () => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  orbital, 
  setOrbital, 
  isSuperposition,
  setIsSuperposition,
  availableSuperpositionOrbitals = [],
  activeSuperpositionIndices = [],
  toggleSuperpositionOrbital = (index: number) => {},
  explanation, 
  pointCount, 
  setPointCount,
  rotationSpeed,
  setRotationSpeed,
  onClose
}) => {
  
  const handleTypeChange = (n: number, l: number, name: string) => {
    // Reset m to 0 when changing shell/subshell to avoid invalid states
    setOrbital({ n, l, m: 0, name });
  };

  const handleMChange = (newM: number) => {
    setOrbital({ ...orbital, m: newM });
  };

  // Generate available m values based on current l (-l to +l)
  const mValues = Array.from({ length: 2 * orbital.l + 1 }, (_, i) => i - orbital.l);

  // Configuration étendue des niveaux incluant les états excités
  const levels = [
    // Couche K, L, M
    { n: 1, l: 0, label: '1s' },
    { n: 2, l: 0, label: '2s' },
    { n: 2, l: 1, label: '2p' },
    { n: 3, l: 0, label: '3s' },
    { n: 3, l: 1, label: '3p' },
    { n: 3, l: 2, label: '3d' },
    // Couche N
    { n: 4, l: 0, label: '4s' },
    { n: 4, l: 1, label: '4p' },
    { n: 4, l: 2, label: '4d' },
    { n: 4, l: 3, label: '4f' },
    // Couche O (Excité)
    { n: 5, l: 0, label: '5s' },
    { n: 5, l: 1, label: '5p' },
    { n: 5, l: 2, label: '5d' },
    { n: 5, l: 3, label: '5f' },
    // Couche P (Excité)
    { n: 6, l: 0, label: '6s' },
    { n: 6, l: 1, label: '6p' },
    { n: 6, l: 2, label: '6d' },
  ];
  
  // Helper pour les couleurs des badges superposition
  const getOrbitalBadgeColor = (n: number, l: number, isActive: boolean) => {
     if (!isActive) return "border-slate-600 text-slate-500 bg-transparent";
     if (n === 1) return "border-red-500 text-red-100 bg-red-900/40";
     if (l === 0) return "border-blue-400 text-blue-100 bg-blue-900/40";
     return "border-purple-500 text-purple-100 bg-purple-900/40";
  };

  // Correction: Utilisation d'un chemin relatif simple.
  const logoPath = "atomviz.png";

  return (
    <div className="flex flex-col h-full bg-slate-800 border-r border-slate-700 w-full md:w-80 overflow-y-auto font-sans">
      <div className="p-6 border-b border-slate-700 flex flex-col items-center text-center relative">
        
        {/* Mobile Close Button */}
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-700/50 hover:bg-slate-600 text-slate-200 rounded-full md:hidden transition-colors border border-slate-600"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        )}

        {/* En-tête centré verticalement pour éviter tout décalage */}
        <div className="flex flex-col items-center gap-3 mb-3">
          <img 
            src={logoPath} 
            alt="AtomViz Logo" 
            className="w-16 h-16 object-contain drop-shadow-[0_0_12px_rgba(59,130,246,0.6)] hover:scale-105 transition-transform duration-300" 
          />
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">AtomViz</h1>
            <div className="mt-1">
              <span className="text-[10px] bg-blue-900/50 text-blue-200 px-2 py-0.5 rounded-full border border-blue-800">
                {isSuperposition ? "Mode Constructeur" : "Hydrogène (Z=1)"}
              </span>
            </div>
          </div>
        </div>
        <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold opacity-70">
          Visualiseur Quantique
        </p>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Mode Selector */}
        <section>
          <div className="flex bg-slate-700/50 p-1 rounded-lg border border-slate-600">
            <button 
              onClick={() => setIsSuperposition(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded transition-all ${!isSuperposition ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <Atom size={14} /> Orbitale Unique
            </button>
            <button 
              onClick={() => setIsSuperposition(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded transition-all ${isSuperposition ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <Layers size={14} /> Superposition
            </button>
          </div>
        </section>

        {/* --- SUPERPOSITION CONTROLS --- */}
        {isSuperposition && (
          <section>
            <h3 className="text-purple-300 font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Layers size={16} /> Sélection des Orbitales
            </h3>
            <div className="space-y-2">
              {availableSuperpositionOrbitals.map((orb, idx) => {
                 const isActive = activeSuperpositionIndices.includes(idx);
                 return (
                  <button
                    key={idx}
                    onClick={() => toggleSuperpositionOrbital(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded border transition-all ${getOrbitalBadgeColor(orb.n, orb.l, isActive)} hover:bg-slate-700/50`}
                  >
                    <span className="flex items-center gap-2 text-sm font-mono">
                      {isActive ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      {orb.name}
                    </span>
                    <span className="text-[10px] opacity-60">
                      {orb.n === 1 ? 'Cœur' : (orb.l === 0 ? 'Valence S' : 'Valence P')}
                    </span>
                  </button>
                 );
              })}
            </div>
          </section>
        )}

        {/* --- SINGLE ORBITAL CONTROLS --- */}
        {!isSuperposition && (
          <>
          {/* Level Selection (N) */}
            <section>
              <h3 className="text-blue-300 font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Sliders size={16} /> Niveaux d'énergie
              </h3>
              <div className="grid grid-cols-4 gap-2"> 
                {levels.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleTypeChange(item.n, item.l, item.label)}
                    className={`p-1.5 rounded text-xs font-semibold transition-all border ${
                      orbital.n === item.n && orbital.l === item.l
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/40'
                        : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Orientation Selection (m) */}
            {orbital.l > 0 && (
              <section>
                <h3 className="text-blue-300 font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Zap size={16} /> Nombre magnétique (m)
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {mValues.map((m) => (
                    <button
                      key={m}
                      onClick={() => handleMChange(m)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all border ${
                        orbital.m === m
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40'
                          : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-600 hover:border-slate-500'
                      }`}
                    >
                      {m > 0 ? `+${m}` : m}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Visual Settings: Density & Rotation */}
        <section className="space-y-6">
          
          {/* Cloud Density Slider */}
          <div>
            <h3 className="text-blue-300 font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Grid3x3 size={16} /> Densité du nuage
            </h3>
            <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-700">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Faible</span>
                <span className="text-white font-mono">{pointCount.toLocaleString()} pts</span>
                <span>Élevée</span>
              </div>
              <input
                type="range"
                min="2000"
                max="60000" 
                step="1000"
                value={pointCount}
                onChange={(e) => setPointCount(Number(e.target.value))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
              />
            </div>
          </div>

          {/* Rotation Speed Slider */}
          <div>
            <h3 className="text-blue-300 font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <RotateCw size={16} /> Rotation
            </h3>
            <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-700">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Pause</span>
                <span className="text-white font-mono">{rotationSpeed.toFixed(2)}</span>
                <span>Max</span>
              </div>
              <input
                type="range"
                min="0"
                max="1" 
                step="0.05"
                value={rotationSpeed}
                onChange={(e) => setRotationSpeed(Number(e.target.value))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
              />
            </div>
          </div>

        </section>

        {/* Physics Info Card */}
        <section className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-600">
          <div className="bg-slate-800/80 p-3 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-purple-300 font-semibold text-sm flex items-center gap-2">
              <Info size={16} /> Propriétés Physiques
            </h3>
          </div>
          
          <div className="p-4 flex flex-col gap-4">
              <>
                <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-purple-500 pl-3 whitespace-pre-line">
                  {explanation.text}
                </p>
                
                {explanation.equation && (
                  <div className="bg-black/40 p-3 rounded border border-slate-700/50 flex flex-col gap-1">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold flex items-center gap-1">
                      <Calculator size={10} /> Équation (Généralisée)
                    </span>
                    <div className="overflow-x-auto">
                      <code className="text-emerald-400 font-mono text-xs tracking-wide whitespace-nowrap">
                        {explanation.equation}
                      </code>
                    </div>
                  </div>
                )}
              </>
          </div>
        </section>
        
        {/* Conclusion / Summary Section */}
        {explanation.conclusion && (
          <section className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-600">
            <div className="bg-slate-800/80 p-3 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-amber-300 font-semibold text-sm flex items-center gap-2">
                <FileText size={16} /> Conclusion Analytique
              </h3>
            </div>
            <div className="p-4">
               <p className="text-xs text-slate-400 mb-2">
                 {isSuperposition ? "Le modèle de superposition présente :" : <>La fonction d'onde de l'orbitale <strong>{orbital.n}{orbital.name.slice(1)}</strong> présente :</>}
               </p>
               <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 font-mono">
                  <li className="pl-1">
                    <span className="text-slate-400">Symétrie :</span> <span className="text-white">{explanation.conclusion.symmetry}</span>
                  </li>
                  <li className="pl-1">
                    <span className="text-slate-400">Nœuds :</span> <span className="text-amber-400 font-bold">{explanation.conclusion.nodes}</span>
                  </li>
                  <li className="pl-1">
                    <span className="text-slate-400">Énergie :</span> <span className="text-emerald-400">{explanation.conclusion.energy}</span>
                  </li>
                  <li className="pl-1">
                    <span className="text-slate-400">Rayon (Max) :</span> <span className="text-blue-400">{explanation.conclusion.maxRadius}</span>
                  </li>
               </ol>
               
               {/* Context Badge */}
               <div className="mt-3 pt-2 border-t border-slate-700 flex items-center justify-center gap-2">
                  <AlertTriangle size={12} className="text-amber-500" />
                  <span className="text-[10px] text-slate-400 italic">
                     {explanation.conclusion.context}
                  </span>
               </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default Controls;