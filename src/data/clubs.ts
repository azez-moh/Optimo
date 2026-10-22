import type { Club, District, OpeningHours } from './types';

/*
  The real Armah network: 3 OPTIMO clubs (verified pins, /home/claude/ref/optimo-branches.json) and
  9 B_FIT clubs placed at the centroid of their named neighbourhood (approximate, exactPin = false).
  Floor areas other than Al Malqa Men (3,700 m², published) and every operational figure are generated.
*/

export const DISTRICTS: District[] = [
  { id: 'malqa', region: 'riyadh', cityEn: 'Riyadh', cityAr: 'الرياض', nameEn: 'Al Malqa', nameAr: 'الملقا', lat: 24.7963, lng: 46.5881 },
  { id: 'nakheel', region: 'riyadh', cityEn: 'Riyadh', cityAr: 'الرياض', nameEn: 'An Nakheel', nameAr: 'النخيل', lat: 24.7426, lng: 46.6452 },
  { id: 'yasmin', region: 'riyadh', cityEn: 'Riyadh', cityAr: 'الرياض', nameEn: 'Al Yasmin', nameAr: 'الياسمين', lat: 24.8268, lng: 46.6433 },
  { id: 'nada', region: 'riyadh', cityEn: 'Riyadh', cityAr: 'الرياض', nameEn: 'An Nada', nameAr: 'الندى', lat: 24.8031, lng: 46.7005 },
  { id: 'rayyan', region: 'riyadh', cityEn: 'Riyadh', cityAr: 'الرياض', nameEn: 'Ar Rayyan', nameAr: 'الريان', lat: 24.7071, lng: 46.7853 },
  { id: 'shubra', region: 'riyadh', cityEn: 'Riyadh', cityAr: 'الرياض', nameEn: 'Shubra', nameAr: 'شبرا', lat: 24.5826, lng: 46.6797 },
  { id: 'townsquare', region: 'makkah', cityEn: 'Jeddah', cityAr: 'جدة', nameEn: 'Town Square', nameAr: 'تاون سكوير', lat: 21.6268, lng: 39.1121 },
  { id: 'hira', region: 'makkah', cityEn: 'Jeddah', cityAr: 'جدة', nameEn: 'Hira', nameAr: 'حراء', lat: 21.5654, lng: 39.1682 },
];

const OPTIMO_HOURS: OpeningHours = { open: 6, close: 25, labelEn: 'Daily 06:00 to 01:00', labelAr: 'يوميًا من 06:00 إلى 01:00' };
const OPTIMO_W_HOURS: OpeningHours = {
  open: 6, close: 23, sat: { open: 13, close: 22 },
  labelEn: 'Sun to Fri 06:00 to 23:00, Sat 13:00 to 22:00', labelAr: 'الأحد إلى الجمعة 06:00 إلى 23:00، السبت 13:00 إلى 22:00',
};
const BFIT_HOURS: OpeningHours = { open: 6, close: 24, labelEn: 'Daily 06:00 to 00:00', labelAr: 'يوميًا من 06:00 إلى 00:00' };
const BFIT_W_HOURS: OpeningHours = { open: 7, close: 23, labelEn: 'Daily 07:00 to 23:00', labelAr: 'يوميًا من 07:00 إلى 23:00' };

interface Seed {
  id: string; code: string; brand: Club['brand']; district: string; gender: Club['gender'];
  lat?: number; lng?: number; areaM2: number; capacity: number; addressEn: string; addressAr: string;
  openedEn: string; openedAr: string; live?: boolean;
}

