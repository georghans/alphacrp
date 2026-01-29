CREATE TABLE IF NOT EXISTS discovered_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'sellpy',
  external_id TEXT,
  search_term TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  discovered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  scraped_at TIMESTAMP,
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  UNIQUE (source, url, search_id)
);

CREATE INDEX IF NOT EXISTS discovered_offers_status_idx ON discovered_offers (status);
CREATE INDEX IF NOT EXISTS discovered_offers_search_id_idx ON discovered_offers (search_id);
CREATE INDEX IF NOT EXISTS discovered_offers_discovered_at_idx ON discovered_offers (discovered_at);
