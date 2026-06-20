'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthCard from '@/components/auth/AuthCard'
import { verifyEmailOtp } from '@/lib/supabase'

export default function ConfirmPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending')
  const [message, setMessage] = useState<string | null>(null)

  // If the user landed here from a confirmation email link,
  // Supabase appends token_hash to the URL — verify it automatically.
  useEffect(() => {
    const tokenHash = searchParams.get('token_hash')
    if (!tokenHash) return

    setStatus('verifying')

    verifyEmailOtp(tokenHash).then(({ error }) => {
      if (error) {
        setStatus('error')
        setMessage(
          error.message.includes('expired')
            ? 'This confirmation link has expired. Please sign up again.'
            : 'Verification failed. Please try signing up again.'
        )
      } else {
        setStatus('success')
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    })
  }, [searchParams, router])

  const email = searchParams.get('email')

  return (
    <AuthCard
      title={
        status === 'success' ? 'Email confirmed!' :
        status === 'error'   ? 'Verification failed' :
        status === 'verifying' ? 'Verifying...' :
        'Check your email'
      }
      subtitle={
        status === 'success'   ? 'Redirecting you to your dashboard...' :
        status === 'error'     ? '' :
        status === 'verifying' ? 'Please wait a moment.' :
        `We sent a confirmation link to ${email ?? 'your email address'}.`
      }
    >
      <div className="space-y-6">

        {/* Pending — waiting for user to click link */}
        {status === 'pending' && (
          <>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-violet-600/15 border border-violet-600/30
                flex items-center justify-center">
                <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Click the link in your email to activate your account.
                  The link expires in 24 hours.
                </p>
              </div>
            </div>

            <div className="rounded-md bg-zinc-800/60 border border-zinc-700 px-4 py-3">
              <p className="text-zinc-400 text-xs leading-relaxed">
                Can&apos;t find the email? Check your spam folder. Make sure you
                signed up with a <span className="text-zinc-200">.ac.lk</span> or{' '}
                <span className="text-zinc-200">.edu</span> address.
              </p>
            </div>

            <p className="text-center text-sm text-zinc-500">
              Wrong email?{' '}
              <Link href="/auth/signup"
                className="text-violet-400 hover:text-violet-300 transition-colors">
                Sign up again
              </Link>
            </p>
          </>
        )}

        {/* Verifying spinner */}
        {status === 'verifying' && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-violet-500
              rounded-full animate-spin" />
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30
              flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-zinc-300 text-sm text-center">
              Your account has been confirmed. Taking you to your dashboard...
            </p>
            <div className="w-6 h-6 border-2 border-zinc-700 border-t-emerald-500
              rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30
                flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              {message && (
                <p className="text-red-400 text-sm text-center">{message}</p>
              )}
            </div>
            <Link href="/auth/signup"
              className="block w-full text-center bg-zinc-800 hover:bg-zinc-700
                text-zinc-200 text-sm font-medium py-2.5 rounded-lg border
                border-zinc-700 transition-colors">
              Back to sign up
            </Link>
          </div>
        )}

      </div>
    </AuthCard>
  )
}