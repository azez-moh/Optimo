/**
 * Build 8.7 "More pages" (Settings, card "More pages"). The inventory text says 23, but its list and
 * screenshot 22-settings.jpg show these 21. Each gets a nested route /settings/<slug>.
 * `relatedPage` names the grouped page that covers the same function, if any (for cross-links).
 * The Settings agent owns this file and src/pages/Settings/.
 */
export interface MorePage {
  slug: string;
  nameEn: string;
  nameAr: string;
  relatedPage?: string;
}

export const MORE_PAGES: MorePage[] = [
  { slug: 'overview-fb', nameEn: 'Overview (floor by floor)', nameAr: 'نظرة عامة حسب الطابق', relatedPage: 'overview' },
  { slug: 'branches-fb', nameEn: 'Branches (floor by floor)', nameAr: 'الفروع حسب الطابق', relatedPage: 'branches' },
  { slug: 'site-entities', nameEn: 'Site entities', nameAr: 'كيانات الموقع', relatedPage: 'control' },
  { slug: 'appliances', nameEn: 'Appliances', nameAr: 'الأجهزة الكهربائية', relatedPage: 'hvac' },
  { slug: 'cctv-list', nameEn: 'CCTV list', nameAr: 'قائمة كاميرات المراقبة', relatedPage: 'camera-list' },
  { slug: 'zones', nameEn: 'Zones', nameAr: 'المناطق', relatedPage: 'zones' },
  { slug: 'zones-live', nameEn: 'Zones live readings', nameAr: 'قراءات المناطق المباشرة', relatedPage: 'zones-live' },
  { slug: 'machines', nameEn: 'Machines', nameAr: 'الأجهزة', relatedPage: 'machines' },
  { slug: 'machine-data', nameEn: 'Machine data', nameAr: 'بيانات الأجهزة', relatedPage: 'usage-report' },
  { slug: 'live-data', nameEn: 'Live data', nameAr: 'البيانات المباشرة', relatedPage: 'control' },
  { slug: 'reports', nameEn: 'Reports', nameAr: 'التقارير', relatedPage: 'reports' },
  { slug: 'ac-coverage', nameEn: 'AC coverage', nameAr: 'تغطية التكييف', relatedPage: 'hvac' },
  { slug: 'device-history', nameEn: 'Device history', nameAr: 'سجل الأجهزة', relatedPage: 'machines' },
  { slug: 'history', nameEn: 'History', nameAr: 'السجل', relatedPage: 'ai-agents' },
  { slug: 'automations', nameEn: 'Automations', nameAr: 'الأتمتة', relatedPage: 'ai-agents' },
  { slug: 'conductor-building', nameEn: 'Conductor: building overview', nameAr: 'المايسترو: نظرة عامة على المبنى', relatedPage: 'bms-overview' },
  { slug: 'conductor-energy', nameEn: 'Conductor: energy and demand', nameAr: 'المايسترو: الطاقة والطلب', relatedPage: 'ai-agents' },
  { slug: 'conductor-spaces', nameEn: 'Conductor: spaces and comfort', nameAr: 'المايسترو: المساحات والراحة', relatedPage: 'hvac' },
  { slug: 'conductor-systems', nameEn: 'Conductor: systems and controls', nameAr: 'المايسترو: الأنظمة والتحكم', relatedPage: 'control' },
  { slug: 'conductor-alarms', nameEn: 'Conductor: alarms and work orders', nameAr: 'المايسترو: الإنذارات وأوامر العمل', relatedPage: 'ai-agents' },
  { slug: 'conductor-reports', nameEn: 'Conductor: reports', nameAr: 'المايسترو: التقارير', relatedPage: 'reports' },
];
