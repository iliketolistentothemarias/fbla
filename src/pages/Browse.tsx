import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, Check, Flag, X, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { PriorityBadge } from '../components/ui/PriorityBadge'
import { Select } from '../components/ui/Select'
import { Checkbox } from '../components/ui/Checkbox'
import { Term, Cluster } from '../types'
import { cn } from '../lib/utils'
import { getTermMastery } from '../lib/srs'

export default function Browse() {
  const { terms, updateTerm, setGlobalChatOpen, setAutoSendPrompt } = useAppStore()
  
  const [search, setSearch] = useState('')
  const [clusterFilter, setClusterFilter] = useState<Cluster | 'All'>('All')
  const [priorityFilter, setPriorityFilter] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Known' | 'Unknown' | 'Flagged'>('All')
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredTerms = useMemo(() => {
    return terms.filter(t => {
      if (clusterFilter !== 'All' && t.cluster !== clusterFilter) return false
      if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false
      
      if (statusFilter === 'Known' && !t.known) return false
      if (statusFilter === 'Unknown' && t.known) return false
      if (statusFilter === 'Flagged' && !t.flagged) return false
      
      if (search) {
        const query = search.toLowerCase()
        if (!t.term.toLowerCase().includes(query) && !t.definition.toLowerCase().includes(query)) {
          return false
        }
      }
      
      return true
    })
  }, [terms, search, clusterFilter, priorityFilter, statusFilter])

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredTerms.map(t => t.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleBulkMarkKnown = () => {
    selectedIds.forEach(id => updateTerm(id, { known: true }))
    setSelectedIds(new Set())
  }
  
  const handleBulkFlag = () => {
    selectedIds.forEach(id => updateTerm(id, { flagged: true }))
    setSelectedIds(new Set())
  }

  const handleExportCSV = () => {
    const headers = ['Term', 'Definition', 'Cluster', 'Priority', 'Known', 'Flagged']
    const csvContent = [
      headers.join(','),
      ...filteredTerms.map(t => 
        `"${t.term.replace(/"/g, '""')}","${t.definition.replace(/"/g, '""')}","${t.cluster}","${t.priority}","${t.known}","${t.flagged}"`
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'fbla_vault_terms.csv'
    link.click()
  }

  // Use event delegation or just simple handlers for row click
  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-light tracking-tight text-[var(--text-primary)]">Browse Vault</h1>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-sm text-[var(--text-primary)] transition-colors shadow-sm"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center card p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Search terms or definitions..."
            className="input-base pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-48">
          <Select 
            value={clusterFilter}
            onChange={(val) => setClusterFilter(val)}
            options={[
              { label: "All Clusters", value: "All" },
              ...['Insurance', 'Estates & Wills', 'Retirement', 'Bonds', 'Equity & Markets', 'Funds & ETFs', 'Regulations', 'Macro & Economics', 'Taxes', 'Derivatives', 'Risk Theory', 'UK Content'].map(c => ({ label: c, value: c }))
            ]}
          />
        </div>

        <div className="w-40">
          <Select 
            value={priorityFilter}
            onChange={(val) => setPriorityFilter(val)}
            options={[
              { label: "All Priorities", value: "All" },
              { label: "Critical", value: "critical" },
              { label: "High", value: "high" },
              { label: "Medium", value: "medium" },
              { label: "Low", value: "low" }
            ]}
          />
        </div>

        <div className="w-40">
          <Select 
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { label: "Any Status", value: "All" },
              { label: "Known (Emerald)", value: "Known" },
              { label: "Unknown (Rose)", value: "Unknown" },
              { label: "Flagged (Amber)", value: "Flagged" }
            ]}
          />
        </div>
      </div>

      {/* Bulk actions */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 bg-[var(--surface-raised)] border border-[var(--border)] p-3 rounded-lg overflow-hidden"
          >
            <span className="text-sm font-medium text-[var(--text-primary)] pl-2">{selectedIds.size} term{selectedIds.size > 1 ? 's' : ''} selected</span>
            <div className="h-4 w-px bg-[var(--border)] mx-2" />
            <button onClick={handleBulkMarkKnown} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded text-sm font-bold transition-colors">
              <Check size={14} /> Mark Known
            </button>
            <button onClick={handleBulkFlag} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-sm font-bold transition-colors">
              <Flag size={14} /> Flag HTS
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[var(--surface)] text-[var(--text-muted)] rounded text-sm font-medium transition-colors ml-auto">
              <X size={14} /> Clear Selection
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-4 py-3 w-[40px]">
                  <Checkbox 
                    checked={selectedIds.size === filteredTerms.length && filteredTerms.length > 0}
                    onChange={(checked) => {
                      if (checked) {
                        setSelectedIds(new Set(filteredTerms.map(t => t.id)))
                      } else {
                        setSelectedIds(new Set())
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3 w-[40px]"></th>
                <th className="px-4 py-3">Term</th>
                <th className="px-4 py-3">Cluster</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTerms.map((t) => {
                const isSelected = selectedIds.has(t.id)
                const isExpanded = expandedId === t.id
                
                return (
                  <React.Fragment key={t.id}>
                    <tr 
                      onClick={() => toggleRow(t.id)}
                      className={cn(
                        "cursor-pointer border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-raised)]",
                        isSelected && "bg-[var(--surface-raised)]",
                        isExpanded && "bg-[var(--surface)] border-l-2 border-l-[var(--text-primary)]"
                      )}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={isSelected}
                          onChange={(checked) => {
                            const next = new Set(selectedIds)
                            if (checked) next.add(t.id)
                            else next.delete(t.id)
                            setSelectedIds(next)
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)] whitespace-nowrap">{t.term}</td>
                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{t.cluster}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {t.known && <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-green-100 text-green-700">Known</span>}
                          {!t.known && <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-red-100 text-red-700">Unknown</span>}
                          {t.flagged && <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-amber-100 text-amber-700">Flagged</span>}
                        </div>
                      </td>
                    </tr>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-0 border-b border-[var(--border)] bg-[var(--background)]">
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-4">
                                  <div>
                                    <h4 className="section-label mb-2">Definition</h4>
                                    <p className="text-[var(--text-primary)] leading-relaxed">{t.definition}</p>
                                  </div>
                                  <div>
                                    <h4 className="section-label mb-2">Personal Notes</h4>
                                    <textarea 
                                      className="input-base w-full resize-none"
                                      rows={2}
                                      placeholder="Add your own notes here..."
                                      value={t.notes || ''}
                                      onChange={(e) => updateTerm(t.id, { notes: e.target.value })}
                                    />
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="section-label mb-2">Study Stats</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-[var(--surface-raised)] rounded-lg p-2 text-center border border-[var(--border)]">
                                        <div className="text-green-600 font-bold font-mono text-xl">{t.timesCorrect}</div>
                                        <div className="text-[10px] text-[var(--text-muted)] uppercase mt-1">Correct</div>
                                      </div>
                                      <div className="bg-[var(--surface-raised)] rounded-lg p-2 text-center border border-[var(--border)]">
                                        <div className="text-red-500 font-bold font-mono text-xl">{t.timesWrong}</div>
                                        <div className="text-[10px] text-[var(--text-muted)] uppercase mt-1">Wrong</div>
                                      </div>
                                      <div className="bg-[var(--surface-raised)] rounded-lg p-2 text-center border border-[var(--border)] col-span-2">
                                        <div className="font-bold text-[var(--text-primary)] text-sm mt-1">{getTermMastery(t)}</div>
                                        <div className="text-[10px] text-[var(--text-muted)] uppercase mt-1 flex justify-between px-2">
                                          <span>Int: {t.interval || 0}d</span>
                                          <span>Due: {t.nextReviewDate ? new Date(t.nextReviewDate).toLocaleDateString() : '-'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <button 
                                    className="btn-secondary w-full"
                                    onClick={() => {
                                      setGlobalChatOpen(true);
                                      setAutoSendPrompt(`Explain ${t.term}`);
                                    }}
                                  >
                                    <MessageSquare size={16} /> Ask AI about {t.term}
                                  </button>
                                  
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => updateTerm(t.id, { flagged: !t.flagged })}
                                      className={cn(
                                        "flex-1 py-1.5 rounded text-sm font-medium transition-colors border",
                                        t.flagged 
                                          ? "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200" 
                                          : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]"
                                      )}
                                    >
                                      {t.flagged ? 'Unflag' : 'Flag for HTS'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                )
              })}
              
              {filteredTerms.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    No terms found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
