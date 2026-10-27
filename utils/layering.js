// Layering guide (Premium): the order to apply her own products, how much, how,
// and which evenings each active goes on. Deterministic rules only, each with
// its source (Lita, 2026-10-19): no myths, no invented precision such as "wait
// 20 minutes after vitamin C". Koda may explain these rules, never make new ones.
// The clash warnings in routine-checks.js stay free: they are safety.
// Every rule is listed in docs/layering-rules.md for the dermatologist review.

import { activesOf, daysOf, describeDays, EVERY_DAY } from './routine-checks'

export const SOURCES = {
  aadOrder: { label: 'American Academy of Dermatology, "How to get the most from skin care products"', url: 'https://www.aad.org/public/skin-hair-nails/skin-care/skin-care-products' },
  aadSunscreen: { label: 'American Academy of Dermatology, "How to apply sunscreen"', url: 'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-apply-sunscreen' },
  aadRetinoid: { label: 'American Academy of Dermatology patient education, "How to use topical retinoids"', url: 'https://www.alabamaderm.com/articles/aad_education_library/920179-how-to-use-topical-retinoids' },
  clevelandOrder: { label: 'Cleveland Clinic, "The proper order to apply skin care products"', url: 'https://health.clevelandclinic.org/proper-skin-care-product-order' },
  vitC: { label: 'Al-Niaimi F, Chiang NYZ. Topical vitamin C and the skin. J Clin Aesthet Dermatol 2017;10(7):14-17', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5605218/' },
}

// Each rule: what it says, and where it comes from.
export const RULES = [
  { id: 'cleanse-first', text: 'Cleanse first, then apply treatments right after cleansing.', sources: ['aadOrder'] },
  { id: 'thin-to-thick', text: 'Apply products from the thinnest to the thickest, so the light ones can reach the skin.', sources: ['clevelandOrder'] },
  { id: 'eye-ring-finger', text: 'Around the eyes, use your ring finger: it pulls least on the thin skin there. Eye cream goes after serums, before moisturizer.', sources: ['aadOrder', 'clevelandOrder'] },
  { id: 'oil-before-moisturizer', text: 'A face oil goes right before the moisturizer.', sources: ['clevelandOrder'] },
  { id: 'moisturizer-then-spf', text: 'Moisturizer and sunscreen come after treatments; sunscreen is the last skincare step in the morning.', sources: ['aadOrder', 'clevelandOrder'] },
  { id: 'spf-amount', text: 'For the face, use at least 1 teaspoon of sunscreen (about the length of your index and middle fingers), about 15 minutes before going out, and reapply every 2 hours outdoors.', sources: ['aadSunscreen'] },
  { id: 'retinoid-night', text: 'Retinoids go on at night only: sunlight can deactivate them.', sources: ['clevelandOrder', 'aadRetinoid'] },
  { id: 'retinoid-pea', text: 'A pea-sized amount of retinoid is enough for the whole face, on fully dry skin, with moisturizer on top. Start every 2nd or 3rd night and increase only as your skin tolerates it.', sources: ['aadRetinoid'] },
  { id: 'vitc-morning', text: 'Vitamin C works best in the morning, before sunscreen: it reinforces your sunscreen, it doesn’t replace it.', sources: ['clevelandOrder', 'vitC'] },
  { id: 'no-acid-with-vitc', text: 'Don’t use vitamin C together with exfoliating acids (AHA): use them at different times.', sources: ['clevelandOrder'] },
  { id: 'spot-after-cleanse', text: 'Acne treatments (benzoyl peroxide, salicylic acid) go on right after cleansing, in a thin layer on the whole area where you break out; wear sunscreen as they can make skin more sun-sensitive.', sources: ['clevelandOrder'] },
  { id: 'neck-too', text: 'Your neck ages like your face: bring your cleanser, serums, moisturizer and sunscreen down to it. With retinol, start on the neck once your face tolerates it well.', sources: ['aadOrder'] },
  { id: 'lips-spf', text: 'Lips burn too: in the sun, use a lip balm with SPF and reapply it often.', sources: ['aadSunscreen'] },
  { id: 'not-too-many', text: 'Too many anti-aging products at once can irritate the skin: one strong active per evening is plenty.', sources: ['aadOrder'] },
]
export const ruleOf = id => RULES.find(r => r.id === id)

// Where a product sits, from thinnest to thickest (lower first).
const RANK = { cleanser: 0, spot: 5, exfoliant: 10, toner: 20, essence: 25, serum: 30, eye: 50, oil: 55, moisturizer: 60, mask: 70, sunscreen: 90, lipscrub: 92, lips: 95, lipmask: 97 }

const isOilBased = (product) => {
  const first = (product?.ingredients || []).slice(0, 2).join(' ')
  return /\boil\b/.test(first) && !/\b(water|aqua|eau)\b/.test(first)
}

// What kind of layer a product is, from its category, name and real ingredients.
export const layerOf = (product) => {
  const name = `${product?.name || ''}`.toLowerCase()
  const cat = product?.category || ''
  const a = activesOf(product)
  if (cat === 'cleanser') return 'cleanser'
  if (cat === 'sunscreen' || a.spf) return 'sunscreen'
  if (cat === 'eye care') return 'eye'
  if (cat === 'lip care') return /scrub|exfoli|gommage/.test(name) ? 'lipscrub' : /mask|masque|sleeping|overnight/.test(name) ? 'lipmask' : 'lips'
  if (cat === 'mask') return /sleeping|overnight|wrapping/.test(name) ? 'sleeping mask' : 'mask'
  if (/\bspot\b|patch/.test(name)) return 'spot'
  if (cat === 'exfoliant') return /pad|toner|liquid|lotion|solution/.test(name) ? 'exfoliant' : 'mask'
  if (cat === 'toner') return /essence|ampoule/.test(name) ? 'essence' : 'toner'
  if (cat === 'serum') return isOilBased(product) || /\boil\b/.test(name) ? 'oil' : 'serum'
  if (cat === 'moisturizer') return isOilBased(product) || /\b(face oil|facial oil)\b/.test(name) ? 'oil' : 'moisturizer'
  return 'serum'
}

const rankOf = (layer) => (layer === 'sleeping mask' ? 65 : RANK[layer] ?? 40)

// How much and how, only where a source gives it; otherwise kept plain.
const howTo = (layer, a, period) => {
  if (layer === 'eye' && a.retinoid) return { amount: 'A tiny amount for both eyes', how: 'At night only, on the eye bone, not on the eyelids. Your peptide eye cream on the other nights.', rule: 'retinoid-night' }
  if (layer === 'lipscrub') return { amount: 'A small amount', how: 'Massage gently on dry lips, once or twice a week, then rinse and apply your balm.', rule: null }
  if (layer === 'lipmask') return { amount: 'A thick layer', how: 'Last step of the night, once or twice a week, and leave it on until morning.', rule: null }
  if (layer === 'lips') return period === 'morning'
    ? { amount: 'A generous layer', how: 'Last step of the morning; reapply often when you are outside, especially an SPF balm.', rule: 'lips-spf' }
    : { amount: 'A generous layer', how: 'Last step of the night, after your moisturizer.', rule: null }
  if (a.retinoid) return { amount: 'A pea-sized amount for the whole face', how: 'On fully dry skin, avoiding the corners of the eyes, nose and mouth.', rule: 'retinoid-pea' }
  if (layer === 'sunscreen') return { amount: 'At least 1 teaspoon for the face (two finger lengths)', how: 'Last step. Spread evenly, including ears and neck, about 15 minutes before going out.', rule: 'spf-amount' }
  if (layer === 'eye') return { amount: 'A small amount for both eyes', how: 'Tap gently with your ring finger around the eye bone.', rule: 'eye-ring-finger' }
  if (layer === 'spot') return { amount: 'Only on the spots', how: 'Right after cleansing, on dry skin.', rule: 'spot-after-cleanse' }
  if (layer === 'cleanser') return { amount: 'Enough for your face and neck', how: 'Massage gently, rinse with lukewarm water and pat dry.', rule: 'cleanse-first' }
  if (layer === 'oil') return { amount: 'A few drops', how: 'Press into the skin, right before your moisturizer.', rule: 'oil-before-moisturizer' }
  if (layer === 'moisturizer') return { amount: 'A thin, even layer on face and neck', how: period === 'morning' ? 'After your serums, before sunscreen.' : 'After your treatments, to finish.', rule: 'moisturizer-then-spf' }
  if (layer === 'mask') return { amount: 'A thin layer', how: 'After cleansing, as the label says, then rinse and continue your routine.', rule: null }
  if (layer === 'sleeping mask') return { amount: 'A thin layer', how: 'Last step of the evening, instead of or over your moisturizer.', rule: null }
  return { amount: 'A thin layer on face and neck', how: 'Pat it in and let it absorb before the next step.', rule: 'neck-too' }
}

// The guide for one routine (morning or evening): her products in order, each
// with how much and how, plus notes and, for the evening, which nights hold
// which active.
export const layerRoutine = ({ period, steps = [], productsById = {} }) => {
  const items = steps
    .map((step, index) => ({ step, index, product: productsById[step.product_id] }))
    .filter(i => i.product)
    .map(i => {
      const a = activesOf(i.product)
      const layer = layerOf(i.product)
      return { ...i, a, layer, rank: rankOf(layer) + (a.retinoid ? 5 : 0) }
    })
    // Thinnest to thickest; equal ranks keep the order she chose.
    .sort((x, y) => x.rank - y.rank || x.index - y.index)

  const notes = []
  const ordered = items.map((i, pos) => {
    const h = howTo(i.layer, i.a, period)
    const isLast = pos === items.length - 1
    return {
      stepIndex: i.index,
      product: i.product,
      layer: i.layer,
      days: daysOf(i.step),
      daysLabel: describeDays(i.step.days),
      amount: h.amount,
      how: h.how,
      rule: h.rule,
      // Between layers: let it absorb; no invented number of minutes.
      then: isLast ? null : i.layer === 'cleanser' ? 'Pat dry before the next step.' : 'Let it absorb before the next layer.',
      actives: Object.entries(i.a).filter(([, v]) => v).map(([k]) => k),
    }
  })

  const has = k => items.some(i => i.a[k])
  if (period === 'morning' && has('retinoid')) notes.push({ level: 'warning', text: 'Move your retinoid to the evening: sunlight can deactivate it.', rule: 'retinoid-night' })
  if (period === 'morning' && !has('spf')) notes.push({ level: 'warning', text: 'Finish with a sunscreen every morning.', rule: 'moisturizer-then-spf' })
  if (period === 'evening' && has('vitaminC')) notes.push({ level: 'info', text: 'Your vitamin C would work better in the morning, before sunscreen.', rule: 'vitc-morning' })
  if (items.some(i => i.a.vitaminC) && items.some(i => i.a.acid && !i.a.retinoid)) {
    const vit = items.find(i => i.a.vitaminC)
    const acid = items.find(i => i.a.acid && !i.a.retinoid)
    if (daysOf(vit.step).some(d => daysOf(acid.step).includes(d))) notes.push({ level: 'info', text: `Use ${vit.product.name} and ${acid.product.name} at different times.`, rule: 'no-acid-with-vitc' })
  }

  // Evenings: which active goes on which night, so there is one strong active per night.
  let nights = null
  if (period === 'evening') {
    // The face's strong actives only: eye and lip products sit on their own area.
    const strong = items.filter(i => (i.a.retinoid || i.a.exfoliant) && !['eye', 'lips', 'lipscrub', 'lipmask'].includes(i.layer))
    if (strong.length) {
      nights = EVERY_DAY.map(day => {
        const on = strong.filter(i => daysOf(i.step).includes(day))
        return { day, actives: on.map(i => ({ name: i.product.name, kind: i.a.retinoid ? 'retinoid' : 'exfoliant' })) }
      })
      if (nights.some(n => n.actives.length > 1)) notes.push({ level: 'warning', text: 'Some evenings have two strong actives: keep one per evening.', rule: 'not-too-many' })
    }
  }

  return { steps: ordered, notes, nights, rules: [...new Set([...ordered.map(o => o.rule), ...notes.map(n => n.rule)].filter(Boolean))].map(ruleOf) }
}

