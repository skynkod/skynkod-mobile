import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { ramadanDay } from './ramadan'
import Constants from 'expo-constants'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// ask = false only checks: used after she said "Not now" at onboarding.
export const requestNotificationPermissions = async (ask = true) => {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync()
    let status = existing
    if (existing !== 'granted' && ask) {
      const response = await Notifications.requestPermissionsAsync()
      status = response.status
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      })
    }
    return status === 'granted'
  } catch (error) {
    console.warn('Notification permission error:', error)
    return false
  }
}

export const getExpoPushToken = async () => {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId })
    return data
  } catch (error) {
    console.warn('Push token error:', error)
    return null
  }
}

// Reminders speak the app's language and open the right page when tapped.
const lang = async () => ((await AsyncStorage.getItem('skynkod_language').catch(() => null)) === 'fr' ? 'fr' : 'en')
const TEXT = {
  morning: { en: 'Your morning routine is waiting ☀️', fr: "Ta routine du matin t'attend ☀️" },
  evening: { en: 'Time for your evening routine 🌙', fr: "Ta routine du soir, c'est le moment 🌙" },
  eveningRamadan: { en: 'Your evening routine 🌙 And drink enough water before bed 💧', fr: "Ta routine du soir 🌙 Et pense à bien t'hydrater avant de dormir 💧" },
  journal: { en: 'How is your skin this morning? 🌸', fr: 'Comment va ta peau ce matin ? 🌸' },
  // No promise on the skin, just the reminder (notifications audit, 2026-10-25).
  water: [
    { en: 'A glass of water? 💧', fr: 'Un verre d’eau ? 💧' },
    { en: 'Time for a glass of water 💧', fr: 'C’est le moment d’un verre d’eau 💧' },
    { en: 'One more glass of water before dinner? 💧', fr: 'Un dernier verre d’eau avant le dîner ? 💧' },
  ],
}

const scheduleDaily = async (id, title, body, hour, minute, screen) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(id)
  } catch (_) {}
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: { title, body, sound: true, data: screen ? { screen } : {} },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    })
  } catch (error) {
    console.warn(`Schedule ${id} error:`, error)
  }
}

export const scheduleMorningReminder = async (userId) =>
  scheduleDaily(`morning-${userId}`, 'Skynkod', TEXT.morning[await lang()], 8, 0, 'Home')

// During Ramadan (in Arab and Muslim countries) the bedtime reminder also says
// to rehydrate; rescheduled at each app start, so it follows the month.
export const scheduleEveningReminder = async (userId) =>
  scheduleDaily(`evening-${userId}`, 'Skynkod', (ramadanDay() ? TEXT.eveningRamadan : TEXT.evening)[await lang()], 21, 0, 'Home')

// Water: one gentle reminder at 15:00; 11:00 and 18:00 only if she asks (Notifications).
export const WATER_TIMES = [[15, 0], [11, 0], [18, 0]]
export const scheduleWaterReminders = async (userId, extra = false) => {
  const l = await lang()
  const order = [1, 0, 2] // texts: morning, mid-day, evening
  for (let i = 0; i < (extra ? 3 : 1); i += 1) {
    await scheduleDaily(`water-${i}-${userId}`, 'Skynkod', TEXT.water[order[i]][l], WATER_TIMES[i][0], WATER_TIMES[i][1], 'Home')
  }
}
export const cancelWaterReminders = async (userId) => {
  for (let i = 0; i < WATER_TIMES.length; i += 1) await Notifications.cancelScheduledNotificationAsync(`water-${i}-${userId}`).catch(() => {})
}

export const scheduleJournalReminder = async (userId) =>
  scheduleDaily(`journal-${userId}`, 'Skynkod', TEXT.journal[await lang()], 7, 45, 'Journal')

// ---------- Smart reminders (Rekod, Dekod, 7-day plan) ----------
// Re-synced at each app start and whenever a programme or plan changes.
const NIGHT_TEXT = {
  exfoliation: { en: 'Tonight: exfoliation night ✨', fr: 'Ce soir : soirée exfoliation ✨' },
  retinoid: { en: 'Tonight: retinol night 🌙', fr: 'Ce soir : soirée rétinol 🌙' },
  // The treatment night's true name (Rekod audit 2): azelaic acid, or a gentle treatment in pregnancy.
  azelaic: { en: 'Tonight: azelaic acid night 🌙', fr: 'Ce soir : soirée acide azélaïque 🌙' },
  gentle: { en: 'Tonight: gentle treatment night 🌙', fr: 'Ce soir : soirée traitement doux 🌙' },
  repair: { en: 'Tonight: repair night 🩹', fr: 'Ce soir : soirée réparation 🩹' },
  reset: { en: 'Tonight: reset night, just cleanse and moisturize 🍃', fr: 'Ce soir : soirée repos, nettoyer et hydrater 🍃' },
}
const SMART_TEXT = {
  checkin: { en: 'Your weekly Rekod review is ready 📈', fr: 'Ton Rekod review de la semaine est prêt 📈' },
  dekod: { en: 'Time for this week’s Dekod: see how your skin changed 🔍', fr: 'C’est l’heure du Dekod de la semaine : vois comment ta peau évolue 🔍' },
  sos: { en: (day, title) => `Day ${day} of 7 · ${title}`, fr: (day, title) => `Jour ${day} sur 7 · ${title}` },
  recap: { en: 'Your Koda box has arrived 📦 Open it to see what your week brought you.', fr: 'Ta box de Koda est arrivée 📦 Ouvre-la pour voir ce que ta semaine t’a apporté.' },
}
const cancel = id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})

