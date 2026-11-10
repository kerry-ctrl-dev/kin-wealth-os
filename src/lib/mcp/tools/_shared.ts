import type { JsonValueInput, ToolContext } from "@lovable.dev/mcp-js";

export function unauthenticated() {
  return { content: [{ type: "text" as const, text: "Not authenticated." }], isError: true };
}

export function failed(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

function toJsonValue(value: unknown): JsonValueInput {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (typeof value === "object") {
    const result: { [key: string]: JsonValueInput | undefined } = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== undefined) result[key] = toJsonValue(entry);
    }
    return result;
  }
  return String(value);
}

export function json(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: toJsonValue(value),
  };
}

export function isAuthed(ctx: ToolContext) {
  return ctx.isAuthenticated();
}
