import type { AppSettings, Idea, PipelineItem } from "../types";

const DB_NAME = "momflow";
const DB_VERSION = 1;
const STORES = ["ideas", "pipeline", "settings"] as const;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      STORES.forEach((store) => {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: "id" });
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function put<T extends { id: string }>(store: (typeof STORES)[number], value: T) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAll<T>(store: (typeof STORES)[number]) {
  const db = await openDb();
  return new Promise<T[]>((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

async function clear(store: (typeof STORES)[number]) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export const storage = {
  saveIdea: (idea: Idea) => put("ideas", idea),
  savePipeline: (item: PipelineItem) => put("pipeline", item),
  saveSettings: (settings: AppSettings) => put("settings", { id: "settings", ...settings }),
  getIdeas: () => getAll<Idea>("ideas"),
  getPipeline: () => getAll<PipelineItem>("pipeline"),
  async getSettings(): Promise<AppSettings | null> {
    const settings = await getAll<AppSettings & { id: string }>("settings");
    return settings[0] ?? null;
  },
  async exportAll() {
    return {
      ideas: await getAll<Idea>("ideas"),
      pipeline: await getAll<PipelineItem>("pipeline"),
      settings: await this.getSettings()
    };
  },
  async clearAll() {
    await Promise.all(STORES.map((store) => clear(store)));
  }
};
