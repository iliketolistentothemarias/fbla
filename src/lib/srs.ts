import { Term } from '../types'

const SRS_INITIAL_EASE = 2.5
const DAY_IN_MS = 24 * 60 * 60 * 1000

export type MasteryLevel = 'New' | 'Learning' | 'Reviewing' | 'Mastered'

export function getTermMastery(term: Term): MasteryLevel {
  if (term.consecutiveCorrect === undefined || term.consecutiveCorrect === 0) {
    if (term.timesCorrect === 0 && term.timesWrong === 0) return 'New'
    return 'Learning'
  }
  if (term.consecutiveCorrect > 0 && term.consecutiveCorrect < 4) {
    return 'Reviewing'
  }
  return 'Mastered'
}

export function isDueForReview(term: Term): boolean {
  if (!term.nextReviewDate) return true // Never studied, so it's "due" (or "new")
  return Date.now() >= term.nextReviewDate
}

export function calculateNextReview(term: Term, isCorrect: boolean): Partial<Term> {
  let { easeFactor = SRS_INITIAL_EASE, interval = 0, consecutiveCorrect = 0 } = term

  if (isCorrect) {
    if (consecutiveCorrect === 0) {
      interval = 1 // 1 day
    } else if (consecutiveCorrect === 1) {
      interval = 3 // 3 days
    } else {
      interval = Math.round(interval * easeFactor)
    }
    consecutiveCorrect++
    easeFactor = Math.max(1.3, easeFactor + 0.1) // slightly easier
  } else {
    consecutiveCorrect = 0
    interval = 0 // reset interval
    easeFactor = Math.max(1.3, easeFactor - 0.2) // harder
  }

  // Update known status based on consecutive correct
  const known = consecutiveCorrect >= 2

  const nextReviewDate = Date.now() + (interval * DAY_IN_MS)

  return { easeFactor, interval, consecutiveCorrect, nextReviewDate, known }
}
