import type { ToolContext } from "@lovable.dev/mcp-js";

export function unauthenticated() {
  return { content: [{ type: "text" as const, text: "Not authenticated." }], isError: true };
}

export function failed(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function json(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: value as Record<string, unknown>,
  };
}

export function isAuthed(ctx: ToolContext) {
  return ctx.isAuthenticated();
}
