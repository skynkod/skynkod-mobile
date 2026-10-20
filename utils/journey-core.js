// My Skin Journey: badges, XP, levels, streaks and weekly challenges.
// Everything that can be tuned lives in the config at the top. The functions
// below are pure (no storage, no network) so they can be tested on their own.

// ---------- Config ----------

export const XP = {
  profile: 20,          // skin profile completed, once
  firstRoutine: 15,     // first routine saved, once
  product: 5,           // a product added to the collection, once per product
  productDailyCap: 3,   // products rewarded per day at most
  ingredient: 2,        // an ingredient page read for the first time
  routineDay: 5,        // a day with a ticked routine, once per day
  challenge: 20,        // a weekly challenge completed
  badge: { common: 10, rare: 25, epic: 50, legendary: 100 },
}

// The Koda box: a week counts as active with at least this many days with a
// ticked routine or a journal entry.
export const ACTIVE_DAYS = 2

// 15 levels in 5 tiers, spread over about two years of regular use.
export const LEVEL_TIERS = [
  { id: 'curious', name: 'The Curious', levels: [1, 3], description: 'Discover Skynkod and understand your skin.' },
  { id: 'explorer', name: 'The Explorer', levels: [4, 6], description: 'Explore ingredients, products and features.' },
  { id: 'enthusiast', name: 'The Enthusiast', levels: [7, 9], description: 'Build your habits and your consistency.' },
  { id: 'scholar', name: 'The Skin Scholar', levels: [10, 12], description: 'Deepen your knowledge and refine your routine.' },
  { id: 'icon', name: 'The Skynkod Icon', levels: [13, 15], description: 'A rich, inspiring journey and complete mastery.' },
]
export const LEVELS = [
  { level: 1, name: 'The Newcomer', xp: 0, description: 'You take your first steps on Skynkod.' },
  { level: 2, name: 'The Curious', xp: 60, description: 'You discover your skin.' },
  { level: 3, name: 'The Starter', xp: 150, description: 'You lay the foundations.' },
  { level: 4, name: 'The Explorer', xp: 300, description: 'You explore ingredients and products.' },
  { level: 5, name: 'The Learner', xp: 500, description: 'You learn and ask questions.' },
  { level: 6, name: 'The Builder', xp: 750, description: 'You build your routine.' },
  { level: 7, name: 'The Committed', xp: 1050, description: 'You’re becoming consistent.' },
  { level: 8, name: 'The Balanced', xp: 1400, description: 'You find your rhythm.' },
  { level: 9, name: 'The Consistent', xp: 1800, description: 'Skynkod is part of your everyday life.' },
  { level: 10, name: 'The Knowledgeable', xp: 2300, description: 'You deepen your skincare knowledge.' },
  { level: 11, name: 'The Strategist', xp: 2900, description: 'You make wiser choices.' },
  { level: 12, name: 'The Expert', xp: 3600, description: 'You master your routine and your products.' },
  { level: 13, name: 'The Advisor', xp: 4400, description: 'You share your knowledge and help others.' },
  { level: 14, name: 'The Ambassador', xp: 5400, description: 'You inspire the community.' },
  { level: 15, name: 'The Skynkod Icon', xp: 6600, description: 'You’re a reference on Skynkod.' },
]
export const levelTierOf = level => LEVEL_TIERS.find(t => level >= t.levels[0] && level <= t.levels[1]) || LEVEL_TIERS[0]

// Rarity (the badge art and card follow it), plus the special families.
export const TIERS = {
  common: { name: 'Common', description: 'The first steps of your journey.' },
  rare: { name: 'Rare', description: 'Important milestones.' },
  epic: { name: 'Epic', description: 'Bigger achievements.' },
  legendary: { name: 'Legendary', description: 'Unique, exceptional challenges.' },
  secret: { name: 'Secret', description: 'Hidden badges to discover.' },
}
export const TIER_ORDER = ['common', 'rare', 'epic', 'legendary', 'secret']

export const CATEGORIES = [
  { id: 'start', title: 'First steps', subtitle: 'Start your adventure on Skynkod.' },
  { id: 'routines', title: 'Routines & consistency', subtitle: 'Small habits make big changes.' },
  { id: 'skynkod', title: 'Dekod, Rekod & Koda', subtitle: 'Understand your skin, ask your questions, follow your progress.' },
  { id: 'journal', title: 'Journal & feelings', subtitle: 'Observe, understand, celebrate every step.' },
  { id: 'knowledge', title: 'Skincare knowledge', subtitle: 'Discover, learn, explore.' },
  { id: 'collection', title: 'Product collection', subtitle: 'Know your products better, use them better.' },
  { id: 'tracking', title: 'Tracking & results', subtitle: 'Observe, understand, progress.' },
  { id: 'community', title: 'Community & sharing', subtitle: 'A community that grows together.' },
  { id: 'meta', title: 'Your collection', subtitle: 'Collect them all.' },
  { id: 'stars', title: 'Seniority stars', subtitle: 'Celebrate your journey on Skynkod.', special: true },
  { id: 'seasonal', title: 'Seasonal badges', subtitle: 'Available for a limited time.', special: true },
  { id: 'secret', title: 'Secret badges', subtitle: 'To discover…', special: true },
]

