-- Add compaction_ref column to envelopes
ALTER TABLE envelopes ADD COLUMN compaction_ref UUID;

-- Create snapshots table
CREATE TABLE snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    segment_start UUID NOT NULL,
    segment_end UUID NOT NULL,
    root_hash TEXT NOT NULL,
    compaction_digest TEXT NOT NULL,
    verifier_id TEXT NOT NULL,
    public_key_fingerprint TEXT NOT NULL,
    version TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    signature BYTEA NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_snapshots_segment_start ON snapshots(segment_start);
CREATE INDEX idx_snapshots_segment_end ON snapshots(segment_end);
