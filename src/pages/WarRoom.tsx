import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ChevronDown, ChevronRight, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { GlassCard } from '../components/ui/GlassCard'
import { PriorityBadge } from '../components/ui/PriorityBadge'
import { cn } from '../lib/utils'
import { sounds } from '../lib/sounds'

const SCHEDULE = [
  {
    day: 1, title: 'Insurance Deep Dive', priority: 'critical', hours: '3-4',
    tasks: [
      { id: 'd1-t1', type: 'Flashcard', text: 'Cluster: Insurance — Filter and study', action: { label: 'Start Session', cluster: 'Insurance' } },
      { id: 'd1-t2', type: 'Reading', text: 'Review what makes someone a CANDIDATE for each policy type, not just definitions. Whole life vs term life vs universal — who buys each and WHY?' },
      { id: 'd1-t3', type: 'ChatGPT', text: 'Prompt to copy: "I\'m studying insurance for FBLA Securities & Investments states. I know the definitions but I need to understand WHO buys each type of policy and WHY. Walk me through whole life, term life, universal life, and variable life from a client-needs perspective. Give me real scenarios."' },
      { id: 'd1-t4', type: 'Checkpoint', text: 'Self-quiz: "Can you explain the difference between a term life and whole life policy to someone who\'s never heard of insurance?"' }
    ]
  },
  {
    day: 2, title: 'Estates, Wills & Trusts', priority: 'critical', hours: '3',
    tasks: [
      { id: 'd2-t1', type: 'Flashcard', text: 'Cluster: Estates & Wills', action: { label: 'Start Session', cluster: 'Estates & Wills' } },
      { id: 'd2-t2', type: 'Reading', text: 'Know the difference between revocable and irrevocable trusts cold. Know what probate is and how trusts avoid it.' },
      { id: 'd2-t3', type: 'HTS', text: 'Add any estate terms you can\'t define immediately to Hard Topics Sheet', action: { label: 'Go to HTS', route: '/hts' } },
      { id: 'd2-t4', type: 'ChatGPT', text: 'Prompt: "Explain the probate process and how a living trust avoids it. Then explain the difference between a will and a trust for FBLA exam purposes. Give me 3 trick questions about estates that might appear on the FBLA states exam."' },
      { id: 'd2-t5', type: 'Checkpoint', text: 'Can you define testator, executor, grantor, trustee, and beneficiary in one sentence each?' }
    ]
  },
  {
    day: 3, title: 'Bond Math & Bond Types', priority: 'high', hours: '3-4',
    tasks: [
      { id: 'd3-t1', type: 'Flashcard', text: 'Cluster: Bonds', action: { label: 'Start Session', cluster: 'Bonds' } },
      { id: 'd3-t2', type: 'Reading', text: 'CRITICAL: Understand Macaulay Duration INTUITIVELY. Higher duration = more price sensitivity to interest rate changes. It\'s NOT just a definition — it\'s a risk measurement tool. A 10-year zero-coupon bond has much higher duration than a 10-year coupon bond.' },
      { id: 'd3-t3', type: 'ChatGPT', text: 'Prompt: "Explain Macaulay duration to me like I\'m a smart high schooler who gets math but hasn\'t seen this before. Then give me 3 practice problems where I have to identify whether Bond A or Bond B has higher duration and explain why."' },
      { id: 'd3-t4', type: 'Checkpoint', text: 'Without looking: what is the inverse relationship between bond prices and interest rates, and why does duration matter for that relationship?' }
    ]
  },
  {
    day: 4, title: 'Equity Markets & Move Fast', priority: 'high', hours: '2-3',
    tasks: [
      { id: 'd4-t1', type: 'Flashcard', text: 'Cluster: Equity & Markets — Note: "You likely know equity already. Move fast. Focus on anything you don\'t instantly know."', action: { label: 'Start Session', cluster: 'Equity & Markets' } },
      { id: 'd4-t2', type: 'Flashcard', text: 'Cluster: Funds & ETFs', action: { label: 'Start Session', cluster: 'Funds & ETFs' } },
      { id: 'd4-t3', type: 'ChatGPT', text: 'Prompt: "Quiz me on equity and mutual fund terms for FBLA Securities & Investments. Ask me 10 questions, wait for my answer, then tell me if I\'m right and explain what I missed. Start with: what is the difference between a load fund and a no-load fund?"' },
      { id: 'd4-t4', type: 'HTS', text: 'Flag any terms you hesitated on', action: { label: 'Go to HTS', route: '/hts' } }
    ]
  },
  {
    day: 5, title: 'Regulations & The Acts', priority: 'high', hours: '3',
    tasks: [
      { id: 'd5-t1', type: 'Flashcard', text: 'Cluster: Regulations', action: { label: 'Start Session', cluster: 'Regulations' } },
      { id: 'd5-t2', type: 'Reading', text: '🚨 YOU MUST KNOW: The year AND what scandal/crisis triggered each act. Glass-Steagall (1933) = Great Depression banking collapse. Securities Acts of 1933 & 1934 = 1929 crash. Sarbanes-Oxley (2002) = Enron + WorldCom accounting fraud. Dodd-Frank (2010) = 2008 financial crisis. This is how FBLA writes trick questions.' },
      { id: 'd5-t3', type: 'ChatGPT', text: 'Prompt: "For each major securities regulation act (1933 Act, 1934 Act, Glass-Steagall, Investment Company Act of 1940, ERISA, Sarbanes-Oxley, Dodd-Frank), give me: (1) the year, (2) what crisis or event caused it, (3) what it actually does, (4) a trick question FBLA might ask about it."' },
      { id: 'd5-t4', type: 'Checkpoint', text: 'Recite: what year was SOX passed and what two companies caused it?' },
      { id: 'd5-t5', type: 'Flashcard', text: 'Cluster: Taxes — Move fast, get the basics.', action: { label: 'Start Session', cluster: 'Taxes' } }
    ]
  },
  {
    day: 6, title: 'Practice Test #1 + HTS Building', priority: 'high', hours: '3-4',
    tasks: [
      { id: 'd6-t1', type: 'Reading', text: '⚠️ CRITICAL STRATEGY: FBLA recycles questions heavily. Every practice test question you see today is likely to appear on the actual exam. Treat every wrong answer as gold.' },
      { id: 'd6-t2', type: 'Reading', text: 'Take Practice Test #1 from your megafolder. Simulate real conditions: 60 minutes, no notes, no phone.' },
      { id: 'd6-t3', type: 'HTS', text: 'Every single wrong answer from the practice test → immediately add to HTS', action: { label: 'Go to HTS', route: '/hts' } },
      { id: 'd6-t4', type: 'ChatGPT', text: 'Prompt: "I just took a practice test. Here are the questions I got wrong: [PASTE WRONG QUESTIONS]. For each one, explain the correct answer and what concept I need to understand better. Then tell me what FBLA topic cluster each wrong answer falls under."' },
      { id: 'd6-t5', type: 'Checkpoint', text: 'Review your HTS. Are there patterns in what you got wrong?' }
    ]
  },
  {
    day: 7, title: 'Practice Test #2 + Pattern Recognition', priority: 'high', hours: '3-4',
    tasks: [
      { id: 'd7-t1', type: 'Reading', text: 'Take Practice Test #2. Same rules: 60 minutes, no notes.' },
      { id: 'd7-t2', type: 'HTS', text: 'Wrong answers → HTS immediately', action: { label: 'Go to HTS', route: '/hts' } },
      { id: 'd7-t3', type: 'ChatGPT', text: 'Prompt: "Looking at my HTS, I keep getting questions wrong about [TOPIC]. Create a mini-lesson for me that focuses specifically on the distinctions and edge cases, not just the definitions. Include 5 practice questions at the end."' },
      { id: 'd7-t4', type: 'Checkpoint', text: 'Compare your Day 6 and Day 7 scores. Did you improve?' }
    ]
  },
  {
    day: 8, title: 'Practice Test #3 + Final HTS Audit', priority: 'critical', hours: '3-4',
    tasks: [
      { id: 'd8-t1', type: 'Reading', text: 'Take Practice Test #3. Aim for mastery.' },
      { id: 'd8-t2', type: 'HTS', text: 'Wrong answers → HTS immediately', action: { label: 'Go to HTS', route: '/hts' } },
      { id: 'd8-t3', type: 'Flashcard', text: 'Cluster: Insurance — Quick pass on your weakest cluster', action: { label: 'Start Session', cluster: 'Insurance' } },
      { id: 'd8-t4', type: 'ChatGPT', text: 'Prompt: "I have [X] terms in my Hard Topics Sheet. I\'m going to paste them all. I need you to: (1) group them by concept similarity, (2) identify which 10 are most likely to appear on FBLA states, (3) create 5 scenarios that test multiple HTS terms at once."' },
      { id: 'd8-t5', type: 'Checkpoint', text: 'Can you answer every term in your HTS without looking?' }
    ]
  },
  {
    day: 9, title: 'Charles\'s Method — Voice Mode Review', priority: 'critical', hours: '3',
    tasks: [
      { id: 'd9-t1', type: 'Reading', text: 'TODAY\'S METHOD (Charles\'s exact loop): Open ChatGPT voice mode. For each HTS term: (1) Say the term out loud. (2) Define it yourself in your own words — like explaining to a friend. (3) Read the actual definition to ChatGPT. (4) Ask ChatGPT: "Is my understanding correct? What did I miss? How does this connect to [related term]?" This is ACTIVE RECALL. Never just re-read definitions.' },
      { id: 'd9-t2', type: 'HTS', text: 'Work through your full HTS list using Charles\'s method', action: { label: 'Go to HTS', route: '/hts' } },
      { id: 'd9-t3', type: 'ChatGPT', text: 'Prompt: "I\'m going to voice-type my understanding of financial terms. After each one, tell me: (1) what I got right, (2) what I missed, (3) one connection to another related concept, (4) a memory trick or real-world example. Start when I say my first term."' },
      { id: 'd9-t4', type: 'Checkpoint', text: 'Have you done every HTS term using voice mode?' },
      { id: 'd9-t5', type: 'Reading', text: 'If you have < 20 HTS terms left, you are in excellent shape. If you have > 50, prioritize Critical and High priority clusters tonight.' }
    ]
  },
  {
    day: 10, title: 'Light Review Only — Then Rest', priority: 'critical', hours: '1 max',
    tasks: [
      { id: 'd10-t1', type: 'Reading', text: '🛑 HARD STOP ON NEW MATERIAL. No new terms. No new clusters. Only review what you already know.' },
      { id: 'd10-t2', type: 'Flashcard', text: 'Cluster: Insurance + Regulations — Quick light pass, 20 cards max', action: { label: 'Start Session', cluster: 'Insurance' } }, // Simplified to insurance for the link
      { id: 'd10-t3', type: 'HTS', text: 'Skim your HTS one final time. Don\'t drill — just read.', action: { label: 'Go to HTS', route: '/hts' } },
      { id: 'd10-t4', type: 'Reading', text: 'Charles\'s final rule: The night before, your brain needs rest more than it needs more information. You have put in the work. Trust your preparation. Sleep 8 hours.' },
      { id: 'd10-t5', type: 'Checkpoint', text: 'Are you done studying for the night?' }
    ]
  }
]

