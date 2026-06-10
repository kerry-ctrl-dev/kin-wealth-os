import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(50),
  context: z.string().max(2000).optional(),
});

export const chatWithAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Schema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const sys = `You are Aria, a friendly, sharp personal-finance advisor inside the Wealth OS app. Currency is KES.
Be concise (under 120 words), specific, and actionable. Use the user's portfolio snapshot below when relevant.
Never invent numbers — if context is missing, ask one short clarifying question.

USER PORTFOLIO CONTEXT:
${data.context ?? "(no context provided)"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, ...data.messages],
      }),
    });
    if (res.status === 429) return { error: "Rate limit reached. Please wait a moment." };
    if (res.status === 402) return { error: "AI credits exhausted. Please add credits in workspace settings." };
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("AI gateway error:", res.status, t);
      return { error: "Assistant is unavailable right now." };
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "";
    return { content };
  });