// Seniority stars: one small star per active week (the Koda box), and these
// milestones as the stars add up.
export const STAR_MILESTONES = [4, 13, 26, 52, 104, 156]
// Seasons (by month, 0 = January). A seasonal badge = 4 active weeks in one season.
export const SEASONS = { spring: [2, 3, 4], summer: [5, 6, 7], fall: [8, 9, 10], winter: [11, 0, 1] }
export const SEASON_WEEKS = 4

const b = (id, name, tier, category, metric, target, condition, description, koda, extra = {}) => ({ id, name, tier, category, metric, target, condition, description, koda, ...extra })

// Badges: `metric` reads the stats, `target` is the threshold. Each badge is
// earned once and kept forever.
// soon: shown as "Coming soon" (the feature isn't there yet), never earned.
// mystery: a secret badge whose rule isn't decided yet, never earned.
// hidden: set aside for now.
export const BADGES = [
  // First steps
  b('first-steps', 'First Steps', 'common', 'start', 'profileComplete', 1, 'Complete your skin profile.', 'Your skin profile is complete.', 'Now I know your skin. Let’s take care of it together.'),
  b('routine-rookie', 'Routine Rookie', 'rare', 'start', 'routineSaved', 1, 'Save your first routine.', 'Your first routine is saved.', 'Every glow starts with a first routine.'),
  b('product-curator', 'Product Curator', 'epic', 'start', 'productsOwned', 5, 'Add 5 products to your collection.', '5 products in your collection.', 'A shelf that knows you. Nicely curated.'),
  b('shelf-organized', 'Shelf Organized', 'epic', 'start', 'openedCount', 5, 'Add the opening date of 5 products.', 'Opening dates noted for 5 products.', 'Nothing expires behind your back anymore.'),
  b('profile-perfectionist', 'Profile Perfectionist', 'rare', 'start', 'profileFull', 1, 'Answer every question of your skin profile.', 'Your profile is 100% complete.', 'Every detail counts. Now I really know you.'),
  b('skynkod-explorer', 'Skynkod Explorer', 'rare', 'start', 'sectionsUsed', 4, 'Use 4 parts of the app: routines, journal, products, ingredients, Dekod, Rekod or Koda.', 'You used 4 parts of Skynkod.', 'You know your way around now.'),
  // Routines & consistency
  b('consistency-club', 'Consistency Club', 'common', 'routines', 'routineDays', 7, 'Tick your routine on 7 different days.', 'Your routine followed on 7 days.', 'Seven days. This is how skin changes.'),
  b('one-month-strong', 'One Month Strong', 'rare', 'routines', 'routineDays', 30, 'Tick your routine on 30 different days.', 'Your routine followed on 30 days.', 'Thirty days. This isn’t a try anymore, it’s who you are.'),
  b('habit-master', 'Habit Master', 'epic', 'routines', 'routineDays', 100, 'Tick your routine on 100 different days.', 'Your routine followed on 100 days.', 'A hundred days. Your routine is part of you now.'),
  b('comeback-queen', 'Comeback Queen', 'rare', 'routines', 'comeback', 1, 'Come back after a week away.', 'You came back after a week away.', 'So nice to see you again. Your skin missed you too.'),
  b('unstoppable', 'Unstoppable', 'legendary', 'routines', 'longComeback', 1, 'Come back after a month away.', 'You came back after a month away.', 'Whatever happens, you always come back. Unstoppable.'),
  b('morning-glow', 'Morning Glow', 'rare', 'routines', 'bestWeekMornings', 7, 'Do your morning routine every day of a week.', 'Seven morning routines in one week.', 'Seven mornings of care. Your days start well.'),
  b('night-ritual', 'Night Ritual', 'rare', 'routines', 'bestWeekEvenings', 7, 'Do your evening routine every night of a week.', 'Seven evening routines in one week.', 'Seven nights in a row. Your skin worked while you slept.'),
  b('perfect-balance', 'Perfect Balance', 'epic', 'routines', 'bestWeekFull', 7, 'Do both routines every day of a week (14 out of 14).', 'Every morning and every evening of a week.', 'Every morning, every evening. A week without a miss. I’m proud of you.'),
  b('sun-guardian', 'Sun Guardian', 'rare', 'routines', 'sunGuardian', 1, 'Have a sunscreen in your morning routine and do it every day of a week.', 'Sunscreen every morning for a week.', 'The best anti-ageing there is. Well done.'),
  // Dekod, Rekod & Koda
  b('first-light', 'First Light', 'common', 'skynkod', 'dekodScans', 1, 'Do your first Dekod scan.', 'Your first Dekod scan.', 'You dared to really look. That’s where it all begins.'),
  b('deeper-insights', 'Deeper Insights', 'rare', 'skynkod', 'dekodScans', 4, 'Do 4 Dekod scans.', '4 Dekod scans done.', 'Four looks at your skin. You see it change now.'),
  b('new-chapter', 'New Chapter', 'common', 'skynkod', 'rekodStarted', 1, 'Start a Rekod programme.', 'You started a Rekod programme.', 'A goal, a plan, and you. Let’s go.'),
  b('halfway-glow', 'Halfway Glow', 'rare', 'skynkod', 'rekodHalf', 1, 'Reach the middle of your Rekod.', 'Halfway through your Rekod.', 'Halfway there. The best part is coming.'),
  b('rekod-master', 'Rekod Master', 'legendary', 'skynkod', 'rekodFinished', 1, 'Finish your Rekod.', 'You finished your Rekod.', 'Weeks of care, a skin that changed. You did it.'),
  b('first-question', 'First Question', 'common', 'skynkod', 'kodaQuestions', 1, 'Ask Koda your first question.', 'Your first question to Koda.', 'You ask the right questions. Your skin thanks you.'),
  b('kodas-companion', 'Koda’s Companion', 'rare', 'skynkod', 'kodaQuestions', 10, 'Ask Koda 10 questions.', '10 questions to Koda.', 'Ten questions. We make a good team, you and me.'),
  b('barrier-healed', 'Barrier Healed', 'epic', 'skynkod', 'sosPlanDone', 1, 'Finish a 7-day SOS plan.', 'You finished a 7-day SOS plan.', 'Seven days of gentle care. Your barrier thanks you.'),
  b('gentle-comeback', 'Gentle Comeback', 'rare', 'skynkod', 'sosReturnDone', 1, 'Finish the gentle return after an SOS plan.', 'Your products are all back, gently.', 'Step by step, everything is back. Patience pays.'),
  // Journal & feelings
  b('first-entry', 'First Entry', 'common', 'journal', 'journalDays', 1, 'Fill in your journal for the first time.', 'Your first day in the journal.', 'Listening to your skin is the first skill.'),
  b('skin-detective', 'Skin Detective', 'epic', 'journal', 'reactionSpotted', 1, 'Spot a product that makes your skin react.', 'You spotted a product that makes you react.', 'You found the culprit. That’s real skin knowledge.'),
  b('brave-skin', 'Brave Skin', 'rare', 'journal', 'braveDay', 1, 'Note a bad skin day and still do your routine.', 'A bad day noted, and your routine done anyway.', 'Hard days count the most. Well done for showing up.'),
  b('glow-progress', 'Glow Progress', 'rare', 'journal', 'glowUp', 1, 'Have a better skin week than the one before.', 'Your skin felt better than the week before.', 'Better than last week. Keep doing what you’re doing.'),
  b('calm-week', 'Calm Week', 'rare', 'journal', 'calmWeek', 1, 'Fill in your journal 3 times in a week with no skin problem noted.', 'A whole week without a skin problem.', 'A calm week. Your skin is happy.'),
  b('bounce-back', 'Bounce Back', 'epic', 'journal', 'bounceBack', 1, 'Go from a bad day to a good day in the same week.', 'From bad to good in the same week.', 'Your skin bounced back, and so did you.'),
  // Skincare knowledge
  b('skin-scholar', 'Skin Scholar', 'common', 'knowledge', 'ingredientViews', 10, 'Read 10 different ingredient pages.', '10 ingredients discovered.', 'Ten ingredients you now understand. Labels speak to you.'),
  b('ingredient-explorer', 'Ingredient Explorer', 'rare', 'knowledge', 'ingredientViews', 25, 'Read 25 different ingredient pages.', '25 ingredients discovered.', 'Twenty-five ingredients. You read labels like a pro.'),
  b('active-ingredient-pro', 'Active Ingredient Pro', 'epic', 'knowledge', 'ingredientViews', 50, 'Read 50 different ingredient pages.', '50 ingredients discovered.', 'Fifty ingredients. You could teach this now.'),
  b('barrier-expert', 'Barrier Expert', 'rare', 'knowledge', 'advancedArticles', 10, 'Read 10 Skyncyclopedia articles beyond Skincare 101.', '10 advanced topics read.', 'You go deeper than most. Impressive.'),
  b('skincare-genius', 'Skincare Genius', 'legendary', 'knowledge', 'basicsDone', 1, 'Read every Skincare 101 article in Skyncyclopedia.', 'Every basic of Skyncyclopedia read.', 'All the basics, mastered. Skincare genius.'),
  // Product collection
  b('minimalist', 'Minimalist', 'common', 'collection', 'minimalist', 1, 'Build a routine with fewer than 10 products in your collection.', 'A routine with fewer than 10 products.', 'Less, but better. Your skin likes simple.'),
  b('collection-builder', 'Collection Builder', 'rare', 'collection', 'productsOwned', 20, 'Add 20 products to your collection.', '20 products in your collection.', 'Quite the collection. Let’s make every one count.'),
  b('ingredient-matcher', 'Ingredient Matcher', 'epic', 'collection', 'productViews', 10, 'Scan or open the ingredients of 10 different products.', 'The ingredients of 10 products checked.', 'You check before you trust. Smart.'),
  b('no-waste-hero', 'No Waste Hero', 'rare', 'collection', 'finishedProducts', 1, 'Finish a product to the very end.', 'A product used to the very end.', 'Not a drop wasted. Good for your skin and the planet.'),
  b('curated-collection', 'Curated Collection', 'legendary', 'collection', 'curated', 1, 'Own a cleanser, a moisturizer, a sunscreen and a treatment, all with their opening date.', 'A complete, well-kept collection.', 'Everything you need, nothing you don’t. Perfect.'),
  b('mindful-beauty', 'Mindful Beauty', 'rare', 'collection', 'mindful', 1, 'Add 3 new products, one at a time, at least a week apart.', 'One new product at a time.', 'One at a time: the safest way to find what works.'),
  // Tracking & results
  b('journal-keeper', 'Journal Keeper', 'common', 'tracking', 'journalDays', 10, 'Fill in your journal on 10 different days.', '10 days in your skin journal.', 'Ten days of listening. You know your skin better than ever.'),
  b('skin-observer', 'Skin Observer', 'rare', 'tracking', 'photos', 10, 'Add 10 progress photos.', '10 progress photos.', 'A picture is worth a thousand words.', { soon: true }),
  b('progress-tracker', 'Progress Tracker', 'epic', 'tracking', 'journalWeeks', 12, 'Fill in your journal during 12 different weeks.', 'Three months of tracking.', 'Three months of watching your skin. Now you really know it.'),
  b('real-results', 'Real Results', 'epic', 'tracking', 'realResults', 1, 'See a real improvement: a better month in your journal, or a better Dekod scan.', 'A real improvement.', 'This is what all your care was for.'),
  b('glow-journey', 'Glow Journey', 'legendary', 'tracking', 'accountDays', 365, 'Be on Skynkod for a year.', 'One year on Skynkod.', 'A whole year together. Thank you.'),
  // Community & sharing
  b('helpful-friend', 'Helpful Friend', 'common', 'community', 'shares', 1, 'Share Skynkod with a friend.', 'You shared Skynkod with a friend.', 'Good skin is better shared.'),
  b('skynkod-ambassador', 'Skynkod Ambassador', 'rare', 'community', 'shares', 5, 'Share Skynkod 5 times.', 'You shared Skynkod 5 times.', 'You’re spreading the word. Thank you, ambassador.'),
  b('community-star', 'Community Star', 'rare', 'community', 'community', 10, 'Interact with 10 pieces of educational content.', 'Active in the community.', 'Coming soon.', { soon: true }),
  b('skincare-advocate', 'Skincare Advocate', 'epic', 'community', 'community', 1, 'Help the community discover an ingredient.', 'You helped others discover an ingredient.', 'Coming soon.', { soon: true }),
  b('skynkod-icon', 'Skynkod Icon', 'legendary', 'community', 'community', 1, 'Become a very active, inspiring member.', 'An inspiring member.', 'Coming soon.', { soon: true }),
  // Your collection
  b('skincare-enthusiast', 'Skincare Enthusiast', 'common', 'meta', 'otherBadges', 5, 'Earn 5 badges.', '5 badges earned.', 'Five badges. This is becoming a real passion.'),
  b('skynkod-insider', 'Skynkod Insider', 'legendary', 'meta', 'otherBadges', 0, 'Earn every other badge.', 'Every badge earned.', 'You’ve seen it all. You’re a true Skynkod insider.'),
  // Seniority stars
  b('star-welcome', 'Welcome Star', 'common', 'stars', 'stars', 4, '4 active weeks (about 1 month).', 'About a month with Skynkod.', 'One month together. Welcome, truly.'),
  b('star-explorer', 'Explorer Star', 'rare', 'stars', 'stars', 13, '13 active weeks (about 3 months).', 'About 3 months with Skynkod.', 'Three months. You’re finding your way.'),
  b('star-dedicated', 'Dedicated Star', 'rare', 'stars', 'stars', 26, '26 active weeks (about 6 months).', 'About 6 months with Skynkod.', 'Six months of care. Dedicated indeed.'),
  b('star-loyal', 'Loyal Star', 'epic', 'stars', 'stars', 52, '52 active weeks (about 1 year).', 'About a year with Skynkod.', 'A year of active weeks. Thank you for your loyalty.'),
  b('star-expert', 'Expert Star', 'epic', 'stars', 'stars', 104, '104 active weeks (about 2 years).', 'About 2 years with Skynkod.', 'Two years. You’re an expert now.'),
  b('star-veteran', 'Skynkod Veteran', 'legendary', 'stars', 'stars', 156, '156 active weeks (about 3 years).', 'About 3 years with Skynkod.', 'Three years together. A true veteran.'),
  // Seasonal
  b('spring-glow', 'Spring Glow', 'rare', 'seasonal', 'seasonSpring', SEASON_WEEKS, '4 active weeks in spring.', 'Spring edition.', 'Your skin blossomed this spring.'),
  b('summer-care', 'Summer Care', 'rare', 'seasonal', 'seasonSummer', SEASON_WEEKS, '4 active weeks in summer.', 'Summer edition.', 'Sun, care and consistency. Lovely summer.'),
  b('self-care-fall', 'Self Care Fall', 'rare', 'seasonal', 'seasonFall', SEASON_WEEKS, '4 active weeks in autumn.', 'Autumn edition.', 'Autumn care, done right.'),
  b('winter-rituals', 'Winter Rituals', 'rare', 'seasonal', 'seasonWinter', SEASON_WEEKS, '4 active weeks in winter.', 'Winter edition.', 'Cosy rituals for cold days. Well done.'),
  // Secrets (rules to come)
  b('secret-1', 'Secret #1', 'secret', 'secret', 'never', 1, '???', '???', '', { mystery: true }),
  b('secret-2', 'Secret #2', 'secret', 'secret', 'never', 1, '???', '???', '', { mystery: true }),
  b('secret-3', 'Secret #3', 'secret', 'secret', 'never', 1, '???', '???', '', { mystery: true }),
  // Set aside for now (they repeat other badges).
  b('self-care-queen', 'Self Care Queen', 'legendary', 'routines', 'routineDays', 90, 'Tick your routine on 90 different days.', 'Three months of care.', 'Three months. Your skin and you are a team now.', { hidden: true }),
  b('product-detective', 'Product Detective', 'epic', 'collection', 'productViews', 10, 'Open the details of 10 different products.', '10 product pages studied.', 'You check before you trust. Smart.', { hidden: true }),
  b('skincare-expert', 'Skincare Expert', 'legendary', 'knowledge', 'ingredientViews', 50, 'Read 50 different ingredient pages.', '50 ingredients discovered.', 'Fifty ingredients. You could teach this now.', { hidden: true }),
  b('skinfluencer', 'Skinfluencer', 'epic', 'community', 'shares', 1, 'Share Skynkod with a friend.', 'You shared Skynkod with a friend.', 'Good skin is better shared.', { hidden: true }),
]
export const VISIBLE_BADGES = BADGES.filter(x => !x.hidden)
export const canEarn = x => !x.hidden && !x.soon && !x.mystery
// Badges that count for Skincare Enthusiast and Skynkod Insider: the regular
// ones (not stars, seasons, secrets or coming soon).
const COUNTED = new Set(VISIBLE_BADGES.filter(x => canEarn(x) && !CATEGORIES.find(c => c.id === x.category)?.special && x.metric !== 'otherBadges').map(x => x.id))
COUNTED.add('skincare-enthusiast')
BADGES.find(x => x.id === 'skynkod-insider').target = COUNTED.size
export const badgeOf = id => BADGES.find(x => x.id === id) || null