const SEEDS: Seed[] = [
  { id: 'optimo-malqa-men', code: 'OPT-MLQ-M', brand: 'optimo', district: 'malqa', gender: 'men', lat: 24.795832, lng: 46.586712, areaM2: 3700, capacity: 160,
    addressEn: 'Anas Ibn Malik Rd, Al Malqa, Riyadh 13522', addressAr: 'طريق أنس بن مالك، الملقا، الرياض 13522', openedEn: 'Nov 2022', openedAr: 'نوفمبر 2022', live: true },
  { id: 'optimo-malqa-women', code: 'OPT-MLQ-W', brand: 'optimo', district: 'malqa', gender: 'women', lat: 24.7967287, lng: 46.5895369, areaM2: 3200, capacity: 140,
    addressEn: 'Anas Ibn Malik Rd, Al Malqa, Riyadh 13522', addressAr: 'طريق أنس بن مالك، الملقا، الرياض 13522', openedEn: '2023', openedAr: '2023' },
  { id: 'optimo-nakheel-men', code: 'OPT-NKH-M', brand: 'optimo', district: 'nakheel', gender: 'men', lat: 24.742592, lng: 46.645165, areaM2: 3400, capacity: 140,
    addressEn: 'Al Takhassousi St 6775, An Nakheel, Riyadh 12381', addressAr: 'شارع التخصصي 6775، النخيل، الرياض 12381', openedEn: '2023', openedAr: '2023' },
  { id: 'bfit-shubra-women', code: 'BFT-SHB-W', brand: 'bfit', district: 'shubra', gender: 'women', areaM2: 1800, capacity: 90,
    addressEn: 'Shubra, Riyadh', addressAr: 'شبرا، الرياض', openedEn: '2021', openedAr: '2021' },
  { id: 'bfit-rayyan-women', code: 'BFT-RYN-W', brand: 'bfit', district: 'rayyan', gender: 'women', areaM2: 2000, capacity: 100,
    addressEn: 'Ar Rayyan, Riyadh', addressAr: 'الريان، الرياض', openedEn: '2020', openedAr: '2020' },
  { id: 'bfit-rayyan-men', code: 'BFT-RYN-M', brand: 'bfit', district: 'rayyan', gender: 'men', areaM2: 2400, capacity: 120,
    addressEn: 'Ar Rayyan, Riyadh', addressAr: 'الريان، الرياض', openedEn: '2020', openedAr: '2020' },
  { id: 'bfit-yasmin-men', code: 'BFT-YSM-M', brand: 'bfit', district: 'yasmin', gender: 'men', areaM2: 2600, capacity: 130,
    addressEn: 'Al Yasmin, Riyadh', addressAr: 'الياسمين، الرياض', openedEn: '2021', openedAr: '2021' },
  { id: 'bfit-nada-women', code: 'BFT-NDA-W', brand: 'bfit', district: 'nada', gender: 'women', areaM2: 1900, capacity: 95,
    addressEn: 'An Nada, Riyadh', addressAr: 'الندى، الرياض', openedEn: '2022', openedAr: '2022' },
  { id: 'bfit-nada-men', code: 'BFT-NDA-M', brand: 'bfit', district: 'nada', gender: 'men', areaM2: 2300, capacity: 115,
    addressEn: 'An Nada, Riyadh', addressAr: 'الندى، الرياض', openedEn: '2022', openedAr: '2022' },
  { id: 'bfit-townsquare-women', code: 'BFT-TSQ-W', brand: 'bfit', district: 'townsquare', gender: 'women', areaM2: 2000, capacity: 100,
    addressEn: 'Town Square, Jeddah', addressAr: 'تاون سكوير، جدة', openedEn: '2022', openedAr: '2022' },
  { id: 'bfit-hira-men', code: 'BFT-HRA-M', brand: 'bfit', district: 'hira', gender: 'men', areaM2: 2500, capacity: 125,
    addressEn: 'Hira St, Jeddah', addressAr: 'شارع حراء، جدة', openedEn: '2021', openedAr: '2021' },
  { id: 'bfit-hira-women', code: 'BFT-HRA-W', brand: 'bfit', district: 'hira', gender: 'women', areaM2: 1900, capacity: 95,
    addressEn: 'Hira St, Jeddah', addressAr: 'شارع حراء، جدة', openedEn: '2021', openedAr: '2021' },
];

/** Pins of two clubs in one district are spread about 200 m apart so both markers stay clickable. */
const SPREAD: Record<string, [number, number]> = {
  'bfit-rayyan-women': [0.0011, -0.0012], 'bfit-rayyan-men': [-0.0011, 0.0012],
  'bfit-nada-women': [0.0011, -0.0012], 'bfit-nada-men': [-0.0011, 0.0012],
  'bfit-hira-men': [0.0011, -0.0012], 'bfit-hira-women': [-0.0011, 0.0012],
};

const DISTRICT_BY_ID = Object.fromEntries(DISTRICTS.map((d) => [d.id, d]));

export function buildClubs(): Club[] {
  return SEEDS.map((s) => {
    const d = DISTRICT_BY_ID[s.district];
    const brandEn = s.brand === 'optimo' ? 'OPTIMO' : 'B_FIT';
    const brandAr = s.brand === 'optimo' ? 'أوبتيمو' : 'بي فت';
    const gEn = s.gender === 'men' ? 'Men' : 'Women';
    const gAr = s.gender === 'men' ? 'رجال' : 'نساء';
    const off = SPREAD[s.id] ?? [0, 0];
    const hours = s.brand === 'optimo' ? (s.gender === 'women' ? OPTIMO_W_HOURS : OPTIMO_HOURS) : (s.gender === 'women' ? BFIT_W_HOURS : BFIT_HOURS);
    const scale = s.areaM2 / 3700;
    return {
      id: s.id,
      code: s.code,
      brand: s.brand,
      nameEn: `${brandEn} ${d.nameEn} (${gEn})`,
      nameAr: `${brandAr} ${d.nameAr} (${gAr})`,
      shortEn: `${d.nameEn} ${gEn}`,
      shortAr: `${d.nameAr} ${gAr}`,
      region: d.region,
      district: d.id,
      gender: s.gender,
      lat: s.lat ?? d.lat + off[0],
      lng: s.lng ?? d.lng + off[1],
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
