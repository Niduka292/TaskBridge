import pg from 'pg'

const { Pool } = pg

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.DB_HOST ?? 'postgres',
      port: Number(process.env.DB_PORT ?? 5432),
      database: process.env.DB_NAME ?? 'TaskBridge',
      user: process.env.DB_USER ?? process.env.POSTGRES_DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? process.env.POSTGRES_DB_PASS,
    })

pool.on('error', (err) => {
  console.error('[db] Unexpected PostgreSQL error:', err.message)
})

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      type VARCHAR(80) NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON notifications (user_id, created_at DESC)
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications (user_id, is_read)
  `)

  console.log('[db] notifications table ready')
}

export async function insertNotification({ userId, type, payload }) {
  if (!userId) {
    console.warn(`[db] Skipping ${type}: missing userId`)
    return
  }

  await pool.query(
    `INSERT INTO notifications (user_id, type, payload)
     VALUES ($1, $2, $3::jsonb)`,
    [userId, type, JSON.stringify(payload ?? {})]
  )
}

export async function getNotifications({ userId, unreadOnly = false, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit
  const filter = unreadOnly ? 'AND is_read = FALSE' : ''

  const [rowsResult, totalResult, unreadResult] = await Promise.all([
    pool.query(
      `SELECT id, user_id, type, payload, is_read, created_at
       FROM notifications
       WHERE user_id = $1 ${filter}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE user_id = $1 ${filter}`,
      [userId]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    ),
  ])

  const content = rowsResult.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    payload: row.payload,
    isRead: row.is_read,
    createdAt: row.created_at,
  }))

  const totalElements = totalResult.rows[0]?.count ?? 0
  const unreadCount = unreadResult.rows[0]?.count ?? 0

  return {
    content,
    page,
    size: limit,
    totalElements,
    totalPages: Math.max(1, Math.ceil(totalElements / limit)),
    unreadCount,
  }
}

export async function markOneRead({ userId, notificationId }) {
  const result = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  )

  return result.rowCount > 0
}

export async function markAllRead({ userId }) {
  await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  )
}
