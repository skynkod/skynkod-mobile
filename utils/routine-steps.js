// Routine steps the builder offers. `category` matches products.category.

export const STEP_TYPES = {
  // First step of the evening, before the cleanser (Lita, 2026-10-25): makeup and sunscreen off.
  remover: { label: 'Makeup remover', title: 'Your makeup remover', why: 'Melts makeup and sunscreen first, so your cleanser can clean the skin itself. A micellar water, a cleansing oil or a balm.', category: ['cleanser'], icon: 'color-wand-outline' },
  cleanser: { label: 'Cleanser', title: 'Your cleanser', why: 'Removes dirt, oil and sunscreen from your face and neck without stripping your skin.', category: ['cleanser'], icon: 'water-outline' },
  exfoliant: { label: 'Exfoliant', title: 'Your exfoliant', why: 'Smooths texture and unclogs pores, 2–3 nights a week.', category: ['exfoliant'], icon: 'refresh-outline' },
  toner: { label: 'Toner', title: 'Your toner', why: 'Rebalances and preps your skin for the next steps.', category: ['toner'], icon: 'flask-outline' },
  serum: { label: 'Serum', title: 'Your serum', why: 'Concentrated care for your main skin concern, on your face and neck.', category: ['serum'], icon: 'eyedrop-outline' },
  treatment: { label: 'Treatment', title: 'Your night treatment', why: 'A targeted active like retinol or an acid, best used at night.', category: ['serum', 'exfoliant'], icon: 'moon-outline' },
  // Essential morning and evening (Lita, 2026-10-24): the thin skin around the
  // eyes shows lines first. Peptides every day, a retinoid 2–3 nights a week.
  eye: { label: 'Eye care', title: 'Your eye care', why: 'The skin around your eyes is the thinnest of your face and shows lines first. Peptides every day: Argireline softens expression lines, Matrixyl and copper peptides help the skin look firmer. At night, retinol or retinal 2–3 times a week, and your peptides the other nights.', category: ['eye care'], icon: 'eye-outline' },
  moisturizer: { label: 'Moisturizer', title: 'Your moisturizer', why: 'Locks in hydration and protects your skin barrier. Bring it down to your neck too.', category: ['moisturizer'], icon: 'leaf-outline' },
  lips: { label: 'Lips', title: 'Your lip care', why: 'Lips have no oil glands and burn easily. In the morning a balm with SPF, at night a nourishing balm.', category: ['lip care'], icon: 'happy-outline' },
  lipscrub: { label: 'Lip scrub', title: 'Your lip scrub', why: 'Gently removes dry flakes, once or twice a week, before your balm.', category: ['lip care'], icon: 'refresh-outline' },
  lipmask: { label: 'Lip mask', title: 'Your lip mask', why: 'A thick layer overnight, once or twice a week, for soft, plump lips in the morning.', category: ['lip care'], icon: 'moon-outline' },
  mask: { label: 'Mask', title: 'Your mask', why: 'An extra boost once or twice a week.', category: ['mask'], icon: 'happy-outline' },
  sunscreen: { label: 'SPF', title: 'Your sunscreen', why: 'The most important anti-aging step. Every morning, even when it rains: face, neck and ears.', category: ['sunscreen'], icon: 'sunny-outline' },
}

// Order steps are applied in.
export const STEP_ORDER = ['remover', 'cleanser', 'exfoliant', 'toner', 'serum', 'treatment', 'eye', 'moisturizer', 'mask', 'sunscreen', 'lipscrub', 'lips', 'lipmask']

export const ESSENTIALS = {
  morning: ['cleanser', 'eye', 'moisturizer', 'sunscreen', 'lips'],
  evening: ['cleanser', 'treatment', 'eye', 'moisturizer', 'lips'],
}

export const OPTIONAL = {
  morning: ['toner', 'serum'],
  evening: ['remover', 'exfoliant', 'toner', 'serum', 'mask', 'lipscrub', 'lipmask'],
}

export const sortSteps = keys => [...keys].sort((a, b) => STEP_ORDER.indexOf(a) - STEP_ORDER.indexOf(b))
