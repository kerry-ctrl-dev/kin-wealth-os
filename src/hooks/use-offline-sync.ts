import { useEffect, useRef } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * The service worker's Background Sync queue replays failed POST/PUT/PATCH/DELETE
 * requests once the browser regains connectivity. The replay happens outside the
 * page, so we refresh cached data when we come back online and tell the user.
 */
export function useOfflineSync(queryClient: QueryClient) {
  const wasOffline = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    wasOffline.current = !navigator.onLine;

    const handleOffline = () => {
      wasOffline.current = true;
      toast.warning("You're offline", {
        id: "malingu-offline",
        description: "Changes you make are queued and will sync automatically.",
      });
    };

    const handleOnline = () => {
      if (!wasOffline.current) return;
      wasOffline.current = false;
      toast.dismiss("malingu-offline");
      toast.success("Back online", {
        id: "malingu-online",
        description: "Syncing your queued changes…",
      });
      // Give the service worker a moment to drain its queue, then refresh data.
      window.setTimeout(() => queryClient.invalidateQueries(), 2500);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [queryClient]);
}