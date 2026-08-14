import * as React from 'react'

// ─────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Show a red error ring — pass true when there is a field-level error */
  error?: boolean
}

// ─────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error = false, type = 'text', ...props }, ref) => {
    const base = [
      // layout
      'flex h-10 w-full rounded-lg px-3 py-2',
      // typography
      'text-sm text-white placeholder:text-zinc-500',
      // colours
      'bg-zinc-800 border',
      error
        ? 'border-red-500 focus-visible:ring-red-500'
        : 'border-zinc-700 focus-visible:ring-violet-500 focus-visible:border-violet-500',
      // focus
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
      // file input reset
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
      // disabled
      'disabled:cursor-not-allowed disabled:opacity-50',
      // transition
      'transition-colors duration-150',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return <input type={type} ref={ref} className={base} {...props} />
  }
)

Input.displayName = 'Input'

export { Input }