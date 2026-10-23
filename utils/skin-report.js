import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { getUserProfile } from './supabase'
import { QUESTIONS, fromRow, computeSkinType, answerLabel } from './skin-quiz'
import { getUserRoutines } from './routines-service'
import { currentRoutine } from './current-routine'
import { describeDays } from './routine-checks'
import { getProgress, moodLabel } from './progress'
import { getSkinPatterns, getProductReactions } from './journal-day'

// "My skin report" (Premium, inspired by Flo's health report, Lita 2026-10-23):
// one page to show a dermatologist, made only from what she logged in the app.
// Nothing is diagnosed or guessed.

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const q = id => QUESTIONS.find(x => x.id === id)
const label = (id, value) => (q(id) ? answerLabel(q(id), value) : null)
const ageOf = birth => {
  if (!birth) return null
  const b = new Date(birth); const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) age -= 1
  return age
}
const clean = list => (list || []).filter(v => v && v !== 'None')

export const gatherReport = async (userId) => {
  const [row, routines, progress, patterns, reactions] = await Promise.all([
    getUserProfile(userId),
    getUserRoutines(userId).catch(() => null),
    getProgress(userId).catch(() => null),
    getSkinPatterns(userId).catch(() => null),
    getProductReactions(userId).catch(() => []),
  ])
  const a = fromRow(row)
  const list = routines?.success ? routines.data : []
  return { row: row || {}, answers: a, morning: currentRoutine(list, 'morning'), evening: currentRoutine(list, 'evening'), progress, patterns, reactions }
}

export const reportHtml = ({ row, answers: a, morning, evening, progress, patterns, reactions }, { questions = '', language = 'en' } = {}) => {
  const health = !!row.consent_health_at
  const name = row.first_name || ''
  const age = ageOf(row.birth_date)
  const today = new Date().toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric' })
  const type = computeSkinType(a) || row.skin_type
  const profile = [
    type ? `Skin type: ${type}${a.reactivity === 'often' ? ', reacts easily' : ''}` : null,
    clean(a.concerns).length ? `Working on: ${clean(a.concerns).join(', ')}` : null,
    a.sun ? `Sun: ${label('sun', a.sun)}` : null,
    health && clean(a.conditions).length ? `Diagnosed by a doctor: ${label('conditions', clean(a.conditions))}` : null,
    health && clean(a.meds).length ? `Treatments: ${label('meds', clean(a.meds))}` : null,
    health && clean(a.avoid).length ? `Avoids: ${clean(a.avoid).join(', ')}` : null,
    health && ['pregnant', 'breastfeeding'].includes(a.pregnancy) ? label('pregnancy', a.pregnancy) : null,
  ].filter(Boolean)

  const steps = r => (r?.steps || []).filter(s => s.product).map(s => `${esc(s.product)}${describeDays(s.days) !== 'Every day' ? ` <span class="m">(${esc(describeDays(s.days))})</span>` : ''}`)
  const weeks = (progress?.weeks || []).filter(w => w.mood !== null)
  const moodLine = weeks.length > 1
    ? `Skin mood, week by week: ${weeks.map(w => w.mood.toFixed(1)).join(' → ')} out of 5 (${moodLabel(weeks[weeks.length - 1].mood).toLowerCase()} lately)`
    : weeks.length ? `Skin mood lately: ${weeks[0].mood.toFixed(1)} out of 5` : null
  const concerns = (progress?.concerns || []).filter(c => c.now).map(c => `${esc(c.tag)}: ${c.now} ${c.now > 1 ? 'days' : 'day'}`)
  const found = (patterns?.ready ? patterns.patterns : []).map(p => esc(p.text))
  const reacted = (reactions || []).map(r => `${esc([r.product.brand, r.product.name].filter(Boolean).join(' '))}: ${esc(r.tag.toLowerCase())} on ${r.count} days within 5 days of starting it`)
  const dekod = (progress?.dekod?.rows || []).filter(r => r.from || r.to).map(r => `${esc(r.label)}: ${esc(r.from || '—')} → ${esc(r.to || '—')}`)

  const section = (title, lines) => (lines.length ? `<h2>${title}</h2><p>${lines.join('<br>')}</p>` : '')
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #2C2C2A; font-size: 12px; line-height: 1.5; margin: 32px; }
    .top { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #D3D1C7; padding-bottom: 8px; }
    h1 { font-size: 18px; color: #72243E; margin: 0; font-weight: 600; }
    h2 { font-size: 11px; letter-spacing: 1px; color: #993556; margin: 16px 0 3px; font-weight: 700; text-transform: uppercase; }
    p { margin: 0; } .m, .foot { color: #888780; } .foot { font-size: 10px; margin-top: 22px; }
  </style></head><body>
    <div class="top"><h1>Skin report${name ? ` · ${esc(name)}` : ''}${age ? `, ${age}` : ''}</h1><span class="m">${esc(today)} · last 8 weeks</span></div>
    ${section('Profile', profile.map(esc))}
    ${section('Morning routine', steps(morning))}
    ${section('Evening routine', steps(evening))}
    ${section('What the skin journal shows', [progress?.routinesDone !== undefined ? `Routines done in the last 4 weeks: ${progress.routinesDone} of 56` : null, moodLine, concerns.length ? `Most logged: ${concerns.join(' · ')}` : null].filter(Boolean))}
    ${section('Links seen in the journal', found)}
    ${section('Reactions after starting a product', reacted)}
    ${section('Skin photos (Dekod), first and latest scan', dekod)}
    ${questions.trim() ? section('My questions', [esc(questions.trim()).replace(/\n/g, '<br>')]) : ''}
    <p class="foot">Written from what the patient logged in Skynkod (skin check-ins, routines and products). It is not a diagnosis.</p>
  </body></html>`
}

export const shareReport = async (userId, options) => {
  const data = await gatherReport(userId)
  const { uri } = await Print.printToFileAsync({ html: reportHtml(data, options) })
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'My skin report' })
  return uri
}
