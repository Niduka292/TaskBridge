'use client'

import { useState, KeyboardEvent } from 'react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  error?: string
  maxTags?: number
  suggestions?: string[]
  placeholder?: string
}

const DEFAULT_SUGGESTIONS = [
  'React', 'Next.js', 'Node.js', 'Spring Boot', 'Python',
  'PostgreSQL', 'MongoDB', 'Figma', 'Tailwind CSS', 'TypeScript',
  'Java', 'Flutter', 'Machine Learning', 'Photoshop', 'WordPress',
]

export function TagInput({
  tags,
  onChange,
  error,
  maxTags = 8,
  suggestions = DEFAULT_SUGGESTIONS,
  placeholder = 'Type a skill and press Enter...',
}: TagInputProps) {
  const [input, setInput] = useState('')

  function addTag(value: string) {
    const clean = value.trim().replace(/,/g, '')
    if (!clean || tags.includes(clean) || tags.length >= maxTags) return
    onChange([...tags, clean])
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(tags.filter(t => t !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="space-y-3">
      {/* Tag pills display + input */}
      <div className={`min-h-[42px] w-full rounded-lg px-3 py-2 bg-zinc-800
        border transition-colors flex flex-wrap gap-2 items-center
        focus-within:ring-2 focus-within:ring-offset-0
        ${error
          ? 'border-red-500 focus-within:ring-red-500'
          : 'border-zinc-700 focus-within:ring-violet-500 focus-within:border-violet-500'
        }`}>
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1.5 text-xs
            px-2.5 py-1 rounded-full bg-violet-600/15 border border-violet-500/25
            text-violet-300 font-medium">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-violet-400 hover:text-white transition-colors
                leading-none w-3 h-3 flex items-center justify-center"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) addTag(input) }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-white
            placeholder:text-zinc-500 focus:outline-none"
        />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.filter(t => !tags.includes(t)).slice(0, 10).map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              disabled={tags.length >= maxTags}
              className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 border
                border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500
                transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}

      <p className="text-zinc-600 text-xs">{tags.length}/{maxTags} tags</p>
    </div>
  )
}