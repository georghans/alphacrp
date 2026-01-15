import { ModelOutput } from "./schemas.js";

export type EvaluationConfig = {
  stylePrompt: string;
  minScoreToMatch: number;
  strictness: "low" | "medium" | "high";
};

export function buildSystemPrompt(): string {
  return [
    "You are a strict style matching classifier.",
    "You must output ONLY valid JSON matching the provided schema.",
    "Do not include markdown or extra text.",
    "Focus on garment/object style only; no sensitive inferences about people.",
    "If images are insufficient or unclear, return NO_MATCH with low confidence and a mismatch reason like 'insufficient image clarity'."
  ].join(" ");
}

export function buildUserPrompt(config: EvaluationConfig, offerSummary: string): string {
  const schema: ModelOutput = {
    decision: "MATCH",
    style_score: 0.0,
    confidence: 0.0,
    match_reasons: [],
    mismatch_reasons: [],
    tags: []
  };

  return [
    `Target style prompt: ${config.stylePrompt}`,
    `Strictness: ${config.strictness}.`,
    `Decision rule: MATCH if style_score >= ${config.minScoreToMatch} and confidence >= 0.6 (unless strictness implies a stricter interpretation).`,
    "Evaluation rubric: color palette alignment, silhouette/fit, material/texture, pattern/print, overall vibe, condition constraints.",
    "Offer metadata:",
    offerSummary,
    "JSON schema (example values only; respond with actual values):",
    JSON.stringify(schema)
  ].join("\n");
}
