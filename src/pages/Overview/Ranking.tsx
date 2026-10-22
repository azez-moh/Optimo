import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, ChipGroup } from '../../components';
import { useI18n } from '../../i18n';
import { useScope } from '../../layout/filters';
import type { ClubRow, Period } from './metrics';
import { BrandTag, ClubStatus, useFmtMwh, useFmtSarCompact } from './shared';

export type Metric = 'people' | 'machine' | 'energy' | 'savings' | 'alerts';
// eslint-disable-next-line react-refresh/only-export-components
export const METRICS: Metric[] = ['people', 'machine', 'energy', 'savings', 'alerts'];

/** Club ranking with a metric switch (CV-16): the main visual of the network-wide view. */
export function ClubRanking({ rows, metric, period, onMetric, onShowCard }: {
  rows: ClubRow[]; metric: Metric; period: Period; onMetric: (m: Metric) => void; onShowCard: (clubId: string) => void;
}) {
  const { t, pick, fmtNumber, isRtl } = useI18n();
  const { scope, setScope } = useScope();
  const navigate = useNavigate();
  const mwh = useFmtMwh();
  const sar = useFmtSarCompact();

  const peopleKey = period === 'now' ? 'people' : period === 'today' ? 'peopleToday' : 'peopleWeek';
  const metricLabel = (m: Metric) => t(`overview.ranking.m.${m === 'people' ? peopleKey : m}`);

  const valueOf = (r: ClubRow): number => {
    switch (metric) {
      case 'people': return period === 'now' ? r.pctFull : period === 'today' ? r.peopleToday : r.visits7;
      case 'machine': return r.machinePct;
      case 'energy': return r.energyMonthKwh;
      case 'savings': return r.savedMonthSar;
      case 'alerts': return r.alerts.length;
    }
  };
  const display = (r: ClubRow): string => {
    switch (metric) {
      case 'people': return period === 'now' ? `${fmtNumber(r.pctFull)}%` : fmtNumber(valueOf(r));
      case 'machine': return `${fmtNumber(r.machinePct)}%`;
      case 'energy': return mwh.full(r.energyMonthKwh);
      case 'savings': return sar(r.savedMonthSar);
      case 'alerts': return fmtNumber(r.alerts.length);
    }
  };
  const sub = (r: ClubRow): string => {
    switch (metric) {
      case 'people': return period === 'now' ? t('overview.ranking.ofCap', { n: fmtNumber(r.peopleIn), cap: fmtNumber(r.club.capacity) }) : '';
      case 'savings': return `${fmtNumber(r.savedMonthPct, 1)}%`;
      case 'alerts': return r.critical ? `${fmtNumber(r.critical)} ${t('status.critical')}` : '';
      default: return '';
    }
  };

  const sorted = [...rows].sort((a, b) => valueOf(b) - valueOf(a) || pick(a.club.nameEn, a.club.nameAr).localeCompare(pick(b.club.nameEn, b.club.nameAr)));
  const hi = Math.max(1, ...sorted.map(valueOf));
  const n = sorted.length;
  const name = (r: ClubRow) => pick(r.club.nameEn, r.club.nameAr);
  const openClub = (id: string) => { setScope({ level: 'club', clubId: id }); navigate('/bms-overview'); };
  const currentId = scope.level === 'club' ? scope.clubId : null;

  return (
    <Card className="ov-rank" title={<span className="ov-card-title">{t('overview.ranking.title')}</span>} info={t('overview.ranking.info')}
      actions={(
        <ChipGroup ariaLabel={t('overview.ranking.metric')} value={metric} onChange={onMetric} scroll className="ov-rank__metrics"
          options={METRICS.map((m) => ({ value: m, label: metricLabel(m) }))} />
      )}>
      <ol className="ov-rank__list" role="figure"
        aria-label={n ? t('overview.ranking.aria', { metric: metricLabel(metric), top: name(sorted[0]), bottom: name(sorted[n - 1]) }) : metricLabel(metric)}>
        {sorted.map((r, i) => {
          const v = valueOf(r);
          const top = i === 0 && n > 1;
          const bottom = i === n - 1 && n > 1;
          const s = sub(r);
          return (
            <li key={r.club.id} className={`ov-rank__row ${top ? 'is-top' : ''}`}>
              <span className="ov-rank__pos num">{String(i + 1).padStart(2, '0')}</span>
              <button type="button" className="ov-rank__name" onClick={() => onShowCard(r.club.id)} aria-label={t('overview.ranking.showCard', { name: name(r) })}>
                <span className="ov-rank__nametext">{name(r)}</span>
                <BrandTag brand={r.club.brand} />
              </button>
              <span className="ov-rank__bar" aria-hidden>
                <span className={`ov-rank__fill ${top ? 'is-hi' : ''}`} style={{ inlineSize: `${v > 0 ? Math.max(1.5, (v / hi) * 100) : 0}%`, transformOrigin: isRtl ? 'right' : 'left' }} />
              </span>
              <span className="ov-rank__val num">{display(r)}</span>
              <span className="ov-rank__sub num">{s}</span>
              <span className="ov-rank__mark">
                {top && <span className="ov-mark ov-mark--hi">{t('overview.ranking.highest')}</span>}
                {bottom && <span className="ov-mark">{t('overview.ranking.lowest')}</span>}
              </span>
              <span className="ov-rank__status"><ClubStatus status={r.live?.status ?? 'ok'} /></span>
              <span className="ov-rank__act">
                {currentId === r.club.id
                  ? <span className="ov-rank__current">{t('overview.ranking.current')}</span>
                  : (
                    <button type="button" className="btn btn--sm btn--ghost ov-rank__open" onClick={() => openClub(r.club.id)}>
                      {t('overview.ranking.open')}<ArrowRight aria-hidden className="flip-rtl" />
                    </button>
                  )}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
