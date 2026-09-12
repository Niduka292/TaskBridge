'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getTask, type Task, ApiError } from '@/lib/api'
import { subscribeToEscrow } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

type ViewState = 'waiting' | 'held' | 'cancelled' | 'failed' | 'error'

function Spinner() {
  return (
    <div className="w-10 h-10 rounded-full border-2 border-zinc-700
      border-t-violet-500 animate-spin" />
  )
}

export default function PaymentReturnPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const taskId = searchParams.get('order_id')
  const status = searchParams.get('status') // success | cancel | fail

  const [view, setView] = useState<ViewState>('waiting')
  const [task, setTask] = useState<Task | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const redirectedRef = useRef(false)

  // Immediately branch on PayHere's reported status before touching escrow.
  useEffect(() => {
    if (!taskId) {
      setView('error')
      setErrorMsg('Missing task reference. Please return to the task and try again.')
      return
    }

    if (status === 'cancel') {
      setView('cancelled')
      return
    }
    if (status === 'fail') {
      setView('failed')
      return
    }
    if (status !== 'success') {
      setView('error')
      setErrorMsg('Unrecognised payment status.')
      return
    }

    // status === 'success' → load task context, then wait for escrow to flip to HELD.
    let cancelled = false

    async function loadAndCheck() {
      try {
        const t = await getTask(taskId as string)
        if (cancelled) return
        setTask(t)

        // Per the state machine: OPEN → IN_PROGRESS happens automatically
        // when escrow flips to HELD. If the webhook already landed before
        // this page loaded, the task is no longer OPEN — safe to proceed
        // without waiting on the realtime event.
        if (t.status !== 'OPEN') {
          goToWorkspace(taskId as string)
        }
        // Otherwise stay in 'waiting' — the realtime subscription below will catch the flip.
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError) {
          setErrorMsg(err.body?.message as string ?? 'Could not load task details.')
        } else {
          setErrorMsg('Could not load task details.')
        }
        setView('error')
      }
    }

    loadAndCheck()
    return () => { cancelled = true }
  }, [taskId, status])

  // Subscribe to escrow realtime updates while waiting.
  useEffect(() => {
    if (!taskId || status !== 'success') return

    const channel = subscribeToEscrow(taskId, (payload: Record<string, unknown>) => {
      const newRow = payload.new as { status?: string } | undefined
      if (newRow?.status === 'HELD') {
        goToWorkspace(taskId)
      }
    })

    return () => { channel.unsubscribe() }
  }, [taskId, status])

  function goToWorkspace(id: string) {
    if (redirectedRef.current) return
    redirectedRef.current = true
    setView('held')
    router.push(`/tasks/${id}/workspace`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center space-y-5">

        {view === 'waiting' && (
          <>
            <div className="flex justify-center">
              <Spinner />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Confirming your payment</h1>
              <p className="text-zinc-500 text-sm mt-1">
                Hang on while we confirm your payment with the escrow service. This usually takes a few seconds.
              </p>
            </div>
            {task && (
              <p className="text-zinc-600 text-xs">{task.title}</p>
            )}
          </>
        )}

        {view === 'held' && (
          <>
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border
                border-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-400 text-lg">✓</span>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Payment confirmed</h1>
              <p className="text-zinc-500 text-sm mt-1">
                Funds are held in escrow. Taking you to the workspace...
              </p>
            </div>
          </>
        )}

        {view === 'cancelled' && (
          <>
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border
                border-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 text-lg">!</span>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Payment cancelled</h1>
              <p className="text-zinc-500 text-sm mt-1">
                You cancelled the payment. No funds were charged.
              </p>
            </div>
            <ReturnLink taskId={taskId} />
          </>
        )}

        {view === 'failed' && (
          <>
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border
                border-red-500/20 flex items-center justify-center">
                <span className="text-red-400 text-lg">✕</span>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Payment failed</h1>
              <p className="text-zinc-500 text-sm mt-1">
                Something went wrong while processing your payment. No funds were charged.
              </p>
            </div>
            <ReturnLink taskId={taskId} />
          </>
        )}

        {view === 'error' && (
          <>
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border
                border-red-500/20 flex items-center justify-center">
                <span className="text-red-400 text-lg">✕</span>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Something went wrong</h1>
              <p className="text-zinc-500 text-sm mt-1">
                {errorMsg ?? 'Please return to the task and try again.'}
              </p>
            </div>
            <ReturnLink taskId={taskId} />
          </>
        )}

      </div>
    </div>
  )
}

function ReturnLink({ taskId }: { taskId: string | null }) {
  return (
    <Link href={taskId ? `/tasks/${taskId}` : '/tasks'}>
      <Button variant="outline" size="sm" className="w-full">
        Back to task
      </Button>
    </Link>
  )
}