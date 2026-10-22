import type { AcLive, Area, Club, Integration } from '../../data/types';
import type { AcRow, LightRow } from '../../data/selectors';
import { localParts } from '../../data/time';

/*
  Local BMS helpers shared by BMS Overview, HVAC, Lights and AI Agents (all owned by the same page agent).
  They derive everything from the shared demo store; nothing here is a new data source.
*/

export type UnitStatus = 'on' | 'off' | 'watch' | 'alarm';

/** Status of one air-conditioning unit from its live reading against its setpoint. */
export function acStatus(l: AcLive | undefined): UnitStatus {
  if (!l || !l.on) return 'off';
  const over = l.reading - l.setpoint;
  if (l.reading >= 45 || over >= 3) return 'alarm';
  if (over >= 1.5) return 'watch';
  return 'on';
}

export const STATUS_RANK: Record<UnitStatus, number> = { alarm: 0, watch: 1, on: 2, off: 3 };

/** Floor index of an area (0 = ground floor, 1 = first floor), from its floor name. */
export function floorIndex(a: Pick<Area, 'floorEn'> | undefined): number {
  if (!a) return 0;
  return /first/i.test(a.floorEn) ? 1 : /basement/i.test(a.floorEn) ? -1 : 0;
}

export interface FloorDef { index: number; nameEn: string; nameAr: string }

export function floorsOf(areas: Area[]): FloorDef[] {
  const map = new Map<number, FloorDef>();
  for (const a of areas) {
    const i = floorIndex(a);
    if (!map.has(i)) map.set(i, { index: i, nameEn: a.floorEn, nameAr: a.floorAr });
  }
  return [...map.values()].sort((x, y) => x.index - y.index);
}

/** Footprint of the procedural building in metres (Live Floor slab is about 30.6 x 16 m). */
export const BUILDING = { w: 30, d: 16, floorH: 4.2 };

/** Rectangle of each area on its floor, in metres from the north-west corner: [x, z, w, d]. */
const LAYOUT: Record<string, [number, number, number, number]> = {
  cardio: [0, 0, 12, 9],
  weights: [12, 0, 12, 9],
  strength: [24, 0, 6, 9],
  lockers: [0, 9, 10, 7],
  reception: [10, 9, 12, 7],
  staff: [22, 9, 8, 7],
  studio1: [0, 0, 15, 10],
  studio2: [15, 0, 15, 10],
};

export function areaKey(a: Area): string {
  return a.id.slice(a.id.lastIndexOf(':') + 1);
}

/** Rectangle for an area; unknown areas are laid out in a simple grid on their floor. */
export function areaRect(a: Area, indexOnFloor: number): [number, number, number, number] {
  const r = LAYOUT[areaKey(a)];
  if (r) return r;
  const col = indexOnFloor % 4;
  const row = Math.floor(indexOnFloor / 4);
  return [col * 7.5, row * 8, 7.5, 8];
}

/** "LG AC controller 2, unit 5": the integration point that feeds a unit (unit n of its controller). */
export function linkedEntity(unitIndex: number, integrations: Integration[]): { integration?: Integration; point: number } {
  const bac = integrations.filter((i) => i.kind === 'bacnet');
  if (!bac.length) return { point: unitIndex + 1 };
  const per = Math.max(1, Math.ceil(bac[0].covers || 1));
  const k = Math.min(bac.length - 1, Math.floor(unitIndex / per));
  return { integration: bac[k], point: (unitIndex % per) + 1 };
}

/** Riyadh clock time "20:45" or "20:45:13" for an instant (all times show in Asia/Riyadh). */
export function riyadhClock(ms: number, seconds = false): string {
  const p = localParts(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return seconds ? `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}` : `${pad(p.hour)}:${pad(p.minute)}`;
}

export function avg(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

/** Mean reading of the units in an area (units that are on first, otherwise all). */
export function areaTemperature(units: AcRow[]): number | undefined {
  const on = units.filter((u) => u.live?.on);
  const src = on.length ? on : units;
  if (!src.length) return undefined;
  return Math.round(avg(src.map((u) => u.live?.reading ?? 0)) * 10) / 10;
}

/** Worst status among the units of an area. */
export function areaStatus(units: AcRow[], lights: LightRow[]): UnitStatus {
  let best: UnitStatus = 'off';
  for (const u of units) {
    const s = acStatus(u.live);
    if (STATUS_RANK[s] < STATUS_RANK[best]) best = s;
  }
  if (best === 'off' && lights.some((l) => l.live?.on)) best = 'on';
  return best;
}

/** Floor count label helper data. */
export function buildingFacts(club: Club, areas: Area[]) {
  return { name: club, floors: floorsOf(areas).length };
}
