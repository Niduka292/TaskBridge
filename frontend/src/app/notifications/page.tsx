'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
  type NotificationType,
  type NotificationPage,
} from '@/lib/api'
import { getCurrentUserId, subscribeToNotifications } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

// ── Message + icon mapping ────────────────────

const NOTIF_MESSAGES: Record<NotificationType, (p: Record<string, unknown>) => string> = {
  BID_RECEIVED:         (p) => `New bid from ${p.bidderName} for LKR ${Number(p.amountLKR).toLocaleString()}`,
  BID_ACCEPTED:         (p) => `Your bid on "${p.taskTitle}" was accepted`,
  ESCROW_HELD:          (p) => `Payment confirmed — work can begin on "${p.taskTitle}"`,
  WORK_SUBMITTED:       (p) => `${p.freelancerName} submitted work on "${p.taskTitle}"`,
  ESCROW_RELEASED:      (p) => `LKR ${Number(p.amountLKR).toLocaleString()} released to your wallet`,
  ESCROW_REFUNDED:      (p) => `LKR ${Number(p.amountLKR).toLocaleString()} refunded to your account`,
  TASK_COMPLETED:       (p) => `Task "${p.taskTitle}" is complete — leave a review`,
  DISPUTE_RAISED:       (p) => `A dispute was raised on "${p.taskTitle}"`,
  REVIEW_POSTED:        () => `You received a new review`,
  DEADLINE_APPROACHING: (p) => `Deadline approaching for "${p.taskTitle}"`,
}

