"use client";
import { Icon } from "../../components/atoms/Icon";
import { Button } from "../../components/atoms/Button";
import { StatusMessage } from "../../components/molecules/StatusMessage";
import type { RefreshOperations, RefreshStatus } from "../../contracts/refresh";
import { refreshActive } from "../../contracts/refresh";
import { useRefresh } from "./useRefresh";

const descriptions: Record<RefreshStatus, string> = {
  accepted: "Refresh accepted. Data retrieval and publication are not complete.",
  running: "Refresh is running. Current data remains available.",
  succeeded: "Refresh completed and new data was published.",
  retained: "Incoming rows were excluded. Previous data was retained.",
  failed: "Refresh failed. Check status before starting another refresh.",
  interrupted: "Refresh was interrupted. Check status before starting another refresh.",
  publication_unknown: "Publication outcome is not yet confirmed. Check status; do not start another refresh.",
};
export function RefreshControl({ operations, onPublished }: { readonly operations?: RefreshOperations | undefined; readonly onPublished: () => void }) {
  const model = useRefresh(operations, onPublished);
  if (!model.canRefresh) return null;
  const activeRun = model.run !== null && refreshActive(model.run.status);
  // Same-key replay recovers an admission; it does not request a new run.
  const admissionDisabled = model.pending || model.denied || (activeRun && !model.retryAdmission);
  return <section aria-label="Admin data refresh" className="mt-3 grid gap-3">
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" disabled={admissionDisabled} onClick={() => { void model.start(); }}>{model.retryAdmission ? "Retry refresh admission" : "Refresh data"}</Button>
      <Button variant="ghost" loading={model.pending} loadingLabel="Contacting refresh…" disabled={model.denied} onClick={() => { void model.check(); }}>Check refresh status</Button>
    </div>
    {model.run && <StatusMessage title={descriptions[model.run.status]} description={`Refresh interval: ${model.run.interval.start} – ${model.run.interval.end}${model.run.stage ? ` · Stage: ${model.run.stage}` : ""}`} pending={refreshActive(model.run.status)} icon={<Icon name={model.run.status === "succeeded" ? "check" : "warning"} size={16} />} tone={model.run.status === "succeeded" ? "success" : model.run.status === "failed" || model.run.status === "interrupted" ? "warning" : "neutral"} />}
    {model.message && <StatusMessage title={model.message} tone="warning" />}
  </section>;
}
