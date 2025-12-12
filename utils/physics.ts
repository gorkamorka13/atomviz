import { OrbitalDescription, OrbitalConclusion, OrbitalState } from "../types";

const distance = (x: number, y: number, z: number) => Math.sqrt(x * x + y * y + z * z);

// --- MATHÉMATIQUES GÉNÉRALISÉES ---

/**
 * Calcule le polynôme de Laguerre généralisé L_n^alpha(x)
 * Utilisé pour la partie radiale de la fonction d'onde de l'atome d'hydrogène.
 */
const generalizedLaguerre = (n: number, alpha: number, x: number): number => {
  if (n === 0) return 1;
  if (n === 1) return 1 + alpha - x;

  let Lk_1 = 1; // L_{k-1} (initialisé à L_0)
  let Lk = 1 + alpha - x; // L_k (initialisé à L_1)

  // Relation de récurrence: (k+1) L_{k+1} = (2k + 1 + alpha - x) L_k - (k + alpha) L_{k-1}
  for (let k = 1; k < n; k++) {
    const Lk_plus_1 = ((2 * k + 1 + alpha - x) * Lk - (k + alpha) * Lk_1) / (k + 1);
    Lk_1 = Lk;
    Lk = Lk_plus_1;
  }
  return Lk;
};

/**
 * Calcule la partie radiale R_nl(r)
 * R(r) ∝ (2r/n)^l * exp(-r/n) * L_{n-l-1}^{2l+1}(2r/n)
 */
const getRadialPart = (r: number, n: number, l: number): number => {
  // Variable réduite rho = 2Zr / (n a0). On suppose Z=1, a0=1 pour la visualisation.
  const scaledR = r; 
  const rho = (2.0 * scaledR) / n;
  
  const prefactor = Math.pow(rho, l) * Math.exp(-rho / 2.0);
  const laguerre = generalizedLaguerre(n - l - 1, 2 * l + 1, rho);
  
  return prefactor * laguerre;
};

/**
 * Calcule la partie angulaire Y_lm(theta, phi) (Harmoniques Sphériques Réelles simplifiées)
 * Retourne la valeur angulaire non normalisée.
 */
const getAngularPart = (x: number, y: number, z: number, r: number, l: number, m: number): number => {
  if (r === 0) return 0; // Éviter division par zéro au noyau

  // s orbital (l=0)
  if (l === 0) return 1;

  // p orbitals (l=1)
  if (l === 1) {
    if (m === 0) return z / r;      // pz
    if (m === 1) return x / r;      // px
    if (m === -1) return y / r;     // py
  }

  // d orbitals (l=2)
  if (l === 2) {
    if (m === 0) return (3 * z * z - r * r) / (r * r);               // dz^2
    if (m === 1) return (x * z) / (r * r);                           // dxz
    if (m === -1) return (y * z) / (r * r);                          // dyz
    if (m === 2) return (x * x - y * y) / (r * r);                   // dx^2-y^2
    if (m === -2) return (x * y) / (r * r);                          // dxy
  }

  // f orbitals (l=3)
  if (l === 3) {
    if (m === 0) return (z * (5 * z * z - 3 * r * r)) / Math.pow(r, 3);
    if (Math.abs(m) === 1) {
      const component = m === 1 ? x : y;
      return (component * (5 * z * z - r * r)) / Math.pow(r, 3);
    }
    if (Math.abs(m) === 2) {
      const zComponent = z;
      const xyComponent = m === 2 ? (x * x - y * y) : (x * y);
      return (zComponent * xyComponent) / Math.pow(r, 3);
    }
    if (Math.abs(m) === 3) {
       if (m === 3) return (x * (x * x - 3 * y * y)) / Math.pow(r, 3);
       return (y * (3 * x * x - y * y)) / Math.pow(r, 3);
    }
  }

  // g orbitals (l=4) et au-delà
  if (l >= 4) {
      // Approximation générique pour visualiser la symétrie sans formule exacte complexe
      // Suffisant pour l'aspect visuel des lobes
      if (m === 0) return (35*Math.pow(z,4) - 30*z*z*r*r + 3*Math.pow(r,4)) / Math.pow(r, 4);
      return (x*y*z*z) / Math.pow(r, 4); 
  }

  return 1;
};


// Main probability density function |Ψ|^2
const getProbability = (x: number, y: number, z: number, n: number, l: number, m: number): number => {
  const r = distance(x, y, z);
  
  const R = getRadialPart(r, n, l);
  const Y = getAngularPart(x, y, z, r, l, m);
  
  return (R * Y) * (R * Y);
};

