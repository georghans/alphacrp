import {
  pgTable,
  text,
  uuid,
  numeric,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
  index
} from "drizzle-orm/pg-core";

export const offers = pgTable(
  "offers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: text("source").notNull(),
    externalId: text("external_id").notNull(),
    searchTerm: text("search_term").notNull(),
    url: text("url").notNull(),
    title: text("title"),
    description: text("description"),
    priceAmount: numeric("price_amount"),
    priceCurrency: text("price_currency"),
    brand: text("brand"),
    category: text("category"),
    subcategory: text("subcategory"),
    condition: text("condition"),
    size: text("size"),
    color: text("color"),
    material: text("material"),
    availability: text("availability"),
    createdAtSource: timestamp("created_at_source"),
    rawMetadata: jsonb("raw_metadata").notNull().default({}),
    scrapedAt: timestamp("scraped_at").notNull().defaultNow()
  },
  (table) => {
    return {
      uniqueExternal: uniqueIndex("offers_source_external_id_unique").on(
        table.source,
        table.externalId
      ),
      searchTermIdx: index("offers_search_term_idx").on(table.searchTerm),
      brandIdx: index("offers_brand_idx").on(table.brand),
      categoryIdx: index("offers_category_idx").on(table.category),
      priceIdx: index("offers_price_amount_idx").on(table.priceAmount)
    };
  }
);

export const offerImages = pgTable(
  "offer_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    imageUrl: text("image_url").notNull(),
    imageUrlFull: text("image_url_full"),
    imageUrlThumb: text("image_url_thumb"),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    uniqueOfferPosition: uniqueIndex("offer_images_offer_position_unique").on(
      table.offerId,
      table.position
    )
  })
);

export const styleProfiles = pgTable("style_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  stylePrompt: text("style_prompt").notNull(),
  exampleImages: jsonb("example_images").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const offerStyleEvaluations = pgTable(
  "offer_style_evaluations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    styleProfileId: uuid("style_profile_id")
      .notNull()
      .references(() => styleProfiles.id, { onDelete: "cascade" }),
    decision: text("decision").notNull(),
    styleScore: numeric("style_score"),
    confidence: numeric("confidence"),
    matchReasons: jsonb("match_reasons").notNull(),
    mismatchReasons: jsonb("mismatch_reasons").notNull(),
    tags: jsonb("tags").notNull(),
    rawModelOutput: jsonb("raw_model_output").notNull(),
    modelName: text("model_name").notNull(),
    modelVersion: text("model_version"),
    evaluatedAt: timestamp("evaluated_at").notNull().defaultNow()
  },
  (table) => ({
    uniqueOfferProfile: uniqueIndex("offer_style_evaluations_offer_profile_unique").on(
      table.offerId,
      table.styleProfileId
    ),
    profileDecisionIdx: index("offer_style_evaluations_profile_decision_idx").on(
      table.styleProfileId,
      table.decision
    ),
    offerIdx: index("offer_style_evaluations_offer_idx").on(table.offerId)
  })
);
