import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { callAI } from '../../lib/ai'
import { sounds } from '../../lib/sounds'
import { Term } from '../../types'
import { cn } from '../../lib/utils'

export default function TrueFalse({ term, onNext }: { term: Term, onNext: (correct?: boolean) => void }) {
  const { terms, updateTerm } = useAppStore()
  
  const [statement, setStatement] = useState('')
  const [isTrue, setIsTrue] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [answer, setAnswer] = useState<boolean | null>(null)
  
  useEffect(() => {
    generateStatement()
  }, [term])

  const generateStatement = async () => {
    setIsLoading(true)
    setAnswer(null)
    
    // 50/50 chance True or False
    const truthy = Math.random() > 0.5
    setIsTrue(truthy)
    
    if (truthy) {
      setStatement(term.definition)
      setIsLoading(false)
    } else {
      const otherTerms = terms.filter(t => t.id !== term.id)
      if (otherTerms.length > 0) {
        const randomTerm = otherTerms[Math.floor(Math.random() * otherTerms.length)]
        setStatement(randomTerm.definition)
      } else {
        setStatement(term.definition + " (False Variant)")
      }
      setIsLoading(false)
    }
  }

  const handleGuess = (guess: boolean) => {
    if (answer !== null) return
    setAnswer(guess)
    
    const correct = guess === isTrue
    
    if (correct) {
      sounds.correct()
      updateTerm(term.id, { known: true, timesCorrect: term.timesCorrect + 1 })
    } else {
      sounds.wrong()
      updateTerm(term.id, { known: false, timesWrong: term.timesWrong + 1 })
    }
  }

  useEffect(() => {
    if (answer !== null) {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter') onNext(answer === isTrue)
      }
      window.addEventListener('keydown', handleKey)
      return () => window.removeEventListener('keydown', handleKey)
    }
  }, [answer, onNext])

  const showResult = answer !== null
  const correctGuess = answer === isTrue

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto gap-8 pt-4">
      <div className="card flex-1 flex flex-col p-12 relative text-center justify-center min-h-[300px]">
        <h2 className="text-xl font-light text-[var(--text-primary)] mb-8 tracking-widest uppercase">{term.term}</h2>
        
        <div className="flex-1 flex items-center justify-center p-8 bg-[var(--surface-raised)] rounded-xl border border-[var(--border)] relative overflow-hidden">
          {isLoading ? (
            <Loader2 className="animate-spin text-[var(--text-muted)] size-10" />
          ) : (
            <div className="flex flex-col items-center justify-center w-full max-w-2xl">
              <p className={cn("text-3xl font-light leading-relaxed text-[var(--text-primary)]", showResult && !correctGuess && "text-[var(--text-muted)] line-through text-xl mb-4")}>
                {statement}
              </p>
              {showResult && !correctGuess && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-red-50 border border-red-200 rounded-lg text-left mt-4">
                  <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">Authentic Definition</span>
                  <p className="text-2xl font-light text-red-900 leading-relaxed">{term.definition}</p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-6 pb-6 w-full">
        <button
          onClick={() => handleGuess(true)}
          disabled={isLoading || showResult}
          className={cn("flex-1 h-20 font-light rounded-xl transition-all text-xl outline-none border", 
            showResult ? (isTrue ? "bg-green-500 text-white border-green-600 shadow-md font-semibold" : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] opacity-50") :
            "bg-[var(--background)] border-[var(--border)] hover:bg-green-50 hover:border-green-500 hover:text-green-600 text-[var(--text-primary)] shadow-sm"
          )}
        >
          TRUE
        </button>
        <button
          onClick={() => handleGuess(false)}
          disabled={isLoading || showResult}
          className={cn("flex-1 h-20 font-light rounded-xl transition-all text-xl outline-none border", 
            showResult ? (!isTrue ? "bg-red-500 text-white border-red-600 shadow-md font-semibold" : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] opacity-50") :
            "bg-[var(--background)] border-[var(--border)] hover:bg-red-50 hover:border-red-500 hover:text-red-500 text-[var(--text-primary)] shadow-sm"
          )}
        >
          FALSE
        </button>
      </div>

      {showResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn("mb-6 p-6 rounded-xl border flex justify-between items-center", correctGuess ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
          <div className={cn("font-semibold text-lg", correctGuess ? "text-green-700" : "text-red-700")}>
            {correctGuess ? "Correct!" : "Incorrect"}
          </div>
          <button onClick={() => onNext(correctGuess)} className="btn-primary h-10 px-6 font-semibold shadow-sm text-sm">
            Continue (Enter)
          </button>
        </motion.div>
      )}
    </div>
  )
}
