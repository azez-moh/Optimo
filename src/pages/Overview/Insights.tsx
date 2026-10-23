/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from 'react';
import { ArrowLeftRight, BatteryCharging, Check, ClipboardList, PackageMinus, ShoppingCart, Trash2, Users, Wrench, X, type LucideIcon } from 'lucide-react';
import { Card, ChipGroup, ConfirmDialog, Drawer, EmptyState, Modal, Segmented, Select } from '../../components';
import { useI18n, translate, LOCALE, type Lang } from '../../i18n';
import { useDemo, type Club, type DemoContextValue, type MachineType } from '../../data';
import type { Insight, InsightKind } from './insights';
import './insights.css';
import { DISMISS_REASONS, PLAN_STATUSES, type DismissReason, type Plan } from './plan';

// ---------- formatting in a given language (also used to snapshot both languages into the plan) ----------

export interface Tx {
  lang: Lang;
  t: (k: string, v?: Record<string, string | number>) => string;
  num: (n: number, dp?: number) => string;
  sar: (v: number) => string;
  gym: (id: string) => string;
  types: (type: MachineType, n: number) => string;
  typeLabel: (type: MachineType) => string;
  hour: (h: number) => string;
  slot: (h: number) => string;
  list: (xs: string[]) => string;
}

export function makeTx(lang: Lang, clubs: Club[], districts: DemoContextValue['districts']): Tx {
  const t = (k: string, v?: Record<string, string | number>) => translate(lang, `insights.${k}`, v);
  const nf = new Map<number, Intl.NumberFormat>();
  const num = (n: number, dp?: number) => {
    const k = dp ?? -1;
    let f = nf.get(k);
    if (!f) { f = new Intl.NumberFormat(LOCALE[lang], dp == null ? { maximumFractionDigits: 1 } : { minimumFractionDigits: dp, maximumFractionDigits: dp }); nf.set(k, f); }
    return f.format(n);
  };
  const sar = (v: number) => {
    if (v < 10_000) return lang === 'ar' ? `${num(Math.round(v))} ر.س` : `SAR ${num(Math.round(v))}`;
    if (v < 1_000_000) return lang === 'ar' ? `${num(v / 1000, 1)} ألف ر.س` : `SAR ${num(v / 1000, 1)}k`;
    return lang === 'ar' ? `${num(v / 1e6, 2)} مليون ر.س` : `SAR ${num(v / 1e6, 2)}m`;
  };
  const dById = new Map(districts.map((d) => [d.id, d]));
  const gym = (id: string) => {
    const c = clubs.find((x) => x.id === id);
    const d = c ? dById.get(c.district) : undefined;
    return d ? (lang === 'ar' ? d.nameAr : d.nameEn) : id;
  };
  const hf = new Intl.DateTimeFormat(LOCALE[lang], { hour: 'numeric', hour12: true, timeZone: 'UTC' });
  const hour = (h: number) => {
    const s = hf.format(new Date(Date.UTC(2000, 0, 1, ((h % 24) + 24) % 24)));
    return lang === 'en' ? s.replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase()) : s;
  };
  return {
    lang, t, num, sar, gym, hour,
    types: (type, n) => (lang === 'ar' ? t(`type.${type}.many`) : t(`type.${type}.${n === 1 ? 'one' : 'many'}`)),
    typeLabel: (type) => t(`type.${type}.label`),
    slot: (h) => t('text.slot', { a: hour(h), b: hour(h + 2) }),
    list: (xs) => xs.join(t('text.listSep')),
  };
}

export function useTx(): Tx {
  const { lang } = useI18n();
  const { clubs, districts } = useDemo();
  return useMemo(() => makeTx(lang, clubs, districts), [lang, clubs, districts]);
}

export interface Described { action: string; why: string[]; impact: string[] }

