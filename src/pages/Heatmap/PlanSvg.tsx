import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { inPoly, polyBox, polyCentroid, type AreaOccupancy, type FloorPlan, type GymPlan, type PlanArea, type Pt } from '../../data/floors';
import { useI18n } from '../../i18n';
import type { ThemeName } from '../../theme/chartTokens';
import { heatColor, inkOn } from './scale';
import { usePeopleText } from './people';

/*
  Floors drawn to scale in one SVG (metres), so two floors side by side always share the same scale.
  The plan is never mirrored in Arabic; only the labels are translated.
  Each counted area is filled by its share of capacity, with a soft glow around the crowded spots on top.
*/

export interface PlanSvgProps {
  plan: GymPlan;
  floors: FloorPlan[];
  /** Occupancy by BMS area id. */
  occ: Map<string, AreaOccupancy>;
  theme: ThemeName;
  /** Small version: no labels on the plan (names on hover), no scale bar. */
  compact?: boolean;
  selected?: string | null;
  onSelect?: (key: string) => void;
  /** Hover tooltip content for an area. */
  tooltip?: (area: PlanArea) => ReactNode;
  /** Crop a single floor to its own outline (phones). */
  crop?: boolean;
  className?: string;
}

const PAD = 1.4;
const GAP = 7;
const pts = (p: Pt[]) => p.map(([x, y]) => `${x},${y}`).join(' ');

