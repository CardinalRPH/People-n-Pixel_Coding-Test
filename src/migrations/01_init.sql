-- Activate the extension uuid
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Table
CREATE TABLE
    IF NOT EXISTS mentions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        external_id VARCHAR(255) NOT NULL,
        source VARCHAR(255) NOT NULL,
        source_normalized VARCHAR(255) NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        url TEXT,
        author VARCHAR(255),
        published_at TIMESTAMPTZ,
        engagement INT NOT NULL DEFAULT 0,
        dedup_hash CHAR(64) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

-- Add unieque constraint unique  dedup_hash
ALTER TABLE mentions ADD CONSTRAINT idx_mentions_unique_dedup UNIQUE (source_normalized, dedup_hash);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_mentions_published_at ON mentions (published_at DESC);

CREATE INDEX IF NOT EXISTS idx_mentions_source_normalized ON mentions (source_normalized);

CREATE INDEX IF NOT EXISTS idx_mentions_search ON mentions USING gin (
    to_tsvector ('english', coalesce(title, '') || ' ' || content)
);