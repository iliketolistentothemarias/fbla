import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence, useSpring } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { MessageSquare, RotateCcw, ArrowRight, Play, Flag } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useToastStore } from '../store/useToastStore'
import { sounds } from '../lib/sounds'
import { Term, Cluster, Session } from '../types'
import { cn } from '../lib/utils'
import { Select } from '../components/ui/Select'
import { CountUp } from '../components/ui/CountUp'
import { calculateNextReview, isDueForReview } from '../lib/srs'

type CardState = 'front' | 'back'

export default function Flashcards() {
  const location = useLocation()
  const navigate = useNavigate()
  const { terms, updateTerm, addSession, settings, updateStreak, setGlobalChatOpen, setAutoSendPrompt, activeFlashcardsSession, setActiveFlashcardsSession } = useAppStore()
  const { addToast } = useToastStore()

  // Setup state
  const [sessionActive, setSessionActive] = useState(false)
  const [complete, setComplete] = useState(false)
  
  // Setup config
  const initialCluster = location.state?.initialCluster || 'All'
  const filterHTS = location.state?.filterHTS || false
  const [selectedClusters, setSelectedClusters] = useState<Set<string>>(new Set(initialCluster !== 'All' ? [initialCluster] : []))
  const [order, setOrder] = useState(settings.defaultCardOrder)
  const [limit, setLimit] = useState<number>(settings.defaultSessionSize)

  // Session state
  const [deck, setDeck] = useState<Term[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cardState, setCardState] = useState<CardState>('front')
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, startTime: 0 })
  const [timerText, setTimerText] = useState('00:00')
  const [floatingScore, setFloatingScore] = useState<number | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)

  // Save session state to store whenever it changes
  useEffect(() => {
    if (sessionActive && !complete) {
      setActiveFlashcardsSession({
        deck,
        currentIndex,
        sessionStats,
        filterHTS,
        selectedClusters: Array.from(selectedClusters),
        order,
        limit
      })
    }
  }, [deck, currentIndex, sessionStats, filterHTS, selectedClusters, order, limit, sessionActive, complete, setActiveFlashcardsSession])

  const handleResume = () => {
    if (activeFlashcardsSession) {
      setDeck(activeFlashcardsSession.deck)
      setCurrentIndex(activeFlashcardsSession.currentIndex)
      setSessionStats({
        correct: activeFlashcardsSession.sessionStats.correct,
        wrong: activeFlashcardsSession.sessionStats.wrong,
        startTime: activeFlashcardsSession.sessionStats.startTime
      })
      setSelectedClusters(new Set(activeFlashcardsSession.selectedClusters))
      setOrder(activeFlashcardsSession.order as any)
      setLimit(activeFlashcardsSession.limit)
      setCardState('front')
      setSessionActive(true)
      setComplete(false)
    }
  }
  
  // Create deck
  const handleStart = () => {
    let pool = [...terms]
    
    if (filterHTS) {
      pool = pool.filter(t => t.flagged)
    } else if (selectedClusters.size > 0) {
      pool = pool.filter(t => selectedClusters.has(t.cluster))
    }
    
    if (pool.length === 0) {
      addToast({ type: 'warning', message: 'No terms match your selected filters.' })
      return
    }

    if (order === 'Unknown First') {
      pool.sort((a, b) => Number(a.known) - Number(b.known))
    } else if (order === 'Random') {
      pool.sort(() => Math.random() - 0.5)
    } else if (order === 'Alphabetical') {
      pool.sort((a, b) => a.term.localeCompare(b.term))
    } else if (order === 'Due First') {
      pool.sort((a, b) => {
        const aDue = isDueForReview(a) ? 1 : 0
        const bDue = isDueForReview(b) ? 1 : 0
        if (aDue !== bDue) return bDue - aDue
        return Math.random() - 0.5
      })
    }

    if (limit > 0) {
      pool = pool.slice(0, limit)
    }

    setDeck(pool)
    setCurrentIndex(0)
    setCardState('front')
    setSessionStats({ correct: 0, wrong: 0, startTime: Date.now() })
    setSessionActive(true)
    setComplete(false)
    updateStreak()
  }

  // Timer
  useEffect(() => {
    if (!sessionActive || complete) return
    const interval = setInterval(() => {
      const ms = Date.now() - sessionStats.startTime
      const s = Math.floor(ms / 1000)
      const m = Math.floor(s / 60)
      setTimerText(`${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [sessionActive, complete, sessionStats.startTime])

  const flipCard = () => {
    if (cardState === 'front') {
      setCardState('back')
      sounds.flip()
      
      // Accessibility announcement
      const el = document.getElementById('a11y-announcer')
      if (el && deck[currentIndex]) {
        el.textContent = `Definition revealed: ${deck[currentIndex].definition}`
      }
    } else {
      setCardState('front')
      sounds.flip()
    }
  }

  const handleAnswer = (isCorrect: boolean) => {
    const term = deck[currentIndex]
    
    // Update SRS
    const srsUpdates = calculateNextReview(term, isCorrect)
    
    if (isCorrect) {
      sounds.correct()
      updateTerm(term.id, { 
        ...srsUpdates,
        timesCorrect: term.timesCorrect + 1,
        lastSeen: Date.now()
      })
      setSessionStats(s => ({ ...s, correct: s.correct + 1 }))
      
      // Floating score visual
      setFloatingScore(Date.now())
      setTimeout(() => setFloatingScore(null), 1000)
    } else {
      sounds.wrong()
      updateTerm(term.id, { 
        ...srsUpdates,
        timesWrong: term.timesWrong + 1,
        lastSeen: Date.now()
      })
      setSessionStats(s => ({ ...s, wrong: s.wrong + 1 }))
    }

    setTimeout(() => {
      if (currentIndex < deck.length - 1) {
        setCardState('front')
        setCurrentIndex(i => i + 1)
      } else {
        finishSession()
      }
    }, settings.autoAdvanceOnCorrect && isCorrect ? 150 : 0)
  }

  const handleFlag = (e: React.MouseEvent | KeyboardEvent) => {
    if ('stopPropagation' in e) e.stopPropagation()
    const term = deck[currentIndex]
    sounds.flag()
    updateTerm(term.id, { flagged: !term.flagged })
    
    // update local deck copy for UI refresh
    setDeck(d => {
      const nd = [...d]
      nd[currentIndex] = { ...term, flagged: !term.flagged }
      return nd
    })
    
    addToast({ 
      type: !term.flagged ? 'warning' : 'info', 
      message: !term.flagged ? 'Added to Hard Topics' : 'Removed from Hard Topics' 
    })
  }

  const finishSession = () => {
    setComplete(true)
    sounds.complete()
    const duration = Math.floor((Date.now() - sessionStats.startTime) / 1000)
    const total = currentIndex + 1
    const accuracy = Math.round((sessionStats.correct / total) * 100) || 0
    
    addSession({
      id: uuidv4(),
      date: Date.now(),
      type: 'Flashcards',
      cluster: selectedClusters.size === 1 ? Array.from(selectedClusters)[0] : 'Mixed',
      accuracy,
      duration,
      cardsReviewed: total
    })
    
    setActiveFlashcardsSession(null)
  }

  // Keyboard controls
  useEffect(() => {
    if (!sessionActive || complete) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === ' ' || e.key === '1') {
        e.preventDefault()
        setActiveKey('1')
        setTimeout(() => setActiveKey(null), 150)
        flipCard()
        return
      } 
      
      if (e.key === 'ArrowLeft' && cardState === 'back') {
        setActiveKey('left')
        setTimeout(() => setActiveKey(null), 150)
        handleAnswer(false)
      } else if (e.key === 'ArrowRight' && cardState === 'back') {
        setActiveKey('right')
        setTimeout(() => setActiveKey(null), 150)
        handleAnswer(true)
      } else if (e.key.toLowerCase() === 'f') {
        setActiveKey('f')
        setTimeout(() => setActiveKey(null), 150)
        handleFlag(e)
      } else if (e.key.toLowerCase() === 'a') {
        setAutoSendPrompt(`Explain ${deck[currentIndex]?.term}`)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [sessionActive, complete, cardState, currentIndex, deck])

  const renderSetup = () => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto pt-10">
      <div className="card p-8">
        <h1 className="text-2xl font-semibold mb-6 text-center tracking-tight">Session Setup</h1>
        
        {filterHTS && (
          <div className="mb-6 p-4 bg-[var(--surface-raised)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] text-center font-semibold flex items-center justify-center gap-2 shadow-sm">
            <Flag size={18} className="text-amber-500" /> Reviewing Hard Topics Only
          </div>
        )}

        <div className="space-y-6">
          {!filterHTS && (
            <div>
              <label className="section-label mb-3 block">Filter by Cluster</label>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setSelectedClusters(new Set())}
                  className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all border border-transparent", selectedClusters.size === 0 ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm" : "bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--background)]")}
                >
                  All Clusters
                </button>
                {['Insurance', 'Estates & Wills', 'Retirement', 'Bonds', 'Equity & Markets', 'Funds & ETFs', 'Regulations', 'Macro & Economics', 'Taxes', 'Derivatives', 'Risk Theory', 'UK Content'].map(c => {
                  const isActive = selectedClusters.has(c)
                  return (
                    <button 
                      key={c}
                      onClick={() => {
                        const next = new Set(selectedClusters)
                        if (isActive) next.delete(c)
                        else next.add(c)
                        setSelectedClusters(next)
                      }}
                      className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all border border-transparent", isActive ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm" : "bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--background)]")}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="section-label mb-3 block">Card Order</label>
              <Select 
                value={order} 
                onChange={(val) => setOrder(val as any)}
                options={[
                  { label: "Random", value: "Random" },
                  { label: "Unknown First", value: "Unknown First" },
                  { label: "Alphabetical", value: "Alphabetical" },
                  { label: "Due First (SRS)", value: "Due First" }
                ]}
              />
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
                className="w-full h-2 bg-[var(--surface-raised)] rounded-lg appearance-none cursor-pointer border border-[var(--border)] accent-[var(--accent)]"
              />
              <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1 font-mono">
                <span>All (0)</span>
                <span>Max ({terms.length})</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleStart}
            className="btn-primary w-full mt-8 h-12 text-base"
          >
            <Play fill="currentColor" size={18} className="mr-2" /> Start Session
          </button>

          {activeFlashcardsSession && (
            <button 
              onClick={handleResume}
              className="w-full mt-2 h-12 text-base font-medium transition-transform active:scale-[0.98] flex items-center justify-center gap-2 bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-md hover:bg-[var(--surface-raised)]"
            >
              Resume Session ({activeFlashcardsSession.currentIndex}/{activeFlashcardsSession.deck.length})
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )

  const renderSession = () => {
    const term = deck[currentIndex]
    if (!term) return null
    const progress = (currentIndex / deck.length) * 100

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col pt-4 max-w-4xl mx-auto items-center">
        {/* Top Bar */}
        <div className="w-full flex justify-between items-center mb-6">
          <div className="flex-1 mr-6">
            <div className="h-2 w-full bg-[var(--surface-raised)] rounded-full overflow-hidden border border-[var(--border)]">
              <motion.div 
                className="h-full bg-indigo-light shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          <div className="font-mono text-xl font-bold tracking-widest text-[var(--text-primary)] bg-[var(--surface-raised)] px-4 py-1.5 rounded-lg border border-[var(--border)]">
            {timerText}
          </div>
        </div>

        {/* Card Container - Crossfade to avoid backface glitch on all browsers */}
        <div className="relative w-full max-w-[680px] h-[400px] perspective-[2000px] select-none" onClick={flipCard}>
          <AnimatePresence mode="wait">
            {cardState === 'front' ? (
              <motion.div 
                key="front"
                initial={{ rotateX: 90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: -90, opacity: 0 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                className="w-full h-full absolute inset-0 cursor-pointer"
              >
                <div className="card w-full h-full flex flex-col hover:border-[var(--border-strong)] transition-colors">
                  <div className="flex justify-between items-start mb-auto">
                    <span className="section-label">{term.cluster}</span>
                    <span className="text-sm font-mono text-[var(--text-muted)]">{currentIndex + 1} / {deck.length}</span>
                  </div>
                  
                  <h2 className="text-center text-3xl md:text-5xl font-semibold my-auto leading-tight">
                    {term.term}
                  </h2>
                  
                  <div className="absolute top-2 left-2 text-[10px] text-[var(--text-muted)] tracking-widest font-mono opacity-50 uppercase">1 or ←</div>
                  <div className="mt-auto text-center text-xs text-[var(--text-muted)] uppercase tracking-wider">
                    Click to flip
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="back"
                initial={{ rotateX: 90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: -90, opacity: 0 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                className="w-full h-full absolute inset-0 cursor-pointer"
              >
                <div className="card w-full h-full flex flex-col hover:border-[var(--border-strong)] transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="section-label">{term.cluster}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-[var(--text-muted)]">{currentIndex + 1} / {deck.length}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center overflow-y-auto custom-scrollbar pt-6 pb-2">
                    <p className="text-xl md:text-2xl text-center leading-relaxed text-[var(--text-secondary)]">
                      {term.definition}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 relative w-full max-w-[680px]">
          {floatingScore && (
            <motion.div 
              initial={{ opacity: 0, y: 0, x: -50 }}
              animate={{ opacity: [0, 1, 0], y: -80 }}
              transition={{ duration: 1 }}
              className="absolute right-1/4 -top-8 font-mono text-3xl font-bold text-green-500 z-10 pointer-events-none drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]"
            >
              +1
            </motion.div>
          )}

          <div className="w-full max-w-[680px] grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <button 
              onClick={() => handleAnswer(false)}
              className={cn("card py-4 font-semibold text-[var(--text-secondary)] flex flex-col items-center gap-1 transition-transform", activeKey === 'left' ? "scale-95 bg-[var(--surface-raised)] border-[#fca5a5]" : "hover:bg-[var(--surface-raised)] hover:border-[#fca5a5]")}
            >
              <span className="text-[#ef4444] text-xl">Again</span>
              <span className="text-xs text-[var(--text-muted)] font-mono">← / Left</span>
            </button>
            
            <button 
              onClick={() => handleAnswer(true)}
              className={cn("card py-4 font-semibold text-[var(--text-secondary)] flex flex-col items-center gap-1 transition-transform md:col-span-2", activeKey === 'right' ? "scale-95 bg-[var(--surface-raised)] border-[#86efac]" : "hover:bg-[var(--surface-raised)] hover:border-[#86efac]")}
            >
              <span className="text-[#22c55e] text-xl">Good</span>
              <span className="text-xs text-[var(--text-muted)] font-mono">→ / Right</span>
            </button>

            <button 
              onClick={() => {
                updateTerm(term.id, { flagged: !term.flagged })
              }}
              className={cn("card py-4 font-semibold text-[var(--text-secondary)] flex flex-col items-center gap-1 transition-transform", activeKey === 'f' ? "scale-95 bg-[var(--surface-raised)] border-[#fde047]" : "hover:bg-[var(--surface-raised)]")}
            >
              <Flag className={term.flagged ? "fill-current text-[#eab308]" : ""} size={24} />
              <span className="text-xs text-[var(--text-muted)] font-mono">F</span>
            </button>
          </div>

          {/* Utility Row */}
          <div className="mt-6 flex justify-center gap-4">
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setAutoSendPrompt(`Explain ${term.term}`);
                }}
                className="flex flex-col items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center border bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-raised)]">
                  <MessageSquare size={16} />
                </div>
                <span className="font-mono mt-1">A (Ask AI)</span>
              </button>
          </div>
        </div>
      </motion.div>
    )
  }

  const renderComplete = () => {
    const accuracy = Math.round((sessionStats.correct / deck.length) * 100) || 0
    const unknowns = deck.filter(t => !terms.find(rt => rt.id === t.id)?.known)

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-[rgba(255,255,255,0.9)] backdrop-blur-sm flex items-center justify-center p-4">
        <div className="card w-full max-w-2xl text-center p-8 border-t-4 border-t-[var(--text-primary)]">
          <h1 className="text-3xl font-bold mb-8 tracking-tight">Session Complete</h1>
          
          <div className="grid grid-cols-3 gap-6 mb-10">
            <div>
              <p className="text-xs uppercase font-mono tracking-widest text-text-muted mb-2">Accuracy</p>
              <div className="text-4xl font-bold font-mono text-emerald">
                <CountUp end={accuracy} />%
              </div>
            </div>
            <div>
              <p className="text-xs uppercase font-mono tracking-widest text-text-muted mb-2">Cards</p>
              <div className="text-4xl font-bold font-mono text-[var(--text-primary)]">
                <CountUp end={deck.length} />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase font-mono tracking-widest text-text-muted mb-2">Time</p>
              <div className="text-4xl font-bold font-mono text-[var(--text-primary)]">
                {timerText}
              </div>
            </div>
          </div>

          {unknowns.length > 0 && (
            <div className="mb-8 text-left bg-surface/50 rounded-xl p-4 border border-border-subtle max-h-64 overflow-y-auto">
              <h3 className="font-bold text-rose mb-3 flex items-center gap-2">
                <RotateCcw size={16} /> Needs Work ({unknowns.length})
              </h3>
              <div className="space-y-2">
                {unknowns.map(t => (
                  <div key={t.id} className="text-sm font-medium p-2 bg-base rounded border border-border-subtle cursor-pointer hover:border-indigo/50 transition-colors"
                       onClick={() => navigate('/browse')}>
                    {t.term}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            {unknowns.length > 0 && (
              <button 
                onClick={() => {
                  setDeck(unknowns)
                  setCurrentIndex(0)
                  setCardState('front')
                  setSessionStats({ correct: 0, wrong: 0, startTime: Date.now() })
                  setComplete(false)
                }}
                className="btn-secondary flex-1 h-12"
              >
                Review Unknowns
              </button>
            )}
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-primary flex-1 h-12"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <div id="a11y-announcer" aria-live="polite" className="sr-only" />
      {!sessionActive ? renderSetup() : complete ? renderComplete() : renderSession()}
    </>
  )
}
