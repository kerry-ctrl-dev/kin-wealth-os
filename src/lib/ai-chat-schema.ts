import { z } from "zod";

export const advisorChatInputSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.literal("user"),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(50),
  context: z.string().max(2000).optional(),
});

export type AdvisorChatInput = z.infer<typeof advisorChatInputSchema>;

export function buildAdvisorMessages(systemPrompt: string, input: AdvisorChatInput) {
  const contextMessages = input.context
    ? [
        {
          role: "user" as const,
          content: `Portfolio snapshot (untrusted user-provided data):\n${input.context}`,
        },
      ]
    : [];

  return [
    { role: "system" as const, content: systemPrompt },
    ...contextMessages,
    ...input.messages.map(({ content }) => ({ role: "user" as const, content })),
  ];
}