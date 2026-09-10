<div align="center">

# AtomViz

**Visualiseur 3D interactif d'orbitales atomiques**

</div>

AtomViz est une application web React qui génère et affiche en temps réel un nuage de points 3D représentant la densité de probabilité électronique des orbitales atomiques (fonctions d'onde ψ calculées à partir des nombres quantiques n, l, m).

## ✨ Fonctionnalités

- **Mode orbitale unique** — Sélectionnez les nombres quantiques (n, l, m) pour visualiser n'importe quelle orbitale (1s, 2p, 3d, 4f, …) avec sa miniature schématique.
- **Mode superposition** — Combinez plusieurs orbitales (configuration type Néon : 1s, 2s, 2p<sub>x</sub>, 2p<sub>y</sub>, 2p<sub>z</sub>) pour visualiser la structure électronique d'un atome.
- **Rendu 3D interactif** — Nuage de points Three.js avec orbitation à la souris/tactile, rotation automatique et densité de points réglable (jusqu'à plusieurs dizaines de milliers de points).
- **Descriptions physiques locales** — Forme, nœuds, symétrie, énergie et équation simplifiée de la fonction d'onde, calculés directement dans l'application (`utils/physics.ts`), sans connexion requise.
- **Responsive / PWA** — Sidebar coulissante sur mobile (gestes de swipe), manifest web et icônes incluses.

## 🚀 Démarrage rapide

**Prérequis :** [Node.js](https://nodejs.org) (version 18 ou supérieure recommandée)

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev
```

L'application est disponible sur **http://localhost:5173** (l'URL exacte est affichée dans le terminal).

## 📜 Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Lance le serveur de développement Vite (hot reload) |
| `npm run build` | Compile l'application pour la production (dossier `dist/`) |
| `npm run preview` | Prévisualise le build de production localement |

## 🏗️ Architecture du projet

```
atomviz/
├── index.html                  # Point d'entrée HTML
├── index.tsx                   # Bootstrap React
├── App.tsx                     # Composant racine (modes, états, sidebar)
├── types.ts                    # Types partagés (OrbitalState, descriptions)
├── components/
│   ├── OrbitalViewer.tsx       # Canvas 3D Three.js (nuage de points)
│   ├── Controls.tsx            # Sidebar de contrôle (n, l, m, superposition…)
│   ├── SchematicThumbnail.tsx  # Miniature schématique 2D de l'orbitale
│   └── SimpleOrbitControls.tsx # Contrôles d'orbitation caméra
├── utils/
│   └── physics.ts              # Calculs des fonctions d'onde et descriptions
├── public/                     # Icônes PWA et manifest
└── vite.config.ts              # Configuration Vite
```

### Stack technique

- **[React](https://react.dev) 19** — Interface utilisateur
- **[Three.js](https://threejs.org) / [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) / drei** — Rendu 3D du nuage de points et gestion de la caméra
- **[Vite](https://vitejs.dev)** — Build et serveur de développement
- **[Tailwind CSS](https://tailwindcss.com)** — Styles (thème sombre)
- **[lucide-react](https://lucide.dev)** — Icônes