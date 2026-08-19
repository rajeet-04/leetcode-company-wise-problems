import type { CatalogProblem } from "@leet-progress/types";

export type CachedCatalogSnapshot = {
  catalogVersion: string;
  checksum: string;
  problems: CatalogProblem[];
  cachedAt: string;
};

const DB_NAME = "leet-progress-public-catalog";
const DB_VERSION = 1;
const STORE = "snapshots";
const ACTIVE_KEY = "active";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Catalog cache request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Catalog cache transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Catalog cache transaction aborted"));
  });
}

async function openDatabase() {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
  };
  return requestResult(request);
}

export async function loadCachedCatalog(): Promise<CachedCatalogSnapshot | null> {
  if (typeof indexedDB === "undefined") return null;
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE, "readonly");
    const done = transactionDone(transaction);
    const result = await requestResult(transaction.objectStore(STORE).get(ACTIVE_KEY) as IDBRequest<CachedCatalogSnapshot | undefined>);
    await done;
    return result ?? null;
  } finally { database.close(); }
}

export async function saveCachedCatalog(snapshot: CachedCatalogSnapshot): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE, "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore(STORE).put(snapshot, ACTIVE_KEY);
    await done;
  } finally { database.close(); }
}
