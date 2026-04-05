import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, Bot, Loader2, GripHorizontal } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { callAI } from '../../lib/ai'
import { Message } from '../../types'

export default function GlobalAIChat() {
  const { terms, globalChatOpen, setGlobalChatOpen, autoSendPrompt, setAutoSendPrompt } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Drag state
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 20, y: 20 })
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initPosX: 0, initPosY: 0 })

  useEffect(() => {
    const saved = localStorage.getItem('chat_panel_pos')
    if (saved) {
      try {
        const p = JSON.parse(saved)
        const x = Math.min(Math.max(0, p.x), window.innerWidth - 380)
        const y = Math.min(Math.max(0, p.y), window.innerHeight - 520)
        setPos({ x, y })
      } catch (e) {}
    } else {
      setPos({ x: window.innerWidth - 400, y: window.innerHeight - 560 })
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (autoSendPrompt) {
      setGlobalChatOpen(true)
      handleSend(autoSendPrompt)
      setAutoSendPrompt(null)
    }
  }, [autoSendPrompt])

  const handleSend = async (override?: string) => {
    const text = override ?? input
    if (!text.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const dump = terms.map(t => `${t.term}: ${t.definition}`).join('\n')
      const systemPrompt = `You are a strict, helpful AI assistant for FBLA Securities & Investments. 
Use the following student terms context to answer questions. 
Keep answers concise, direct, and professional.

Context Terms:
${dump}`

      const payload = [...messages.slice(-6), userMessage]
      const response = await callAI(systemPrompt, payload)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initPosX: pos.x,
      initPosY: pos.y
    }
    document.body.style.userSelect = 'none'
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.isDragging) return
      
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      
      let newX = dragRef.current.initPosX + dx
      let newY = dragRef.current.initPosY + dy

      const maxX = window.innerWidth - 380
      const maxY = window.innerHeight - 520
      newX = Math.min(Math.max(0, newX), maxX)
      newY = Math.min(Math.max(0, newY), maxY)

      setPos({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      if (dragRef.current.isDragging) {
        dragRef.current.isDragging = false
        document.body.style.userSelect = ''
        localStorage.setItem('chat_panel_pos', JSON.stringify(pos))
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [pos])

  return (
    <>
      <button 
        onClick={() => setGlobalChatOpen(true)}
        className="fixed bottom-6 right-6 w-[52px] h-[52px] bg-[var(--accent)] text-[var(--accent-foreground)] rounded-full shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all flex items-center justify-center z-[90] pointer-events-auto"
        style={{ display: globalChatOpen ? 'none' : 'flex' }}
      >
        <MessageSquare size={24} />
      </button>

      {globalChatOpen && (
        <div 
          ref={panelRef}
          className="fixed w-[380px] h-[520px] bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] flex flex-col z-[100] overflow-hidden"
          style={{ 
            left: `${pos.x}px`, 
            top: `${pos.y}px`,
          }}
        >
          <div 
            className="h-14 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between px-4 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2 pointer-events-none">
              <Bot size={18} className="text-[var(--text-primary)]" />
              <span className="font-semibold text-sm">AI Assistant</span>
            </div>
            <div className="flex gap-2 items-center">
              <GripHorizontal size={14} className="text-[var(--text-muted)] pointer-events-none" />
              <button 
                onClick={(e) => { e.stopPropagation(); setGlobalChatOpen(false) }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-sm hover:bg-[var(--surface)] transition-colors cursor-pointer"
                onMouseDown={e => e.stopPropagation()}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] p-6 text-center space-y-2">
                <MessageSquare size={32} className="opacity-20 mb-2" />
                <p className="text-sm">Ask me anything about FBLA Securities & Investments.</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] rounded-[var(--radius-lg)] px-4 py-2.5 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-[var(--accent)] text-[var(--accent-foreground)] ml-8' 
                        : 'bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] mr-8'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-muted)] rounded-[var(--radius-lg)] px-4 py-3">
                  <Loader2 className="animate-spin size-4" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-[var(--border)] bg-[var(--background)]">
            <div className="relative flex items-center">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
                placeholder="Message AI..."
                className="input-base w-full pr-12 resize-none h-[40px] py-[9px]"
                rows={1}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 text-[var(--text-primary)] hover:text-[var(--text-secondary)] disabled:opacity-30 disabled:hover:text-[var(--text-primary)] transition-colors p-1"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
