// server/api/snapshots.post.ts
import { defineEventHandler, readBody } from 'h3'
import { db } from '~/server/db'
import { spawn } from 'node:child_process'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ segment_start: string; segment_end: string }>(event)
  const { segment_start, segment_end } = body

  // 1. Load segment envelopes from DB (ordered by lineage)
  const rows = await db.query(`
    WITH RECURSIVE chain AS (
      SELECT * FROM envelopes WHERE event_id = $1
      UNION ALL
      SELECT e.* FROM envelopes e
      JOIN chain c ON e.event_id = c.lineage->>'parents'->>0
      WHERE e.event_id != $2
    )
    SELECT * FROM chain ORDER BY ts ASC
  `, [segment_start, segment_end])

  if (rows.rowCount === 0) {
    return { error: 'segment not found' }
  }

  // 2. Invoke Go snapshot generator (binary must be built with compaction support)
  const proc = spawn('./verifier', ['--mode=snapshot'], { stdio: ['pipe', 'pipe', 'pipe'] })
  proc.stdin.write(JSON.stringify({ envelopes: rows.rows, verifier_id: 'eventv1-go-verifier' }))
  proc.stdin.end()

  let stdout = ''
  for await (const chunk of proc.stdout) {
    stdout += chunk.toString()
  }
  const snapshot = JSON.parse(stdout)

  // 3. Store snapshot in DB
  const result = await db.query(`
    INSERT INTO snapshots (
      snapshot_id, type, segment_start, segment_end, root_hash,
      compaction_digest, verifier_id, public_key_fingerprint,
      version, timestamp, signature
    ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING snapshot_id
  `, [
    snapshot.type,
    snapshot.segment_start,
    snapshot.segment_end,
    snapshot.root_hash,
    snapshot.compaction_digest,
    snapshot.verifier_id,
    snapshot.public_key_fingerprint,
    snapshot.version,
    snapshot.timestamp,
    Buffer.from(snapshot.signature, 'base64')
  ])

  const snapshotId = result.rows[0].snapshot_id

  // 4. Update the first envelope after segment to reference compaction
  await db.query(`
    UPDATE envelopes
    SET lineage = jsonb_set(lineage, '{compaction_ref}', $1::jsonb)
    WHERE event_id = $2
  `, [JSON.stringify(snapshotId), segment_end])

  // 5. Optionally archive segment (async)
  // archiveSegment(segment_start, segment_end)

  return { id: snapshotId, snapshot }
})
