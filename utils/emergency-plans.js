// Emergency mode: 7-day plans for when skin needs a reset or a boost.
// While a plan runs, some products are paused in the routine (`pause` lists
// what to set aside: retinoids, acids/exfoliants, vitamin C, fragrance, or the
// newest product for a reaction).

export const SITUATIONS = [
  {
    id: 'breakout', label: 'Breakout / Acne', icon: 'ellipse-outline', title: 'Clear & calm',
    intro: 'Calm the breakout without drying out your skin, and give spots time to heal.',
    pause: ['scrub', 'mask'],
    days: [
      { icon: 'hand-left-outline', title: 'Hands off', focus: "Don't pick or squeeze: it spreads bacteria and leaves marks. A hydrocolloid patch on any whitehead tonight.", avoid: 'Scrubs and harsh cleansers.' , needs: ['patch'] },
      { icon: 'water-outline', title: 'Gentle cleanse', focus: 'Cleanse twice with a gentle, non-foaming cleanser. Keep your moisturizer: dry skin makes more oil.', avoid: 'Rich oils on the face.' , needs: ['gentleCleanser'] },
      { icon: 'flask-outline', title: 'Target spots', focus: 'Salicylic acid or benzoyl peroxide on spots only, at night.', avoid: 'Layering several strong actives.' , needs: ['spot'] },
      { icon: 'leaf-outline', title: 'Soothe', focus: 'Niacinamide or centella to calm redness around spots.', avoid: 'Touching your face during the day.' , needs: ['soothe'] },
      { icon: 'flask-outline', title: 'Target again', focus: 'Spot treatment tonight if new spots appeared.', avoid: 'Over-treating: less is more.' , needs: ['spot'] },
      { icon: 'shirt-outline', title: 'Clean habits', focus: 'Change your pillowcase, clean your phone screen and makeup brushes.', avoid: 'Sleeping in makeup.' },
      { icon: 'checkmark-done-outline', title: 'Review', focus: 'Look at how your skin changed this week. If deep painful spots keep coming, see a dermatologist.', avoid: 'Jumping to new products straight away.' },
    ],
  },
  {
    id: 'irritation', label: 'Irritation / Redness', icon: 'pulse-outline', title: 'Calm & repair',
    intro: 'Strip your routine back to the basics so your skin can calm down.',
    pause: ['retinoid', 'acid', 'exfoliant', 'vitaminC', 'fragrance'],
    days: [
      { icon: 'snow-outline', title: 'Calm inflammation', focus: 'Only a gentle cleanser, a soothing moisturizer and SPF. A cool compress if it stings.', avoid: 'Retinol, acids, vitamin C and fragrance.' , needs: ['soothe', 'gentleCleanser'] },
      { icon: 'water-outline', title: 'Hydrate', focus: 'Hydrating, fragrance-free products (glycerin, hyaluronic acid).', avoid: 'Hot water on your face.' , needs: ['hydrate'] },
      { icon: 'leaf-outline', title: 'Soothe', focus: 'Centella, panthenol or allantoin to calm redness.', avoid: 'Trying anything new.' , needs: ['soothe'] },
      { icon: 'shield-checkmark-outline', title: 'Protect', focus: 'Mineral SPF (zinc oxide) is gentler on reactive skin.', avoid: 'Long sun exposure.' , needs: ['mineralSpf'] },
      { icon: 'water-outline', title: 'Keep it simple', focus: 'Same basic routine: consistency lets the barrier recover.', avoid: 'Exfoliating.' , needs: ['barrier'] },
      { icon: 'eye-outline', title: 'Check in', focus: 'Note in your journal how the redness has changed.', avoid: 'Bringing all your actives back at once.' },
      { icon: 'star-outline', title: 'Reintroduce slowly', focus: 'If calm, bring back one active product, every other night.', avoid: 'If redness lasts or burns, see a dermatologist.' },
    ],
  },
  {
    id: 'barrier', label: 'Barrier Damage', icon: 'shield-outline', title: 'Barrier repair',
    intro: 'Rebuild your skin barrier with gentle, nourishing care.',
    pause: ['retinoid', 'acid', 'exfoliant', 'vitaminC'],
    days: [
      { icon: 'sunny-outline', title: 'Calm inflammation and hydrate', focus: 'Gentle cleanser, moisturizer with ceramides, SPF. Nothing else.', avoid: 'Retinol, acids, scrubs.' , needs: ['gentleCleanser', 'barrier'] },
      { icon: 'cloud-outline', title: 'Repair and strengthen', focus: 'Ceramides, cholesterol and fatty acids help rebuild the barrier.', avoid: 'Foaming cleansers that leave skin tight.' , needs: ['barrier'] },
      { icon: 'water-outline', title: 'Nourish and lock in moisture', focus: 'Layer a hydrating serum under your moisturizer, while skin is still damp.', avoid: 'Hot showers on your face.' , needs: ['hydrate'] },
      { icon: 'leaf-outline', title: 'Support and rebalance', focus: 'Panthenol or centella to support healing.', avoid: 'New products.' , needs: ['soothe'] },
      { icon: 'shield-checkmark-outline', title: 'Rebuild and reinforce', focus: 'A richer moisturizer at night (an occlusive like petrolatum works well).', avoid: 'Exfoliating.' , needs: ['occlusive'] },
      { icon: 'shield-outline', title: 'Hydrate and protect', focus: 'Generous SPF every morning, even indoors near windows.', avoid: 'Skipping moisturizer.' , needs: ['mineralSpf'] },
      { icon: 'star-outline', title: 'Maintain and glow', focus: 'Keep the simple routine a few more days before bringing actives back slowly.', avoid: 'Restarting everything at once.' },
    ],
  },
  {
    id: 'peeling', label: 'Skin Peeling / Flaking', icon: 'sunny-outline', title: 'Soothe & restore',
    intro: 'Stop the flaking by pausing what dries your skin and adding moisture.',
    pause: ['retinoid', 'acid', 'exfoliant'],
    days: [
      { icon: 'pause-outline', title: 'Pause the actives', focus: 'Retinol and acids are the usual culprits: pause them this week.', avoid: 'Picking or scrubbing flakes off.' },
      { icon: 'water-outline', title: 'Hydrate', focus: 'Hydrating serum on damp skin, then moisturizer.', avoid: 'Alcohol-based toners.' , needs: ['hydrate'] },
      { icon: 'layers-outline', title: 'Seal it in', focus: 'A thin layer of an occlusive balm on dry patches at night.', avoid: 'Hot water.' , needs: ['occlusive'] },
      { icon: 'leaf-outline', title: 'Soothe', focus: 'Panthenol or urea-based creams soften rough patches.', avoid: 'Exfoliating.' , needs: ['soothe'] },
      { icon: 'shield-checkmark-outline', title: 'Protect', focus: 'SPF every morning: peeling skin burns more easily.', avoid: 'Long sun exposure.' , needs: ['mineralSpf'] },
      { icon: 'eye-outline', title: 'Check in', focus: 'Note in your journal if the flaking has calmed.', avoid: 'New products.' },
      { icon: 'star-outline', title: 'Restart slowly', focus: 'Bring back your retinol twice a week, with moisturizer before it (the "sandwich" method).', avoid: 'Using it every night straight away.' },
    ],
  },
  {
    id: 'reaction', label: 'Reaction to a Product', icon: 'alert-circle-outline', title: 'Reset after a reaction',
    intro: 'Stop the product that may have caused it and let your skin settle.',
    urgent: 'If your face, lips or eyes swell, hives spread or you have trouble breathing, get medical help right away.',
    pause: ['newest', 'retinoid', 'acid', 'exfoliant', 'vitaminC', 'fragrance'],
    days: [
      { icon: 'close-circle-outline', title: 'Stop it', focus: 'Stop the product you suspect. Rinse with cool water, then a plain, gentle moisturizer.', avoid: 'Trying to cover it with makeup.' , needs: ['gentleCleanser', 'barrier'] },
      { icon: 'snow-outline', title: 'Cool and calm', focus: 'Cool compresses a few times a day.', avoid: 'Every active and anything fragranced.' , needs: ['soothe'] },
      { icon: 'water-outline', title: 'Bare minimum', focus: 'Gentle cleanser and a fragrance-free moisturizer only.', avoid: 'New products.' , needs: ['gentleCleanser', 'barrier'] },
      { icon: 'leaf-outline', title: 'Soothe', focus: 'Panthenol or centella can help calm the area.', avoid: 'Scratching.' , needs: ['soothe'] },
      { icon: 'eye-outline', title: 'Check in', focus: 'Note in your journal how it looks. Still red or itchy? See a doctor.', avoid: 'Retrying the suspected product.' },
      { icon: 'search-outline', title: 'Find the culprit', focus: 'Check the product page in Skynkod to see which ingredient may be behind it.', avoid: 'Products with the same ingredient.' },
      { icon: 'star-outline', title: 'Restart gently', focus: 'Bring your other products back one at a time, a few days apart.', avoid: 'Reintroducing everything together.' },
    ],
  },
  {
    id: 'event', label: 'Wedding / Event (3–7 days)', icon: 'diamond-outline', title: 'Glow for your event',
    intro: 'Calm, hydrated, glowing skin for the big day, with no risky surprises.',
    pause: ['newest'],
    days: [
      { icon: 'water-outline', title: 'Hydrate', focus: 'Drink water, hydrating serum morning and night.', avoid: 'Any new product this week.' , needs: ['hydrate'] },
      { icon: 'sparkles-outline', title: 'Gentle exfoliation', focus: 'Only if your skin is used to it: one gentle exfoliation tonight.', avoid: 'Strong peels or scrubs.' , needs: ['gentleExfoliant'] },
      { icon: 'happy-outline', title: 'Mask night', focus: 'A hydrating mask (sheet or sleeping mask).', avoid: 'Clay masks if your skin is dry.' , needs: ['hydratingMask'] },
      { icon: 'leaf-outline', title: 'Calm', focus: 'Soothing products, early night.', avoid: 'Retinol from now on, so skin stays calm.' , needs: ['soothe'] },
      { icon: 'water-outline', title: 'Hydrate again', focus: 'Hydrating serum, rich moisturizer at night.', avoid: 'Salty food and alcohol.' , needs: ['hydrate'] },
      { icon: 'moon-outline', title: 'Rest', focus: 'Light routine, a good night\'s sleep.', avoid: 'Exfoliating.' },
      { icon: 'star-outline', title: 'Event day', focus: 'Gentle cleanse, hydrating serum, moisturizer, SPF, then makeup. Enjoy!', avoid: 'Trying anything new today.' , needs: ['hydrate', 'spf'] },
    ],
  },
  {
    id: 'travel', label: 'Travel / Change of Climate', icon: 'airplane-outline', title: 'Travel & new climate',
    intro: 'Help your skin adapt to new air, water and sun.',
    pause: ['retinoid'],
    days: [
      { icon: 'airplane-outline', title: 'Travel day', focus: 'Hydrating mist or serum and a moisturizer on the plane. Cleanse when you land.', avoid: 'Makeup on long flights.' , needs: ['hydrate'] },
      { icon: 'water-outline', title: 'Hydrate', focus: 'New air dries skin: hydrating serum morning and night.', avoid: 'Retinol for the first days.' , needs: ['hydrate'] },
      { icon: 'sunny-outline', title: 'Protect', focus: 'More sun than usual? Reapply SPF every 2 hours outside.', avoid: 'Skipping SPF on cloudy days.' , needs: ['mineralSpf'] },
      { icon: 'leaf-outline', title: 'Adjust', focus: 'Humid: lighter gel textures. Dry or cold: richer cream.', avoid: 'Heavy layers in humid heat.' , needs: ['barrier'] },
      { icon: 'water-outline', title: 'Keep it simple', focus: 'Cleanser, moisturizer, SPF: the basics travel best.', avoid: 'New products bought on the trip.' , needs: ['barrier'] },
      { icon: 'eye-outline', title: 'Check in', focus: 'Note in your journal how your skin is reacting.', avoid: 'Over-exfoliating to fix dullness.' },
      { icon: 'star-outline', title: 'Back to routine', focus: 'Bring retinol back, every other night at first.', avoid: 'Doing everything at once.' },
    ],
  },
]

