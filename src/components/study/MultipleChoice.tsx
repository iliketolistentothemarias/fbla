import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import { sounds } from '../../lib/sounds'
import { Term } from '../../types'
import { cn } from '../../lib/utils'

export default function MultipleChoice({ term, onNext }: { term: Term,  onNext: (correct?: boolean) => void }) {
  const { terms, updateTerm } = useAppStore()
  const [options, setOptions] = useState<Term[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  useEffect(() => {
    let distractors = terms.filter(t => t.id !== term.id && t.cluster === term.cluster)
    if (distractors.length < 3) distractors = terms.filter(t => t.id !== term.id)
    distractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3)
    setOptions([...distractors, term].sort(() => Math.random() - 0.5))
  }, [term])

  const handleSelect = (opt: Term) => {
    if (selectedId) return
    setSelectedId(opt.id)
    
    if (opt.id === term.id) {
      sounds.correct()
      updateTerm(term.id, { known: true, timesCorrect: term.timesCorrect + 1 })
    } else {
      sounds.wrong()
      updateTerm(term.id, { known: false, timesWrong: term.timesWrong + 1 })
      updateTerm(opt.id, { known: false, timesWrong: opt.timesWrong + 1 })
    }
  }

  useEffect(() => {
    if (selectedId !== null) {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter') onNext(selectedId === term.id)
      }
      window.addEventListener('keydown', handleKey)
      return () => window.removeEventListener('keydown', handleKey)
    }
  }, [selectedId, onNext])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (selectedId) return
      const k = e.key
      if (['1','2','3','4'].includes(k)) {
        const idx = parseInt(k) - 1
        if (options[idx]) handleSelect(options[idx])
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [options, selectedId])

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto gap-8 pt-4">
      <div className="card flex flex-col items-center justify-center p-12 relative min-h-[250px]">
        {selectedId && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn("absolute top-4 left-0 right-0 mx-4 p-4 rounded-xl border flex justify-between items-center", selectedId === term.id ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
            <div className={cn("font-semibold text-lg", selectedId === term.id ? "text-green-700" : "text-red-700")}>
              {selectedId === term.id ? "Correct!" : "Incorrect"}
            </div>
            <button onClick={() => onNext(selectedId === term.id)} className="bg-white border border-gray-200 px-4 py-2 rounded-lg font-semibold shadow-sm text-sm hover:bg-gray-50">
              Continue (Enter)
            </button>
          </motion.div>
        )}
        <h2 className="text-3xl md:text-5xl font-light text-[var(--text-primary)] text-center leading-tight">
          {term.definition}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
        {options.map((opt, i) => {
          const isSelected = selectedId === opt.id
          const isActuallyCorrect = opt.id === term.id
          const showAsCorrect = selectedId && isActuallyCorrect
          const showAsWrong = isSelected && !isActuallyCorrect
          
          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleSelect(opt)}
              disabled={!!selectedId}
              className={cn(
                "p-8 rounded-xl border transition-all text-center font-light text-lg min-h-[120px] relative shadow-sm flex items-center justify-center group outline-none",
                showAsCorrect ? "bg-green-500 text-white border-green-600 scale-[1.02] z-10 shadow-md" :
                showAsWrong ? "bg-red-500 text-white border-red-600 scale-[0.98]" :
                !selectedId ? "bg-[var(--background)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)] hover:shadow-md cursor-pointer" : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] opacity-50"
              )}
            >
              <div className="absolute top-4 left-6 text-xs text-[var(--text-muted)] font-mono px-2 py-1 rounded bg-[var(--surface-raised)] transition-colors">{i + 1}</div>
              {opt.term}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
