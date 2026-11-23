// Single guarded registration point for the offline service worker.
// It must never register in dev, inside an iframe, or in Lovable preview hosts,
// because a stale app-shell SW there would serve deleted chunks and old HTML.

const SW_URL = "/sw.js";
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
const PREVIEW_DOMAINS = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"];
const PLATFORM_DEV_HOST = /^project--[^.]+-dev\.(?:lovable\.app|gpt-eng\.com|gptengineer\.run)$/;

export function isBlockedServiceWorkerHost(
  hostname: string,
  delegatedPreviewHostname?: string,
): boolean {
  const host = hostname.toLowerCase();
  if (delegatedPreviewHostname && host === delegatedPreviewHostname.toLowerCase()) return true;

  const firstLabel = host.split(".")[0] ?? "";
  if (
    PREVIEW_LABEL.test(firstLabel) &&
    PREVIEW_DOMAINS.some((domain) => host.endsWith(domain))
  ) {
    return true;
  }
  if (PLATFORM_DEV_HOST.test(host)) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;

  return false;
}

function isBlockedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  if (window.self !== window.top) return true;

  if (isBlockedServiceWorkerHost(window.location.hostname)) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;

  return false;
}

async function unregisterExisting() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((registration) => {
        const workers = [
          registration.active,
          registration.waiting,
          registration.installing,
        ].filter((worker): worker is ServiceWorker => worker !== null);
        return workers.some((worker) => {
          try {
            const scriptUrl = new URL(worker.scriptURL);
            return scriptUrl.origin === window.location.origin && scriptUrl.pathname === SW_URL;
          } catch {
            return false;
          }
        });
      })
      .map((registration) => registration.unregister()),
  );
}

export function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  if (isBlockedContext()) {
    void unregisterExisting();
    return;
  }

  void navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {
    /* offline support is best-effort */
  });
}