// Weekly challenges (Monday to Sunday, local time).
export const CHALLENGES = [
  { id: 'routine-5', title: 'Five days of care', description: 'Tick your routine on 5 different days.', metric: 'weekRoutineDays', target: 5 },
  { id: 'ingredients-5', title: 'Label reader', description: 'Discover 5 new ingredients.', metric: 'weekIngredients', target: 5 },
  { id: 'products-3', title: 'Fill your shelf', description: 'Add 3 products you own.', metric: 'weekProducts', target: 3 },
  { id: 'opened-3', title: 'Date check', description: 'Note the opening date of 3 products.', metric: 'weekOpened', target: 3 },
  { id: 'profile', title: 'Know your skin', description: 'Complete your skin profile.', metric: 'profileComplete', target: 1, onlyIfMissing: true },
]

// ---------- Dates (local time) ----------

const DAY = 86400000
export const dayKey = (date = new Date()) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const fromKey = key => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (key, n) => { const d = fromKey(key); d.setDate(d.getDate() + n); return dayKey(d) }
export const weekStart = (date = new Date()) => {
  const d = new Date(date); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return dayKey(d)
}
export const weekEnd = start => addDays(start, 6)

// ---------- Levels ----------

export const levelFor = (xp) => {
  let i = 0
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i += 1
  const current = LEVELS[i]
  const next = LEVELS[i + 1] || null
  return { ...current, tier: levelTierOf(current.level), next, progress: next ? (xp - current.xp) / (next.xp - current.xp) : 1, toNext: next ? next.xp - xp : 0 }
}

