import { getAccessToken } from '@/lib/supabase'

// ─────────────────────────────────────────────
//  Base URL
//  All REST calls go through the Kong gateway.
//  Never call a service port directly.
// ─────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_GATEWAY_URL

// ─────────────────────────────────────────────
//  Error class
//  Carries the HTTP status and the parsed error
//  body so components can handle specific codes.
// ─────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public status: number,
    public body: Record<string, unknown>
  ) {
    super(`API error ${status}: ${body?.message ?? 'Unknown error'}`)
    this.name = 'ApiError'
  }
}

// ─────────────────────────────────────────────
//  Core fetch wrapper
//  Attaches the Supabase JWT as Bearer token
//  on every request automatically.
// ─────────────────────────────────────────────

/**
 * Make an authenticated request to the API gateway.
 * Automatically attaches the current Supabase session JWT.
 * Throws ApiError on non-2xx responses.
 *
 * Usage:
 *   const tasks = await apiFetch<TaskPage>('/api/v1/tasks?status=OPEN')
 *   const task  = await apiFetch<Task>('/api/v1/tasks', {
 *     method: 'POST',
 *     body: JSON.stringify({ title: '...', ... })
 *   })
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = await getAccessToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!res.ok) {
    let body: Record<string, unknown> = {}
    try {
      body = await res.json()
    } catch {
      // response body might not be JSON
    }
    throw new ApiError(res.status, body)
  }

  // 204 No Content — return empty object
  if (res.status === 204) return {} as T

  return res.json()
}

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

export type TaskStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PENDING_REVIEW'
  | 'COMPLETED'
  | 'DISPUTED'

export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export type EscrowStatus = 'PENDING' | 'HELD' | 'RELEASED' | 'REFUNDED'

export type ReviewContext = 'AS_POSTER' | 'AS_FREELANCER'

export type NotificationType =
  | 'BID_RECEIVED'
  | 'BID_ACCEPTED'
  | 'ESCROW_HELD'
  | 'WORK_SUBMITTED'
  | 'ESCROW_RELEASED'
  | 'ESCROW_REFUNDED'
  | 'TASK_COMPLETED'
  | 'DISPUTE_RAISED'
  | 'REVIEW_POSTED'
  | 'DEADLINE_APPROACHING'

export interface UserSummary {
  id: string
  fullName: string
  avatarUrl: string | null
  avgRatingAsFreelancer: number
  skills: string[]
}

export interface ReviewSummary {
  id: string
  rating: number
  comment: string | null
  reviewerName: string
  context: ReviewContext
  createdAt: string
}

export interface Profile {
  id: string
  fullName: string
  avatarUrl: string | null
  bio: string | null
  skills: string[]
  avgRatingAsPoster: number
  avgRatingAsFreelancer: number
  balance?: number               // only included on own profile
  completedTaskCount: number
  recentReviews: ReviewSummary[]
  createdAt: string
}

export interface Task {
  id: string
  posterId: string
  poster: UserSummary
  assignedTo: string | null
  title: string
  description: string
  budgetLKR: number
  status: TaskStatus
  deadline: string
  category: TaskCategory
  skillTags: string[]
  bidCount: number
  disputeReason: string | null
  createdAt: string
  updatedAt: string
}

export interface Bid {
  id: string
  taskId: string
  bidderId: string
  bidder?: UserSummary           // only included when caller is the task poster
  amountLKR: number
  proposal: string
  deliveryDays: number
  status: BidStatus
  createdAt: string
}

export interface EscrowTransaction {
  id: string
  taskId: string
  payerId: string
  payeeId: string
  amountLKR: number
  status: EscrowStatus
  gatewayRef: string | null
  createdAt: string
  updatedAt: string
}

export interface Review {
  id: string
  taskId: string
  reviewerId: string
  reviewerName: string
  revieweeId: string
  context: ReviewContext
  rating: number
  comment: string | null
  revealed: boolean
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  payload: Record<string, unknown>
  isRead: boolean
  createdAt: string
}

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface NotificationPage extends Page<Notification> {
  unreadCount: number
}

// ─────────────────────────────────────────────
//  User service — /api/v1/users
// ─────────────────────────────────────────────

/**
 * Get a user profile by ID.
 * If the caller is the profile owner, the response
 * will include the balance field.
 */
