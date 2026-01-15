import { OpenRouterClient } from "./openrouterClient.js";
import { buildSystemPrompt, buildUserPrompt, EvaluationConfig } from "./buildPrompt.js";
import { modelOutputSchema, ModelOutput } from "./schemas.js";

export type OfferInput = {
  id: string;
  title: string | null;
  description: string | null;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  size: string | null;
  color: string | null;
  material: string | null;
  condition: string | null;
  priceAmount: string | null;
  priceCurrency: string | null;
  images: string[];
};

export type StyleProfile = {
  id: string;
  stylePrompt: string;
  exampleImages: string[];
};

function summarizeOffer(offer: OfferInput): string {
  const lines = [
    `Title: ${offer.title ?? ""}`,
    `Description: ${offer.description ?? ""}`,
    `Brand: ${offer.brand ?? ""}`,
    `Category: ${offer.category ?? ""}`,
    `Subcategory: ${offer.subcategory ?? ""}`,
    `Size: ${offer.size ?? ""}`,
    `Color: ${offer.color ?? ""}`,
    `Material: ${offer.material ?? ""}`,
    `Condition: ${offer.condition ?? ""}`,
    `Price: ${offer.priceAmount ?? ""} ${offer.priceCurrency ?? ""}`
  ];
  return lines.join("\n");
}

function extractJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("Model output is not valid JSON");
    }
    const slice = content.slice(firstBrace, lastBrace + 1);
    return JSON.parse(slice);
  }
}

export async function evaluateOffer(
  client: OpenRouterClient,
  offer: OfferInput,
  profile: StyleProfile,
  config: Pick<EvaluationConfig, "minScoreToMatch" | "strictness">
): Promise<{ result: ModelOutput; raw: unknown; model: string }>
{
  const offerSummary = summarizeOffer(offer);
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(
    {
      stylePrompt: profile.stylePrompt,
      minScoreToMatch: config.minScoreToMatch,
      strictness: config.strictness
    },
    offerSummary
  );

  const exampleImages = await Promise.all(
    profile.exampleImages.map((image) => client.prepareImage(image))
  );
  const offerImages = await Promise.all(
    offer.images.map((image) => client.prepareImage(image))
  );

  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        { type: "text", text: "Style reference images:" },
        ...exampleImages.map((img) => ({ type: "image_url", image_url: img })),
        { type: "text", text: "Offer images:" },
        ...offerImages.map((img) => ({ type: "image_url", image_url: img })),
        { type: "text", text: userPrompt }
      ]
    }
  ] as const;

  const response = await client.chat(messages);
  const raw = extractJson(response.content);
  const parsed = modelOutputSchema.parse(raw);
  return { result: parsed, raw, model: response.model };
}
