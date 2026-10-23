import type { Club, District, OpeningHours } from './types';

/*
  The OPTIMO network: 2 men's gyms in Riyadh (verified pins, /home/claude/ref/optimo-branches.json).
  Floor areas other than Al Malqa Men (3,700 m², published) and every operational figure are generated.
*/

export const DISTRICTS: District[] = [
  { id: 'malqa', region: 'riyadh', cityEn: 'Riyadh', cityAr: 'الرياض', nameEn: 'Al Malqa', nameAr: 'الملقا', lat: 24.7963, lng: 46.5881 },
  { id: 'nakheel', region: 'riyadh', cityEn: 'Riyadh', cityAr: 'الرياض', nameEn: 'An Nakheel', nameAr: 'النخيل', lat: 24.7426, lng: 46.6452 },
];

const OPTIMO_HOURS: OpeningHours = { open: 6, close: 25, labelEn: 'Daily 06:00 to 01:00', labelAr: 'يوميًا من 06:00 إلى 01:00' };
const OPTIMO_W_HOURS: OpeningHours = {
  open: 6, close: 23, sat: { open: 13, close: 22 },
  labelEn: 'Sun to Fri 06:00 to 23:00, Sat 13:00 to 22:00', labelAr: 'الأحد إلى الجمعة 06:00 إلى 23:00، السبت 13:00 إلى 22:00',
};

interface Seed {
  id: string; code: string; district: string; gender: Club['gender'];
  lat?: number; lng?: number; areaM2: number; capacity: number; addressEn: string; addressAr: string;
  openedEn: string; openedAr: string; live?: boolean;
}

const SEEDS: Seed[] = [
  { id: 'optimo-malqa-men', code: 'OPT-MLQ-M', district: 'malqa', gender: 'men', lat: 24.795832, lng: 46.586712, areaM2: 3700, capacity: 160,
    addressEn: 'Anas Ibn Malik Rd, Al Malqa, Riyadh 13522', addressAr: 'طريق أنس بن مالك، الملقا، الرياض 13522', openedEn: 'Nov 2022', openedAr: 'نوفمبر 2022', live: true },
  { id: 'optimo-nakheel-men', code: 'OPT-NKH-M', district: 'nakheel', gender: 'men', lat: 24.742592, lng: 46.645165, areaM2: 3400, capacity: 140,
    addressEn: 'Al Takhassousi St 6775, An Nakheel, Riyadh 12381', addressAr: 'شارع التخصصي 6775، النخيل، الرياض 12381', openedEn: '2023', openedAr: '2023' },
];

const DISTRICT_BY_ID = Object.fromEntries(DISTRICTS.map((d) => [d.id, d]));

export function buildClubs(): Club[] {
  return SEEDS.map((s) => {
    const d = DISTRICT_BY_ID[s.district];
    const gEn = s.gender === 'men' ? 'Men' : 'Women';
    const gAr = s.gender === 'men' ? 'رجال' : 'نساء';
    const hours = s.gender === 'women' ? OPTIMO_W_HOURS : OPTIMO_HOURS;
    const scale = s.areaM2 / 3700;
    return {
      id: s.id,
      code: s.code,
      nameEn: `OPTIMO ${d.nameEn} (${gEn})`,
      nameAr: `أوبتيمو ${d.nameAr} (${gAr})`,
      shortEn: `${d.nameEn} ${gEn}`,
      shortAr: `${d.nameAr} ${gAr}`,
      region: d.region,
      district: d.id,
      gender: s.gender,
      lat: s.lat ?? d.lat,
      lng: s.lng ?? d.lng,
      exactPin: s.lat != null,
      addressEn: s.addressEn,
      addressAr: s.addressAr,
      areaM2: s.areaM2,
      capacity: s.capacity,
      hours,
      openedEn: s.openedEn,
      openedAr: s.openedAr,
      staff: Math.round(14 + 18 * scale),
      // counts below are filled in by build.ts from the generated inventories
      machines: 0,
      cameras: 0,
      zones: 0,
      acUnits: 0,
      lightCircuits: 0,
      live: !!s.live,
    };
  });
}

/** The live club (AI Vision figures follow the Build 8.7 snapshot). */
export const LIVE_CLUB_ID = 'optimo-malqa-men';

/** Commercial electricity tariff used for savings in SAR. Assumption: 0.32 SAR per kWh (commercial, incl. fees). */
export const TARIFF_SAR_PER_KWH = 0.32;

/** Share of a club's energy by end use (Build 8.7 "Where it goes"). */
export const ENERGY_SPLIT: { key: string; en: string; ar: string; pct: number }[] = [
  { key: 'ac', en: 'Air conditioning', ar: 'التكييف', pct: 48 },
  { key: 'ahu', en: 'Ventilation and AHU', ar: 'التهوية ووحدات مناولة الهواء', pct: 19 },
  { key: 'lighting', en: 'Lighting', ar: 'الإضاءة', pct: 14 },
  { key: 'water', en: 'Water heating', ar: 'تسخين المياه', pct: 10 },
  { key: 'plug', en: 'Machines and plug loads', ar: 'الأجهزة والأحمال الكهربائية', pct: 6 },
  { key: 'lifts', en: 'Lifts and pumps', ar: 'المصاعد والمضخات', pct: 3 },
];
