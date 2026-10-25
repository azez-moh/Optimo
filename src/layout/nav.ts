import {
  Activity, AirVent, BarChart3, Bot, Building2, Camera, Cctv, Cpu, Dumbbell, FileBarChart, Flame, Gauge, Grid3x3, LayoutDashboard,
  Library, Lightbulb, ListVideo, Map as MapIcon, MessageCircle, PlugZap, Radar, ScanEye, Settings, Settings2, SlidersHorizontal, Store, type LucideIcon,
} from 'lucide-react';

/**
 * One source of truth for the dashboard pages: menu order (Build 8.7), route path and i18n key.
 * Navigation (src/layout/Shell.tsx):
 *   top centre menu, always the same: CHAIN_PAGES (Overview, Ask OPTIMO, Branches);
 *   left menu: MAP_PAGE always, plus the BMS Core and AI Vision groups when one gym is picked;
 *   Settings is the gear icon in the top bar corner.
 * Route path = `/${id}`. Label = t(`nav.${key}`), tooltip = t(`nav.about.${key}`).
 * Page folders: src/pages/<folder>/index.tsx (lazy-loaded in src/App.tsx).
 */
export type NavGroup = 'chain' | 'bms' | 'vision';

export interface PageDef {
  id: string;
  key: string;
  folder: string;
  group: NavGroup;
  icon: LucideIcon;
}

export const CHAIN_PAGES: PageDef[] = [
  { id: 'overview', key: 'overview', folder: 'Overview', group: 'chain', icon: LayoutDashboard },
  { id: 'assistant', key: 'assistant', folder: 'Assistant', group: 'chain', icon: MessageCircle },
  { id: 'branches', key: 'branches', folder: 'Branches', group: 'chain', icon: Store },
];

/** Kingdom map drill-down, always first in the left menu. */
export const MAP_PAGE: PageDef = { id: 'map', key: 'map', folder: 'Map', group: 'chain', icon: MapIcon };

export const BMS_PAGES: PageDef[] = [
  { id: 'bms-overview', key: 'bmsOverview', folder: 'BmsOverview', group: 'bms', icon: Building2 },
  { id: 'hvac', key: 'hvac', folder: 'Hvac', group: 'bms', icon: AirVent },
  { id: 'lights', key: 'lights', folder: 'Lights', group: 'bms', icon: Lightbulb },
  { id: 'ai-agents', key: 'aiAgents', folder: 'AiAgents', group: 'bms', icon: Bot },
  { id: 'control', key: 'control', folder: 'Control', group: 'bms', icon: SlidersHorizontal },
  { id: 'bms-settings', key: 'bmsSettings', folder: 'BmsSettings', group: 'bms', icon: Settings2 },
  { id: 'integration', key: 'integration', folder: 'Integration', group: 'bms', icon: PlugZap },
];

export const VISION_PAGES: PageDef[] = [
  { id: 'monitor', key: 'monitor', folder: 'Monitor', group: 'vision', icon: ScanEye },
  { id: 'live-floor', key: 'liveFloor', folder: 'LiveFloor', group: 'vision', icon: Grid3x3 },
  { id: 'heatmap', key: 'heatmap', folder: 'Heatmap', group: 'vision', icon: Flame },
  { id: 'cameras', key: 'cameras', folder: 'Cameras', group: 'vision', icon: Cctv },
  { id: 'camera-list', key: 'cameraList', folder: 'CameraList', group: 'vision', icon: ListVideo },
  { id: 'zones', key: 'zones', folder: 'Zones', group: 'vision', icon: Radar },
  { id: 'zones-live', key: 'zonesLive', folder: 'ZonesLive', group: 'vision', icon: Activity },
  { id: 'reports', key: 'reports', folder: 'Reports', group: 'vision', icon: FileBarChart },
  { id: 'machine-library', key: 'machineLibrary', folder: 'MachineLibrary', group: 'vision', icon: Library },
  { id: 'machines', key: 'machines', folder: 'Machines', group: 'vision', icon: Dumbbell },
  { id: 'usage-report', key: 'usageReport', folder: 'UsageReport', group: 'vision', icon: BarChart3 },
  { id: 'library-management', key: 'libraryManagement', folder: 'LibraryManagement', group: 'vision', icon: Cpu },
];

export const SETTINGS_PAGE: PageDef = { id: 'settings', key: 'settings', folder: 'Settings', group: 'chain', icon: Settings };

export const ALL_PAGES: PageDef[] = [...CHAIN_PAGES, MAP_PAGE, SETTINGS_PAGE, ...BMS_PAGES, ...VISION_PAGES];

export function pageById(id: string): PageDef | undefined {
  return ALL_PAGES.find((p) => p.id === id);
}

/** Pages that belong to one gym (BMS Core and AI Vision). Opened at network scope they switch to the live gym. */
export const GYM_PAGES: PageDef[] = [...BMS_PAGES, ...VISION_PAGES];
export const isGymPage = (id: string) => GYM_PAGES.some((p) => p.id === id);

/** Camera icon re-export for pages that want the same glyph as the sidebar. */
export { Camera, Gauge };
