import { Button } from "../../components/atoms/Button";
import { StatusMessage } from "../../components/molecules/StatusMessage";
import { AuthTemplate } from "../../components/templates/AuthTemplate";
import type { SessionState } from "../../contracts/session";
import type { AuthActivity } from "./useAuth";

export interface SignInPanelProps {
  readonly session: SessionState;
  readonly activity: AuthActivity;
  readonly onSignIn: () => void;
  readonly onResolve: () => void;
  readonly onSignOut: () => void;
}

/** V1/O5; C1 removes local credentials, C10 extends pending/expiry/recovery. */
export function SignInPanel({ session, activity, onSignIn, onResolve, onSignOut }: SignInPanelProps) {
  const failure = activity.status === "failure" ? activity : null;
  const working = activity.status === "working";
  const redirecting = activity.status === "redirecting";
  const pending = session.status === "pending";
  const expired = session.status === "expired";
  const accessDenied = session.status === "access-denied";
  const restoring = pending && !failure && !redirecting
    && (activity.status !== "working" || activity.action === "resolve");
  const denied = failure?.failure.kind === "forbidden";
  const retry = failure?.action === "resolve" ? onResolve : failure?.action === "logout" ? onSignOut : onSignIn;
  return <AuthTemplate
    title={restoring ? "Restoring your session" : accessDenied ? "Access denied" : expired ? "Sign in again" : "Sign in to your workspace"}
    description={restoring ? "Checking your existing session. Your workspace will open automatically." : "Explore stored daily observations and run read-only analysis."}
    footer="Access is determined by your application account."
    actions={restoring ? undefined : failure ? <Button className="w-full min-h-[38px]" onClick={retry}>
      {failure.action === "logout" ? "Retry sign out" : failure.action === "resolve" ? "Check session again" : "Try sign in again"}
    </Button> : accessDenied ? <Button className="w-full min-h-[38px]" loading={working} loadingLabel="Checking session…" onClick={onResolve}>Check session</Button>
      : redirecting ? <Button className="w-full min-h-[38px]" onClick={onResolve}>Check session</Button>
      : <Button className="w-full min-h-[38px]" loading={working || pending}
        loadingLabel={activity.status === "working" && activity.action === "logout" ? "Signing out…" : pending ? "Checking session…" : "Preparing sign-in…"}
        onClick={onSignIn}>Continue to sign in</Button>}
  >
    {failure ? <StatusMessage title={failure.action === "logout" ? "Sign-out not confirmed" : denied ? "Access denied" : "Sign-in unavailable"}
      description={failure.action === "logout" ? "Protected content was cleared locally. The service has not confirmed current-session sign-out. Retry to confirm." : failure.failure.message}
      tone="error" announcement="assertive" />
      : redirecting ? <StatusMessage title="Complete managed sign-in" description="Complete the sign-in flow, then check your application session." pending />
        : working || pending ? <StatusMessage title={activity.status === "working" && activity.action === "logout" ? "Signing out" : pending ? "Checking session" : "Preparing sign-in"}
          description="Protected content is withheld while your session is unresolved." pending />
          : accessDenied ? <StatusMessage title="Workspace access changed" description="Protected content was cleared. Check your session to confirm your current access." tone="warning" />
            : expired ? <StatusMessage title="Session expired" description="Sign in again to continue. Your session does not renew automatically." tone="warning" /> : null}
  </AuthTemplate>;
}
