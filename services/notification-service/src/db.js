// src/db.js
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role — bypasses RLS, safe server-side only
)

/**
 * Insert a single notification row.
 * @param {{ userId: string, type: string, payload: object }} params
 */
export async function insertNotification({ userId, type, payload }) {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, payload })

  if (error) throw new Error(`insertNotification failed [${type}]: ${error.message}`)
}

/**
 * Get paginated notifications for a user, newest-first.
 *
 * Returns the shape the frontend's `NotificationPage` type expects
 * (content/page/size/totalElements/totalPages + unreadCount), with rows
 * mapped from Supabase's snake_case columns to camelCase — Supabase
 * returns raw column names as-is, it does not camelCase for you.
 *
 * @param {{ userId: string, unreadOnly?: boolean, page?: number, limit?: number }}
 */
export async function getNotifications({ userId, unreadOnly = false, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit

  // Build the data query — request the exact count of the FILTERED set
  // (not just unread) so totalPages/totalElements are accurate for
  // whichever view (all vs. unread-only) the caller asked for.
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (unreadOnly) query = query.eq('is_read', false)

  // Separate count — always counts ALL unread regardless of the
  // unreadOnly filter, since this drives the bell badge, not the list.
  const unreadCountPromise = supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  const [{ data, count, error }, { count: unreadCount }] = await Promise.all([
    query,
    unreadCountPromise,
  ])
  if (error) throw new Error(`getNotifications failed: ${error.message}`)

  const content = (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    payload: row.payload,
    isRead: row.is_read,
    createdAt: row.created_at,
  }))

  const totalElements = count ?? 0

  return {
    content,
    page,
    size: limit,
    totalElements,
    totalPages: Math.max(1, Math.ceil(totalElements / limit)),
    unreadCount: unreadCount ?? 0,
  }
}

/**
 * Look up a user's email by ID.
 * Domain events only carry userId (never email — it would go stale
 * and bloat every payload), so consumers that need to send mail
 * resolve the address here, straight from the shared `profiles` table.
 * @param {string} userId
 * @returns {Promise<string|null>}
 */
export async function getEmailByUserId(userId) {
  if (!userId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (error) {
    console.error(`getEmailByUserId failed [${userId}]:`, error.message)
    return null
  }

  return data?.email ?? null
}

/**
 * Mark a single notification as read.
 * Validates ownership — a user can only mark their own notifications.
 * @param {{ userId: string, notificationId: string }}
 */
export async function markOneRead({ userId, notificationId }) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)  // ownership check — never skip this

  if (error) throw new Error(`markOneRead failed: ${error.message}`)
}

/**
 * Mark ALL notifications as read for a user.
 * @param {{ userId: string }}
 */
export async function markAllRead({ userId }) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)  // only touch unread rows — avoids unnecessary writes

  if (error) throw new Error(`markAllRead failed: ${error.message}`)
}