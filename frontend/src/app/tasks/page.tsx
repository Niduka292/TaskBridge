'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { listTasks, type Task, type TaskCategory, type TaskStatus } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ── Constants ────────────────────────────────
const CATEGORIES: { value: TaskCategory | ''; label: string }[] = [
  { value: '', label: 'All categories' },
  { value: 'WEB_DEVELOPMENT',    label: 'Web Development' },
  { value: 'MOBILE_DEVELOPMENT', label: 'Mobile Development' },
  { value: 'UI_UX_DESIGN',       label: 'UI / UX Design' },
  { value: 'GRAPHIC_DESIGN',     label: 'Graphic Design' },
  { value: 'DATA_ANALYSIS',      label: 'Data Analysis' },
  { value: 'CONTENT_WRITING',    label: 'Content Writing' },
  { value: 'TUTORING',           label: 'Tutoring' },
  { value: 'OTHER',              label: 'Other' },
]

const SORT_OPTIONS = [
  { value: 'createdAt,desc',  label: 'Newest first' },
  { value: 'budgetLKR,desc',  label: 'Highest budget' },
  { value: 'deadline,asc',    label: 'Deadline soon' },
]

const STATUS_OPTIONS: { value: TaskStatus | ''; label: string }[] = [
  { value: '',          label: 'All statuses' },
  { value: 'OPEN',      label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
]

// ── Status badge ─────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  OPEN:           'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  IN_PROGRESS:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PENDING_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  COMPLETED:      'bg-zinc-600/20 text-zinc-400 border-zinc-600/30',
  DISPUTED:       'bg-red-500/10 text-red-400 border-red-500/20',
}

