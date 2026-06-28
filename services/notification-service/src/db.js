// src/db.js
import { createClient } from '@supabase/supabase-js'

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
 * @param {{ userId: string, unreadOnly?: boolean, page?: number, limit?: number }}
 * @returns {{ data: object[], unreadCount: number }}
 */
export async function getNotifications({ userId, unreadOnly = false, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit

  // Build the data query
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (unreadOnly) query = query.eq('is_read', false)

  // Separate count query — always counts ALL unread regardless of unreadOnly filter
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  const { data, error } = await query
  if (error) throw new Error(`getNotifications failed: ${error.message}`)

  return { data, unreadCount: count ?? 0 }
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