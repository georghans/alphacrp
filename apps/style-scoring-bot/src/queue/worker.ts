import pLimit from "p-limit";
import { fetchOfferById, fetchOffersForProfile } from "../db/offers.js";
import { upsertEvaluation } from "../db/evaluations.js";
import { OpenRouterClient } from "../evaluator/openrouterClient.js";
import { evaluateOffer } from "../evaluator/evaluateOffer.js";
import { getStyleProfile } from "../styles/profiles.js";
import { logger } from "../utils/logger.js";

export type EvaluationOptions = {
  styleProfileId: string;
  batchSize: number;
  concurrency: number;
  minScoreToMatch: number;
  strictness: "low" | "medium" | "high";
  dryRun: boolean;
  force: boolean;
  offerId?: string;
};

function mapImages(images: { imageUrl: string; imageUrlFull: string | null; imageUrlThumb: string | null }[]) {
  return images.map((image) => image.imageUrlFull ?? image.imageUrl ?? image.imageUrlThumb ?? "").filter(Boolean);
}

function toOfferInput(offer: Awaited<ReturnType<typeof fetchOfferById>>) {
  if (!offer) return null;
  return {
    id: offer.id,
    title: offer.title,
    description: offer.description,
    brand: offer.brand,
    category: offer.category,
    subcategory: offer.subcategory,
    size: offer.size,
    color: offer.color,
    material: offer.material,
    condition: offer.condition,
    priceAmount: offer.priceAmount ? offer.priceAmount.toString() : null,
    priceCurrency: offer.priceCurrency,
    images: mapImages(offer.images)
  };
}

export async function runEvaluation(client: OpenRouterClient, options: EvaluationOptions) {
  const profile = await getStyleProfile(options.styleProfileId);

  if (!profile) {
    throw new Error(`Style profile not found: ${options.styleProfileId}`);
  }

  const profileInput = {
    id: profile.id,
    stylePrompt: profile.stylePrompt,
    exampleImages: Array.isArray(profile.exampleImages) ? profile.exampleImages : []
  };

  const limit = pLimit(options.concurrency);
  let processed = 0;
  let matches = 0;
  let failures = 0;

  const handleOffer = async (offerRecord: Awaited<ReturnType<typeof fetchOfferById>>) => {
    const offer = toOfferInput(offerRecord);
    if (!offer || offer.images.length === 0 || !offer.title) {
      logger.warn({ offerId: offerRecord?.id }, "Skipping offer with insufficient metadata or images");
      return;
    }

    try {
      const { result, raw, model } = await evaluateOffer(client, offer, profileInput, {
        minScoreToMatch: options.minScoreToMatch,
        strictness: options.strictness
      });

      const decision = result.decision;
      if (decision === "MATCH") matches += 1;
      processed += 1;

      logger.info({ offerId: offer.id, decision, score: result.style_score, confidence: result.confidence }, "Evaluated offer");

      if (!options.dryRun) {
        await upsertEvaluation({
          offerId: offer.id,
          styleProfileId: profile.id,
          decision,
          styleScore: result.style_score,
          confidence: result.confidence,
          matchReasons: result.match_reasons,
          mismatchReasons: result.mismatch_reasons,
          tags: result.tags,
          rawModelOutput: raw,
          modelName: model,
          modelVersion: null
        });
      }
    } catch (error) {
      failures += 1;
      logger.error({ offerId: offer.id, error }, "Failed to evaluate offer");
    }
  };

  if (options.offerId) {
    const offer = await fetchOfferById(options.offerId);
    await handleOffer(offer);
  } else {
    while (true) {
      const offers = await fetchOffersForProfile(
        options.styleProfileId,
        options.batchSize,
        options.force
      );
      if (offers.length === 0) break;
      await Promise.all(offers.map((offer) => limit(() => handleOffer(offer))));
    }
  }

  logger.info({ processed, matches, failures }, "Evaluation summary");
}
