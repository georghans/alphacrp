import { db } from "./client.js";
import { offerStyleEvaluations } from "../../../packages/shared-db/src/schema.js";

export type EvaluationInsert = {
  offerId: string;
  styleProfileId: string;
  decision: "MATCH" | "NO_MATCH";
  styleScore: number | null;
  confidence: number | null;
  matchReasons: string[];
  mismatchReasons: string[];
  tags: string[];
  rawModelOutput: unknown;
  modelName: string;
  modelVersion: string | null;
};

export async function upsertEvaluation(payload: EvaluationInsert) {
  return db
    .insert(offerStyleEvaluations)
    .values({
      offerId: payload.offerId,
      styleProfileId: payload.styleProfileId,
      decision: payload.decision,
      styleScore: payload.styleScore,
      confidence: payload.confidence,
      matchReasons: payload.matchReasons,
      mismatchReasons: payload.mismatchReasons,
      tags: payload.tags,
      rawModelOutput: payload.rawModelOutput,
      modelName: payload.modelName,
      modelVersion: payload.modelVersion
    })
    .onConflictDoUpdate({
      target: [offerStyleEvaluations.offerId, offerStyleEvaluations.styleProfileId],
      set: {
        decision: payload.decision,
        styleScore: payload.styleScore,
        confidence: payload.confidence,
        matchReasons: payload.matchReasons,
        mismatchReasons: payload.mismatchReasons,
        tags: payload.tags,
        rawModelOutput: payload.rawModelOutput,
        modelName: payload.modelName,
        modelVersion: payload.modelVersion,
        evaluatedAt: new Date()
      }
    });
}
