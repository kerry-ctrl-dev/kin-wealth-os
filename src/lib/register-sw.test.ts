import { describe, expect, it } from "vitest";
import { isBlockedServiceWorkerHost } from "./register-sw";

describe("service worker host guard", () => {
  it("blocks Lovable preview and development hosts", () => {
    const blockedHosts = [
      "id-preview--abc.lovable.app",
      "preview-v2--shop.gpt-eng.com",
      "preview-main--abc.gptengineer.run",
      "project--abc123-dev.lovable.app",
      "lovableproject.com",
      "app.lovableproject-dev.com",
      "beta.lovable.dev",
    ];

    expect(blockedHosts.every((host) => isBlockedServiceWorkerHost(host))).toBe(true);
  });

  it("keeps the published app eligible and blocks the delegated preview exactly", () => {
    expect(isBlockedServiceWorkerHost("malingu.lovable.app")).toBe(false);
    expect(isBlockedServiceWorkerHost("preview-v2--shop.example.com")).toBe(false);
    expect(isBlockedServiceWorkerHost("team-preview.example.com", "team-preview.example.com")).toBe(
      true,
    );
  });
});