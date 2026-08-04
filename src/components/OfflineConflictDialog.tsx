import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { QueryClient } from "@tanstack/react-query";

import {
  MSG_CONFLICT,
  MSG_RESOLVE,
  MSG_SYNCED,
  type ConflictResolution,
  type SyncConflict,
} from "@/lib/offline-sync-protocol";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function label(field: string) {
  return field.replace(/_/g, " ");
}

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * When a queued offline write is replayed and the server row has changed in the
 * meantime, the service worker asks us how to resolve it.
 */
export function OfflineConflictDialog({ queryClient }: { queryClient: QueryClient }) {
  const [queue, setQueue] = useState<SyncConflict[]>([]);
  const conflict = queue[0];

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === MSG_CONFLICT) {
        setQueue((current) =>
          current.some((item) => item.id === data.conflict.id)
            ? current
            : [...current, data.conflict as SyncConflict],
        );
      }
      if (data.type === MSG_SYNCED) {
        if (data.replayed > 0) {
          toast.success(
            `Synced ${data.replayed} queued change${data.replayed === 1 ? "" : "s"}`,
          );
        }
        queryClient.invalidateQueries();
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [queryClient]);

  const resolve = (resolution: ConflictResolution) => {
    if (!conflict) return;
    navigator.serviceWorker.controller?.postMessage({
      type: MSG_RESOLVE,
      id: conflict.id,
      resolution,
    });
    setQueue((current) => current.filter((item) => item.id !== conflict.id));
  };

  if (!conflict) return null;

  const missing = conflict.kind === "missing";

  return (
    <Dialog open onOpenChange={() => resolve("later")}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sync conflict in {label(conflict.resource)}</DialogTitle>
          <DialogDescription>
            {missing
              ? "This record no longer exists on the server — it may have been deleted elsewhere while you were offline."
              : `This record changed elsewhere while you were offline${
                  conflict.mergedCount > 1
                    ? `, and ${conflict.mergedCount} of your offline edits were merged into one update`
                    : ""
                }.`}
          </DialogDescription>
        </DialogHeader>

        {!missing && conflict.fields.length > 0 && (
          <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
            {conflict.fields.map((field) => (
              <div key={field.field} className="space-y-1">
                <p className="font-medium capitalize text-foreground">{label(field.field)}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p className="text-muted-foreground">
                    Server: <span className="text-foreground">{display(field.server)}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Your edit: <span className="text-foreground">{display(field.local)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="ghost" onClick={() => resolve("later")}>
            Decide later
          </Button>
          <Button variant="outline" onClick={() => resolve("server")}>
            Keep server version
          </Button>
          {!missing && conflict.fields.length > 0 && (
            <Button variant="outline" onClick={() => resolve("merge")}>
              Merge (server wins conflicts)
            </Button>
          )}
          <Button onClick={() => resolve("local")}>
            {missing ? "Re-apply my change" : "Keep my changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}