/** Plain-language action, reasons (the numbers) and expected impact of a recommendation. */
export function describe(i: Insight, x: Tx): Described {
  const { t, num, sar, gym } = x;
  if (i.move) {
    const m = i.move;
    return {
      action: t('text.moveAction', { n: num(m.n), types: x.types(i.type!, m.n), from: gym(m.from), to: gym(m.to) }),
      why: [
        t('text.moveWhyTo', { gym: gym(m.to), util: num(m.toUtil), s: num(m.toSessionsDay), units: num(m.toUnits), peak: num(Math.round(m.toPeakFull)) }),
        t('text.moveWhyFrom', { gym: gym(m.from), util: num(m.fromUtil), s: num(m.fromSessionsDay), units: num(m.fromUnits) }),
      ],
      impact: [
        t('text.moveImpactUse', { to: gym(m.to), a: num(m.toUtil), b: num(m.toAfter), from: gym(m.from), c: num(m.fromUtil), d: num(m.fromAfter) }),
        t('text.moveImpactSar', { n: num(m.n), sar: sar(m.avoidedSar), cost: sar(m.moveCostSar) }),
      ],
    };
  }
  if (i.buy) {
    const b = i.buy;
    const list = x.list(b.perGym.map((g) => t('text.gymN', { gym: gym(g.clubId), n: num(g.n) })));
    return {
      action: t('text.buyAction', { n: num(b.total), types: x.types(i.type!, b.total), list }),
      why: [
        t('text.buyWhy', { k: num(b.highGyms), m: num(b.ofGyms), peak: num(Math.round(Math.max(...b.perGym.map((g) => g.peakFull)))) }),
        t('text.buyWhyNoSpare', { types: x.types(i.type!, 2) }),
      ],
      impact: [
        t('text.buyImpactUse', { list: x.list(b.perGym.map((g) => t('text.fromTo', { gym: gym(g.clubId), a: num(g.util), b: num(g.after) }))) }),
        t('text.buyImpactSar', { sar: sar(b.costSar), price: sar(b.unitPrice) }),
      ],
    };
  }
  if (i.retire) {
    const r = i.retire;
    const list = x.list(r.perGym.map((g) => t('text.gymN', { gym: gym(g.clubId), n: num(g.n) })));
    return {
      action: t('text.retireAction', { n: num(r.total), units: num(r.units), types: x.types(i.type!, r.units), list }),
      why: [
        t('text.retireWhy', { util: num(r.networkUtil) }),
        t('text.retireWhyPeak', { a: num(i.weeksHeld), b: num(i.weeksOf) }),
      ],
      impact: [t('text.retireImpactSar', { sar: sar(r.resaleSar) }), t('text.retireImpactKeep')],
    };
  }
  if (i.service) {
    const s = i.service;
    const nm = (m: { nameEn: string; nameAr: string }) => (x.lang === 'ar' ? m.nameAr : m.nameEn);
    const shown = s.machines.slice(0, 3).map(nm);
    const names = x.list(s.machines.length > 3 ? [...shown, t('text.more', { n: num(s.machines.length - 3) })] : shown);
    return {
      action: s.machines.length === 1 ? t('text.serviceActionOne', { names, gym: gym(s.clubId) }) : t('text.serviceAction', { n: num(s.machines.length), gym: gym(s.clubId), names }),
      why: s.machines.slice(0, 2).map((m) => t('text.serviceWhy', { name: nm(m), h: num(m.hours), i: num(m.interval) })),
      impact: [t('text.serviceImpact'), t('text.serviceImpactTime')],
    };
  }
  if (i.energy) {
    const e = i.energy;
    const why = [
      t('text.energyWhy', { gym: gym(e.clubId), kpv: num(e.kwhPerVisit, 2), gap: num(e.gapPct), best: gym(e.bestClubId), bpv: num(e.bestKwhPerVisit, 2) }),
      t('text.energyWhyAc', { h: num(e.afterHoursAcH) }),
    ];
    if (e.emptyZoneH > 0) why.push(t('text.energyWhyStudio', { h: num(e.emptyZoneH) }));
    return {
      action: t('text.energyAction', { gym: gym(e.clubId) }),
      why,
      impact: [t('text.energyImpact', { kwh: num(e.wasteKwhMonth), sar: sar(e.wasteSarMonth) })],
    };
  }
  const c = i.capacity!;
  return {
    action: c.classes === 1
      ? t('text.capacityActionOne', { gym: gym(c.clubId), slot: x.hour(c.slotH), quiet: x.hour(c.quietH) })
      : t('text.capacityAction', { n: num(c.classes), gym: gym(c.clubId), slot: x.hour(c.slotH), quiet: x.hour(c.quietH) }),
    why: [
      t('text.capacityWhy', { d: num(c.days), of: num(c.ofDays) }),
      t('text.capacityWhySlots', { slot: x.slot(c.slotH), p: num(c.peakPct), quiet: x.slot(c.quietH), q: num(c.quietPct) }),
    ],
    impact: [t('text.capacityImpact', { a: num(c.afterPct) })],
  };
}

