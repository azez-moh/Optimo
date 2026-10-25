import type { Club, DemoContextValue, LiveData, StaticData } from './types';
import { LIVE_CLUB_ID } from './clubs';
import { FLOOR_SIZE_M } from './floorData';
import { buildLive, isOpenAt, machineLiveAt, peopleInAt } from './dynamics';
import { acOf, areasOf, presenceOf } from './selectors';
import { msAt } from './time';

/*
  Floor plans and crowd occupancy per area (Crowd heatmap page and the compact Overview card).

  ILLUSTRATIVE LAYOUT: the plans below are a believable 2D layout of OPTIMO Al Malqa (Men), built from the BMS
  areas in build.ts, to be replaced by the official floor plans when the client shares them. Units are metres,
  x to the east, y to the south, origin at the north-west corner of the building.
  - Ground floor: 64 x 42 m (2,688 m²). The cardio floor is the Live Floor slab (30.6 x 16 m).
  - First floor: 38 x 26 m (988 m²) over the west and south part, reached by the stairs and lift core.
  - Total about 3,676 m² over two floors (published gym area 3,700 m²).

  Occupancy uses the same model as every other page: people in the gym (data.live.clubs[id].peopleIn, the KPI on
  the Overview) x the area share (presenceOf in selectors.ts, used by BMS Overview, the FM overview, Control).
  The 15-minute replay applies the same formula to peopleInAt() at each step, so the last step equals the live value.
*/

export type FloorId = 'ground' | 'first';
export const FLOOR_IDS: FloorId[] = ['ground', 'first'];

/** Plan rectangles are [x, y, width, depth]; polygons are lists of [x, y] points. */
export type Pt = [number, number];

export interface PlanArea {
  /** Area key: monitored spaces match `${clubId}:${key}` in data.areas (build.ts AREA_TEMPLATE). */
  key: string;
  floor: FloorId;
  nameEn: string;
  nameAr: string;
  points: Pt[];
  /** Floor area from the plan, m². */
  m2: number;
  /** Comfortable capacity in people (most people the area holds without queues or crowding). Monitored areas only. */
  capacity: number;
  /** False for circulation and service spaces, which are not counted. */
  monitored: boolean;
  /** Label position when the centroid falls outside an L-shaped space. */
  labelAt?: Pt;
}

export interface FloorPlan {
  id: FloorId;
  nameEn: string;
  nameAr: string;
  /** Outline of the floor slab. */
  outline: Pt[];
  /** Outline of the floor below or the building footprint, drawn dashed for orientation (first floor only). */
  ghost?: Pt[];
  areas: PlanArea[];
  /** Entrance door on the outline: centre point and width along the wall (m). */
  entrance?: { at: Pt; width: number };
}

export interface GymPlan {
  clubId: string;
  /** Drawing extent shared by both floors so they print at the same scale. */
  width: number;
  depth: number;
  floors: FloorPlan[];
  /** Top-left corner of the Live Floor slab on the ground floor plan (Live Floor x, z map to plan x, y). */
  liveFloorOrigin: Pt;
}

const rect = (x: number, y: number, w: number, d: number): Pt[] => [[x, y], [x + w, y], [x + w, y + d], [x, y + d]];

/** Shoelace area of a polygon, m². */
export function polyArea(p: Pt[]): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

/** Area-weighted centroid of a polygon. */
export function polyCentroid(p: Pt[]): Pt {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    const f = x1 * y2 - x2 * y1;
    a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f;
  }
  a /= 2;
  return a ? [cx / (6 * a), cy / (6 * a)] : p[0];
}

