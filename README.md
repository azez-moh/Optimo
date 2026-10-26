# OPTIMO Operations Centre (demo)

A standalone, bilingual (English and Arabic) demo of Primewave's Conductor for Sites for OPTIMO gyms. It is a front end only: every figure is generated in the browser, and it connects to no production system.

- Live demo: https://azez-moh.github.io/optimo-demo/
- Preview of changes awaiting approval: https://azez-moh.github.io/optimo-demo/preview/

## Run it locally

Requirements: Node.js 20 or newer.

```bash
git clone https://github.com/azez-moh/Optimo.git
cd Optimo
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173), then click "Sign in". No password is used. Pick COO (all gyms) or Facility Manager (OPTIMO Al Malqa only).

Other commands:

| Command | What it does |
|---|---|
| `npm run build` | Type check and build the site into `dist/` |
| `npm run build:single` | Build one self-contained HTML file into `dist-single/index.html` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run typecheck` | Type check only |
| `node scripts/shoot.mjs <label> <routes>` | QA screenshots (EN/AR, light/dark, 1440/390) into `qa/<label>/` |
| `node scripts/check-ai-agents.mjs [--route=vision-overview]` | One-view (no scroll) check of AI Agents or AI Vision overview |

## Stack

React 18, TypeScript, Vite 5, React Router (hash routes, one per page), Leaflet (map), Recharts (charts), three.js with React Three Fiber (3D Live Floor and machine library), lucide-react icons, Fontsource fonts.

## Where things are

| Path | Contents |
|---|---|
| `src/layout/Shell.tsx` | Top bar (logo, branch switcher, centre menu Overview / Ask OPTIMO / Branches, Settings gear) and the left menu (Map; once a gym is picked Branch overview, Branch settings, then the gym's BMS Core and AI Vision groups) |
| `src/pages/Overview/` | Top "Overview" (`/overview`): always all branches, opening it sets the scope to All branches (the Facility Manager sees his gym, `Fm.tsx`) |
| `src/pages/Branch/` | Branch overview (`/branch`): the selected gym's overview (same component as Overview in branch mode) |
| `src/pages/BranchSettings/` | Branch settings (`/branch-settings`): gym details, floor areas and capacity, operating hours, alert thresholds, integrations |
| `src/data/branchConfig.ts` | Per-gym capacity and thresholds saved on Branch settings, read by the Heatmap, floor plans and recommendations |
| `src/pages/VisionOverview/` | AI Vision overview (`/vision-overview`), first page of AI Vision, one view without scrolling |
| `src/layout/nav.ts` | Menu order, routes and labels (single source) |
| `src/layout/access.ts` | Which pages each role can open |
| `src/layout/auth.tsx` | Demo sign-in and roles (COO, Facility Manager) |
| `src/data/` | Generated demo data: gyms (`clubs.ts`), machines and demand (`fleet.ts`, `build.ts`), live ticking (`dynamics.ts`), selectors |
| `src/pages/<Page>/` | One folder per page (`Map/` is the Kingdom map at `/map`, `Branches/` the gym list) |
| `src/pages/Overview/insights.ts` | Recommended actions (move, buy, retire, service, energy, crowding) |
| `src/pages/Assistant/` | Ask OPTIMO chat (built-in answers, optional Claude mode with a key kept in the browser) |
| `src/three/` | Procedural 3D machine models and GLB export |
| `src/i18n/` | English and Arabic strings (`pages/<page>.ts` per page) |
| `src/theme/` | Brand tokens (light and dark) |

## Notes

- Data is illustrative. OPTIMO Al Malqa (Men) follows a snapshot of the live AI Vision figures; everything else is generated deterministically.
- To add a gym, add a seed in `src/data/clubs.ts`. To add a page, add it to `nav.ts` and `access.ts` and create its folder and i18n file.
- No API keys are stored in this repository.
