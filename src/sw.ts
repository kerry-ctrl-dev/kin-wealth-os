/* eslint-disable @typescript-eslint/no-explicit-any */
// MalinGu offline service worker.
//
// Caching mirrors what the generated worker did before. The addition is a custom
// write queue that (a) de-duplicates repeated offline edits to the same record
// into one request, and (b) detects server-side changes at replay time and asks
// the user how to resolve them.
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

import {
  MSG_CONFLICT,
  MSG_DRAIN,
  MSG_RESOLVE,
  MSG_SYNCED,
  SYNC_QUEUE_DB,
  SYNC_QUEUE_STORE,
  SYNC_TAG,
  type ConflictResolution,
  type FieldConflict,
  type SyncConflict,
} from "@/lib/offline-sync-protocol";

const sw = self as unknown as {
  addEventListener: (type: string, listener: (event: any) => void) => void;
  skipWaiting: () => Promise<void> | void;
  clients: {
    claim: () => Promise<void>;
    matchAll: (options?: any) => Promise<Array<{ postMessage: (data: any) => void }>>;
  };
  registration: { sync?: { register: (tag: string) => Promise<void> } };
  caches: CacheStorage;
};

// ---------------------------------------------------------------- caching ----

precacheAndRoute((self as any).__WB_MANIFEST);
cleanupOutdatedCaches();

const API_CACHE = "malingu-api";

registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "malingu-pages",
    networkTimeoutSeconds: 4,
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [200] }),
    ],
  }),
);

registerRoute(
  ({ url, request, sameOrigin }) =>
    sameOrigin &&
    (request.destination === "script" ||
      request.destination === "style" ||
      request.destination === "font") &&
    url.pathname.startsWith("/_build/"),
  new CacheFirst({
    cacheName: "malingu-assets",
    plugins: [
      new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [200] }),
    ],
  }),
);

registerRoute(
  ({ url, request }) => request.method === "GET" && url.pathname.startsWith("/rest/v1/"),
  new NetworkFirst({
    cacheName: API_CACHE,
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 30 }),
      new CacheableResponsePlugin({ statuses: [200] }),
    ],
  }),
);

// ------------------------------------------------------------ write queue ----

type QueuedWrite = {
  id: string;
  dedupeKey: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  /** Row as it existed (from cache) when the offline edit was made. */
  baseline: Record<string, any> | null;
  resource: string;
  createdAt: number;
  mergedCount: number;
};

const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"] as const;
const MAX_RETENTION_MS = 1000 * 60 * 60 * 24; // 24h, same as before

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SYNC_QUEUE_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(SYNC_QUEUE_STORE, mode);
        const request = run(transaction.objectStore(SYNC_QUEUE_STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
      }),
  );
}

const allWrites = () => tx<QueuedWrite[]>("readonly", (store) => store.getAll() as any);
const putWrite = (record: QueuedWrite) => tx("readwrite", (store) => store.put(record) as any);
const deleteWrite = (id: string) => tx("readwrite", (store) => store.delete(id) as any);

function tableOf(url: URL): string {
  const rest = url.pathname.split("/rest/v1/")[1];
  if (!rest) return url.pathname;
  return rest.split("?")[0] ?? rest;
}

/** `id=eq.<uuid>` is how supabase-js targets a single row. */
function rowFilter(url: URL): string | null {
  const id = url.searchParams.get("id");
  return id && id.startsWith("eq.") ? id.slice(3) : null;
}

function parseBody(body: string | null): Record<string, any> | null {
  if (!body) return null;
  try {
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed)) return parsed.length === 1 ? parsed[0] : null;
    return typeof parsed === "object" && parsed ? parsed : null;
  } catch {
    return null;
  }
}

/** Best-effort snapshot of the row from the cached GET responses. */
async function cachedRow(table: string, rowId: string): Promise<Record<string, any> | null> {
  try {
    const cache = await sw.caches.open(API_CACHE);
    const requests = await cache.keys();
    for (const request of requests) {
      const url = new URL(request.url);
      if (!url.pathname.includes(`/rest/v1/${table}`)) continue;
      const response = await cache.match(request);
      if (!response) continue;
      const data = await response.clone().json();
      const rows = Array.isArray(data) ? data : [data];
      const hit = rows.find((row: any) => row && row.id === rowId);
      if (hit) return hit;
    }
  } catch {
    /* cache miss is fine — we simply replay without conflict detection */
  }
  return null;
}

