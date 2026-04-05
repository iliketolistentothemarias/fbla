import React from 'react'
import { cn } from '../../lib/utils'

interface PriorityBadgeProps {
  priority: 'critical' | 'high' | 'medium' | 'low'
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const styles = {
    critical: 'bg-[#4A1B0C] text-[#F0997B]',
    high: 'bg-[#412402] text-[#EF9F27]',
    medium: 'bg-[#042C53] text-[#85B7EB]',
    low: 'bg-[#2C2C2A] text-[#B4B2A9]',
  }
  
  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-semibold tracking-wider font-mono uppercase shadow-sm',
      styles[priority],
      className
    )}>
      {priority}
    </span>
  )
}
