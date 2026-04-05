import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, BrainCircuit, Play, Trash2, ChevronRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { useToastStore } from '../store/useToastStore'
import { callAI } from '../lib/ai'
import { GlassCard } from '../components/ui/GlassCard'
import { Term } from '../types'
import { cn } from '../lib/utils'

export default function HTS() {
  const { terms, updateTerm } = useAppStore()
  const { addToast } = useToastStore()
  const navigate = useNavigate()
  
  const [isExplaining, setIsExplaining] = useState(false)
  const [aiInsights, setAiInsights] = useState<{term: string, insight: string}[]>([])

  const htsTerms = terms.filter(t => t.flagged)
  const termsByCluster = htsTerms.reduce((acc, term) => {
    if (!acc[term.cluster]) acc[term.cluster] = []
    acc[term.cluster].push(term)
    return acc
  }, {} as Record<string, Term[]>)

  const handleExportText = () => {
    const text = htsTerms.map(t => `${t.term}: ${t.definition}`).join('\n\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'fbla_hard_topics.txt'
    link.click()
  }

  const handleReviewAll = () => {
    navigate('/flashcards', { state: { filterHTS: true } })
  }

  const handleAIExplainAll = async () => {
    if (htsTerms.length === 0) return
    setIsExplaining(true)
    
    try {
      const systemPrompt = "You are helping an FBLA Securities and Investments student understand how their hard terms connect to each other. Be concise, insightful, and focus on exam-relevant connections. Format EXACTLY as: TERM -> [connection]. No other text, no intro, no outro."
      const prompt = `Here are my hard topics:\n${htsTerms.map(t => `${t.term}: ${t.definition}`).join('\n')}\n\nFor each term, give me ONE sentence explaining how it connects to at least one other term on this list. Use the exact format: TERM -> [connection].`
      
      const response = await callAI(systemPrompt, [{ role: 'user', content: prompt }])
      
      const insights = response.split('\n')
        .map(line => {
          const match = line.match(/^(.*?)\s*->\s*(.*)$/)
          if (match) return { term: match[1].replace(/\*\*/g, '').trim(), insight: match[2].trim() }
          return null
        })
        .filter(Boolean) as {term: string, insight: string}[]
        
      setAiInsights(insights)
    } catch (error) {
      console.error(error)
      addToast({ type: 'error', message: 'Failed to generate AI insights.' })
    } finally {
      setIsExplaining(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border-subtle pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-cinzel text-4xl font-bold text-amber drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              Hard Topics Sheet
            </h1>
            <span className="bg-amber text-black font-bold px-3 py-1 rounded-full text-sm">
              {htsTerms.length}
            </span>
          </div>
          <p className="text-text-secondary text-sm">Terms you've flagged for intense focus before the states exam.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleExportText}
            className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-elevated border border-border-subtle rounded-lg text-sm text-text-primary transition-colors hover:border-amber/50"
            disabled={htsTerms.length === 0}
          >
            <Download size={16} /> Export
          </button>
          
          <button 
            onClick={handleReviewAll}
            className="flex items-center gap-2 px-4 py-2 bg-indigo/10 text-indigo hover:bg-indigo/20 border border-indigo/30 rounded-lg text-sm font-medium transition-colors"
            disabled={htsTerms.length === 0}
          >
            <Play size={16} /> Review All
          </button>

          <button 
            onClick={handleAIExplainAll}
            className="flex items-center gap-2 px-4 py-2 bg-cyan/10 text-cyan hover:bg-cyan/20 border border-cyan/30 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all"
            disabled={htsTerms.length === 0 || isExplaining}
          >
            {isExplaining ? (
              <><BrainCircuit size={16} className="animate-pulse" /> Connecting...</>
            ) : (
              <><Sparkles size={16} /> AI Map Connections</>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {aiInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard className="border-cyan/30 shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <BrainCircuit size={120} />
              </div>
              <h2 className="font-cinzel text-xl font-bold text-cyan flex items-center gap-2 mb-4">
                <Sparkles size={20} /> AI Connection Map
              </h2>
              <div className="space-y-4 relative z-10">
                {aiInsights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 bg-base/50 p-3 rounded-lg border border-border-subtle">
                    <ChevronRight className="text-cyan mt-1 flex-shrink-0" size={16} />
                    <div>
                      <span className="font-cinzel text-cyan font-bold mr-2">{insight.term}:</span>
                      <span className="text-text-primary text-sm">{insight.insight}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {htsTerms.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <FlamePlaceholder />
          <p className="mt-4 font-medium">Your Hard Topics Sheet is empty.</p>
          <p className="text-sm mt-2">Flag terms during flashcard sessions or browsing to add them here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(termsByCluster).map(([cluster, clusterTerms]) => (
            <div key={cluster}>
              <h3 className="font-cinzel text-lg font-bold text-text-primary border-b border-border-subtle pb-2 mb-4">
                {cluster} <span className="text-text-muted text-sm ml-2">({clusterTerms.length})</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clusterTerms.map(term => (
                  <GlassCard key={term.id} className="flex flex-col h-full hover:border-amber/40 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-cinzel text-lg font-bold text-gold">{term.term}</h4>
                      {term.timesWrong > 3 && (
                        <span className="bg-rose/20 text-rose text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-rose/30">
                          Got wrong {term.timesWrong}x
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-3 mb-4 flex-1">
                      {term.definition}
                    </p>
                    <div className="flex justify-end pt-4 border-t border-border-subtle mt-auto gap-2">
                      <button 
                        onClick={() => updateTerm(term.id, { flagged: false })}
                        className="p-2 text-text-muted hover:text-rose hover:bg-rose/10 rounded transition-colors tooltip-trigger relative group"
                      >
                        <Trash2 size={16} />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Remove from HTS</span>
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function FlamePlaceholder() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto opacity-20">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  )
}
