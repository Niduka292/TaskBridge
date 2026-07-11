'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { listTasks, resolveDispute, type Task } from '@/lib/api'
import { isAdmin } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

function Skeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-4 animate-pulse">
      <div className="h-7 bg-zinc-800 rounded w-1/4" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 bg-zinc-900 border border-zinc-800 rounded-xl" />
      ))}
    </div>
  )
}

function ResolveForm({
  task,
  onCancel,
  onResolved,
}: {
  task: Task
  onCancel: () => void
  onResolved: (updated: Task) => void
}) {
  const [resolution, setResolution] = useState('')
  const [escrowAction, setEscrowAction] = useState<'RELEASE' | 'REFUND' | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)
    if (resolution.trim().length < 10) {
      setError('Please describe the resolution in at least 10 characters.')
      return
    }
    if (!escrowAction) {
      setError('Please choose whether to release or refund escrow.')
      return
    }
    setSubmitting(true)
    try {
      const updated = await resolveDispute(task.id, {
        resolution: resolution.trim(),
        escrowAction,
      })
      onResolved(updated)
    } catch {
      setError('Failed to resolve dispute. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-300">Resolution notes</label>
        <textarea
          rows={3}
          value={resolution}
          onChange={e => setResolution(e.target.value)}
          placeholder="Explain the outcome and reasoning for this resolution..."
          disabled={submitting}
          className="w-full rounded-lg px-3 py-2 text-sm text-white bg-zinc-800
            border border-zinc-700 placeholder:text-zinc-500 resize-none
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
            focus-visible:border-violet-500 disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-zinc-300">Escrow action</p>
        <div className="flex gap-3">
          <label className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border
            cursor-pointer transition-colors
            ${escrowAction === 'RELEASE'
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-zinc-700 bg-zinc-800'
            }`}>
            <input
              type="radio"
              name={`escrowAction-${task.id}`}
              checked={escrowAction === 'RELEASE'}
              onChange={() => setEscrowAction('RELEASE')}
              disabled={submitting}
            />
            <span className="text-sm text-zinc-200">Release to freelancer</span>
          </label>
          <label className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border
            cursor-pointer transition-colors
            ${escrowAction === 'REFUND'
              ? 'border-amber-500/40 bg-amber-500/5'
              : 'border-zinc-700 bg-zinc-800'
            }`}>
            <input
              type="radio"
              name={`escrowAction-${task.id}`}
              checked={escrowAction === 'REFUND'}
              onChange={() => setEscrowAction('REFUND')}
              disabled={submitting}
            />
            <span className="text-sm text-zinc-200">Refund poster</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} loading={submitting}>
          Submit resolution
        </Button>
      </div>
    </div>
  )
}

function DisputeCard({
  task,
  onResolved,
}: {
  task: Task
  onResolved: (updated: Task) => void
}) {
  const [resolving, setResolving] = useState(false)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm">{task.title}</p>
          <p className="text-zinc-500 text-xs mt-1">
            Posted by {task.poster.fullName} · LKR {task.budgetLKR.toLocaleString()}
          </p>
        </div>
        {!resolving && (
          <Button size="sm" variant="outline" onClick={() => setResolving(true)}>
            Resolve
          </Button>
        )}
      </div>

      {task.disputeReason && (
        <div className="mt-3 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-xs font-medium mb-1">Dispute reason</p>
          <p className="text-zinc-300 text-sm">{task.disputeReason}</p>
        </div>
      )}

      {resolving && (
        <ResolveForm
          task={task}
          onCancel={() => setResolving(false)}
          onResolved={onResolved}
        />
      )}
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()

  const [authChecked, setAuthChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  const [disputes, setDisputes] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      const admin = await isAdmin()
      if (!admin) {
        router.replace('/profile/dashboard')
        return
      }
      setAuthorized(true)
      setAuthChecked(true)
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (!authChecked || !authorized) return

    async function load() {
      try {
        const result = await listTasks({ status: 'DISPUTED', size: 50 })
        setDisputes(result.content)
      } catch {
        setError('Could not load disputed tasks.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authChecked, authorized])

  function handleResolved(updated: Task) {
    setDisputes(prev => prev.filter(t => t.id !== updated.id))
  }

  if (!authChecked || loading) return <Skeleton />

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="text-zinc-500 text-sm mt-1">Dispute resolution queue</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-base font-semibold text-white">
            Disputed tasks
            <span className="text-zinc-500 font-normal text-sm ml-2">
              ({disputes.length})
            </span>
          </h2>

          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/30 px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {disputes.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3
              bg-zinc-900 border border-zinc-800 rounded-xl">
              <p className="text-zinc-300 text-sm font-medium">No disputes to resolve</p>
              <p className="text-zinc-500 text-xs">All clear for now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map(task => (
                <DisputeCard key={task.id} task={task} onResolved={handleResolved} />
              ))}
            </div>
          )}
        </section>

        {/* User list section intentionally omitted — no confirmed
           GET /api/v1/users list endpoint exists in api.ts yet. */}

      </div>
    </div>
  )
}