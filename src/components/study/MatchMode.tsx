import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { useAppStore } from '../../store/useAppStore'
import { sounds } from '../../lib/sounds'
import { Term } from '../../types'
import { GlassCard } from '../ui/GlassCard'
import { cn } from '../../lib/utils'

export default function MatchMode() {
  const { terms } = useAppStore()
  
  const [termsList, setTermsList] = useState<Term[]>([])
  const [defsList, setDefsList] = useState<Term[]>([])
  
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set())
  const [wrongPair, setWrongPair] = useState<{t: string, d: string} | null>(null)
  
  const [startTime, setStartTime] = useState(0)
  const [timerText, setTimerText] = useState('00:00')
  const [isComplete, setIsComplete] = useState(false)

  const handleStart = () => {
    // Pick 6 random terms to match
    const pool = [...terms].sort(() => Math.random() - 0.5).slice(0, 6)
    setTermsList([...pool].sort(() => Math.random() - 0.5))
    setDefsList([...pool].sort(() => Math.random() - 0.5))
    setMatchedPairs(new Set())
    setSelectedTermId(null)
    setStartTime(Date.now())
    setIsComplete(false)
  }

  // Timer
  useEffect(() => {
    if (startTime === 0 || isComplete) return
    const interval = setInterval(() => {
      const ms = Date.now() - startTime
      const s = Math.floor(ms / 1000)
      const m = Math.floor(s / 60)
      setTimerText(`${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime, isComplete])

  const handleTermClick = (id: string) => {
    if (matchedPairs.has(id)) return
    sounds.select()
    setSelectedTermId(id)
  }

  const handleDefClick = (defId: string) => {
    if (matchedPairs.has(defId) || !selectedTermId) return
    
    if (selectedTermId === defId) {
      // Match!
      sounds.match()
      const newMatches = new Set(matchedPairs)
      newMatches.add(defId)
      setMatchedPairs(newMatches)
      setSelectedTermId(null)
      
      if (newMatches.size === termsList.length) {
        setIsComplete(true)
        sounds.complete()
      }
    } else {
      // Wrong
      sounds.wrong()
      setWrongPair({ t: selectedTermId, d: defId })
      setTimeout(() => setWrongPair(null), 500)
      setSelectedTermId(null)
    }
  }

  if (termsList.length === 0) {
    return (
      <GlassCard className="max-w-md mx-auto text-center mt-20">
        <h2 className="font-cinzel text-xl font-bold mb-4">Match Mode</h2>
        <p className="text-text-muted mb-6">Match 6 terms to their definitions as fast as possible.</p>
        <button onClick={handleStart} className="w-full py-3 bg-indigo text-white font-bold rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.3)]">
          Start Game
        </button>
      </GlassCard>
    )
  }

  if (isComplete) {
    return (
      <GlassCard className="max-w-md mx-auto text-center mt-20 border-emerald/50">
        <h2 className="font-cinzel text-3xl font-bold text-gold mb-2">Well Done!</h2>
        <p className="text-text-muted mb-6">All terms matched correctly.</p>
        <div className="text-4xl font-mono font-bold text-emerald mb-8">{timerText}</div>
        <button onClick={handleStart} className="w-full py-3 bg-indigo hover:bg-indigo-light text-white font-bold rounded-lg">
          Play Again
        </button>
      </GlassCard>
    )
  }

  return (
    <div className="w-full h-full pb-10 flex flex-col pt-4">
      <div className="font-mono text-2xl font-bold text-center mb-6 tracking-widest text-text-primary">
        {timerText}
      </div>

      <div className="grid grid-cols-2 gap-8 flex-1 w-full max-w-5xl mx-auto items-start">
        {/* Terms Column */}
        <div className="space-y-4">
          {termsList.map(t => {
            const isMatched = matchedPairs.has(t.id)
            const isSelected = selectedTermId === t.id
            const isWrong = wrongPair?.t === t.id
            
            return (
              <motion.button
                key={t.id}
                animate={{
                  opacity: isMatched ? 0 : 1,
                  scale: isMatched ? 0.8 : 1,
                  x: isWrong ? [-10, 10, -8, 8, 0] : 0
                }}
                transition={{ duration: isWrong ? 0.4 : 0.3 }}
                onClick={() => handleTermClick(t.id)}
                disabled={isMatched}
                className={cn(
                  "w-full p-4 rounded-xl font-cinzel text-lg font-bold border transition-all pointer-events-auto h-20 flex items-center justify-center text-center",
                  isMatched ? "pointer-events-none border-emerald bg-emerald/10 text-emerald" :
                  isSelected ? "bg-indigo border-indigo text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] scale-105 z-10 relative" :
                  isWrong ? "bg-rose/20 border-rose shadow-[0_0_20px_rgba(244,63,94,0.3)] text-rose" :
                  "bg-surface border-border-subtle hover:border-indigo/50 text-gold"
                )}
              >
                {t.term}
              </motion.button>
            )
          })}
        </div>

        {/* Definitions Column */}
        <div className="space-y-4">
          {defsList.map(d => {
            const isMatched = matchedPairs.has(d.id)
            const isWrong = wrongPair?.d === d.id
            
            return (
               <motion.button
                key={`def-${d.id}`}
                animate={{
                  opacity: isMatched ? 0 : 1,
                  scale: isMatched ? 0.8 : 1,
                  x: isWrong ? [-10, 10, -8, 8, 0] : 0
                }}
                transition={{ duration: isWrong ? 0.4 : 0.3 }}
                onClick={() => handleDefClick(d.id)}
                disabled={isMatched}
                className={cn(
                  "w-full p-4 rounded-xl text-sm border transition-all text-left pointer-events-auto h-20 overflow-hidden flex items-center",
                  isMatched ? "pointer-events-none border-emerald bg-emerald/10" :
                  isWrong ? "bg-rose/20 border-rose shadow-[0_0_20px_rgba(244,63,94,0.3)] text-white" :
                  selectedTermId ? "hover:border-indigo cursor-pointer bg-base border-border-subtle text-text-secondary" :
                  "bg-base border-border-subtle text-text-secondary opacity-80 cursor-default"
                )}
              >
                <div className="line-clamp-3">{d.definition}</div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
