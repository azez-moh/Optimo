import { Navigate, useLocation } from 'react-router-dom';

/**
 * The Kingdom map now lives inside Branches (Map view). The drill-down itself is MapExplorer (./MapExplorer.tsx);
 * this default export only forwards an old /map link to /branches?view=map with the same query.
 */
export { MapExplorer } from './MapExplorer';

export default function MapPage() {
  const { search } = useLocation();
  const p = new URLSearchParams(search);
  p.delete('view');
  const rest = p.toString();
  return <Navigate to={`/branches?view=map${rest ? `&${rest}` : ''}`} replace />;
}
