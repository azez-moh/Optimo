import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, Eye } from 'lucide-react';
import { Badge, BarChart, Card, ConfirmDialog, InfoTip, PageHeader, Select, Segmented, Toggle } from '../../components';
import { useI18n } from '../../i18n';
import { useScope } from '../../layout/filters';
import { useChartTokens } from '../../theme/theme';
import {
  acOf, activityIn, agentsOf, alertsIn, areasOf, energyHistory, energyToday, focusClub, lightsOf, presenceOf, savingsSummary, useDemo,
} from '../../data';
import type { Level } from '../../data/types';
import { BuildingViewer, LAYERS, buildZones } from '../BmsOverview/BuildingViewer';
import { floorsOf, riyadhClock } from '../BmsOverview/bms';
import '../BmsOverview/bms.css';

type Agent = ReturnType<typeof agentsOf>[number];

/** Build 8.7 split of avoided energy by cause (percent, sums to 100). */
const CAUSES = [
  { key: 'hvac', pct: 62 },
  { key: 'lighting', pct: 21 },
  { key: 'equipment', pct: 11 },
  { key: 'other', pct: 6 },
];

const SEV: Record<Level, { tone: 'danger' | 'warning' | 'neutral'; icon: typeof Eye; key: string }> = {
  critical: { tone: 'danger', icon: AlertOctagon, key: 'alarm' },
  warning: { tone: 'warning', icon: AlertTriangle, key: 'warning' },
  info: { tone: 'neutral', icon: Eye, key: 'watch' },
};