function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, ' ')
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize
      ${STATUS_STYLES[status] ?? STATUS_STYLES.OPEN}`}>
      {label.toLowerCase()}
    </span>
  )
}

// ── Task card ────────────────────────────────
function TaskCard({ task }: { task: Task }) {
  const daysLeft = Math.ceil(
    (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const deadlineText =
    daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`
  const deadlineColor =
    daysLeft < 0 ? 'text-red-400' : daysLeft <= 2 ? 'text-amber-400' : 'text-zinc-500'

  return (
    <Link href={`/tasks/${task.id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5
        hover:border-zinc-700 hover:bg-zinc-800/60 transition-all duration-150
        group cursor-pointer">

        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white
              transition-colors leading-snug line-clamp-2">
              {task.title}
            </h3>
          </div>
          <StatusBadge status={task.status} />
        </div>

        {/* Description */}
        <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2 mb-4">
          {task.description}
        </p>

        {/* Skill tags */}
        {task.skillTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {task.skillTags.slice(0, 4).map(tag => (
              <span key={tag}
                className="text-xs px-2 py-0.5 rounded bg-zinc-800 border
                  border-zinc-700 text-zinc-400">
                {tag}
              </span>
            ))}
            {task.skillTags.length > 4 && (
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 border
                border-zinc-700 text-zinc-500">
                +{task.skillTags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
          <div className="flex items-center gap-3">
            {/* Poster avatar */}
            <div className="flex items-center gap-1.5">
              {task.poster.avatarUrl ? (
                <img src={task.poster.avatarUrl} alt=""
                  className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-violet-600/20 flex
                  items-center justify-center">
                  <span className="text-violet-300 text-xs font-bold leading-none">
                    {task.poster.fullName[0]}
                  </span>
                </div>
              )}
              <span className="text-xs text-zinc-500 truncate max-w-[100px]">
                {task.poster.fullName}
              </span>
            </div>
            <span className="text-zinc-700 text-xs">·</span>
            <span className={`text-xs ${deadlineColor}`}>{deadlineText}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">
              {task.bidCount} bid{task.bidCount !== 1 ? 's' : ''}
            </span>
            <span className="text-sm font-bold text-white">
              LKR {task.budgetLKR.toLocaleString()}
            </span>
          </div>
        </div>

      </div>
    </Link>
  )
}

// ── Task card skeleton ────────────────────────
function TaskCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
      <div className="flex justify-between gap-3 mb-3">
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-5 bg-zinc-800 rounded w-16" />
      </div>
      <div className="h-3 bg-zinc-800 rounded w-full mb-1.5" />
      <div className="h-3 bg-zinc-800 rounded w-2/3 mb-4" />
      <div className="flex gap-1.5 mb-4">
        <div className="h-5 bg-zinc-800 rounded w-14" />
        <div className="h-5 bg-zinc-800 rounded w-18" />
      </div>
      <div className="flex justify-between pt-3 border-t border-zinc-800">
        <div className="h-3 bg-zinc-800 rounded w-24" />
        <div className="h-4 bg-zinc-800 rounded w-20" />
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center
      py-20 gap-4">
      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700
        flex items-center justify-center">
        <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5
              0 0016.803 15.803z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-zinc-300 text-sm font-medium mb-1">
          {hasFilters ? 'No tasks match your filters' : 'No tasks yet'}
        </p>
        <p className="text-zinc-500 text-xs">
          {hasFilters
            ? 'Try adjusting your search or filters.'
            : 'Be the first to post a task.'}
        </p>
      </div>
      {!hasFilters && (
        <Link href="/tasks/new">
          <Button size="sm">Post a task</Button>
        </Link>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────
export default function TasksPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // Filter state — initialised from URL query params
  const [search,   setSearch]   = useState(searchParams.get('search') ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')
  const [status,   setStatus]   = useState(searchParams.get('status') ?? '')
  const [budgetMin, setBudgetMin] = useState(searchParams.get('budgetMin') ?? '')
  const [budgetMax, setBudgetMax] = useState(searchParams.get('budgetMax') ?? '')
  const [sort,     setSort]     = useState(searchParams.get('sort') ?? 'createdAt,desc')
  const [page,     setPage]     = useState(0)

  const [tasks,   setTasks]   = useState<Task[]>([])
  const [total,   setTotal]   = useState(0)
  const [pages,   setPages]   = useState(0)
  const [loading, setLoading] = useState(true)

  const PAGE_SIZE = 12

  const hasFilters = !!(search || category || status || budgetMin || budgetMax)

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listTasks({
        ...(search    ? { search }    : {}),
        ...(category  ? { category: category as TaskCategory } : {}),
        ...(status    ? { status: status as TaskStatus }       : {}),
        ...(budgetMin ? { budgetMin: Number(budgetMin) }       : {}),
        ...(budgetMax ? { budgetMax: Number(budgetMax) }       : {}),
        sort: sort as 'createdAt,desc' | 'budgetLKR,desc' | 'deadline,asc',
        page,
        size: PAGE_SIZE,
      })
      setTasks(result.content)
      setTotal(result.totalElements)
      setPages(result.totalPages)
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [search, category, status, budgetMin, budgetMax, sort, page])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  // Reset to page 0 when filters change
  function applyFilter(key: string, value: string) {
    setPage(0)
    if (key === 'search')    setSearch(value)
    if (key === 'category')  setCategory(value)
    if (key === 'status')    setStatus(value)
    if (key === 'budgetMin') setBudgetMin(value)
    if (key === 'budgetMax') setBudgetMax(value)
    if (key === 'sort')      setSort(value)
  }

  function clearFilters() {
    setSearch(''); setCategory(''); setStatus('')
    setBudgetMin(''); setBudgetMax(''); setPage(0)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Browse Tasks</h1>
            {!loading && (
              <p className="text-zinc-500 text-sm mt-1">
                {total} task{total !== 1 ? 's' : ''} available
              </p>
            )}
          </div>
          <Link href="/tasks/new">
            <Button>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v16m8-8H4" />
              </svg>
              Post a task
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 space-y-3">

          {/* Search + sort */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4
                text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803
                    7.5 7.5 0 0016.803 15.803z" />
              </svg>
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={e => applyFilter('search', e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={sort}
              onChange={e => applyFilter('sort', e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm
                rounded-lg px-3 py-2 focus:outline-none focus:ring-2
                focus:ring-violet-500 focus:border-violet-500 cursor-pointer"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Category + Status + Budget */}
          <div className="flex gap-3 flex-wrap">
            <select
              value={category}
              onChange={e => applyFilter('category', e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm
                rounded-lg px-3 py-2 focus:outline-none focus:ring-2
                focus:ring-violet-500 cursor-pointer min-w-[160px]"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select
              value={status}
              onChange={e => applyFilter('status', e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm
                rounded-lg px-3 py-2 focus:outline-none focus:ring-2
                focus:ring-violet-500 cursor-pointer min-w-[130px]"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min LKR"
                value={budgetMin}
                onChange={e => applyFilter('budgetMin', e.target.value)}
                className="w-28 text-sm"
              />
              <span className="text-zinc-600 text-sm">–</span>
              <Input
                type="number"
                placeholder="Max LKR"
                value={budgetMax}
                onChange={e => applyFilter('budgetMax', e.target.value)}
                className="w-28 text-sm"
              />
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-zinc-500 hover:text-zinc-300
                  transition-colors px-2 underline-offset-2 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Task grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <TaskCardSkeleton key={i} />)
          ) : tasks.length > 0 ? (
            tasks.map(task => <TaskCard key={task.id} task={task} />)
          ) : (
            <EmptyState hasFilters={hasFilters} />
          )}
        </div>

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              ← Previous
            </Button>
            <span className="text-sm text-zinc-500">
              Page {page + 1} of {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              Next →
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}