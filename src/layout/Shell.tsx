import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ArrowLeft, Bell, ChevronDown, Globe, LogOut, MapPin, Menu, Moon, Settings, Sun, UserRound, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme/theme';
import { BrandMark, StatusBadge } from '../components';
import { useDemo } from '../data/store';
import { alertsIn } from '../data/selectors';
import { BMS_PAGES, CHAIN_PAGES, VISION_PAGES, type PageDef } from './nav';
import { useScope } from './filters';
import { useAuth } from './auth';
import { scopeLabel } from './scopeLabel';
import { useAccess } from './access';
import './layout.css';

/*
  App shell: one top bar (logo on the inline start, the menu in the centre, controls and the Settings gear on the
  inline end) and the page below at full width. No sidebar.
  The menu has two levels driven by the global scope:
    network (scope "All branches"): Overview, Ask OPTIMO, Branches
    gym (scope = one gym):          "All branches" back control, gym name, Overview, Ask OPTIMO, BMS Core v, AI Vision v
  The Facility Manager is always at gym level (his gym), without the back control and Branches.
  Under 900px the menu collapses into a menu button that opens a full-height drawer with the same items.
*/

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

/** Small gear in the top bar corner: opens Settings (no longer a menu item). */
function SettingsGear() {
  const { t } = useI18n();
  const { can } = useAccess();
  if (!can('settings')) return null;
  return (
    <NavLink to="/settings" className={({ isActive }) => `btn btn--icon btn--ghost icon-btn topbar__gear${isActive ? ' is-active' : ''}`}
      aria-label={t('nav.settings')} title={t('nav.settings')}>
      <Settings aria-hidden />
    </NavLink>
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

// ---------------------------------------------------------------------------------------------------------
// Menu model
// ---------------------------------------------------------------------------------------------------------

interface MenuGroup { id: 'bms' | 'vision'; label: string; pages: PageDef[] }

function useMenu() {
  const i18n = useI18n();
  const { scope, setScope } = useScope();
  const { clubs, districts } = useDemo();
  const { can, changeScope } = useAccess();
  const navigate = useNavigate();
  const gym = scope.level === 'club';
  const items = CHAIN_PAGES.filter((p) => can(p.id) && (!gym || p.id !== 'branches'));
  const groups: MenuGroup[] = gym
    ? [
      { id: 'bms', label: i18n.t('nav.groupBms'), pages: BMS_PAGES.filter((p) => can(p.id)) },
      { id: 'vision', label: i18n.t('nav.groupVision'), pages: VISION_PAGES.filter((p) => can(p.id)) },
    ].filter((g) => g.pages.length > 0) as MenuGroup[]
    : [];
  const context = scope.level === 'all' ? null : scopeLabel(scope, i18n, clubs, districts);
  const showBack = changeScope && scope.level !== 'all';
  const goNetwork = useCallback(() => { setScope({ level: 'all' }); navigate('/overview'); }, [setScope, navigate]);
  return { gym, items, groups, context, showBack, goNetwork };
}

function BackControl({ onClick, className }: { onClick: () => void; className: string }) {
  const { t } = useI18n();
  return (
    <button type="button" className={className} onClick={onClick} title={t('nav.backToAll')}>
      <ArrowLeft aria-hidden className="flip-rtl" />
      <span>{t('nav.allBranches')}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------------------------------------
// Desktop: centre menu with dropdowns
// ---------------------------------------------------------------------------------------------------------

const canHover = () => typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

function NavDropdown({ group, open, onOpen, onClose }: { group: MenuGroup; open: boolean; onOpen: (by: 'hover' | 'click' | 'key') => void; onClose: () => void }) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const menuId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const leaveTimer = useRef<number>();
  const openedBy = useRef<'hover' | 'click' | 'key'>('click');
  const first = pathname.replace(/^\/+/, '').split(/[/?#]/)[0];
  const active = group.pages.find((p) => p.id === first);

  const links = () => Array.from(menu.current?.querySelectorAll<HTMLAnchorElement>('a') ?? []);
  const focusAt = (i: number) => { const l = links(); if (l.length) l[(i + l.length) % l.length].focus(); };
  const show = (by: 'hover' | 'click' | 'key') => { openedBy.current = by; onOpen(by); };

  const onTriggerKey = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      show('key');
      const last = e.key === 'ArrowUp';
      window.requestAnimationFrame(() => focusAt(last ? -1 : 0));
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      onClose();
    }
  };
  const onMenuKey = (e: ReactKeyboardEvent) => {
    const l = links();
    const i = l.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); focusAt(i + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusAt(i - 1); }
    else if (e.key === 'Home') { e.preventDefault(); focusAt(0); }
    else if (e.key === 'End') { e.preventDefault(); focusAt(-1); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); trigger.current?.focus(); }
  };

  return (
    <li className={`topnav__item topnav__dd${open ? ' is-open' : ''}`}
      onPointerEnter={(e) => { if (e.pointerType !== 'mouse' || !canHover()) return; window.clearTimeout(leaveTimer.current); if (!open) show('hover'); }}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'mouse' || !canHover() || openedBy.current !== 'hover') return;
        leaveTimer.current = window.setTimeout(onClose, 160);
      }}
      onBlur={(e) => { if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) onClose(); }}>
      <button ref={trigger} type="button" className={`topnav__link topnav__trigger${active ? ' active' : ''}`} aria-expanded={open} aria-controls={menuId}
        onClick={() => { if (open && openedBy.current === 'hover') { openedBy.current = 'click'; return; } if (open) onClose(); else show('click'); }}
        onKeyDown={onTriggerKey}>
        <span className="topnav__group">{group.label}</span>
        {active && <span className="topnav__child"><span aria-hidden className="topnav__dot">·</span>{t(`nav.${active.key}`)}</span>}
        <ChevronDown aria-hidden className="topnav__chev" />
      </button>
      <ul id={menuId} ref={menu} className="topnav__menu" hidden={!open} onKeyDown={onMenuKey} aria-label={group.label}>
        {group.pages.map((p) => {
          const Icon = p.icon;
          return (
            <li key={p.id}>
              <NavLink to={`/${p.id}`} className="topnav__mitem" title={t(`nav.about.${p.key}`)} onClick={onClose}>
                <Icon aria-hidden className="topnav__micon" />
                <span>{t(`nav.${p.key}`)}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

function TopNav() {
  const { t } = useI18n();
  const { items, groups, context, showBack, goNetwork } = useMenu();
  const [openId, setOpenId] = useState<string | null>(null);
  const { pathname } = useLocation();
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => { setOpenId(null); }, [pathname]);
  useEffect(() => {
    if (!openId) return;
    const onDoc = (e: MouseEvent) => { if (!navRef.current?.contains(e.target as Node)) setOpenId(null); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [openId]);
  return (
    <nav ref={navRef} className="topnav" aria-label={t('nav.main')}>
      <ul className="topnav__list">
        {(showBack || context) && (
          <li className="topnav__ctx">
            {showBack && <BackControl onClick={goNetwork} className="topnav__back" />}
            {context && (
              <span className="topnav__gym" title={context}>
                <MapPin aria-hidden />
                <span className="visually-hidden">{t('nav.context')}: </span>
                <span className="topnav__gymname">{context}</span>
              </span>
            )}
          </li>
        )}
        {items.map((p) => (
          <li key={p.id} className="topnav__item">
            <NavLink to={`/${p.id}`} className="topnav__link" title={t(`nav.about.${p.key}`)}>{t(`nav.${p.key}`)}</NavLink>
          </li>
        ))}
        {groups.map((g) => (
          <NavDropdown key={g.id} group={g} open={openId === g.id} onOpen={() => setOpenId(g.id)} onClose={() => setOpenId((o) => (o === g.id ? null : o))} />
        ))}
      </ul>
    </nav>
  );
}

// ---------------------------------------------------------------------------------------------------------
// Mobile: full-height drawer with the same items
// ---------------------------------------------------------------------------------------------------------

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { items, groups, context, showBack, goNetwork } = useMenu();
  const { pathname } = useLocation();
  const first = pathname.replace(/^\/+/, '').split(/[/?#]/)[0];
  const activeGroup = groups.find((g) => g.pages.some((p) => p.id === first))?.id;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const isOpen = (id: string) => expanded[id] ?? id === activeGroup;
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    setExpanded({});
    window.requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('button, a')?.focus());
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const link = (p: PageDef, sub = false) => {
    const Icon = p.icon;
    return (
      <li key={p.id}>
        <NavLink to={`/${p.id}`} className={`drawer__link${sub ? ' drawer__link--sub' : ''}`} onClick={onClose}>
          <Icon aria-hidden className="drawer__icon" />
          <span className="drawer__text">{t(`nav.${p.key}`)}</span>
        </NavLink>
      </li>
    );
  };

  return (
    <>
      <div ref={panel} className={`drawer${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label={t('nav.menu')}>
        <div className="drawer__head">
          <span className="label">{t('nav.menu')}</span>
          <button type="button" className="btn btn--icon btn--ghost" onClick={onClose} aria-label={t('nav.closeMenu')}><X aria-hidden /></button>
        </div>
        <nav className="drawer__nav" aria-label={t('nav.main')}>
          {(showBack || context) && (
            <div className="drawer__ctx">
              {showBack && <BackControl onClick={() => { onClose(); goNetwork(); }} className="drawer__back" />}
              {context && <span className="drawer__gym"><MapPin aria-hidden /><span className="visually-hidden">{t('nav.context')}: </span>{context}</span>}
            </div>
          )}
          <ul className="drawer__list">{items.map((p) => link(p))}</ul>
          {groups.map((g) => (
            <div key={g.id} className="drawer__group">
              <button type="button" className="drawer__grouphead" aria-expanded={isOpen(g.id)} aria-controls={`drawer-${g.id}`}
                onClick={() => setExpanded((x) => ({ ...x, [g.id]: !isOpen(g.id) }))}>
                <span>{g.label}</span>
                <span className="drawer__count num">{g.pages.length}</span>
                <ChevronDown aria-hidden className={`drawer__chev${isOpen(g.id) ? '' : ' is-closed'}`} />
              </button>
              <ul id={`drawer-${g.id}`} className="drawer__list" hidden={!isOpen(g.id)}>{g.pages.map((p) => link(p, true))}</ul>
            </div>
          ))}
        </nav>
        <div className="drawer__foot">
          <RoleLabel />
          <span>{t('app.poweredBy')}</span>
        </div>
      </div>
      {open && <div className="drawer__scrim" onClick={onClose} aria-hidden />}
    </>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { t } = useI18n();
  return (
    <div className="topbar">
      <div className="topbar__start">
        <button type="button" className="btn btn--icon btn--ghost topbar__menu" onClick={onMenu} aria-label={t('nav.menu')}><Menu aria-hidden /></button>
        <NavLink to="/overview" className="topbar__brand" aria-label={t('app.title')}><BrandMark /></NavLink>
      </div>
      <TopNav />
      <div className="topbar__actions">
        <AlertsBell />
        <ThemeToggle />
        <LangToggle />
        <RoleLabel />
        <SignOutButton />
        <SettingsGear />
      </div>
    </div>
  );
}

export function Shell() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  const { role: viewerRole } = useScope();
  const closeDrawer = useCallback(() => setDrawer(false), []);
  useEffect(() => { document.documentElement.dataset.role = viewerRole; }, [viewerRole]);
  useEffect(() => { window.scrollTo(0, 0); setDrawer(false); }, [pathname]);
  return (
    <div className="shell">
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>{t('shell.skip')}</a>
      <header className="shell__top"><TopBar onMenu={() => setDrawer(true)} /></header>
      <MobileDrawer open={drawer} onClose={closeDrawer} />
      <main id="main" tabIndex={-1} className="shell__main">
        <div className="shell__content"><Outlet /></div>
      </main>
    </div>
  );
}
