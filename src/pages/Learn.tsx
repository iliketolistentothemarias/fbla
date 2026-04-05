import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useAppStore } from '../store/useAppStore'
import { cn } from '../lib/utils'
import { Term } from '../types'
import { calculateNextReview, getTermMastery, isDueForReview } from '../lib/srs'

import WriteMode from '../components/study/WriteMode'
import MultipleChoice from '../components/study/MultipleChoice'
import TrueFalse from '../components/study/TrueFalse'

type QuestionType = 'Write' | 'Multiple Choice' | 'True/False'

interface LearnSequence {
  term: Term;
  type: QuestionType;
}

export default function Learn() {
  const { terms, updateTerm, setAutoSendPrompt, addSession, updateStreak, activeLearnSession, setActiveLearnSession } = useAppStore()
  
  const [sessionActive, setSessionActive] = useState(false)
  const [complete, setComplete] = useState(false)
  const [limit, setLimit] = useState(20)
  const [selectedCluster, setSelectedCluster] = useState<string>('All')
  const [sessionStartTime, setSessionStartTime] = useState(0)
  
  const [queue, setQueue] = useState<LearnSequence[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!sessionActive || complete || !queue[currentIndex]) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key.toLowerCase() === 'a') {
        setAutoSendPrompt(`Explain ${queue[currentIndex].term.term}`)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [sessionActive, complete, currentIndex, queue, setAutoSendPrompt])

  // Save session state to store whenever it changes
  useEffect(() => {
    if (sessionActive && !complete) {
      setActiveLearnSession({
        queue,
        currentIndex,
        selectedCluster,
        limit,
        sessionStartTime,
        originalQueueLength: queue.length
      })
    }
  }, [queue, currentIndex, sessionActive, complete, selectedCluster, limit, sessionStartTime, setActiveLearnSession])

  const handleResume = () => {
    if (activeLearnSession) {
      setQueue(activeLearnSession.queue)
      setCurrentIndex(activeLearnSession.currentIndex)
      setSelectedCluster(activeLearnSession.selectedCluster)
      setLimit(activeLearnSession.limit)
      setSessionStartTime(activeLearnSession.sessionStartTime)
      setSessionActive(true)
      setComplete(false)
    }
  }

  const handleStart = () => {
    let pool = [...terms]
    if (selectedCluster !== 'All') {
      pool = pool.filter(t => t.cluster === selectedCluster)
    }
    if (pool.length === 0) {
      alert("No terms match this cluster.")
      return
    }

    // Prioritize due cards
    pool.sort((a, b) => {
      const aDue = isDueForReview(a) ? 1 : 0
      const bDue = isDueForReview(b) ? 1 : 0
      if (aDue !== bDue) return bDue - aDue
      return Math.random() - 0.5
    })
    
    if (limit > 0) pool = pool.slice(0, limit)

    // Assign random question types
    const types: QuestionType[] = ['Multiple Choice', 'True/False', 'Write']
    
    // Weight it so multiple choice and true/false are more common to start
    const newQueue: LearnSequence[] = pool.map(term => {
      // 40% MC, 40% TF, 20% Write
      const rand = Math.random()
      let type: QuestionType = 'Write'
      if (rand < 0.4) type = 'Multiple Choice'
      else if (rand < 0.8) type = 'True/False'
      return { term, type }
    })

    setQueue(newQueue)
    setCurrentIndex(0)
    setSessionActive(true)
    setComplete(false)
    setSessionStartTime(Date.now())
  }

  const handleNext = (correct?: boolean) => {
    let nextQueueLen = queue.length
    const currentQ = queue[currentIndex]
    
    if (currentQ) {
      const isCorrect = correct !== false
      
      // Update SRS
      const srsUpdates = calculateNextReview(currentQ.term, isCorrect)
      updateTerm(currentQ.term.id, {
        ...srsUpdates,
        timesCorrect: currentQ.term.timesCorrect + (isCorrect ? 1 : 0),
        timesWrong: currentQ.term.timesWrong + (isCorrect ? 0 : 1),
        lastSeen: Date.now()
      })

      if (!isCorrect) {
        setQueue((prev: LearnSequence[]) => [...prev, { term: currentQ.term, type: currentQ.type }])
        nextQueueLen += 1
      }
    }

    if (currentIndex < nextQueueLen - 1) {
      setCurrentIndex((prev: number) => prev + 1)
    } else {
      setComplete(true)
      const duration = Math.round((Date.now() - sessionStartTime) / 1000)
      addSession({
        id: uuidv4(),
        date: Date.now(),
        type: 'Learn',
        cluster: selectedCluster,
        accuracy: 100, // TODO calc
        duration,
        cardsReviewed: nextQueueLen
      })
      updateStreak()
      setActiveLearnSession(null)
    }
  }

  if (!sessionActive) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto pt-10">
        <div className="card text-center p-8 border-t-[var(--text-primary)]">
          <h1 className="font-light text-3xl mb-2 tracking-tight">Learn Mode</h1>
          <p className="font-light text-sm text-[var(--text-muted)] mb-8">Master terms through dynamically mixed question types and spaced repetition.</p>
          
          <div className="grid grid-cols-4 gap-2 mb-8">
            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-3 flex flex-col">
              <span className="text-xl font-mono text-[var(--text-primary)]">{terms.filter(t => getTermMastery(t) === 'New').length}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">New</span>
            </div>
            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-3 flex flex-col">
              <span className="text-xl font-mono text-[var(--text-primary)]">{terms.filter(t => getTermMastery(t) === 'Learning').length}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Learning</span>
            </div>
            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-3 flex flex-col">
              <span className="text-xl font-mono text-[var(--text-primary)]">{terms.filter(t => getTermMastery(t) === 'Reviewing').length}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Reviewing</span>
            </div>
            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-3 flex flex-col">
              <span className="text-xl font-mono text-[var(--accent)]">{terms.filter(t => getTermMastery(t) === 'Mastered').length}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Mastered</span>
            </div>
          </div>
          
          <div className="space-y-6 text-left pb-4">
            <div>
              <label className="section-label mb-3 flex justify-between items-center block">
                 <span>Filter by Cluster</span>
                 <span className="text-xs font-mono px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded animate-pulse">{terms.filter(t => isDueForReview(t)).length} Due Now</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setSelectedCluster('All')}
                  className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all border", selectedCluster === 'All' ? "bg-[var(--background)] border-[var(--text-primary)] text-[var(--text-primary)] shadow-sm" : "bg-[var(--surface-raised)] border-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)]")}
                >
                  All Clusters
                </button>
                {Array.from(new Set(terms.map(t => t.cluster))).map(c => (
                  <button 
                    key={c}
                    onClick={() => setSelectedCluster(c)}
                    className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all border", selectedCluster === c ? "bg-[var(--background)] border-[var(--text-primary)] text-[var(--text-primary)] shadow-sm" : "bg-[var(--surface-raised)] border-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)]")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="section-label mb-3 flex justify-between">
                <span>Term Limit</span>
                <span className="font-mono text-[var(--accent)] font-bold">{limit === 0 ? 'All Terms' : limit}</span>
              </label>
              <input 
                type="range" 
                min="0" 
                step="5"
                max={terms.length} 
                value={limit} 
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full accent-[var(--accent)] h-2 bg-[var(--surface-raised)] rounded-lg appearance-none cursor-pointer border border-[var(--border)]"
              />
              <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1 font-mono">
                <span>All (0)</span>
                <span>Max ({terms.length})</span>
              </div>
            </div>

            <button 
              onClick={handleStart}
              className="btn-primary w-full mt-8 h-12 text-base font-medium transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Play fill="currentColor" size={18} /> Begin Learning
            </button>
            {activeLearnSession && (
              <button 
                onClick={handleResume}
                className="w-full mt-2 h-12 text-base font-medium transition-transform active:scale-[0.98] flex items-center justify-center gap-2 bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-md hover:bg-[var(--surface-raised)]"
              >
                Resume Session ({activeLearnSession.currentIndex}/{activeLearnSession.originalQueueLength})
              </button>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  if (complete) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto pt-20">
        <div className="card p-10 text-center border-t border-[var(--border-strong)]">
          <h2 className="text-3xl justify-center font-light text-[var(--text-primary)] mb-4 tracking-tight">Mastery Complete!</h2>
          <p className="text-[var(--text-muted)] mb-8 font-light">You finished {queue.length} Learn Mode questions.</p>
          <button 
            onClick={() => setSessionActive(false)}
            className="btn-primary h-12 px-8 font-light"
          >
            Study More
          </button>
        </div>
      </motion.div>
    )
  }

  const current = queue[currentIndex]
  const progress = ((currentIndex) / queue.length) * 100

  return (
    <div className="max-w-3xl mx-auto pt-6 flex flex-col h-[calc(100vh-8rem)]">
      {/* Progress Bar */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="h-2 flex-1 bg-[var(--surface-raised)] rounded-full overflow-hidden border border-[var(--border)]">
           <motion.div 
            className="h-full bg-[var(--border-strong)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="text-sm font-mono text-[var(--text-muted)] whitespace-nowrap">
          {currentIndex + 1} / {queue.length}
        </div>
        <div className="text-xs uppercase px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-muted)] font-medium">
          {current.type}
        </div>
      </div>

      {/* Render Component */}
      <AnimatePresence mode="wait">
        <motion.div
           key={current.term.id + current.type}
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
           transition={{ duration: 0.2 }}
           className="flex-1"
        >
          {current.type === 'Multiple Choice' && <MultipleChoice term={current.term} onNext={handleNext} />}
          {current.type === 'True/False' && <TrueFalse term={current.term} onNext={handleNext} />}
          {current.type === 'Write' && <WriteMode term={current.term} onNext={handleNext} />}
        </motion.div>
      </AnimatePresence>

      {/* Ask AI Utility */}
      <div className="mt-8 flex justify-center">
        <button 
          onClick={() => setAutoSendPrompt(`Explain ${current.term.term}`)}
          className="flex flex-col items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center border bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-raised)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <span className="font-mono mt-1">A (Ask AI)</span>
        </button>
      </div>
    </div>
  )
}
