import type { ReactNode } from 'react';
import { useScope } from '../layout/filters';

/** Renders children only for the Admin role (write and destructive controls). COO sees `fallback` (default nothing). */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { isAdmin } = useScope();
  return <>{isAdmin ? children : fallback}</>;
}