export const KIND_ICON: Record<InsightKind, LucideIcon> = {
  move: ArrowLeftRight, buy: ShoppingCart, retire: PackageMinus, service: Wrench, energy: BatteryCharging, capacity: Users,
};

export function KindChip({ kind }: { kind: InsightKind }) {
  const { t } = useI18n();
  const Icon = KIND_ICON[kind];
  return <span className={`in-kind in-kind--${kind}`}><Icon aria-hidden />{t(`insights.kind.${kind}`)}</span>;
}

function Confidence({ i }: { i: Insight }) {
  const { t, fmtNumber } = useI18n();
  const basis = i.kind === 'service' ? t('insights.recs.conf.log') : t('insights.recs.conf.weeks', { a: fmtNumber(i.weeksHeld), b: fmtNumber(i.weeksOf) });
  return (
    <span className={`in-conf in-conf--${i.confidence}`} title={t(`insights.recs.conf.${i.confidence}Info`)}>
      <span className="in-conf__dot" aria-hidden />
      {t(`insights.recs.conf.${i.confidence}`)} · <span className="num">{basis}</span>
    </span>
  );
}

// ---------- one recommendation ----------

export function InsightCard({ i, plan, onPlan, onDismiss, onViewPlan, highlight, compact }: {
  i: Insight; plan: Plan; onPlan: (i: Insight) => void; onDismiss: (i: Insight) => void; onViewPlan: () => void; highlight?: boolean; compact?: boolean;
}) {
  const { t } = useI18n();
  const x = useTx();
  const d = describe(i, x);
  const p = plan.planned(i.id);
  return (
    <article className={`in-card ${highlight ? 'is-hl' : ''} ${compact ? 'is-compact' : ''}`} id={`rec-${i.id.replace(/[^a-z0-9-]/gi, '_')}`} data-kind={i.kind}>
      <div className="in-card__top">
        <KindChip kind={i.kind} />
        <Confidence i={i} />
      </div>
      <h3 className="in-card__action">{d.action}</h3>
      <dl className="in-card__facts">
        <dt>{t('insights.recs.why')}</dt>
        <dd><ul>{d.why.map((w, k) => <li key={k}>{w}</li>)}</ul></dd>
        <dt>{t('insights.recs.impact')}</dt>
        <dd><ul className="in-card__impact">{d.impact.map((w, k) => <li key={k}>{w}</li>)}</ul></dd>
      </dl>
      <div className="in-card__foot">
        {p ? (
          <>
            <span className="in-planned"><Check aria-hidden />{t('insights.recs.planned')} · {t(`insights.plan.st.${p.status}`)}</span>
            <button type="button" className="btn btn--sm btn--ghost" onClick={onViewPlan}>{t('insights.recs.viewPlan')}</button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn--sm in-plan-btn" onClick={() => onPlan(i)}><ClipboardList aria-hidden />{t('insights.recs.plan')}</button>
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => onDismiss(i)}><X aria-hidden />{t('insights.recs.dismiss')}</button>
          </>
        )}
      </div>
    </article>
  );
}

/** Adds a recommendation to the plan with its text in both languages. */
export function usePlanAdd(plan: Plan) {
  const data = useDemo();
  return (i: Insight) => {
    const en = describe(i, makeTx('en', data.clubs, data.districts)).action;
    const ar = describe(i, makeTx('ar', data.clubs, data.districts)).action;
    plan.add({ id: i.id, kind: i.kind, clubIds: i.clubIds, textEn: en, textAr: ar });
  };
}