// Confetti logic built entirely in React/DOM without libraries
function triggerConfetti() {
  sounds.complete()
  const duration = 3000
  const end = Date.now() + duration
  const frame = () => {
    const particle = document.createElement('div')
    particle.className = 'fixed rounded-full pointer-events-none z-[100]'
    const size = Math.random() * 8 + 4
    particle.style.width = `${size}px`
    particle.style.height = `${size}px`
    const colors = ['#10B981', '#06B6D4', '#F59E0B', '#F43F5E', '#4F46E5', '#FFD700']
    particle.style.background = colors[Math.floor(Math.random() * colors.length)]
    
    // Starting position (bottom center)
    const x = window.innerWidth / 2
    const y = window.innerHeight
    particle.style.left = `${x}px`
    particle.style.top = `${y}px`
    
    document.body.appendChild(particle)
    
    // Physics simulation
    let vx = (Math.random() - 0.5) * 20
    let vy = -(Math.random() * 15 + 15)
    let px = x
    let py = y
    
    const animate = () => {
      vy += 0.5 // gravity
      px += vx
      py += vy
      particle.style.transform = `translate(${px - x}px, ${py - y}px)`
      
      if (py < window.innerHeight + 100) {
        requestAnimationFrame(animate)
      } else {
        particle.remove()
      }
    }
    requestAnimationFrame(animate)
    
    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }
  frame()
}