// ---------- Streaks ----------

// days: list of 'YYYY-MM-DD' with a ticked routine. A streak stays active
// until the end of the day after the last one (she can still keep it today).
export const streakFrom = (days, today = dayKey()) => {
  const set = new Set(days)
  const sorted = [...set].sort()
  let best = 0, run = 0, prev = null
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  let current = 0
  let cursor = set.has(today) ? today : addDays(today, -1)
  while (set.has(cursor)) { current += 1; cursor = addDays(cursor, -1) }
  return { current, best, active: current > 0, doneToday: set.has(today) }
}

// ---------- Stats from raw data ----------

const MOOD = { great: 5, good: 4, okay: 3, bad: 2, terrible: 1 }

// raw: { profileComplete, profileFull, routineSaved, morningHasSpf,
//   products: [{product_id, created_at, opened_at, category}], openedCount,
//   ticks: [{date, routine_type}], journal: [{date, mood, skin_conditions}],
//   dekodScans, dekodBetter, rekodStarted, rekodHalf, rekodFinished, kodaQuestions,
//   sosPlanDone, sosReturnDone, reactionSpotted, accountCreated, comeback,
//   stars: [{week}], shares, ingredients, productPages, opened, articles, finished: {id: ts},
//   basicsIds: [articleIds] }
const gapsBetween = days => { const out = []; for (let i = 1; i < days.length; i += 1) out.push(Math.round((fromKey(days[i]) - fromKey(days[i - 1])) / DAY) - 1); return out }
const seasonOf = key => { const m = fromKey(key).getMonth(); const y = fromKey(key).getFullYear(); const s = Object.keys(SEASONS).find(k => SEASONS[k].includes(m)); return `${s}-${s === 'winter' && m === 11 ? y + 1 : y}` }

