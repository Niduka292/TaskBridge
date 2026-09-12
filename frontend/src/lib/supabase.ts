import { createBrowserClient } from '@supabase/ssr'

// ─────────────────────────────────────────────
//  Browser client
//  Use this in Client Components ('use client')
//  and anywhere you need the Supabase client
//  on the client side.
// ─────────────────────────────────────────────
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─────────────────────────────────────────────
//  Auth helpers — thin wrappers around the
//  Supabase Auth API for cleaner imports
//  across the app.
// ─────────────────────────────────────────────

/**
 * Sign up a new user.
 * fullName is stored in user_metadata so the
 * Postgres trigger can insert it into profiles.
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })
}

/**
 * Sign in with email and password.
 */
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  return supabase.auth.signOut()
}

/**
 * Verify the OTP token from the confirmation email.
 * Call this on the /auth/confirm page.
 */
export async function verifyEmailOtp(tokenHash: string) {
  return supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'email',
  })
}

/**
 * Get the current session.
 * Returns null if not authenticated.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data.session
}

/**
 * Get the current user's UUID from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession()
  return session?.user?.id ?? null
}

/**
 * Get the current JWT access token.
 * Used by apiFetch to attach to gateway requests.
 * Returns null if not authenticated.
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession()
  return session?.access_token ?? null
}

/**
 * Check if the current user has the is_admin flag
 * in their JWT user_metadata.
 * Used to protect the /admin route.
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession()
  return session?.user?.user_metadata?.is_admin === true
}

// ─────────────────────────────────────────────
//  Storage helpers — avatar upload
//  Uploads directly to Supabase Storage,
//  bypassing the gateway entirely.
// ─────────────────────────────────────────────

/**
 * Upload an avatar image for a user.
 * Returns the public URL on success, null on failure.
 *
 * Usage:
 *   const url = await uploadAvatar(userId, file)
 *   if (url) await apiFetch(`/api/v1/users/${userId}`, {
 *     method: 'PUT',
 *     body: JSON.stringify({ avatarUrl: url })
 *   })
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string | null> {
  const extension = file.name.split('.').pop()
  const path = `${userId}/avatar.${extension}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (error) {
    console.error('Avatar upload failed:', error.message)
    return null
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

// ─────────────────────────────────────────────
//  Realtime helpers — subscribe to live updates
//  These bypass the gateway. Supabase delivers
//  new rows directly to the browser via WebSocket.
// ─────────────────────────────────────────────

/**
 * Subscribe to new bids on a task.
 * Updates bid count on task detail page in real time.
 * Returns the channel — call channel.unsubscribe() on cleanup.
 *
 * Usage:
 *   const channel = subscribeToBids(taskId, () => refetch())
 *   return () => channel.unsubscribe()
 */
export function subscribeToBids(
  taskId: string,
  onNewBid: (payload: Record<string, unknown>) => void
) {
  return supabase
    .channel(`bids-task-${taskId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'bids',
        filter: `task_id=eq.${taskId}`,
      },
      onNewBid
    )
    .subscribe()
}

/**
 * Subscribe to notifications for the current user.
 * Updates the bell badge count in the Navbar in real time.
 * Returns the channel — call channel.unsubscribe() on cleanup.
 *
 * Usage:
 *   const channel = subscribeToNotifications(userId, () => incrementBadge())
 *   return () => channel.unsubscribe()
 */
export function subscribeToNotifications(
  userId: string,
  onNewNotification: (payload: Record<string, unknown>) => void
) {
  return supabase
    .channel(`notifications-user-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      onNewNotification
    )
    .subscribe()
}

/**
 * Subscribe to in-task chat messages.
 * Delivers new messages to the workspace page in real time.
 * There is NO REST endpoint for messages — this is the only
 * way to receive them.
 * Returns the channel — call channel.unsubscribe() on cleanup.
 */
export function subscribeToMessages(
  taskId: string,
  onNewMessage: (payload: Record<string, unknown>) => void
) {
  return supabase
    .channel(`messages-task-${taskId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `task_id=eq.${taskId}`,
      },
      onNewMessage
    )
    .subscribe()
}

/**
 * Subscribe to escrow status changes for a task.
 * Used on the /payments/return page and workspace page
 * to update the EscrowStatus badge in real time without polling.
 * Returns the channel — call channel.unsubscribe() on cleanup.
 */
export function subscribeToEscrow(
  taskId: string,
  onEscrowUpdate: (payload: Record<string, unknown>) => void
) {
  return supabase
    .channel(`escrow-task-${taskId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'escrow_transactions',
        filter: `task_id=eq.${taskId}`,
      },
      onEscrowUpdate
    )
    .subscribe()
}

// ─────────────────────────────────────────────
//  Message helpers — in-task chat
//  Written directly via Supabase JS client.
//  No gateway involved.
// ─────────────────────────────────────────────

/**
 * Fetch all messages for a task (initial load).
 * Ordered oldest-first so the chat renders correctly.
 */
export async function getMessages(taskId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

/**
 * Send a message on a task.
 * sender_id is taken from the current session — not passed by the caller.
 */
export async function sendMessage(taskId: string, content: string) {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('messages')
    .insert({ task_id: taskId, sender_id: userId, content, is_read: false })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Mark a message as read.
 */
export async function markMessageRead(messageId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId)

  if (error) throw new Error(error.message)
}