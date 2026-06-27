'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getProfile, updateProfile, type Profile, ApiError } from '@/lib/api'
import { getCurrentUserId, uploadAvatar } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TagInput } from '@/components/ui/TagInput'

const BIO_MAX = 500

function Skeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6 animate-pulse">
      <div className="h-7 bg-zinc-800 rounded w-1/3" />
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-6">
        <div className="h-20 w-20 rounded-full bg-zinc-800 mx-auto" />
        <div className="h-10 bg-zinc-800 rounded" />
        <div className="h-24 bg-zinc-800 rounded" />
        <div className="h-10 bg-zinc-800 rounded" />
      </div>
    </div>
  )
}

interface FieldErrors {
  fullName?: string
  bio?: string
  skills?: string
}

export default function EditProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [authChecked, setAuthChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // ── Gate: only the profile owner may edit ──
  useEffect(() => {
    async function checkAuth() {
      const currentUserId = await getCurrentUserId()
      if (currentUserId !== userId) {
        router.replace(`/profile/${userId}`)
        return
      }
      setAuthorized(true)
      setAuthChecked(true)
    }
    checkAuth()
  }, [userId, router])

  // ── Load existing profile once authorized ──
  useEffect(() => {
    if (!authChecked || !authorized) return

    async function load() {
      try {
        const profile: Profile = await getProfile(userId)
        setFullName(profile.fullName)
        setBio(profile.bio ?? '')
        setSkills(profile.skills ?? [])
        setAvatarUrl(profile.avatarUrl)
      } catch {
        setLoadError('Could not load your profile.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authChecked, authorized, userId])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function validate(): boolean {
    const e: FieldErrors = {}
    if (!fullName.trim() || fullName.trim().length < 2) {
      e.fullName = 'Please enter your full name.'
    }
    if (bio.length > BIO_MAX) {
      e.bio = `Bio must be under ${BIO_MAX} characters.`
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    setGlobalError(null)
    if (!validate()) return

    setSaving(true)
    try {
      let finalAvatarUrl = avatarUrl

      if (avatarFile) {
        setUploadingAvatar(true)
        const uploaded = await uploadAvatar(userId, avatarFile)
        setUploadingAvatar(false)
        if (!uploaded) {
          setGlobalError('Avatar upload failed. Your other changes were not saved — please try again.')
          setSaving(false)
          return
        }
        finalAvatarUrl = uploaded
      }

      await updateProfile(userId, {
        fullName: fullName.trim(),
        bio: bio.trim() || null,
        skills,
        avatarUrl: finalAvatarUrl,
      })

      router.push(`/profile/${userId}`)
    } catch (err) {
      if (err instanceof ApiError) {
        setGlobalError(err.body?.message as string ?? 'Failed to save profile.')
      } else {
        setGlobalError('Something went wrong. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (!authChecked || loading) return <Skeleton />

  if (loadError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-zinc-400">{loadError}</p>
          <Button variant="outline" onClick={() => router.push(`/profile/${userId}`)}>
            Back to profile
          </Button>
        </div>
      </div>
    )
  }

  const displayAvatar = avatarPreview ?? avatarUrl

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Edit profile</h1>
          <p className="text-zinc-500 text-sm">
            Update your name, bio, skills, and avatar.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-6">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-violet-600/20 border
                border-violet-500/30 flex items-center justify-center overflow-hidden">
                {displayAvatar ? (
                  <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-violet-300 text-xl font-bold">
                    {fullName?.[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/50
                  flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-zinc-300 border-t-transparent
                    rounded-full animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
            >
              Change photo
            </Button>
          </div>

          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" error={!!errors.fullName} required>
              Full name
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={e => {
                setFullName(e.target.value)
                setErrors(prev => ({ ...prev, fullName: undefined }))
              }}
              error={!!errors.fullName}
              disabled={saving}
            />
            {errors.fullName && (
              <p className="text-red-400 text-xs">{errors.fullName}</p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio" error={!!errors.bio}>
              Bio
            </Label>
            <textarea
              id="bio"
              rows={5}
              maxLength={BIO_MAX}
              placeholder="Tell other students a bit about yourself — your background, interests, and what you're good at..."
              value={bio}
              onChange={e => {
                setBio(e.target.value)
                setErrors(prev => ({ ...prev, bio: undefined }))
              }}
              disabled={saving}
              className={`w-full rounded-lg px-3 py-2 text-sm text-white
                placeholder:text-zinc-500 bg-zinc-800 border resize-none
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-offset-0 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                ${errors.bio
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : 'border-zinc-700 focus-visible:ring-violet-500 focus-visible:border-violet-500'
                }`}
            />
            <div className="flex justify-between">
              {errors.bio ? (
                <p className="text-red-400 text-xs">{errors.bio}</p>
              ) : (
                <span />
              )}
              <p className={`text-xs ${
                bio.length > BIO_MAX - 50 ? 'text-amber-400' : 'text-zinc-600'
              }`}>
                {bio.length}/{BIO_MAX}
              </p>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-1.5">
            <Label htmlFor="skills" error={!!errors.skills}>
              Skills
            </Label>
            <TagInput
              tags={skills}
              onChange={setSkills}
              error={errors.skills}
              placeholder="Type a skill and press Enter..."
            />
          </div>

          {globalError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3">
              <p className="text-red-400 text-sm">{globalError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/profile/${userId}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save changes
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}