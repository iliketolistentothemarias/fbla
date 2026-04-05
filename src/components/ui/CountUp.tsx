import { useEffect, useState } from 'react'

export function useCountUp(end: number, duration: number = 800) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      // easeOutExpo
      const easing = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setCount(Math.floor(easing * end))
      
      if (progress < 1) {
        window.requestAnimationFrame(step)
      } else {
        setCount(end)
      }
    }
    
    window.requestAnimationFrame(step)
  }, [end, duration])

  return count
}

interface CountUpProps {
  end: number
  duration?: number
  className?: string
}

export function CountUp({ end, duration = 800, className }: CountUpProps) {
  const count = useCountUp(end, duration)
  return <span className={className}>{count}</span>
}
