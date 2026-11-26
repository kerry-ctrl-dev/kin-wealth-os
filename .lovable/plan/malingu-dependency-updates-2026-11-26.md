# MalinGu Dependency Updates

## Scope
- Update the MalinGu app dependencies and keep its root `package.json`, `bun.lock`, and `package-lock.json` consistent.
- Leave `whatsapp-clone/` and its packages unchanged.

## Work
1. Upgrade vulnerable direct packages to compatible releases that address their reported transitive advisories, and apply compatible updates to other MalinGu dependencies where safe.
2. Reconcile the root npm lockfile with the manifest; it currently omits three declared development packages and has two version mismatches.
3. Run the dependency vulnerability scan again, then run the app tests, type check, and production build. Resolve regressions within the MalinGu dependency scope.

## Verified starting point
The current production dependency scan reports 49 advisories: 1 critical, 13 high, and 35 moderate, affecting six direct dependencies. The WhatsApp clone is excluded by request.

## Technical details
Keep dependency changes in the root workspace only. Prefer compatible releases and preserve the existing TanStack/Vite version alignment; avoid unrelated application or security changes.