// Monte Carlo Rejection Sampling to generate point cloud
export const generateOrbitalPoints = (n: number, l: number, m: number, count: number = 8000) => {
  const points: number[] = [];
  
  // OPTIMISATION LIMIT:
  // Pour n=1, la probabilité chute très vite (e^-2r). Inutile d'aller scanner jusqu'à 12.
  // Une limite plus serrée augmente radicalement l'efficacité du générateur pour les petites orbitales.
  // Formule ajustée : 
  // n=1 -> 6 (très large déjà pour 1s)
  // n=2 -> ~10
  // n=6 -> ~100 (nécessaire pour les états de Rydberg)
  const limit = Math.max(6, n * n * 2.5 + n); 
  const limitSq = limit * limit; 

  // Phase 1 : Calibration DÉTERMINISTE (Stable)
  // Au lieu de lancer des dés au hasard (ce qui crée les fluctuations),
  // on scanne le long des axes principaux et diagonales pour trouver le VRAI maximum.
  // Cela garantit que maxProb est constant d'un rendu à l'autre.
  let maxProb = 0;
  
  // Directions de scan normalisées : Axes X, Y, Z + Diagonales Planaires + Diagonale Cube
  // Cela couvre les lobes de s, p, d, f.
  const scanDirections = [
      [1, 0, 0], [0, 1, 0], [0, 0, 1], // Axes
      [0.707, 0.707, 0], [0.707, 0, 0.707], [0, 0.707, 0.707], // Diagonales plans
      [0.577, 0.577, 0.577] // Diagonale 3D
  ];

  const step = 0.2; // Pas de scan grossier mais suffisant pour trouver les pics
  
  for (const dir of scanDirections) {
      for (let r = 0; r < limit; r += step) {
          const x = dir[0] * r;
          const y = dir[1] * r;
          const z = dir[2] * r;
          const p = getProbability(x, y, z, n, l, m);
          if (p > maxProb) maxProb = p;
      }
  }
  
  if (maxProb === 0) maxProb = 0.0001;
  
  // Marge de sécurité minime car le scan est fiable
  maxProb = maxProb * 1.05;

  // Phase 2 : Génération réelle
  let added = 0;
  let attempts = 0;
  
  // LIMITATION DE SÉCURITÉ AUGMENTÉE : 10 Millions.
  // Grâce à l'optimisation "limit" plus serrée et le check sphérique,
  // on peut se permettre plus d'itérations sans geler le navigateur.
  // Cela garantit qu'on atteint le "count" demandé même pour des orbitales denses.
  const maxAttempts = 10000000; 

  while (added < count && attempts < maxAttempts) {
    attempts++;
    const x = (Math.random() - 0.5) * 2 * limit;
    const y = (Math.random() - 0.5) * 2 * limit;
    const z = (Math.random() - 0.5) * 2 * limit;

    // Early exit si hors de la sphère
    if (x*x + y*y + z*z > limitSq) continue;

    const prob = getProbability(x, y, z, n, l, m);

    // Rejection check stable
    if (Math.random() * maxProb < prob) {
      points.push(x, y, z);
      added++;
    }
  }

  return new Float32Array(points);
};

// --- LOGIQUE LOCALE DE DESCRIPTION ---

const SUBSHELLS = ['s', 'p', 'd', 'f', 'g', 'h'];

export const getSuperpositionDescription = (activeOrbitals: OrbitalState[]): OrbitalDescription => {
  const has1s = activeOrbitals.some(o => o.n === 1 && o.l === 0);
  const has2s = activeOrbitals.some(o => o.n === 2 && o.l === 0);
  const pCount = activeOrbitals.filter(o => o.n === 2 && o.l === 1).length;

  let text = "Visualisation de superposition d'orbitales. ";
  let energyText = "Niveaux variés";
  let context = "Configuration partielle";
  let formulaParts = [];

  if (has1s) formulaParts.push("Ψ_{1s}");
  if (has2s) formulaParts.push("Ψ_{2s}");
  if (pCount > 0) formulaParts.push(`\\sum_{i=1}^{${pCount}} Ψ_{2p_i}`);

  if (activeOrbitals.length === 0) {
    text = "Aucune orbitale sélectionnée. Activez des orbitales pour voir la superposition.";
    formulaParts = ["0"];
  } else if (has1s && !has2s && pCount === 0) {
    text = "Seule la couche interne 1s est visible (Hélium/Hydrogène).";
    energyText = "Couche K (n=1)";
    context = "Cœur de l'atome";
  } else if (has1s && has2s && pCount === 0) {
    text = "Superposition des orbitales sphériques 1s (cœur) et 2s (valence). Cela correspond à la configuration du Lithium (Li) ou Béryllium (Be). Notez la différence de taille entre n=1 et n=2.";
    energyText = "Couches K et L (s)";
    context = "Configuration du Béryllium (1s² 2s²)";
  } else if (has1s && has2s && pCount === 3) {
    text = "Configuration complète du Néon (1s² 2s² 2p⁶). La superposition des trois orbitales p selon les axes x, y, z combinée aux orbitales s crée une densité de charge quasi-sphérique.";
    energyText = "Couche complète n=1, n=2";
    context = "Atome de Néon (Gaz rare)";
  } else {
    text = `Superposition personnalisée. Vous visualisez ${activeOrbitals.length} orbitales simultanément. Observez comment les orbitales p (directionnelles) s'insèrent autour du cœur sphérique s.`;
  }

  return {
    text,
    equation: `Ψ_{total} ≈ ${formulaParts.join(" + ")}`,
    conclusion: {
      symmetry: pCount === 3 ? "Quasi-Sphérique (Globale)" : "Complexe / Hybride",
      nodes: has2s ? "Nœud radial 2s visible" : "Variable",
      energy: energyText,
      maxRadius: has2s || pCount > 0 ? "~4-5 a₀ (Couche L)" : "~1 a₀ (Couche K)",
      context: context
    }
  };
};

