import React from 'react'
import { Check } from 'lucide-react'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
}

export function Checkbox({ checked, onChange, label, className = '' }: CheckboxProps) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer group select-none ${className}`}>
      <div 
        className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all duration-150 ${
          checked 
            ? 'bg-[var(--text-primary)] border-[var(--text-primary)]' 
            : 'bg-[var(--background)] border-[var(--border)] group-hover:border-[var(--border-strong)]'
        }`}
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            onChange(!checked)
          }
        }}
        onClick={(e) => {
          e.preventDefault()
          onChange(!checked)
        }}
      >
        <span className={`transition-transform duration-150 text-[var(--background)] ${checked ? 'scale-100' : 'scale-0'}`}>
          <Check size={12} strokeWidth={3} />
        </span>
      </div>
      {label && <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors block">{label}</span>}
    </label>
  )
}
