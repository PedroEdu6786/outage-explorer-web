"use client";
import { useRef, useState } from "react";
import { Button } from "../../components/atoms/Button";
import { Textarea } from "../../components/atoms/Textarea";
export function SqlEditorPanel({ draft, onChange, onRun, busy, disabled }: { readonly draft: string; readonly onChange: (value: string) => void; readonly onRun: () => void; readonly busy: boolean; readonly disabled: boolean }) {
  const lineNumbers = useRef<HTMLDivElement>(null);
  const [copyStatus, setCopyStatus] = useState("");
  async function copy() { try { await navigator.clipboard.writeText(draft); setCopyStatus("SQL copied"); } catch { setCopyStatus("Copy unavailable. Select the SQL text to copy."); } }
  return <section aria-label="SQL editor" className="overflow-hidden rounded-panel border border-[#29414b] bg-editor">
    <div className="flex flex-wrap items-center justify-between gap-2 bg-editor-toolbar px-[14px] py-[7px]"><h2 className="text-[12px] font-bold text-white">Query</h2><div className="flex gap-2"><Button variant="ghost" className="text-[#d9e5e8]" onClick={() => { void copy(); }} disabled={disabled}>Copy</Button><Button onClick={onRun} disabled={disabled || !draft.trim()} loading={busy} loadingLabel="Working…">Run query</Button></div></div>
    <div className="flex min-w-0"><div ref={lineNumbers} aria-hidden="true" className="max-h-[340px] shrink-0 overflow-hidden bg-[#15262e] px-[14px] pt-[14px] text-right font-mono text-[11px] leading-[1.65] text-[#65828f]">{draft.split("\n").map((_, index) => <div key={index}>{index + 1}</div>)}</div><Textarea aria-label="SQL statement" value={draft} onScroll={(event) => { if (lineNumbers.current) lineNumbers.current.scrollTop = event.currentTarget.scrollTop; }} disabled={disabled} rows={16} wrap="off" className="min-h-[310px] rounded-none" onChange={(event) => { onChange(event.currentTarget.value); }} onKeyDown={(event) => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); if (!event.repeat && !event.nativeEvent.isComposing && !busy && !disabled) onRun(); } }} /></div>
    <div className="flex flex-wrap justify-between gap-2 border-t border-[#29414b] px-3 py-2 text-[11px] text-[#9fb3bc]"><span role="status">{copyStatus}</span><span>Ctrl / ⌘ + Enter to run · Read-only SQL</span></div>
  </section>;
}
