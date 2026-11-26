Keep the authenticated route frame in `src/components/AppShell.tsx`, composing the shared sidebar, page header, responsive content area, and Aria widget so signed-in screens share one consistent navigation shell.

Keep advisor chat input validation in a browser-safe schema module so the server boundary and its security contract share one testable definition.

Keep service-worker registration in `src/lib/register-sw.ts` and refuse it in development, previews, iframes, and the `?sw=off` opt-out so offline caches cannot stale the editor or authentication flows.

Keep Firebase token verification and Socket.IO authorization in the server security helper so event handlers and focused tests share fail-closed checks.