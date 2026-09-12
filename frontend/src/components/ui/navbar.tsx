'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  getAccessToken,
  getCurrentUserId,
  logout,
} from '@/lib/auth'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const [userId, setUserId] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const token = getAccessToken()
    const id = getCurrentUserId()

    setLoggedIn(!!token)
    setUserId(id)
  }, [pathname])

  function handleLogout() {
    logout()
    setLoggedIn(false)
    setUserId(null)
    router.push('/auth/signin')
  }

  const navLinkClass = (path: string) =>
    `text-sm px-3 py-1.5 rounded-lg transition-colors ${
      pathname === path
        ? 'bg-white/10 text-white'
        : 'text-zinc-300 hover:text-white hover:bg-white/5'
    }`

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl">
      <div
        className="flex items-center justify-between px-6 py-3 rounded-2xl
        border border-white/10 bg-white/5 backdrop-blur-lg
        shadow-lg shadow-black/20 supports-[backdrop-filter]:bg-black/10"
      >

        {/* Brand */}
        <Link href={loggedIn ? '/dashboard' : '/'} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">T</span>
          </div>

          <span className="font-semibold text-base tracking-tight text-white">
            TASKBRIDGE
          </span>
        </Link>

        {/* Main navigation */}
        {loggedIn && (
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/profile/dashboard"
              className={navLinkClass('/profile/dashboard')}
            >
              Dashboard
            </Link>

            <Link
              href="/tasks"
              className={navLinkClass('/tasks')}
            >
              Browse Tasks
            </Link>

            <Link
              href="/tasks/new"
              className={navLinkClass('/tasks/new')}
            >
              Post Task
            </Link>

            {userId && (
              <Link
                href={`/profile/${userId}`}
                className={navLinkClass(`/profile/${userId}`)}
              >
                Profile
              </Link>
            )}
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <>
              {userId && (
                <Link
                  href={`/profile/${userId}/edit`}
                  className="hidden sm:inline-flex text-sm text-zinc-300
                    hover:text-white transition-colors px-3 py-1.5
                    rounded-lg hover:bg-white/5"
                >
                  Edit Profile
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="text-sm text-zinc-300 hover:text-white
                  transition-colors px-3 py-1.5 rounded-lg
                  hover:bg-white/5"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-sm text-zinc-300 hover:text-white
                  transition-colors px-3 py-1.5"
              >
                Sign in
              </Link>

              <Link
                href="/auth/signup"
                className="text-sm bg-violet-600/90 hover:bg-violet-500
                  text-white px-4 py-2 rounded-lg font-medium
                  transition-colors backdrop-blur-sm"
              >
                Get started
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  )
}