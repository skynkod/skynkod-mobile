// SOS plan: a few quick questions, then ONE 7-day plan that treats every
// problem at once. Each day has a morning and an evening routine; the care
// for each problem is merged with rules so nothing clashes:
//   - one active per evening at most, never several together;
//   - irritated, dry or peeling skin gets gentle spot care only (azelaic acid
//     or niacinamide, every other night), never salicylic or benzoyl;
//   - one ceramide moisturizer covers both dryness and barrier repair;
//   - sensitive or reacting skin gets a mineral SPF;
//   - after a reaction: no new product for the first 3 days;
//   - everything any problem forbids is paused in the routine.

// The problems a plan can treat (ticked in the journal or picked here).
export const ISSUES = [
  { id: 'breakout', label: 'Breakout / Acne', short: 'Breakout', icon: 'ellipse-outline' },
  { id: 'redness', label: 'Redness / Irritation', short: 'Redness', icon: 'pulse-outline' },
  { id: 'dry', label: 'Dryness / Damaged barrier', short: 'Dryness', icon: 'water-outline' },
  { id: 'peeling', label: 'Peeling / Flaking', short: 'Peeling', icon: 'sunny-outline' },
  { id: 'reaction', label: 'Reaction to a product', short: 'Reaction', icon: 'alert-circle-outline' },
  { id: 'event', label: 'Big event coming up', short: 'Event glow', icon: 'diamond-outline' },
]
export const issueOf = id => ISSUES.find(i => i.id === id) || null

// Journal tags → problems.
export const issuesFromTags = (tags = []) => {
  const out = []
  if (tags.includes('New pimple')) out.push('breakout')
  if (tags.includes('Redness') || tags.includes('Itchiness / Sensitivity')) out.push('redness')
  if (tags.includes('Dryness')) out.push('dry')
  if (tags.includes('Peeling / Flaking')) out.push('peeling')
  if (tags.includes('Used new product') && out.includes('redness')) out.unshift('reaction')
  return out
}

// Old single-situation ids (Koda links, saved plans) → problems.
export const issuesFromSituation = id => ({
  breakout: ['breakout'], irritation: ['redness'], barrier: ['dry'], peeling: ['peeling'],
  reaction: ['reaction'], event: ['event'], travel: ['dry'],
})[id] || []

const o = (value, label) => ({ value, label })

// The questions, asked one by one. `showIf(issues, answers, profile)`.
export const SOS_QUESTIONS = [
  { id: 'since', type: 'single', title: 'Since when?', options: [o('today', 'Since today'), o('days', 'A few days'), o('weeks', 'More than 2 weeks')] },
  { id: 'changes', type: 'multi', title: 'What changed recently?', subtitle: 'Select all that apply',
    options: [o('product', 'A new product'), o('climate', 'Travel or a new climate'), o('stress', 'Stress'), o('sleep', 'Not enough sleep'),
      o('period', 'My period'), o('meds', 'A new medication'), o('nothing', 'Nothing special')],
    optionsFor: (issues, answers, profile) => (profile?.sex === 'man' ? 'period' : null) },
  { id: 'product', type: 'product', title: 'Which product is new?', subtitle: 'We pause it during the plan.',
    showIf: (issues, a) => (a.changes || []).includes('product') || issues.includes('reaction') },
  { id: 'sting', type: 'single', title: 'Does it sting, burn or itch?', options: [o('yes', 'Yes'), o('no', 'No')] },
  { id: 'swelling', type: 'single', title: 'Are your face, lips or eyes swelling?', options: [o('yes', 'Yes'), o('no', 'No')],
    showIf: (issues, a) => a.sting === 'yes' || issues.includes('reaction') },
  { id: 'acneType', type: 'multi', title: 'What do your spots look like?', subtitle: 'Select all that apply', showIf: issues => issues.includes('breakout'),
    options: [o('comedones', 'Blackheads or whiteheads'), o('red', 'Small red spots'), o('deep', 'Big, painful spots under the skin'), o('tiny_itchy', 'Tiny same-size bumps that itch')] },
  { id: 'acneWhere', type: 'multi', title: 'Where?', subtitle: 'Select all that apply', showIf: issues => issues.includes('breakout'),
    options: [o('forehead', 'Forehead'), o('cheeks', 'Cheeks'), o('jaw', 'Chin and jaw'), o('everywhere', 'All over')] },
  { id: 'rednessType', type: 'single', title: 'What is the redness like?', showIf: issues => issues.includes('redness'),
    options: [o('patches', 'Red patches'), o('flush', 'Flushes that come and go'), o('mouth', 'Around the nose and mouth')] },
  { id: 'activesRecent', type: 'single', title: 'Have you used retinol or acids lately?', showIf: issues => issues.includes('dry') || issues.includes('peeling'),
    options: [o('yes', 'Yes'), o('no', 'No')] },
  { id: 'pregnancy', type: 'single', title: 'Are you pregnant or breastfeeding?', subtitle: 'Some ingredients are best avoided then.',
    showIf: (issues, a, profile) => !profile?.pregnancy && profile?.sex !== 'man',
    options: [o('no', 'No'), o('pregnant', 'I’m pregnant'), o('breastfeeding', 'I’m breastfeeding')] },
]