// ---------- All the reminders, at most 3 a day (Lita's audit, 2026-10-24) ----------
// Morning (check-in + routine, with the day's extras), 15:00 one water
// reminder (11:00 and 18:00 only if she asks), evening (or the Rekod night).
// Rekod, Dekod, the Koda box and the 7-day plan replace the day's reminder
// instead of adding one.
// Notifications audit (2026-10-25): morning and evening are planned day by day
// for the next 4 weeks, so each one says what that day really holds (the Rekod
// week of that day, a rest week, her skin reacting today, a review that's due),
// at the times she chose. Re-planned at each app start and whenever something
// changes; after 4 weeks without opening the app, they stop rather than guess.
const MORNING = { en: 'Good morning! How’s your skin? Then your morning routine ☀️', fr: 'Bonjour ! Comment va ta peau ? Puis ta routine du matin ☀️' }
const EXTRA = {
  recap: { en: 'Your Koda box has arrived 📦', fr: 'Ta box de Koda est arrivée 📦' },
  dekod: { en: 'It’s Dekod day 🔍', fr: 'C’est le jour du Dekod 🔍' },
  rekod: { en: 'Your Rekod review is ready 📈', fr: 'Ton Rekod review est prêt 📈' },
}
const CALM_EVENING = { en: 'Your calm evening routine 🌙', fr: 'Ta routine douce du soir 🌙' }
const REACTING_EVENING = { en: 'Your skin is reacting: a gentle routine tonight, strong actives wait 🌙', fr: 'Ta peau réagit : routine douce ce soir, les actifs forts attendent 🌙' }
const DAYS_AHEAD = 28
export const DEFAULT_TIMES = { morningTime: '08:00', eveningTime: '21:00' }
export const getReminderPrefs = async (userId) => ({
  morningReminder: true, eveningReminder: true, waterReminder: true, waterExtra: false, ...DEFAULT_TIMES,
  ...JSON.parse((await AsyncStorage.getItem(`notifications_${userId}`).catch(() => null)) || '{}'),
})
const hm = text => { const [h, m] = String(text || '').split(':').map(Number); return [Number.isFinite(h) ? h : 8, Number.isFinite(m) ? m : 0] }
const dayIds = userId => Array.from({ length: DAYS_AHEAD }, (_, d) => [`am-${d}-${userId}`, `pm-${d}-${userId}`]).flat()

