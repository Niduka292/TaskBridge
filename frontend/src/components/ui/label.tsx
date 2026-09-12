import * as React from 'react'

// ─────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────
export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Highlight label red when the associated field has an error */
  error?: boolean
  /** Mark as required — appends a * after the text */
  required?: boolean
}

// ─────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', error = false, required = false, children, ...props }, ref) => {
    const base = [
      'text-sm font-medium leading-none',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      error ? 'text-red-400' : 'text-zinc-300',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <label ref={ref} className={base} {...props}>
        {children}
        {required && (
          <span className="ml-1 text-red-400 text-xs" aria-hidden="true">
            *
          </span>
        )}
      </label>
    )
  }
)

Label.displayName = 'Label'

export { Label }