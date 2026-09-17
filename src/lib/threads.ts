import type { UIMessage } from "ai";

export interface ThreadRecord {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: UIMessage[];
}

const STORAGE_KEY = "forja.threads.v1";

function safeParse(raw: string | null): ThreadRecord[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (t): t is ThreadRecord =>
        !!t &&
        typeof t === "object" &&
        typeof (t as ThreadRecord).id === "string" &&
        Array.isArray((t as ThreadRecord).messages),
    );
  } catch {
    return [];
  }
}

export function loadThreads(): ThreadRecord[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY)).sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );
}

export function getThread(id: string): ThreadRecord | undefined {
  return loadThreads().find((t) => t.id === id);
}

function persist(threads: ThreadRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

export function createThread(): ThreadRecord {
  const now = Date.now();
  const thread: ThreadRecord = {
    id: crypto.randomUUID(),
    title: "Nueva conversación",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  persist([thread, ...loadThreads()]);
  return thread;
}

export function saveThreadMessages(id: string, messages: UIMessage[]) {
  const threads = loadThreads();
  const index = threads.findIndex((t) => t.id === id);
  const current = threads[index];
  if (!current) return;
  const firstUserText = messages
    .find((m) => m.role === "user")
    ?.parts.map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
  threads[index] = {
    ...current,
    messages,
    updatedAt: Date.now(),
    title:
      current.title === "Nueva conversación" && firstUserText
        ? firstUserText.slice(0, 48)
        : current.title,
  };
  persist(threads);
}

export function deleteThread(id: string) {
  persist(loadThreads().filter((t) => t.id !== id));
}

/** Idempotent bootstrap: returns the thread to show on "/". */
export function bootstrapInitialThread(): ThreadRecord {
  const threads = loadThreads();
  const first = threads[0];
  if (first) return first;
  return createThread();
}
