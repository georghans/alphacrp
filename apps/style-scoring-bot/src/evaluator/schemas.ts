import { z } from "zod";

export const modelOutputSchema = z.object({
  decision: z.enum(["MATCH", "NO_MATCH"]),
  style_score: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  match_reasons: z.array(z.string()).default([]),
  mismatch_reasons: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([])
});

export type ModelOutput = z.infer<typeof modelOutputSchema>;

export const styleProfileInputSchema = z.object({
  name: z.string().min(1),
  style_prompt: z.string().min(1),
  example_images: z.array(z.string().min(1)).min(1)
});

export type StyleProfileInput = z.infer<typeof styleProfileInputSchema>;
