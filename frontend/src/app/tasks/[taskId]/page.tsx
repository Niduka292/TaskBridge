'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getTask,
  getTaskBids,
  createBid,
  acceptBid,
  retractBid,
  initiatePayment,
  buildPayHereCheckoutUrl,
  type Task,
  type Bid,
  type Page,
  ApiError,
} from '@/lib/api'
import { getCurrentUserId, subscribeToBids } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ── Helpers ──────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OPEN:           'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    IN_PROGRESS:    'bg-blue-500/10    text-blue-400    border-blue-500/20',
    PENDING_REVIEW: 'bg-amber-500/10   text-amber-400   border-amber-500/20',
    COMPLETED:      'bg-zinc-500/10    text-zinc-400    border-zinc-500/20',
    DISPUTED:       'bg-red-500/10     text-red-400     border-red-500/20',
  }
  const labels: Record<string, string> = {
    OPEN: 'Open', IN_PROGRESS: 'In progress', PENDING_REVIEW: 'Pending review',
    COMPLETED: 'Completed', DISPUTED: 'Disputed',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border
      ${styles[status] ?? styles.OPEN}`}>
      {labels[status] ?? status}
    </span>
  )
}

function BidStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING:  'text-zinc-400 bg-zinc-800 border-zinc-700',
    ACCEPTED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    REJECTED: 'text-red-400 bg-red-500/10 border-red-500/20',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium
      ${styles[status] ?? styles.PENDING}`}>
      {status.toLowerCase()}
    </span>
  )
}

function SkillTag({ label }: { label: string }) {
  return (
    <span className="text-xs px-2.5 py-1 rounded-full bg-violet-600/10
      border border-violet-500/20 text-violet-300">
      {label}
    </span>
  )
}

// ── Skeleton ──────────────────────────────────
function Skeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6 animate-pulse">
      <div className="h-8 bg-zinc-800 rounded w-2/3" />
      <div className="h-4 bg-zinc-800 rounded w-1/3" />
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <div className="h-4 bg-zinc-800 rounded w-full" />
        <div className="h-4 bg-zinc-800 rounded w-5/6" />
        <div className="h-4 bg-zinc-800 rounded w-4/6" />
      </div>
    </div>
  )
}

