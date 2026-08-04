// Shared contract between the service worker's write queue and the app UI.
// Imported by both `src/sw.ts` (worker) and React components, so keep it
// free of any DOM / worker-only APIs.

export const SYNC_QUEUE_DB = "malingu-sync";
export const SYNC_QUEUE_STORE = "writes";
export const SYNC_TAG = "malingu-write-queue";

export const MSG_DRAIN = "MALINGU_SYNC_DRAIN";
export const MSG_CONFLICT = "MALINGU_SYNC_CONFLICT";
export const MSG_RESOLVE = "MALINGU_SYNC_RESOLVE";
export const MSG_SYNCED = "MALINGU_SYNC_DONE";

export type ConflictKind = "changed" | "missing";
export type ConflictResolution = "local" | "server" | "merge" | "later";

export type FieldConflict = {
  field: string;
  /** What the record looked like when the offline edit was made. */
  baseline: unknown;
  /** What the server holds now. */
  server: unknown;
  /** What the queued offline edit wants to write. */
  local: unknown;
};

export type SyncConflict = {
  id: string;
  kind: ConflictKind;
  /** Table the queued write targets, e.g. `expenses`. */
  resource: string;
  method: string;
  /** How many offline edits were merged into this single queued write. */
  mergedCount: number;
  fields: FieldConflict[];
};

export type ConflictMessage = { type: typeof MSG_CONFLICT; conflict: SyncConflict };
export type ResolveMessage = {
  type: typeof MSG_RESOLVE;
  id: string;
  resolution: ConflictResolution;
};
export type SyncedMessage = {
  type: typeof MSG_SYNCED;
  replayed: number;
  dropped: number;
  remaining: number;
};