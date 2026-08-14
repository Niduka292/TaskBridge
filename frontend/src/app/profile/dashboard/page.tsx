'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listTasks, type Task, type Page } from '@/lib/api'
import { getCurrentUserId } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

// ── Status badge ─────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  OPEN:           'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  IN_PROGRESS:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PENDING_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  COMPLETED:      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  DISPUTED:       'bg-red-500/10 text-red-400 border-red-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN:           'Open',
  IN_PROGRESS:    'In progress',
  PENDING_REVIEW: 'Pending review',
  COMPLETED:      'Completed',
  DISPUTED:       'Disputed',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border
      ${STATUS_STYLES[status] ?? STATUS_STYLES.OPEN}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

// ── Task row ─────────────────────────────────
function TaskRow({ task, role }: { task: Task; role: 'poster' | 'freelancer' }) {
  const daysLeft = Math.ceil(
    (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const deadlineText =
    daysLeft < 0
      ? 'Overdue'
      : daysLeft === 0
      ? 'Due today'
      : `${daysLeft}d left`

  const deadlineColor =
    daysLeft < 0 ? 'text-red-400' : daysLeft <= 2 ? 'text-amber-400' : 'text-zinc-500'

  return (
    <Link href={`/tasks/${task.id}`}>
      <div className="flex items-center gap-4 px-4 py-3.5 rounded-lg
        hover:bg-zinc-800/60 transition-colors border border-transparent
        hover:border-zinc-700/50 group">

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-200 truncate
            group-hover:text-white transition-colors">
            {task.title}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-zinc-500">{task.category.replace(/_/g, ' ')}</span>
            <span className="text-xs text-zinc-600">·</span>
            <span className={`text-xs ${deadlineColor}`}>{deadlineText}</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {role === 'poster' && (
            <span className="text-xs text-zinc-500">
              {task.bidCount} bid{task.bidCount !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-sm font-medium text-white">
            LKR {task.budgetLKR.toLocaleString()}
          </span>
          <StatusBadge status={task.status} />
          <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

// ── Empty state ───────────────────────────────
function EmptyState({ tab }: { tab: 'poster' | 'freelancer' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700
        flex items-center justify-center">
        <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2
              0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2
              2 0 012 2" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-zinc-300 text-sm font-medium mb-1">
          {tab === 'poster' ? 'No tasks posted yet' : 'No jobs yet'}
        </p>
        <p className="text-zinc-500 text-xs">
          {tab === 'poster'
            ? 'Post your first task and start receiving bids.'
            : 'Browse open tasks and submit a bid to get started.'}
        </p>
      </div>
      <Link href={tab === 'poster' ? '/tasks/new' : '/tasks'}>
        <Button size="sm" variant={tab === 'poster' ? 'default' : 'outline'}>
          {tab === 'poster' ? 'Post a task' : 'Browse tasks'}
        </Button>
      </Link>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 rounded-lg">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-zinc-800 rounded w-3/4" />
            <div className="h-3 bg-zinc-800 rounded w-1/3" />
          </div>
          <div className="h-6 bg-zinc-800 rounded w-20" />
        </div>
      ))}
    </div>
  )
}

// ── Summary count card ────────────────────────
function SummaryCard({
  label,
  count,
  color,
}: {
  label: string
  count: number
  color: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
      <p className="text-zinc-500 text-xs mt-0.5">{label}</p>
    </div>
  )
}

// ── Main page ────────────────────────────────
export default function DashboardPage() {
  const [tab, setTab] = useState<'poster' | 'freelancer'>('poster')
  const [userId, setUserId]     = useState<string | null>(null)
  const [tasks, setTasks]       = useState<Page<Task> | null>(null)
  const [loading, setLoading]   = useState(true)

  // Get current user
  useEffect(() => {
    getCurrentUserId().then(setUserId)
  }, [])

  // Fetch tasks on tab or userId change
  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setTasks(null)

    const filter =
      tab === 'poster'
        ? { posterId: userId, size: 50 }
        : { assignedTo: userId, size: 50 }

    listTasks(filter)
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tab, userId])

  // Derive counts from tasks
  const counts = {
    open:      tasks?.content.filter(t => t.status === 'OPEN').length ?? 0,
    active:    tasks?.content.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PENDING_REVIEW').length ?? 0,
    completed: tasks?.content.filter(t => t.status === 'COMPLETED').length ?? 0,
    disputed:  tasks?.content.filter(t => t.status === 'DISPUTED').length ?? 0,
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <Link href="/tasks/new">
            <Button size="sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v16m8-8H4" />
              </svg>
              Post a task
            </Button>
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3">
          <SummaryCard label="Open"      count={counts.open}      color="text-emerald-400" />
          <SummaryCard label="Active"    count={counts.active}    color="text-blue-400" />
          <SummaryCard label="Completed" count={counts.completed} color="text-zinc-300" />
          <SummaryCard label="Disputed"  count={counts.disputed}  color="text-red-400" />
        </div>

        {/* Task list card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-zinc-800">
            {(['poster', 'freelancer'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 text-sm font-medium px-4 py-3.5 transition-colors
                  border-b-2 -mb-px ${
                  tab === t
                    ? 'border-violet-500 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t === 'poster' ? '📌 My Posted Tasks' : '💼 My Jobs'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-4">
            {loading ? (
              <DashboardSkeleton />
            ) : tasks && tasks.content.length > 0 ? (
              <div className="space-y-0.5">
                {tasks.content.map(task => (
                  <TaskRow key={task.id} task={task} role={tab} />
                ))}
              </div>
            ) : (
              <EmptyState tab={tab} />
            )}
          </div>

        </div>

      </div>
    </div>
  )
}