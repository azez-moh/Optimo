import { lazy, Suspense, type ComponentType } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './layout/Shell';
import { RequireAuth, RequirePage, useAuth } from './layout/auth';
import { homeFor } from './layout/access';
import SignInPage from './pages/SignIn';
import { BMS_PAGES, CHAIN_PAGES, VISION_PAGES } from './layout/nav';

/*
  Routes: /signin (public), /map (full page, outside the shell), then one route per dashboard page
  inside the shell (ids from src/layout/nav.ts). Pages are lazy-loaded from src/pages/<Folder>/index.tsx.
  Settings has nested routes /settings/<slug> for the Build 8.7 "More pages".
  Every route is guarded by role (src/layout/access.ts): a page the role may not open redirects to its home.
*/

const modules = import.meta.glob<{ default: ComponentType }>('./pages/*/index.tsx');
const lazyPage = (folder: string) => lazy(modules[`./pages/${folder}/index.tsx`] as () => Promise<{ default: ComponentType }>);

const MapPage = lazyPage('Map');
const SettingsPage = lazyPage('Settings');
const MorePageView = lazy(() => import('./pages/Settings').then((m) => ({ default: (m as unknown as { MorePageView: ComponentType }).MorePageView })));

const DASH = [...CHAIN_PAGES, ...BMS_PAGES, ...VISION_PAGES].map((p) => ({ ...p, Component: lazyPage(p.folder) }));

/** "/" goes to the role's home: the Kingdom map for the COO, the gym overview for the Facility Manager. */
function Home() {
  const { user } = useAuth();
  return <Navigate to={homeFor(user?.role ?? 'coo')} replace />;
}

function Loading() {
  return <div className="page-loading" aria-busy="true" />;
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="signin" element={<SignInPage />} />
          <Route path="map" element={<RequireAuth><RequirePage id="map"><MapPage /></RequirePage></RequireAuth>} />
          <Route element={<RequireAuth><Shell /></RequireAuth>}>
            <Route index element={<Home />} />
            {DASH.map(({ id, Component }) => <Route key={id} path={id} element={<RequirePage id={id}><Suspense fallback={<Loading />}><Component /></Suspense></RequirePage>} />)}
            <Route path="settings" element={<RequirePage id="settings"><Suspense fallback={<Loading />}><SettingsPage /></Suspense></RequirePage>} />
            <Route path="settings/:slug" element={<RequirePage id="settings"><Suspense fallback={<Loading />}><MorePageView /></Suspense></RequirePage>} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
