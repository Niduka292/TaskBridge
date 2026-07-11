import { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface AuthCardProps {
  title: string
  subtitle: string
  children: ReactNode
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      {/* background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* logo mark */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            TASKBRIDGE
          </span>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl shadow-black/50">
          <CardHeader className="pb-4 pt-8 px-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
              {subtitle}
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {children}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Only university email addresses are accepted
        </p>
      </div>
    </div>
  )
}