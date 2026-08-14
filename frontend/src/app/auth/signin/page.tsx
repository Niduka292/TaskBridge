'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthCard from '@/components/auth/AuthCard'
import { signIn } from '@/lib/supabase'

export default function SignInPage() {
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    try {
      const { error: supabaseError } = await signIn(email, password)

      if (supabaseError) {
        // Supabase returns generic errors — map them to user-friendly messages
        if (supabaseError.message.toLowerCase().includes('invalid')) {
          setError('Incorrect email or password. Please try again.')
        } else if (supabaseError.message.toLowerCase().includes('confirm')) {
          setError('Please confirm your email before signing in.')
        } else {
          setError(supabaseError.message)
        }
        return
      }

      router.push('/dashboard')
      router.refresh() // ensure middleware re-evaluates session
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your TASKBRIDGE account to continue."
    >
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-zinc-300 text-sm">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="yourname@student.sab.ac.lk"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500
              focus-visible:ring-violet-500 focus-visible:border-violet-500"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-zinc-300 text-sm">
              Password
            </Label>
            {/* placeholder — add forgot password flow later */}
            <span className="text-zinc-600 text-xs cursor-not-allowed">
              Forgot password?
            </span>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500
              focus-visible:ring-violet-500 focus-visible:border-violet-500"
          />
        </div>

        {/* Global error */}
        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/30 px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium
            h-11 rounded-lg transition-colors duration-150 mt-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </Button>

        <p className="text-center text-sm text-zinc-500 pt-1">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/signup"
            className="text-violet-400 hover:text-violet-300 transition-colors"
          >
            Create one
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}