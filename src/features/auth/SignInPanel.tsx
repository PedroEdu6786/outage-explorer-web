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
export function SignInPanel({
  session,
  activity,
  onSignIn,
  onResolve,
  onSignOut,
}: SignInPanelProps) {
  const failure = activity.status === "failure" ? activity : null;
  const working = activity.status === "working";
  const redirecting = activity.status === "redirecting";
  const pending = session.status === "pending";
  const expired = session.status === "expired";
  const accessDenied = session.status === "access-denied";
  const restoring =
    pending &&
    !failure &&
    !redirecting &&
    (activity.status !== "working" || activity.action === "resolve");
  const retryActions = {
    resolve: { onClick: onResolve, label: "Check session again" },
    logout: { onClick: onSignOut, label: "Retry sign out" },
    login: { onClick: onSignIn, label: "Try sign in again" },
  };
  const signingOut = activity.status === "working" && activity.action === "logout";
  const progressLabel = signingOut
    ? "Signing out"
    : pending
      ? "Checking session"
      : "Preparing sign-in";

  function title() {
    if (restoring) {
      return "Restoring your session";
    }

    if (accessDenied) {
      return "Access denied";
    }

    if (expired) {
      return "Sign in again";
    }

    return "Sign in to your workspace";
  }

  function renderActions() {
    if (restoring) {
      return undefined;
    }

    if (failure) {
      const retry = retryActions[failure.action];

      return (
        <Button className="w-full min-h-[38px]" onClick={retry.onClick}>
          {retry.label}
        </Button>
      );
    }

    if (accessDenied) {
      return (
        <Button
          className="w-full min-h-[38px]"
          loading={working}
          loadingLabel="Checking session…"
          onClick={onResolve}
        >
          Check session
        </Button>
      );
    }

    if (redirecting) {
      return (
        <Button className="w-full min-h-[38px]" onClick={onResolve}>
          Check session
        </Button>
      );
    }

    return (
      <Button
        className="w-full min-h-[38px]"
        loading={working || pending}
        loadingLabel={`${progressLabel}…`}
        onClick={onSignIn}
      >
        Continue to sign in
      </Button>
    );
  }

  function renderStatus() {
    if (failure) {
      const logoutFailed = failure.action === "logout";
      const denied = failure.failure.kind === "forbidden";
      const failureTitle = logoutFailed
        ? "Sign-out not confirmed"
        : denied
          ? "Access denied"
          : "Sign-in unavailable";

      return (
        <StatusMessage
          title={failureTitle}
          description={
            logoutFailed
              ? "Protected content was cleared locally. The service has not confirmed current-session sign-out. Retry to confirm."
              : failure.failure.message
          }
          tone="error"
          announcement="assertive"
        />
      );
    }

    if (redirecting) {
      return (
        <StatusMessage
          title="Complete managed sign-in"
          description="Complete the sign-in flow, then check your application session."
          pending
        />
      );
    }

    if (working || pending) {
      return (
        <StatusMessage
          title={progressLabel}
          description="Protected content is withheld while your session is unresolved."
          pending
        />
      );
    }

    if (accessDenied) {
      return (
        <StatusMessage
          title="Workspace access changed"
          description="Protected content was cleared. Check your session to confirm your current access."
          tone="warning"
        />
      );
    }

    if (expired) {
      return (
        <StatusMessage
          title="Session expired"
          description="Sign in again to continue. Your session does not renew automatically."
          tone="warning"
        />
      );
    }

    return null;
  }

  return (
    <AuthTemplate
      title={title()}
      description={
        restoring
          ? "Checking your existing session. Your workspace will open automatically."
          : "Explore stored daily observations and run read-only analysis."
      }
      footer="Access is determined by your application account."
      actions={renderActions()}
    >
      {renderStatus()}
    </AuthTemplate>
  );
}
