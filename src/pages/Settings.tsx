import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Download, Upload, Trash2, RotateCcw } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useToastStore } from '../store/useToastStore'
import { Select } from '../components/ui/Select'
import { Checkbox } from '../components/ui/Checkbox'
import { sounds } from '../lib/sounds'

export default function Settings() {
  const { settings, updateSettings, resetProgress, clearAllData, terms } = useAppStore()
  const { addToast } = useToastStore()
  
  const [showProgressResetConfirm, setShowProgressResetConfirm] = useState(false)
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(terms))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "fbla_vault_export.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
    addToast({ type: 'success', message: 'Data exported successfully.' })
  }

  const handleResetProgress = () => {
    resetProgress()
    setShowProgressResetConfirm(false)
    addToast({ type: 'success', message: 'Study progress has been reset.' })
  }

  const handleClearData = () => {
    if (deleteInput === 'DELETE') {
      clearAllData()
      addToast({ type: 'success', message: 'All data cleared. Welcome to a fresh start.' })
      window.location.reload()
    } else {
      addToast({ type: 'error', message: 'Please type DELETE to confirm.' })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="card">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Study Preferences</h2>
        <div className="space-y-6">
          <div className="flex justify-between items-center gap-4">
            <span className="text-[var(--text-secondary)]">Default Session Size</span>
            <div className="w-48">
              <Select 
                value={settings.defaultSessionSize}
                onChange={(val) => updateSettings({ defaultSessionSize: val })}
                options={[
                  { label: "20 Terms", value: 20 },
                  { label: "50 Terms", value: 50 },
                  { label: "All Available", value: 0 }
                ]}
              />
            </div>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[var(--text-secondary)]">Default Card Order</span>
            <div className="w-48">
              <Select 
                value={settings.defaultCardOrder}
                onChange={(val) => updateSettings({ defaultCardOrder: val })}
                options={[
                  { label: "Random", value: "Random" },
                  { label: "Unknown First", value: "Unknown First" },
                  { label: "Alphabetical", value: "Alphabetical" },
                  { label: "Due First (SRS)", value: "Due First" }
                ]}
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[var(--text-primary)] font-medium">Auto-advance on Correct</span>
              <span className="text-xs text-[var(--text-muted)]">Automatically move to next card</span>
            </div>
            <Checkbox 
              checked={settings.autoAdvanceOnCorrect}
              onChange={(c) => updateSettings({ autoAdvanceOnCorrect: c })}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Display</h2>
        <div className="space-y-6">
          <div className="flex justify-between items-center gap-4">
            <span className="text-[var(--text-secondary)]">Font Size Scaler</span>
            <div className="w-32">
              <Select 
                value={settings.fontScale}
                onChange={(val) => updateSettings({ fontScale: val })}
                options={[
                  { label: "Small", value: 0.875 },
                  { label: "Medium", value: 1 },
                  { label: "Large", value: 1.125 },
                  { label: "XL", value: 1.25 }
                ]}
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[var(--text-primary)] font-medium">High Contrast Mode</span>
            </div>
            <Checkbox 
              checked={settings.highContrast}
              onChange={(c) => updateSettings({ highContrast: c })}
            />
          </div>
          <div className="flex justify-between items-center">
             <div className="flex flex-col">
              <span className="text-[var(--text-primary)] font-medium">Reduced Motion</span>
            </div>
            <Checkbox 
              checked={settings.reducedMotion}
              onChange={(c) => updateSettings({ reducedMotion: c })}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Sound</h2>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <div className="flex flex-col">
              <span className="text-[var(--text-primary)] font-medium">Master Mute</span>
            </div>
            <Checkbox 
              checked={settings.muted}
              onChange={(c) => {
                updateSettings({ muted: c })
                if (c) sounds.select()
              }}
            />
          </div>
            <button 
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.muted ? 'bg-rose' : 'bg-emerald'}`}
              onClick={() => {
                updateSettings({ muted: !settings.muted })
                if (settings.muted) sounds.select()
              }}
            >
              <motion.div 
                className="w-4 h-4 bg-white rounded-full absolute top-1"
                animate={{ left: settings.muted ? 'calc(100% - 20px)' : '4px' }}
              />
            </button>
          </div>
          
          <div className="pt-4 border-t border-border-subtle opacity-70 cursor-not-allowed">
            <span className="text-xs text-text-muted mb-2 block uppercase tracking-widest">Individual Volumes (Coming Soon)</span>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Data Management</h2>
        
        <div className="flex gap-4 mb-8">
          <button 
            onClick={handleExportData}
            className="btn-secondary flex-1 gap-2"
          >
            <Download size={16} /> Export JSON
          </button>
          <button 
            onClick={() => {
              addToast({ type: 'info', message: 'Importing more terms is currently managed by clearing data and starting over, or future CSV merge.' })
            }}
            className="btn-secondary flex-1 gap-2"
          >
            <Upload size={16} /> Import More
          </button>
        </div>

        <div className="space-y-4">
          {!showProgressResetConfirm ? (
            <button 
              onClick={() => setShowProgressResetConfirm(true)}
              className="flex w-full items-center justify-between px-4 py-3 bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--surface-raised)] rounded-[var(--radius-sm)] transition-colors text-[var(--text-primary)]"
            >
              <span className="flex items-center gap-2 font-medium"><RotateCcw size={16} /> Reset Progress</span>
              <span className="text-xs text-[var(--text-muted)]">Clears known/unknown status. Keeps terms.</span>
            </button>
          ) : (
            <div className="p-4 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-sm)]">
              <p className="font-medium mb-4 flex items-center gap-2"><AlertTriangle size={16} /> Are you sure?</p>
              <div className="flex gap-3">
                <button 
                  onClick={handleResetProgress}
                  className="btn-primary"
                >
                  Yes, Reset Progress
                </button>
                <button 
                  onClick={() => setShowProgressResetConfirm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* DANGER ZONE */}
          {!showClearDataConfirm ? (
            <button 
              onClick={() => setShowClearDataConfirm(true)}
              className="flex w-full items-center justify-between px-4 py-3 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-[var(--radius-sm)] transition-colors mt-8"
            >
              <span className="flex items-center gap-2 font-medium"><Trash2 size={16} /> Clear All Data</span>
              <span className="text-xs">Deletes everything. No undo.</span>
            </button>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-[var(--radius-sm)] mt-8">
              <p className="text-red-700 font-bold mb-2 flex items-center gap-2"><AlertTriangle size={16} /> DANGER ZONE</p>
              <p className="text-sm text-red-600 mb-4">This will permanently delete all your terms, progress, and settings. Type <strong>DELETE</strong> to confirm.</p>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="Type DELETE"
                  className="input-base"
                />
                <button 
                  onClick={handleClearData}
                  disabled={deleteInput !== 'DELETE'}
                  className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm
                </button>
                <button 
                  onClick={() => {
                    setShowClearDataConfirm(false)
                    setDeleteInput('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
