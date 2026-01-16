CREATE TABLE IF NOT EXISTS searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  search_terms JSONB NOT NULL DEFAULT '[]'::jsonb,
  search_prompt TEXT NOT NULL,
  example_images JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE offers ADD COLUMN IF NOT EXISTS search_id UUID;

INSERT INTO searches (id, title, search_terms, search_prompt, example_images, is_active, is_deleted)
SELECT gen_random_uuid(), 'Legacy Search', '[]'::jsonb, 'Legacy import', '[]'::jsonb, TRUE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM searches);

UPDATE offers
SET search_id = (SELECT id FROM searches ORDER BY created_at LIMIT 1)
WHERE search_id IS NULL;

ALTER TABLE offers ALTER COLUMN search_id SET NOT NULL;

DROP INDEX IF EXISTS offers_source_external_id_unique;
ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_source_external_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS offers_source_external_search_unique
  ON offers (source, external_id, search_id);

CREATE INDEX IF NOT EXISTS offers_search_id_idx ON offers (search_id);

CREATE TABLE IF NOT EXISTS offer_search_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  search_id UUID NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
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
  UNIQUE (offer_id, search_id)
);

CREATE INDEX IF NOT EXISTS offer_search_evaluations_search_decision_idx
  ON offer_search_evaluations (search_id, decision);

CREATE INDEX IF NOT EXISTS offer_search_evaluations_offer_idx
  ON offer_search_evaluations (offer_id);