export const syncSmartReminders = async (userId) => {
  if (!userId) return
  try {
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') return
    const l = await lang()
    const prefs = await getReminderPrefs(userId)
    const { getRekodPlan, nightOnDate, treatmentOnDate, patternFromRoutine } = await import('./rekod')
    const { getActivePlan } = await import('./emergency-state')
    const { getDekodResults } = await import('./dekod')
    const { isPremiumUser } = await import('./premium')
    const { currentSkinState, isReactiveState } = await import('./skin-state')
    const { getUserRoutines } = await import('./routines-service')
    const [rekod, sos, scans, premium, skin, routines] = await Promise.all([
      getRekodPlan(userId).catch(() => null),
      getActivePlan(userId).catch(() => null),
      getDekodResults(userId, 1).catch(() => []),
      isPremiumUser(userId).catch(() => false),
      currentSkinState(userId).catch(() => null),
      getUserRoutines(userId).catch(() => null),
    ])

    // Clear everything this function owns, old ids included.
    const ids = [`morning-${userId}`, `journal-${userId}`, `evening-${userId}`, `recap-weekly-${userId}`, `dekod-weekly-${userId}`, `rekod-checkin-${userId}`, ...dayIds(userId)]
    for (let i = 0; i < 7; i += 1) ids.push(`morning-${i}-${userId}`, `rekod-night-${i}-${userId}`)
    for (let d = 0; d < 21; d += 1) ids.push(`sos-day-${d}-${userId}`, `sos-evening-${d}-${userId}`)
    for (const id of ['mask', 'fragrance', 'vitaminC', 'scrub', 'exfoliant', 'acid', 'retinoid']) ids.push(`sos-back-${id}-${userId}`)
    for (const id of ids) await cancel(id)
    await cancelWaterReminders(userId)

    const now = new Date()
    const at = (date, [h, m]) => { const d = new Date(date); d.setHours(h, m, 0, 0); return d }
    const once = (id, body, date, screen) => (date > now ? Notifications.scheduleNotificationAsync({
      identifier: id, content: { title: 'Skynkod', body, sound: true, data: { screen } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    }).catch(() => {}) : Promise.resolve())
    const dayOf = d => new Date(now.getFullYear(), now.getMonth(), now.getDate() + d)
    const sameDay = (a, b) => a.toDateString() === b.toDateString()

    // The 7-day plan: its calm days and the evenings products come back.
    const sosStart = sos ? new Date(sos.startedAt) : null
    const sosDay = date => (sos ? Math.floor((new Date(date.toDateString()) - new Date(sosStart.toDateString())) / 86400000) : -1)
    const back = {}
    for (const r of sos?.schedule || []) if (!r.again) back[r.day] = r.id
    const sosLast = sos ? Math.min(20, Math.max(7, ...Object.keys(back).map(Number))) : -1
    const BACK = {
      en: { mask: 'masks', fragrance: 'fragranced products', vitaminC: 'vitamin C', scrub: 'scrubs', exfoliant: 'exfoliants', acid: 'acids', retinoid: 'retinol (one night out of two)' },
      fr: { mask: 'les masques', fragrance: 'les produits parfumés', vitaminC: 'la vitamine C', scrub: 'les gommages', exfoliant: 'les exfoliants', acid: 'les acides', retinoid: 'le rétinol (un soir sur deux)' },
    }

    // Rekod: Premium follows the plan week by week; without Premium the routine
    // is frozen, so the nights come from the saved routine (like Home).
    const evening = (routines?.success ? routines.data : [])?.find(r => r.type === 'evening')?.steps || []
    const frozen = rekod && !premium ? patternFromRoutine(evening) : null
    const MON_FIRST = [1, 2, 3, 4, 5, 6, 0]
    const rekodNight = date => (frozen ? frozen[MON_FIRST.indexOf(date.getDay())] : nightOnDate(rekod, date, now))
    // The Rekod review: weekly on her start weekday; every 4 weeks in maintenance.
    const reviewDue = date => {
      if (!rekod || !premium) return false
      if (rekod.maintenance) {
        const last = rekod.checkins?.[rekod.checkins.length - 1]
        const from = Math.max(new Date(rekod.maintenanceSince || rekod.startedAt).getTime(), last ? new Date(last.at).getTime() : 0)
        return sameDay(date, new Date(from + 28 * 86400000)) || (date > new Date(from + 28 * 86400000) && sameDay(date, dayOf(0)))
      }
      return date.getDay() === new Date(rekod.startedAt).getDay() && date >= new Date(new Date(rekod.startedAt).getTime() + 7 * 86400000)
    }
    const reactingToday = isReactiveState(skin?.states)

    for (let d = 0; d < DAYS_AHEAD; d += 1) {
      const date = dayOf(d)
      const sd = sosDay(date)
      // Morning.
      const extras = [
        date.getDay() === 0 && scans?.length && premium ? EXTRA.dekod[l] : null,
        reviewDue(date) ? EXTRA.rekod[l] : null,
      ].filter(Boolean)
      if (sos && sos.phase !== 'return' && sd >= 0 && sd < 7) await once(`am-${d}-${userId}`, `${SMART_TEXT.sos[l](sd + 1, sos.situation.title)} ☀️`, at(date, hm(prefs.morningTime)), 'Emergency')
      else if (prefs.morningReminder) await once(`am-${d}-${userId}`, [MORNING[l], ...extras].join(' '), at(date, hm(prefs.morningTime)), 'Home')
      else if (extras.length) await once(`am-${d}-${userId}`, extras.join(' '), at(date, [10, 0]), 'Home')
      // Evening.
      let body = null
      let screen = 'Home'
      if (sos && sd >= 0 && sd <= sosLast) body = back[sd] ? (l === 'fr' ? `Ce soir, on réintroduit ${BACK.fr[back[sd]]} dans ta routine 🌿` : `Tonight, we bring back ${BACK.en[back[sd]]} into your routine 🌿`) : CALM_EVENING[l]
      else if (prefs.eveningReminder && rekod) {
        const night = rekodNight(date)
        const strong = night === 'retinoid' || night === 'exfoliation'
        const treatment = treatmentOnDate(rekod, date, now)
        body = d === 0 && strong && reactingToday ? REACTING_EVENING[l] : NIGHT_TEXT[night === 'retinoid' && treatment !== 'retinol' ? treatment : night][l]
        screen = 'Rekod'
      } else if (prefs.eveningReminder) body = (d === 0 && reactingToday ? REACTING_EVENING : ramadanDay(date) ? TEXT.eveningRamadan : TEXT.evening)[l]
      if (body) await once(`pm-${d}-${userId}`, body, at(date, hm(prefs.eveningTime)), screen)
    }

    // Water: one at 15:00, the other two only if she asked for them.
    if (prefs.waterReminder) await scheduleWaterReminders(userId, prefs.waterExtra)
  } catch (error) {
    console.warn('Reminders error:', error)
  }
}
