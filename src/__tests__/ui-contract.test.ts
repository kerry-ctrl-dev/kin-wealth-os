import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROUTES_DIR = "src/routes/_authenticated";
const read = (p: string) => readFileSync(p, "utf8");
const styles = read("src/styles.css");

const routeFiles = readdirSync(ROUTES_DIR)
  .filter((f) => f.endsWith(".tsx") && f !== "route.tsx")
  .map((f) => join(ROUTES_DIR, f));

/** Screens that are pure single-panel views and intentionally have no grid. */
const NON_GRID_SCREENS = new Set(["assistant.tsx", "onboarding.tsx"]);

describe("design tokens (glass UI contract)", () => {
  const required = [
    "@utility fintech-card",
    "@utility glass-morph",
    "@utility glass-panel",
    "@utility bento-grid",
    "@utility gradient-mesh",
    "@utility clay-card",
    "@utility clay-button",
    "@utility clay-inset",
    "@utility empty-state",
  ];
  for (const token of required) {
    it(`still defines ${token}`, () => {
      expect(styles).toContain(token);
    });
  }

  it("keeps cards semi-transparent with a blur and hairline border", () => {
    const card = styles.slice(styles.indexOf("@utility fintech-card"));
    const body = card.slice(0, card.indexOf("\n}"));
    expect(body).toContain("var(--glass-bg)");
    expect(body).toContain("var(--glass-border)");
    expect(body).toMatch(/backdrop-filter:\s*blur\(/);
    expect(body).toContain("var(--glow-ambient)");
  });

  it("defines glass and clay tokens for both light and dark themes", () => {
    for (const token of ["--glass-bg", "--glass-border", "--glow-ambient", "--clay-bg", "--clay-shadow"]) {
      expect(styles.split(token).length - 1).toBeGreaterThanOrEqual(2);
    }
  });

  it("never hand-writes a -webkit-backdrop-filter next to the standard property", () => {
    expect(styles).not.toContain("-webkit-backdrop-filter");
  });
});

describe("bento layout coverage", () => {
  for (const file of routeFiles) {
    const name = file.split("/").pop()!;
    if (NON_GRID_SCREENS.has(name)) continue;
    it(`${name} lays panels out on the bento grid`, () => {
      const src = read(file);
      expect(src).toMatch(/bento-grid|fintech-card/);
    });
  }

  it("every screen renders panels through the shared card surface", () => {
    for (const file of routeFiles) {
      expect(read(file)).toContain("fintech-card");
    }
  });

  it("wraps app content in the ambient gradient mesh", () => {
    expect(read("src/components/AppShell.tsx")).toContain("gradient-mesh");
  });
});

describe("CTA + microcopy contract", () => {
  const appFiles = [...routeFiles, "src/routes/index.tsx", "src/components/SectionHeading.tsx"];
  const appSources = appFiles.map(read).join("\n");

  const bannedCopy = [
    "Click here",
    "Submit",
    "No data",
    "Lorem ipsum",
    "Coming soon",
    "Sign Up Now",
    "Get Started Today",
    "Download PDF report",
    "Log contribution",
    "Save investment",
    "Save record",
    "Record loan",
    "Create goal",
    "New Budget",
    "New Expense",
    "New personal asset",
  ];
  for (const phrase of bannedCopy) {
    it(`does not reintroduce "${phrase}"`, () => {
      expect(appSources).not.toContain(`>${phrase}<`);
      expect(appSources).not.toContain(`"${phrase}"`);
    });
  }

  const expectedCtas = [
    { file: "src/routes/index.tsx", copy: "Start free" },
    { file: "src/routes/index.tsx", copy: "See features" },
    { file: "src/routes/index.tsx", copy: "Open my dashboard" },
    { file: `${ROUTES_DIR}/budgets.tsx`, copy: "Add budget" },
    { file: `${ROUTES_DIR}/loans.tsx`, copy: "Add loan" },
    { file: `${ROUTES_DIR}/personal-assets.tsx`, copy: "Add asset" },
    { file: `${ROUTES_DIR}/income.tsx`, copy: "Add income" },
    { file: `${ROUTES_DIR}/reports.tsx`, copy: "Export PDF" },
    { file: `${ROUTES_DIR}/goals.tsx`, copy: "Contribute" },
  ];
  for (const { file, copy } of expectedCtas) {
    it(`keeps the "${copy}" call to action in ${file.split("/").pop()}`, () => {
      expect(read(file)).toContain(copy);
    });
  }

  it("keeps every screen subhead short enough for small screens", () => {
    const subs = appFiles.flatMap((f) => [...read(f).matchAll(/sub="([^"]+)"/g)].map((m) => m[1]!));
    expect(subs.length).toBeGreaterThanOrEqual(10);
    for (const sub of subs) expect(sub.length).toBeLessThanOrEqual(40);
  });

  it("keeps empty-state copy to a single short sentence", () => {
    for (const file of routeFiles) {
      const src = read(file);
      for (const m of src.matchAll(/empty-state"[^>]*>\s*([^<]{3,})/g)) {
        expect(m[1]!.trim().length).toBeLessThanOrEqual(60);
      }
    }
  });

  it("keeps empty states on the shared outcome-driven surface", () => {
    const withEmptyState = routeFiles.filter((f) => read(f).includes("empty-state"));
    expect(withEmptyState.length).toBeGreaterThanOrEqual(5);
  });
});

describe("no FAQ surface anywhere in the app", () => {
  it("has no FAQ route file", () => {
    const all = [...readdirSync("src/routes"), ...readdirSync(ROUTES_DIR)];
    expect(all.some((f) => /faq/i.test(f))).toBe(false);
  });

  it("has no FAQ copy or accordion in app screens or components", () => {
    const files = [
      ...routeFiles,
      "src/routes/index.tsx",
      ...readdirSync("src/components")
        .filter((f) => f.endsWith(".tsx"))
        .map((f) => join("src/components", f)),
    ];
    for (const file of files) {
      expect(read(file)).not.toMatch(/faq|frequently asked/i);
    }
  });
});

describe("mobile typography scale", () => {
  it("shrinks the base scale and panel headings on small screens", () => {
    const mobile = styles.slice(styles.indexOf("@media (max-width: 640px)"));
    expect(mobile).toContain("font-size: 15px");
    expect(mobile).toContain(".fintech-card h2");
    expect(mobile).toContain(".empty-state");
  });

  it("balances headings and prevents orphan words in body copy", () => {
    expect(styles).toContain("text-wrap: balance");
    expect(styles).toContain("text-wrap: pretty");
  });

  it("scales section headings responsively", () => {
    const heading = read("src/components/SectionHeading.tsx");
    expect(heading).toContain("text-xl sm:text-3xl");
  });
});

describe("theming discipline", () => {
  const componentFiles = readdirSync("src/components")
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => join("src/components", f));

  for (const file of componentFiles) {
    it(`${file.split("/").pop()} uses semantic tokens, not hardcoded colors`, () => {
      const src = read(file);
      expect(src).not.toMatch(/className="[^"]*\b(bg-white|bg-black|text-black)\b/);
      expect(src).not.toMatch(/bg-\[#|text-\[#/);
    });
  }
});