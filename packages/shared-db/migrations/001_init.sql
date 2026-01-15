CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  search_term TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  price_amount NUMERIC,
  price_currency TEXT,
  brand TEXT,
  category TEXT,
  subcategory TEXT,
  condition TEXT,
  size TEXT,
  color TEXT,
  material TEXT,
  availability TEXT,
  created_at_source TIMESTAMP,
  raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  scraped_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS offers_search_term_idx ON offers (search_term);
CREATE INDEX IF NOT EXISTS offers_brand_idx ON offers (brand);
CREATE INDEX IF NOT EXISTS offers_category_idx ON offers (category);
CREATE INDEX IF NOT EXISTS offers_price_amount_idx ON offers (price_amount);

CREATE TABLE IF NOT EXISTS offer_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  position INT NOT NULL,
  image_url TEXT NOT NULL,
  image_url_full TEXT,
  image_url_thumb TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (offer_id, position)
);

CREATE TABLE IF NOT EXISTS style_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  style_prompt TEXT NOT NULL,
  example_images JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offer_style_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  style_profile_id UUID NOT NULL REFERENCES style_profiles(id) ON DELETE CASCADE,
  decision TEXT NOT NULL,
  style_score NUMERIC,
  confidence NUMERIC,
  match_reasons JSONB NOT NULL,
  mismatch_reasons JSONB NOT NULL,
  tags JSONB NOT NULL,
  raw_model_output JSONB NOT NULL,
  model_name TEXT NOT NULL,
  model_version TEXT,
  evaluated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (offer_id, style_profile_id)
);

CREATE INDEX IF NOT EXISTS offer_style_evaluations_profile_decision_idx
  ON offer_style_evaluations (style_profile_id, decision);

CREATE INDEX IF NOT EXISTS offer_style_evaluations_offer_idx
  ON offer_style_evaluations (offer_id);
