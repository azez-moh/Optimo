import { lazy, Suspense, type ComponentType } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './layout/Shell';
import { RequireAuth } from './layout/auth';
import SignInPage from './pages/SignIn';
import { BMS_PAGES, CHAIN_PAGES, VISION_PAGES } from './layout/nav';

/*
  Routes: /signin (public), /map (full page, outside the shell), then one route per dashboard page
  inside the shell (ids from src/layout/nav.ts). Pages are lazy-loaded from src/pages/<Folder>/index.tsx.
  Settings has nested routes /settings/<slug> for the Build 8.7 "More pages".
*/

const modules = import.meta.glob<{ default: ComponentType }>('./pages/*/index.tsx');
const lazyPage = (folder: string) => lazy(modules[`./pages/${folder}/index.tsx`] as () => Promise<{ default: ComponentType }>);

const MapPage = lazyPage('Map');
const SettingsPage = lazyPage('Settings');
const MorePageView = lazy(() => import('./pages/Settings').then((m) => ({ default: (m as unknown as { MorePageView: ComponentType }).MorePageView })));

const DASH = [...CHAIN_PAGES, ...BMS_PAGES, ...VISION_PAGES].map((p) => ({ ...p, Component: lazyPage(p.folder) }));

function Loading() {
  return <div className="page-loading" aria-busy="true" />;
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="signin" element={<SignInPage />} />
          <Route path="map" element={<RequireAuth><MapPage /></RequireAuth>} />
          <Route element={<RequireAuth><Shell /></RequireAuth>}>
            <Route index element={<Navigate to="/map" replace />} />
            {DASH.map(({ id, Component }) => <Route key={id} path={id} element={<Suspense fallback={<Loading />}><Component /></Suspense>} />)}
            <Route path="settings" element={<Suspense fallback={<Loading />}><SettingsPage /></Suspense>} />
            <Route path="settings/:slug" element={<Suspense fallback={<Loading />}><MorePageView /></Suspense>} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
