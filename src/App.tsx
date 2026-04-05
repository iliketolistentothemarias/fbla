import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import AppLayout from './components/layout/AppLayout'

// Pages
import ImportPage from './pages/Import'
import Dashboard from './pages/Dashboard'
import Flashcards from './pages/Flashcards'
import Learn from './pages/Learn'
import Browse from './pages/Browse'
import HTS from './pages/HTS'
import WarRoom from './pages/WarRoom'
import Settings from './pages/Settings'

export default function App() {
  const { terms, settings } = useAppStore()
  const [isAuthenticated, setIsAuthenticated] = React.useState(
    () => localStorage.getItem('fbla-auth') === 'true'
  )
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')

  // Apply visual settings (font scaling, reduced motion, high contrast)
  React.useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', settings.fontScale.toString())
    if (settings.reducedMotion) {
      // Simplest way is to add a class to body that we handle in Framer Motion wrappers
      document.body.classList.add('reduced-motion')
    } else {
      document.body.classList.remove('reduced-motion')
    }
    
    if (settings.highContrast) {
      document.body.classList.add('high-contrast')
    } else {
      document.body.classList.remove('high-contrast')
    }
  }, [settings])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'aaravisthegoat') {
      setIsAuthenticated(true)
      localStorage.setItem('fbla-auth', 'true')
    } else {
      setError('Incorrect password')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
        <form onSubmit={handleLogin} className="card max-w-sm w-full p-8 text-center space-y-6">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">FBLA Vault</h1>
          <p className="text-sm text-[var(--text-muted)]">Please enter the password to access the study tool.</p>
          <div className="space-y-2 text-left">
            <input 
              type="password" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Password..."
              className="input-base w-full"
              autoFocus
            />
            {error && <p className="text-rose-500 text-xs font-medium pl-1">{error}</p>}
          </div>
          <button type="submit" className="btn-primary w-full h-10">Access Vault</button>
        </form>
      </div>
    )
  }

  if (terms.length === 0) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ImportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/hts" element={<HTS />} />
          <Route path="/war-room" element={<WarRoom />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}
