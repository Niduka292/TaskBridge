'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTask, TaskCategory, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ── Constants ─────────────────────────────────
const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: TaskCategory.WEB_DEVELOPMENT,    label: 'Web Development' },
  { value: TaskCategory.MOBILE_DEVELOPMENT, label: 'Mobile Development' },
  { value: TaskCategory.UI_UX_DESIGN,       label: 'UI / UX Design' },
  { value: TaskCategory.GRAPHIC_DESIGN,     label: 'Graphic Design' },
  { value: TaskCategory.CONTENT_WRITING,    label: 'Content Writing' },
  { value: TaskCategory.TUTORING,           label: 'Tutoring' },
  { value: TaskCategory.VIDEO_EDITING,      label: 'Video Editing' },
  { value: TaskCategory.OTHER,              label: 'Other' },
]

const POPULAR_TAGS = [
  'React', 'Next.js', 'Node.js', 'Spring Boot', 'Python',
  'PostgreSQL', 'MongoDB', 'Figma', 'Tailwind CSS', 'TypeScript',
  'Java', 'Flutter', 'Machine Learning', 'Photoshop', 'WordPress',
]

// ── Step indicator ────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center
            text-xs font-semibold transition-colors ${
            i < current
              ? 'bg-violet-600 text-white'
              : i === current
              ? 'bg-violet-600/20 border-2 border-violet-500 text-violet-400'
              : 'bg-zinc-800 border border-zinc-700 text-zinc-600'
          }`}>
            {i < current ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          {i < total - 1 && (
            <div className={`w-8 h-0.5 rounded transition-colors ${
              i < current ? 'bg-violet-600' : 'bg-zinc-800'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Field wrapper ─────────────────────────────
function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label error={!!error} required={required}>
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-red-400 text-xs">{error}</p>
      ) : hint ? (
        <p className="text-zinc-500 text-xs">{hint}</p>
      ) : null}
    </div>
  )
}

// ── Tag input ─────────────────────────────────
function TagInput({
  tags,
  onChange,
  error,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  error?: string
}) {
  const [input, setInput] = useState('')

  function addTag(value: string) {
    const clean = value.trim().replace(/,/g, '')
    if (!clean || tags.includes(clean) || tags.length >= 8) return
    onChange([...tags, clean])
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(tags.filter(t => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="space-y-3">
      {/* Tag pills display + input */}
      <div className={`min-h-[42px] w-full rounded-lg px-3 py-2 bg-zinc-800
        border transition-colors flex flex-wrap gap-2 items-center
        focus-within:ring-2 focus-within:ring-offset-0
        ${error
          ? 'border-red-500 focus-within:ring-red-500'
          : 'border-zinc-700 focus-within:ring-violet-500 focus-within:border-violet-500'
        }`}>
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1.5 text-xs
            px-2.5 py-1 rounded-full bg-violet-600/15 border border-violet-500/25
            text-violet-300 font-medium">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-violet-400 hover:text-white transition-colors
                leading-none w-3 h-3 flex items-center justify-center"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) addTag(input) }}
          placeholder={tags.length === 0 ? 'Type a skill and press Enter...' : ''}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-white
            placeholder:text-zinc-500 focus:outline-none"
        />
      </div>

      {/* Popular tag suggestions */}
      <div className="flex flex-wrap gap-1.5">
        {POPULAR_TAGS.filter(t => !tags.includes(t)).slice(0, 10).map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => addTag(tag)}
            disabled={tags.length >= 8}
            className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 border
              border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500
              transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            + {tag}
          </button>
        ))}
      </div>

      <p className="text-zinc-600 text-xs">{tags.length}/8 tags</p>
    </div>
  )
}

// ── Form state ────────────────────────────────
interface FormData {
  title: string
  description: string
  category: TaskCategory | ''
  skillTags: string[]
  budgetLKR: string
  deadline: string
}

interface FieldErrors {
  title?: string
  description?: string
  category?: string
  skillTags?: string
  budgetLKR?: string
  deadline?: string
}

