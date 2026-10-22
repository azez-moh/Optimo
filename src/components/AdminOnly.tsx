import type { ReactNode } from 'react';

// Product rule: no control or page is hidden by role. Every role sees the same
// functions as Build 8.7; destructive actions go through ConfirmDialog instead.
// Kept as a passthrough so existing call sites keep working.
export function AdminOnly({ children }: { children: ReactNode; fallback?: ReactNode }) {
  return <>{children}</>;
}
