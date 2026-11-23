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