export default function AiAgentsPage() {
  const { t, pick, fmtNumber, fmtDate } = useI18n();
  const data = useDemo();
  const ct = useChartTokens();
  const { scope } = useScope();
  const club = focusClub(data, scope);
  const building = pick(club.nameEn, club.nameAr);
  const agents = agentsOf(data, club.id);
  const [confirmOff, setConfirmOff] = useState<Agent | null>(null);
  const [agentFilter, setAgentFilter] = useState('all');
  const [period, setPeriod] = useState<'today' | 'month'>('today');

  // ---------- run summary ----------
  const running = agents.filter((a) => a.state?.connected && a.state.running);
  const mayAct = running.filter((a) => !a.readOnly && a.state.mode === 'control');
  const liveSources = running.reduce((s, a) => s + a.state.watching, 0);
  const noSource = agents.filter((a) => !a.state?.connected).length;
  const st = data.settings;

  const setRunning = (a: Agent, on: boolean) => {
    if (on) data.patch('agentStates', `${club.id}:${a.id}`, { running: true });
    else setConfirmOff(a);
  };

  // ---------- activity ----------
  const activity = activityIn(data, [club], 60).filter((e) => agentFilter === 'all' || e.agentId === agentFilter);
  const agentName = (id: string) => { const a = agents.find((x) => x.id === id); return a ? pick(a.nameEn, a.nameAr) : id; };

  // ---------- building ----------
  const areas = areasOf(data, club.id);
  const ac = acOf(data, club.id);
  const lights = lightsOf(data, club.id);
  const presence = presenceOf(data, club.id);
  const zones = useMemo(() => buildZones(areas, ac, lights, presence), [areas, ac, lights, presence]);
  const floors = floorsOf(areas);
  const layers = useMemo(() => new Set(LAYERS.filter((l) => l !== 'labels' && l !== 'presence')), []);

  // ---------- energy ----------
  const hours = energyToday(data, [club]);
  const todayKwh = hours.reduce((s, h) => s + h.kwh, 0);
  const todayAvoided = hours.reduce((s, h) => s + h.avoidedKwh, 0);
  const todayPct = todayKwh + todayAvoided > 0 ? (todayAvoided / (todayKwh + todayAvoided)) * 100 : 0;
  const dayOfMonth = Number(data.live.date.slice(8, 10));
  const month = energyHistory(data, [club], dayOfMonth);
  const weeks = [0, 1, 2, 3, 4].map((w) => {
    const days = month.filter((_, i) => Math.floor(i / 7) === w);
    return { label: `W${w + 1}`, kwh: days.reduce((s, d) => s + d.kwh, 0), avoided: days.reduce((s, d) => s + d.savedKwh, 0), n: days.length };
  }).filter((w) => w.n > 0);
  const monthKwh = month.reduce((s, d) => s + d.kwh, 0);
  const sav = savingsSummary(data, [club]);
  const hourData = hours.filter((h) => h.hour <= data.live.hour).map((h) => ({ x: String(h.hour).padStart(2, '0'), consumed: h.kwh, avoided: h.avoidedKwh }));
  const weekData = weeks.map((w) => ({ x: t('aiAgents.week', { n: w.label.slice(1) }), consumed: Math.round(w.kwh), avoided: Math.round(w.avoided) }));
  const series = [
    { key: 'consumed', label: t('aiAgents.consumed'), color: ct.series[2] },
    { key: 'avoided', label: t('aiAgents.avoided'), slot: 0 },
  ];
  const mwh = (kwh: number) => fmtNumber(kwh / 1000, 2);

  // ---------- alerts ----------
  const rank: Record<Level, number> = { critical: 0, warning: 1, info: 2 };
  const order = (id: string) => Number(/:a(\d+)$/.exec(id)?.[1] ?? 99);
  const alerts = [...alertsIn(data, [club])].sort((a, b) => rank[a.level] - rank[b.level] || order(a.id) - order(b.id));
  const attention = alerts.filter((a) => a.level === 'critical').length;
  const causeColor = [ct.series[0], ct.series[1], ct.series[2], ct.series[3]];

  return (
    <div className="page bms">
      <PageHeader eyebrow={building} title={t('nav.aiAgents')} />

      {/* BMS-11 agent cards */}
      <section aria-label={t('aiAgents.cardsLabel')} className="ag-cards">
        {agents.map((a) => {
          const s = a.state;
          const connected = !!s?.connected;
          const on = connected && s.running;
          return (
            <article key={a.id} className={`ag-card ${connected ? '' : 'ag-card--muted'} ${on ? 'ag-card--on' : ''}`}>
              <div className="ag-card__top">
                <span className="ag-card__num num">{a.num}</span>
                <span className="ag-card__tools">
                  <InfoTip text={pick(a.descEn, a.descAr)} />
                  <Toggle checked={on} disabled={!connected} onChange={(v) => setRunning(a, v)}
                    label={on ? t('aiAgents.switchOff', { name: pick(a.nameEn, a.nameAr) }) : t('aiAgents.switchOn', { name: pick(a.nameEn, a.nameAr) })} />
                </span>
              </div>
              <span className="ag-card__name">{pick(a.nameEn, a.nameAr)}</span>
              <span className="ag-card__domain">{pick(a.domainEn, a.domainAr)}</span>
              {connected ? (
                <>
                  <span className="ag-card__state">{on ? t('aiAgents.watching', { n: fmtNumber(s.watching) }) : t('aiAgents.switchedOff')}</span>
                  <Badge tone="neutral">{a.readOnly || s.mode === 'read' ? t('aiAgents.modeRead') : t('aiAgents.modeControl')}</Badge>
                </>
              ) : <span className="ag-card__state">{t('aiAgents.notConnected')}</span>}
            </article>
          );
        })}
      </section>

      {/* BMS-13 run summary */}
      <div className="ag-run" aria-label={t('aiAgents.runLabel')}>
        <span className="ag-run__chip num">{t('aiAgents.running', { n: fmtNumber(running.length) })}</span>
        <span className="ag-run__chip">{mayAct.length ? t('aiAgents.mayAct', { n: fmtNumber(mayAct.length) }) : t('aiAgents.noneMayAct')}</span>
        <span className="ag-run__chip num">{t('aiAgents.sources', { live: fmtNumber(liveSources), sim: fmtNumber(0), none: fmtNumber(noSource) })}</span>
        <span className="ag-run__text">{t('aiAgents.setback', { c: fmtNumber(st.setbackC), s: fmtNumber(st.setbackAfterSec) })}</span>
        <Link to="/bms-settings" className="btn btn--link btn--sm">{t('aiAgents.modes')}</Link>
      </div>

      <div className="ag-grid">
        {/* BMS-12 activity log */}
        <Card title={t('aiAgents.log')} info={t('aiAgents.info.log')}
          actions={<span className="muted num" style={{ fontSize: 'var(--fs-xs)' }}>{t('aiAgents.logCount', { n: fmtNumber(activity.length) })}</span>}>
          <div className="stack" style={{ gap: 8 }}>
            <Select label={t('aiAgents.filterAgent')} value={agentFilter} onChange={setAgentFilter}
              options={[{ value: 'all', label: t('aiAgents.allAgents') }, ...agents.map((a) => ({ value: a.id, label: pick(a.nameEn, a.nameAr) }))]} />
            <ol className="ag-log">
              {activity.length === 0 && <li className="muted" style={{ padding: '12px 0' }}>{t('aiAgents.logEmpty')}</li>}
              {activity.map((e) => (
                <li key={e.id} className="ag-log__item">
                  <span className="ag-log__time num ltr" title={fmtDate(e.atMs, 'short')}>{riyadhClock(e.atMs, true)}</span>
                  <span className="ag-log__head"><span className="ag-log__agent">{agentName(e.agentId)}</span></span>
                  <span className="ag-log__msg">{pick(e.textEn, e.textAr)}</span>
                </li>
              ))}
            </ol>
          </div>
        </Card>

        <div className="ag-col">
          {/* BMS-14 building */}
          <Card pad="none" title={<span style={{ paddingInlineStart: 0 }}>{building}</span>}
            actions={<span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{t(floors.length === 1 ? 'bmsOverview.floorsOne' : 'bmsOverview.floorsMany', { n: fmtNumber(floors.length) })}</span>}
            className="ag-building-card">
            <div className="ag-building">
              <BuildingViewer zones={zones} floors={floors.map((f) => f.index)} layers={layers} spread={0.5} view="iso" colorBy="state"
                height="100%" compact ariaLabel={t('aiAgents.buildingAria', { name: building })} />
            </div>
          </Card>

          {/* BMS-15 energy consumed vs avoided */}
          <Card title={t('aiAgents.energy')} info={t('aiAgents.info.energy')}
            actions={<Segmented size="sm" ariaLabel={t('aiAgents.period')} value={period} onChange={setPeriod}
              options={[{ value: 'today', label: t('common.today') }, { value: 'month', label: t('aiAgents.monthToDate') }]} />}>
            <div className="stack">
              <div className="ag-headline">
                <div className="ag-headline__item">
                  <span className="ag-headline__label">{t('common.today')}<InfoTip text={t('aiAgents.info.today')} /></span>
                  <span className="ag-headline__value num">{fmtNumber(todayKwh, todayKwh >= 100 ? 0 : 1)}<small>{t('common.kwh')}</small></span>
                </div>
                <div className="ag-headline__item">
                  <span className="ag-headline__label">{t('aiAgents.monthToDate')}<InfoTip text={t('aiAgents.info.month')} /></span>
                  <span className="ag-headline__value num">{mwh(monthKwh)}<small>{t('aiAgents.mwh')}</small></span>
                </div>
              </div>
              {period === 'today'
                ? <BarChart data={hourData} xKey="x" series={series} stacked={false} height={230} xInterval={2}
                  yFormat={(v) => fmtNumber(v, { maximumFractionDigits: 0 })} ariaLabel={t('aiAgents.chartToday')} />
                : <BarChart data={weekData} xKey="x" series={series} stacked={false} height={230}
                  yFormat={(v) => fmtNumber(v, { notation: v >= 1000 ? 'compact' : 'standard', maximumFractionDigits: 1 })} ariaLabel={t('aiAgents.chartMonth')} />}
              <p className="faint" style={{ fontSize: 'var(--fs-xs)' }}>{period === 'today' ? t('aiAgents.axisToday') : t('aiAgents.axisMonth')}</p>
            </div>
          </Card>
        </div>

        <div className="ag-col">
          {/* BMS-16 energy avoided */}
          <Card title={t('aiAgents.avoidedTitle')} info={t('aiAgents.info.avoided')}>
            <div className="stack">
              <div className="ag-avoid__big num">{fmtNumber(todayPct, 1)}%<small>{t('aiAgents.today')}</small></div>
              <div className="ag-avoid__sub">
                <span>{t('aiAgents.monthToDate')} <b className="num ltr">{fmtNumber(sav.month.savedPct, 1)}%</b></span>
                <span>{t('aiAgents.yearToDate')} <b className="num ltr">{fmtNumber(sav.year.savedPct, 1)}%</b></span>
              </div>
              <div className="ag-bar" role="img" aria-label={t('aiAgents.causesLabel')}>
                {CAUSES.map((c, i) => <span key={c.key} style={{ width: `${c.pct}%`, background: causeColor[i] }} />)}
              </div>
              <ul className="ag-causes">
                {CAUSES.map((c, i) => (
                  <li key={c.key}><span><i className="sw" style={{ background: causeColor[i] }} aria-hidden />{t(`aiAgents.cause.${c.key}`)}</span><span className="num ltr">{fmtNumber(c.pct)}%</span></li>
                ))}
              </ul>
            </div>
          </Card>

          {/* BMS-17 alerts */}
          <Card title={t('aiAgents.alerts')} info={t('aiAgents.info.alerts')}
            actions={<span className="muted num" style={{ fontSize: 'var(--fs-xs)' }}>{attention ? t('aiAgents.attention', { n: fmtNumber(attention) }) : t('aiAgents.noAttention')}</span>}>
            <ul className="ag-alerts">
              {alerts.length === 0 && <li className="muted" style={{ padding: '12px 0' }}>{t('aiAgents.alertsEmpty')}</li>}
              {alerts.map((a) => {
                const s = SEV[a.level];
                return (
                  <li key={a.id} className="ag-alert">
                    <div className="ag-alert__top">
                      <Badge tone={s.tone} icon={s.icon}>{t(`aiAgents.sev.${s.key}`)}</Badge>
                      <span className="ag-alert__time num ltr">{riyadhClock(a.sinceMs)}</span>
                    </div>
                    <span className="ag-alert__title">{pick(a.titleEn, a.titleAr)}</span>
                    <span className="ag-alert__where">{pick(a.areaEn, a.areaAr)}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>

      <ConfirmDialog open={!!confirmOff} title={t('aiAgents.confirmTitle', { name: confirmOff ? pick(confirmOff.nameEn, confirmOff.nameAr) : '' })}
        body={t('aiAgents.confirmBody')} confirmLabel={t('aiAgents.confirmCta')}
        onCancel={() => setConfirmOff(null)}
        onConfirm={() => { if (confirmOff) data.patch('agentStates', `${club.id}:${confirmOff.id}`, { running: false }); setConfirmOff(null); }} />
    </div>
  );
}
