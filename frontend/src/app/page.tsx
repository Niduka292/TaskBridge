import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">

      {/* ── Navbar ── */}
      <header className="border-b border-zinc-800/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="font-semibold text-base tracking-tight">TASKBRIDGE</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2
                rounded-lg font-medium transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1">
        <section className="relative overflow-hidden">

          {/* Background glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px]
              bg-violet-600/10 rounded-full blur-3xl" />
            <div className="absolute top-32 left-1/3 w-[300px] h-[300px]
              bg-indigo-600/8 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-violet-600/10 border
              border-violet-500/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-violet-300 text-xs font-medium tracking-wide">
                Built for university students
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight
              leading-[1.05] mb-6 max-w-4xl mx-auto">
              Post tasks.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r
                from-violet-400 to-indigo-400">
                Earn from skills.
              </span>
            </h1>

            <p className="text-zinc-400 text-lg sm:text-xl max-w-xl mx-auto mb-10
              leading-relaxed font-light">
              A peer-to-peer freelance marketplace built exclusively for university
              students. Post work, bid on tasks, and get paid — all in LKR.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/signup"
                className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500
                  text-white font-medium px-8 py-3 rounded-lg text-sm
                  transition-colors duration-150"
              >
                Create free account
              </Link>
              <Link
                href="/tasks"
                className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700
                  text-zinc-200 font-medium px-8 py-3 rounded-lg text-sm border
                  border-zinc-700 transition-colors duration-150"
              >
                Browse tasks
              </Link>
            </div>

            {/* Social proof */}
            <p className="text-zinc-600 text-xs mt-8">
              University email required · .ac.lk and .edu only
            </p>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6
              hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-violet-600/15 border
                border-violet-500/20 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-violet-400" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0
                      002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424
                      48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664
                      0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25
                      0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012
                      0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095
                      4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621
                      0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125
                      1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Post any task</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Design, coding, tutoring, research — post tasks and receive bids
                from verified students within hours.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6
              hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/15 border
                border-emerald-500/20 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-emerald-400" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0
                      013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29
                      9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571
                      -.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Secure escrow</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Funds are locked in escrow when work begins. Freelancers are
                guaranteed payment. Posters only pay when satisfied.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6
              hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-600/15 border
                border-amber-500/20 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-amber-400" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0
                      1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375
                      21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125
                      1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504
                      1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5
                      4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21
                      4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125
                      0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Build your portfolio</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Every completed task is logged to your profile with skill tags
                and ratings — real work proof for internship applications.
              </p>
            </div>

          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800/60 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="text-zinc-500 text-xs">TASKBRIDGE</span>
          </div>
          <p className="text-zinc-600 text-xs">
            Service Oriented Computing · University Project
          </p>
        </div>
      </footer>

    </div>
  )
}