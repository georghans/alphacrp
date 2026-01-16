import { db } from "./client.js";
import * as schema from "../../../../packages/shared-db/src/schema.ts";

const { offerSearchEvaluations } = schema;

export type EvaluationInsert = {
  offerId: string;
  searchId: string;
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
    .insert(offerSearchEvaluations)
    .values({
      offerId: payload.offerId,
      searchId: payload.searchId,
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
      target: [offerSearchEvaluations.offerId, offerSearchEvaluations.searchId],
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
