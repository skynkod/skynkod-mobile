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
// Every reminder, simple and useful (Lita, 2026-10-25): a title that says what
// it is, one line that says what to do. No emoji, no promise on the skin.
const COPY = {
  morning: {
    en: { title: 'Morning check-in', body: 'How is your skin today? Then your morning routine.' },
    fr: { title: 'Check-in du matin', body: 'Comment va ta peau aujourd’hui ? Puis ta routine du matin.' },
  },
  evening: {
    en: { title: 'Evening routine', body: 'Cleanse, then your evening routine.' },
    fr: { title: 'Routine du soir', body: 'Démaquillage, puis ta routine du soir.' },
  },
  eveningRamadan: {
    en: { title: 'Evening routine', body: 'Your evening routine, and enough water before bed.' },
    fr: { title: 'Routine du soir', body: 'Ta routine du soir, et pense à bien boire avant de dormir.' },
  },
  water: {
    en: { title: 'Water', body: 'Time for a glass of water.' },
    fr: { title: 'Eau', body: 'C’est le moment de boire un verre d’eau.' },
  },
  // The Rekod nights: what to put on tonight.
  exfoliation: {
    en: { title: 'Tonight: exfoliation', body: 'Your exfoliant, then your cream. No retinol tonight.' },
    fr: { title: 'Ce soir : exfoliation', body: 'Ton exfoliant, puis ta crème. Pas de rétinol ce soir.' },
  },
  retinoid: {
    en: { title: 'Tonight: retinol', body: 'Retinol on dry skin, then your cream.' },
    fr: { title: 'Ce soir : rétinol', body: 'Le rétinol sur peau sèche, puis ta crème.' },
  },
  azelaic: {
    en: { title: 'Tonight: azelaic acid', body: 'Azelaic acid, then your cream.' },
    fr: { title: 'Ce soir : acide azélaïque', body: 'L’acide azélaïque, puis ta crème.' },
  },
  gentle: {
    en: { title: 'Tonight: your treatment', body: 'Your gentle treatment, then your cream.' },
    fr: { title: 'Ce soir : ton traitement', body: 'Ton traitement doux, puis ta crème.' },
  },
  repair: {
    en: { title: 'Tonight: repair', body: 'Your repair serum, then your cream. No strong actives.' },
    fr: { title: 'Ce soir : réparation', body: 'Ton sérum réparateur, puis ta crème. Pas d’actif fort.' },
  },
  reset: {
    en: { title: 'Tonight: rest', body: 'Just cleanser and cream tonight.' },
    fr: { title: 'Ce soir : repos', body: 'Juste nettoyant et crème ce soir.' },
  },
  reacting: {
    en: { title: 'Tonight: gentle', body: 'Your skin is reacting: cleanser and cream only, no strong actives.' },
    fr: { title: 'Ce soir : douceur', body: 'Ta peau réagit : nettoyant et crème seulement, pas d’actif fort.' },
  },
  // The 7-day plan.
  sosMorning: {
    en: { title: (day, name) => `Day ${day} of 7 · ${name}`, body: 'Open your plan for today.' },
    fr: { title: (day, name) => `Jour ${day} sur 7 · ${name}`, body: 'Ouvre ton plan du jour.' },
  },
  sosEvening: {
    en: { title: 'Tonight: gentle', body: 'Cleanser and cream only, as in your plan.' },
    fr: { title: 'Ce soir : douceur', body: 'Nettoyant et crème seulement, comme prévu dans ton plan.' },
  },
  sosBack: {
    en: { title: 'Tonight: a product comes back', body: what => `Tonight, ${what} come back into your routine.` },
    fr: { title: 'Ce soir : un produit revient', body: what => `Ce soir, on réintroduit ${what} dans ta routine.` },
  },
  // Added to the morning reminder on their day.
  rekodReview: { en: 'Your Rekod review is ready.', fr: 'Ton bilan Rekod est prêt.' },
  dekodDay: { en: 'Time for your weekly Dekod scan.', fr: 'C’est le moment de ton scan Dekod de la semaine.' },
  patchTest: { en: 'Your patch test from yesterday: tell us how it went.', fr: 'Ton test d’hier : dis-nous comment ça s’est passé.' },
  purgeCheck: { en: 'Your spots after a new product: tell us how it’s going.', fr: 'Tes boutons après un nouveau produit : dis-nous comment ça va.' },
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


// Water: one gentle reminder at 15:00; 11:00 and 18:00 only if she asks (Notifications).
export const WATER_TIMES = [[15, 0], [11, 0], [18, 0]]
export const scheduleWaterReminders = async (userId, extra = false) => {
  const l = await lang()
  for (let i = 0; i < (extra ? 3 : 1); i += 1) {
    await scheduleDaily(`water-${i}-${userId}`, COPY.water[l].title, COPY.water[l].body, WATER_TIMES[i][0], WATER_TIMES[i][1], 'Home')
  }
}
export const cancelWaterReminders = async (userId) => {
  for (let i = 0; i < WATER_TIMES.length; i += 1) await Notifications.cancelScheduledNotificationAsync(`water-${i}-${userId}`).catch(() => {})
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
    const { getPurgeChecks } = await import('./purge-check')
    const { followUpDate } = await import('./purge-core')
    const { getPatchState } = await import('./patch-test')
    const { isShortTonight } = await import('./short-evening')
    const shortTonight = await isShortTonight(userId).catch(() => false)
    const { testMorning } = await import('./patch-core')
    const [rekod, sos, scans, premium, skin, routines, purges, patches] = await Promise.all([
      getRekodPlan(userId).catch(() => null),
      getActivePlan(userId).catch(() => null),
      getDekodResults(userId, 1).catch(() => []),
      isPremiumUser(userId).catch(() => false),
      currentSkinState(userId).catch(() => null),
      getUserRoutines(userId).catch(() => null),
      getPurgeChecks(userId).catch(() => ({})),
      getPatchState(userId).catch(() => ({})),
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
    const once = (id, { title, body }, date, screen) => (date > now ? Notifications.scheduleNotificationAsync({
      identifier: id, content: { title, body, sound: true, data: { screen } },
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
    const BACK_WHAT = {
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
    // "Purging or a reaction?": the 4- and 8-week follow-ups, in the morning reminder of their day.
    const purgeDates = Object.values(purges || {}).map(followUpDate).filter(Boolean)
    // "New product" mode: the morning after a patch test.
    const patchDates = Object.values(patches?.tests || {}).filter(x => !x.result).map(testMorning)

    for (let d = 0; d < DAYS_AHEAD; d += 1) {
      const date = dayOf(d)
      const sd = sosDay(date)
      // Morning.
      const extras = [
        date.getDay() === 0 && scans?.length && premium ? COPY.dekodDay[l] : null,
        reviewDue(date) ? COPY.rekodReview[l] : null,
        purgeDates.some(f => sameDay(f, date)) ? COPY.purgeCheck[l] : null,
        patchDates.some(f => sameDay(f, date)) ? COPY.patchTest[l] : null,
      ].filter(Boolean)
      if (sos && sos.phase !== 'return' && sd >= 0 && sd < 7) await once(`am-${d}-${userId}`, { title: COPY.sosMorning[l].title(sd + 1, sos.situation.title), body: COPY.sosMorning[l].body }, at(date, hm(prefs.morningTime)), 'Emergency')
      else if (prefs.morningReminder) await once(`am-${d}-${userId}`, { title: COPY.morning[l].title, body: [COPY.morning[l].body, ...extras].join(' ') }, at(date, hm(prefs.morningTime)), 'Home')
      else if (extras.length) await once(`am-${d}-${userId}`, { title: 'Skynkod', body: extras.join(' ') }, at(date, [10, 0]), 'Home')
      // Evening.
      let body = null
      let screen = 'Home'
      if (sos && sd >= 0 && sd <= sosLast) body = back[sd] ? { title: COPY.sosBack[l].title, body: COPY.sosBack[l].body(BACK_WHAT[l][back[sd]]) } : COPY.sosEvening[l]
      else if (prefs.eveningReminder && rekod) {
        const night = rekodNight(date)
        const strong = night === 'retinoid' || night === 'exfoliation'
        const treatment = treatmentOnDate(rekod, date, now)
        body = d === 0 && strong && reactingToday ? COPY.reacting[l] : COPY[night === 'retinoid' && treatment !== 'retinol' ? treatment : night][l]
        screen = 'Rekod'
      } else if (prefs.eveningReminder) body = (d === 0 && reactingToday ? COPY.reacting : ramadanDay(date) ? COPY.eveningRamadan : COPY.evening)[l]
      // "Short version tonight" already chosen: no reminder about tonight's actives.
      if (d === 0 && shortTonight) body = null
      if (body) await once(`pm-${d}-${userId}`, body, at(date, hm(prefs.eveningTime)), screen)
    }

    // Water: one at 15:00, the other two only if she asked for them.
    if (prefs.waterReminder) await scheduleWaterReminders(userId, prefs.waterExtra)
  } catch (error) {
    console.warn('Reminders error:', error)
  }
}
