"use client";
import { useEffect, useRef, useState } from "react";
import type { RefreshOperations, RefreshSummary } from "../../contracts/refresh";
import { refreshActive } from "../../contracts/refresh";
import { useSessionRuntime, useSessionState } from "../../session/SessionProvider";
import { guardOperation } from "../../session/guard-operation";

export function useRefresh(operations: RefreshOperations | undefined, onPublished: () => void) {
  const runtime = useSessionRuntime();
  const session = useSessionState();
  const [run, setRun] = useState<RefreshSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [denied, setDenied] = useState(false);
  // A status lookup cannot prove which run belongs to an unconfirmed POST.
  const unconfirmedAdmissionKey = useRef<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const published = useRef<string | null>(null);
  useEffect(() => {
    const clear = () => {
      request.current?.abort();
      request.current = null;
      unconfirmedAdmissionKey.current = null;
      published.current = null;
      setRun(null);
      setMessage(null);
      setPending(false);
      setDenied(false);
    };
    const unregister = runtime.registerCleanup(clear);
    return () => { unregister(); request.current?.abort(); request.current = null; };
  }, [runtime]);
  async function requestRefresh(action: "admit" | "status") {
    const currentSession = runtime.getSnapshot();
    if (request.current || denied || currentSession.status !== "authenticated" || !currentSession.session.capabilities.canRefreshDatasets) return;
    if (!operations) { setMessage("Refresh connection unavailable."); return; }
    if (action === "admit" && !unconfirmedAdmissionKey.current && run && refreshActive(run.status)) return;
    const abort = new AbortController();
    request.current = abort;
    const context = runtime.capture(abort.signal);
    setPending(true);
    setMessage(null);
    if (action === "admit") {
      unconfirmedAdmissionKey.current ??= crypto.randomUUID();
      setRun(null);
    }
    const admissionKey = unconfirmedAdmissionKey.current;
    const statusRunId = admissionKey === null ? run?.runId : undefined;
    await guardOperation(runtime, context, () => {
      if (action === "admit" && admissionKey) return operations.admitRefresh(context, admissionKey);
      return operations.readRefresh(context, statusRunId);
    }, {
      onSuccess: (value) => {
        setRun(value);
        // Only same-key admission replay identifies this request. Latest is global
        // across Admins and must never release another admission's retry key.
        if (action === "admit") unconfirmedAdmissionKey.current = null;
        if (unconfirmedAdmissionKey.current !== null) {
          setMessage("Admission is still unconfirmed. Latest status may belong to another request; retry admission to identify yours.");
        } else {
          setMessage(value ? null : "No refresh run has been recorded.");
        }
        if (value?.status === "succeeded" && published.current !== value.runId) { published.current = value.runId; onPublished(); }
      },
      onFailure: (failure) => { setMessage(failure.message); if (failure.kind === "forbidden") { setRun(null); setDenied(true); } },
      onRejected: () => { setMessage("Refresh response unavailable. Check status or retry admission deliberately."); },
    });
    if (request.current === abort) { request.current = null; if (runtime.isCurrent(context)) setPending(false); }
  }
  return {
    run, message, pending, denied,
    retryAdmission: !pending && unconfirmedAdmissionKey.current !== null,
    canRefresh: session.status === "authenticated" && session.session.capabilities.canRefreshDatasets,
    start: () => requestRefresh("admit"),
    check: () => requestRefresh("status"),
  };
}