export const buildStats = (raw, now = new Date()) => {
  const routineDaySet = new Set(raw.ticks.map(t => t.date))
  // Per day and per week: which routines were done.
  const byDay = {}
  for (const t of raw.ticks) {
    byDay[t.date] = byDay[t.date] || {}
    byDay[t.date][t.routine_type] = true
  }
  const weeks = {}
  for (const [d, done] of Object.entries(byDay)) {
    const w = weekStart(fromKey(d))
    weeks[w] = weeks[w] || { mornings: 0, evenings: 0, full: 0 }
    if (done.morning) weeks[w].mornings += 1
    if (done.evening) weeks[w].evenings += 1
    if (done.morning && done.evening) weeks[w].full += 1
  }
  const best = key => Math.max(0, ...Object.values(weeks).map(w => w[key]))

  const entries = raw.journal.filter(e => MOOD[e.mood]).map(e => ({ ...e, day: dayKey(new Date(e.date)), score: MOOD[e.mood] }))
  const journalDaySet = new Set(entries.map(e => e.day))
  const avg = l => l.reduce((a, b) => a + b, 0) / l.length
  const byWeek = {}
  for (const e of entries) { const w = weekStart(fromKey(e.day)); (byWeek[w] = byWeek[w] || []).push(e) }
  // Glow Progress: a week whose average mood beats the week before by half a point.
  const glowUp = Object.keys(byWeek).some(w => byWeek[addDays(w, -7)] && avg(byWeek[w].map(e => e.score)) - avg(byWeek[addDays(w, -7)].map(e => e.score)) >= 0.5)
  // Calm Week: at least 3 entries in a week and no problem noted.
  const calmWeek = Object.values(byWeek).some(l => l.length >= 3 && l.every(e => !(e.skin_conditions || []).length))
  // Bounce Back: a bad day, then a good one later the same week.
  const bounceBack = Object.values(byWeek).some(l => {
    const sorted = [...l].sort((a, b) => a.day.localeCompare(b.day))
    const firstBad = sorted.findIndex(e => e.score <= 2)
    return firstBad >= 0 && sorted.slice(firstBad + 1).some(e => e.score >= 4)
  })
  // Brave Skin: a bad day noted, and a routine ticked that day.
  const braveDay = entries.some(e => e.score <= 2 && routineDaySet.has(e.day))
  // Real Results: the last 4 weeks of mood beat the 4 before, or a better Dekod scan.
  const cut = addDays(weekStart(now), -21)
  const recent = entries.filter(e => e.day >= cut).map(e => e.score)
  const before = entries.filter(e => e.day < cut && e.day >= addDays(cut, -28)).map(e => e.score)
  const realResults = raw.dekodBetter || (recent.length >= 3 && before.length >= 3 && avg(recent) - avg(before) >= 0.5)

  // Active days (routine or journal): coming back after a week or a month away.
  const activeDays = [...new Set([...routineDaySet, ...journalDaySet])].sort()
  const gaps = gapsBetween(activeDays)

  const owned = raw.products
  const productIds = new Set(owned.map(p => p.product_id || p.id))
  const cats = new Set(owned.map(p => String(p.category || '').toLowerCase()))
  const curated = ['cleanser', 'moisturizer', 'sunscreen'].every(c => cats.has(c))
    && ['serum', 'treatment', 'exfoliator', 'exfoliant'].some(c => cats.has(c))
    && owned.length > 0 && owned.every(p => p.opened_at)
  // Mindful Beauty: 3 additions in a row, each at least a week after the one before.
  const added = owned.map(p => new Date(p.created_at).getTime()).filter(Boolean).sort((a, b) => a - b)
  let spaced = added.length ? 1 : 0, bestSpaced = spaced
  for (let i = 1; i < added.length; i += 1) { spaced = added[i] - added[i - 1] >= 7 * DAY ? spaced + 1 : 1; bestSpaced = Math.max(bestSpaced, spaced) }

  const articleIds = Object.keys(raw.articles || {})
  const basics = raw.basicsIds || []
  const stars = raw.stars || []
  const seasonCount = {}
  for (const st of stars) { const k = seasonOf(st.week); seasonCount[k] = (seasonCount[k] || 0) + 1 }
  const bestSeason = name => Math.max(0, ...Object.entries(seasonCount).filter(([k]) => k.startsWith(name)).map(([, n]) => n))

  const ws = weekStart(now)
  const we = addDays(ws, 7)
  const inWeek = ts => { const k = dayKey(new Date(ts)); return k >= ws && k < we }

  const stats = {
    profileComplete: raw.profileComplete ? 1 : 0,
    profileFull: raw.profileFull ? 1 : 0,
    routineSaved: raw.routineSaved ? 1 : 0,
    productsOwned: productIds.size,
    openedCount: raw.openedCount || 0,
    ingredientViews: Object.keys(raw.ingredients || {}).length,
    productViews: Object.keys(raw.productPages || {}).length,
    routineDays: routineDaySet.size,
    journalDays: journalDaySet.size,
    journalWeeks: Object.keys(byWeek).length,
    dekodScans: raw.dekodScans || 0,
    kodaQuestions: raw.kodaQuestions || 0,
    shares: raw.shares || 0,
    comeback: raw.comeback || gaps.some(g => g >= 7) ? 1 : 0,
    longComeback: gaps.some(g => g >= 30) ? 1 : 0,
    rekodStarted: raw.rekodStarted ? 1 : 0,
    rekodHalf: raw.rekodHalf || raw.rekodFinished ? 1 : 0,
    rekodFinished: raw.rekodFinished ? 1 : 0,
    sosPlanDone: raw.sosPlanDone ? 1 : 0,
    sosReturnDone: raw.sosReturnDone ? 1 : 0,
    reactionSpotted: raw.reactionSpotted ? 1 : 0,
    bestWeekMornings: best('mornings'),
    bestWeekEvenings: best('evenings'),
    bestWeekFull: best('full'),
    sunGuardian: raw.morningHasSpf && best('mornings') >= 7 ? 1 : 0,
    glowUp: glowUp ? 1 : 0,
    calmWeek: calmWeek ? 1 : 0,
    bounceBack: bounceBack ? 1 : 0,
    braveDay: braveDay ? 1 : 0,
    realResults: realResults ? 1 : 0,
    advancedArticles: articleIds.filter(id => !basics.includes(id)).length,
    basicsDone: basics.length > 0 && basics.every(id => raw.articles?.[id]) ? 1 : 0,
    minimalist: raw.routineSaved && productIds.size >= 3 && productIds.size < 10 ? 1 : 0,
    finishedProducts: Object.keys(raw.finished || {}).length,
    curated: curated ? 1 : 0,
    mindful: bestSpaced >= 3 ? 1 : 0,
    accountDays: raw.accountCreated ? Math.floor((now - new Date(raw.accountCreated)) / DAY) : 0,
    stars: stars.length,
    seasonSpring: bestSeason('spring'),
    seasonSummer: bestSeason('summer'),
    seasonFall: bestSeason('fall'),
    seasonWinter: bestSeason('winter'),
    never: 0,
    weekRoutineDays: [...routineDaySet].filter(d => d >= ws && d < we).length,
    weekIngredients: Object.values(raw.ingredients || {}).filter(inWeek).length,
    weekProducts: owned.filter(p => inWeek(p.created_at)).length,
    weekOpened: Object.values(raw.opened || {}).filter(inWeek).length,
  }
  stats.sectionsUsed = [stats.routineDays, stats.journalDays, stats.productsOwned, stats.ingredientViews, stats.dekodScans, stats.rekodStarted, stats.kodaQuestions].filter(v => v > 0).length
  stats.routineDayList = [...routineDaySet]
  return stats
}

