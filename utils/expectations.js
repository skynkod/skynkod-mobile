import { findIngredients } from './ingredients-guide'

// "Your expectations" (Lita, 2026-10-24): when an active can show results,
// so she doesn't change products too soon. Under each product in her routines:
// "Day 11 · too early to judge", then "time to look" with Better / Same / Worse.
// Typical times from the studies and guidelines behind each ingredient page
// (AAD, DermNet, the ingredient trials): a range, never a promise.

// weeks: [first changes, full effect]
export const EXPECT = {
  retinol: { weeks: [8, 12], what: 'Texture, breakouts and fine lines' },
  bakuchiol: { weeks: [8, 12], what: 'Fine lines and texture' },
  benzoyl: { weeks: [4, 8], what: 'Breakouts' },
  salicylic: { weeks: [4, 8], what: 'Blackheads and breakouts' },
  azelaic: { weeks: [4, 8], what: 'Redness and breakouts (marks take 8 to 12 weeks)' },
  niacinamide: { weeks: [4, 8], what: 'Shine, pores and redness' },
  zinc: { weeks: [4, 8], what: 'Shine and breakouts' },
  sulfur: { weeks: [4, 6], what: 'Breakouts' },
  vitaminc: { weeks: [4, 12], what: 'Glow and dark spots' },
  txa: { weeks: [8, 12], what: 'Dark spots and melasma' },
  arbutin: { weeks: [8, 12], what: 'Dark spots' },
  kojic: { weeks: [8, 12], what: 'Dark spots' },
  glycolic: { weeks: [2, 6], what: 'Glow and texture' },
  lactic: { weeks: [2, 6], what: 'Glow and texture' },
  mandelic: { weeks: [2, 6], what: 'Glow, texture and breakouts' },
  pha: { weeks: [2, 6], what: 'Glow and texture' },
  peptides: { weeks: [8, 12], what: 'Firmness and fine lines' },
  argireline: { weeks: [4, 8], what: 'Expression lines' },
  matrixyl: { weeks: [8, 12], what: 'Fine lines and firmness' },
  copperpeptides: { weeks: [8, 12], what: 'Firmness and skin repair' },
}

const DAY = 86400000

// The slowest key active of the product decides when to judge it.
export const expectationFor = (product) => {
  const found = findIngredients(product).filter(f => f.pos <= 8 && EXPECT[f.entry.id]).map(f => ({ id: f.entry.id, name: f.entry.name, ...EXPECT[f.entry.id] }))
  if (!found.length) return null
  return found.sort((a, b) => b.weeks[1] - a.weeks[1])[0]
}

// { day, week, phase: 'early' | 'look' | 'done' } for a product started on `startedAt`.
export const expectationStatus = (expect, startedAt, now = new Date()) => {
  if (!expect || !startedAt) return null
  const day = Math.max(1, Math.floor((now.getTime() - new Date(startedAt).getTime()) / DAY) + 1)
  const week = Math.ceil(day / 7)
  return { day, week, phase: day < expect.weeks[0] * 7 ? 'early' : 'look', progress: Math.min(1, day / (expect.weeks[1] * 7)) }
}
