import { computeSkinType } from './skin-quiz'

// Onboarding: after some chapters, one screen that says what her answers
// change (inspired by Flo, Lita 2026-10-23). Only what the app really does.

export const WHY_AFTER = ['test', 'bothers', 'health', 'habits']

const TEXTURES = {
  Oily: 'We’ll pick light, oil-free textures and a cleanser that doesn’t strip your skin.',
  Combination: 'We’ll pick light textures for your T-zone, and a little more comfort for your cheeks.',
  Dry: 'We’ll pick rich, comforting textures that protect your skin barrier.',
  Normal: 'We’ll keep simple, balanced textures so your skin stays as it is.',
}

const HELPS = {
  Acne: ['salicylic acid', 'niacinamide', 'azelaic acid'],
  Redness: ['centella', 'azelaic acid', 'niacinamide'],
  Dryness: ['ceramides', 'hyaluronic acid', 'glycerin'],
  'Dark spots': ['vitamin C', 'niacinamide', 'alpha-arbutin'],
  'Fine lines': ['retinol', 'peptides', 'daily sunscreen'],
  'Large pores': ['niacinamide', 'salicylic acid'],
  Dullness: ['vitamin C', 'gentle exfoliating acids'],
  Sensitivity: ['ceramides', 'panthenol', 'centella'],
}

const list = items => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0])

export const whyAfter = (chapter, a = {}) => {
  if (chapter === 'test') {
    const type = computeSkinType(a)
    const sensitive = a.reactivity === 'often'
    return {
      icon: 'sparkles-outline',
      title: type ? 'Your skin seems {type}' : 'Your skin test is saved',
      params: { type: (type || '').toLowerCase() },
      text: `${TEXTURES[type] || 'Your daily check-ins will help us read your skin even better.'}${sensitive ? ' Your skin reacts easily, so no fragrance and no strong actives at first.' : ''}`,
    }
  }
  if (chapter === 'bothers') {
    const concerns = (a.concerns || []).filter(c => HELPS[c]).slice(0, 2)
    if (!concerns.length) return { icon: 'flask-outline', title: 'Healthy skin, kept that way', text: 'We’ll look for gentle products that keep your skin balanced.' }
    const ingredients = [...new Set(concerns.flatMap(c => HELPS[c]))].slice(0, 4)
    return { icon: 'flask-outline', title: 'What we’ll look for', text: `For ${list(concerns.map(c => c.toLowerCase()))}, we’ll look for products with ${list(ingredients)}.` }
  }
  if (chapter === 'health') {
    const flags = []
    if (['pregnant', 'breastfeeding'].includes(a.pregnancy)) flags.push('ingredients to avoid while pregnant or breastfeeding')
    const avoid = (a.avoid || []).filter(x => x !== 'None')
    if (avoid.length) flags.push(list(avoid.map(x => x.toLowerCase())))
    const conditions = (a.conditions || []).filter(x => x !== 'None')
    if (conditions.length) flags.push(`what can upset ${list(conditions.map(x => x.toLowerCase()))}`)
    return flags.length
      ? { icon: 'shield-checkmark-outline', title: 'Safety first', text: `Every product you scan will be checked for ${list(flags)}.` }
      : { icon: 'shield-checkmark-outline', title: 'Safety first', text: 'Nothing to flag for now. If that changes, update it anytime in your skin profile.' }
  }
  if (chapter === 'habits') {
    if (a.sunTime === 'high') return { icon: 'sunny-outline', title: 'Your days, your skin', text: 'You spend most of the day outside: sunscreen, and reapplying it, will be at the heart of your routine.' }
    if (a.sleep === 'short') return { icon: 'bed-outline', title: 'Your days, your skin', text: 'Your skin repairs itself while you sleep: with short nights, your evening routine matters even more.' }
    if (a.stress === 'high') return { icon: 'pulse-outline', title: 'Your days, your skin', text: 'Stress shows on the skin. Your daily check-in will help you see when it does.' }
    if (a.routineLevel === 'none') return { icon: 'leaf-outline', title: 'Your days, your skin', text: 'Starting from scratch is perfect: we’ll keep it simple and build your routine step by step.' }
    return { icon: 'leaf-outline', title: 'Your days, your skin', text: 'Your skin forecast will use your habits and the weather to tell you what your skin needs each day.' }
  }
  return null
}
