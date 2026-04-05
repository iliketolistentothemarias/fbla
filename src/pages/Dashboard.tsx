import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { CountUp } from '../components/ui/CountUp'
import { PriorityBadge } from '../components/ui/PriorityBadge'
import { Cluster } from '../types'
import { getPriority } from '../lib/clustering'

const CLUSTERS: Cluster[] = [
  'Insurance', 'Estates & Wills', 'Retirement', 'Bonds',
  'Equity & Markets', 'Funds & ETFs', 'Regulations',
  'Macro & Economics', 'Taxes', 'Derivatives', 'Risk Theory', 'UK Content'
]

export default function Dashboard() {
  const { terms, studyStreak } = useAppStore()
  const navigate = useNavigate()

  const { knownCount, totalTerms, htsCount } = useMemo(() => {
    return {
      knownCount: terms.filter(t => t.known).length,
      totalTerms: terms.length,
      htsCount: terms.filter(t => t.flagged).length
    }
  }, [terms])

  const knownPercentage = totalTerms > 0 ? (knownCount / totalTerms) * 100 : 0

  const clusterStats = useMemo(() => {
    return CLUSTERS.map(cluster => {
      const clusterTerms = terms.filter(t => t.cluster === cluster)
      const known = clusterTerms.filter(t => t.known).length
      return {
        name: cluster,
        priority: getPriority(cluster),
        total: clusterTerms.length,
        known,
        unknown: clusterTerms.length - known
      }
    }).sort((a, b) => {
      // Sort by priority first (critical -> high -> medium -> low), then by unknown count descending
      const pMap = { critical: 4, high: 3, medium: 2, low: 1 }
      if (pMap[a.priority] !== pMap[b.priority]) {
        return pMap[b.priority] - pMap[a.priority]
      }
      return b.unknown - a.unknown
    })
  }, [terms])

  // Finding today's priority (first critical/high cluster with unknowns)
  const topPriority = clusterStats.find(c => c.unknown > 0 && (c.priority === 'critical' || c.priority === 'high')) || clusterStats.find(c => c.unknown > 0)

  const handleStudyCluster = (cluster: string) => {
    navigate('/flashcards', { state: { initialCluster: cluster } })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 font-semibold">Total Terms</p>
          <CountUp end={totalTerms} className="text-3xl font-mono font-bold text-[var(--text-primary)]" />
        </div>
        <div className="card relative overflow-hidden">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 font-semibold">Terms Known</p>
          <div className="flex items-center gap-2">
            <CountUp end={knownCount} className="text-3xl font-mono font-bold text-[var(--text-primary)]" />
            <span className="text-[var(--text-muted)] text-sm font-mono mt-2">({Math.round(knownPercentage)}%)</span>
          </div>
          <motion.div 
            className="absolute bottom-0 left-0 h-1 bg-[var(--accent)]"
            initial={{ width: 0 }}
            animate={{ width: `${knownPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="card">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 font-semibold">HTS Terms</p>
          <CountUp end={htsCount} className="text-3xl font-mono font-bold text-[var(--text-primary)]" />
        </div>
      </div>



      <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4 tracking-tight">Clusters</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clusterStats.map((stat, i) => {
          const progress = stat.total > 0 ? (stat.known / stat.total) * 100 : 0
          
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="card h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">{stat.name}</h3>
                  <PriorityBadge priority={stat.priority} />
                </div>
                
                <div className="mb-4">
                  <div className="h-2 w-full bg-[var(--surface-raised)] rounded-full overflow-hidden mb-1 border border-[var(--border)]">
                    <motion.div 
                      className="h-full bg-[var(--text-primary)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono text-[var(--text-muted)]">
                    <span>{stat.known}/{stat.total} known</span>
                    <span>{stat.unknown} remaining</span>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 flex justify-between items-center">
                  <button 
                    onClick={() => handleStudyCluster(stat.name)}
                    className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                    disabled={stat.total === 0}
                  >
                    Study <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
