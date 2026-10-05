"use client";
import { useEffect, useRef, useState } from "react";
import type { RefreshOperations, RefreshSummary } from "../../contracts/refresh";
import { refreshActive } from "../../contracts/refresh";
import { useSessionRuntime, useSessionState } from "../../session/SessionProvider";
import { guardOperation } from "../../session/guard-operation";

export function useRefresh(operations: RefreshOperations | undefined, onPublished: () => void) {
  const runtime = useSessionRuntime(); const session = useSessionState();
  const [run, setRun] = useState<RefreshSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [denied, setDenied] = useState(false);
  const key = useRef<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const published = useRef<string | null>(null);
  useEffect(() => {
    const clear = () => {
      request.current?.abort(); request.current = null; key.current = null; published.current = null;
      setRun(null); setMessage(null); setPending(false); setDenied(false);
    };
    const unregister = runtime.registerCleanup(clear);
    return () => { unregister(); request.current?.abort(); request.current = null; };
  }, [runtime]);
  async function perform(admit: boolean) {
    const currentSession = runtime.getSnapshot();
    if (request.current || denied || currentSession.status !== "authenticated" || !currentSession.session.capabilities.canRefreshDatasets) return;
    if (!operations) { setMessage("Refresh connection unavailable."); return; }
    if (admit && run && refreshActive(run.status)) return;
    const abort = new AbortController(); request.current = abort;
    const context = runtime.capture(abort.signal);
    setPending(true); setMessage(null);
    if (admit) key.current ??= crypto.randomUUID();
    const admissionKey = key.current;
    await guardOperation(runtime, context, () => admit && admissionKey ? operations.admitRefresh(context, admissionKey) : operations.readRefresh(context, run?.runId), {
      onSuccess: (value) => {
        setRun(value); setMessage(value ? null : "No refresh run has been recorded.");
        if (value && !refreshActive(value.status)) key.current = null;
        if (value?.status === "succeeded" && published.current !== value.runId) { published.current = value.runId; onPublished(); }
      },
      onFailure: (failure) => { setMessage(failure.message); if (failure.kind === "forbidden") { setRun(null); setDenied(true); } },
      onRejected: () => { setMessage("Refresh response unavailable. Check status or retry admission deliberately."); },
    });
    if (request.current === abort) { request.current = null; if (runtime.isCurrent(context)) setPending(false); }
  }
  return { run, message, pending, denied, retryAdmission: !pending && key.current !== null && run === null, canRefresh: session.status === "authenticated" && session.session.capabilities.canRefreshDatasets, start: () => perform(true), check: () => perform(false) };
}
