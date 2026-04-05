import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, CreditCard, Brain, List, Flame, Shield, Settings, Volume2, VolumeX, Menu, X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '../../lib/utils'
import { sounds } from '../../lib/sounds'
import GlobalAIChat from '../ai/GlobalAIChat'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings, studyStreak, terms } = useAppStore()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const isSettings = location.pathname === '/settings'

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
    { label: 'Flashcards', path: '/flashcards', icon: CreditCard },
    { label: 'Learn', path: '/learn', icon: Brain },
    { label: 'Browse All', path: '/browse', icon: List },
    { label: 'Statistics', path: '/statistics', icon: Flame },
    { label: 'Hard Topics', path: '/hts', icon: Flame },
    { label: 'War Room', path: '/war-room', icon: Shield },
  ]

  const now = new Date()
  const deadline = new Date('2025-04-14T00:00:00Z')
  const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const daysLeft = diffDays > 0 ? diffDays : 0

  const handleNav = () => {
    sounds.select()
    setMobileMenuOpen(false)
  }

  return (
    <div className="flex h-screen overflow-hidden text-[var(--text-primary)]">
      {/* Mobile nav toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 card rounded-md"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static top-0 left-0 h-[calc(100vh-2rem)] m-0 md:m-4 md:w-[260px] card flex flex-col z-40 transition-transform duration-300 md:translate-x-0 shadow-lg overflow-hidden",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 pb-4">
          <h1 className="text-4xl text-[var(--text-primary)]" style={{ fontFamily: "'Caveat', cursive" }}>
            FBLA
          </h1>
        </div>

        <div className="px-4 mb-4">
          <div className="bg-[var(--surface)] rounded-md p-3 border border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">State Target</p>
            <div className={cn("text-xl font-mono font-bold", daysLeft < 3 ? "text-red-500" : "text-green-600")}>
              {daysLeft} DAYS
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={handleNav}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  active 
                    ? "bg-[var(--text-primary)] text-[var(--background)] font-medium" 
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border)] mt-auto flex flex-col gap-4">
          <div className="flex justify-end px-2">
            <button 
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 transition-colors"
              onClick={() => updateSettings({ muted: !settings.muted })}
              title="Toggle Sound (Mute/Unmute)"
            >
              {settings.muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
          <Link
            to="/settings"
            onClick={handleNav}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium w-full transition-colors",
              isSettings 
                ? "bg-[var(--text-primary)] text-[var(--background)]" 
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
            )}
          >
            <Settings size={18} />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 relative flex flex-col h-full overflow-hidden bg-transparent">
        <div className="flex-1 overflow-y-auto w-full p-4 md:p-8">
          <div className="max-w-[1200px] w-full mx-auto pb-24">
            {children}
          </div>
        </div>
      </main>

      <GlobalAIChat />
    </div>
  )
}
