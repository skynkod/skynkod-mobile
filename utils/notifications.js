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
  water: [
    { en: 'A glass of water? Your skin will thank you 💧', fr: 'Un verre d’eau ? Ta peau te dit merci 💧' },
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
// Monday-first index (0..6) → expo weekday (1 = Sunday … 7 = Saturday).
const EXPO_WEEKDAY = [2, 3, 4, 5, 6, 7, 1]

const scheduleWeekly = (id, body, weekday, hour, minute, screen) =>
  Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title: 'Skynkod', body, sound: true, data: { screen } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute },
  }).catch(error => console.warn(`Schedule ${id} error:`, error))

// ---------- All the reminders, at most 3 a day (Lita's audit, 2026-10-24) ----------
// 8:00 morning (check-in + routine, with the week's extras the same morning),
// 15:00 one water reminder (11:00 and 18:00 only if she asks), 21:00 evening
// (or the Rekod night). Rekod, Dekod, the Koda box and the 7-day plan replace
// the day's reminder instead of adding one. Re-synced at each app start and
// whenever a programme, a plan or a setting changes.
const MORNING = { en: 'Good morning! How’s your skin? Then your morning routine ☀️', fr: 'Bonjour ! Comment va ta peau ? Puis ta routine du matin ☀️' }
const EXTRA = {
  recap: { en: 'Your Koda box has arrived 📦', fr: 'Ta box de Koda est arrivée 📦' },
  dekod: { en: 'It’s Dekod day 🔍', fr: 'C’est le jour du Dekod 🔍' },
  rekod: { en: 'Your weekly Rekod review is ready 📈', fr: 'Ton Rekod review de la semaine est prêt 📈' },
}
const CALM_EVENING = { en: 'Your calm evening routine 🌙', fr: 'Ta routine douce du soir 🌙' }
export const getReminderPrefs = async (userId) => ({
  morningReminder: true, eveningReminder: true, waterReminder: true, waterExtra: false,
  ...JSON.parse((await AsyncStorage.getItem(`notifications_${userId}`).catch(() => null)) || '{}'),
})

export const syncSmartReminders = async (userId) => {
  if (!userId) return
  try {
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') return
    const l = await lang()
    const prefs = await getReminderPrefs(userId)
    const { getRekodPlan, weekPattern } = await import('./rekod')
    const { getActivePlan } = await import('./emergency-state')
    const { getDekodResults } = await import('./dekod')
    const [rekod, sos, scans] = await Promise.all([
      getRekodPlan(userId).catch(() => null),
      getActivePlan(userId).catch(() => null),
      getDekodResults(userId, 1).catch(() => []),
    ])

    // Clear everything this function owns, old ids included.
    const ids = [`morning-${userId}`, `journal-${userId}`, `evening-${userId}`, `recap-weekly-${userId}`, `dekod-weekly-${userId}`, `rekod-checkin-${userId}`]
    for (let i = 0; i < 7; i += 1) ids.push(`morning-${i}-${userId}`, `rekod-night-${i}-${userId}`)
    for (let d = 0; d < 21; d += 1) ids.push(`sos-day-${d}-${userId}`, `sos-evening-${d}-${userId}`)
    for (const id of ['mask', 'fragrance', 'vitaminC', 'scrub', 'exfoliant', 'acid', 'retinoid']) ids.push(`sos-back-${id}-${userId}`)
    for (const id of ids) await cancel(id)
    await cancelWaterReminders(userId)

    // The extras of each weekday (Monday-first index).
    const extras = Array.from({ length: 7 }, () => [])
    extras[0].push(EXTRA.recap[l])
    // Only for those who can scan again (Premium): the free scan is a one-off (Dekod audit 2).
    const { isPremiumUser } = await import('./premium')
    if (scans?.length && await isPremiumUser(userId).catch(() => false)) extras[6].push(EXTRA.dekod[l])
    if (rekod) extras[(new Date(rekod.startedAt).getDay() + 6) % 7].push(EXTRA.rekod[l])
    const at = (date, h, m) => { const d = new Date(date); d.setHours(h, m, 0, 0); return d }
    const once = (id, body, date, screen) => (date > new Date() ? Notifications.scheduleNotificationAsync({
      identifier: id, content: { title: 'Skynkod', body, sound: true, data: { screen } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    }).catch(() => {}) : Promise.resolve())

    // 8:00. During the 7 calm days, the plan's day is the morning reminder.
    const calm = sos && sos.phase !== 'return'
    if (calm) {
      for (let d = 0; d < 7; d += 1) {
        const date = at(new Date(new Date(sos.startedAt).getTime() + d * 86400000), 8, 0)
        await once(`sos-day-${d}-${userId}`, `${SMART_TEXT.sos[l](d + 1, sos.situation.title)} ☀️`, date, 'Emergency')
      }
    } else if (prefs.morningReminder) {
      for (let i = 0; i < 7; i += 1) {
        await scheduleWeekly(`morning-${i}-${userId}`, [MORNING[l], ...extras[i]].join(' '), EXPO_WEEKDAY[i], 8, 0, extras[i].length ? 'Home' : 'Home')
      }
    } else {
      // Morning off: the week's extras still come, once, mid-morning.
      for (let i = 0; i < 7; i += 1) if (extras[i].length) await scheduleWeekly(`morning-${i}-${userId}`, extras[i].join(' '), EXPO_WEEKDAY[i], 10, 0, 'Home')
    }

    // Water: one at 15:00, the other two only if she asked for them.
    if (prefs.waterReminder) await scheduleWaterReminders(userId, prefs.waterExtra)

    // 21:00. While a plan runs (calm days and the gradual return), each evening
    // says what to do, and the night a product comes back says so.
    if (sos) {
      const back = {}
      for (const r of sos.schedule || []) if (!r.again) back[r.day] = r.id
      const BACK = {
        en: { mask: 'masks', fragrance: 'fragranced products', vitaminC: 'vitamin C', scrub: 'scrubs', exfoliant: 'exfoliants', acid: 'acids', retinoid: 'retinol (one night out of two)' },
        fr: { mask: 'les masques', fragrance: 'les produits parfumés', vitaminC: 'la vitamine C', scrub: 'les gommages', exfoliant: 'les exfoliants', acid: 'les acides', retinoid: 'le rétinol (un soir sur deux)' },
      }
      const last = Math.max(7, ...Object.keys(back).map(Number))
      for (let d = 0; d <= last && d < 21; d += 1) {
        const date = at(new Date(new Date(sos.startedAt).getTime() + d * 86400000), 21, 0)
        const body = back[d] ? (l === 'fr' ? `Ce soir, on réintroduit ${BACK.fr[back[d]]} dans ta routine 🌿` : `Tonight, we bring back ${BACK.en[back[d]]} into your routine 🌿`) : CALM_EVENING[l]
        await once(`sos-evening-${d}-${userId}`, body, date, 'Home')
      }
    } else if (prefs.eveningReminder) {
      if (rekod) {
        const week = weekPattern(rekod)
        for (let i = 0; i < 7; i += 1) await scheduleWeekly(`rekod-night-${i}-${userId}`, NIGHT_TEXT[week[i]][l], EXPO_WEEKDAY[i], 21, 0, 'Rekod')
      } else {
        await scheduleEveningReminder(userId)
      }
    }
  } catch (error) {
    console.warn('Reminders error:', error)
  }
}
