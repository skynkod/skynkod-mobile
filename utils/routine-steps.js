// Routine steps the builder offers. `category` matches products.category.

export const STEP_TYPES = {
  cleanser: { label: 'Cleanser', title: 'Your cleanser', why: 'Removes dirt, oil and sunscreen without stripping your skin.', category: ['cleanser'], icon: 'water-outline' },
  exfoliant: { label: 'Exfoliant', title: 'Your exfoliant', why: 'Smooths texture and unclogs pores, 2–3 nights a week.', category: ['exfoliant'], icon: 'sparkles-outline' },
  toner: { label: 'Toner', title: 'Your toner', why: 'Rebalances and preps your skin for the next steps.', category: ['toner'], icon: 'flask-outline' },
  serum: { label: 'Serum', title: 'Your serum', why: 'Concentrated care for your main skin concern.', category: ['serum'], icon: 'eyedrop-outline' },
  treatment: { label: 'Treatment', title: 'Your night treatment', why: 'A targeted active like retinol or an acid, best used at night.', category: ['serum', 'exfoliant'], icon: 'moon-outline' },
  eye: { label: 'Eye care', title: 'Your eye care', why: 'Gentle care for the thin skin around your eyes.', category: ['eye care'], icon: 'eye-outline' },
  moisturizer: { label: 'Moisturizer', title: 'Your moisturizer', why: 'Locks in hydration and protects your skin barrier.', category: ['moisturizer'], icon: 'leaf-outline' },
  mask: { label: 'Mask', title: 'Your mask', why: 'An extra boost once or twice a week.', category: ['mask'], icon: 'happy-outline' },
  sunscreen: { label: 'SPF', title: 'Your sunscreen', why: 'The most important anti-aging step. Every morning, even when it rains.', category: ['sunscreen'], icon: 'sunny-outline' },
}

// Order steps are applied in.
export const STEP_ORDER = ['cleanser', 'exfoliant', 'toner', 'serum', 'treatment', 'eye', 'moisturizer', 'mask', 'sunscreen']

export const ESSENTIALS = {
  morning: ['cleanser', 'moisturizer', 'sunscreen'],
  evening: ['cleanser', 'treatment', 'moisturizer'],
}

export const OPTIONAL = {
  morning: ['toner', 'serum', 'eye'],
  evening: ['exfoliant', 'toner', 'serum', 'eye', 'mask'],
}

export const sortSteps = keys => [...keys].sort((a, b) => STEP_ORDER.indexOf(a) - STEP_ORDER.indexOf(b))