// What a day's product suggestions look for: guide ingredient ids and,
// optionally, product categories. See the Suggestions screen.
export const NEEDS = {
  patch: { label: 'Pimple patches', ids: ['hydrocolloid'], categories: ['mask', 'other'] },
  gentleCleanser: { label: 'A gentle cleanser', ids: ['ceramides', 'glycerin', 'panthenol', 'centella'], categories: ['cleanser'] },
  spot: { label: 'Spot treatment', ids: ['salicylic', 'benzoyl', 'azelaic', 'sulfur'], categories: ['serum', 'exfoliant', 'other'] },
  soothe: { label: 'Something soothing', ids: ['centella', 'panthenol', 'allantoin', 'betaglucan', 'bisabolol', 'oat'], categories: ['serum', 'moisturizer', 'toner'] },
  hydrate: { label: 'Hydration', ids: ['hyaluronic', 'polyglutamic', 'glycerin'], categories: ['serum', 'toner', 'moisturizer'] },
  barrier: { label: 'Barrier repair', ids: ['ceramides', 'cholesterol', 'panthenol'], categories: ['moisturizer'] },
  occlusive: { label: 'A rich balm for the night', ids: ['petrolatum', 'shea', 'ceramides'], categories: ['moisturizer', 'other'] },
  mineralSpf: { label: 'Gentle mineral SPF', ids: ['zincoxide', 'titanium'], categories: ['sunscreen'] },
  spf: { label: 'Sunscreen', ids: ['zincoxide', 'titanium', 'chemicalspf'], categories: ['sunscreen'] },
  gentleExfoliant: { label: 'A gentle exfoliant', ids: ['pha', 'lactic', 'mandelic'], categories: ['exfoliant', 'toner', 'serum'] },
  hydratingMask: { label: 'A hydrating mask', ids: ['hyaluronic', 'glycerin', 'panthenol'], categories: ['mask'] },
}

export const getSituation = id => SITUATIONS.find(s => s.id === id) || null
