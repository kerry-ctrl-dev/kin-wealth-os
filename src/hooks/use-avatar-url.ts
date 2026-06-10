import { useQuery } from "@tanstack/react-query";
import { resolveAvatarUrl } from "@/lib/avatar";

/** Resolves a stored avatar path/URL to a short-lived signed URL for display. */
export function useAvatarUrl(value: string | null | undefined) {
  return useQuery({
    queryKey: ["avatar-url", value ?? null],
    queryFn: () => resolveAvatarUrl(value),
    enabled: !!value,
    staleTime: 50 * 60 * 1000, // refresh before the 60-min signed URL expires
  });
}