/** Bounding box [minX, minY, maxX, maxY]. */
export function polyBox(p: Pt[]): [number, number, number, number] {
  const xs = p.map((q) => q[0]);
  const ys = p.map((q) => q[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/**
 * m² per person behind each comfortable capacity (assumption: the crowd level at which members start to wait
 * for machines or space, including circulation and clearances). Replace with the operator's own figures.
 */
const M2_PER_PERSON: Record<string, number> = {
  cardio: 14, weights: 22, strength: 22, lockers: 45, reception: 55, staff: 45, studio1: 30, studio2: 30,
};

type Seed = Omit<PlanArea, 'm2' | 'capacity'>;

function finish(a: Seed): PlanArea {
  const m2 = Math.round(polyArea(a.points) * 10) / 10;
  const per = M2_PER_PERSON[a.key];
  return { ...a, m2, capacity: a.monitored && per ? Math.max(2, Math.round(m2 / per)) : 0 };
}

const LIVE_W = FLOOR_SIZE_M.width; // 30.6
const LIVE_D = FLOOR_SIZE_M.depth; // 16

const GROUND: Seed[] = [
  { key: 'cardio', floor: 'ground', nameEn: 'Cardio floor', nameAr: 'صالة الكارديو', points: rect(0, 0, LIVE_W, LIVE_D), monitored: true },
  { key: 'weights', floor: 'ground', nameEn: 'Weights area', nameAr: 'منطقة الأوزان', points: rect(LIVE_W, 0, 64 - LIVE_W, 22), monitored: true },
  { key: 'strength', floor: 'ground', nameEn: 'Strength corner', nameAr: 'ركن القوة', points: rect(0, 16, 14, 16), monitored: true },
  { key: 'staff', floor: 'ground', nameEn: 'Staff area', nameAr: 'منطقة الموظفين', points: rect(0, 32, 14, 10), monitored: true },
  { key: 'reception', floor: 'ground', nameEn: 'Reception and lounge', nameAr: 'الاستقبال والاستراحة', points: rect(14, 26, 22, 16), monitored: true },
  { key: 'lockers', floor: 'ground', nameEn: 'Changing rooms', nameAr: 'غرف تبديل الملابس', points: rect(36, 26, 28, 16), monitored: true },
  { key: 'core', floor: 'ground', nameEn: 'Stairs and lift', nameAr: 'الدرج والمصعد', points: rect(22, 16, LIVE_W - 22, 6), monitored: false },
  {
    key: 'corridor', floor: 'ground', nameEn: 'Corridor', nameAr: 'الممر', monitored: false, labelAt: [47, 24],
    points: [[14, 16], [22, 16], [22, 22], [64, 22], [64, 26], [14, 26]],
  },
];

const FIRST: Seed[] = [
  { key: 'studio1', floor: 'first', nameEn: 'Studio 1', nameAr: 'الاستوديو 1', points: rect(0, 26, 18.5, 16), monitored: true },
  { key: 'studio2', floor: 'first', nameEn: 'Studio 2', nameAr: 'الاستوديو 2', points: rect(24.1, 26, 13.9, 16), monitored: true },
  { key: 'core-1', floor: 'first', nameEn: 'Stairs and lift', nameAr: 'الدرج والمصعد', points: rect(22, 16, LIVE_W - 22, 6), monitored: false },
  { key: 'wc-1', floor: 'first', nameEn: 'Toilets', nameAr: 'دورات المياه', points: rect(18.5, 30, 5.6, 12), monitored: false },
  {
    key: 'lounge-1', floor: 'first', nameEn: 'Corridor and lounge', nameAr: 'الممر والاستراحة', monitored: false, labelAt: [11, 21],
    points: [[0, 16], [22, 16], [22, 22], [LIVE_W, 22], [LIVE_W, 16], [38, 16], [38, 26], [24.1, 26], [24.1, 30], [18.5, 30], [18.5, 26], [0, 26]],
  },
];

const MALQA_PLAN: GymPlan = {
  clubId: LIVE_CLUB_ID,
  width: 64,
  depth: 42,
  liveFloorOrigin: [0, 0],
  floors: [
    {
      id: 'ground', nameEn: 'Ground floor', nameAr: 'الطابق الأرضي',
      outline: rect(0, 0, 64, 42), areas: GROUND.map(finish), entrance: { at: [25, 42], width: 4 },
    },
    {
      id: 'first', nameEn: 'First floor', nameAr: 'الطابق الأول',
      outline: rect(0, 16, 38, 26), ghost: rect(0, 0, 64, 42), areas: FIRST.map(finish),
    },
  ],
};

const PLANS: Record<string, GymPlan> = { [LIVE_CLUB_ID]: MALQA_PLAN };

/** The floor plan of a gym, or undefined when it has not been loaded yet (only Al Malqa Men has one). */
export function floorPlanOf(clubId: string): GymPlan | undefined {
  return PLANS[clubId];
}

/** Total floor area of a plan (all floors), m². */
export function planM2(plan: GymPlan): number {
  return Math.round(plan.floors.reduce((a, f) => a + polyArea(f.outline), 0));
}

// ---------- occupancy ----------

type D = Pick<DemoContextValue, 'clubs' | 'districts' | 'machines' | 'cameras' | 'zones' | 'areas' | 'acUnits' | 'lights' | 'live' | 'agents' | 'agentStates' | 'integrations' | 'boards'>;

export interface AreaOccupancy {
  area: PlanArea;
  /** BMS area id (`${clubId}:${key}`). */
  areaId: string;
  people: number;
  /** people / capacity (0..1+). */
  ratio: number;
}

/** Share of the gym's people found in each monitored area (data.areas share, the presenceOf model). */
function shareMap(d: Pick<D, 'areas'>, clubId: string): Map<string, number> {
  return new Map(d.areas.filter((a) => a.clubId === clubId).map((a) => [a.id, a.share]));
}

function occupancyFrom(plan: GymPlan, people: (areaId: string) => number): AreaOccupancy[] {
  const out: AreaOccupancy[] = [];
  for (const f of plan.floors) {
    for (const area of f.areas) {
      if (!area.monitored) continue;
      const areaId = `${plan.clubId}:${area.key}`;
      const n = people(areaId);
      out.push({ area, areaId, people: n, ratio: area.capacity ? n / area.capacity : 0 });
    }
  }
  return out;
}

/** Live people per area: exactly presenceOf(), so BMS Overview, the FM overview and Control show the same numbers. */
export function liveOccupancy(d: D, clubId: string): AreaOccupancy[] {
  const plan = floorPlanOf(clubId);
  if (!plan) return [];
  const pres = new Map(presenceOf(d, clubId).map((p) => [p.area.id, p.people]));
  return occupancyFrom(plan, (id) => pres.get(id) ?? 0);
}

export interface OccupancyStep {
  /** Minutes from local midnight (today). */
  minute: number;
  ms: number;
  open: boolean;
  /** People in the gym (the Overview KPI model). */
  peopleIn: number;
  areas: AreaOccupancy[];
  live: boolean;
}

/**
 * Today in 15-minute steps from opening (or midnight when the clock is before opening) up to the live clock,
 * ending with the live snapshot itself. Deterministic: the same instant always gives the same values.
 */
export function occupancyToday(d: D, club: Club): OccupancyStep[] {
  const plan = floorPlanOf(club.id);
  if (!plan) return [];
  const nowMs = d.live.nowMs;
  const { date } = d.live;
  const nowMin = d.live.hour * 60 + d.live.minute;
  const shares = shareMap(d, club.id);
  const startMin = nowMin >= club.hours.open * 60 ? club.hours.open * 60 : 0;
  const steps: OccupancyStep[] = [];
  for (let m = startMin; m < nowMin; m += 15) {
    const ms = msAt(date, m);
    const n = peopleInAt(club, ms);
    steps.push({
      minute: m, ms, open: isOpenAt(club, date, m), peopleIn: n, live: false,
      areas: occupancyFrom(plan, (id) => Math.round(n * (shares.get(id) ?? 0))),
    });
  }
  const liveN = d.live.clubs[club.id]?.peopleIn ?? 0;
  steps.push({
    minute: nowMin, ms: nowMs, open: d.live.clubs[club.id]?.isOpen ?? true, peopleIn: liveN, live: true,
    areas: liveOccupancy(d, club.id),
  });
  return steps;
}

export interface AreaPeak { people: number; ratio: number; minute: number }

/** Highest people count per area over the steps (first time it was reached). */
export function areaPeaks(steps: OccupancyStep[]): Map<string, AreaPeak> {
  const out = new Map<string, AreaPeak>();
  for (const s of steps) {
    for (const a of s.areas) {
      const p = out.get(a.areaId);
      if (!p || a.people > p.people) out.set(a.areaId, { people: a.people, ratio: a.ratio, minute: s.minute });
    }
  }
  return out;
}

// ---------- climate per area ----------

export interface AreaClimate {
  /** Average reading of the running AC units (all units when none runs), °C. */
  temp?: number;
  setpoint?: number;
  /** Largest reading above setpoint among running units, °C. */
  overBy: number;
  unitsOn: number;
  units: number;
  comfort: 'ok' | 'warm' | 'hot' | 'off' | 'none';
}

function climateFrom(units: { on: boolean; reading: number; setpoint: number }[]): AreaClimate {
  if (!units.length) return { overBy: 0, unitsOn: 0, units: 0, comfort: 'none' };
  const on = units.filter((u) => u.on);
  const src = on.length ? on : units;
  const temp = Math.round((src.reduce((a, u) => a + u.reading, 0) / src.length) * 10) / 10;
  const overBy = on.reduce((m, u) => Math.max(m, u.reading - u.setpoint), -99);
  const comfort = !on.length ? 'off' : overBy >= 3 ? 'hot' : overBy >= 1.5 ? 'warm' : 'ok';
  return { temp, setpoint: units[0].setpoint, overBy, unitsOn: on.length, units: units.length, comfort };
}

/** Live climate per BMS area id (same reading as the FM overview zone list, user changes included). */
export function liveClimate(d: D, clubId: string): Map<string, AreaClimate> {
  const ac = acOf(d, clubId);
  return new Map(areasOf(d, clubId).map((a) => [
    a.id,
    climateFrom(ac.filter((u) => u.areaId === a.id && u.live).map((u) => ({ on: u.live.on, reading: u.live.reading, setpoint: u.live.setpoint }))),
  ]));
}

const pastLive = new Map<string, LiveData>();

/** Climate per area at a past instant of today (generated readings, without later user changes). */
export function climateAt(s: StaticData, clubId: string, ms: number): Map<string, AreaClimate> {
  const key = `${clubId}|${ms}`;
  let live = pastLive.get(key);
  if (!live) {
    // only this gym's inventory is needed for its AC readings
    const one: StaticData = {
      ...s,
      clubs: s.clubs.filter((c) => c.id === clubId),
      machines: [], zones: [],
      acUnits: s.acUnits.filter((u) => u.clubId === clubId),
      lights: [],
    };
    live = buildLive(one, ms);
    if (pastLive.size > 200) pastLive.clear();
    pastLive.set(key, live);
  }
  const areas = s.areas.filter((a) => a.clubId === clubId);
  return new Map(areas.map((a) => [
    a.id,
    climateFrom(s.acUnits.filter((u) => u.areaId === a.id).map((u) => live!.ac[u.id]).filter(Boolean).map((x) => ({ on: x.on, reading: x.reading, setpoint: x.setpoint }))),
  ]));
}

// ---------- machines on the cardio floor ----------

export interface PlanMachine { id: string; x: number; y: number; rot: number; inUse: boolean; nameEn: string; nameAr: string }

/** Live Floor machines placed on the plan (Live Floor x, z in metres offset to the cardio floor corner). */
export function machinesOnPlan(d: Pick<D, 'machines' | 'clubs' | 'live'>, clubId: string, ms?: number): PlanMachine[] {
  const plan = floorPlanOf(clubId);
  const club = d.clubs.find((c) => c.id === clubId);
  if (!plan || !club) return [];
  const [ox, oy] = plan.liveFloorOrigin;
  return d.machines.filter((m) => m.clubId === clubId && m.enabled).map((m) => {
    const st = ms == null || ms === d.live.nowMs ? d.live.machines[m.id]?.state : machineLiveAt(m, club, ms).state;
    return {
      id: m.id, nameEn: m.nameEn, nameAr: m.nameAr, rot: m.rot, inUse: st === 'inUse',
      x: ox + (m.x - FLOOR_SIZE_M.x[0]), y: oy + (m.z - FLOOR_SIZE_M.z[0]),
    };
  });
}
