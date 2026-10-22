import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, ChevronRight, Globe, LogOut, MapPin, Menu, Moon, Sun, UserRound, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme/theme';
import { BrandMark, StatusBadge } from '../components';
import { useDemo } from '../data/store';
import { alertsIn } from '../data/selectors';
import { BMS_PAGES, CHAIN_PAGES, SETTINGS_PAGE, VISION_PAGES, type PageDef } from './nav';
import { useScope } from './filters';
import { useAuth } from './auth';
import { scopeLabel } from './scopeLabel';
import './layout.css';

const GROUPS_KEY = 'opt.navGroups';

function readGroups(): { bms: boolean; vision: boolean } {
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    if (raw) return { bms: true, vision: true, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { bms: true, vision: true };
}

export function ThemeToggle() {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const label = theme === 'dark' ? t('shell.themeLight') : t('shell.themeDark');
  return (
    <button type="button" className="btn btn--icon btn--ghost icon-btn" onClick={toggleTheme} aria-label={label} title={label}>
      {theme === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </button>
  );
}

export function LangToggle() {
  const { t, toggleLang, lang } = useI18n();
  return (
    <button type="button" className="btn btn--ghost lang-btn" onClick={toggleLang} aria-label={t('shell.langSwitchLabel')} lang={lang === 'ar' ? 'en' : 'ar'}>
      <Globe aria-hidden />
      <span className="lang-btn__full">{t('shell.langSwitch')}</span>
      <span className="lang-btn__short">{lang === 'ar' ? 'EN' : 'ع'}</span>
    </button>
  );
}

export function SignOutButton() {
  const { t } = useI18n();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <button type="button" className="btn btn--icon btn--ghost icon-btn" onClick={() => { signOut(); navigate('/signin', { replace: true }); }}
      aria-label={t('shell.signOut')} title={t('shell.signOut')}>
      <LogOut aria-hidden className="flip-rtl" />
    </button>
  );
}

export function RoleLabel() {
  const { t } = useI18n();
  const { role } = useScope();
  return (
    <span className="role-label" title={t('role.changeHint')}>
      <UserRound aria-hidden />
      <span className="visually-hidden">{t('role.label')}: </span>
      <span className="role-label__name">{t(`role.${role}Short`)}</span>
    </span>
  );
}

/** Scope pill: current scope, click goes back to the Kingdom map to change it. */
function ScopePill() {
  const i18n = useI18n();
  const { scope } = useScope();
  const { clubs, districts } = useDemo();
  const navigate = useNavigate();
  const label = scopeLabel(scope, i18n, clubs, districts);
  return (
    <button type="button" className="scope-pill" onClick={() => navigate('/map')} title={i18n.t('shell.scopeHint')} aria-label={`${label}. ${i18n.t('shell.scopeHint')}`}>
      <span className="live-dot" aria-hidden />
      <MapPin aria-hidden className="scope-pill__icon" />
      <span className="scope-pill__text">{label}</span>
      <ChevronRight aria-hidden className="scope-pill__chev flip-rtl" />
    </button>
  );
}

/** Bell with the count of open alerts in scope; opens a short list. */
function AlertsBell() {
  const { t, pick, fmtAgo } = useI18n();
  const data = useDemo();
  const { clubs } = useScope();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const list = alertsIn(data, clubs);
  const clubName = (id: string) => { const c = data.clubs.find((x) => x.id === id); return c ? pick(c.shortEn, c.shortAr) : ''; };
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const label = list.length ? t('shell.alertsCount', { n: list.length }) : t('shell.alertsNone');
  return (
    <div className="bell" ref={ref}>
      <button type="button" className="btn btn--icon btn--ghost icon-btn bell__btn" aria-label={label} title={label} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((o) => !o)}>
        <Bell aria-hidden />
        {list.length > 0 && <span className="bell__count num" aria-hidden>{list.length}</span>}
      </button>
      {open && (
        <div className="bell__menu" role="dialog" aria-label={t('shell.alerts')}>
          <div className="bell__head"><span className="label">{t('shell.alerts')}</span><span className="num muted">{list.length}</span></div>
          {list.length === 0 && <p className="bell__empty">{t('shell.alertsNone')}</p>}
          <ul className="bell__list">
            {list.slice(0, 8).map((a) => (
              <li key={a.id} className="bell__item">
                <StatusBadge status={a.level === 'critical' ? 'critical' : a.level === 'warning' ? 'warning' : 'info'} />
                <span className="bell__title">{pick(a.titleEn, a.titleAr)}</span>
                <span className="bell__meta">{clubName(a.clubId)} · {pick(a.areaEn, a.areaAr)} · {fmtAgo((data.now.getTime() - a.sinceMs) / 1000)}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn--sm bell__all" onClick={() => { setOpen(false); navigate('/ai-agents'); }}>{t('shell.alertsViewAll')}</button>
        </div>
      )}
    </div>
  );
}

function NavItem({ p, onNavigate }: { p: PageDef; onNavigate: () => void }) {
  const { t } = useI18n();
  const Icon = p.icon;
  return (
    <li>
      <NavLink to={`/${p.id}`} className="sidenav__link" title={t(`nav.about.${p.key}`)} onClick={onNavigate}>
        <Icon aria-hidden className="sidenav__icon" />
        <span className="sidenav__text">{t(`nav.${p.key}`)}</span>
      </NavLink>
    </li>
  );
}

function NavGroupBlock({ id, label, pages, open, onToggle, onNavigate }: { id: string; label: string; pages: PageDef[]; open: boolean; onToggle: () => void; onNavigate: () => void }) {
  const { t } = useI18n();
  return (
    <div className="sidenav__group">
      <button type="button" className="sidenav__grouphead" aria-expanded={open} aria-controls={`navgroup-${id}`} onClick={onToggle}
        title={open ? t('nav.collapse') : t('nav.expand')}>
        <span className="label">{label}</span>
        <span className="sidenav__groupcount num">{pages.length}</span>
        <ChevronDown aria-hidden className={`sidenav__chev ${open ? '' : 'is-closed'}`} />
      </button>
      {open && <ul id={`navgroup-${id}`} className="sidenav__list">{pages.map((p) => <NavItem key={p.id} p={p} onNavigate={onNavigate} />)}</ul>}
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useI18n();
  const [groups, setGroups] = useState(readGroups);
  const toggle = (k: 'bms' | 'vision') => setGroups((g) => {
    const n = { ...g, [k]: !g[k] };
    try { localStorage.setItem(GROUPS_KEY, JSON.stringify(n)); } catch { /* ignore */ }
    return n;
  });
  return (
    <nav className="sidenav" aria-label={t('nav.main')}>
      <ul className="sidenav__list">
        {CHAIN_PAGES.map((p) => <NavItem key={p.id} p={p} onNavigate={onNavigate} />)}
        <NavItem p={SETTINGS_PAGE} onNavigate={onNavigate} />
      </ul>
      <NavGroupBlock id="bms" label={t('nav.groupBms')} pages={BMS_PAGES} open={groups.bms} onToggle={() => toggle('bms')} onNavigate={onNavigate} />
      <NavGroupBlock id="vision" label={t('nav.groupVision')} pages={VISION_PAGES} open={groups.vision} onToggle={() => toggle('vision')} onNavigate={onNavigate} />
    </nav>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { t } = useI18n();
  return (
    <div className="topbar">
      <button type="button" className="btn btn--icon btn--ghost topbar__menu" onClick={onMenu} aria-label={t('nav.menu')}><Menu aria-hidden /></button>
      <NavLink to="/overview" className="topbar__brand" aria-label={t('app.title')}><BrandMark /></NavLink>
      <ScopePill />
      <div className="topbar__actions">
        <AlertsBell />
        <ThemeToggle />
        <LangToggle />
        <RoleLabel />
        <SignOutButton />
      </div>
    </div>
  );
}

export function Shell() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  useEffect(() => { window.scrollTo(0, 0); setDrawer(false); }, [pathname]);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer]);
  return (
    <div className={`shell ${drawer ? 'is-drawer-open' : ''}`}>
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>{t('shell.skip')}</a>
      <header className="shell__top"><TopBar onMenu={() => setDrawer(true)} /></header>
      <aside className="shell__side" aria-label={t('nav.main')}>
        <div className="shell__sidehead">
          <span className="label">{t('nav.menu')}</span>
          <button type="button" className="btn btn--icon btn--ghost" onClick={() => setDrawer(false)} aria-label={t('nav.closeMenu')}><X aria-hidden /></button>
        </div>
        <Sidebar onNavigate={() => setDrawer(false)} />
        <div className="shell__sidefoot">{t('app.poweredBy')}</div>
      </aside>
      {drawer && <div className="shell__scrim" onClick={() => setDrawer(false)} aria-hidden />}
      <main id="main" tabIndex={-1} className="shell__main">
        <div className="shell__content"><Outlet /></div>
      </main>
    </div>
  );
}