/** Deterministic pseudo-random points inside an area box, stable over time (crowd clusters). */
function clusterPoints(a: PlanArea, n: number): Pt[] {
  let h = 2166136261;
  for (const c of a.key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rnd = () => { h = Math.imul(h ^ (h >>> 13), 0x5bd1e995); h ^= h >>> 15; return ((h >>> 0) % 10000) / 10000; };
  const [x0, y0, x1, y1] = polyBox(a.points);
  const inset = Math.min(x1 - x0, y1 - y0) * 0.18;
  const out: Pt[] = [];
  // keep only points inside the shape (L-shapes and the running track ring)
  for (let tries = 0; out.length < n && tries < n * 30; tries++) {
    const q: Pt = [x0 + inset + rnd() * (x1 - x0 - 2 * inset), y0 + inset + rnd() * (y1 - y0 - 2 * inset)];
    if (inPoly(q, a.points)) out.push(q);
  }
  if (!out.length) out.push(a.labelAt ?? polyCentroid(a.points));
  return out;
}

interface Frame { floor: FloorPlan; dx: number; dy: number; ghost: boolean }

export function PlanSvg({ plan, floors, occ, theme, compact, selected, onSelect, tooltip, crop, className = '' }: PlanSvgProps) {
  const { pick, fmtNumber, t } = useI18n();
  const ppl = usePeopleText();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [hover, setHover] = useState<{ key: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // ---------- layout: one floor in the building frame, several floors cropped and side by side ----------
  const multi = floors.length > 1 || !!crop;
  const captions = floors.length > 1;
  const frames: Frame[] = useMemo(() => {
    if (!multi) return floors.map((floor) => ({ floor, dx: 0, dy: 0, ghost: !compact && !!floor.ghost }));
    const boxes = floors.map((f) => polyBox(f.outline));
    const bottom = Math.max(...boxes.map((b) => b[3]));
    let cursor = 0;
    return floors.map((floor, i) => {
      const [x0, , x1, y1] = boxes[i];
      const fr = { floor, dx: cursor - x0, dy: bottom - y1, ghost: false };
      cursor += x1 - x0 + GAP;
      return fr;
    });
  }, [floors, multi, compact]);

  const ext = useMemo(() => {
    if (!multi) return { x0: 0, y0: 0, x1: plan.width, y1: plan.depth };
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const f of frames) {
      const [a, b, c, d] = polyBox(f.floor.outline);
      x0 = Math.min(x0, a + f.dx); y0 = Math.min(y0, b + f.dy); x1 = Math.max(x1, c + f.dx); y1 = Math.max(y1, d + f.dy);
    }
    return { x0, y0, x1, y1 };
  }, [frames, multi, plan]);

  // captions and the scale bar take a fixed on-screen height; convert with the last measured scale
  const [ppmGuess, setPpmGuess] = useState(10);
  const capM = captions ? 22 / ppmGuess : 0;
  const barM = compact ? 0 : 26 / ppmGuess;
  const vbX = ext.x0 - PAD;
  const vbY = ext.y0 - PAD - capM;
  const vbW = ext.x1 - ext.x0 + PAD * 2;
  const vbH = ext.y1 - ext.y0 + PAD * 2 + capM + barM;
  const ppm = size.w && size.h ? Math.min(size.w / vbW, size.h / vbH) : ppmGuess;
  useEffect(() => { if (Math.abs(ppm - ppmGuess) > 0.05) setPpmGuess(ppm); }, [ppm, ppmGuess]);
  const px = (n: number) => n / ppm;

  const areaOcc = (a: PlanArea) => occ.get(`${plan.clubId}:${a.key}`);

  // glow blobs: seeded clusters inside each area, sized by crowding
  const blobsFor = (floor: FloorPlan) => {
    const out: { key: string; x: number; y: number; r: number; o: number }[] = [];
    for (const a of floor.areas) {
      const o = areaOcc(a);
      if (!a.monitored || !o || o.people <= 0) continue;
      const ratio = Math.min(1.15, o.ratio);
      const [x0, y0, x1, y1] = polyBox(a.points);
      const span = Math.sqrt((x1 - x0) * (y1 - y0));
      const c = a.labelAt ?? polyCentroid(a.points);
      if (ratio > 0.35) out.push({ key: a.key, x: c[0], y: c[1], r: span * (0.35 + ratio * 0.3), o: 0.25 + ratio * 0.45 });
      const n = Math.min(10, Math.max(1, Math.round((o.people / Math.max(1, a.capacity)) * 8)));
      const thin = Math.min(x1 - x0, y1 - y0);
      for (const [x, y] of clusterPoints(a, n)) out.push({ key: a.key, x, y, r: Math.max(1.4, Math.min(5, span / 4.5, thin * 0.9)), o: 0.25 + ratio * 0.5 });
    }
    return out;
  };

  const ink = theme === 'dark' ? '#ffffff' : '#020c0a';
  const wall = theme === 'dark' ? 'rgba(255,255,255,0.55)' : 'rgba(2,12,10,0.55)';
  const thin = theme === 'dark' ? 'rgba(2,12,10,0.9)' : 'rgba(255,255,255,0.95)';
  const muted = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(2,12,10,0.55)';
  const hatch = theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(2,12,10,0.07)';
  const serviceFill = theme === 'dark' ? '#101917' : '#f6f7f7';
  const font = 'var(--font-body)';

  const move = (a: PlanArea) => (e: React.PointerEvent) => {
    const r = wrap.current?.getBoundingClientRect();
    if (!r) return;
    setHover({ key: a.key, x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const hovered = hover ? floors.flatMap((f) => f.areas).find((a) => a.key === hover.key) : undefined;
  // keep the tooltip inside the plan box
  const tipX = hover ? Math.max(130, Math.min(size.w - 130, hover.x)) : 0;
  const tipBelow = hover ? hover.y < 150 : false;

  return (
    <div ref={wrap} className={`hm-svgwrap ${compact ? 'is-compact' : ''} ${className}`.trim()} dir="ltr" onPointerLeave={() => setHover(null)}
      style={{ ['--hm-ar' as string]: `${vbW} / ${vbH}` }}>
      <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} preserveAspectRatio="xMidYMid meet" role="img"
        aria-label={floors.map((f) => pick(f.nameEn, f.nameAr)).join(', ')} className="hm-svg">
        <defs>
          <pattern id={`hatch-${uid}`} patternUnits="userSpaceOnUse" width={1.2} height={1.2} patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={1.2} stroke={hatch} strokeWidth={0.45} />
          </pattern>
          {frames.map((f) => (
            <clipPath key={f.floor.id} id={`clip-${uid}-${f.floor.id}`}><polygon points={pts(f.floor.outline)} /></clipPath>
          ))}
          {floors.flatMap((f) => f.areas).filter((a) => a.monitored).map((a) => {
            const c = heatColor(areaOcc(a)?.ratio ?? 0, theme);
            return (
              <radialGradient key={a.key} id={`glow-${uid}-${a.key}`}>
                <stop offset="0%" stopColor={c} stopOpacity={1} />
                <stop offset="45%" stopColor={c} stopOpacity={0.55} />
                <stop offset="100%" stopColor={c} stopOpacity={0} />
              </radialGradient>
            );
          })}
        </defs>

        {frames.map(({ floor, dx, dy, ghost }) => {
          const blobs = blobsFor(floor);
          const [fx0, fy0] = polyBox(floor.outline);
          return (
            <g key={floor.id} transform={`translate(${dx} ${dy})`}>
              {captions && (
                <text x={fx0} y={fy0 - px(10)} fontSize={px(12)} fill={muted} fontFamily={font}>{pick(floor.nameEn, floor.nameAr)}</text>
              )}
              {ghost && floor.ghost && (
                <polygon points={pts(floor.ghost)} fill="none" stroke={muted} strokeWidth={px(1)} strokeDasharray={`${px(5)} ${px(4)}`} />
              )}

              <polygon points={pts(floor.outline)} fill={serviceFill} />

              {floor.areas.map((a) => {
                const o = areaOcc(a);
                const fill = a.monitored ? heatColor(o?.ratio ?? 0, theme) : `url(#hatch-${uid})`;
                return (
                  <polygon key={a.key} points={pts(a.points)} fill={fill} fillOpacity={a.monitored ? (theme === 'dark' ? 0.8 : 0.88) : 1}
                    stroke={thin} strokeWidth={px(1.5)} className={`hm-area ${a.monitored ? 'is-counted' : 'is-service'}`}
                    style={{ transition: 'fill 0.6s ease' }}
                    onPointerMove={move(a)} onPointerEnter={move(a)}
                    onClick={a.monitored && onSelect ? () => onSelect(a.key) : undefined} />
                );
              })}

              {floor.areas.filter((a) => a.detail).map((a) => (
                <polygon key={`d-${a.key}`} points={pts(a.detail!)} fill="none" stroke={thin} strokeOpacity={0.7} strokeWidth={px(1)}
                  strokeDasharray={`${px(4)} ${px(3)}`} style={{ pointerEvents: 'none' }} />
              ))}

              <g clipPath={`url(#clip-${uid}-${floor.id})`} style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'multiply', pointerEvents: 'none' }}>
                {blobs.map((b, i) => (
                  <circle key={`${b.key}-${i}`} cx={b.x} cy={b.y} r={b.r} fill={`url(#glow-${uid}-${b.key})`} opacity={b.o} />
                ))}
              </g>

              <polygon points={pts(floor.outline)} fill="none" stroke={wall} strokeWidth={px(compact ? 1.5 : 2.5)} style={{ pointerEvents: 'none' }} />
              {floor.entrance && (() => {
                const e = floor.entrance;
                const [ex, ey] = e.at;
                const h = e.width / 2;
                const col = theme === 'dark' ? '#fcea10' : '#020c0a';
                return (
                  <g style={{ pointerEvents: 'none' }}>
                    <line x1={e.vertical ? ex : ex - h} y1={e.vertical ? ey - h : ey} x2={e.vertical ? ex : ex + h} y2={e.vertical ? ey + h : ey}
                      stroke={col} strokeWidth={px(compact ? 3 : 5)} />
                    {!compact && (e.vertical
                      ? <text x={ex} y={ey - h - px(7)} textAnchor="end" fontSize={px(11)} fill={muted} fontFamily={font}>{t('heatmap.legend.entrance')}</text>
                      : <text x={ex} y={ey + px(15)} textAnchor="middle" fontSize={px(11)} fill={muted} fontFamily={font}>{t('heatmap.legend.entrance')}</text>)}
                  </g>
                );
              })()}

              {floor.areas.filter((a) => a.key === selected || (compact && a.key === hover?.key)).map((a) => (
                <polygon key={`sel-${a.key}`} points={pts(a.points)} fill="none" stroke={ink} strokeWidth={px(3)} style={{ pointerEvents: 'none' }} />
              ))}

              {!compact && floor.areas.map((a) => {
                const [x0, y0, x1, y1] = polyBox(a.points);
                const [bw, bh] = a.labelBox ?? [x1 - x0, y1 - y0];
                const wPx = bw * ppm;
                const hPx = bh * ppm;
                const [cx, cy] = a.labelAt ?? polyCentroid(a.points);
                const name = pick(a.nameEn, a.nameAr);
                if (!a.monitored) {
                  const fs = 11;
                  if (wPx < name.length * fs * 0.55 || hPx < 18) return null;
                  return (
                    <text key={`l-${a.key}`} x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={px(fs)} fill={muted} fontFamily={font} style={{ pointerEvents: 'none' }}>
                      {name}
                    </text>
                  );
                }
                const o = areaOcc(a);
                const ratio = o?.ratio ?? 0;
                const col = inkOn(ratio, theme);
                const halo = heatColor(ratio, theme);
                const pct = `${fmtNumber(Math.round(ratio * 100))}%`;
                const big = wPx > 130 && hPx > 84;
                const mid = wPx > 66 && hPx > 48;
                const haloProps = { stroke: halo, strokeWidth: px(3.5), strokeOpacity: 0.9, paintOrder: 'stroke' as const, strokeLinejoin: 'round' as const };
                if (!mid) {
                  if (wPx < 34 || hPx < 18) return null;
                  return (
                    <text key={`l-${a.key}`} x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={px(12)} fill={col} fontFamily="var(--font-num)" style={{ pointerEvents: 'none' }} {...haloProps}>{pct}</text>
                  );
                }
                const fsBase = big ? 13 : 11;
                // shrink a long name down to 9 px before cutting it
                const fsName = Math.max(9, Math.min(fsBase, (wPx - 8) / (name.length * 0.55)));
                const fsPct = big ? 26 : 17;
                const fsPeople = big ? 12 : 10;
                const maxChars = Math.floor((wPx - 8) / (fsName * 0.55));
                const shown = name.length > maxChars ? `${name.slice(0, Math.max(3, maxChars - 1))}…` : name;
                return (
                  <g key={`l-${a.key}`} style={{ pointerEvents: 'none' }}>
                  <g fill={col} {...haloProps}>
                    <text x={cx} y={cy - px(fsPct * 0.62 + 2)} textAnchor="middle" fontSize={px(fsName)} fontFamily={font}>{shown}</text>
                    <text x={cx} y={cy + px(fsPct * 0.36)} textAnchor="middle" fontSize={px(fsPct)} fontFamily="var(--font-display)">{pct}</text>
                    <text x={cx} y={cy + px(fsPct * 0.36 + fsPeople + 4)} textAnchor="middle" fontSize={px(fsPeople)} fontFamily={font}>{ppl(o?.people ?? 0)}</text>
                  </g>
                  </g>
                );
              })}
            </g>
          );
        })}

        {!compact && (
          <g style={{ pointerEvents: 'none' }} transform={`translate(${ext.x0} ${ext.y1 + PAD + px(12)})`}>
            <line x1={0} y1={0} x2={10} y2={0} stroke={muted} strokeWidth={px(1.5)} />
            <line x1={0} y1={-px(4)} x2={0} y2={px(4)} stroke={muted} strokeWidth={px(1.5)} />
            <line x1={10} y1={-px(4)} x2={10} y2={px(4)} stroke={muted} strokeWidth={px(1.5)} />
            <text x={10 + px(6)} y={0} dominantBaseline="middle" fontSize={px(10)} fill={muted} fontFamily={font}>{t('heatmap.legend.scale')}</text>
          </g>
        )}
      </svg>
      {hover && hovered && tooltip && (
        <div className={`hm-tip ${tipBelow ? 'is-below' : ''}`} style={{ left: tipX, top: hover.y }} dir={document.documentElement.dir || 'ltr'}>{tooltip(hovered)}</div>
      )}
    </div>
  );
}
