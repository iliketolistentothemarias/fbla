import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Option {
  label: string
  value: string | number
}

interface SelectProps {
  value: string | number
  onChange: (value: any) => void
  options: Option[]
  className?: string
}

export function Select({ value, onChange, options, className = '' }: SelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = options.find(o => o.value === value) || options[0]

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(prev => !prev)
          } else if (e.key === 'Escape') setOpen(false)
        }}
        onClick={() => setOpen(!open)}
        className={`w-full bg-[var(--background)] border ${open ? 'border-[var(--border-strong)] shadow-[0_0_0_3px_rgba(0,0,0,0.06)]' : 'border-[var(--border)]'} rounded-[var(--radius-sm)] px-3 py-2 text-sm flex items-center justify-between transition-all outline-none text-[var(--text-primary)]`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown size={16} className={`text-[var(--text-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 w-full mt-1 bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius-sm)] shadow-[var(--shadow-md)] py-1 max-h-60 overflow-auto custom-scrollbar"
          >
            {options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface)] transition-colors flex items-center justify-between text-[var(--text-primary)] ${value === opt.value ? 'bg-[var(--surface-raised)] font-medium' : ''}`}
              >
                <span className="truncate">{opt.label}</span>
                {value === opt.value && <Check size={14} className="text-[var(--text-primary)]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