// ── Bid card ─────────────────────────────────
function BidCard({
  bid,
  isOwner,
  taskStatus,
  onAccept,
  onRetract,
  currentUserId,
  accepting,
}: {
  bid: Bid
  isOwner: boolean
  taskStatus: string
  onAccept: (bidId: string) => void
  onRetract: (bidId: string) => void
  currentUserId: string | null
  accepting: string | null
}) {
  const isMyBid = bid.bidderId === currentUserId

  return (
    <div className={`bg-zinc-800/40 border rounded-lg p-4 space-y-3
      ${bid.status === 'ACCEPTED'
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : 'border-zinc-700/50'}`}>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-violet-600/20 border
            border-violet-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-violet-300 text-xs font-bold">
              {bid.bidder?.fullName?.[0] ?? '?'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">
              {bid.bidder?.fullName ?? (isMyBid ? 'You' : 'Anonymous')}
            </p>
            <p className="text-xs text-zinc-500">
              {bid.deliveryDays} day{bid.deliveryDays !== 1 ? 's' : ''} delivery
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-white font-bold text-sm">
            LKR {bid.amountLKR.toLocaleString()}
          </span>
          <BidStatusBadge status={bid.status} />
        </div>
      </div>

      <p className="text-zinc-400 text-sm leading-relaxed">{bid.proposal}</p>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {/* Poster can accept PENDING bids when task is OPEN */}
        {isOwner && bid.status === 'PENDING' && taskStatus === 'OPEN' && (
          <Button
            size="sm"
            loading={accepting === bid.id}
            onClick={() => onAccept(bid.id)}
          >
            Accept bid
          </Button>
        )}
        {/* Bidder can retract their own PENDING bid */}
        {isMyBid && bid.status === 'PENDING' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRetract(bid.id)}
          >
            Retract
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Bid form ──────────────────────────────────
function BidForm({
  taskId,
  onSuccess,
}: {
  taskId: string
  onSuccess: () => void
}) {
  const [amount, setAmount]       = useState('')
  const [proposal, setProposal]   = useState('')
  const [days, setDays]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function validate() {
    const errors: Record<string, string> = {}
    if (!amount || Number(amount) < 100)
      errors.amount = 'Minimum bid is LKR 100'
    if (!proposal || proposal.trim().length < 20)
      errors.proposal = 'Proposal must be at least 20 characters'
    if (!days || Number(days) < 1)
      errors.days = 'Delivery must be at least 1 day'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setLoading(true)
    try {
      await createBid(taskId, {
        amountLKR: Number(amount),
        proposal: proposal.trim(),
        deliveryDays: Number(days),
      })
      setAmount(''); setProposal(''); setDays('')
      onSuccess()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) setError('You cannot bid on your own task.')
        else if (err.status === 409) setError('You have already placed a bid on this task.')
        else setError('Failed to submit bid. Please try again.')
      } else {
        setError('Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h3 className="text-base font-semibold text-white mb-5">Place a bid</h3>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount" error={!!fieldErrors.amount}>
              Your bid (LKR)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g. 3500"
              value={amount}
              onChange={e => {
                setAmount(e.target.value)
                setFieldErrors(p => ({ ...p, amount: '' }))
              }}
              error={!!fieldErrors.amount}
              disabled={loading}
            />
            {fieldErrors.amount && (
              <p className="text-red-400 text-xs">{fieldErrors.amount}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="days" error={!!fieldErrors.days}>
              Delivery (days)
            </Label>
            <Input
              id="days"
              type="number"
              placeholder="e.g. 3"
              value={days}
              onChange={e => {
                setDays(e.target.value)
                setFieldErrors(p => ({ ...p, days: '' }))
              }}
              error={!!fieldErrors.days}
              disabled={loading}
            />
            {fieldErrors.days && (
              <p className="text-red-400 text-xs">{fieldErrors.days}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="proposal" error={!!fieldErrors.proposal}>
            Your proposal
          </Label>
          <textarea
            id="proposal"
            rows={4}
            placeholder="Describe your approach, relevant experience, and why you're the right person for this task..."
            value={proposal}
            onChange={e => {
              setProposal(e.target.value)
              setFieldErrors(p => ({ ...p, proposal: '' }))
            }}
            disabled={loading}
            className={`w-full rounded-lg px-3 py-2 text-sm text-white
              placeholder:text-zinc-500 bg-zinc-800 border resize-none
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-0 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              ${fieldErrors.proposal
                ? 'border-red-500 focus-visible:ring-red-500'
                : 'border-zinc-700 focus-visible:ring-violet-500 focus-visible:border-violet-500'
              }`}
          />
          <div className="flex justify-between">
            {fieldErrors.proposal
              ? <p className="text-red-400 text-xs">{fieldErrors.proposal}</p>
              : <span />
            }
            <p className="text-zinc-600 text-xs">{proposal.length} chars</p>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/30 px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Submit bid
        </Button>
      </form>
    </div>
  )
}

// ── Main page ─────────────────────────────────
export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.taskId as string

  const [task, setTask]             = useState<Task | null>(null)
  const [bids, setBids]             = useState<Page<Bid> | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [accepting, setAccepting]   = useState<string | null>(null)
  const [paying, setPaying]         = useState(false)
  const [showBidForm, setShowBidForm] = useState(false)

  const isOwner    = currentUserId === task?.posterId
  const isAssigned = currentUserId === task?.assignedTo
  const acceptedBid = bids?.content.find(b => b.status === 'ACCEPTED')

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
        const b = await getTaskBids(taskId, { size: 50 })
        setBids(b)
      } catch {
        setError('Could not load task.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [taskId])

  // Realtime bid count subscription
  useEffect(() => {
    if (!taskId) return
    const channel = subscribeToBids(taskId, () => {
      setTask(prev => prev ? { ...prev, bidCount: prev.bidCount + 1 } : prev)
      // Refresh bid list
      getTaskBids(taskId, { size: 50 }).then(setBids).catch(() => {})
    })
    return () => { channel.unsubscribe() }
  }, [taskId])

  async function handleAcceptBid(bidId: string) {
    setAccepting(bidId)
    try {
      const updated = await acceptBid(bidId)
      setTask(updated)
      const b = await getTaskBids(taskId, { size: 50 })
      setBids(b)
    } catch {
      // silently fail — show nothing
    } finally {
      setAccepting(null)
    }
  }

  async function handleRetractBid(bidId: string) {
    try {
      await retractBid(bidId)
      const b = await getTaskBids(taskId, { size: 50 })
      setBids(b)
    } catch {}
  }

  async function handleProceedToPayment() {
    if (!task) return
    setPaying(true)
    try {
      const params = await initiatePayment(task.id)
      const url = buildPayHereCheckoutUrl(params)
      window.location.href = url
    } catch {
      setPaying(false)
    }
  }

  if (loading) return <Skeleton />

  if (error || !task) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-zinc-400">{error ?? 'Task not found.'}</p>
          <Button variant="outline" onClick={() => router.push('/tasks')}>
            Back to tasks
          </Button>
        </div>
      </div>
    )
  }

  const daysLeft = Math.ceil(
    (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const deadlineText =
    daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due today' : `${daysLeft} days left`
  const deadlineColor =
    daysLeft < 0 ? 'text-red-400' : daysLeft <= 2 ? 'text-amber-400' : 'text-zinc-500'

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Task info ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                <Link href="/tasks" className="hover:text-zinc-300 transition-colors">
                  Tasks
                </Link>
                <span>/</span>
                <span className="text-zinc-400">{task.category.replace(/_/g, ' ')}</span>
              </div>

              <div className="flex items-start justify-between gap-4 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight leading-snug flex-1">
                  {task.title}
                </h1>
                <StatusBadge status={task.status} />
              </div>
            </div>

            {/* Description */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-zinc-300 mb-3">
                Task description
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>

              {/* Skill tags */}
              {task.skillTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-zinc-800">
                  {task.skillTags.map(tag => (
                    <SkillTag key={tag} label={tag} />
                  ))}
                </div>
              )}
            </div>

            {/* Accepted bid — workspace CTA */}
            {acceptedBid && task.status !== 'OPEN' && (
              <div className="bg-emerald-500/5 border border-emerald-500/20
                rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-emerald-400 text-sm font-medium mb-0.5">
                    Bid accepted
                  </p>
                  <p className="text-zinc-400 text-xs">
                    {acceptedBid.bidder?.fullName ?? 'Freelancer'} ·{' '}
                    LKR {acceptedBid.amountLKR.toLocaleString()} ·{' '}
                    {acceptedBid.deliveryDays} days
                  </p>
                </div>

                {/* Poster: proceed to payment if escrow not yet initiated */}
                {isOwner && task.status === 'OPEN' && (
                  <Button loading={paying} onClick={handleProceedToPayment}>
                    Proceed to payment
                  </Button>
                )}

                {/* Go to workspace if work is underway */}
                {(task.status === 'IN_PROGRESS' ||
                  task.status === 'PENDING_REVIEW' ||
                  task.status === 'DISPUTED') &&
                  (isOwner || isAssigned) && (
                  <Link href={`/tasks/${task.id}/workspace`}>
                    <Button>Go to workspace</Button>
                  </Link>
                )}
              </div>
            )}

            {/* Bids section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-white">
                  Bids
                  <span className="text-zinc-500 font-normal text-sm ml-2">
                    ({task.bidCount})
                  </span>
                </h2>
                {/* Toggle bid form for non-owners on OPEN tasks */}
                {!isOwner && task.status === 'OPEN' && currentUserId && (
                  <Button
                    size="sm"
                    variant={showBidForm ? 'outline' : 'default'}
                    onClick={() => setShowBidForm(o => !o)}
                  >
                    {showBidForm ? 'Cancel' : 'Place a bid'}
                  </Button>
                )}
              </div>

              {/* Inline bid form */}
              {showBidForm && (
                <div className="mb-5">
                  <BidForm
                    taskId={taskId}
                    onSuccess={() => {
                      setShowBidForm(false)
                      getTaskBids(taskId, { size: 50 }).then(setBids).catch(() => {})
                    }}
                  />
                </div>
              )}

              {/* Bid list */}
              {bids && bids.content.length > 0 ? (
                <div className="space-y-3">
                  {bids.content.map(bid => (
                    <BidCard
                      key={bid.id}
                      bid={bid}
                      isOwner={isOwner}
                      taskStatus={task.status}
                      onAccept={handleAcceptBid}
                      onRetract={handleRetractBid}
                      currentUserId={currentUserId}
                      accepting={accepting}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-zinc-500 text-sm">No bids yet.</p>
                  {!isOwner && task.status === 'OPEN' && (
                    <p className="text-zinc-600 text-xs mt-1">
                      Be the first to bid on this task.
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* ── Right: Sidebar ── */}
          <div className="space-y-4">

            {/* Budget & deadline */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Budget</p>
                <p className="text-white text-2xl font-bold">
                  LKR {task.budgetLKR.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs mb-1">Deadline</p>
                <p className={`text-sm font-medium ${deadlineColor}`}>
                  {deadlineText}
                </p>
                <p className="text-zinc-600 text-xs mt-0.5">
                  {new Date(task.deadline).toLocaleDateString('en-US', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs mb-1">Category</p>
                <p className="text-zinc-300 text-sm">
                  {task.category.replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            {/* Poster */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-500 text-xs mb-3">Posted by</p>
              <Link
                href={`/profile/${task.posterId}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-full bg-violet-600/20 border
                  border-violet-500/30 flex items-center justify-center flex-shrink-0">
                  {task.poster.avatarUrl ? (
                    <img src={task.poster.avatarUrl} alt=""
                      className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-violet-300 text-sm font-bold">
                      {task.poster.fullName[0]}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200
                    group-hover:text-white transition-colors">
                    {task.poster.fullName}
                  </p>
                  {task.poster.avgRatingAsFreelancer > 0 && (
                    <p className="text-xs text-zinc-500">
                      ★ {task.poster.avgRatingAsFreelancer.toFixed(1)}
                    </p>
                  )}
                </div>
              </Link>
            </div>

            {/* Owner actions */}
            {isOwner && task.status === 'OPEN' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5
                space-y-2">
                <p className="text-zinc-500 text-xs mb-3">Manage task</p>
                <Link href={`/tasks/${task.id}/edit`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Edit task
                  </Button>
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}