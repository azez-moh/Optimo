/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Club, District, RegionId, Role, Scope } from '../data/types';

/**
 * Global scope (all / region / district / club), set from the Kingdom map or the scope pill, plus the
 * signed-in role. Both persist in localStorage (opt.scope, opt.role). Pages read the scope with useScope()
 * and pass it to the selectors in src/data/selectors.ts.
 */

export const ROLES: Role[] = ['coo', 'admin'];
export const REGIONS: RegionId[] = ['riyadh', 'makkah'];

const SCOPE_KEY = 'opt.scope';
const ROLE_KEY = 'opt.role';

function readScope(): Scope {
  try {
    const raw = localStorage.getItem(SCOPE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Scope;
      if (s && typeof s === 'object' && ['all', 'region', 'district', 'club'].includes(s.level)) return s;
    }
  } catch { /* ignore */ }
  return { level: 'all' };
}

function readRole(): Role {
  try {
    const r = localStorage.getItem(ROLE_KEY) as Role | null;
    if (r && ROLES.includes(r)) return r;
  } catch { /* ignore */ }
  return 'coo';
}

export interface ScopeCtx {
  scope: Scope;
  setScope: (s: Scope) => void;
  role: Role;
  setRole: (r: Role) => void;
  isAdmin: boolean;
  /** Clubs inside the current scope. */
  clubs: Club[];
  allClubs: Club[];
  districts: District[];
}

const Ctx = createContext<ScopeCtx | null>(null);

export function FiltersProvider({ children, clubs, districts }: { children: ReactNode; clubs: Club[]; districts: District[] }) {
  const [scope, setScopeState] = useState<Scope>(readScope);
  const [role, setRoleState] = useState<Role>(readRole);

  const setScope = useCallback((s: Scope) => {
    setScopeState(s);
    try { localStorage.setItem(SCOPE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, []);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    try { localStorage.setItem(ROLE_KEY, r); } catch { /* ignore */ }
  }, []);

  const value = useMemo<ScopeCtx>(() => {
    const inScope = scope.level === 'all' ? clubs
      : scope.level === 'region' ? clubs.filter((c) => c.region === scope.region)
      : scope.level === 'district' ? clubs.filter((c) => c.district === scope.district)
      : clubs.filter((c) => c.id === scope.clubId);
    return { scope, setScope, role, setRole, isAdmin: role === 'admin', clubs: inScope.length ? inScope : clubs, allClubs: clubs, districts };
  }, [scope, setScope, role, setRole, clubs, districts]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useScope(): ScopeCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useScope must be used inside <FiltersProvider>');
  return c;
}

/** Dunkin-compatible alias. */
export const useFilters = useScope;