// ---------- Badges ----------

export const metricOf = (badge, stats, earnedCount = 0) => (badge.metric === 'otherBadges' ? earnedCount : stats[badge.metric] || 0)

// Which badges are reached now, given those already earned (kept forever).
// Only the badges on display can be earned; badges that count other badges
// are checked last, smallest target first.
export const reachedBadges = (stats, earned = {}) => {
  const out = new Set(Object.keys(earned))
  for (const b of BADGES) if (canEarn(b) && b.metric !== 'otherBadges' && metricOf(b, stats) >= b.target) out.add(b.id)
  for (const b of BADGES.filter(x => canEarn(x) && x.metric === 'otherBadges').sort((x, y) => x.target - y.target)) {
    const others = [...out].filter(id => id !== b.id && COUNTED.has(id)).length
    if (others >= b.target) out.add(b.id)
  }
  return [...out]
}

export const earnedOthers = (badge, earned = {}) => Object.keys(earned).filter(id => id !== badge.id && COUNTED.has(id)).length

// The closest badges still to earn, with their progress.
export const progressOf = (badge, stats, earned = {}) => Math.min(metricOf(badge, stats, earnedOthers(badge, earned)), badge.target)

export const nextSteps = (stats, earned = {}, limit = 3) => VISIBLE_BADGES
  .filter(b => !earned[b.id] && canEarn(b))
  .map(b => ({ badge: b, value: progressOf(b, stats, earned), target: b.target }))
  .filter(s => s.target > 1 || s.value === 0)
  .sort((a, b) => b.value / b.target - a.value / a.target)
  .slice(0, limit)