export default function WarRoom() {
  const { warRoomProgress, setWarRoomTask } = useAppStore()
  const navigate = useNavigate()
  const [expandedDay, setExpandedDay] = useState<number>(1) // By default expand Day 1
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    // Current day logic (simplistic map starting from April 5)
    // Could also just map to the earliest day with uncompleted tasks
    // Check days sequentially
    for (const day of SCHEDULE) {
      const allCompleted = day.tasks.every(t => warRoomProgress[t.id])
      if (!allCompleted) {
        setExpandedDay(day.day)
        break
      }
    }
    
    const targetDate = new Date('2025-04-14T00:00:00Z').getTime()
    
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDate - now
      
      if (distance < 0) {
        setTimeLeft('EXAM DAY')
        clearInterval(interval)
        return
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)
      
      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  const totalTasks = SCHEDULE.reduce((acc, curr) => acc + curr.tasks.length, 0)
  const completedTasks = Object.values(warRoomProgress).filter(Boolean).length
  const progressPercent = Math.round((completedTasks / totalTasks) * 100) || 0

  const toggleTask = (taskId: string, dayNum: number) => {
    const isNowComplete = !warRoomProgress[taskId]
    setWarRoomTask(taskId, isNowComplete)
    
    if (isNowComplete) {
      sounds.select()
      // Check if day is now complete
      setTimeout(() => {
        const dayInfo = SCHEDULE.find(d => d.day === dayNum)
        if (dayInfo) {
          const { warRoomProgress: currentProgress } = useAppStore.getState() // get fresh state
          const allCompleted = dayInfo.tasks.every(t => currentProgress[t.id])
          if (allCompleted) {
            triggerConfetti()
            // optionally auto-advance tomorrow
          }
        }
      }, 50)
    }
  }

  const handleAction = (e: React.MouseEvent, action: any) => {
    e.stopPropagation()
    if (action.cluster) {
      navigate('/flashcards', { state: { initialCluster: action.cluster } })
    } else if (action.route) {
      navigate(action.route)
    }
  }

  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    const prompt = text.replace('Prompt to copy: "', '').replace('Prompt: "', '').replace(/"$/, '')
    navigator.clipboard.writeText(prompt)
    sounds.select()
    // Could add toast here but prompt didn't strictly say it, though user appreciates polish.
    // I will import useToastStore if I want, but changing the button text works too.
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto pb-12"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-surface/50 p-6 border border-border-subtle rounded-xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-rose/10 flex items-center justify-center border border-rose/20 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <Shield className="text-rose w-8 h-8" />
          </div>
          <div>
            <h1 className="font-cinzel text-3xl font-bold text-rose drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]">WAR ROOM</h1>
            <p className="text-sm font-mono text-text-muted mt-1 uppercase tracking-widest">10-Day Sprint to States</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-mono text-text-secondary uppercase mb-1">T-Minus</div>
          <div className={cn("text-3xl font-mono font-bold tracking-tight", timeLeft.startsWith('1d') || timeLeft.startsWith('2d') || timeLeft.startsWith('0d') ? "text-rose" : "text-emerald")}>
            {timeLeft || "CALCULATING..."}
          </div>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex justify-between text-xs font-mono text-text-muted mb-2 uppercase tracking-widest">
          <span>Overall Sprint Progress</span>
          <span className="text-indigo-light">{progressPercent}% ({completedTasks}/{totalTasks})</span>
        </div>
        <div className="h-3 w-full bg-surface rounded-full overflow-hidden border border-border-subtle">
          <motion.div 
            className="h-full bg-indigo-light shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {SCHEDULE.map((day) => {
          const dayTasks = day.tasks
          const completedCount = dayTasks.filter(t => warRoomProgress[t.id]).length
          const isComplete = completedCount === dayTasks.length
          const isExpanded = expandedDay === day.day
          
          return (
            <GlassCard key={day.day} className={cn("p-0 overflow-hidden transition-all duration-300", isComplete && !isExpanded ? "opacity-60" : "opacity-100", isComplete && isExpanded ? "border-emerald/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]" : "")}>
              <div 
                className={cn("p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors", isComplete ? "bg-emerald/5" : "")}
                onClick={() => setExpandedDay(isExpanded ? 0 : day.day)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono text-sm border", isComplete ? "bg-emerald/20 border-emerald/50 text-emerald" : "bg-surface border-border-subtle text-text-secondary")}>
                    {isComplete ? <Check size={18} /> : day.day}
                  </div>
                  <div>
                    <h3 className={cn("font-cinzel text-lg font-bold flex items-center gap-2", isComplete ? "text-emerald" : "text-text-primary")}>
                      Day {day.day} — {day.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <PriorityBadge priority={day.priority as any} />
                      <span className="text-xs text-text-muted font-mono">{day.hours} hours</span>
                      <span className="text-xs text-text-muted font-mono px-2 py-0.5 rounded bg-base border border-border-subtle">{completedCount}/{dayTasks.length} tasks</span>
                    </div>
                  </div>
                </div>
                <div>
                  {isExpanded ? <ChevronDown className="text-text-muted" /> : <ChevronRight className="text-text-muted" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border-subtle bg-base/50"
                  >
                    <div className="p-5 space-y-3">
                      {dayTasks.map(task => {
                        const done = !!warRoomProgress[task.id]
                        const isPrompt = task.type === 'ChatGPT'
                        
                        return (
                          <div 
                            key={task.id}
                            className={cn(
                              "group flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer",
                              done 
                                ? "bg-emerald/5 border-emerald/20 opacity-70" 
                                : "bg-surface border-border-subtle hover:border-indigo/50 hover:bg-surface/80"
                            )}
                            onClick={() => toggleTask(task.id, day.day)}
                          >
                            <div className={cn("mt-1 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors", done ? "bg-emerald border-emerald text-white" : "border-text-muted bg-base group-hover:border-indigo")}>
                              {done && <Check size={14} strokeWidth={3} />}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full font-mono", 
                                  task.type === 'Flashcard' ? 'bg-indigo/20 text-indigo-light' : 
                                  task.type === 'Reading' ? 'bg-cyan/20 text-cyan' :
                                  task.type === 'ChatGPT' ? 'bg-violet/20 text-violet' :
                                  task.type === 'HTS' ? 'bg-amber/20 text-amber' :
                                  'bg-emerald/20 text-emerald'
                                )}>
                                  {task.type}
                                </span>
                              </div>
                              <p className={cn("text-sm mb-3", done ? "text-text-muted line-through" : "text-text-primary")}>
                                {task.text}
                              </p>
                              
                              {task.action && !done && (
                                <button 
                                  onClick={(e) => handleAction(e, task.action)}
                                  className="text-xs px-3 py-1.5 bg-indigo/10 text-indigo-light border border-indigo/30 rounded hover:bg-indigo/20 transition-colors flex items-center gap-1"
                                >
                                  {task.action.label} <ChevronRight size={12} />
                                </button>
                              )}
                              
                              {isPrompt && !done && (
                                <button 
                                  onClick={(e) => copyToClipboard(e, task.text)}
                                  className="text-xs px-3 py-1.5 bg-surface text-text-secondary border border-border-subtle rounded hover:text-text-primary transition-colors inline-block"
                                >
                                  📋 Copy Prompt
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          )
        })}
      </div>
    </motion.div>
  )
}