export function DismissDialog({ insight, onClose, onConfirm }: { insight: Insight | null; onClose: () => void; onConfirm: (r: DismissReason) => void }) {
  const { t } = useI18n();
  const x = useTx();
  const [reason, setReason] = useState<DismissReason>('done');
  return (
    <Modal open={!!insight} onClose={onClose} title={t('insights.dismiss.title')} width={480}
      footer={<>
        <button type="button" className="btn" onClick={onClose}>{t('common.cancel')}</button>
        <button type="button" className="btn btn--danger" onClick={() => onConfirm(reason)}>{t('insights.dismiss.confirm')}</button>
      </>}>
      {insight && (
        <div className="stack">
          <p className="in-dismiss__action">{describe(insight, x).action}</p>
          <p className="confirm__body">{t('insights.dismiss.body')}</p>
          <div className="stack" style={{ gap: 8 }}>
            <span className="label">{t('insights.dismiss.reason')}</span>
            <ChipGroup ariaLabel={t('insights.dismiss.reason')} value={reason} onChange={setReason}
              options={DISMISS_REASONS.map((r) => ({ value: r, label: t(`insights.dismiss.r.${r}`) }))} />
          </div>
        </div>
      )}
    </Modal>
  );
}

// ---------- the section ----------

export function RecommendedActions({ list, scopeIds, isAll, plan, highlightId, onViewPlan }: {
  list: Insight[]; scopeIds: string[]; isAll: boolean; plan: Plan; highlightId: string | null; onViewPlan: () => void;
}) {
  const { t, fmtNumber } = useI18n();
  const [which, setWhich] = useState<'in' | 'all'>('in');
  const [showAll, setShowAll] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);
  const [dismissing, setDismissing] = useState<Insight | null>(null);
  const addToPlan = usePlanAdd(plan);
  const inScope = isAll || which === 'all' ? list : list.filter((i) => i.clubIds.some((id) => scopeIds.includes(id)));
  const visible = inScope.filter((i) => !plan.isDismissed(i.id));
  const dismissed = inScope.filter((i) => plan.isDismissed(i.id));
  const shown = showAll ? visible : visible.slice(0, 6);

  return (
    <Card className="in-recs" title={<span className="ov-card-title">{t('insights.recs.title')}</span>} info={t('insights.recs.info')}
      actions={(
        <div className="in-recs__actions">
          <span className="in-recs__count num">{t('insights.recs.count', { n: fmtNumber(visible.length) })}</span>
          {!isAll && (
            <Segmented size="sm" ariaLabel={t('insights.recs.scopeLabel')} value={which} onChange={setWhich}
              options={[{ value: 'in', label: t('insights.recs.scopeIn') }, { value: 'all', label: t('insights.recs.scopeAll') }]} />
          )}
        </div>
      )}>
      {visible.length === 0
        ? <EmptyState title={t('insights.recs.none')} body={t('insights.recs.noneBody')} compact />
        : (
          <div className="in-grid">
            {shown.map((i) => (
              <InsightCard key={i.id} i={i} plan={plan} highlight={highlightId === i.id} onViewPlan={onViewPlan}
                onPlan={addToPlan} onDismiss={setDismissing} />
            ))}
          </div>
        )}
      <div className="in-recs__more">
        {visible.length > 6 && (
          <button type="button" className="btn btn--sm" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
            {showAll ? t('insights.recs.showFewer') : t('insights.recs.showAll', { n: fmtNumber(visible.length) })}
          </button>
        )}
        {dismissed.length > 0 && (
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setShowDismissed((v) => !v)} aria-expanded={showDismissed}>
            {showDismissed ? t('insights.recs.hideDismissed') : t('insights.recs.showDismissed', { n: fmtNumber(dismissed.length) })}
          </button>
        )}
      </div>
      {showDismissed && dismissed.length > 0 && (
        <ul className="in-dismissed">
          {dismissed.map((i) => {
            const why = plan.isDismissed(i.id)!;
            return (
              <li key={i.id}>
                <KindChip kind={i.kind} />
                <span className="in-dismissed__text"><DescribedAction i={i} /></span>
                <span className="in-dismissed__why">{t('insights.recs.dismissedBecause', { reason: t(`insights.dismiss.r.${why.reason}`) })}</span>
                <button type="button" className="btn btn--sm btn--ghost" onClick={() => plan.restore(i.id)}>{t('insights.recs.restore')}</button>
              </li>
            );
          })}
        </ul>
      )}
      <DismissDialog key={dismissing?.id ?? 'none'} insight={dismissing} onClose={() => setDismissing(null)}
        onConfirm={(r) => { if (dismissing) plan.dismiss(dismissing.id, r); setDismissing(null); }} />
    </Card>
  );
}

