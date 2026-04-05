import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToastStore } from '../../store/useToastStore'
import { cn } from '../../lib/utils'
import { ToastMessage } from '../../types'

export default function ToastProvider() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const styles = {
    success: 'bg-emerald-glow/20 border-emerald/50 text-emerald',
    error: 'bg-rose-glow/20 border-rose/50 text-rose',
    info: 'bg-indigo-glow/20 border-indigo/50 text-indigo-light',
    warning: 'bg-amber-glow/20 border-amber/50 text-amber',
  }

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />,
    warning: <AlertTriangle size={20} />,
  }

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className={cn(
        "pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-lg border backdrop-blur-xl shadow-lg min-w-[300px]",
        styles[toast.type]
      )}
    >
      <div className="flex items-center gap-3">
        {icons[toast.type]}
        <p className="font-medium text-text-primary text-sm">{toast.message}</p>
      </div>
      <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
        <X size={16} />
      </button>
    </motion.div>
  )
}
