export interface Term {
  id: string
  term: string
  definition: string
  cluster: Cluster
  priority: 'critical' | 'high' | 'medium' | 'low'
  known: boolean
  flagged: boolean
  lastSeen: number
  timesCorrect: number
  timesWrong: number
  aiChatHistory: Message[]
  notes: string
  createdAt: number

  // Spaced Repetition (SRS)
  nextReviewDate?: number
  easeFactor?: number
  interval?: number
  consecutiveCorrect?: number
}

export type Cluster = 
  | 'Insurance' | 'Estates & Wills' | 'Retirement' | 'Bonds'
  | 'Equity & Markets' | 'Funds & ETFs' | 'Regulations'
  | 'Macro & Economics' | 'Taxes' | 'Derivatives' | 'Risk Theory' | 'UK Content'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface Settings {
  defaultSessionSize: 20 | 50 | 0 // 0 means All
  defaultCardOrder: 'Random' | 'Unknown First' | 'Alphabetical' | 'Due First'
  autoAdvanceOnCorrect: boolean
  fontScale: number
  highContrast: boolean
  reducedMotion: boolean
  muted: boolean
  volumes: {
    correct: number
    wrong: number
    flip: number
    complete: number
  }
}

export interface Session {
  id: string
  date: number
  type: string
  cluster: string
  accuracy: number
  duration: number
  cardsReviewed: number
}

export interface ActiveLearnSession {
  queue: any[] // We'll just define it as any to avoid circular imports / keep it simple. It's LearnSequence[]
  currentIndex: number
  selectedCluster: string
  limit: number
  sessionStartTime: number
  originalQueueLength: number
}

export interface ActiveFlashcardsSession {
  deck: Term[]
  currentIndex: number
  sessionStats: { correct: number; wrong: number; startTime: number }
  filterHTS: boolean
  selectedClusters: string[]
  order: string
  limit: number
}

export interface AppState {
  terms: Term[]
  settings: Settings
  studyStreak: { lastStudied: string; count: number }
  warRoomProgress: Record<string, boolean>
  sessionHistory: Session[]
  globalAIChatHistory: Message[]
  globalChatOpen: boolean
  autoSendPrompt: string | null
  activeLearnSession: ActiveLearnSession | null
  activeFlashcardsSession: ActiveFlashcardsSession | null
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}
