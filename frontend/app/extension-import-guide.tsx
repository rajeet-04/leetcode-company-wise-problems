"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLocalSync } from "./local-sync-bridge";
import { useProgress } from "./progress-provider";

const FALLBACK_RESULT_TYPE = "LEET_PROGRESS_FALLBACK_RESULT";
const LEETCODE_ORIGIN = "https://leetcode.com";
const HISTORY_QUERY = "query userProgressQuestionList($filters: UserProgressQuestionListInput) { userProgressQuestionList(filters: $filters) { totalNum questions { frontendId titleSlug questionStatus } } }";

function buildFallbackScript(appOrigin: string): string {
  return `(async()=>{const APP_ORIGIN=${JSON.stringify(appOrigin)};const QUERY=${JSON.stringify(HISTORY_QUERY)};const LIMIT=50;let skip=0,total=Infinity;const solved=new Set();try{while(skip<total){const response=await fetch('/graphql/',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json','x-operation-name':'userProgressQuestionList'},body:JSON.stringify({operationName:'userProgressQuestionList',variables:{filters:{skip,limit:LIMIT}},query:QUERY})});if(!response.ok)throw new Error('HTTP '+response.status);const json=await response.json();if(json.errors)throw new Error('LeetCode GraphQL error');const result=json&&json.data&&json.data.userProgressQuestionList;if(!result||typeof result.totalNum!=='number'||!Array.isArray(result.questions))throw new Error('LeetCode progress response changed');total=result.totalNum;for(const item of result.questions){if(item&&item.questionStatus==='SOLVED'&&typeof item.titleSlug==='string'&&item.titleSlug)solved.add(item.titleSlug);}if(!result.questions.length)break;skip+=LIMIT;}if(!window.opener)throw new Error('Open this page from Leet Progress first');window.opener.postMessage({type:'${FALLBACK_RESULT_TYPE}',version:1,ok:true,slugs:[...solved].sort()},APP_ORIGIN);}catch(error){if(window.opener)window.opener.postMessage({type:'${FALLBACK_RESULT_TYPE}',version:1,ok:false,error:error instanceof Error?error.message:'Import failed'},APP_ORIGIN);console.error('Leet Progress fallback import failed',error);}})();`;
}

export function ExtensionImportGuide({ onClose }: { onClose: () => void }) {
  const { createLocalBackup, importSolved, mergeLocalBackup, ready } = useProgress();
  const { diagnostics, syncNow } = useLocalSync();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fallbackWindowRef = useRef<Window | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== LEETCODE_ORIGIN || event.source !== fallbackWindowRef.current) return;
      const data = event.data as { type?: unknown; version?: unknown; ok?: unknown; slugs?: unknown; error?: unknown };
      if (data?.type !== FALLBACK_RESULT_TYPE || data.version !== 1) return;
      if (data.ok !== true) {
        setStatus(typeof data.error === "string" ? `LeetCode import failed: ${data.error}` : "LeetCode import failed.");
        return;
      }
      const slugs = Array.isArray(data.slugs)
        ? [...new Set(data.slugs.filter((item): item is string => typeof item === "string").map((item) => item.trim().toLowerCase()).filter((item) => /^[a-z0-9-]+$/.test(item)))]
        : [];
      importSolved(slugs);
      setStatus(slugs.length ? `Received ${slugs.length} solved problems from LeetCode and merged them locally.` : "LeetCode returned no solved problems.");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [importSolved]);

  const openProgressWithExtension = () => {
    window.open("https://leetcode.com/progress/", "_blank", "noopener,noreferrer");
    setStatus("LeetCode Progress opened. With the extension installed, solved history syncs automatically. Return here and use Sync now if the website has not updated yet.");
  };

  const openFallbackProgress = () => {
    const popup = window.open("https://leetcode.com/progress/", "leet-progress-fallback", "popup,width=1200,height=900");
    fallbackWindowRef.current = popup;
    setStatus(popup ? "LeetCode Progress opened. Copy the one-time import script below, paste it into that tab’s DevTools Console, and press Enter." : "Popup blocked. Allow popups, then try the no-extension import again.");
  };

  const copyFallbackScript = async () => {
    try {
      await navigator.clipboard.writeText(buildFallbackScript(window.location.origin));
      setStatus("One-time import script copied. Paste it only into the Console on the LeetCode Progress tab opened from this dialog.");
    } catch {
      setStatus("Clipboard access was blocked. Allow clipboard permission and try again.");
    }
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
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/20 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="import-title" className="my-6 w-full max-w-2xl rounded-[28px] bg-[#fbfbf9] p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#6878e8]">LeetCode history</p>
            <h2 id="import-title" className="mt-2 text-2xl font-semibold tracking-tight">Import solved problems.</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close import dialog" className="rounded-full px-2 text-xl text-black/35 focus:outline-none focus:ring-2 focus:ring-[#6878e8]">×</button>
        </div>

        <p className="mt-4 text-sm leading-6 text-black/55">Choose the path that matches this browser. Both methods keep the imported solved slugs in your local Leet Progress data.</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm font-semibold">With extension</p><p className="mt-1 text-xs text-black/45">{syncLabel}</p></div>
              <span className="rounded-full bg-[#6878e8]/10 px-2.5 py-1 text-[10px] font-semibold text-[#5364da]">Recommended</span>
            </div>
            <ol className="mt-4 grid gap-2 text-xs text-black/55">
              <Step n="1" text="Install the extension once from GitHub if this browser is not linked yet." />
              <Step n="2" text="Open LeetCode Progress while signed in. Solved history syncs automatically." />
              <Step n="3" text="Return here; local extension sync updates the website." />
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              {diagnostics.state !== "connected" && <Link href="/extension" onClick={onClose} className="rounded-full bg-[#6878e8] px-4 py-2.5 text-xs font-semibold text-white">Install / set up extension</Link>}
              <button type="button" onClick={openProgressWithExtension} className="rounded-full bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white">Open LeetCode Progress</button>
              <button type="button" onClick={syncNow} className="rounded-full border border-black/10 px-3 py-2.5 text-xs font-semibold">Sync now</button>
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-sm font-semibold">Without extension</p>
            <p className="mt-1 text-xs leading-5 text-black/45">Fallback for browsers where the extension is missing or unavailable. It uses your existing LeetCode session and sends only solved slugs back to this tab.</p>
            <ol className="mt-4 grid gap-2 text-xs text-black/55">
              <Step n="1" text="Open LeetCode Progress from the button below." />
              <Step n="2" text="Copy the one-time import script and paste it into that tab’s DevTools Console." />
              <Step n="3" text="Press Enter; the solved list returns to this Leet Progress tab." />
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={openFallbackProgress} className="rounded-full bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white">Open fallback tab</button>
              <button type="button" onClick={copyFallbackScript} className="rounded-full border border-black/10 px-3 py-2.5 text-xs font-semibold">Copy one-time import script</button>
            </div>
          </section>
        </div>

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
  return <li className="flex list-none gap-2 rounded-xl bg-black/[.035] p-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#6878e8] text-[11px] font-bold text-white">{n}</span><span className="leading-5">{text}</span></li>;
}