// ---------- Challenges ----------

export const weekChallenges = (stats, week, events = {}) => CHALLENGES
  .filter(c => !c.onlyIfMissing || !stats[c.metric] || events[`challenge:${week}:${c.id}`])
  .map(c => {
    const value = Math.min(stats[c.metric] || 0, c.target)
    const done = !!events[`challenge:${week}:${c.id}`] || value >= c.target
    return { ...c, value, done, state: done ? 'done' : value > 0 ? 'started' : 'todo', xp: XP.challenge, from: week, to: weekEnd(week) }
  })

// ---------- XP ----------

// Every XP event has a unique key, so the same action can never pay twice.
// Returns the events that are new compared with `events`.
export const newXpEvents = ({ raw, stats, badges, challenges, week }, events = {}, now = Date.now()) => {
  const out = []
  const add = (key, xp, at = now) => { if (!events[key] && !out.some(e => e.key === key)) out.push({ key, xp, at }) }
  if (stats.profileComplete) add('profile', XP.profile)
  if (stats.routineSaved) add('first-routine', XP.firstRoutine)
  // Products: once per catalogue product, with a daily cap (adding and
  // removing the same product never pays again).
  const perDay = {}
  for (const e of Object.entries(events)) if (e[0].startsWith('product:') && e[1].xp > 0) { const d = dayKey(new Date(e[1].at)); perDay[d] = (perDay[d] || 0) + 1 }
  for (const p of [...raw.products].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))) {
    const key = `product:${p.product_id || p.id}`
    if (events[key] || out.some(e => e.key === key)) continue
    const d = dayKey(new Date(p.created_at || now))
    const paid = (perDay[d] || 0) < XP.productDailyCap
    if (paid) perDay[d] = (perDay[d] || 0) + 1
    add(key, paid ? XP.product : 0, new Date(p.created_at || now).getTime())
  }
  for (const [id, ts] of Object.entries(raw.ingredients || {})) add(`ingredient:${id}`, XP.ingredient, ts)
  for (const d of stats.routineDayList) add(`day:${d}`, XP.routineDay, fromKey(d).getTime())
  for (const c of challenges) if (c.done) add(`challenge:${week}:${c.id}`, XP.challenge)
  for (const id of badges) add(`badge:${id}`, XP.badge[badgeOf(id)?.tier] || 0)
  return out
}

export const totalXp = events => Object.values(events).reduce((n, e) => n + (e.xp || 0), 0)

// ---------- The Koda box ----------

// Days with a ticked routine or a journal entry during the week starting on `week`.
export const activeDaysIn = (raw, week) => {
  const end = addDays(week, 7)
  const days = new Set([
    ...raw.ticks.map(t => t.date),
    ...raw.journal.filter(e => e.mood).map(e => dayKey(new Date(e.date))),
  ])
  return [...days].filter(d => d >= week && d < end).length
}

// What the box holds for the week that just ended: a seniority star for an
// active week; otherwise a cup of tea, plus the Welcome Back badge the first time.
export const boxContents = ({ activeDays, stars, comebackEarned }) => (
  activeDays >= ACTIVE_DAYS
    ? { kind: 'star', star: stars + 1 }
    : { kind: 'tea', comeback: !comebackEarned }
)

