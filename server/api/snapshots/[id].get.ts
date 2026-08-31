// server/api/snapshots/[id].get.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '~/server/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const row = await db.query(`SELECT * FROM snapshots WHERE snapshot_id = $1`, [id])
  if (row.rowCount === 0) {
    return { error: 'snapshot not found' }, 404
  }
  return row.rows[0]
})
