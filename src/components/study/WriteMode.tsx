import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, ArrowRight } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { callAI } from '../../lib/ai'
import { sounds } from '../../lib/sounds'
import { Term } from '../../types'
import { CountUp } from '../ui/CountUp'
import { cn } from '../../lib/utils'

export default function WriteMode({ term, onNext }: { term: Term, onNext: (correct?: boolean) => void }) {
  const { updateTerm } = useAppStore()
  const [input, setInput] = useState('')
  const [isGrading, setIsGrading] = useState(false)
  const [feedback, setFeedback] = useState<any>(null)
  
  useEffect(() => {
    // Reset state when term changes
    setInput('')
    setFeedback(null)
  }, [term])

  const handleSubmit = async () => {
    if (!input.trim() || isGrading) return
    setIsGrading(true)

    try {
      const systemPrompt = `You are grading an FBLA Securities and Investments student's flashcard answer. Return ONLY valid JSON with no markdown. Format: { "correct": boolean, "score": number, "feedback": string, "keyMisses": string[] }`
      const userMessage = `Term: "${term.term}"\nCorrect Definition: "${term.definition}"\nStudent's Answer: "${input}"\n\nGrade this answer.`
      
      const response = await callAI(systemPrompt, [{ role: 'user', content: userMessage }])
      
      let result = null
      try {
        result = JSON.parse(response)
      } catch(e) {
        const match = response.match(/\{[\s\S]*\}/)
        if (match) result = JSON.parse(match[0])
      }

      setFeedback(result)
      if (result?.correct) {
        sounds.correct()
        updateTerm(term.id, { known: true, timesCorrect: term.timesCorrect + 1 })
      } else {
        sounds.wrong()
        updateTerm(term.id, { known: false, timesWrong: term.timesWrong + 1 })
      }
    } catch (e) {
      setFeedback({ correct: false, score: 0, feedback: "AI grading failed.", keyMisses: [] })
    } finally {
      setIsGrading(false)
    }
  }

  const floatingScore = (score: number) => (
    <motion.div 
      initial={{ opacity: 0, y: 0, x: -50 }}
      animate={{ opacity: [0, 1, 0], y: -80 }}
      transition={{ duration: 1.5 }}
      className="absolute right-8 top-0 font-mono text-3xl font-bold text-green-500 z-10 pointer-events-none"
    >
      +{score}
    </motion.div>
  )

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto gap-8 pt-4 pb-6">
      <div className="card flex-1 p-12 relative flex flex-col justify-center overflow-hidden">
        {feedback?.score && floatingScore(feedback.score)}
        
        <h2 className="text-3xl font-light text-center mb-8 text-[var(--text-primary)]">{term.term}</h2>
        
        <textarea
          disabled={isGrading || !!feedback}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          className="input-base w-full h-48 resize-none text-lg p-6 mb-2 font-light text-[var(--text-primary)]"
          placeholder="Type the definition from memory..."
        />
        
        {!feedback ? (
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isGrading}
            className="btn-primary w-full mt-4 h-14 text-lg font-semibold"
          >
            {isGrading ? <Loader2 className="animate-spin" /> : "Submit Answer"}
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6">
            <div className={cn("p-8 rounded-xl border flex flex-col gap-6", feedback.correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
              <div className="flex justify-between items-start">
                <h4 className={cn("font-bold text-2xl", feedback.correct ? "text-green-700" : "text-red-700")}>
                  {feedback.correct ? "Mastered!" : "Almost There"}
                </h4>
                <div className={cn("font-mono text-2xl font-bold", feedback.correct ? "text-green-700" : "text-red-700")}><CountUp end={feedback.score} />%</div>
              </div>
              <p className="text-[var(--text-primary)] text-lg font-medium leading-relaxed whitespace-pre-wrap">{feedback.feedback}</p>
              
              {!feedback.correct && (
                <div className="mt-2 space-y-4 p-6 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                  <div className="text-sm text-[var(--accent)] font-semibold uppercase tracking-widest">Real Definition</div>
                  <p className="text-[var(--text-primary)] text-base">{term.definition}</p>
                  
                  {feedback.keyMisses?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {feedback.keyMisses.map((m: string, i: number) => (
                        <span key={i} className="bg-red-100 text-red-700 text-xs px-3 py-1.5 rounded-full border border-red-200 font-semibold">{m}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <button onClick={() => onNext(feedback.correct)} className="btn-secondary w-full h-12 mt-2 gap-2 group flex items-center justify-center font-medium">
                Continue to Next (Enter) <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