export const questionsFor = (issues, answers, profile) =>
  SOS_QUESTIONS.filter(q => !q.showIf || q.showIf(issues, answers, profile))
    .map(q => {
      const hide = q.optionsFor?.(issues, answers, profile)
      return hide ? { ...q, options: q.options.filter(x => x.value !== hide) } : q
    })

const step = (text, need) => ({ text, need: need || null })

// The combined plan. Same shape as the old situations, so Home and the
// routine pauses keep working: { id, icon, title, intro, pause, days[] }.
export const buildSosPlan = (issues, answers = {}, profile = null) => {
  const has = id => issues.includes(id)
  const changes = answers.changes || []
  const acne = answers.acneType || []
  const where = answers.acneWhere || []
  const pregnant = ['pregnant', 'breastfeeding'].includes(answers.pregnancy || profile?.pregnancy)
  const reaction = has('reaction') || (!!answers.product && (has('redness') || answers.sting === 'yes'))
  const fungal = acne.includes('tiny_itchy')
  const perioral = answers.rednessType === 'mouth'
  const flush = answers.rednessType === 'flush'
  const dry = has('dry') || has('peeling')
  const irritated = has('redness') || has('peeling') || reaction || answers.sting === 'yes' || !!profile?.fragile
  const gentle = irritated || dry || pregnant
  const sensitive = irritated || (profile?.skin_concerns || []).includes('Sensitivity')

  // Urgent: swelling is not something to treat with a routine.
  if (answers.swelling === 'yes') {
    return { id: 'sos', urgent: true, title: 'Get medical help', issues,
      intro: 'Swelling of the face, lips or eyes can be a serious allergic reaction. Please see a doctor or go to urgent care now.' }
  }

  // What to pause: everything any problem forbids.
  const pause = new Set()
  if (has('breakout')) ['scrub', 'mask'].forEach(p => pause.add(p))
  if (has('redness') || irritated) ['retinoid', 'acid', 'exfoliant', 'vitaminC', 'fragrance', 'scrub'].forEach(p => pause.add(p))
  if (dry) ['acid', 'exfoliant', 'scrub'].forEach(p => pause.add(p))
  if (has('peeling') || answers.activesRecent === 'yes') ['retinoid', 'acid'].forEach(p => pause.add(p))
  if (reaction || answers.product) pause.add('newest')
  if (has('event')) pause.add('newest')
  if (pregnant) pause.add('retinoid')

  // Notes shown at the top of the plan.
  const notes = []
  if (answers.since === 'weeks') notes.push('It has lasted more than 2 weeks: we recommend seeing a dermatologist alongside this plan.')
  if (acne.includes('deep')) notes.push('Deep, painful spots often need a treatment only a dermatologist can prescribe. This plan calms them but please see one.')
  if (fungal) notes.push('Tiny itchy bumps can be fungal acne. The plan avoids oils that feed it. A dermatologist can confirm it.')
  if (where.includes('jaw') && (changes.includes('period') || has('breakout'))) notes.push('Spots on the chin and jaw are often hormonal. They tend to come back around your period.')
  if (flush) notes.push('Redness that comes and goes can be rosacea. Avoid heat, spicy food and hot drinks this week. A doctor can confirm it.')
  if (perioral) notes.push('Bumps around the nose and mouth can be perioral dermatitis. The plan avoids rich creams there.')
  if (changes.includes('meds')) notes.push('A new medication can affect your skin. Ask your doctor or pharmacist if it started around the same time.')
  if (pregnant) notes.push('Pregnancy-safe: no retinol, and only gentle spot care.')

  // The products each part of the routine calls for.
  const cleanser = step(irritated || dry ? 'Gentle, non-foaming cleanser (or just cool water in the morning)' : 'Gentle cleanser', 'gentleCleanser')
  const moisturizer = dry || irritated
    ? step(perioral ? 'Light ceramide moisturizer, thin layer around the mouth' : 'Ceramide moisturizer: it covers dryness and barrier repair at once', 'barrier')
    : step(changes.includes('climate') ? 'Moisturizer adapted to the climate: gel if humid, richer cream if dry or cold' : 'Light, non-comedogenic moisturizer', 'barrier')
  const spf = step(sensitive ? 'Mineral SPF 30+ (zinc oxide), gentler on reactive skin' : 'SPF 30+', sensitive ? 'mineralSpf' : 'spf')
  const soothe = step('Soothing serum (centella, panthenol)', 'soothe')
  const hydrate = step('Hydrating serum on damp skin', 'hydrate')
  const spotNeed = fungal ? 'fungalSpot' : gentle ? 'spotGentle' : 'spot'
  const spotText = fungal
    ? 'Sulfur or zinc pyrithione on the bumps only'
    : gentle ? 'Azelaic acid or niacinamide on spots only: gentle enough for irritated skin' : 'Salicylic acid or benzoyl peroxide on spots only'
  const occlusive = dry && !perioral && !fungal
    ? step(has('breakout') ? 'Thin layer of balm on dry patches only, never on spots' : 'Thin layer of a rich balm on dry patches', 'occlusive')
    : null

  const baseMorning = [cleanser, ...(has('redness') || reaction ? [soothe] : dry ? [hydrate] : []), moisturizer, spf]
  const baseEvening = [cleanser, ...(dry ? [hydrate] : []), moisturizer]

  // Evening active on treatment days: one at most, never with another.
  const activeNight = i => {
    if (!has('breakout') || reaction && i < 4) return null
    if (gentle || fungal) return i === 2 || i === 4 ? step(spotText, spotNeed) : null
    return i >= 2 && i <= 4 ? step(spotText, spotNeed) : null
  }

  // Habits from what changed.
  const habitTips = []
  if (changes.includes('stress')) habitTips.push('Stress shows on skin: 10 minutes of calm before bed helps.')
  if (changes.includes('sleep')) habitTips.push('Aim for 7 to 9 hours of sleep: your skin repairs itself at night.')
  if (changes.includes('climate')) habitTips.push('New climate: reapply SPF every 2 hours outside, drink more water.')
  if (has('breakout')) habitTips.push('Change your pillowcase and clean your phone screen.')

  const phase = i => (i < 2 ? 'calm' : i < 5 ? 'treat' : 'check')
  const days = Array.from({ length: 7 }, (_, i) => {
    const p = phase(i)
    const evening = [...baseEvening]
    const active = activeNight(i)
    if (active) evening.splice(evening.length - 1, 0, active)
    if (p !== 'calm' && occlusive) evening.push(occlusive)
    if (p === 'treat' && !active && (has('redness') || reaction)) evening.splice(1, 0, soothe)
    if (has('breakout') && i === 0 && !fungal) evening.push(step('Hydrocolloid patch on any whitehead', 'patch'))
    if (has('event') && i === 3 && !irritated) evening.push(step('Hydrating mask', 'hydratingMask'))

    const tips = []
    if (i === 0 && reaction) tips.push('Stop the new product. Rinse with cool water. Cool compresses help.')
    if (i === 0 && !reaction) tips.push('Back to basics today: let your skin calm down.')
    if (i === 1 && habitTips[0]) tips.push(habitTips[0])
    if (i === 2 && active) tips.push('Tonight the spot care is your only active. Nothing else strong.')
    if (i === 3 && habitTips[1]) tips.push(habitTips[1])
    if (i === 4 && habitTips[2]) tips.push(habitTips[2])
    if (i === 5) tips.push('Check in: note in your journal how your skin looks today.')
    if (i === 6) tips.push(irritated
      ? 'If calm, bring back one paused product every other night. Still red or burning? See a dermatologist.'
      : 'Bring back your paused products one at a time, a few days apart.')

    const avoid = [
      ...(i < 3 && reaction ? ['Any new product'] : []),
      ...(irritated ? ['Hot water on your face'] : []),
      ...(has('breakout') ? ['Picking or squeezing'] : []),
      ...(fungal ? ['Oils and rich butters'] : []),
      ...(p === 'check' ? ['Restarting everything at once'] : []),
    ].join(', ') || 'New products'

    const title = p === 'calm' ? 'Calm' : p === 'treat' ? 'Treat' : i === 5 ? 'Check in' : 'Restart gently'
    const icon = p === 'calm' ? 'snow-outline' : p === 'treat' ? (active ? 'flask-outline' : 'leaf-outline') : i === 5 ? 'eye-outline' : 'star-outline'
    const needs = [...new Set([...baseMorning, ...evening].map(s => s.need).filter(Boolean))]
    return { icon, title, morning: baseMorning, evening, tips, avoid, needs, ownedOnly: reaction && i < 3 }
  })

  const names = issues.map(id => issueOf(id)?.short).filter(Boolean)
  return {
    id: 'sos', issues, answers,
    icon: issueOf(issues[0])?.icon || 'medkit-outline',
    title: names.join(' + ') || 'Skin reset',
    intro: 'One plan for everything at once: gentle basics first, then targeted care that works well together.',
    notes,
    pause: [...pause],
    pauseProductId: answers.product || null,
    // Extra cautions for product suggestions (e.g. fungal acne avoids oils).
    cautions: { acne: fungal ? ['Fungal'] : [], conditions: [...(flush ? ['Rosacea'] : []), ...(perioral ? ['Perioral dermatitis'] : [])], pregnant },
    days,
  }
}
