import { Cluster } from '../types'

const clusters: Record<Cluster, string[]> = {
  'Insurance': ['life insurance', 'premium', 'death benefit', 'annuity', 'surrender', 'whole life', 'universal', 'variable life', 'term life', 'cash value', 'deductible', 'copay', 'beneficiary', 'underwriter', 'actuarial', 'peril', 'hazard', 'indemnity', 'cobra', 'disability', 'rider', 'face value', 'endowment'],
  'Estates & Wills': ['will', 'trust', 'estate', 'probate', 'intestate', 'grantor', 'trustee', 'codicil', 'testator', 'executor', 'revocable', 'irrevocable', 'power of attorney', 'living will', 'per stirpes', 'curtesy', 'dower'],
  'Retirement': ['ira', '401k', '403b', '457', 'pension', 'sep', 'simple', 'keogh', 'defined benefit', 'defined contribution', 'rollover', 'erisa', 'vesting', 'rmd', 'required minimum'],
  'Bonds': ['bond', 'coupon', 'maturity', 'yield', 'duration', 't-bill', 't-note', 't-bond', 'debenture', 'municipal', 'cmo', 'remic', 'gnma', 'fnma', 'tranche', 'sinking fund', 'indenture', 'par value', 'basis point', 'ladder', 'callable', 'convertible bond', 'macaulay'],
  'Equity & Markets': ['stock', 'equity', 'dividend', 'ipo', 'nyse', 'nasdaq', 'market maker', 'specialist', 'short sale', 'margin', 'common stock', 'preferred stock', 'warrant', 'pre-emptive', 'book value', 'p/e ratio', 'blue chip', 'bull', 'bear'],
  'Funds & ETFs': ['mutual fund', 'etf', 'nav', 'load', '12b-1', 'index fund', 'closed-end', 'open-end', 'reit', 'hedge fund', 'expense ratio', 'prospectus', 'turnover rate', 'fund family'],
  'Regulations': ['sec', 'finra', '1933', '1934', 'dodd-frank', 'sarbanes', 'glass-steagall', 'sipc', 'blue sky', 'insider trading', 'churning', 'regulation fd', 'suitability', 'know your customer', 'fiduciary', 'msrb'],
  'Macro & Economics': ['gdp', 'inflation', 'recession', 'depression', 'fomc', 'fiscal policy', 'monetary policy', 'cpi', 'discount rate', 'federal funds', 'prime rate', 'business cycle', 'stagflation', 'velocity of money', 'm1', 'm2', 'multiplier effect'],
  'Taxes': ['tax', 'fica', 'w-2', 'w-4', '1099', 'irs', 'deduction', 'withholding', 'capital gains', 'wash sale', 'oasdi', 'amt', 'bracket', 'marginal rate', 'progressive'],
  'Derivatives': ['option', 'futures', 'call', 'put', 'swap', 'derivative', 'strike price', 'arbitrage', 'hedge', 'cftc', 'intrinsic value', 'time value', 'in the money', 'at the money', 'out of the money', 'long straddle'],
  'Risk Theory': ['pure risk', 'speculative risk', 'hazard', 'loss exposure', 'law of large numbers', 'adverse selection', 'reinsurance', 'pooling', 'moral hazard', 'morale hazard', 'subrogation'],
  'UK Content': ['fsma', 'dpa', 'isa', 'fca', 'pra', 'financial services authority', 'data protection', 'individual savings account']
}

export function assignCluster(text: string): Cluster {
  const lowerText = text.toLowerCase()
  
  for (const [cluster, keywords] of Object.entries(clusters)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return cluster as Cluster
    }
  }
  
  return 'Equity & Markets' // default fallback
}

export function getPriority(cluster: Cluster): 'critical' | 'high' | 'medium' | 'low' {
  switch (cluster) {
    case 'Insurance':
    case 'Estates & Wills':
      return 'critical'
    case 'Bonds':
    case 'Retirement':
    case 'Regulations':
      return 'high'
    case 'Equity & Markets':
    case 'Funds & ETFs':
    case 'Macro & Economics':
    case 'Taxes':
      return 'medium'
    default:
      return 'low'
  }
}
