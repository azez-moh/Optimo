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
| `src/layout/Shell.tsx` | App shell, two levels. Network level (All branches): top bar only (logo, branch switcher, centre menu Overview / Ask OPTIMO / Branches, alerts, theme, language, user, sign out, Settings gear), no left menu. Branch level (one gym): centre menu "← Overview" / Branch overview / Ask OPTIMO / Branches and a left menu with Branch settings, BMS Core (7) and AI Vision (13). Facility Manager: Branch overview / Ask OPTIMO and his allowed pages |
| `src/pages/Map/` | Kingdom map (`/map`): in no menu, the COO lands on it after sign-in; "All branches" opens the network Overview, a gym opens its Branch overview |
| `src/pages/Overview/` | Network "Overview" (`/overview`): always all branches, opening it sets the scope to All branches ("← Overview" at branch level comes back here). The Facility Manager is forwarded to Branch overview |
| `src/pages/Branch/` | Branch overview (`/branch`, top menu at branch level): the selected gym's overview (same component as Overview in branch mode); for the Facility Manager his gym page (`Overview/Fm.tsx`) |
| `src/pages/BranchSettings/` | Branch settings (`/branch-settings`): gym details, floor areas and capacity, operating hours, alert thresholds, integrations |
| `src/data/branchConfig.ts` | Per-gym capacity and thresholds saved on Branch settings, read by the Heatmap, floor plans and recommendations |
| `src/pages/VisionOverview/` | AI Vision overview (`/vision-overview`), first page of AI Vision, one view without scrolling |
| `src/layout/nav.ts` | Menu order, routes and labels (single source): `NETWORK_TOP`, `BRANCH_TOP`, `SIDE_PAGES`, BMS Core and AI Vision groups |
| `src/layout/access.ts` | Which pages each role can open, home after sign-in, and `navLevel` (network or branch) |
| `src/layout/auth.tsx` | Demo sign-in and roles (COO, Facility Manager) |
| `src/data/` | Generated demo data: gyms (`clubs.ts`), machines and demand (`fleet.ts`, `build.ts`), live ticking (`dynamics.ts`), selectors |
| `src/pages/<Page>/` | One folder per page (`Branches/` is the gym list) |
| `src/pages/Overview/insights.ts` | Recommended actions (move, buy, retire, service, energy, crowding) |
| `src/pages/Assistant/` | Ask OPTIMO chat (built-in answers, optional Claude mode with a key kept in the browser) |
| `src/three/` | Procedural 3D machine models and GLB export |
| `src/i18n/` | English and Arabic strings (`pages/<page>.ts` per page) |
| `src/theme/` | Brand tokens (light and dark) |

## Notes

- Data is illustrative. OPTIMO Al Malqa (Men) follows a snapshot of the live AI Vision figures; everything else is generated deterministically.
- To add a gym, add a seed in `src/data/clubs.ts`. To add a page, add it to `nav.ts` and `access.ts` and create its folder and i18n file.
- No API keys are stored in this repository.
