import pLimit from "p-limit";
import { fetchOfferById, fetchOffersForSearch } from "../db/offers.js";
import { upsertEvaluation } from "../db/evaluations.js";
import { OpenRouterClient } from "../evaluator/openrouterClient.js";
import { evaluateOffer } from "../evaluator/evaluateOffer.js";
import { getSearch } from "../searches.js";
import { logger } from "../utils/logger.js";

export type EvaluationOptions = {
  searchId: string;
  batchSize: number;
  concurrency: number;
  minScoreToMatch: number;
  strictness: "low" | "medium" | "high";
  dryRun: boolean;
  force: boolean;
  offerId?: string;
  maxOffers?: number;
};

function mapImages(
  images: {
    imageUrl: string;
    imageUrlFull: string | null;
    imageUrlThumb: string | null;
    imageData?: string | null;
    imageMime?: string | null;
  }[]
) {
  return images
    .map((image) => {
      if (image.imageData && image.imageData.length > 0) {
        if (image.imageData.startsWith("data:")) {
          return image.imageData;
        }
        const contentType = image.imageMime ?? "image/jpeg";
        return `data:${contentType};base64,${image.imageData}`;
      }
      return image.imageUrlFull ?? image.imageUrl ?? image.imageUrlThumb ?? "";
    })
    .filter(Boolean);
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
  const search = await getSearch(options.searchId);

  if (!search) {
    throw new Error(`Search not found: ${options.searchId}`);
  }

  const profileInput = {
    id: search.id,
    stylePrompt: search.searchPrompt,
    exampleImages: Array.isArray(search.exampleImages) ? search.exampleImages : []
  };

  const limit = pLimit(options.concurrency);
  let processed = 0;
  let matches = 0;
  let failures = 0;
  let handled = 0;

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
          searchId: search.id,
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
      const err = error as { message?: string; stack?: string };
      logger.error(
        {
          offerId: offer.id,
          errorMessage: err?.message,
          errorStack: err?.stack
        },
        "Failed to evaluate offer"
      );

      if (!options.dryRun) {
        try {
          await upsertEvaluation({
            offerId: offer.id,
            searchId: search.id,
            decision: "ERROR",
            styleScore: null,
            confidence: null,
            matchReasons: [],
            mismatchReasons: [],
            tags: [],
            rawModelOutput: {
              error: err?.message ?? String(error),
              stack: err?.stack ?? null
            },
            modelName: "error",
            modelVersion: null
          });
        } catch (writeError) {
          const writeErr = writeError as { message?: string; stack?: string };
          logger.error(
            {
              offerId: offer.id,
              errorMessage: writeErr?.message,
              errorStack: writeErr?.stack
            },
            "Failed to record evaluation error"
          );
        }
      }
    } finally {
      handled += 1;
    }
  };

  if (options.offerId) {
    const offer = await fetchOfferById(options.offerId);
    await handleOffer(offer);
  } else {
    while (true) {
      if (options.maxOffers && handled >= options.maxOffers) break;
      const offers = await fetchOffersForSearch(
        options.searchId,
        options.batchSize,
        options.force
      );
      if (offers.length === 0) break;
      const remaining = options.maxOffers ? options.maxOffers - handled : undefined;
      const batch = remaining ? offers.slice(0, Math.max(remaining, 0)) : offers;
      if (batch.length === 0) break;
      await Promise.all(batch.map((offer) => limit(() => handleOffer(offer))));
    }
  }

  logger.info({ processed, matches, failures, handled }, "Evaluation summary");
}
