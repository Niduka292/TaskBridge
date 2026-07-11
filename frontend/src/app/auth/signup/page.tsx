'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthCard from '@/components/auth/AuthCard'
import { signUp } from '@/lib/supabase'

// University email validation
const isUniversityEmail = (email: string) =>
  email.endsWith('.ac.lk') || email.endsWith('.edu')

export default function SignUpPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Per-field errors
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
    confirm?: string
  }>({})

  function validate() {
    const errors: typeof fieldErrors = {}

    if (!fullName.trim() || fullName.trim().length < 2)
      errors.fullName = 'Full name must be at least 2 characters'

    if (!email)
      errors.email = 'Email is required'
    else if (!isUniversityEmail(email))
      errors.email = 'Must be a university email ending in .ac.lk or .edu'

    if (!password)
      errors.password = 'Password is required'
    else if (password.length < 8)
      errors.password = 'Password must be at least 8 characters'

    if (!confirm)
      errors.confirm = 'Please confirm your password'
    else if (confirm !== password)
      errors.confirm = 'Passwords do not match'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!validate()) return

    setLoading(true)
    try {
      const { error: supabaseError } = await signUp(email, password, fullName.trim())

      if (supabaseError) {
        setError(supabaseError.message)
        return
      }

      // Redirect to confirm page — user needs to check their email
      router.push('/auth/confirm?email=' + encodeURIComponent(email))
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join TASKBRIDGE and start posting or completing tasks with your university peers."
    >
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Full name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-zinc-300 text-sm">
            Full name
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Niduka Perera"
            value={fullName}
            onChange={e => {
              setFullName(e.target.value)
              setFieldErrors(prev => ({ ...prev, fullName: undefined }))
            }}
            disabled={loading}
            className={`bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500
              focus-visible:ring-violet-500 focus-visible:border-violet-500
              ${fieldErrors.fullName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          />
          {fieldErrors.fullName && (
            <p className="text-red-400 text-xs mt-1">{fieldErrors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-zinc-300 text-sm">
            University email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="yourname@student.sab.ac.lk"
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              setFieldErrors(prev => ({ ...prev, email: undefined }))
            }}
            disabled={loading}
            className={`bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500
              focus-visible:ring-violet-500 focus-visible:border-violet-500
              ${fieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          />
          {fieldErrors.email ? (
            <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>
          ) : (
            <p className="text-zinc-500 text-xs mt-1">
              Must end in .ac.lk or .edu
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-zinc-300 text-sm">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={e => {
              setPassword(e.target.value)
              setFieldErrors(prev => ({ ...prev, password: undefined }))
            }}
            disabled={loading}
            className={`bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500
              focus-visible:ring-violet-500 focus-visible:border-violet-500
              ${fieldErrors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          />
          {fieldErrors.password && (
            <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-zinc-300 text-sm">
            Confirm password
          </Label>
          <Input
            id="confirm"
            type="password"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={e => {
              setConfirm(e.target.value)
              setFieldErrors(prev => ({ ...prev, confirm: undefined }))
            }}
            disabled={loading}
            className={`bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500
              focus-visible:ring-violet-500 focus-visible:border-violet-500
              ${fieldErrors.confirm ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          />
          {fieldErrors.confirm && (
            <p className="text-red-400 text-xs mt-1">{fieldErrors.confirm}</p>
          )}
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
              Creating account...
            </span>
          ) : (
            'Create account'
          )}
        </Button>

        <p className="text-center text-sm text-zinc-500 pt-1">
          Already have an account?{' '}
          <Link
            href="/auth/signin"
            className="text-violet-400 hover:text-violet-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}