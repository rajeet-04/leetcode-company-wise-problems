import type { ProblemProgress } from "@leet-progress/progress";

export type LocalPreferences = {
  targetCompanies: string[];
  dailyProblemGoal?: number;
};

export interface BrowserProgressStore {
  listProblems(): Promise<ProblemProgress[]>;
  putProblem(progress: ProblemProgress): Promise<void>;
  deleteProblem(slug: string): Promise<void>;
  getPreferences(): Promise<LocalPreferences>;
  putPreferences(preferences: LocalPreferences): Promise<void>;
}

const DB_NAME = "leet-progress-local";
const DB_VERSION = 1;
const PROGRESS_STORE = "progress";
const PREFERENCES_STORE = "preferences";
const FALLBACK_PROGRESS_KEY = "leet-progress-progress-v2";
const FALLBACK_PREFERENCES_KEY = "leet-progress-preferences-v1";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") throw new Error("IndexedDB is unavailable");
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(PROGRESS_STORE)) {
      database.createObjectStore(PROGRESS_STORE, { keyPath: "slug" });
    }
    if (!database.objectStoreNames.contains(PREFERENCES_STORE)) {
      database.createObjectStore(PREFERENCES_STORE);
    }
  };
  return requestResult(request);
}

export class IndexedDbProgressStore implements BrowserProgressStore {
  async listProblems(): Promise<ProblemProgress[]> {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(PROGRESS_STORE, "readonly");
      const done = transactionDone(transaction);
      const rows = await requestResult(transaction.objectStore(PROGRESS_STORE).getAll() as IDBRequest<ProblemProgress[]>);
      await done;
      return rows.sort((a, b) => a.slug.localeCompare(b.slug));
    } finally {
      database.close();
    }
  }

  async putProblem(progress: ProblemProgress): Promise<void> {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(PROGRESS_STORE, "readwrite");
      const done = transactionDone(transaction);
      transaction.objectStore(PROGRESS_STORE).put(progress);
      await done;
    } finally {
      database.close();
    }
  }

  async deleteProblem(slug: string): Promise<void> {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(PROGRESS_STORE, "readwrite");
      const done = transactionDone(transaction);
      transaction.objectStore(PROGRESS_STORE).delete(slug);
      await done;
    } finally {
      database.close();
    }
  }

  async getPreferences(): Promise<LocalPreferences> {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(PREFERENCES_STORE, "readonly");
      const done = transactionDone(transaction);
      const value = await requestResult(transaction.objectStore(PREFERENCES_STORE).get("user") as IDBRequest<LocalPreferences | undefined>);
      await done;
      return value ?? { targetCompanies: [] };
    } finally {
      database.close();
    }
  }

  async putPreferences(preferences: LocalPreferences): Promise<void> {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(PREFERENCES_STORE, "readwrite");
      const done = transactionDone(transaction);
      transaction.objectStore(PREFERENCES_STORE).put(preferences, "user");
      await done;
    } finally {
      database.close();
    }
  }
}

export class LocalStorageProgressStore implements BrowserProgressStore {
  private readProgress(): ProblemProgress[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const value = JSON.parse(localStorage.getItem(FALLBACK_PROGRESS_KEY) ?? "[]") as ProblemProgress[];
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  async listProblems(): Promise<ProblemProgress[]> {
    return this.readProgress().sort((a, b) => a.slug.localeCompare(b.slug));
  }

  async putProblem(progress: ProblemProgress): Promise<void> {
    const rows = new Map(this.readProgress().map((item) => [item.slug, item]));
    rows.set(progress.slug, progress);
    localStorage.setItem(FALLBACK_PROGRESS_KEY, JSON.stringify([...rows.values()]));
  }

  async deleteProblem(slug: string): Promise<void> {
    localStorage.setItem(FALLBACK_PROGRESS_KEY, JSON.stringify(this.readProgress().filter((item) => item.slug !== slug)));
  }

  async getPreferences(): Promise<LocalPreferences> {
    try {
      const parsed = JSON.parse(localStorage.getItem(FALLBACK_PREFERENCES_KEY) ?? "null") as LocalPreferences | null;
      return parsed?.targetCompanies ? parsed : { targetCompanies: [] };
    } catch {
      return { targetCompanies: [] };
    }
  }

  async putPreferences(preferences: LocalPreferences): Promise<void> {
    localStorage.setItem(FALLBACK_PREFERENCES_KEY, JSON.stringify(preferences));
  }
}

export async function chooseProgressStore(): Promise<BrowserProgressStore> {
  const indexed = new IndexedDbProgressStore();
  try {
    await indexed.listProblems();
    return indexed;
  } catch {
    return new LocalStorageProgressStore();
  }
}
