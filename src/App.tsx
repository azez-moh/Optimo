import { lazy, Suspense, type ComponentType } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Shell } from './layout/Shell';
import { RequireAuth, RequirePage, useAuth } from './layout/auth';
import { homeFor } from './layout/access';
import { RequireGym } from './layout/filters';
import { ComingNext } from './components';
import SignInPage from './pages/SignIn';
import { BMS_PAGES, CHAIN_PAGES, VISION_PAGES, isGymPage } from './layout/nav';

/*
  Routes: /signin (public), then one route per dashboard page inside the shell (ids from src/layout/nav.ts).
  Pages are lazy-loaded from src/pages/<Folder>/index.tsx. The Kingdom map lives inside Branches
  (/branches?view=map); /map redirects there and keeps its region/district/club query.
  BMS Core and AI Vision pages are gym level: opened at network scope they switch to the live gym first.
  Settings has nested routes /settings/<slug> for the Build 8.7 "More pages".
  Every route is guarded by role (src/layout/access.ts): a page the role may not open redirects to its home.
*/

const modules = import.meta.glob<{ default: ComponentType }>('./pages/*/index.tsx');
const lazyPage = (folder: string, key: string) => {
  const load = modules[`./pages/${folder}/index.tsx`] as (() => Promise<{ default: ComponentType }>) | undefined;
  // A page folder that is not there yet renders the shared placeholder instead of breaking the app.
  if (!load) return function Pending() { return <ComingNext titleKey={`nav.${key}`} />; };
  return lazy(load);
};

const SettingsPage = lazyPage('Settings', 'settings');
const MorePageView = lazy(() => import('./pages/Settings').then((m) => ({ default: (m as unknown as { MorePageView: ComponentType }).MorePageView })));

const DASH = [...CHAIN_PAGES, ...BMS_PAGES, ...VISION_PAGES].map((p) => ({ ...p, Component: lazyPage(p.folder, p.key) }));

/** "/" goes to the role's home: Branches on the map for the COO, the gym overview for the Facility Manager. */
function Home() {
  const { user } = useAuth();
  return <Navigate to={homeFor(user?.role ?? 'coo')} replace />;
}

/** Old Kingdom map route: Branches, map view, same drill-down query (?region=&district=&club=). */
function MapRedirect() {
  const { search } = useLocation();
  const p = new URLSearchParams(search);
  p.delete('view');
  const rest = p.toString();
  return <Navigate to={`/branches?view=map${rest ? `&${rest}` : ''}`} replace />;
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
          <Route element={<RequireAuth><Shell /></RequireAuth>}>
            <Route index element={<Home />} />
            <Route path="map" element={<RequirePage id="map"><MapRedirect /></RequirePage>} />
            {DASH.map(({ id, Component }) => {
              const page = <Suspense fallback={<Loading />}><Component /></Suspense>;
              return (
                <Route key={id} path={id} element={
                  <RequirePage id={id}>{isGymPage(id) ? <RequireGym fallback={<Loading />}>{page}</RequireGym> : page}</RequirePage>
                } />
              );
            })}
            <Route path="settings" element={<RequirePage id="settings"><Suspense fallback={<Loading />}><SettingsPage /></Suspense></RequirePage>} />
            <Route path="settings/:slug" element={<RequirePage id="settings"><Suspense fallback={<Loading />}><MorePageView /></Suspense></RequirePage>} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
