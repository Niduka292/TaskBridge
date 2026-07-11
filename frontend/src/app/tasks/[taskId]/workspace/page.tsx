'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getTask,
  getEscrow,
  submitWork,
  releaseEscrow,
  raiseDispute,
  submitReview,
  type Task,
  type EscrowTransaction,
  type Review,
  ApiError,
} from '@/lib/api'
import {
  getCurrentUserId,
  subscribeToEscrow,
  getMessages,
  sendMessage,
} from '@/lib/supabase'
import { Button } from '@/components/ui/button'

// ── Types ─────────────────────────────────────
interface Message {
  id: string
  task_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

// ── Escrow status badge ───────────────────────
function EscrowBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING:  'bg-zinc-800 text-zinc-400 border-zinc-700',
    HELD:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
    RELEASED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    REFUNDED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }
  const labels: Record<string, string> = {
    PENDING: 'Payment pending', HELD: 'Funds held in escrow',
    RELEASED: 'Payment released', REFUNDED: 'Payment refunded',
  }
  return (
    <span className={`text-xs font-medium px-3 py-1 rounded-full border
      ${styles[status] ?? styles.PENDING}`}>
      {labels[status] ?? status}
    </span>
  )
}

// ── Task status badge ─────────────────────────
function TaskStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    IN_PROGRESS:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PENDING_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    COMPLETED:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    DISPUTED:       'bg-red-500/10 text-red-400 border-red-500/20',
  }
  const labels: Record<string, string> = {
    IN_PROGRESS: 'In progress', PENDING_REVIEW: 'Pending review',
    COMPLETED: 'Completed', DISPUTED: 'Disputed',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border
      ${styles[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  )
}

// ── Star rating input ─────────────────────────
function StarInput({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl leading-none transition-colors"
        >
          <span className={(hover || value) >= i ? 'text-amber-400' : 'text-zinc-700'}>
            ★
          </span>
        </button>
      ))}
    </div>
  )
}

// ── Review form ───────────────────────────────
function ReviewForm({
  taskId,
  revieweeId,
  context,
  onDone,
}: {
  taskId: string
  revieweeId: string
  context: 'AS_POSTER' | 'AS_FREELANCER'
  onDone: () => void
}) {
  const [rating, setRating]   = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [done, setDone]       = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Please select a rating.'); return }
    setLoading(true)
    setError(null)
    try {
      await submitReview(revieweeId, { taskId, revieweeId, context, rating, comment })
      setDone(true)
      setTimeout(onDone, 1500)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409)
        setError('You have already submitted a review for this task.')
      else setError('Failed to submit review.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-6">
        <p className="text-emerald-400 text-sm font-medium">Review submitted!</p>
        <p className="text-zinc-500 text-xs mt-1">
          It will be revealed once the other party submits theirs.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-zinc-400 text-xs mb-2">Your rating</p>
        <StarInput value={rating} onChange={setRating} />
      </div>
      <div>
        <p className="text-zinc-400 text-xs mb-2">Comment (optional)</p>
        <textarea
          rows={3}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share your experience working with this person..."
          className="w-full rounded-lg px-3 py-2 text-sm text-white
            placeholder:text-zinc-500 bg-zinc-800 border border-zinc-700 resize-none
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
            focus-visible:border-violet-500 transition-colors"
        />
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <Button type="submit" loading={loading} size="sm" className="w-full">
        Submit review
      </Button>
    </form>
  )
}

