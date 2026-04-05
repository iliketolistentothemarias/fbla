import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppState, Term, Settings, Message, Session } from '../types'

interface AppStore extends AppState {
  setTerms: (terms: Term[]) => void
  addTerm: (term: Term) => void
  updateTerm: (id: string, updates: Partial<Term>) => void
  deleteTerm: (id: string) => void
  updateSettings: (updates: Partial<Settings>) => void
  setGlobalChatOpen: (open: boolean) => void
  setAutoSendPrompt: (prompt: string | null) => void
  updateStreak: () => void
  setWarRoomTask: (taskId: string, completed: boolean) => void
  addSession: (session: Session) => void
  addGlobalAIMessage: (message: Message) => void
  clearGlobalAIChat: () => void
  resetProgress: () => void
  clearAllData: () => void
  setActiveLearnSession: (session: any | null) => void
  setActiveFlashcardsSession: (session: any | null) => void
}

const defaultSettings: Settings = {
  defaultSessionSize: 20,
  defaultCardOrder: 'Random',
  autoAdvanceOnCorrect: false,
  fontScale: 1,
  highContrast: false,
  reducedMotion: false,
  muted: false,
  volumes: {
    correct: 0.1,
    wrong: 0.1,
    flip: 0.1,
    complete: 0.1,
  }
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      terms: [],
      settings: defaultSettings,
      studyStreak: { lastStudied: '', count: 0 },
      warRoomProgress: {},
      sessionHistory: [],
      globalAIChatHistory: [],
      globalChatOpen: false,
      autoSendPrompt: null,
      activeLearnSession: null,
      activeFlashcardsSession: null,
      
      setTerms: (terms) => set({ terms }),
      addTerm: (term) => set((state) => ({ terms: [...state.terms, term] })),
      updateTerm: (id, updates) => set((state) => ({
        terms: state.terms.map((t) => t.id === id ? { ...t, ...updates } : t)
      })),
      deleteTerm: (id) => set((state) => ({
        terms: state.terms.filter((t) => t.id !== id)
      })),
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),
      setGlobalChatOpen: (open) => set({ globalChatOpen: open }),
      setAutoSendPrompt: (prompt) => set({ autoSendPrompt: prompt }),
      updateStreak: () => set((state) => {
        const today = new Date().toISOString().split('T')[0]
        const last = state.studyStreak.lastStudied
        if (last === today) return state // no change
        
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        if (last === yesterday) {
          return { studyStreak: { lastStudied: today, count: state.studyStreak.count + 1 } }
        }
        return { studyStreak: { lastStudied: today, count: 1 } }
      }),
      setWarRoomTask: (taskId, completed) => set((state) => ({
        warRoomProgress: { ...state.warRoomProgress, [taskId]: completed }
      })),
      addSession: (session) => set((state) => ({
        sessionHistory: [...state.sessionHistory, session]
      })),
      addGlobalAIMessage: (message) => set((state) => ({
        globalAIChatHistory: [...state.globalAIChatHistory, message]
      })),
      clearGlobalAIChat: () => set({ globalAIChatHistory: [] }),
      resetProgress: () => set((state) => ({
        terms: state.terms.map(t => ({ ...t, known: false, flagged: false, timesCorrect: 0, timesWrong: 0, lastSeen: 0 })),
        activeLearnSession: null,
        activeFlashcardsSession: null
      })),
      clearAllData: () => set({
        terms: [],
        settings: defaultSettings,
        studyStreak: { lastStudied: '', count: 0 },
        warRoomProgress: {},
        sessionHistory: [],
        globalAIChatHistory: [],
        activeLearnSession: null,
        activeFlashcardsSession: null
      }),
      setActiveLearnSession: (session) => set({ activeLearnSession: session }),
      setActiveFlashcardsSession: (session) => set({ activeFlashcardsSession: session })
    }),
    {
      name: 'fbla_vault_v2',
    }
  )
)
