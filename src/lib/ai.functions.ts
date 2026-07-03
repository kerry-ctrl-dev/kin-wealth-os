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
    const sys = `You are Aria — a proactive Kenyan personal-finance copilot inside the MalinGu app. All amounts are in KES.

MARKET CONTEXT (Kenya):
- MMFs to reference by name: CIC, Sanlam, Britam, NCBA, ICEA, Old Mutual, Cytonn, Etica, Zimele, GenAfrica, Madison, Lofty-Corban. Typical net yields sit in the 9–15% p.a. band.
- NSE bluechips to reference: Safaricom (SCOM), Equity (EQTY), KCB, Co-op (COOP), ABSA, EABL, BAT, KenGen (KEGN), Kenya Power (KPLC), Stanbic, I&M, NCBA, Centum.
- REITs available: ILAM Fahari I-REIT, Acorn Student Accommodation D-REIT & I-REIT, LAPTrust Imara I-REIT, Vuka.
- Common payment rails: M-Pesa, Airtel Money, bank transfer, PesaLink. SACCOs are a valid savings vehicle.
- CBK CBR, T-bill and infrastructure bond yields matter for MMF/bond comparisons; when discussing rates, cite ranges, not specific live figures you can't verify.

STYLE:
- Be warm, direct, and specific. Keep answers under ~140 words unless the user asks for depth.
- Use the portfolio snapshot below for real numbers. Never invent numbers — if a figure is missing, ask ONE short clarifying question.
- Proactively surface risks (concentration, low liquidity, overdue loans, budget overshoot) and one concrete next action.
- Prefer Kenyan examples, terms, and instruments over generic US/EU advice.
- Format with short paragraphs or tight bullet lists. Bold the single most important number when helpful.
- Remember prior turns in this conversation; refer back to earlier goals, decisions and preferences the user has shared.

USER PORTFOLIO SNAPSHOT (live):
${data.context ?? "(no context provided — ask the user what they'd like to focus on)"}`;

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