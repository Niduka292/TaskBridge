import * as React from 'react'

// ─────────────────────────────────────────────
//  Variants
// ─────────────────────────────────────────────
type Variant = 'default' | 'outline' | 'ghost' | 'destructive' | 'link'
type Size    = 'default' | 'sm' | 'lg' | 'icon'

const variantClasses: Record<Variant, string> = {
  default:
    'bg-violet-600 text-white hover:bg-violet-500 shadow-sm',
  outline:
    'border border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-white',
  ghost:
    'bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white',
  destructive:
    'bg-red-600 text-white hover:bg-red-500 shadow-sm',
  link:
    'bg-transparent text-violet-400 hover:text-violet-300 underline-offset-4 hover:underline p-0 h-auto',
}

const sizeClasses: Record<Size, string> = {
  default: 'h-10 px-4 py-2 text-sm',
  sm:      'h-8 px-3 text-xs',
  lg:      'h-11 px-6 text-sm',
  icon:    'h-10 w-10',
}

// ─────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

// ─────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'default',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const base = [
      'inline-flex items-center justify-center gap-2',
      'rounded-lg font-medium',
      'transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2',
      'focus-visible:ring-violet-500 focus-visible:ring-offset-2',
      'focus-visible:ring-offset-zinc-950',
      'disabled:pointer-events-none disabled:opacity-50',
      variantClasses[variant],
      sizeClasses[size],
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        className={base}
        disabled={disabled || loading}
        {...props}
        suppressHydrationWarning
      >
        {loading ? (
          <>
            <span
              className="w-4 h-4 border-2 border-current/30 border-t-current
                rounded-full animate-spin"
            />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }