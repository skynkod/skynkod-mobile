import { loadState, saveState } from './cloud-state'

// Her Better / Same / Worse answers from "Your expectations": on the phone and
// in her account (a new phone gets them back).
export const verdictKey = userId => `expect_verdict_${userId}`
export const getVerdicts = userId => loadState(userId, 'expect_verdict', {})
export const saveVerdicts = (userId, verdicts) => saveState(userId, 'expect_verdict', verdicts)
