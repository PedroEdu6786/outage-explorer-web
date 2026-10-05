import type { ReactNode } from "react";
import type { SessionState } from "../../contracts/session";

export interface SessionBoundaryProps {
  readonly session: SessionState;
  readonly children: ReactNode;
  readonly fallback: ReactNode;
}

/** Withhold the entire protected subtree, including its navigation and effects. */
export function SessionBoundary({ session, children, fallback }: SessionBoundaryProps) {
  return session.status === "authenticated" ? children : fallback;
}
