"use client";

import { useRef, useState } from "react";
import { useLocalSync } from "./local-sync-bridge";
import { useProgress } from "./progress-provider";

export function ExtensionImportGuide({ onClose }: { onClose: () => void }) {
  const { createLocalBackup, mergeLocalBackup, ready } = useProgress();
  const { diagnostics, syncNow } = useLocalSync();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const openProgress = () => {
    window.open("https://leetcode.com/progress/", "_blank", "noopener,noreferrer");
    setStatus("On LeetCode Progress, click the Leet Progress ‘Import solved history’ button. Return here when it finishes.");
  };

  const exportBackup = () => {
    const backup = createLocalBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `leet-progress-backup-${backup.exportedAt.slice(0, 10)}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatus("Local backup exported.");
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      mergeLocalBackup(parsed);
      setStatus("Backup merged into local progress. Existing newer records were preserved.");
    } catch (error) {
      setStatus(error instanceof Error ? `Backup import failed: ${error.message}` : "Backup import failed.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const syncLabel = diagnostics.state === "connected"
    ? "Extension linked"
    : diagnostics.state === "checking"
      ? "Checking extension"
      : diagnostics.state === "error"
        ? "Extension not responding"
        : "Extension not detected";

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/20 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="import-title" className="w-full max-w-xl rounded-[28px] bg-[#fbfbf9] p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#6878e8]">Local data</p>
            <h2 id="import-title" className="mt-2 text-2xl font-semibold tracking-tight">Import without DevTools.</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close import dialog" className="rounded-full px-2 text-xl text-black/35 focus:outline-none focus:ring-2 focus:ring-[#6878e8]">×</button>
        </div>

        <p className="mt-4 text-sm leading-6 text-black/55">The browser extension imports solved LeetCode slugs directly from your signed-in Progress page and keeps them in this browser profile. No pasted JavaScript, passwords, or cloud progress upload.</p>

        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm font-semibold">LeetCode solved history</p><p className="mt-1 text-xs text-black/45">{syncLabel}</p></div>
            <button type="button" onClick={syncNow} className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold">Sync now</button>
          </div>
          <ol className="mt-4 grid gap-2 text-xs text-black/55 sm:grid-cols-3">
            <Step n="1" text="Open LeetCode Progress while signed in." />
            <Step n="2" text="Click ‘Import solved history’ in the Leet Progress card." />
            <Step n="3" text="Return here; local extension sync updates the website." />
          </ol>
          <button type="button" onClick={openProgress} className="mt-4 w-full rounded-full bg-[#171717] py-3 text-xs font-semibold text-white">Open LeetCode Progress</button>
        </section>

        <section className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
          <p className="text-sm font-semibold">Portable local backup</p>
          <p className="mt-1 text-xs leading-5 text-black/45">Export or merge a JSON backup for device/browser migration. Merge keeps newer local records when both sides contain the same problem.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={!ready} onClick={exportBackup} className="rounded-full bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40">Export backup</button>
            <button type="button" disabled={!ready} onClick={() => inputRef.current?.click()} className="rounded-full border border-black/10 px-4 py-2.5 text-xs font-semibold disabled:opacity-40">Merge backup</button>
            <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void importBackup(event.target.files?.[0])} />
          </div>
        </section>

        {status && <p role="status" className="mt-4 rounded-xl bg-[#6878e8]/10 px-3 py-2.5 text-xs font-medium text-[#5364da]">{status}</p>}
      </div>
    </div>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return <li className="list-none rounded-xl bg-black/[.035] p-3"><span className="grid size-6 place-items-center rounded-full bg-[#6878e8] text-[11px] font-bold text-white">{n}</span><span className="mt-2 block leading-5">{text}</span></li>;
}
