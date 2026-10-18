// When skincare isn't enough: decides whether to suggest seeing a
// dermatologist, from the user's skin profile and recent journal entries.
// Returns null, or { level: 'recommended' | 'consider', reasons: [...] }.

const MEDICAL_CONDITIONS = {
  Rosacea: 'Rosacea is a medical condition: a dermatologist can prescribe treatments that calm it far better than skincare alone.',
  Eczema: 'Eczema can need prescription creams during flare-ups. A dermatologist can help you manage it.',
  'Perioral dermatitis': 'Perioral dermatitis often needs a prescription treatment to clear up.',
  'Seborrheic dermatitis': 'Seborrheic dermatitis usually responds best to medicated treatments a dermatologist can prescribe.',
  Melasma: 'Melasma is stubborn: a dermatologist can offer stronger treatments and check what triggers yours.',
}

const STRONG = {
  Cystic: 'Deep, painful cysts can leave scars. A dermatologist can prescribe treatments that skincare products can\'t.',
  Psoriasis: 'Psoriasis is a medical condition that needs a doctor\'s care. Skincare can only soothe it.',
}

const severeDays = (entries, key) => {
  const since = Date.now() - 14 * 86400000
  const days = new Set(
    entries
      .filter(e => e?.date && new Date(e.date).getTime() >= since && Number(e[key]) >= 8)
      .map(e => new Date(e.date).toDateString())
  )
  return days.size
}

export const dermatologistAdvice = (profile, entries = []) => {
  if (!profile) return null
  const conditions = profile.skin_conditions || []
  const acne = profile.acne_types || []
  const strong = []
  const soft = []

  if (acne.includes('Cystic')) strong.push(STRONG.Cystic)
  if (conditions.includes('Psoriasis')) strong.push(STRONG.Psoriasis)
  if (severeDays(entries, 'acne_level') >= 3) strong.push('Your journal shows severe breakouts on several days lately. It\'s worth getting them checked.')
  if (severeDays(entries, 'redness_level') >= 3) strong.push('Your journal shows strong redness on several days lately. A dermatologist can find out what\'s behind it.')

  for (const [name, text] of Object.entries(MEDICAL_CONDITIONS)) if (conditions.includes(name)) soft.push(text)
  if (acne.includes('Hormonal')) soft.push('Hormonal acne often responds to treatments only a doctor can prescribe.')

  if (strong.length) return { level: 'recommended', reasons: [...strong, ...soft] }
  if (soft.length) return { level: 'consider', reasons: soft }
  return null
}