const NOTIF_ICONS: Record<NotificationType, { glyph: string; style: string }> = {
  BID_RECEIVED:         { glyph: '$',  style: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  BID_ACCEPTED:         { glyph: '✓',  style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ESCROW_HELD:          { glyph: '🔒', style: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  WORK_SUBMITTED:       { glyph: '📤', style: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  ESCROW_RELEASED:      { glyph: '💰', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ESCROW_REFUNDED:      { glyph: '↩',  style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  TASK_COMPLETED:       { glyph: '★',  style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  DISPUTE_RAISED:       { glyph: '!',  style: 'bg-red-500/10 text-red-400 border-red-500/20' },
  REVIEW_POSTED:        { glyph: '★',  style: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  DEADLINE_APPROACHING: { glyph: '⏰', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
}

// Where clicking a notification should send the user.
// All task-related types need payload.taskId — falls back to /dashboard if absent.
function resolveTarget(n: Notification): string {
  const p = n.payload
  const taskId = p?.taskId as string | undefined

  switch (n.type) {
    case 'BID_RECEIVED':
    case 'BID_ACCEPTED':
    case 'ESCROW_HELD':
      return taskId ? `/tasks/${taskId}` : '/dashboard'
    case 'WORK_SUBMITTED':
    case 'DISPUTE_RAISED':
      return taskId ? `/tasks/${taskId}/workspace` : '/dashboard'
    case 'ESCROW_RELEASED':
    case 'ESCROW_REFUNDED':
      return taskId ? `/tasks/${taskId}` : '/dashboard'
    case 'TASK_COMPLETED':
      return taskId ? `/tasks/${taskId}/workspace` : '/dashboard'
    case 'REVIEW_POSTED':
      return '/dashboard'
    case 'DEADLINE_APPROACHING':
      return taskId ? `/tasks/${taskId}` : '/dashboard'
    default:
      return '/dashboard'
  }
}

// ── Relative time ─────────────────────────────
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

// ── Date grouping ──────────────────────────────
function groupKey(iso: string): 'Today' | 'Yesterday' | 'Earlier' {
  const date = new Date(iso)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  if (date >= startOfToday) return 'Today'
  if (date >= startOfYesterday) return 'Yesterday'
  return 'Earlier'
}

const GROUP_ORDER: Array<'Today' | 'Yesterday' | 'Earlier'> = ['Today', 'Yesterday', 'Earlier']

// ── Skeleton ───────────────────────────────────
function Skeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-4 animate-pulse">
      <div className="h-7 bg-zinc-800 rounded w-1/3" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-zinc-900 border border-zinc-800 rounded-xl" />
      ))}
    </div>
  )
}

// ── Notification row ──────────────────────────
function NotificationRow({
  notification,
  onOpen,
}: {
  notification: Notification
  onOpen: (n: Notification) => void
}) {
  const icon = NOTIF_ICONS[notification.type]
  const message = NOTIF_MESSAGES[notification.type]?.(notification.payload) ?? 'New notification'

  return (
    <button
      onClick={() => onOpen(notification)}
      className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left
        transition-colors
        ${notification.isRead
          ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          : 'bg-violet-600/5 border-violet-500/20 hover:border-violet-500/40'
        }`}
    >
      <div className={`w-9 h-9 rounded-full border flex items-center justify-center
        flex-shrink-0 text-sm ${icon?.style ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
        {icon?.glyph ?? '•'}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${
          notification.isRead ? 'text-zinc-400' : 'text-zinc-100'
        }`}>
          {message}
        </p>
        <p className="text-zinc-600 text-xs mt-1">{relativeTime(notification.createdAt)}</p>
      </div>

      {!notification.isRead && (
        <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1.5" />
      )}
    </button>
  )
}

// ── Main page ──────────────────────────────────
export default function NotificationsPage() {
  const router = useRouter()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [marking, setMarking] = useState(false)

  const unreadCount = notifications.filter(n => !n.isRead).length

  const loadPage = useCallback(async (pageNum: number) => {
    const result: NotificationPage = await getNotifications({ page: pageNum, size: 20 })
    return result
  }, [])

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const result = await loadPage(0)
        setNotifications(result.content)
        setTotalPages(result.totalPages)
        setPage(0)
      } catch {
        setError('Could not load notifications.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [loadPage])

  // Realtime: prepend new notifications as they arrive
  useEffect(() => {
    let channel: { unsubscribe: () => void } | null = null

    async function subscribe() {
      const userId = await getCurrentUserId()
      if (!userId) return
      channel = subscribeToNotifications(userId, (payload) => {
        const newNotif = payload.new as unknown as Notification
        if (newNotif?.id) {
          setNotifications(prev => [newNotif, ...prev])
        }
      })
    }
    subscribe()

    return () => { channel?.unsubscribe() }
  }, [])

  async function handleLoadMore() {
    if (page + 1 >= totalPages) return
    setLoadingMore(true)
    try {
      const result = await loadPage(page + 1)
      setNotifications(prev => [...prev, ...result.content])
      setPage(page + 1)
    } catch {
      // silent — load more failures aren't critical
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleMarkAllRead() {
    setMarking(true)
    try {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch {
      // silent fail — non-critical UI action
    } finally {
      setMarking(false)
    }
  }

  async function handleOpen(notification: Notification) {
    const target = resolveTarget(notification)
    if (!notification.isRead) {
      // Optimistic local update; fire-and-forget the API call.
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
      )
      markNotificationRead(notification.id).catch(() => {})
    }
    router.push(target)
  }

  if (loading) return <Skeleton />

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">{error}</p>
      </div>
    )
  }

  const grouped: Record<string, Notification[]> = { Today: [], Yesterday: [], Earlier: [] }
  for (const n of notifications) {
    grouped[groupKey(n.createdAt)].push(n)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-zinc-500 text-sm mt-1">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              loading={marking}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700
              flex items-center justify-center text-zinc-500 text-xl">
              🔔
            </div>
            <div className="text-center">
              <p className="text-zinc-300 text-sm font-medium mb-1">No notifications yet</p>
              <p className="text-zinc-500 text-xs">
                You'll see bids, payments, and task updates here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {GROUP_ORDER.filter(g => grouped[g].length > 0).map(group => (
              <div key={group} className="space-y-3">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  {group}
                </h2>
                <div className="space-y-2">
                  {grouped[group].map(n => (
                    <NotificationRow key={n.id} notification={n} onOpen={handleOpen} />
                  ))}
                </div>
              </div>
            ))}

            {page + 1 < totalPages && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" size="sm" onClick={handleLoadMore} loading={loadingMore}>
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}