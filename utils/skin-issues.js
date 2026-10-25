// Her skin issues, picked on photos (Lita, 2026-10-25): at sign-up, in My Skyn
// Profile and from the journal. Four zones (face, eyes, lips, neck), as many as
// she likes. Each photo is an issue sheet (utils/encyclopedia/conditions.js)
// and says what it means for the engine:
//   concern   → skin_concerns (the main and second concern pick from these)
//   acne      → acne_types
//   suspected → a condition only a doctor can confirm (health consent needed),
//               read as a precaution like the old "mystery signs"
//   doctor    → we also suggest seeing a doctor
// Eye and lip concerns only judge eye and lip products; the neck uses the
// face's products, so its issues count as face concerns.

export const ZONES = [
  { id: 'face', label: 'Face' },
  { id: 'eyes', label: 'Eyes' },
  { id: 'lips', label: 'Lips' },
  { id: 'neck', label: 'Neck' },
]

const I = (id, zone, label, effect = {}) => ({ id, zone, label, ...effect })

export const ISSUES = [
  // Face
  I('comedonal-acne', 'face', 'Blackheads and whiteheads', { concern: 'Acne', acne: 'Comedonal' }),
  I('inflammatory-acne', 'face', 'Red, inflamed spots', { concern: 'Acne', acne: 'Inflammatory' }),
  I('cystic-acne', 'face', 'Deep, painful cysts', { concern: 'Acne', acne: 'Cystic', doctor: true }),
  I('hormonal-acne', 'face', 'Hormonal breakouts', { concern: 'Acne', acne: 'Hormonal' }),
  I('fungal-acne', 'face', 'Fungal acne', { suspected: 'Fungal' }),
  I('oily-skin', 'face', 'Oily skin', { concern: 'Oily' }),
  I('enlarged-pores', 'face', 'Large pores', { concern: 'Large pores' }),
  I('sebaceous-filaments', 'face', 'Sebaceous filaments', { concern: 'Large pores' }),
  I('dry-skin', 'face', 'Dry skin', { concern: 'Dryness' }),
  I('dehydrated-skin', 'face', 'Dehydrated skin', { concern: 'Dehydration' }),
  I('dullness', 'face', 'Dull skin', { concern: 'Dullness' }),
  I('uneven-texture', 'face', 'Uneven texture', { concern: 'Dullness' }),
  I('pih', 'face', 'Marks after spots', { concern: 'Dark spots' }),
  I('sun-spots', 'face', 'Sun spots', { concern: 'Dark spots' }),
  I('sun-damage', 'face', 'Sun damage', { concern: 'Dark spots' }),
  I('post-acne-redness', 'face', 'Red marks after spots', { concern: 'Redness' }),
  I('visible-vessels', 'face', 'Visible red lines', { concern: 'Redness' }),
  I('sensitive-skin', 'face', 'Sensitive skin', { concern: 'Sensitivity' }),
  I('fine-lines', 'face', 'Fine lines', { concern: 'Fine lines' }),
  I('deep-wrinkles', 'face', 'Wrinkles', { concern: 'Fine lines' }),
  I('sagging', 'face', 'Sagging', { concern: 'Fine lines' }),
  I('volume-loss', 'face', 'Volume loss', { concern: 'Fine lines' }),
  I('acne-scars', 'face', 'Acne scars', { doctor: true }),
  I('raised-scars', 'face', 'Raised scars', { doctor: true }),
  I('sebaceous-hyperplasia', 'face', 'Small yellowish bumps', { doctor: true }),
  // Face, health: only with the health consent
  I('rosacea', 'face', 'Rosacea', { suspected: 'Rosacea' }),
  I('melasma', 'face', 'Melasma', { suspected: 'Melasma', concern: 'Dark spots' }),
  I('perioral-dermatitis', 'face', 'Perioral dermatitis', { suspected: 'Perioral dermatitis' }),
  I('seborrheic-dermatitis', 'face', 'Seborrheic dermatitis', { suspected: 'Seborrheic dermatitis' }),
  I('eczema', 'face', 'Eczema', { suspected: 'Eczema', concern: 'Dryness' }),
  I('facial-psoriasis', 'face', 'Psoriasis', { suspected: 'Psoriasis' }),
  I('contact-dermatitis', 'face', 'Reactions to products', { concern: 'Sensitivity', doctor: true, health: true }),
  // Eyes
  I('dark-circles', 'eyes', 'Dark circles', { concern: 'Dark circles' }),
  I('puffy-eyes', 'eyes', 'Puffy eyes', { concern: 'Puffy eyes' }),
  I('milia', 'eyes', 'Milia (tiny white bumps)', { concern: 'Milia' }),
  // Lips
  I('chapped-lips', 'lips', 'Dry, chapped lips', { concern: 'Chapped lips' }),
  I('angular-cheilitis', 'lips', 'Cracked lip corners', { concern: 'Cracked lip corners', doctor: true }),
  // Neck: no photos yet (Lita will send them); an icon meanwhile.
  I('neck-lines', 'neck', 'Neck lines', { concern: 'Fine lines', icon: 'reorder-three-outline' }),
  I('neck-sagging', 'neck', 'Sagging neck', { concern: 'Fine lines', icon: 'trending-down-outline' }),
  I('neck-dry', 'neck', 'Dry neck', { concern: 'Dryness', icon: 'water-outline' }),
  I('neck-dark', 'neck', 'Dark patches on the neck', { concern: 'Dark spots', doctor: true, icon: 'ellipse-outline' }),
]

const byId = Object.fromEntries(ISSUES.map(i => [i.id, i]))
export const getIssue = id => byId[id]
// Conditions a doctor confirms are health data: shown only with the consent.
export const isHealthIssue = issue => !!issue.suspected || !!issue.health
export const issuesFor = ({ zone, health }) => ISSUES.filter(i => i.zone === zone && (health || !isHealthIssue(i)))

// The concerns only eye or lip products care about.
export const ZONE_CONCERNS = {
  eyes: ['Dark circles', 'Puffy eyes', 'Milia', 'Fine lines'],
  lips: ['Chapped lips', 'Cracked lip corners'],
}
export const EYE_LIP_ONLY = ['Dark circles', 'Puffy eyes', 'Milia', 'Chapped lips', 'Cracked lip corners']

// Picked issues → what the profile and the engine read.
export const fromIssues = (ids = [], { health = true } = {}) => {
  const list = ids.map(getIssue).filter(Boolean).filter(i => health || !isHealthIssue(i))
  const uniq = arr => [...new Set(arr.filter(Boolean))]
  return {
    concerns: uniq(list.map(i => i.concern)),
    acneTypes: uniq(list.map(i => i.acne)),
    suspected: uniq(list.map(i => i.suspected)),
    doctor: list.filter(i => i.doctor),
  }
}
