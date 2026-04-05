import React from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { Clock, CheckCircle2, TrendingUp, Calendar, Zap, Inbox } from 'lucide-react'

export default function Statistics() {
  const { sessionHistory, terms } = useAppStore()

  // Derived Statistics
  const totalSessions = sessionHistory.length
  
  const totalSeconds = sessionHistory.reduce((acc, curr) => acc + (curr.duration || 0), 0)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const totalHours = Math.floor(totalMinutes / 60)
  
  const totalCardsReviewed = sessionHistory.reduce((acc, curr) => acc + (curr.cardsReviewed || 0), 0)
  
  const averageTimePerCard = totalCardsReviewed > 0 
    ? (totalSeconds / totalCardsReviewed).toFixed(1)
    : 0

  const averageAccuracy = totalSessions > 0
    ? Math.round(sessionHistory.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / totalSessions)
    : 0

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-light text-[var(--text-primary)] tracking-tight">Analytics & History</h1>
          <p className="text-[var(--text-muted)] font-light">Track your study efficiency and past performance logs.</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-6 border-t-2 border-t-[var(--text-primary)]">
          <div className="flex items-center gap-3 mb-2 text-[var(--text-muted)]">
            <Clock size={18} />
            <span className="text-xs font-mono uppercase tracking-widest font-bold">Total Time</span>
          </div>
          <div className="text-3xl font-mono text-[var(--text-primary)]">
            {formatTime(totalSeconds)}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2 text-[var(--text-muted)]">
            <Inbox size={18} />
            <span className="text-xs font-mono uppercase tracking-widest font-bold">Sessions</span>
          </div>
          <div className="text-3xl font-mono text-[var(--text-primary)]">
            {totalSessions}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2 text-[var(--text-muted)]">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <span className="text-xs font-mono uppercase tracking-widest font-bold">Global Accuracy</span>
          </div>
          <div className="text-3xl font-mono text-emerald-600">
            {averageAccuracy}%
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2 text-[var(--text-muted)]">
            <Zap size={18} className="text-amber-500" />
            <span className="text-xs font-mono uppercase tracking-widest font-bold">Avg. Pace</span>
          </div>
          <div className="text-3xl font-mono text-[var(--text-primary)]">
            {averageTimePerCard} <span className="text-sm">s/card</span>
          </div>
        </div>
      </div>

      {/* Session History Table */}
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mt-12 mb-4">Past Sessions</h2>
      
      {sessionHistory.length === 0 ? (
        <div className="card p-10 text-center border-dashed">
          <p className="text-[var(--text-muted)]">No recorded sessions yet. Start studying to build your history!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {[...sessionHistory].reverse().map((session) => (
            <motion.div 
              key={session.id} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-[var(--border-strong)] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="bg-[var(--surface-raised)] border border-[var(--border)] p-3 rounded-md hidden md:block">
                  {session.type === 'Flashcards' ? <CreditCardIcon size={20} className="text-[var(--text-secondary)]" /> : 
                   session.type === 'Learn' ? <BrainIcon size={20} className="text-[var(--text-secondary)]" /> : 
                   <Calendar size={20} className="text-[var(--text-secondary)]" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[var(--text-primary)]">{session.type} Mode</span>
                    <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-muted)] rounded">
                      {session.cluster}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--text-muted)] font-mono">
                    {new Date(session.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-8 md:gap-12 md:pl-8 border-t md:border-t-0 md:border-l border-[var(--border)] pt-4 md:pt-0">
                <div>
                  <span className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Cards</span>
                  <span className="font-mono text-[var(--text-primary)]">{session.cardsReviewed}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Duration</span>
                  <span className="font-mono text-[var(--text-primary)]">{formatTime(session.duration)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Accuracy</span>
                  <span className={`font-mono ${session.accuracy >= 80 ? 'text-emerald-600' : session.accuracy >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {session.accuracy}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function CreditCardIcon({ ...props }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
  )
}

function BrainIcon({ ...props }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>
  )
}
