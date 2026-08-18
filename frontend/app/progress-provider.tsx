"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  LEGACY_SOLVED_STORAGE_KEY,
  migrateLegacySolved,
  reduceProgress,
  solvedSlugs,
  type ProblemProgress,
} from "@leet-progress/progress";
import {
  chooseProgressStore,
  type BrowserProgressStore,
} from "@/src/local/progress-store";

type ProgressContextValue = {
  progress: ProblemProgress[];
  solved: Set<string>;
  ready: boolean;
  toggleSolved(slug: string): void;
  importSolved(slugs: readonly string[]): void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

function readLegacySolved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LEGACY_SOLVED_STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function initialProgress(): ProblemProgress[] {
  return migrateLegacySolved([], readLegacySolved(), new Date(0).toISOString());
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProblemProgress[]>(initialProgress);
  const [ready, setReady] = useState(false);
  const storeRef = useRef<BrowserProgressStore | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const store = await chooseProgressStore();
      const existing = await store.listProblems();
      const legacy = readLegacySolved();
      const migrated = migrateLegacySolved(existing, legacy, new Date().toISOString());
      for (const item of migrated) await store.putProblem(item);
      if (!active) return;
      storeRef.current = store;
      setProgress(migrated);
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: ProblemProgress[]) => {
    const store = storeRef.current;
    if (!store) return;
    void Promise.all(next.map((item) => store.putProblem(item)));
  }, []);

  const toggleSolved = useCallback(
    (slug: string) => {
      setProgress((current) => {
        const bySlug = new Map(current.map((item) => [item.slug, item]));
        const existing = bySlug.get(slug);
        const currentlySolved = existing
          ? existing.status === "solved" || existing.status === "revision_due" || existing.status === "mastered"
          : false;
        const nextItem = currentlySolved
          ? reduceProgress(existing, {
              type: "SET_STATUS",
              slug,
              at: new Date().toISOString(),
              status: existing?.attempts ? "attempted" : "unseen",
            })
          : reduceProgress(existing, { type: "SOLVE", slug, at: new Date().toISOString() });
        bySlug.set(slug, nextItem);
        const next = [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const importSolved = useCallback(
    (slugs: readonly string[]) => {
      setProgress((current) => {
        const next = migrateLegacySolved(current, slugs, new Date().toISOString());
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const solved = useMemo(() => solvedSlugs(progress), [progress]);
  const value = useMemo(
    () => ({ progress, solved, ready, toggleSolved, importSolved }),
    [progress, solved, ready, toggleSolved, importSolved],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress must be used inside ProgressProvider");
  return value;
}
