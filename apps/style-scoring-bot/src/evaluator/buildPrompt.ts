import { ModelOutput } from "./schemas.js";

export type EvaluationConfig = {
  stylePrompt: string;
  minScoreToMatch: number;
  strictness: "low" | "medium" | "high";
};

export function buildSystemPrompt(): string {
  return [
    "You are a strict style matching classifier for fashion items.",
    "You MUST output ONLY valid JSON that conforms to the provided schema. No markdown, no extra text.",
    "Ground all judgments in observable evidence from images and offer metadata. Avoid vague statements.",
    "Scoring rubric (each 0..1): palette, silhouette, material/texture, pattern/print, details, condition suitability.",
    "Compute style_score as a weighted sum with silhouette and material prioritized.",
    "Hard mismatch rule: if garment type/category is incompatible with target OR a strong conflicting trait is present (e.g., loud logo vs logo-free, busy print vs solid neutrals), decision MUST be NO_MATCH.",
    "Uncertainty rule: if silhouette OR material/texture cannot be reliably assessed due to unclear images and missing metadata, set confidence <= 0.45 and return NO_MATCH with mismatch reason 'insufficient evidence'."
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

  const strictnessRules =
      config.strictness === "low"
          ? "low: min_confidence=0.55; allow up to 1 weak dimension (<0.35) if overall vibe is consistent."
          : config.strictness === "medium"
              ? "medium: min_confidence=0.60; no dimension may be <0.35."
              : "high: min_confidence=0.70; silhouette>=0.70 AND material>=0.60 AND no dimension <0.45.";

  return [
    `Target style prompt: ${config.stylePrompt}`,
    `Strictness: ${config.strictness}. ${strictnessRules}`,
    `Decision rule: MATCH only if style_score >= ${config.minScoreToMatch} AND confidence >= min_confidence AND no hard mismatches.`,
    "Reason rules:",
    "- Each match_reasons/mismatch_reasons entry must reference at least one observable attribute: color, silhouette, material/texture, pattern/print, or details.",
    "- If uncertain, say so and reduce confidence; do not guess.",
    "Offer metadata:",
    offerSummary,
    "Output JSON only following this schema:",
    JSON.stringify(schema)
  ].join("\n");
}