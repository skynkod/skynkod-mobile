// "Seen on TikTok?" (Lita, 2026-10-25): skincare tips people see online, checked.
// Typed in the search bar, free for everyone. The list Lita approved:
// docs/vu-sur-tiktok-liste.md. Never a diagnosis, never a promise on the skin.
// keys: each is a group of words that must all be in what she typed (English
// or French, accents and plurals don't matter). Pure (no app imports).
// note: one line for her skin when it applies, from her profile.

const has = (list, x) => (list || []).includes(x)
const acneProne = p => has(p?.skin_concerns, 'Acne') || (p?.acne_types || []).length > 0
const sensitive = p => has(p?.skin_concerns, 'Sensitivity') || !!p?.fragile
const rosacea = p => has(p?.skin_conditions, 'Rosacea')

export const TRENDS = [
  // Already in the encyclopedia (Myths vs facts).
  { id: 'oily-no-moisturizer', verdict: 'false', title: 'Oily skin doesn’t need a moisturizer', why: 'Without one, the skin can get dehydrated and make even more oil.', instead: 'A light gel or a non-comedogenic fluid.', keys: [['oily', 'moisturizer'], ['grasse', 'creme'], ['grasse', 'hydratant']] },
  { id: 'tingle-works', verdict: 'false', title: 'If it tingles, it works', why: 'Burning or stinging that lasts is irritation.', instead: 'Use the product less often, or pick a gentler one.', keys: [['tingle'], ['picote'], ['pique', 'marche'], ['burn', 'work']] },
  { id: 'toothpaste-spots', verdict: 'false', title: 'Toothpaste on a pimple', why: 'It irritates the skin and can leave a mark.', instead: 'A pimple patch, benzoyl peroxide or salicylic acid.', keys: [['toothpaste'], ['dentifrice']] },
  { id: 'dark-skin-spf', verdict: 'false', title: 'Dark skin doesn’t need sunscreen', why: 'Darker skin marks more easily (dark spots, melasma).', instead: 'Sunscreen every day, all year.', keys: [['dark', 'skin', 'sunscreen'], ['peau', 'foncee', 'solaire'], ['peau', 'noire', 'solaire']] },
  { id: 'natural-safe', verdict: 'false', title: 'Natural means safe', why: 'Essential oils, lemon or cinnamon can irritate or cause allergies.', instead: 'Look at the ingredient, not the “natural” label.', keys: [['natural', 'safe'], ['naturel', 'danger'], ['naturel', 'sans'], ['naturel', 'mieux'], ['natural', 'better'], ['cinnamon'], ['cannelle']] },
  { id: 'lemon-spots', verdict: 'false', title: 'Lemon on dark spots', why: 'With the sun, it can burn and create new spots.', instead: 'Vitamin C, niacinamide or azelaic acid.', keys: [['lemon'], ['citron']] },
  { id: 'pores-open-close', verdict: 'false', title: 'Hot water opens pores, cold water closes them', why: 'Pores don’t open or close.', instead: 'Lukewarm water, and salicylic acid for pores.', keys: [['hot', 'water'], ['cold', 'water'], ['eau', 'chaude'], ['eau', 'froide'], ['open', 'pore'], ['ouvr', 'pore'], ['ferm', 'pore']] },
  { id: 'more-product', verdict: 'false', title: 'More product works better', why: 'More product mostly means more irritation. Sunscreen is the exception: most people use too little.', instead: 'The right amount: a pea of retinol.', keys: [['more', 'product'], ['plus', 'produit'], ['too', 'much']] },
  { id: 'acne-dirty', verdict: 'false', title: 'Acne means dirty skin', why: 'Acne comes from hormones, oil and inflammation.', instead: 'A gentle cleanser twice a day, without scrubbing.', keys: [['dirty'], ['sale'], ['wash', 'more']] },
  { id: 'expensive-better', verdict: 'false', title: 'Expensive products work better', why: 'Price doesn’t tell you if a product works.', instead: 'Compare the ingredients.', keys: [['expensive'], ['cher', 'mieux'], ['prix'], ['luxury', 'better'], ['luxe', 'mieux']] },
  { id: 'sunscreen-winter', verdict: 'false', title: 'No sun, no sunscreen', why: 'UVA rays pass through clouds and windows.', instead: 'Sunscreen every morning, even in winter.', keys: [['winter', 'sunscreen'], ['winter', 'spf'], ['hiver', 'solaire'], ['hiver', 'spf'], ['cloud'], ['nuage'], ['no', 'sun']] },
  { id: 'pop-pimple', verdict: 'false', title: 'Popping a pimple makes it go faster', why: 'It often lasts longer and leaves a mark.', instead: 'A pimple patch, and let it heal.', keys: [['pop', 'pimple'], ['pop', 'spot'], ['perc', 'bouton'], ['eclat', 'bouton'], ['squeez']] },

  // New (Lita's list).
  { id: 'slugging', verdict: 'depends', title: 'Slugging (petroleum jelly at night)', why: 'Good for dry or damaged skin, but it can bother acne-prone skin.', instead: 'Dry skin: yes, as the last layer. Acne-prone skin: only on dry areas.', keys: [['slugging'], ['vaseline'], ['petroleum']], note: p => (acneProne(p) ? 'Your skin gets spots: keep it to the dry areas only.' : null) },
  { id: 'ice', verdict: 'depends', title: 'Ice on the face', why: 'It reduces puffiness a little, only for a while. Ice straight on the skin can hurt it. Not for rosacea.', instead: 'A cold cloth for a few minutes, never bare ice.', keys: [['ice'], ['glacon'], ['glace', 'visage'], ['skin', 'icing']], note: p => (rosacea(p) ? 'With rosacea, skip the cold: it can trigger redness.' : null) },
  { id: 'baking-soda', verdict: 'false', title: 'Baking soda as a scrub', why: 'It’s too alkaline and damages the skin barrier.', instead: 'A gentle exfoliant once or twice a week.', keys: [['baking', 'soda'], ['bicarbonate']] },
  { id: 'retinol-nightly', verdict: 'false', title: 'Retinol every night from day one', why: 'The skin needs time to get used to it, or it turns red and peels.', instead: '2 to 3 nights a week, then more, little by little.', keys: [['retinol', 'every'], ['retinol', 'soir'], ['retinol', 'night'], ['retinol', 'daily'], ['retinol', 'jour']] },
  { id: 'skin-cycling', verdict: 'true', title: 'Skin cycling (actives and rest nights)', why: 'Alternating active nights and rest nights limits irritation.', instead: 'That’s what Rekod does for you.', keys: [['skin', 'cycling'], ['cycling']] },
  { id: 'diy-sunscreen', verdict: 'false', title: 'Homemade sunscreen', why: 'There’s no way to know how much it protects.', instead: 'A tested sunscreen, SPF 30 or more.', keys: [['homemade', 'sunscreen'], ['diy', 'sunscreen'], ['diy', 'spf'], ['solaire', 'maison'], ['spf', 'maison']] },
  { id: 'foundation-spf', verdict: 'false', title: 'Foundation with SPF is enough', why: 'You’d need far too much of it to be protected.', instead: 'A real sunscreen underneath.', keys: [['foundation', 'spf'], ['makeup', 'spf'], ['fond', 'teint', 'spf'], ['maquillage', 'spf']] },
  { id: 'vinegar', verdict: 'false', title: 'Apple cider vinegar as a toner', why: 'Its acidity isn’t controlled and can burn.', instead: 'A toner made for the face.', keys: [['vinegar'], ['vinaigre']] },
  { id: 'coconut', verdict: 'depends', title: 'Coconut oil on the face', why: 'It easily clogs pores on acne-prone skin.', instead: 'For acne-prone skin, squalane instead.', keys: [['coconut'], ['huile', 'coco']], note: p => (acneProne(p) ? 'Your skin gets spots: better avoid it on the face.' : null) },
  { id: 'pimple-patch', verdict: 'true', title: 'Pimple patches', why: 'They protect the pimple and stop you touching it.', instead: 'On a whitehead or an open pimple.', keys: [['pimple', 'patch'], ['patch', 'bouton'], ['hydrocolloid']] },
  { id: 'niacinamide-vitc', verdict: 'false', title: 'Never mix niacinamide and vitamin C', why: 'Today’s formulas work well together.', instead: 'If it stings: vitamin C in the morning, niacinamide at night.', keys: [['niacinamide', 'vitamin'], ['niacinamide', 'vitamine']] },
  { id: 'skin-gets-used', verdict: 'false', title: 'Change products often, the skin “gets used to it”', why: 'A product that suits you keeps working.', instead: 'Keep what works, and change one product at a time.', keys: [['used', 'to'], ['habitu'], ['change', 'often'], ['changer', 'souvent']] },
  { id: 'dermaroller', verdict: 'false', title: 'Dermaroller at home', why: 'Risk of infection and scars.', instead: 'Microneedling with a professional.', keys: [['dermaroller'], ['derma', 'roller'], ['microneedling'], ['micro', 'needling']] },
  { id: 'strong-peel', verdict: 'false', title: 'A strong peel at home', why: 'Risk of burns and dark spots, especially on dark skin.', instead: 'Strong peels at a dermatologist.', keys: [['peel', 'home'], ['peeling', 'maison'], ['tca'], ['chemical', 'peel']] },
  { id: 'water-hydrates', verdict: 'depends', title: 'Drinking more water hydrates the skin', why: 'Drinking enough matters, but drinking more doesn’t replace a cream.', instead: 'Drink when you’re thirsty, and use a moisturizer.', keys: [['drink', 'water'], ['boire', 'eau'], ['water', 'hydrat']] },
  { id: 'sleep-makeup', verdict: 'false', title: 'Sleeping in makeup is fine', why: 'It can clog pores and irritate.', instead: 'Take it off every night, even quickly.', keys: [['sleep', 'makeup'], ['dormir', 'maquill'], ['makeup', 'night']] },
  { id: 'chocolate', verdict: 'depends', title: 'Chocolate gives you spots', why: 'Nothing is proven for chocolate itself. For some people, sugar and dairy may play a part.', instead: 'Note it in your journal: the app spots your own links.', keys: [['chocolate'], ['chocolat'], ['sugar', 'acne'], ['sugar', 'pimple'], ['sucre', 'bouton'], ['dairy'], ['laitier'], ['lait', 'bouton'], ['milk', 'acne']] },
  { id: 'sun-dries-spots', verdict: 'false', title: 'The sun dries out spots', why: 'The effect doesn’t last, and the sun darkens the marks.', instead: 'A non-comedogenic sunscreen.', keys: [['sun', 'spot'], ['sun', 'acne'], ['soleil', 'bouton'], ['soleil', 'acne']] },
  { id: 'aloe-plant', verdict: 'depends', title: 'Aloe vera straight from the plant', why: 'It can soothe, but it can also irritate or cause an allergy.', instead: 'Test it on a small area first, or use a formulated gel.', keys: [['aloe', 'plant'], ['aloe', 'plante'], ['aloe', 'fresh'], ['aloe', 'frais']], note: p => (sensitive(p) ? 'Your skin is sensitive: test it under your jaw first.' : null) },
  { id: 'double-cleanse', verdict: 'depends', title: 'Double cleansing is for everyone', why: 'Useful at night with sunscreen or makeup, not needed otherwise.', instead: 'One cleanser is enough on other days.', keys: [['double', 'cleans'], ['double', 'nettoyage']] },
  { id: 'hyaluronic-dry', verdict: 'depends', title: 'Hyaluronic acid on dry skin', why: 'In very dry air, it doesn’t work well on its own.', instead: 'On damp skin, then a cream on top.', keys: [['hyaluronic', 'dry'], ['hyaluronique', 'sec'], ['hyaluronic', 'dehydrat']] },
  { id: 'shrink-pores', verdict: 'false', title: 'You can make pores disappear', why: 'You can make them less visible, not remove them.', instead: 'Salicylic acid, niacinamide, a retinoid.', keys: [['shrink', 'pore'], ['close', 'pore'], ['remove', 'pore'], ['resserr', 'pore'], ['disparaitre', 'pore'], ['supprim', 'pore']] },
  { id: 'nose-strips', verdict: 'depends', title: 'Nose strips for blackheads', why: 'The effect doesn’t last, and they can irritate.', instead: 'Salicylic acid, regularly.', keys: [['nose', 'strip'], ['pore', 'strip'], ['patch', 'nez'], ['bande', 'nez'], ['patch', 'points', 'noirs']] },
  { id: 'gua-sha', verdict: 'false', title: 'Gua sha and rollers erase wrinkles', why: 'They reduce puffiness a little, with no effect on wrinkles.', instead: 'Sunscreen and a retinoid.', keys: [['gua', 'sha'], ['guasha'], ['jade', 'roller'], ['rouleau'], ['face', 'roller']] },
  { id: 'spf50-all-day', verdict: 'false', title: 'SPF 50 protects you all day', why: 'Protection drops with sweat, water and time.', instead: 'Outdoors, put it on again every 2 hours.', keys: [['spf', 'all', 'day'], ['spf', '50'], ['toute', 'journee'], ['reapply'], ['remettre', 'solaire']] },
  { id: 'oily-no-oil', verdict: 'depends', title: 'Oily skin should never use oil', why: 'Some light oils don’t clog pores.', instead: 'Squalane, in a small amount.', keys: [['oily', 'oil'], ['grasse', 'huile']] },
  { id: 'body-soap', verdict: 'false', title: 'Bar soap on the face', why: 'It’s often too harsh for the face.', instead: 'A gentle face cleanser.', keys: [['bar', 'soap'], ['body', 'soap'], ['soap', 'face'], ['savon']] },
  { id: 'alcohol-aftershave', verdict: 'false', title: 'Alcohol aftershave disinfects', why: 'Alcohol stings, dries and irritates after shaving.', instead: 'A soothing balm without alcohol or fragrance.', keys: [['aftershave'], ['after', 'shave'], ['apres', 'rasage']] },
  { id: 'retinol-summer', verdict: 'depends', title: 'No retinol in summer', why: 'You can keep it at night, with sunscreen every morning.', instead: 'Keep retinol at night, and more sunscreen.', keys: [['retinol', 'summer'], ['retinol', 'ete'], ['retinol', 'sun'], ['retinol', 'soleil']] },
  { id: 'scrub-hard', verdict: 'false', title: 'Scrub hard to get rid of spots or blackheads', why: 'Scrubbing irritates and can make acne worse.', instead: 'A gentle cleanser, then actives (salicylic acid).', keys: [['scrub', 'hard'], ['frott'], ['scrub', 'acne'], ['gommage', 'bouton']] },
]

// Lowercase, no accents, no punctuation.
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ')

// The trend she typed about, or null: every word of a key must start a word she typed.
export const findTrend = (query) => {
  const words = norm(query).split(/\s+/).filter(Boolean)
  if (!words.length) return null
  const fits = key => key.every(k => words.some(w => w.startsWith(k) || (k.length > 5 && w.length >= 5 && k.startsWith(w))))
  let best = null
  for (const trend of TRENDS) {
    const score = Math.max(0, ...trend.keys.filter(fits).map(k => k.length))
    if (score && (!best || score > best.score)) best = { trend, score }
  }
  return best?.trend || null
}

export const trendNote = (trend, profile) => (trend?.note && profile ? trend.note(profile) : null)
