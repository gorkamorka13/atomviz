<div align="center">

# AtomViz

**Visualiseur 3D interactif d'orbitales atomiques**

</div>

AtomViz est une application web React qui génère et affiche en temps réel un nuage de points 3D représentant la densité de probabilité électronique des orbitales atomiques (fonctions d'onde ψ calculées à partir des nombres quantiques n, l, m).

## ✨ Fonctionnalités

- **Mode orbitale unique** — Sélectionnez les nombres quantiques (n, l, m) pour visualiser n'importe quelle orbitale (1s, 2p, 3d, 4f, …) avec sa miniature schématique.
- **Mode superposition** — Combinez plusieurs orbitales (configuration type Néon : 1s, 2s, 2p<sub>x</sub>, 2p<sub>y</sub>, 2p<sub>z</sub>) pour visualiser la structure électronique d'un atome.
- **Rendu 3D interactif** — Nuage de points Three.js avec orbitation à la souris/tactile, rotation automatique et densité de points réglable (jusqu'à plusieurs dizaines de milliers de points).
- **Descriptions physiques locales** — Forme, nœuds, symétrie, énergie et équation simplifiée de la fonction d'onde calculés localement (`utils/physics.ts`), sans connexion requise.
- **Description IA (optionnel)** — Explication pédagogique enrichie générée par l'API Gemini (`gemini-2.5-flash`), avec repli automatique sur la description locale en cas d'erreur.
- **Responsive / PWA** — Sidebar coulissante sur mobile (gestes de swipe), manifest web et icônes incluses.

## 🚀 Démarrage rapide

**Prérequis :** [Node.js](https://nodejs.org) (version 18 ou supérieure recommandée)

```bash
# 1. Installer les dépendances
npm install

# 2. (Optionnel) Configurer la clé API Gemini
#    Créez un fichier .env.local à la racine :
echo "API_KEY=votre_cle_gemini" > .env.local

# 3. Lancer le serveur de développement
npm run dev
```

L'application est disponible sur **http://localhost:5173** (l'URL exacte est affichée dans le terminal).

> 💡 La clé API n'est **pas obligatoire** : les descriptions physiques calculées localement fonctionnent sans elle. Elle n'est nécessaire que pour les explications générées par l'IA.

### Obtenir une clé API Gemini

1. Rendez-vous sur [Google AI Studio](https://aistudio.google.com/apikey)
2. Créez une clé API gratuite
3. Ajoutez-la dans un fichier `.env.local` à la racine du projet :

```env
API_KEY=votre_cle_gemini
```

> ⚠️ Le nom de la variable doit être `API_KEY` : le code lit `process.env.API_KEY` et la configuration Vite injecte les variables d'environnement dans le bundle (cf. `vite.config.ts`).

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
├── services/
│   └── geminiService.ts        # Appel API Gemini (description IA)
├── utils/
│   └── physics.ts              # Calculs des fonctions d'onde et descriptions locales
├── public/                     # Icônes PWA et manifest
└── vite.config.ts              # Configuration Vite (polyfill process.env)
```

### Stack technique

- **[React](https://react.dev) 19** — Interface utilisateur
- **[Three.js](https://threejs.org) / [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) / drei** — Rendu 3D du nuage de points et gestion de la caméra
- **[Vite](https://vitejs.dev)** — Build et serveur de développement
- **[Tailwind CSS](https://tailwindcss.com)** — Styles (thème sombre)
- **[lucide-react](https://lucide.dev)** — Icônes
- **[@google/genai](https://www.npmjs.com/package/@google/genai)** — SDK API Gemini

## 🔒 Sécurité

Ne commitez jamais votre clé API. Le fichier `.env.local` est exclu du suivi Git via `.gitignore`. Notez toutefois que les variables injectées par Vite sont embarquées dans le bundle côté client : pour un déploiement public, préférez un proxy serveur pour protéger votre clé.
