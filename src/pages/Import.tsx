import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import { Term, Cluster } from '../types'
import { useAppStore } from '../store/useAppStore'
import { useToastStore } from '../store/useToastStore'
import { assignCluster, getPriority } from '../lib/clustering'
import { PriorityBadge } from '../components/ui/PriorityBadge'
import { Select } from '../components/ui/Select'

export default function ImportPage() {
  const [inputText, setInputText] = useState('')
  const [parsedTerms, setParsedTerms] = useState<Term[]>([])
  const { setTerms } = useAppStore()
  const { addToast } = useToastStore()
  const navigate = useNavigate()

  const handleParse = () => {
    const lines = inputText.split('\n').filter(l => l.trim())
    const newTerms: Term[] = []
    
    let isTermTabDef = true
    
    lines.forEach(line => {
      // Trying to split by tab, or maybe split by " - " or just the first space? The prompt specifically mentioned TERM[tab]DEFINITION format
      let parts = line.split('\t')
      if (parts.length < 2) {
        parts = line.split(' - ') // fallback
      }
      
      if (parts.length >= 2) {
        const term = parts[0].trim()
        const definition = parts.slice(1).join('\t').trim()
        const cluster = assignCluster(`${term} ${definition}`)
        
        newTerms.push({
          id: uuidv4(),
          term,
          definition,
          cluster,
          priority: getPriority(cluster),
          known: false,
          flagged: false,
          lastSeen: 0,
          timesCorrect: 0,
          timesWrong: 0,
          aiChatHistory: [],
          notes: '',
          createdAt: Date.now()
        })
      }
    })

    if (newTerms.length === 0) {
      addToast({ type: 'error', message: 'Could not parse any terms. Ensure TERM [tab] DEFINITION format.' })
      return
    }

    setParsedTerms(newTerms)
  }

  const handleConfirm = () => {
    setTerms(parsedTerms)
    addToast({ type: 'success', message: `Imported ${parsedTerms.length} terms.` })
    navigate('/dashboard')
  }

  const handleLoadSampleData = () => {
    const sampleData = [
      { t: "Life Insurance", d: "A contract that pledges payment of an amount to the beneficiary upon the death of the insured." },
      { t: "Whole Life", d: "Life insurance that pays a benefit on the death of the insured and also accumulates a cash value." },
      { t: "Testator", d: "A person who has made a will or given a legacy." },
      { t: "Probate", d: "The official proving of a will." },
      { t: "401(k)", d: "A defined contribution plan where an employee can make contributions from his or her paycheck either before or after-tax." },
      { t: "Municipal Bond", d: "A debt security issued by a state, municipality or county to finance its capital expenditures." },
      { t: "Macaulay Duration", d: "The weighted average term to maturity of the cash flows from a bond." },
      { t: "Common Stock", d: "A security that represents ownership in a corporation." },
      { t: "NASDAQ", d: "An American stock exchange, the second-largest exchange in the world by market capitalization." },
      { t: "Mutual Fund", d: "An investment program funded by shareholders that trades in diversified holdings and is professionally managed." },
      { t: "Glass-Steagall Act", d: "Passed in 1933, it separated investment and commercial banking activities in response to the Great Depression." },
      { t: "Sarbanes-Oxley Act", d: "Federal law that established sweeping auditing and financial regulations for public companies (2002)." },
      { t: "GDP", d: "The total value of goods produced and services provided in a country during one year." },
      { t: "Fiscal Policy", d: "The means by which a government adjusts its spending levels and tax rates to monitor and influence a nation's economy." },
      { t: "Capital Gains Tax", d: "A tax levied on profit from the sale of property or of an investment." },
      { t: "Derivatives", d: "A contract between two or more parties whose value is based on an agreed-upon underlying financial asset." },
      { t: "Call Option", d: "An option to buy assets at an agreed price on or before a particular date." },
      { t: "Moral Hazard", d: "Lack of incentive to guard against risk where one is protected from its consequences, e.g., by insurance." },
      { t: "Adverse Selection", d: "The tendency of those in dangerous jobs or high-risk lifestyles to get life insurance." },
      { t: "FCA", d: "Financial Conduct Authority - a financial regulatory body in the United Kingdom." },
    ]

    const newTerms: Term[] = sampleData.map(item => {
      const cluster = assignCluster(`${item.t} ${item.d}`)
      return {
        id: uuidv4(),
        term: item.t,
        definition: item.d,
        cluster,
        priority: getPriority(cluster),
        known: false,
        flagged: false,
        lastSeen: 0,
        timesCorrect: 0,
        timesWrong: 0,
        aiChatHistory: [],
        notes: '',
        createdAt: Date.now()
      }
    })

    setTerms(newTerms)
    addToast({ type: 'info', message: 'Loaded 20 sample terms.' })
    navigate('/dashboard')
  }

  const updateCluster = (id: string, newCluster: Cluster) => {
    setParsedTerms(terms => terms.map(t => 
      t.id === id ? { ...t, cluster: newCluster, priority: getPriority(newCluster) } : t
    ))
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto pt-12 md:pt-24 px-4"
    >
      <div className="text-center mb-12">
        <h1 className="font-cinzel text-5xl md:text-6xl font-bold text-text-primary drop-shadow-[0_0_15px_rgba(79,70,229,0.5)] mb-4">
          FBLA VAULT
        </h1>
        <p className="text-xl text-text-secondary font-medium tracking-wide">
          Your weapon for states.
        </p>
      </div>

      <div className="card mb-8">
        {parsedTerms.length === 0 ? (
          <>
            <textarea
              className="input-base w-full h-48 resize-none font-mono text-sm"
              placeholder="Paste your terms here... Format: TERM[tab]DEFINITION (one per line)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-between">
              <button 
                onClick={handleLoadSampleData}
                className="btn-secondary px-6"
              >
                Load Sample Data
              </button>
              <button 
                onClick={handleParse}
                className="btn-primary px-6"
              >
                Parse Terms
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-[var(--text-primary)]">Preview ({parsedTerms.length} terms)</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => setParsedTerms([])}
                  className="btn-secondary"
                >
                  Edit Input
                </button>
                <button 
                  onClick={handleConfirm}
                  className="btn-primary"
                >
                  Confirm & Import
                </button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto pr-2 rounded-lg border border-border-subtle pb-4">
              <table className="w-full text-sm text-left">
                <thead className="bg-elevated text-text-muted sticky top-0 z-10 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Term</th>
                    <th className="px-4 py-3">Definition</th>
                    <th className="px-4 py-3">Cluster</th>
                    <th className="px-4 py-3">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedTerms.map((t) => (
                    <tr key={t.id} className="border-b border-border-subtle hover:bg-surface/50">
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">{t.term}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] line-clamp-2 max-w-xs">{t.definition}</td>
                      <td className="px-4 py-3">
                        <div className="w-32">
                          <Select 
                            value={t.cluster}
                            onChange={(val) => updateCluster(t.id, val as Cluster)}
                            options={
                              ['Insurance', 'Estates & Wills', 'Retirement', 'Bonds', 'Equity & Markets', 'Funds & ETFs', 'Regulations', 'Macro & Economics', 'Taxes', 'Derivatives', 'Risk Theory', 'UK Content'].map(c => (
                                { label: c, value: c }
                              ))
                            }
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={t.priority} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
