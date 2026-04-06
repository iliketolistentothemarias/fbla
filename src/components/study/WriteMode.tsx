import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, ArrowRight } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { callAI } from '../../lib/ai'
import { sounds } from '../../lib/sounds'
import { Term } from '../../types'
import { CountUp } from '../ui/CountUp'
import { cn } from '../../lib/utils'

/** Aligned with prompt: at or above this score counts as a pass for SRS. */
const PASS_SCORE = 72

type GradeResult = {
  correct: boolean
  score: number
  feedback: string
  keyMisses: string[]
}

function normalizeGrade(raw: unknown): GradeResult {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const n = Number(o.score)
  const score = Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 0
  const passed = score >= PASS_SCORE
  const feedback = typeof o.feedback === 'string' && o.feedback.trim() ? o.feedback.trim() : 'No feedback returned.'
  const keyMisses = Array.isArray(o.keyMisses)
    ? o.keyMisses.filter((m): m is string => typeof m === 'string' && m.trim().length > 0)
    : []
  return { correct: passed, score, feedback, keyMisses }
}

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
      const systemPrompt = `You grade FBLA Securities and Investments "write the definition" flashcard answers.

Compare the student answer to the official definition. Score based on how well they demonstrate genuine understanding and recall of the key ideas — not just topic awareness.

Scoring rubric (be fair but firm — do NOT inflate scores):
- 90–100: Covers all essential ideas from the official definition with accurate, specific language. Minor wording differences are fine. Shows clear mastery.
- 75–89: Captures the core concept correctly and mentions most key elements, but may miss one secondary detail or use slightly imprecise language. Still demonstrates solid understanding.
- 60–74: Gets the general idea right and includes at least one specific key element from the official definition, but is missing important details or is too vague on specifics. Shows partial understanding.
- 40–59: On the right topic but mostly surface-level. Uses generic phrasing, misses multiple key specifics, or confuses related concepts. Not exam-ready.
- 20–39: Only tangentially related or shows significant misunderstanding. May have one correct keyword but no real grasp of the concept.
- 0–19: Wrong, irrelevant, or essentially blank.

Important rules:
- Ignore minor spelling and grammar mistakes.
- A one-sentence paraphrase that skips concrete details (e.g. premiums, maturity dates, risk factors, specific parties involved) should NOT score above 65 when the official definition includes those specifics.
- Conversely, don't penalize students who explain the concept well in their own words — they don't need to match the textbook verbatim.
- "correct" must be true if and only if score >= ${PASS_SCORE}.

Return a single JSON object (no markdown) with keys: correct (boolean), score (integer 0–100), feedback (2–3 sentences: acknowledge what they got right, then note what key ideas from the official definition were missing or could be stronger), keyMisses (short strings, 0–5 items, each naming one missing/imprecise concept from the official definition).`
      const userMessage = `Term: "${term.term}"\nOfficial definition: "${term.definition}"\nStudent answer: "${input}"\n\nRespond with only the JSON object.`
      
      const response = await callAI(systemPrompt, [{ role: 'user', content: userMessage }], { jsonObject: true })
      
      let result = null
      try {
        result = JSON.parse(response)
      } catch(e) {
        const match = response.match(/\{[\s\S]*\}/)
        if (match) result = JSON.parse(match[0])
      }

      const graded = normalizeGrade(result)
      setFeedback(graded)
      if (graded.correct) {
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

  const getStatusText = (score: number, correct: boolean) => {
    if (correct) {
      if (score >= 90) return "Mastered!"
      if (score >= 82) return "Excellent!"
      return "Correct!"
    }
    if (score >= 60) return "Almost there"
    if (score >= 42) return "Partial credit"
    if (score >= 22) return "Keep practicing"
    return "Not quite"
  }

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto gap-8 pt-4 pb-6">
      <div className="card flex-1 p-12 relative flex flex-col justify-center overflow-hidden">
        {feedback != null && Number.isFinite(feedback.score) && floatingScore(feedback.score)}
        
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
                  {getStatusText(feedback.score, feedback.correct)}
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
