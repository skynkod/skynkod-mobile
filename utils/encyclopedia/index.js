// Skyncyclopedia: articles that teach people how to look after their skin.
//
// An article: { id, section, title, subtitle, icon, minutes, forProfile: [profile
// values it's most useful for], ingredients: [guide ids], blocks: [...] }
// Blocks: { p }, { h }, { list: [] }, { steps: [] }, { tip }, { warn }, { derm }.

import { BASICS } from './basics'
import { MOROCCO } from './morocco'
import { ISSUES } from './issues'
import { MYTHS } from './myths'

export const SECTIONS = [
  { id: 'basics', label: 'Skincare 101', icon: 'school-outline', intro: 'The essentials everyone should know.' },
  { id: 'issues', label: 'Skin issues', icon: 'medical-outline', intro: 'Understand what your skin is going through.' },
  { id: 'ingredients', label: 'Ingredients', icon: 'flask-outline', intro: 'What each ingredient does, and who it suits.' },
  { id: 'morocco', label: 'World rituals', icon: 'earth-outline', intro: 'Beauty rituals from around the world, starting with Morocco: hammam, argan, ghassoul.' },
  { id: 'myths', label: 'Myths vs facts', icon: 'help-buoy-outline', intro: 'What’s true, and what isn’t.' },
]

export const ARTICLES = [...BASICS, ...ISSUES, ...MOROCCO, ...MYTHS]

export const getArticle = id => ARTICLES.find(a => a.id === id) || null
export const articlesIn = section => ARTICLES.filter(a => a.section === section)

const textOf = a => [a.title, a.subtitle, ...a.blocks.flatMap(b => [b.p, b.h, b.tip, b.warn, b.derm, ...(b.list || []), ...(b.steps || [])])]
  .filter(Boolean).join(' ').toLowerCase()

export const searchArticles = (query) => {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  return ARTICLES
    .map(a => ({ a, score: (a.title.toLowerCase().includes(q) ? 3 : 0) + (a.subtitle?.toLowerCase().includes(q) ? 2 : 0) + (textOf(a).includes(q) ? 1 : 0) }))
    .filter(x => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .map(x => x.a)
}

// Articles that match the user's skin answers, most relevant first.
export const articlesForProfile = (profile, limit = 4) => {
  const mine = [profile?.skin_type, ...(profile?.skin_concerns || []), ...(profile?.acne_types || []), ...(profile?.skin_conditions || [])].filter(Boolean)
  if (!mine.length) return BASICS.slice(0, limit)
  return ARTICLES
    .map(a => ({ a, score: (a.forProfile || []).filter(v => mine.includes(v)).length }))
    .filter(x => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map(x => x.a)
}
