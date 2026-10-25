import { MapExplorer } from './MapExplorer';

/**
 * Kingdom map page (/map, first item of the left menu): the drill-down Kingdom, region, district and gym fact card,
 * with the "All branches" row first above the regions. The drill-down itself is MapExplorer (./MapExplorer.tsx).
 */
export { MapExplorer } from './MapExplorer';

export default function MapPage() {
  return (
    <div className="page mappage">
      <MapExplorer />
    </div>
  );
}