/**
 * Queue a failed write, merging it into any pending write for the same record so
 * ten offline edits to one expense replay as one request.
 */
async function enqueue(request: Request): Promise<void> {
  const url = new URL(request.url);
  const body = request.method === "DELETE" ? null : await request.clone().text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const table = tableOf(url);
  const rowId = rowFilter(url);
  const pending = await allWrites();

  const dedupeKey = rowId ? `${table}|${rowId}` : `once|${crypto.randomUUID()}`;
  const existing = rowId ? pending.find((item) => item.dedupeKey === dedupeKey) : undefined;

  const record: QueuedWrite = {
    id: existing?.id ?? crypto.randomUUID(),
    dedupeKey,
    url: request.url,
    method: request.method,
    headers,
    body,
    baseline:
      existing?.baseline ?? (rowId ? await cachedRow(table, rowId) : null),
    resource: table,
    createdAt: existing?.createdAt ?? Date.now(),
    mergedCount: (existing?.mergedCount ?? 0) + 1,
  };

  if (existing) {
    if (existing.method === "DELETE") {
      // Row is already queued for deletion — later edits are meaningless.
      return;
    }
    if (request.method !== "DELETE" && existing.body) {
      // Merge field-level patches: newest value per field wins.
      const merged = { ...(parseBody(existing.body) ?? {}), ...(parseBody(body) ?? {}) };
      record.body = JSON.stringify(merged);
      // An insert that was never sent stays an insert.
      record.method = existing.method === "POST" ? "POST" : request.method;
      record.url = existing.method === "POST" ? existing.url : request.url;
    }
  }

  await putWrite(record);
  try {
    await sw.registration.sync?.register(SYNC_TAG);
  } catch {
    /* Background Sync unavailable — we drain on the next `online` event */
  }
}

for (const method of WRITE_METHODS) {
  registerRoute(
    ({ url }: { url: URL }) =>
      url.pathname.startsWith("/rest/v1/") ||
      url.pathname.startsWith("/rpc/") ||
      url.pathname.includes("/_serverFn/"),
    async ({ request }: { request: Request }) => {
      try {
        return await fetch(request.clone());
      } catch {
        await enqueue(request);
        return new Response("[]", {
          status: 202,
          headers: { "Content-Type": "application/json", "X-Malingu-Queued": "1" },
        });
      }
    },
    method,
  );
}

// --------------------------------------------------- conflict negotiation ----

const pendingResolutions = new Map<string, (resolution: ConflictResolution) => void>();

async function askClients(conflict: SyncConflict): Promise<ConflictResolution> {
  const clients = await sw.clients.matchAll({ type: "window", includeUncontrolled: true } as any);
  if (clients.length === 0) return "later";

  return new Promise<ConflictResolution>((resolve) => {
    let settled = false;
    const finish = (resolution: ConflictResolution) => {
      if (settled) return;
      settled = true;
      pendingResolutions.delete(conflict.id);
      resolve(resolution);
    };
    pendingResolutions.set(conflict.id, finish);
    for (const client of clients) client.postMessage({ type: MSG_CONFLICT, conflict });
    setTimeout(() => finish("later"), 60_000);
  });
}

function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a == null && b == null;
  if (typeof a === "number" || typeof b === "number") return Number(a) === Number(b);
  return JSON.stringify(a) === JSON.stringify(b);
}

function buildHeaders(record: QueuedWrite, overrides: Record<string, string> = {}) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(record.headers)) {
    if (key.toLowerCase() === "content-length") continue;
    headers.set(key, value);
  }
  for (const [key, value] of Object.entries(overrides)) headers.set(key, value);
  return headers;
}

async function fetchServerRow(record: QueuedWrite): Promise<Record<string, any> | null> {
  const url = new URL(record.url);
  const rowId = rowFilter(url);
  if (!rowId) return null;
  const readUrl = new URL(`${url.origin}${url.pathname}`);
  readUrl.searchParams.set("id", `eq.${rowId}`);
  readUrl.searchParams.set("select", "*");
  const response = await fetch(readUrl.toString(), {
    method: "GET",
    headers: buildHeaders(record, { Accept: "application/json" }),
  });
  if (!response.ok) return null;
  const rows = await response.json();
  return Array.isArray(rows) ? (rows[0] ?? null) : rows;
}

