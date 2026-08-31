# Chain Compaction

Implementation of the frozen **Chain Compaction Semantics** constitutional contract.

## Contents

- `internal/compaction/snapshot.go` – Go snapshot type, root-hash, digest, create & verify
- `internal/envelope/lineage.go` – Lineage extension with `compaction_ref`
- `internal/replay/replay.go` – Example compaction-aware replay loop
- `server/api/snapshots.post.ts` / `snapshots/[id].get.ts` – Nitro (h3) API routes
- `cmd/nitro-compact/main.go` – Operator CLI
- `migrations/001_compaction.sql` – PostgreSQL schema changes
- `internal/compaction/conformance_test.go` – CP-01 … CP-08 test skeletons

## Quick start

1. Adjust import paths (`yourmodule/...`) to match your Go module.
2. Run the migration.
3. Build the verifier binary with `--mode=snapshot` support.
4. Set `NITRO_URL` / `NITRO_TOKEN` and run:
   ```
   nitro-compact --start <uuid> --end <uuid> [--dry-run]
   ```

Compaction is operator-initiated, append-only, and preserves full replay + proof binding.