// ── Chat bubble ───────────────────────────────
function ChatBubble({
  message,
  isOwn,
}: {
  message: Message
  isOwn: boolean
}) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
        ${isOwn
          ? 'bg-violet-600 text-white rounded-br-sm'
          : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-bl-sm'
        }`}>
        {message.content}
        <p className={`text-xs mt-1 ${isOwn ? 'text-violet-300' : 'text-zinc-500'}`}>
          {new Date(message.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}

// ── Main workspace page ───────────────────────
export default function WorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.taskId as string

  const [task, setTask]           = useState<Task | null>(null)
  const [escrow, setEscrow]       = useState<EscrowTransaction | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [messages, setMessages]   = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [sendingMsg, setSendingMsg] = useState(false)

  // Action states
  const [submitting, setSubmitting]   = useState(false)
  const [approving, setApproving]     = useState(false)
  const [disputing, setDisputing]     = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [showReviewForm, setShowReviewForm]   = useState(false)
  const [submitNote, setSubmitNote]   = useState('')
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)

  const isOwner    = currentUserId === task?.posterId
  const isAssigned = currentUserId === task?.assignedTo

  // Initial load
  useEffect(() => {
    async function load() {
      try {
        const [t, uid] = await Promise.all([
          getTask(taskId),
          getCurrentUserId(),
        ])
        setTask(t)
        setCurrentUserId(uid)

        // Load messages
        const msgs = await getMessages(taskId)
        setMessages(msgs as Message[])

        // Load escrow — only participants can fetch it
        try {
          const e = await getEscrow(taskId)
          setEscrow(e)
        } catch {}

      } catch {
        setError('Could not load workspace.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [taskId])

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime: new chat messages
  useEffect(() => {
    if (!taskId) return
    const { subscribeToMessages } = require('@/lib/supabase')
    const channel = subscribeToMessages(taskId, (payload: { new: Message }) => {
      setMessages(prev => [...prev, payload.new])
    })
    return () => { channel.unsubscribe() }
  }, [taskId])

  // Realtime: escrow status changes
  useEffect(() => {
    if (!taskId) return
    const channel = subscribeToEscrow(taskId, async () => {
      try {
        const e = await getEscrow(taskId)
        setEscrow(e)
      } catch {}
      // Also refresh task status
      try {
        const t = await getTask(taskId)
        setTask(t)
      } catch {}
    })
    return () => { channel.unsubscribe() }
  }, [taskId])

  // Actions
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!messageInput.trim() || sendingMsg) return
    setSendingMsg(true)
    try {
      await sendMessage(taskId, messageInput.trim())
      setMessageInput('')
    } catch {}
    finally { setSendingMsg(false) }
  }

  async function handleSubmitWork() {
    setSubmitting(true)
    setActionError(null)
    try {
      const updated = await submitWork(taskId, submitNote)
      setTask(updated)
      setShowSubmitForm(false)
      setSubmitNote('')
    } catch {
      setActionError('Failed to submit work. Please try again.')
    } finally { setSubmitting(false) }
  }

  async function handleApproveDelivery() {
    if (!escrow) return
    setApproving(true)
    setActionError(null)
    try {
      const updated = await releaseEscrow(escrow.id)
      setEscrow(updated)
      const t = await getTask(taskId)
      setTask(t)
    } catch {
      setActionError('Failed to release payment. Please try again.')
    } finally { setApproving(false) }
  }

  async function handleRaiseDispute() {
    if (!disputeReason.trim()) return
    setDisputing(true)
    setActionError(null)
    try {
      const updated = await raiseDispute(taskId, disputeReason.trim())
      setTask(updated)
      setShowDisputeForm(false)
    } catch {
      setActionError('Failed to raise dispute. Please try again.')
    } finally { setDisputing(false) }
  }

  // Guards
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-violet-500
          rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-zinc-400">{error ?? 'Workspace not found.'}</p>
          <Button variant="outline" onClick={() => router.push('/tasks')}>
            Back to tasks
          </Button>
        </div>
      </div>
    )
  }

  // If escrow is not HELD yet, redirect back to task detail
  if (!escrow || escrow.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3 max-w-sm">
          <p className="text-zinc-300 text-sm font-medium">
            Workspace not available yet
          </p>
          <p className="text-zinc-500 text-xs">
            Payment must be confirmed before the workspace opens.
          </p>
          <Link href={`/tasks/${taskId}`}>
            <Button variant="outline" size="sm">Back to task</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isCompleted = task.status === 'COMPLETED'
  const isDisputed  = task.status === 'DISPUTED'
  const canSubmit   = isAssigned && task.status === 'IN_PROGRESS'
  const canApprove  = isOwner && task.status === 'PENDING_REVIEW'
  const canDispute  = (isOwner || isAssigned) &&
    (task.status === 'IN_PROGRESS' || task.status === 'PENDING_REVIEW')

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
              <Link href="/dashboard"
                className="hover:text-zinc-300 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <Link href={`/tasks/${taskId}`}
                className="hover:text-zinc-300 transition-colors">
                Task
              </Link>
              <span>/</span>
              <span className="text-zinc-400">Workspace</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight leading-snug">
              {task.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <EscrowBadge status={escrow.status} />
            <TaskStatusBadge status={task.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Actions + Info ── */}
          <div className="space-y-4">

            {/* Escrow info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-500 text-xs mb-3">Escrow</p>
              <p className="text-white text-2xl font-bold mb-1">
                LKR {escrow.amountLKR.toLocaleString()}
              </p>
              <p className="text-zinc-500 text-xs">
                {escrow.status === 'HELD'
                  ? 'Locked until work is approved'
                  : escrow.status === 'RELEASED'
                  ? 'Released to freelancer'
                  : 'Refunded to poster'}
              </p>
            </div>

            {/* Freelancer submit work */}
            {canSubmit && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-sm font-semibold text-white mb-1">
                  Submit your work
                </p>
                <p className="text-zinc-500 text-xs mb-4">
                  Let the poster know you're done. Use the chat to share deliverables.
                </p>
                {!showSubmitForm ? (
                  <Button
                    className="w-full"
                    onClick={() => setShowSubmitForm(true)}
                  >
                    Mark as submitted
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      rows={3}
                      value={submitNote}
                      onChange={e => setSubmitNote(e.target.value)}
                      placeholder="Optional note to the poster about your submission..."
                      className="w-full rounded-lg px-3 py-2 text-sm text-white
                        placeholder:text-zinc-500 bg-zinc-800 border border-zinc-700
                        resize-none focus-visible:outline-none focus-visible:ring-2
                        focus-visible:ring-violet-500 transition-colors"
                    />
                    <div className="flex gap-2">
                      <Button
                        loading={submitting}
                        onClick={handleSubmitWork}
                        className="flex-1"
                      >
                        Confirm submit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { setShowSubmitForm(false); setSubmitNote('') }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pending review state — freelancer view */}
            {isAssigned && task.status === 'PENDING_REVIEW' && (
              <div className="bg-amber-500/5 border border-amber-500/20
                rounded-xl p-5">
                <p className="text-amber-400 text-sm font-medium mb-1">
                  Awaiting review
                </p>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Your submission is with the poster. They will approve delivery
                  and release your payment.
                </p>
              </div>
            )}

            {/* Poster: approve delivery */}
            {canApprove && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-sm font-semibold text-white mb-1">
                  Review submission
                </p>
                <p className="text-zinc-500 text-xs mb-4">
                  The freelancer has submitted their work. Approve to release
                  the payment from escrow.
                </p>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-500"
                  loading={approving}
                  onClick={handleApproveDelivery}
                >
                  Approve & release payment
                </Button>
                <p className="text-zinc-600 text-xs mt-2 text-center">
                  This action cannot be undone
                </p>
              </div>
            )}

            {/* Dispute */}
            {canDispute && !isDisputed && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                {!showDisputeForm ? (
                  <button
                    onClick={() => setShowDisputeForm(true)}
                    className="w-full text-xs text-red-400 hover:text-red-300
                      transition-colors text-left"
                  >
                    Raise a dispute →
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-red-400">Raise a dispute</p>
                    <p className="text-zinc-500 text-xs">
                      Explain the issue. An admin will review and decide the outcome.
                    </p>
                    <textarea
                      rows={3}
                      value={disputeReason}
                      onChange={e => setDisputeReason(e.target.value)}
                      placeholder="Describe the issue clearly..."
                      className="w-full rounded-lg px-3 py-2 text-sm text-white
                        placeholder:text-zinc-500 bg-zinc-800 border border-zinc-700
                        resize-none focus-visible:outline-none focus-visible:ring-2
                        focus-visible:ring-red-500 transition-colors"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        loading={disputing}
                        onClick={handleRaiseDispute}
                        className="flex-1"
                      >
                        Submit dispute
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowDisputeForm(false)
                          setDisputeReason('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Disputed state */}
            {isDisputed && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                <p className="text-red-400 text-sm font-medium mb-1">
                  Dispute in progress
                </p>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {task.disputeReason ?? 'An admin is reviewing this dispute.'}
                </p>
              </div>
            )}

            {/* Completed */}
            {isCompleted && (
              <div className="bg-emerald-500/5 border border-emerald-500/20
                rounded-xl p-5">
                <p className="text-emerald-400 text-sm font-medium mb-1">
                  Task completed
                </p>
                <p className="text-zinc-400 text-xs mb-4">
                  Payment has been released. Leave a review for the other party.
                </p>
                {!showReviewForm ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowReviewForm(true)}
                  >
                    Leave a review
                  </Button>
                ) : (
                  <ReviewForm
                    taskId={taskId}
                    revieweeId={isOwner ? (task.assignedTo ?? '') : task.posterId}
                    context={isOwner ? 'AS_FREELANCER' : 'AS_POSTER'}
                    onDone={() => setShowReviewForm(false)}
                  />
                )}
              </div>
            )}

            {/* Global action error */}
            {actionError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30
                px-4 py-3">
                <p className="text-red-400 text-sm">{actionError}</p>
              </div>
            )}

          </div>

          {/* ── Right: Chat ── */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl
              flex flex-col h-[600px]">

              {/* Chat header */}
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center
                justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">Task chat</h2>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    Only you and the other party can see this
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-zinc-600 text-sm">
                      No messages yet. Say hello!
                    </p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <ChatBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.sender_id === currentUserId}
                    />
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Message input */}
              <form
                onSubmit={handleSendMessage}
                className="px-4 py-3 border-t border-zinc-800 flex gap-3"
              >
                <input
                  type="text"
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sendingMsg || isCompleted}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg
                    px-3 py-2 text-sm text-white placeholder:text-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-violet-500
                    focus:border-violet-500 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!messageInput.trim() || sendingMsg || isCompleted}
                  loading={sendingMsg}
                >
                  Send
                </Button>
              </form>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}