import type { MachineType } from './types';

/*
  Fleet assumptions for the generated data and the COO recommendations (src/pages/Overview/insights.ts).
  Everything here is a documented demo assumption, not a measured value:
  - DEMAND: target share of open time in use (4-week average) per gym and machine type. It drives the
    generated sessions of every gym except OPTIMO Al Malqa (Men), whose machines keep the Build 8.7 snapshot.
  - VISIT_FACTOR: daily visits per gym as a multiple of the network norm (3.2 x capacity).
  - PRICE_SAR: purchase price of one new commercial unit, Saudi market, incl. VAT and delivery (rounded).
  - SERVICE_INTERVAL_H: preventive service interval in hours of use (manufacturer-style schedules, rounded).
*/

/** Gyms that must carry at least `min` units of a type (keeps the demand profile meaningful). */
export const REQUIRED_TYPES: Record<string, Partial<Record<MachineType, number>>> = {
  'bfit-yasmin-men': { rower: 3 },
  'bfit-hira-men': { rower: 3, 'indoor-bike': 4 },
  'bfit-nada-men': { 'flat-bench': 1 },
  'optimo-nakheel-men': { 'indoor-bike': 6 },
};

/** Typical share of open time in use per type, before the gym profile. */
const TYPE_DEFAULT: Partial<Record<MachineType, number>> = {
  'treadmill': 0.19, 'slat-treadmill': 0.5, 'incline-treadmill': 0.2, 'stair-climber': 0.12, 'indoor-bike': 0.1,
  'recumbent-bike': 0.11, 'elliptical': 0.06, 'adaptive-cross-trainer': 0.08, 'rower': 0.06, 'upper-body-ergometer': 0.06,
  'flat-bench': 0.11, 'incline-bench': 0.11, 'preacher-curl': 0.08, 'standing-preacher': 0.08,
};

/**
 * Gym profile (overrides of TYPE_DEFAULT). Hira (Jeddah) is crowded and rows and cycles a lot; Al Yasmin and
 * An Nakheel hardly use rowers or bikes; An Nada is strength-heavy; slat treadmills are short everywhere.
 */
const PROFILE: Record<string, Partial<Record<MachineType, number>>> = {
  'optimo-nakheel-men': { 'indoor-bike': 0.035, rower: 0.05, 'slat-treadmill': 0.56 },
  'bfit-rayyan-men': { rower: 0.07, 'flat-bench': 0.06, 'slat-treadmill': 0.54, elliptical: 0.05 },
  'bfit-yasmin-men': { rower: 0.035, 'indoor-bike': 0.08, 'slat-treadmill': 0.33, elliptical: 0.05 },
  'bfit-nada-men': { 'flat-bench': 0.62, treadmill: 0.16, elliptical: 0.04, 'slat-treadmill': 0.52 },
  'bfit-hira-men': { rower: 0.6, 'indoor-bike': 0.55, treadmill: 0.24, 'slat-treadmill': 0.6, elliptical: 0.07, 'flat-bench': 0.07 },
};

export function demandShare(clubId: string, type: MachineType): number {
  return PROFILE[clubId]?.[type] ?? TYPE_DEFAULT[type] ?? 0.1;
}

/**
 * Demand that grew over the last weeks (a newer pattern, so lower confidence): multiplier by date.
 * Hira indoor bikes ramp from 0.6 to 1.0 between 27 Aug and 8 Oct 2026, then stay at 1.0.
 */
export function demandTrend(clubId: string, type: MachineType, date: string): number {
  if (clubId === 'bfit-hira-men' && type === 'indoor-bike') {
    const days = (Date.parse(`${date}T12:00:00Z`) - Date.parse('2026-08-27T12:00:00Z')) / 86_400_000;
    return Math.max(0.6, Math.min(1, 0.6 + 0.4 * (days / 42)));
  }
  return 1;
}

/** Typical session length in minutes per type (gyms other than the live one). */
export const SESSION_MIN: Record<MachineType, number> = {
  'treadmill': 24, 'slat-treadmill': 14, 'incline-treadmill': 20, 'stair-climber': 12, 'indoor-bike': 26, 'recumbent-bike': 22,
  'elliptical': 20, 'adaptive-cross-trainer': 18, 'rower': 12, 'upper-body-ergometer': 10, 'flat-bench': 9, 'incline-bench': 9,
  'preacher-curl': 6, 'standing-preacher': 6,
};

/** Daily visits multiple per gym (1 = 3.2 x capacity). Hira runs close to full in the evening. */
export const VISIT_FACTOR: Record<string, number> = { 'bfit-hira-men': 2.1, 'bfit-nada-men': 1.15 };

/** Purchase price of one new unit, SAR (assumption, rounded). */
export const PRICE_SAR: Record<MachineType, number> = {
  'treadmill': 38_000, 'slat-treadmill': 52_000, 'incline-treadmill': 60_000, 'stair-climber': 34_000, 'indoor-bike': 9_500,
  'recumbent-bike': 16_000, 'elliptical': 26_000, 'adaptive-cross-trainer': 32_000, 'rower': 7_500, 'upper-body-ergometer': 18_000,
  'flat-bench': 4_500, 'incline-bench': 5_500, 'preacher-curl': 9_000, 'standing-preacher': 8_000,
};

/** Resale value of a used unit as a share of the new price (assumption). */
export const RESALE_SHARE = 0.35;

/** Cost to move one unit between gyms, SAR (assumption): within Riyadh, or Riyadh to Jeddah. */
export const MOVE_COST_SAR = { sameCity: 600, otherCity: 2_400 };

/** Preventive service interval in hours of use (assumption). */
export const SERVICE_INTERVAL_H: Record<MachineType, number> = {
  'treadmill': 2_000, 'slat-treadmill': 3_000, 'incline-treadmill': 2_000, 'stair-climber': 1_500, 'indoor-bike': 3_000,
  'recumbent-bike': 3_000, 'elliptical': 2_500, 'adaptive-cross-trainer': 2_500, 'rower': 2_500, 'upper-body-ergometer': 3_000,
  'flat-bench': 4_000, 'incline-bench': 4_000, 'preacher-curl': 4_000, 'standing-preacher': 4_000,
};

/** Machine families for the compare view. */
export const FAMILIES: { key: string; types: MachineType[] }[] = [
  { key: 'run', types: ['treadmill', 'slat-treadmill', 'incline-treadmill'] },
  { key: 'bike', types: ['indoor-bike', 'recumbent-bike'] },
  { key: 'cross', types: ['elliptical', 'adaptive-cross-trainer'] },
  { key: 'stair', types: ['stair-climber'] },
  { key: 'row', types: ['rower', 'upper-body-ergometer'] },
  { key: 'strength', types: ['flat-bench', 'incline-bench', 'preacher-curl', 'standing-preacher'] },
];