/** Fields the offline edit touches where the server moved on since the snapshot. */
function detectConflicts(
  record: QueuedWrite,
  server: Record<string, any>,
): FieldConflict[] {
  const baseline = record.baseline ?? {};
  const local = parseBody(record.body) ?? {};
  const fields = record.method === "DELETE" ? Object.keys(baseline) : Object.keys(local);
  return fields
    .filter((field) => !["id", "user_id", "created_at", "updated_at"].includes(field))
    .filter((field) => !sameValue(baseline[field], server[field]))
    .filter((field) => record.method === "DELETE" || !sameValue(local[field], server[field]))
    .map((field) => ({
      field,
      baseline: baseline[field] ?? null,
      server: server[field] ?? null,
      local: record.method === "DELETE" ? null : (local[field] ?? null),
    }));
}

async function replayRecord(record: QueuedWrite): Promise<"sent" | "dropped" | "kept"> {
  if (Date.now() - record.createdAt > MAX_RETENTION_MS) {
    await deleteWrite(record.id);
    return "dropped";
  }

  let body = record.body;

  // Conflict detection only applies to edits/deletes of an existing row we have a
  // snapshot for. Inserts can't conflict with pre-existing server state.
  if (record.baseline && (record.method === "PATCH" || record.method === "PUT" || record.method === "DELETE")) {
    let server: Record<string, any> | null = null;
    try {
      server = await fetchServerRow(record);
    } catch {
      return "kept"; // still offline
    }

    if (!server) {
      const resolution = await askClients({
        id: record.id,
        kind: "missing",
        resource: record.resource,
        method: record.method,
        mergedCount: record.mergedCount,
        fields: [],
      });
      if (resolution === "later") return "kept";
      if (resolution !== "local") {
        await deleteWrite(record.id);
        return "dropped";
      }
    } else {
      const conflicts = detectConflicts(record, server);
      if (conflicts.length > 0) {
        const resolution = await askClients({
          id: record.id,
          kind: "changed",
          resource: record.resource,
          method: record.method,
          mergedCount: record.mergedCount,
          fields: conflicts,
        });
        if (resolution === "later") return "kept";
        if (resolution === "server") {
          await deleteWrite(record.id);
          return "dropped";
        }
        if (resolution === "merge" && record.method !== "DELETE") {
          // Server wins on the fields it changed; our other edits still apply.
          const local = { ...(parseBody(body) ?? {}) };
          for (const conflict of conflicts) delete local[conflict.field];
          if (Object.keys(local).length === 0) {
            await deleteWrite(record.id);
            return "dropped";
          }
          body = JSON.stringify(local);
        }
      }
    }
  }

  try {
    const response = await fetch(record.url, {
      method: record.method,
      headers: buildHeaders(record),
      body: record.method === "DELETE" ? undefined : (body ?? undefined),
    });
    if (response.ok || (response.status >= 400 && response.status < 500)) {
      await deleteWrite(record.id);
      return response.ok ? "sent" : "dropped";
    }
    return "kept";
  } catch {
    return "kept";
  }
}

let draining: Promise<void> | null = null;

async function drainQueue(): Promise<void> {
  if (draining) return draining;
  draining = (async () => {
    const records = (await allWrites()).sort((a, b) => a.createdAt - b.createdAt);
    let replayed = 0;
    let dropped = 0;
    let remaining = 0;
    for (const record of records) {
      const outcome = await replayRecord(record);
      if (outcome === "sent") replayed += 1;
      else if (outcome === "dropped") dropped += 1;
      else remaining += 1;
    }
    if (replayed || dropped || remaining) {
      const clients = await sw.clients.matchAll({ type: "window", includeUncontrolled: true } as any);
      for (const client of clients) {
        client.postMessage({ type: MSG_SYNCED, replayed, dropped, remaining });
      }
    }
  })().finally(() => {
    draining = null;
  });
  return draining;
}

// ---------------------------------------------------------- worker events ----

sw.addEventListener("install", () => {
  void sw.skipWaiting();
});

sw.addEventListener("activate", (event: any) => {
  event.waitUntil(sw.clients.claim());
});

sw.addEventListener("sync", (event: any) => {
  if (event.tag === SYNC_TAG) event.waitUntil(drainQueue());
});

sw.addEventListener("message", (event: any) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  if (data.type === MSG_DRAIN) {
    event.waitUntil?.(drainQueue());
    void drainQueue();
  }
  if (data.type === MSG_RESOLVE) {
    pendingResolutions.get(data.id)?.(data.resolution as ConflictResolution);
  }
});