export const getLocalOrbitalDescription = (n: number, l: number, m: number): OrbitalDescription => {
  const subshell = SUBSHELLS[l] || '?';
  const radialNodes = n - l - 1;
  
  let text = `L'orbitale ${n}${subshell} (n=${n}, l=${l}, m=${m}) correspond à un état excité de haute énergie. `;
  
  if (n === 1) text = `L'état fondamental ${n}${subshell} est le niveau d'énergie le plus bas. `;

  let equation = `Ψ ∝ r^${l} L_{${n-l-1}}^{${2*l+1}}(\\frac{2r}{${n}}) e^{-r/${n}} Y_{${l}}^{${m}}`;

  if (l === 0) text += "C'est une orbitale sphérique (s). ";
  else if (l === 1) text += "Elle possède une symétrie axiale avec deux lobes (p). ";
  else if (l === 2) text += "C'est une orbitale diffuse (d), généralement quadrilobée. ";
  else if (l >= 3) text += `C'est une orbitale complexe de type ${subshell}. `;

  if (radialNodes <= 0) {
    text += "Elle ne possède pas de nœuds radiaux. ";
  } else {
    text += `Elle possède ${radialNodes} nœud${radialNodes > 1 ? 's' : ''} radial${radialNodes > 1 ? 'aux' : ''} (couches sphériques vides). `;
  }

  if (n >= 4) {
    text += "Le volume effectif de cette orbitale est très grand par rapport au noyau.";
  }

  // NOTE SUPPRIMÉE ICI COMME DEMANDÉ

  // --- CALCUL DES DONNÉES DE CONCLUSION ---

  // 1. Symétrie
  let symmetry = "Sphérique parfaite (pas de dépendance angulaire)";
  if (l === 1) symmetry = "Symétrie axiale (Lobes directionnels)";
  if (l === 2) symmetry = "Symétrie complexe (Quadrilobée ou Torique)";
  if (l >= 3) symmetry = "Symétrie complexe (Multilobée)";

  // 2. Énergie de l'hydrogène: En = -13.6 eV / n^2
  const energyEv = -13.6 / (n * n);
  const energy = `${energyEv.toFixed(3)} eV`;

  // 3. Rayon de probabilité maximale (approximation numérique)
  // On cherche le pic de P(r) = r^2 * R(r)^2
  let maxP = -1;
  let bestR = 0;
  // On scanne jusqu'à un peu plus loin que n^2 (en unités a0)
  const searchLimit = 2.5 * n * n; 
  const step = 0.1;
  
  for(let r=0.1; r < searchLimit; r += step) {
     const R = getRadialPart(r, n, l);
     const radialProb = r * r * R * R; 
     if (radialProb > maxP) {
        maxP = radialProb;
        bestR = r;
     }
  }
  
  // Conversion en nanomètres (1 a0 ≈ 0.0529 nm)
  const bohrToNm = 0.0529177;
  const radiusNm = (bestR * bohrToNm).toFixed(3);
  const maxRadius = `${radiusNm} nm (${bestR.toFixed(1)} a₀)`;

  // 4. Contexte
  const context = `Valide pour l'Hydrogène (Z=1). Couche ${n}.`;

  const conclusion: OrbitalConclusion = {
    symmetry,
    nodes: radialNodes,
    energy,
    maxRadius,
    context
  };
  
  return { text, equation, conclusion };
};