// ── Main page ─────────────────────────────────
export default function PostTaskPage() {
  const router = useRouter()

  const [step, setStep] = useState(0) // 0 = details, 1 = requirements, 2 = review
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    skillTags: [],
    budgetLKR: '',
    deadline: '',
  })

  const [errors, setErrors] = useState<FieldErrors>({})

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  // Min date for deadline picker = tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  // ── Validation per step ───────────────────────
  function validateStep0(): boolean {
    const e: FieldErrors = {}
    if (!form.title.trim() || form.title.trim().length < 5)
      e.title = 'Title must be at least 5 characters'
    if (form.title.trim().length > 120)
      e.title = 'Title must be under 120 characters'
    if (!form.description.trim() || form.description.trim().length < 20)
      e.description = 'Description must be at least 20 characters'
    if (!form.category)
      e.category = 'Please select a category'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep1(): boolean {
    const e: FieldErrors = {}
    if (!form.budgetLKR || Number(form.budgetLKR) < 100)
      e.budgetLKR = 'Minimum budget is LKR 100'
    if (!form.deadline)
      e.deadline = 'Please set a deadline'
    else if (new Date(form.deadline) <= new Date())
      e.deadline = 'Deadline must be in the future'
    if (form.skillTags.length === 0)
      e.skillTags = 'Add at least one skill tag'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (step === 0 && !validateStep0()) return
    if (step === 1 && !validateStep1()) return
    setStep(s => s + 1)
  }

  // ── Submit ────────────────────────────────────
  async function handleSubmit() {
    setGlobalError(null)
    setLoading(true)
    try {
      const task = await createTask({
        title:       form.title.trim(),
        description: form.description.trim(),
        category:    form.category as TaskCategory,
        skillTags:   form.skillTags,
        budgetLKR:   Number(form.budgetLKR),
        deadline:    new Date(form.deadline).toISOString(),
      })
      router.push(`/tasks/${task.id}`)
    } catch (err) {
      if (err instanceof ApiError) {
        setGlobalError(err.body?.message as string ?? 'Failed to post task.')
      } else {
        setGlobalError('Something went wrong. Please try again.')
      }
      setStep(0)
    } finally {
      setLoading(false)
    }
  }

  const STEP_LABELS = ['Task details', 'Requirements', 'Review & post']

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Post a task</h1>
          <p className="text-zinc-500 text-sm">
            Describe what you need done and receive bids from students.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          <StepIndicator current={step} total={3} />
          <span className="text-xs text-zinc-500">
            Step {step + 1} of 3 — {STEP_LABELS[step]}
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">

          {/* ── Step 0: Task details ── */}
          {step === 0 && (
            <div className="space-y-6">
              <Field
                label="Task title"
                hint="Be specific — good titles get more relevant bids"
                error={errors.title}
                required
              >
                <Input
                  placeholder="e.g. Build a responsive landing page with React and Tailwind"
                  value={form.title}
                  onChange={e => update('title', e.target.value)}
                  error={!!errors.title}
                  maxLength={120}
                />
                <div className="flex justify-end mt-1">
                  <span className={`text-xs ${
                    form.title.length > 100 ? 'text-amber-400' : 'text-zinc-600'
                  }`}>
                    {form.title.length}/120
                  </span>
                </div>
              </Field>

              <Field
                label="Category"
                error={errors.category}
                required
              >
                <select
                  value={form.category}
                  onChange={e => update('category', e.target.value as TaskCategory)}
                  className={`w-full h-10 rounded-lg px-3 text-sm bg-zinc-800
                    border transition-colors focus:outline-none focus:ring-2
                    focus:ring-offset-0 cursor-pointer
                    ${errors.category
                      ? 'border-red-500 text-white focus:ring-red-500'
                      : 'border-zinc-700 text-white focus:ring-violet-500 focus:border-violet-500'
                    } ${!form.category ? 'text-zinc-500' : ''}`}
                >
                  <option value="" disabled>Select a category...</option>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>

              <Field
                label="Description"
                hint="What exactly needs to be done? What does a successful outcome look like?"
                error={errors.description}
                required
              >
                <textarea
                  rows={6}
                  placeholder="Describe the task in detail. Include any specific requirements, preferred tools or frameworks, expected output format, and anything else that will help freelancers understand the scope..."
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 text-sm text-white
                    placeholder:text-zinc-500 bg-zinc-800 border resize-none
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-offset-0 transition-colors
                    ${errors.description
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : 'border-zinc-700 focus-visible:ring-violet-500 focus-visible:border-violet-500'
                    }`}
                />
                <div className="flex justify-between mt-1">
                  {errors.description
                    ? <p className="text-red-400 text-xs">{errors.description}</p>
                    : <span />
                  }
                  <span className={`text-xs ${
                    form.description.length < 20 && form.description.length > 0
                      ? 'text-amber-400'
                      : 'text-zinc-600'
                  }`}>
                    {form.description.length} chars
                  </span>
                </div>
              </Field>
            </div>
          )}

          {/* ── Step 1: Requirements ── */}
          {step === 1 && (
            <div className="space-y-6">
              <Field
                label="Required skills"
                hint="Tag the skills needed. Click suggestions or type and press Enter."
                error={errors.skillTags}
                required
              >
                <TagInput
                  tags={form.skillTags}
                  onChange={tags => update('skillTags', tags)}
                  error={errors.skillTags}
                />
              </Field>

              <div className="grid grid-cols-2 gap-5">
                <Field
                  label="Budget (LKR)"
                  hint="Minimum LKR 100"
                  error={errors.budgetLKR}
                  required
                >
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2
                      text-zinc-500 text-sm pointer-events-none">
                      LKR
                    </span>
                    <Input
                      type="number"
                      placeholder="5000"
                      min={100}
                      value={form.budgetLKR}
                      onChange={e => update('budgetLKR', e.target.value)}
                      error={!!errors.budgetLKR}
                      className="pl-12"
                    />
                  </div>
                </Field>

                <Field
                  label="Deadline"
                  hint="When do you need this done by?"
                  error={errors.deadline}
                  required
                >
                  <Input
                    type="date"
                    min={minDate}
                    value={form.deadline}
                    onChange={e => update('deadline', e.target.value)}
                    error={!!errors.deadline}
                    className="[color-scheme:dark]"
                  />
                </Field>
              </div>

              {/* Budget guidance */}
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg
                p-4 space-y-2">
                <p className="text-xs font-medium text-zinc-300">Budget guidance</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { range: 'LKR 500–2,000', label: 'Simple task', eg: 'Logo, short article' },
                    { range: 'LKR 2,000–8,000', label: 'Medium task', eg: 'Landing page, report' },
                    { range: 'LKR 8,000+', label: 'Complex task', eg: 'Full app, long project' },
                  ].map(b => (
                    <button
                      key={b.range}
                      type="button"
                      onClick={() => {
                        const val = b.range.split('–')[0].replace(/[^0-9]/g, '')
                        update('budgetLKR', val)
                      }}
                      className="text-left p-2.5 rounded-lg bg-zinc-800 border
                        border-zinc-700 hover:border-violet-500/40
                        hover:bg-violet-600/5 transition-colors"
                    >
                      <p className="text-violet-400 text-xs font-medium">{b.range}</p>
                      <p className="text-zinc-300 text-xs mt-0.5">{b.label}</p>
                      <p className="text-zinc-600 text-xs">{b.eg}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Review ── */}
          {step === 2 && (
            <div className="space-y-5">
              <p className="text-zinc-400 text-sm">
                Review your task before posting. Once posted, freelancers can
                start bidding immediately.
              </p>

              {/* Summary card */}
              <div className="space-y-4">

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 mb-1">Title</p>
                  <p className="text-white text-sm font-medium">{form.title}</p>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 mb-1">Category</p>
                  <p className="text-white text-sm">
                    {CATEGORIES.find(c => c.value === form.category)?.label}
                  </p>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 mb-2">Description</p>
                  <p className="text-zinc-300 text-sm leading-relaxed line-clamp-4">
                    {form.description}
                  </p>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 mb-2">Skills required</p>
                  <div className="flex flex-wrap gap-1.5">
                    {form.skillTags.map(tag => (
                      <span key={tag} className="text-xs px-2.5 py-1 rounded-full
                        bg-violet-600/10 border border-violet-500/20 text-violet-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                    <p className="text-xs text-zinc-500 mb-1">Budget</p>
                    <p className="text-white text-lg font-bold">
                      LKR {Number(form.budgetLKR).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                    <p className="text-xs text-zinc-500 mb-1">Deadline</p>
                    <p className="text-white text-sm font-medium">
                      {new Date(form.deadline).toLocaleDateString('en-US', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {globalError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30
                  px-4 py-3">
                  <p className="text-red-400 text-sm">{globalError}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6
            border-t border-zinc-800">
            <Button
              variant="outline"
              onClick={() => step === 0 ? router.back() : setStep(s => s - 1)}
            >
              {step === 0 ? 'Cancel' : '← Back'}
            </Button>

            {step < 2 ? (
              <Button onClick={handleNext}>
                Continue →
              </Button>
            ) : (
              <Button
                loading={loading}
                onClick={handleSubmit}
                className="bg-violet-600 hover:bg-violet-500 px-8"
              >
                Post task
              </Button>
            )}
          </div>

        </div>

        {/* Trust note */}
        <p className="text-center text-zinc-600 text-xs mt-6">
          Your task will be visible to all verified students on TASKBRIDGE
        </p>

      </div>
    </div>
  )
}