function DescribedAction({ i }: { i: Insight }) {
  const x = useTx();
  return <>{describe(i, x).action}</>;
}

/** Drawer with the recommendations of one cell or one gym (opened from the equipment matrix). */
export function RecDrawer({ open, title, items, plan, onClose, onViewPlan }: {
  open: boolean; title: string; items: Insight[]; plan: Plan; onClose: () => void; onViewPlan: () => void;
}) {
  const { t } = useI18n();
  const [dismissing, setDismissing] = useState<Insight | null>(null);
  const addToPlan = usePlanAdd(plan);
  return (
    <Drawer open={open} onClose={onClose} title={title} width={560}>
      {items.length === 0
        ? <EmptyState title={t('insights.matrix.noRec')} compact />
        : (
          <div className="stack">
            {items.map((i) => (
              <InsightCard key={i.id} i={i} plan={plan} onPlan={addToPlan} onViewPlan={() => { onClose(); onViewPlan(); }}
                onDismiss={setDismissing} compact />
            ))}
          </div>
        )}
      <DismissDialog key={dismissing?.id ?? 'none'} insight={dismissing} onClose={() => setDismissing(null)}
        onConfirm={(r) => { if (dismissing) plan.dismiss(dismissing.id, r); setDismissing(null); }} />
    </Drawer>
  );
}

// ---------- action plan ----------

export function ActionPlan({ plan }: { plan: Plan }) {
  const { t, pick, fmtAgo, fmtNumber } = useI18n();
  const data = useDemo();
  const x = useTx();
  const [removing, setRemoving] = useState<string | null>(null);
  const items = plan.items;
  const n = (s: string) => items.filter((i) => i.status === s).length;
  const rm = items.find((i) => i.id === removing);
  return (
    <Card className={`in-plan ${items.length ? '' : 'is-empty'}`} title={<span className="ov-card-title">{t('insights.plan.title')}</span>} info={t('insights.plan.info')}
      actions={items.length ? <span className="in-recs__count num">{t('insights.plan.count', { n: fmtNumber(n('planned')), p: fmtNumber(n('progress')), d: fmtNumber(n('done')) })}</span> : undefined}>
      {items.length === 0
        ? <p className="in-plan__empty"><span>{t('insights.plan.empty')}.</span> {t('insights.plan.emptyBody')}</p>
        : (
          <ul className="in-plan__list">
            {items.map((i) => (
              <li key={i.id} className={`in-plan__row is-${i.status}`}>
                <KindChip kind={i.kind} />
                <span className="in-plan__text">
                  <span className="in-plan__action">{pick(i.textEn, i.textAr)}</span>
                  <span className="in-plan__meta">{x.list(i.clubIds.map(x.gym))} · {t('insights.plan.added', { ago: fmtAgo((data.live.nowMs - i.at) / 1000) })}</span>
                </span>
                <Select label={t('insights.plan.status')} value={i.status} onChange={(s) => plan.setStatus(i.id, s)}
                  options={PLAN_STATUSES.map((s) => ({ value: s, label: t(`insights.plan.st.${s}`) }))} className="in-plan__status" />
                <button type="button" className="btn btn--sm btn--ghost btn--icon" aria-label={`${t('insights.plan.remove')}: ${pick(i.textEn, i.textAr)}`} onClick={() => setRemoving(i.id)}>
                  <Trash2 aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      <ConfirmDialog open={!!rm} onCancel={() => setRemoving(null)} onConfirm={() => { if (rm) plan.remove(rm.id); setRemoving(null); }}
        title={t('insights.plan.removeTitle')} body={rm ? t('insights.plan.removeBody', { action: pick(rm.textEn, rm.textAr) }) : ''} confirmLabel={t('insights.plan.remove')} />
    </Card>
  );
}

