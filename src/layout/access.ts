import { LIVE_CLUB_ID } from '../data/clubs';
import type { Role, Scope } from '../data/types';
import { useScope } from './filters';
import { useAuth } from './auth';

/*
  One place for what each role may open. Shell (sidebar), routes (guard) and in-page links all read it.
  COO: every page, the Kingdom map and Settings.
  Facility Manager (fm): one gym (OPTIMO Al Malqa (Men)), a short menu and more building control.
*/

/** The only gym a Facility Manager sees. */
export const FM_CLUB_ID = LIVE_CLUB_ID;
export const FM_SCOPE: Scope = { level: 'club', clubId: FM_CLUB_ID };

/** Page ids (route path without the slash) open to the Facility Manager. Everything else is COO only. */
const FM_PAGES = new Set([
  'overview',
  'bms-overview', 'hvac', 'lights', 'ai-agents', 'control', 'bms-settings',
  'live-floor', 'machines', 'reports',
]);

/** True when the role may open the page with this id ('map', 'settings', 'hvac', ...). */
export function canSee(role: Role, pageId: string): boolean {
  if (role === 'coo') return true;
  return FM_PAGES.has(pageId);
}

/** Same check for a path such as "/settings/site-entities?x=1" (first segment decides). */
export function canSeePath(role: Role, path: string): boolean {
  const first = path.replace(/^[#/]+/, '').split(/[/?#]/)[0] || '';
  if (!first) return true;
  return canSee(role, first);
}

/** First page after sign-in. */
export function homeFor(role: Role): string {
  return role === 'fm' ? '/overview' : '/map';
}

/** Whether the role may change the scope (map, scope pill, gym pickers). */
export function canChangeScope(role: Role): boolean {
  return role === 'coo';
}

/** Whether the role sees camera images, camera names and the camera pop-up. */
export function canSeeCameras(role: Role): boolean {
  return role === 'coo';
}

/** Whether the role may edit layouts, delete or remove items and reset history. */
export function canManage(role: Role): boolean {
  return role === 'coo';
}

/** Hook for components: the signed-in role with the checks bound to it. */
export function useAccess() {
  const { role: scopeRole } = useScope();
  const { user } = useAuth();
  const role: Role = user?.role ?? scopeRole;
  return {
    role,
    isFm: role === 'fm',
    can: (pageId: string) => canSee(role, pageId),
    canPath: (path: string) => canSeePath(role, path),
    cameras: canSeeCameras(role),
    manage: canManage(role),
    changeScope: canChangeScope(role),
  };
}
