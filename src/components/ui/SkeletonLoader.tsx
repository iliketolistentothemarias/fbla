import React from 'react'

export function SkeletonLoader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`skeleton ${className}`} {...props} />
  )
}
