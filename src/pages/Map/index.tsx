import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { BrandMark } from '../../components';
import { useI18n } from '../../i18n';
import { useDemo } from '../../data';
import { useScope, REGIONS } from '../../layout/filters';
import { LangToggle, SignOutButton, ThemeToggle } from '../../layout/Shell';
import type { Scope } from '../../data/types';

/**
 * STUB Kingdom map (the map agent replaces this file and its folder). It already wires the scope:
 * pick "All branches", a region or a club, then it opens /overview.
 */
export default function MapPage() {
  const { t, pick } = useI18n();
  const { clubs } = useDemo();
  const { setScope } = useScope();
  const navigate = useNavigate();
  const go = (s: Scope) => { setScope(s); navigate('/overview'); };
  return (
    <div className="mapstub">
      <header className="topbar">
        <BrandMark />
        <div className="topbar__actions"><ThemeToggle /><LangToggle /><SignOutButton /></div>
      </header>
      <main className="shell__content page">
        <h1 className="page-head__title">{t('nav.map')}</h1>
        <div className="card card--pad-none">
          <button type="button" className="mapstub__row" onClick={() => go({ level: 'all' })}>
            <span>{t('scope.all')}</span><span className="muted num">{clubs.length}</span><ChevronRight aria-hidden className="flip-rtl" />
          </button>
          {REGIONS.map((r) => (
            <div key={r}>
              <button type="button" className="mapstub__row" onClick={() => go({ level: 'region', region: r })}>
                <span>{t('scope.allOf', { name: t(`region.${r}`) })}</span><span className="muted num">{clubs.filter((c) => c.region === r).length}</span><ChevronRight aria-hidden className="flip-rtl" />
              </button>
              {clubs.filter((c) => c.region === r).map((c) => (
                <button key={c.id} type="button" className="mapstub__row mapstub__row--club" onClick={() => go({ level: 'club', clubId: c.id })}>
                  <span>{pick(c.nameEn, c.nameAr)}</span><span className="muted">{c.brand === 'optimo' ? 'OPTIMO' : 'B_FIT'}</span><ChevronRight aria-hidden className="flip-rtl" />
                </button>
              ))}
            </div>
          ))}
        </div>
      </main>
      <style>{`.mapstub__row{display:grid;grid-template-columns:1fr auto 16px;gap:12px;align-items:center;width:100%;padding:12px 20px;background:none;border:0;border-block-end:1px solid var(--border);color:var(--text);text-align:start}
.mapstub__row:hover{background:var(--surface-2)}.mapstub__row svg{width:16px;height:16px}.mapstub__row--club{padding-inline-start:40px;color:var(--text-muted)}`}</style>
    </div>
  );
}
