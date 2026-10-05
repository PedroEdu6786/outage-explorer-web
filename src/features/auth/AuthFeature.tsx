"use client";

import type { ReactNode } from "react";
import { Button } from "../../components/atoms/Button";
import { AuthTemplate } from "../../components/templates/AuthTemplate";
import type { SessionOperations } from "../../contracts/session";
import type { SessionRuntime } from "../../session/session-runtime";
import { SessionBoundary } from "./SessionBoundary";
import { SignInPanel } from "./SignInPanel";
import { useAuth } from "./useAuth";

export interface AuthControls {
  readonly signOut: () => void;
}

export interface AuthFeatureProps {
  readonly operations: SessionOperations;
  /** Composition creates one runtime shared by all features. */
  readonly runtime: SessionRuntime;
  /** Called only after authoritative session resolution. */
  readonly children?: (controls: AuthControls) => ReactNode;
}

export function AuthFeature({ operations, runtime, children }: AuthFeatureProps) {
  const auth = useAuth(operations, runtime);
  const controls: AuthControls = { signOut: () => { void auth.signOut(); } };
  const content = auth.session.status === "authenticated"
    ? children ? children(controls) : <AuthTemplate title="You're signed in"
      description={auth.session.session.identity.displayName}
      actions={<Button onClick={controls.signOut}>Sign out</Button>} />
    : null;
  return <SessionBoundary session={auth.session} fallback={<SignInPanel
    session={auth.session} activity={auth.activity}
    onSignIn={() => { void auth.signIn(); }}
    onResolve={() => { void auth.resolve(); }}
    onSignOut={controls.signOut}
  />}>{content}</SessionBoundary>;
}
