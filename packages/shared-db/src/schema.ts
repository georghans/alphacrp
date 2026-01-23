import drizzleApi from "./drizzle.js";

const {
  pgTable,
  text,
  uuid,
  numeric,
  timestamp,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
  index
} = drizzleApi;

export const searches = pgTable("searches", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  searchTerms: jsonb("search_terms").notNull().default([]),
  searchPrompt: text("search_prompt").notNull(),
  exampleImages: jsonb("example_images").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const offers = pgTable(
  "offers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    searchId: uuid("search_id")
      .notNull()
      .references(() => searches.id, { onDelete: "cascade" }),
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
      uniqueExternal: uniqueIndex("offers_source_external_search_unique").on(
        table.source,
        table.externalId,
        table.searchId
      ),
      searchIdIdx: index("offers_search_id_idx").on(table.searchId),
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
    imageData: text("image_data"),
    imageMime: text("image_mime"),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    uniqueOfferPosition: uniqueIndex("offer_images_offer_position_unique").on(
      table.offerId,
      table.position
    )
  })
);

export const offerSearchEvaluations = pgTable(
  "offer_search_evaluations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    searchId: uuid("search_id")
      .notNull()
      .references(() => searches.id, { onDelete: "cascade" }),
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
    uniqueOfferSearch: uniqueIndex("offer_search_evaluations_offer_search_unique").on(
      table.offerId,
      table.searchId
    ),
    searchDecisionIdx: index("offer_search_evaluations_search_decision_idx").on(
      table.searchId,
      table.decision
    ),
    offerIdx: index("offer_search_evaluations_offer_idx").on(table.offerId)
  })
);
