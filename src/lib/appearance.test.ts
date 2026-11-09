import { describe, expect, it } from "vitest";
import { serializeForInlineScript } from "./appearance";

describe("inline script serialization", () => {
  it("escapes script-sensitive characters without changing the serialized value", () => {
    const input = "</script>&\u2028\u2029";
    const serialized = serializeForInlineScript(input);

    expect(serialized).toBe('"\\u003C\\u002Fscript\\u003E\\u0026\\u2028\\u2029"');
    expect(JSON.parse(serialized)).toBe(input);
  });
});
