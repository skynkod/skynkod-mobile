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
  checkin: { en: 'Your Rekod weekly check-in is ready 📈', fr: 'Ton bilan Rekod de la semaine est prêt 📈' },
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

export const syncSmartReminders = async (userId) => {
  if (!userId) return
  try {
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') return
    const l = await lang()
    const { getRekodPlan, weekPattern } = await import('./rekod')
    const { getActivePlan } = await import('./emergency-state')
    const { getDekodResults } = await import('./dekod')
    const [rekod, sos, scans] = await Promise.all([
      getRekodPlan(userId).catch(() => null),
      getActivePlan(userId).catch(() => null),
      getDekodResults(userId, 1).catch(() => []),
    ])

    // Rekod: each evening says which night it is (instead of the generic one), plus the weekly check-in.
    for (let i = 0; i < 7; i += 1) await cancel(`rekod-night-${i}-${userId}`)
    await cancel(`rekod-checkin-${userId}`)
    if (rekod) {
      await cancel(`evening-${userId}`)
      const week = weekPattern(rekod)
      for (let i = 0; i < 7; i += 1) {
        await scheduleWeekly(`rekod-night-${i}-${userId}`, NIGHT_TEXT[week[i]][l], EXPO_WEEKDAY[i], 21, 0, 'Rekod')
      }
      const startDay = new Date(rekod.startedAt).getDay() + 1
      await scheduleWeekly(`rekod-checkin-${userId}`, SMART_TEXT.checkin[l], startDay, 10, 0, 'Rekod')
    } else {
      await scheduleEveningReminder(userId)
    }

    // The Koda box (and the weekly recap on Home), every Monday morning.
    await cancel(`recap-weekly-${userId}`)
    await scheduleWeekly(`recap-weekly-${userId}`, SMART_TEXT.recap[l], 2, 9, 30, 'Journey')

    // Dekod: once she has scanned, a weekly nudge on Sunday morning.
    await cancel(`dekod-weekly-${userId}`)
    if (scans?.length) await scheduleWeekly(`dekod-weekly-${userId}`, SMART_TEXT.dekod[l], 1, 10, 30, 'Dekod')

    // 7-day plan: one reminder each remaining morning, with the day number.
    for (let d = 1; d <= 7; d += 1) await cancel(`sos-day-${d}-${userId}`)
    for (const id of ['mask', 'fragrance', 'vitaminC', 'scrub', 'exfoliant', 'acid', 'retinoid']) await cancel(`sos-back-${id}-${userId}`)
    // Gradual return: the evening a product comes back, say so.
    const BACK = {
      en: { mask: 'masks', fragrance: 'fragranced products', vitaminC: 'vitamin C', scrub: 'scrubs', exfoliant: 'exfoliants', acid: 'acids', retinoid: 'retinol (one night out of two)' },
      fr: { mask: 'les masques', fragrance: 'les produits parfumés', vitaminC: 'la vitamine C', scrub: 'les gommages', exfoliant: 'les exfoliants', acid: 'les acides', retinoid: 'le rétinol (un soir sur deux)' },
    }
    for (const r of sos?.schedule || []) {
      if (r.again || r.day <= sos.dayIndex) continue
      const date = new Date(sos.startedAt)
      date.setDate(date.getDate() + r.day)
      date.setHours(20, 30, 0, 0)
      await Notifications.scheduleNotificationAsync({
        identifier: `sos-back-${r.id}-${userId}`,
        content: { title: 'Skynkod', body: l === 'fr' ? `Ce soir, on réintroduit ${BACK.fr[r.id]} dans ta routine 🌿` : `Tonight, we bring back ${BACK.en[r.id]} into your routine 🌿`, sound: true, data: { screen: 'Home' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
      }).catch(() => {})
    }
    if (sos && sos.phase !== 'return') {
      for (let d = sos.dayIndex + 2; d <= 7; d += 1) {
        const date = new Date(sos.startedAt)
        date.setDate(date.getDate() + d - 1)
        date.setHours(9, 0, 0, 0)
        if (date <= new Date()) continue
        await Notifications.scheduleNotificationAsync({
          identifier: `sos-day-${d}-${userId}`,
          content: { title: 'Skynkod', body: SMART_TEXT.sos[l](d, sos.situation.title), sound: true, data: { screen: 'Emergency' } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
        }).catch(() => {})
      }
    }
  } catch (error) {
    console.warn('Smart reminders error:', error)
  }
}