export function getProfile(userId: string) {
  return apiFetch<Profile>(`/api/v1/users/${userId}`)
}

/**
 * Update the authenticated user's own profile.
 * Returns 403 if called for a different user's ID.
 */
export function updateProfile(
  userId: string,
  data: {
    fullName?: string
    bio?: string | null
    skills?: string[]
    avatarUrl?: string | null
  }
) {
  return apiFetch<Profile>(`/api/v1/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * Get paginated reviews for a user.
 * Filter by context to show poster or freelancer reviews separately.
 */
export function getUserReviews(
  userId: string,
  params?: {
    context?: ReviewContext
    page?: number
    size?: number
  }
) {
  const query = new URLSearchParams()
  if (params?.context) query.set('context', params.context)
  if (params?.page !== undefined) query.set('page', String(params.page))
  if (params?.size !== undefined) query.set('size', String(params.size))

  const qs = query.toString()
  return apiFetch<Page<Review>>(
    `/api/v1/users/${userId}/reviews${qs ? `?${qs}` : ''}`
  )
}

/**
 * Submit a review after a task is completed.
 * Blind until both parties have submitted.
 */
export function submitReview(
  userId: string,
  data: {
    taskId: string
    revieweeId: string
    context: ReviewContext
    rating: number
    comment?: string
  }
) {
  return apiFetch<Review>(`/api/v1/users/${userId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ─────────────────────────────────────────────
//  Task service — /api/v1/tasks
// ─────────────────────────────────────────────

export interface TaskFilters {
  status?: TaskStatus
  category?: TaskCategory
  budgetMin?: number
  budgetMax?: number
  skillTags?: string[]
  posterId?: string
  assignedTo?: string
  search?: string
  sort?: 'createdAt,desc' | 'budgetLKR,desc' | 'deadline,asc'
  page?: number
  size?: number
}

/**
 * List tasks with optional filters.
 * Used for the task feed, My Posted Tasks dashboard tab,
 * and My Bids & Jobs dashboard tab.
 *
 * My Posted Tasks:  listTasks({ posterId: currentUserId })
 * My Jobs:          listTasks({ assignedTo: currentUserId })
 */
export function listTasks(filters?: TaskFilters) {
  const query = new URLSearchParams()
  if (filters?.status)     query.set('status', filters.status)
  if (filters?.category)   query.set('category', filters.category)
  if (filters?.budgetMin !== undefined) query.set('budgetMin', String(filters.budgetMin))
  if (filters?.budgetMax !== undefined) query.set('budgetMax', String(filters.budgetMax))
  if (filters?.skillTags?.length) {
    filters.skillTags.forEach(tag => query.append('skillTags', tag))
  }
  if (filters?.posterId)   query.set('posterId', filters.posterId)
  if (filters?.assignedTo) query.set('assignedTo', filters.assignedTo)
  if (filters?.search)     query.set('search', filters.search)
  if (filters?.sort)       query.set('sort', filters.sort)
  if (filters?.page !== undefined) query.set('page', String(filters.page))
  if (filters?.size !== undefined) query.set('size', String(filters.size))

  const qs = query.toString()
  return apiFetch<Page<Task>>(`/api/v1/tasks${qs ? `?${qs}` : ''}`)
}

/**
 * Get a single task by ID.
 */
export function getTask(taskId: string) {
  return apiFetch<Task>(`/api/v1/tasks/${taskId}`)
}

/**
 * Create a new task.
 * poster_id is set from the JWT on the backend — do not send it here.
 */
export function createTask(data: {
  title: string
  description: string
  budgetLKR: number
  deadline: string
  category: TaskCategory
  skillTags: string[]
}) {
  return apiFetch<Task>('/api/v1/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Update a task. Poster only. Only when status = OPEN.
 */
export function updateTask(
  taskId: string,
  data: Partial<{
    title: string
    description: string
    budgetLKR: number
    deadline: string
    category: TaskCategory
    skillTags: string[]
  }>
) {
  return apiFetch<Task>(`/api/v1/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * Delete a task. Poster only. OPEN + zero bids only.
 */
export function deleteTask(taskId: string) {
  return apiFetch<void>(`/api/v1/tasks/${taskId}`, {
    method: 'DELETE',
  })
}

/**
 * Freelancer submits completed work.
 * Transitions task IN_PROGRESS → PENDING_REVIEW.
 */
export function submitWork(taskId: string, submissionNote?: string) {
  return apiFetch<Task>(`/api/v1/tasks/${taskId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ submissionNote }),
  })
}

/**
 * Raise a dispute on a task.
 * Either participant can call this when status is
 * IN_PROGRESS or PENDING_REVIEW.
 */
export function raiseDispute(taskId: string, reason: string) {
  return apiFetch<Task>(`/api/v1/tasks/${taskId}/dispute`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

/**
 * Resolve a disputed task. Admin only.
 * escrowAction: 'RELEASE' pays the freelancer.
 * escrowAction: 'REFUND' returns funds to the poster.
 */
export function resolveDispute(
  taskId: string,
  data: {
    resolution: string
    escrowAction: 'RELEASE' | 'REFUND'
  }
) {
  return apiFetch<Task>(`/api/v1/tasks/${taskId}/resolve`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ─────────────────────────────────────────────
//  Task service — /api/v1/bids
// ─────────────────────────────────────────────

/**
 * Get all bids on a task.
 * If the caller is the task poster, full bidder details are included.
 * Otherwise bidder info is redacted.
 */
export function getTaskBids(
  taskId: string,
  params?: { page?: number; size?: number }
) {
  const query = new URLSearchParams()
  if (params?.page !== undefined) query.set('page', String(params.page))
  if (params?.size !== undefined) query.set('size', String(params.size))

  const qs = query.toString()
  return apiFetch<Page<Bid>>(
    `/api/v1/tasks/${taskId}/bids${qs ? `?${qs}` : ''}`
  )
}

/**
 * Submit a bid on a task.
 * Returns 403 if the caller is the task poster.
 * Returns 409 if the task is not OPEN or the user already bid.
 */
export function createBid(
  taskId: string,
  data: {
    amountLKR: number
    proposal: string
    deliveryDays: number
  }
) {
  return apiFetch<Bid>(`/api/v1/tasks/${taskId}/bids`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Accept a bid. Poster only.
 * Atomically sets this bid to ACCEPTED and all other bids to REJECTED.
 * Returns the updated task.
 */
export function acceptBid(bidId: string) {
  return apiFetch<Task>(`/api/v1/bids/${bidId}/accept`, {
    method: 'PUT',
  })
}

/**
 * Retract a bid. Bidder only. PENDING status only.
 */
export function retractBid(bidId: string) {
  return apiFetch<void>(`/api/v1/bids/${bidId}`, {
    method: 'DELETE',
  })
}

// ─────────────────────────────────────────────
//  Payment service — /api/v1/payments + /escrow
// ─────────────────────────────────────────────

export interface PaymentInitiateResponse {
  merchantId: string
  orderId: string
  items: string
  amountLKR: number
  currency: string
  hash: string
  returnUrl: string
  cancelUrl: string
  notifyUrl: string
}

/**
 * Get the signed PayHere checkout parameters for a task.
 * The frontend uses these to redirect the user to PayHere's
 * hosted checkout page.
 *
 * Usage:
 *   const params = await initiatePayment(taskId)
 *   const checkoutUrl = buildPayHereUrl(params)  (see below)
 *   window.location.href = checkoutUrl
 */
export function initiatePayment(taskId: string) {
  return apiFetch<PaymentInitiateResponse>('/api/v1/payments/initiate', {
    method: 'POST',
    body: JSON.stringify({ taskId }),
  })
}

/**
 * Build the PayHere hosted checkout redirect URL
 * from the params returned by initiatePayment().
 *
 * Usage:
 *   const params = await initiatePayment(taskId)
 *   window.location.href = buildPayHereCheckoutUrl(params)
 */
export function buildPayHereCheckoutUrl(
  params: PaymentInitiateResponse
): string {
  const PAYHERE_BASE =
    process.env.NODE_ENV === 'production'
      ? 'https://www.payhere.lk/pay/checkout'
      : 'https://sandbox.payhere.lk/pay/checkout'

  const query = new URLSearchParams({
    merchant_id: params.merchantId,
    return_url:  params.returnUrl,
    cancel_url:  params.cancelUrl,
    notify_url:  params.notifyUrl,
    order_id:    params.orderId,
    items:       params.items,
    amount:      String(params.amountLKR),
    currency:    params.currency,
    hash:        params.hash,
  })

  return `${PAYHERE_BASE}?${query.toString()}`
}

/**
 * Get an escrow transaction by ID.
 * Only the payer (poster) or payee (freelancer) can retrieve it.
 */
export function getEscrow(escrowId: string) {
  return apiFetch<EscrowTransaction>(`/api/v1/escrow/${escrowId}`)
}

/**
 * Release escrow to the freelancer. Poster only.
 * Escrow must be in HELD status.
 * Triggers ESCROW_RELEASED event → task moves to COMPLETED.
 */
export function releaseEscrow(escrowId: string) {
  return apiFetch<EscrowTransaction>(`/api/v1/escrow/${escrowId}/release`, {
    method: 'POST',
  })
}

// ─────────────────────────────────────────────
//  Notification service — /api/v1/notifications
// ─────────────────────────────────────────────

/**
 * Get notifications for the authenticated user.
 * Paginated, newest-first.
 * Use subscribeToNotifications() for live bell badge updates —
 * this endpoint is for initial load and pagination only.
 */
export function getNotifications(params?: {
  page?: number
  size?: number
  unreadOnly?: boolean
}) {
  const query = new URLSearchParams()
  if (params?.page !== undefined)    query.set('page', String(params.page))
  if (params?.size !== undefined)    query.set('size', String(params.size))
  if (params?.unreadOnly)            query.set('unreadOnly', 'true')

  const qs = query.toString()
  return apiFetch<NotificationPage>(
    `/api/v1/notifications${qs ? `?${qs}` : ''}`
  )
}

/**
 * Mark all notifications as read for the authenticated user.
 */
export function markAllNotificationsRead() {
  return apiFetch<void>('/api/v1/notifications/read', {
    method: 'PUT',
  })
}

/**
 * Mark a single notification as read.
 */
export function markNotificationRead(notificationId: string) {
  return apiFetch<void>(`/api/v1/notifications/${notificationId}/read`, {
    method: 'PUT',
  })
}

// src/lib/api.ts

export enum TaskCategory {
  WEB_DEVELOPMENT = 'WEB_DEVELOPMENT',
  MOBILE_DEVELOPMENT = 'MOBILE_DEVELOPMENT',
  UI_UX_DESIGN = 'UI_UX_DESIGN',
  GRAPHIC_DESIGN = 'GRAPHIC_DESIGN',
  CONTENT_WRITING = 'CONTENT_WRITING',
  TUTORING = 'TUTORING',
  VIDEO_EDITING = 'VIDEO_EDITING',
  OTHER = 'OTHER'
}