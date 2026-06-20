'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getProfile,
  getUserReviews,
  type Profile,
  type Review,
  type Page,
} from '@/lib/api'
import { getCurrentUserId, uploadAvatar } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

// ── Star rating display ──────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-amber-400' : 'text-zinc-700'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ── Skill tag ────────────────────────────────
function SkillTag({ label }: { label: string }) {
  return (
    <span className="text-xs px-2.5 py-1 rounded-full bg-violet-600/10
      border border-violet-500/20 text-violet-300 font-medium">
      {label}
    </span>
  )
}

// ── Stat box ─────────────────────────────────
function StatBox({
  value,
  label,
}: {
  value: string | number
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-3
      bg-zinc-800/50 rounded-lg border border-zinc-700/50">
      <span className="text-white font-bold text-lg leading-none">{value}</span>
      <span className="text-zinc-500 text-xs">{label}</span>
    </div>
  )
}

// ── Review card ──────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-zinc-200 text-sm font-medium">{review.reviewerName}</p>
          <Stars rating={review.rating} />
        </div>
        <span className="text-xs text-zinc-600 whitespace-nowrap">
          {new Date(review.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>
      {review.comment && (
        <p className="text-zinc-400 text-sm leading-relaxed">{review.comment}</p>
      )}
      <span className="inline-block text-xs px-2 py-0.5 rounded bg-zinc-700/60
        text-zinc-400 border border-zinc-600/40">
        {review.context === 'AS_FREELANCER' ? 'As freelancer' : 'As poster'}
      </span>
    </div>
  )
}

// ── Loading skeleton ─────────────────────────
function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-20 h-20 rounded-full bg-zinc-800 flex-shrink-0" />
          <div className="space-y-3 flex-1">
            <div className="h-6 bg-zinc-800 rounded w-48" />
            <div className="h-4 bg-zinc-800 rounded w-72" />
            <div className="flex gap-2">
              <div className="h-6 bg-zinc-800 rounded w-16" />
              <div className="h-6 bg-zinc-800 rounded w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────
export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const [profile, setProfile]       = useState<Profile | null>(null)
  const [reviews, setReviews]       = useState<Page<Review> | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [reviewTab, setReviewTab]   = useState<'AS_FREELANCER' | 'AS_POSTER'>('AS_FREELANCER')
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [uploading, setUploading]   = useState(false)

  const isOwn = currentUserId === userId

  // Fetch profile + current user id
  useEffect(() => {
    async function load() {
      try {
        const [p, uid] = await Promise.all([
          getProfile(userId),
          getCurrentUserId(),
        ])
        setProfile(p)
        setCurrentUserId(uid)
      } catch {
        setError('Could not load profile.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  // Fetch reviews when tab changes
  useEffect(() => {
    if (!userId) return
    getUserReviews(userId, { context: reviewTab, size: 10 })
      .then(setReviews)
      .catch(() => {})
  }, [userId, reviewTab])

  // Avatar upload
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !isOwn) return
    setUploading(true)
    try {
      const url = await uploadAvatar(userId, file)
      if (url && profile) setProfile({ ...profile, avatarUrl: url })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-12 max-w-3xl mx-auto">
        <ProfileSkeleton />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-zinc-400">{error ?? 'Profile not found.'}</p>
          <Button variant="outline" onClick={() => router.back()}>Go back</Button>
        </div>
      </div>
    )
  }

  const initials = profile.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">

        {/* ── Profile card ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-zinc-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-violet-600/20 border-2
                  border-violet-500/30 flex items-center justify-center">
                  <span className="text-violet-300 font-bold text-xl">{initials}</span>
                </div>
              )}
              {/* Upload button — own profile only */}
              {isOwn && (
                <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full
                  bg-zinc-800 border border-zinc-600 flex items-center justify-center
                  cursor-pointer hover:bg-zinc-700 transition-colors">
                  {uploading ? (
                    <span className="w-3 h-3 border border-zinc-400 border-t-white
                      rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5 text-zinc-300" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0
                          0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-white">{profile.fullName}</h1>
                  {profile.bio && (
                    <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}
                </div>
                {isOwn && (
                  <Link href={`/profile/${userId}/edit`}>
                    <Button variant="outline" size="sm">Edit profile</Button>
                  </Link>
                )}
              </div>

              {/* Skills */}
              {profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.skills.map(skill => (
                    <SkillTag key={skill} label={skill} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-zinc-800">
            <StatBox
              value={profile.completedTaskCount}
              label="Tasks done"
            />
            <StatBox
              value={profile.avgRatingAsFreelancer > 0
                ? profile.avgRatingAsFreelancer.toFixed(1)
                : '—'}
              label="Freelancer rating"
            />
            <StatBox
              value={profile.avgRatingAsPoster > 0
                ? profile.avgRatingAsPoster.toFixed(1)
                : '—'}
              label="Poster rating"
            />
            {isOwn && profile.balance !== undefined && (
              <StatBox
                value={`LKR ${profile.balance.toLocaleString()}`}
                label="Wallet balance"
              />
            )}
          </div>
        </div>

        {/* ── Reviews ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Reviews</h2>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-zinc-800 rounded-lg w-fit mb-5">
            {(['AS_FREELANCER', 'AS_POSTER'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setReviewTab(tab)}
                className={`text-xs font-medium px-4 py-1.5 rounded-md transition-colors ${
                  reviewTab === tab
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab === 'AS_FREELANCER' ? 'As freelancer' : 'As poster'}
              </button>
            ))}
          </div>

          {/* Review list */}
          {reviews && reviews.content.length > 0 ? (
            <div className="space-y-3">
              {reviews.content.map(r => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-zinc-500 text-sm">No reviews yet.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}