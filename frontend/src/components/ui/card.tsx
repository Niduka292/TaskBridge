import * as React from 'react'

// ─────────────────────────────────────────────
//  Card — root container
// ─────────────────────────────────────────────
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={[
      'rounded-xl border border-zinc-800 bg-zinc-900',
      'shadow-xl shadow-black/30',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
))
Card.displayName = 'Card'

// ─────────────────────────────────────────────
//  CardHeader — top section with title/subtitle
// ─────────────────────────────────────────────
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={['flex flex-col gap-1.5 p-6', className]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

// ─────────────────────────────────────────────
//  CardTitle
// ─────────────────────────────────────────────
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', ...props }, ref) => (
  <h3
    ref={ref}
    className={[
      'text-xl font-bold leading-tight tracking-tight text-white',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

// ─────────────────────────────────────────────
//  CardDescription
// ─────────────────────────────────────────────
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => (
  <p
    ref={ref}
    className={['text-sm text-zinc-400 leading-relaxed', className]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

// ─────────────────────────────────────────────
//  CardContent — main body
// ─────────────────────────────────────────────
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={['p-6 pt-0', className].filter(Boolean).join(' ')}
    {...props}
  />
))
CardContent.displayName = 'CardContent'

// ─────────────────────────────────────────────
//  CardFooter — bottom section
// ─────────────────────────────────────────────
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={[
      'flex items-center p-6 pt-0 border-t border-zinc-800 mt-2',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

// ─────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
}