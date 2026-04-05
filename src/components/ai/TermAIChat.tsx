import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Trash2, Bot, Loader2 } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { callAI } from '../../lib/ai'
import { cn } from '../../lib/utils'
import { Term, Message } from '../../types'

interface TermAIChatProps {
  term: Term
  onClose: () => void
}

export default function TermAIChat({ term, onClose }: TermAIChatProps) {
  const { updateTerm } = useAppStore()
  const chatHistory = term.aiChatHistory || []
  
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory, isTyping])

  // Initial greeting
  useEffect(() => {
    if (chatHistory.length === 0 && !isTyping) {
      triggerInitialExplain()
    }
  }, [])

  const triggerInitialExplain = async () => {
    setIsTyping(true)
    const systemPrompt = `You are helping an FBLA Securities and Investments student understand the term "${term.term}" which is defined as: "${term.definition}". 

Answer their questions about this specific term. Connect it to related exam topics. Keep answers under 120 words. Use **bold** for key related terms they should look up.`
    
    // Automatically adding first user message
    const firstUserMessage: Message = { 
      role: 'user', 
      content: `Explain "${term.term}" — give me: (1) the definition in plain English, (2) a real-world example, (3) how it connects to 2-3 related FBLA terms I should also know, (4) a memory trick or mnemonic.` 
    }
    
    updateTerm(term.id, { aiChatHistory: [firstUserMessage] })

    try {
      const response = await callAI(systemPrompt, [firstUserMessage])
      updateTerm(term.id, { aiChatHistory: [firstUserMessage, { role: 'assistant', content: response }] })
    } catch (err: any) {
      updateTerm(term.id, { aiChatHistory: [firstUserMessage, { role: 'assistant', content: `Error generating explanation: ${err.message}` }] })
    } finally {
      setIsTyping(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    const newHistory = [...chatHistory, userMsg]
    updateTerm(term.id, { aiChatHistory: newHistory })
    setInput('')
    setIsTyping(true)

    try {
      const systemPrompt = `You are helping an FBLA Securities and Investments student understand the term "${term.term}" which is defined as: "${term.definition}". 

Answer their questions about this specific term. Connect it to related exam topics. Keep answers under 120 words. Use **bold** for key related terms they should look up.`
      
      const payloadContext = newHistory.slice(-6)
      const response = await callAI(systemPrompt, payloadContext)
      
      updateTerm(term.id, { aiChatHistory: [...newHistory, { role: 'assistant', content: response }] })
    } catch (error: any) {
      updateTerm(term.id, { aiChatHistory: [...newHistory, { role: 'assistant', content: `Error: ${error.message}` }] })
    } finally {
      setIsTyping(false)
    }
  }

  const clearHistory = () => {
    updateTerm(term.id, { aiChatHistory: [] })
    triggerInitialExplain()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-[500px] h-[600px] max-h-[90vh] bg-base flex flex-col rounded-2xl border border-border-subtle shadow-2xl overflow-hidden glass-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-surface/80 border-b border-border-subtle p-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-cinzel text-xl font-bold text-gold">{term.term}</h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface border border-border-subtle text-text-muted">
                {term.cluster}
              </span>
            </div>
            <p className="text-xs text-text-secondary truncate max-w-[300px]">{term.definition}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearHistory} className="text-xs text-text-muted hover:text-rose px-2 py-1 transition-colors">
              Reset
            </button>
            <button onClick={onClose} className="p-2 bg-surface hover:bg-elevated rounded-lg transition-colors border border-border-subtle">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg, i) => {
            // Hide the initial bulky system generated prompt for the first message to keep UI clean, but keep it in context
            if (i === 0 && msg.role === 'user') {
              return (
                <div key={i} className="flex justify-center my-4 opacity-50 text-xs text-text-muted font-mono uppercase tracking-widest">
                  AI generating initial explanation...
                </div>
              )
            }

            return (
              <div key={i} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-xl p-3 text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-indigo text-white rounded-tr-sm" 
                    : "bg-surface text-text-primary border border-border-subtle rounded-tl-sm"
                )}>
                  <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                </div>
              </div>
            )
          })}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-xl p-3 bg-surface border border-border-subtle rounded-tl-sm text-cyan flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-surface border-t border-border-subtle relative flex-shrink-0">
          <input
            type="text"
            disabled={isTyping}
            className="w-full bg-base border border-border-subtle rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-indigo text-text-primary placeholder-text-muted"
            placeholder={`Ask about ${term.term}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-5 flex items-center justify-center p-2 text-indigo-light hover:text-white disabled:opacity-50 disabled:hover:text-indigo-light transition-colors top-1/2 -translate-y-1/2"
          >
            <Send size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
