import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, RefreshControl, Pressable, Image, ImageBackground, Platform, Dimensions, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getJournalEntries } from '../utils/journal-service';
import { getUserRoutines } from '../utils/routines-service';
import { useAuth } from '../utils/AuthContext';
import { useLanguage } from '../utils/LanguageContext';
import { useFirstName } from '../utils/useFirstName';
import { useTheme } from '../utils/ThemeContext';
import { useSkinProfile } from '../utils/useSkinProfile';
import { dermatologistAdvice } from '../utils/dermatologist';
import { todaySteps } from '../utils/routine-checks';
import { logStep, syncTodayTicks } from '../utils/routine-log';
import { markOpenedIfNeeded, shelfLife } from '../utils/shelf-life';
import { getActivePlan, adjustForPlan } from '../utils/emergency-state';
import { situationFromCheckIn, MOODS, saveDay } from '../utils/journal-day';
import { logError } from '../utils/errorLogger';
import { track } from '../utils/analytics';
import { getRekodPlan, tonightNight, NIGHTS, goalOf, weekOf } from '../utils/rekod';
import { getSkinWeather, pickSkinTips, getWeatherNow } from '../utils/skin-weather';
import { ramadanDay, ramadanTip } from '../utils/ramadan';
import { SEASONS, currentSeason, previousSeason, seasonDailyTip, shouldShowSeasonCard, dismissSeasonCard, getArchivedRoutines, archiveCurrentRoutines, restoreSeasonRoutines, labelRoutines, shouldAskSeasonLabel, declineSeasonLabel } from '../utils/seasons';
import MorningCheckIn from '../components/MorningCheckIn';
import Glass from '../components/Glass';
import Moon from '../components/Moon';
import { getProductsByIds, getNewestProductId, getMyProducts, photoOf } from '../utils/catalog';
import { useColors } from '../components/ui';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

const KODA = require('../assets/images/koda-logo.png');
// Photo: Unsplash (photo-1460411794035-42aac080490a, "cloudy sky"), Unsplash License.
const SKY = require('../assets/images/home-sky.jpg');
// Photo: Unsplash (photo-1618814941106-07c927b7078d, lavender sky with a crescent moon), Unsplash License.
const NIGHT_SKY = require('../assets/images/home-night.jpg');
// Deep plum from the logo family, for text over the light clouds.
const INK = '#4A2F42';

const SHORTCUTS = [
  { label: 'My routines', icon: 'water-outline', to: 'Routines' },
  { label: 'My products', icon: 'flask-outline', to: 'Products' },
  { label: 'My Skynbudget', icon: 'wallet-outline', to: 'Budget' },
  { label: 'Skyncyclopedia', icon: 'library-outline', to: 'Skyncyclopedia' },
];

// Same storage key as the Routines screen, so ticks are shared.
const doneKey = (userId, period) => `routine_done_${userId}_${period}_${new Date().toDateString()}`;

// Koda's one-line tip from the latest check-in (last 3 days).
// Without a check-in, Koda shares a gentle tip of the day.
const DAILY_TIPS = [
  "Don't skip SPF, even when it's cloudy.",
  'Pat your skin dry, never rub.',
  'Lukewarm water is kinder to your skin than hot.',
  'One new product at a time, two weeks apart.',
  'Change your pillowcase often, your skin will thank you.',
  'A pea-sized amount of retinol is enough for the whole face.',
  'Drinking water helps, but your moisturizer does the real work.',
];

const kodaTip = (entries) => {
  const latest = entries.find(e => e?.date && Date.now() - new Date(e.date).getTime() <= 3 * 86400000);
  if (!latest?.mood) return DAILY_TIPS[Math.floor(Date.now() / 86400000) % DAILY_TIPS.length];
  // Today's answers first (mood and tags), then the levels saved with them.
  const tags = latest.skin_conditions || [];
  const has = list => list.some(tag => tags.includes(tag));
  if (has(['Redness', 'Itchiness / Sensitivity', 'Peeling / Flaking']) || (latest.redness_level ?? 0) >= 6 || (latest.barrier_health ?? 10) <= 4) return 'Your skin looks a bit sensitized. Skip exfoliation tonight.';
  if (has(['New pimple']) || (latest.acne_level ?? 0) >= 6) return 'Breakouts are up. Keep it gentle and avoid picking.';
  if (has(['Dryness']) || (latest.hydration_level ?? 10) <= 4) return 'Your skin seems thirsty. Add a hydrating serum today.';
  if (['bad', 'terrible'].includes(latest.mood)) return 'A rough day for your skin. Keep your routine short and gentle, no new products.';
  if (latest.mood === 'okay') return "A steady day. Keep your routine simple and don't skip SPF.";
  return "Your skin is doing well. Stay consistent and don't skip SPF.";
};

// Home keeps to the essentials: search, the routine for right now (by the
// real sunrise/sunset) one step at a time, and one tip from Koda.
export default function HomeScreen({ navigation }) {
  const colors = useColors();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const firstName = useFirstName(user?.id);
  const { isNight, isDark, coords, updateLocation } = useTheme();
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(Dimensions.get('window').height * 0.8);
  // The first screen: about half for the greeting, the rest for the first sections.
  const introHeight = Math.round(Dimensions.get('window').height * 0.5);
  const scrollRef = useRef(null);
  // Once the greeting starts to scroll away, a slim frosted header appears in full
  // (never half-transparent over the sky, even when the page is short).
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const [headerOn, setHeaderOn] = useState(false);
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => setHeaderOn(on => (value > introHeight * 0.3) !== on ? !on : on));
    return () => scrollY.removeListener(id);
  }, [scrollY, introHeight]);
  useEffect(() => {
    Animated.timing(headerFade, { toValue: headerOn ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [headerOn, headerFade]);
  const [routineY, setRoutineY] = useState(0);
  const [rekod, setRekod] = useState(null);
  const [bodyY, setBodyY] = useState(0);
  const [justPicked, setJustPicked] = useState(false);
  const period = isNight ? 'evening' : 'morning';
  const [routine, setRoutine] = useState(null);
  // A running Emergency plan pauses some products in today's routine.
  const [plan, setPlan] = useState(null);
  const [routineProducts, setRoutineProducts] = useState({});
  const [newestId, setNewestId] = useState(null);
  const [done, setDone] = useState({});
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const profile = useSkinProfile(user?.id);
  const [dermHiddenUntil, setDermHiddenUntil] = useState(null);
  const [dermOpen, setDermOpen] = useState(false);
  const [checkInSkipped, setCheckInSkipped] = useState(false);
  const [shelf, setShelf] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  // The season, and its card on Home during the season's first week.
  const season = currentSeason(new Date(), coords?.latitude ?? null);
  const [seasonCard, setSeasonCard] = useState(null); // null | { archived }
  const [seasonBusy, setSeasonBusy] = useState(false);
  useEffect(() => {
    if (!user?.id) return;
    shouldShowSeasonCard(user.id, season)
      .then(async show => {
        if (!show) return setSeasonCard(null);
        const archived = await getArchivedRoutines(user.id, season.id).catch(() => ({}));
        setSeasonCard({ archived });
      })
      .catch(() => {});
  }, [user?.id, season.id]);
  // No season on the current routine yet: ask whether it's this season's.
  const [askLabel, setAskLabel] = useState(false);
  useEffect(() => {
    if (!user?.id || seasonCard) return setAskLabel(false);
    shouldAskSeasonLabel(user.id, season).then(setAskLabel).catch(() => {});
  }, [user?.id, season.id, !!seasonCard, routine?.id]);
  const answerLabel = async (yes) => {
    setAskLabel(false);
    if (yes) await labelRoutines(user.id, season.id).catch(error => logError('Home_seasonLabel', error, {}, 'warn'));
    else declineSeasonLabel(user.id, season);
  };
  const closeSeasonCard = () => {
    dismissSeasonCard(user.id, season);
    setSeasonCard(null);
  };
  const newSeasonRoutine = async () => {
    setSeasonBusy(true);
    try {
      await archiveCurrentRoutines(user.id, previousSeason(season.id));
      await labelRoutines(user.id, season.id);
      closeSeasonCard();
      const res = await getUserRoutines(user.id);
      const morning = (res.success ? res.data : []).find(r => r.type === 'morning');
      navigation.navigate('RoutineBuilder', { period: 'morning', startedAt: Date.now(), editSteps: morning?.steps || null });
    } catch (error) {
      logError('Home_seasonNew', error, {}, 'warn');
    } finally {
      setSeasonBusy(false);
    }
  };
  const bringBackSeasonRoutine = async () => {
    setSeasonBusy(true);
    try {
      await restoreSeasonRoutines(user.id, season, seasonCard.archived);
      closeSeasonCard();
      load();
    } catch (error) {
      logError('Home_seasonRestore', error, {}, 'warn');
    } finally {
      setSeasonBusy(false);
    }
  };

  // Today's local weather, for the skin weather line under the name.
  const [skyToday, setSkyToday] = useState(null);
  // And the weather right now: temperature, sky, humidity, UV.
  const [weatherNow, setWeatherNow] = useState(null);
  // The skin tips take turns every 4 seconds when there are several.
  const [tipStep, setTipStep] = useState(0);
  const tipFade = useRef(new Animated.Value(1)).current;
  const tipCount = skyToday ? Math.max(1, pickSkinTips(skyToday.weather, profile, skyToday.city).length) : 1;
  useEffect(() => {
    if (tipCount < 2) return;
    const id = setInterval(() => {
      Animated.timing(tipFade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setTipStep(step => step + 1);
        Animated.timing(tipFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => clearInterval(id);
  }, [tipCount]);
  // Beside the date, the sky then the temperature, in turn every 2 seconds.
  const [weatherStep, setWeatherStep] = useState(0);
  const weatherFade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!weatherNow) return;
    const id = setInterval(() => {
      Animated.timing(weatherFade, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setWeatherStep(step => (step + 1) % 2);
        Animated.timing(weatherFade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      });
    }, 2000);
    return () => clearInterval(id);
  }, [!!weatherNow]);
  useEffect(() => {
    getSkinWeather(coords).then(setSkyToday).catch(error => logError('Home_weather', error, {}, 'warn'));
    getWeatherNow(coords).then(setWeatherNow).catch(error => logError('Home_weatherNow', error, {}, 'warn'));
  }, [coords?.latitude, coords?.longitude, loaded]);

  useEffect(() => {
    updateLocation();
  }, []);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [routines, ticks, journal, dermHidden, skipped] = await Promise.all([
      getUserRoutines(user.id),
      AsyncStorage.getItem(doneKey(user.id, period)).catch(() => null),
      getJournalEntries(user.id, 14),
      AsyncStorage.getItem(`skynkod_derm_hidden_${user.id}`).catch(() => null),
      AsyncStorage.getItem(`skynkod_checkin_skip_${user.id}_${new Date().toDateString()}`).catch(() => null),
    ]);
    const mine = routines.success ? (routines.data || []).find(r => r.type === period && Array.isArray(r.steps) && r.steps.length) : null;
    setRoutine(mine || null);
    // Following a Rekod: the evening card names tonight's night (Repair, Reset…).
    getRekodPlan(user.id).then(setRekod).catch(() => setRekod(null));
    const active = await getActivePlan(user.id);
    setPlan(active);
    if (active && mine) {
      const [products, newest] = await Promise.all([
        getProductsByIds(mine.steps.map(s => s.product_id).filter(Boolean)).catch(() => []),
        active.situation.pause.includes('newest') ? getNewestProductId(user.id).catch(() => null) : null,
      ]);
      setRoutineProducts(Object.fromEntries(products.map(p => [p.id, p])));
      setNewestId(newest);
    }
    setDone(JSON.parse(ticks || '{}'));
    const allRoutines = routines.success ? routines.data || [] : [];
    syncTodayTicks(user.id, Object.fromEntries(allRoutines.map(r => [r.type, r.id])));
    if (journal.success) setEntries(journal.data || []);
    setDermHiddenUntil(Number(dermHidden) || null);
    setCheckInSkipped(!!skipped);
    getMyProducts(user.id).then(rows => setShelf(rows.filter(r => r.status === 'owned'))).catch(() => {});
    setLoaded(true);
  }, [user?.id, period]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Only the products scheduled for today (e.g. exfoliant twice a week).
  const adjusted = adjustForPlan(todaySteps(routine?.steps || []), routineProducts, plan, newestId);
  const steps = adjusted.steps;
  const doneCount = steps.filter((_, idx) => done[idx]).length;
  const currentIdx = steps.findIndex((_, idx) => !done[idx]);
  const current = currentIdx >= 0 ? steps[currentIdx] : null;

  const markDone = async () => {
    if (currentIdx < 0) return;
    const next = { ...done, [currentIdx]: true };
    setDone(next);
    await AsyncStorage.setItem(doneKey(user.id, period), JSON.stringify(next)).catch(() => {});
    logStep({ userId: user.id, routineId: routine?.id, type: period, stepIndex: currentIdx, done: true });
    track('routine_step', { period });
    if (steps.every((_, idx) => next[idx])) track('routine_done', { period });
    markOpenedIfNeeded(user.id, current?.product_id).catch(() => {});
  };

  const undoLast = async () => {
    const last = [...steps.keys()].reverse().find(idx => done[idx]);
    if (last === undefined) return;
    const next = { ...done, [last]: false };
    setDone(next);
    await AsyncStorage.setItem(doneKey(user.id, period), JSON.stringify(next)).catch(() => {});
    logStep({ userId: user.id, routineId: routine?.id, type: period, stepIndex: last, done: false });
  };

  // "See a dermatologist" when skincare isn't enough; hidden for a while once read.
  // Today's check-in can point to an Emergency plan.
  const todayEntry = entries.find(e => e?.date && new Date(e.date).toDateString() === new Date().toDateString());
  const suggestion = !plan ? situationFromCheckIn(todayEntry) : null;
  // A great or good morning with nothing ticked: no need to offer Emergency mode.
  const skinIsFine = (todayEntry?.mood === 'great' || todayEntry?.mood === 'good') && !(todayEntry?.skin_conditions || []).some(tag => ['New pimple', 'Redness', 'Dryness', 'Itchiness / Sensitivity', 'Peeling / Flaking'].includes(tag));
  // Consecutive days with a check-in, ending today or yesterday.
  const checkInStreak = (() => {
    const days = new Set(entries.filter(e => e?.mood).map(e => new Date(e.date).toDateString()));
    const d = new Date();
    if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
    let n = 0;
    while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
    return n;
  })();
  // The product most in need of replacing (expired first, then soonest).
  const toReplace = shelf
    .map(row => ({ row, life: shelfLife(row) }))
    .filter(x => x.life.status === 'expired' || x.life.status === 'soon')
    .sort((a, b) => a.life.daysLeft - b.life.daysLeft)[0];
  const derm = dermatologistAdvice(profile, entries);
  const showDerm = derm && (!dermHiddenUntil || Date.now() > dermHiddenUntil);
  const hideDerm = async () => {
    const until = Date.now() + (derm?.level === 'recommended' ? 7 : 30) * 86400000;
    setDermHiddenUntil(until);
    await AsyncStorage.setItem(`skynkod_derm_hidden_${user.id}`, String(until)).catch(() => {});
  };

  const build = () => navigation.navigate('RoutineBuilder', { period, startedAt: Date.now() });
  const greeting = isNight ? t('Good evening') : t('Good morning');

  // Mood from the hero: one tap saves today's entry (same as the Journal).
  const pickMood = async (value) => {
    setJustPicked(true);
    const optimistic = { ...(todayEntry || {}), date: new Date().toISOString(), mood: value, skin_conditions: todayEntry?.skin_conditions || [] };
    setEntries(prev => [optimistic, ...prev.filter(e => e !== todayEntry)]);
    try {
      const id = await saveDay(user.id, new Date(), { mood: value, tags: optimistic.skin_conditions, notes: todayEntry?.notes || '' }, todayEntry?.id);
      setEntries(prev => [{ ...optimistic, id }, ...prev.filter(e => e !== optimistic)]);
    } catch (error) {
      logError('Home_mood', error, {}, 'warn');
    }
  };
  const skipCheckIn = async () => {
    setCheckInSkipped(true);
    await AsyncStorage.setItem(`skynkod_checkin_skip_${user.id}_${new Date().toDateString()}`, '1').catch(() => {});
  };

  const askMood = !isNight && loaded && !checkInSkipped && !todayEntry?.mood;
  const ritual = period === 'morning' ? t('morning ritual') : t('evening ritual');
  const scrollToRoutine = () => scrollRef.current?.scrollTo({ y: Math.max(0, routineY - insets.top - 78), animated: true });

  // The hero's single line and single action.
  let line = null;
  let action = null;
  if (askMood) {
    line = t('How is your skin this morning?');
  } else if (loaded && !routine) {
    line = t("Let's create your {ritual}.", { ritual });
    action = { label: t('Begin'), onPress: build };
  } else if (current) {
    line = doneCount
      ? t('Your {ritual} · step {n} of {total}', { ritual, n: currentIdx + 1, total: steps.length })
      : t('Your {ritual} awaits · {total} steps', { ritual, total: steps.length });
    action = { label: doneCount ? t('Continue') : t('Begin'), onPress: scrollToRoutine };
  }


  // White over the sky: the text sits on its deeper top part.
  const ink = '#FFFFFF';
  const weatherTips = skyToday ? pickSkinTips(skyToday.weather, profile, skyToday.city) : [];
  // Calm weather: a Ramadan tip during the month, otherwise a season tip.
  const ramadan = ramadanDay();
  const calmTip = ramadan ? ramadanTip(ramadan, false) : seasonDailyTip(season.id);
  // Several weather tips today: they take turns in the pill.
  const dayTips = skyToday ? (weatherTips.length ? weatherTips : [calmTip]) : [];
  const weatherTip = dayTips.length ? dayTips[tipStep % dayTips.length] : null;
  // After iftar the evening is when Ramadan tips matter most.
  const eveningTip = isNight && ramadan ? ramadanTip(ramadan, true) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING.xxxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
      >
        {/* The calm hero: the sky, the greeting, one thing to do */}
        {/* The sky sits behind the top of the page; the sections float over it as glass */}
        <View>
        <ImageBackground source={isNight || isDark ? NIGHT_SKY : SKY} resizeMode="cover" style={[styles.sky, { height: heroHeight }]}>
          <Svg style={styles.fade} width="100%" height={heroHeight * 0.5}>
            <Defs>
              <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.bg} stopOpacity="0" />
                <Stop offset="0.6" stopColor={colors.bg} stopOpacity="0.55" />
                <Stop offset="1" stopColor={colors.bg} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#fade)" />
          </Svg>
        </ImageBackground>

          {/* Date and bell on top, the greeting centred in the space above the sections */}
          <View style={{ minHeight: introHeight }}>
          {/* Tonight's real moon, in its true shape, on the lavender sky */}
          {isNight || isDark ? (
            <View pointerEvents="none" style={[styles.moon, { top: insets.top + 64 }]}>
              <Moon size={58} />
            </View>
          ) : null}
          <View style={[styles.topBar, { paddingTop: insets.top + SPACING.sm }]}>
            {/* The date, and the weather right now in small beside it */}
            <View style={styles.dateRow}>
              <Text style={styles.date}>
                {new Date().toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
              {weatherNow ? (
                <>
                  <Text style={styles.dateDot}>·</Text>
                  <Ionicons name={weatherNow.icon} size={13} color="#FFFFFF" />
                  <Animated.Text style={[styles.dateWeather, { opacity: weatherFade }]}>
                    {weatherStep === 0 ? t(weatherNow.label) : `${weatherNow.temp}°`}
                  </Animated.Text>
                </>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <Pressable onPress={() => navigation.navigate('Alerts')} style={styles.glass} accessibilityLabel={t('Notifications')}>
                <Ionicons name="notifications-outline" size={19} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          <View style={[styles.heroTop, { paddingBottom: Math.round(introHeight * 0.3) }]}>
            <Text style={[styles.hello, { color: ink }]}>{greeting}{firstName ? ',' : ''}</Text>
            {firstName ? <Text style={[styles.name, { color: ink }]}>{firstName}</Text> : null}
            {/* Skin weather: the day's one tip from the local weather (daytime only) */}
            {(isNight ? eveningTip : weatherTip) ? (
              <Glass radius={999} style={styles.linePill}>
                <Animated.View style={[styles.lineRow, { opacity: isNight ? 1 : tipFade }]}>
                  <Ionicons name={(isNight ? eveningTip : weatherTip).icon} size={15} color={isDark ? colors.text : INK} />
                  <Text style={[styles.line, { color: isDark ? colors.text : INK, flexShrink: 1 }]}>{t((isNight ? eveningTip : weatherTip).text)}</Text>
                </Animated.View>
              </Glass>
            ) : null}
            {/* The line sits on a frosted pill so it reads the same over light and deep parts of the sky */}
            {line ? (
              <Glass radius={999} style={styles.linePill}>
                <View style={styles.lineRow}>
                  <Text style={[styles.line, { color: isDark ? colors.text : INK }]}>{line}</Text>
                </View>
              </Glass>
            ) : null}

            {askMood ? (
              <>
                <View style={styles.moods}>
                  {MOODS.map(m => (
                    <Pressable key={m.value} onPress={() => pickMood(m.value)} style={({ pressed }) => [styles.mood, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)', transform: [{ scale: pressed ? 0.94 : 1 }] }]} accessibilityLabel={t(m.label)}>
                      <MaterialCommunityIcons name={m.icon} size={26} color={isDark ? colors.text : colors.primary} />
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={skipCheckIn} hitSlop={10} style={{ marginTop: SPACING.md }}>
                  <Text style={[TYPE.caption, { color: 'rgba(255,255,255,0.85)' }]}>{t('Not now')}</Text>
                </Pressable>
              </>
            ) : null}

            {action ? (
              <Pressable onPress={action.onPress} style={({ pressed }) => [styles.begin, { backgroundColor: '#FFFFFF', opacity: pressed ? 0.88 : 1 }]}>
                <Text style={[styles.beginText, { color: INK }]}>{action.label}</Text>
                <Ionicons name="arrow-forward" size={16} color={INK} />
              </Pressable>
            ) : null}

          </View>
          </View>

        <View style={styles.body} onLayout={e => setBodyY(e.nativeEvent.layout.y)}>
          {/* Search; the scan icon goes straight to the camera */}
          <View style={styles.searchRow}>
            <Glass radius={999} style={{ flex: 1 }}>
            <Pressable
              onPress={() => navigation.navigate('Search')}
              style={styles.searchBar}
              accessibilityRole="search"
            >
              <Ionicons name="search" size={18} color={colors.muted} />
              <Text style={[TYPE.body, { color: colors.muted, flex: 1 }]}>{t('Search a product or ingredient')}</Text>
              <Pressable onPress={() => navigation.navigate('Scanner')} hitSlop={12} accessibilityLabel={t('Scan a product')}>
                <Ionicons name="scan-outline" size={22} color={colors.primary} />
              </Pressable>
            </Pressable>
            </Glass>
          </View>

          {/* The current routine has no season yet: is it this season's? */}
          {askLabel && !seasonCard ? (
            <Glass style={styles.card}>
              <View style={styles.cardIn}>
                <View style={styles.seasonHead}>
                  <Ionicons name={SEASONS[season.id].icon} size={20} color={colors.primary} />
                  <Text style={[styles.seasonTitle, { color: colors.text, flex: 1 }]}>
                    {t('Is this your {season} routine?', { season: t(SEASONS[season.id].label).toLowerCase() })}
                  </Text>
                </View>
                <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.sm }]}>
                  {t('Save your current routine for this season. Next year, Skynkod will offer it back when the season returns.')}
                </Text>
                <Pressable onPress={() => answerLabel(true)} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
                  <Text style={[styles.primaryText, { color: colors.onPrimary }]}>{t("Yes, it's my {season} routine", { season: t(SEASONS[season.id].label).toLowerCase() })}</Text>
                </Pressable>
                <Pressable onPress={() => answerLabel(false)} hitSlop={8} style={{ alignSelf: 'center', marginTop: SPACING.md }}>
                  <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '600' }]}>{t('Not really')}</Text>
                </Pressable>
              </View>
            </Glass>
          ) : null}

          {/* A new season: tips, and the offer of a routine for it */}
          {seasonCard ? (
            <Glass style={styles.card}>
              <View style={styles.cardIn}>
                <View style={styles.seasonHead}>
                  <Ionicons name={SEASONS[season.id].icon} size={20} color={colors.primary} />
                  <Text style={[styles.seasonTitle, { color: colors.text }]}>{t(SEASONS[season.id].title)}</Text>
                </View>
                {SEASONS[season.id].tips.map(tip => (
                  <View key={tip} style={styles.seasonTip}>
                    <View style={[styles.seasonDot, { backgroundColor: colors.primary }]} />
                    <Text style={[TYPE.body, { color: colors.text, flex: 1 }]}>{t(tip)}</Text>
                  </View>
                ))}
                {seasonCard.archived?.morning?.length || seasonCard.archived?.evening?.length ? (
                  <>
                    <Pressable disabled={seasonBusy} onPress={bringBackSeasonRoutine} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary, opacity: pressed || seasonBusy ? 0.8 : 1 }]}>
                      <Text style={[styles.primaryText, { color: colors.onPrimary }]}>{t('Bring back my {season} routine', { season: t(SEASONS[season.id].label).toLowerCase() })}</Text>
                    </Pressable>
                    <Pressable disabled={seasonBusy} onPress={newSeasonRoutine} hitSlop={8} style={{ alignSelf: 'center', marginTop: SPACING.md }}>
                      <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Create a new one instead')}</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable disabled={seasonBusy} onPress={newSeasonRoutine} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary, opacity: pressed || seasonBusy ? 0.8 : 1 }]}>
                    <Text style={[styles.primaryText, { color: colors.onPrimary }]}>{t('Create my {season} routine', { season: t(SEASONS[season.id].label).toLowerCase() })}</Text>
                  </Pressable>
                )}
                <Pressable onPress={closeSeasonCard} hitSlop={8} style={{ alignSelf: 'center', marginTop: SPACING.md }}>
                  <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '600' }]}>{t('Keep my routine')}</Text>
                </Pressable>
              </View>
            </Glass>
          ) : null}

          {plan ? (
            <Pressable onPress={() => navigation.navigate('Emergency')} style={[styles.soft, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="medkit-outline" size={18} color={colors.primary} />
              <Text style={[TYPE.bodyStrong, { color: colors.primary, flex: 1 }]}>
                {t('Day {n} of 7', { n: plan.dayIndex + 1 })} · {t(plan.situation.title)}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </Pressable>
          ) : null}

          {/* After the mood in the sky: what's going on today (same entry as the Journal) */}
          {!isNight && loaded && !checkInSkipped && todayEntry?.mood ? (
            <Glass style={{ marginTop: SPACING.lg }}>
            <MorningCheckIn
              glass
              key={justPicked ? 'picked' : 'today'}
              startExpanded={justPicked}
              userId={user?.id}
              entry={todayEntry}
              streak={checkInStreak}
              onSaved={saved => setEntries(prev => [saved, ...prev.filter(e => e.id !== saved.id && e !== todayEntry)])}
              onOpenJournal={() => navigation.navigate('Journal')}
            />
            </Glass>
          ) : null}

          {/* The routine, one step at a time */}
          {routine && current ? (
            <Glass style={styles.card}>
            <View onLayout={e => setRoutineY(e.nativeEvent.layout.y + bodyY)} style={styles.cardIn}>
              <View style={styles.cardHead}>
                <Pressable disabled={!rekod} onPress={() => navigation.navigate('Rekod')} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.overline, { color: colors.primary }]}>{period === 'morning' ? t('THIS MORNING') : rekod ? `${t('TONIGHT')} · ${t(NIGHTS[tonightNight(rekod)].short).toUpperCase()}` : t('TONIGHT')}</Text>
                </Pressable>
                <Pressable onPress={() => navigation.navigate('Routines', { tab: period })} hitSlop={10}>
                  <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '600' }]}>
                    {t('{done} of {total}', { done: doneCount, total: steps.length })}
                  </Text>
                </Pressable>
              </View>
              {adjusted.paused.length ? (
                <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 6 }]}>
                  {t('Paused during your plan:')} {adjusted.paused.map(p => p.step.product).join(', ')}
                </Text>
              ) : null}
              <View style={styles.dots}>
                {steps.map((_, idx) => (
                  <View key={idx} style={[styles.dot, { backgroundColor: done[idx] ? colors.accent : idx === currentIdx ? colors.primary : colors.border }]} />
                ))}
              </View>
              <View style={styles.stepRow}>
                {photoOf(current) ? (
                  <Image source={{ uri: photoOf(current) }} style={styles.photo} resizeMode="contain" />
                ) : (
                  <View style={[styles.photo, styles.noPhoto, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name="water-outline" size={24} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.overline, { color: colors.muted }]}>
                    {t('Step {n}', { n: currentIdx + 1 })} · {t(current.action)}
                  </Text>
                  <Text style={[styles.product, { color: colors.text }]} numberOfLines={2}>{current.product}</Text>
                </View>
              </View>
              <Pressable onPress={markDone} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}>
                <Ionicons name="checkmark" size={18} color={colors.onPrimary} />
                <Text style={[styles.primaryText, { color: colors.onPrimary }]}>
                  {currentIdx === steps.length - 1 ? t('Done, routine finished') : t('Done, next step')}
                </Text>
              </Pressable>
              {doneCount > 0 ? (
                <Pressable onPress={undoLast} hitSlop={10} style={{ alignSelf: 'center', marginTop: SPACING.md }}>
                  <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '600' }]}>{t('Undo last step')}</Text>
                </Pressable>
              ) : null}
            </View>
            </Glass>
          ) : null}

          {routine && !current && steps.length ? (
            <Pressable
              onPress={() => navigation.navigate('Routines', { tab: period })}
              onLongPress={undoLast}
              style={[styles.doneLine, { backgroundColor: colors.successSoft }]}
            >
              <View style={[styles.doneIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
              <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>
                {period === 'morning' ? t('Morning routine done') : t('Night routine done')}
                <Text style={{ color: colors.textSecondary, fontWeight: '400' }}>
                  {'  ·  '}{period === 'morning' ? t('see you tonight') : t('sleep well')} {period === 'morning' ? '☀️' : '🌙'}
                </Text>
              </Text>
            </Pressable>
          ) : null}

          {/* Rekod: the premium programme. Members see it in their routine; others get one invitation. */}
          {loaded && !rekod ? (
            <Pressable onPress={() => navigation.navigate('Rekod')} style={({ pressed }) => [styles.rekodCard, { opacity: pressed ? 0.9 : 1 }]}>
              <Ionicons name="sparkles-outline" size={28} color="#FFFFFF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rekodKicker}>{t('PREMIUM · SKIN PROGRAMME')}</Text>
                <Text style={styles.rekodTitle}>{t('Your skin programme, made for you')}</Text>
                <Text style={styles.rekodText}>{t('Tell us your goal, get a routine of proven actives and a plan week by week.')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#E2C6DA" />
            </Pressable>
          ) : null}

          {/* A member: a slim card back into her programme. */}
          {loaded && rekod ? (
            <Pressable onPress={() => navigation.navigate('Rekod')} style={({ pressed }) => [styles.rekodCard, { paddingVertical: SPACING.md, opacity: pressed ? 0.9 : 1 }]}>
              <Ionicons name="sparkles-outline" size={22} color="#FFFFFF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rekodKicker}>{t('MY PROGRAMME')}</Text>
                <Text style={[styles.rekodTitle, { fontSize: 15 }]}>
                  {t(goalOf(rekod.goal).title)} · {t('Week {n} of {total}', { n: Math.min(weekOf(rekod), goalOf(rekod.goal).weeks), total: goalOf(rekod.goal).weeks })}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#E2C6DA" />
            </Pressable>
          ) : null}

          {/* Emergency mode: a smart card when today's check-in shows a problem,
              otherwise a discreet line. Hidden while a plan runs (banner above). */}
          {!plan && suggestion ? (
            <Pressable
              onPress={() => navigation.navigate('Emergency', { situation: suggestion.id, openedAt: Date.now() })}
              style={({ pressed }) => [styles.sosCard, { backgroundColor: colors.dangerSoft, opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="medkit-outline" size={20} color={colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(suggestion.text)}</Text>
                <Text style={[TYPE.caption, { color: colors.danger, fontWeight: '700', marginTop: 2 }]}>{t('Start a 7-day plan')} →</Text>
              </View>
            </Pressable>
          ) : null}
          {!plan && !suggestion && loaded && !skinIsFine ? (
            <View style={[styles.sosInvite, { backgroundColor: colors.primarySoft }]}>
              <View style={styles.sosHead}>
                <View style={[styles.sosIcon, { backgroundColor: colors.card }]}>
                  <Ionicons name="medkit" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Skin acting up?')}</Text>
                  <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 17 }]}>
                    {t('Get a 7-day plan to calm, repair or prepare your skin.')}
                  </Text>
                </View>
              </View>
              <View style={styles.sosChips}>
                {[
                  { id: 'breakout', label: 'Breakout', icon: 'ellipse' },
                  { id: 'irritation', label: 'Redness', icon: 'flower-outline' },
                  { id: 'event', label: 'Big event soon', icon: 'sparkles' },
                ].map(c => (
                  <Pressable
                    key={c.id}
                    onPress={() => navigation.navigate('Emergency', { situation: c.id, openedAt: Date.now() })}
                    style={({ pressed }) => [styles.sosChip, { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 }]}
                  >
                    <Ionicons name={c.icon} size={13} color={colors.primary} />
                    <Text style={[TYPE.caption, { color: colors.text, fontWeight: '700' }]}>{t(c.label)}</Text>
                  </Pressable>
                ))}
                <Pressable onPress={() => navigation.navigate('Emergency')} hitSlop={8} style={styles.sosAll}>
                  <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('See all')} →</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {toReplace ? (
            <Pressable onPress={() => navigation.navigate('Products')} style={[styles.replace, { backgroundColor: toReplace.life.status === 'expired' ? colors.dangerSoft : colors.warningSoft }]}>
              <Ionicons name="hourglass-outline" size={20} color={toReplace.life.status === 'expired' ? colors.danger : colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={[TYPE.bodyStrong, { color: colors.text }]} numberOfLines={1}>{toReplace.row.product?.name || toReplace.row.product_name}</Text>
                <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  {toReplace.life.openedMonths !== null ? `${t('Open for {n} months', { n: toReplace.life.openedMonths })} · ` : ''}
                  {toReplace.life.status === 'expired' ? t('time to replace it') : t('replace it soon')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
          ) : null}

          {showDerm ? (
            <View style={[styles.derm, { backgroundColor: derm.level === 'recommended' ? colors.dangerSoft : colors.surface, borderColor: colors.border }]}>
              <View style={styles.dermHead}>
                <Ionicons name="medkit-outline" size={20} color={derm.level === 'recommended' ? colors.danger : colors.primary} />
                <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>
                  {derm.level === 'recommended' ? t("We'd recommend seeing a dermatologist") : t('Worth seeing a dermatologist')}
                </Text>
              </View>
              <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 6, lineHeight: 18 }]}>{t(derm.reasons[0])}</Text>
              {dermOpen
                ? derm.reasons.slice(1).map((r, i) => (
                    <Text key={i} style={[TYPE.caption, { color: colors.textSecondary, marginTop: 6, lineHeight: 18 }]}>{t(r)}</Text>
                  ))
                : null}
              <Text style={[TYPE.caption, { color: colors.muted, marginTop: 8, lineHeight: 17 }]}>
                {t('Skynkod helps with skincare, but it doesn\'t replace a doctor.')}
              </Text>
              <View style={styles.dermActions}>
                {derm.reasons.length > 1 ? (
                  <Pressable onPress={() => setDermOpen(!dermOpen)} hitSlop={8}>
                    <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{dermOpen ? t('Show less') : t('Why?')}</Text>
                  </Pressable>
                ) : <View />}
                <Pressable onPress={hideDerm} hitSlop={8}>
                  <Text style={[TYPE.caption, { color: colors.textSecondary, fontWeight: '700' }]}>{t('Got it')}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* The four places the user comes back to */}
          <View style={styles.grid}>
            {SHORTCUTS.map(s => (
              <Glass key={s.to} radius={RADIUS.lg} style={styles.tileGlass}>
              <Pressable
                onPress={() => navigation.navigate(s.to)}
                style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.85 : 1 }]}
              >
                <View style={[styles.tileIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={s.icon} size={22} color={colors.primary} />
                </View>
                <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(s.label)}</Text>
              </Pressable>
              </Glass>
            ))}
          </View>
          {/* Koda's word for today, quiet at the bottom */}
          <Pressable onPress={() => navigation.navigate('Koda')} style={styles.quote}>
            <View style={[styles.quoteRule, { backgroundColor: colors.border }]} />
            <Text style={[styles.quoteText, { color: colors.textSecondary }]}>{t(kodaTip(entries))}</Text>
            <View style={styles.quoteBy}>
              <Image source={KODA} style={{ width: 12, height: 12, tintColor: colors.muted }} />
              <Text style={[TYPE.caption, { color: colors.muted, fontSize: 11, letterSpacing: 0.6 }]}>Koda</Text>
            </View>
          </Pressable>

        </View>
        </View>
      </Animated.ScrollView>

      {/* Header that appears once the greeting has scrolled away */}
      <Animated.View
        pointerEvents={headerOn ? 'auto' : 'none'}
        style={[styles.header, {
          paddingTop: insets.top + SPACING.xs,
          borderBottomColor: colors.border,
          opacity: headerFade,
        }]}
      >
        <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(21,18,21,0.6)' : 'rgba(251,248,250,0.85)' }]} />
        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginRight: SPACING.md }}>
            <Text style={[styles.headerDate, { color: colors.primary }]} numberOfLines={1}>
              {new Date().toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {greeting}{firstName ? `, ${firstName}` : ''}
            </Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Alerts')} hitSlop={10} accessibilityLabel={t('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const SHADOW = { textShadowColor: 'rgba(60,35,55,0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 };
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  sosCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.lg },
  sosInvite: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.lg },
  sosHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  sosIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sosChips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md },
  sosChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  sosAll: { paddingHorizontal: 4, paddingVertical: 7 },
  // A touch closer to the greeting, a touch more space before the cards.
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: -SPACING.lg, marginBottom: SPACING.sm },
  doneLine: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: 999, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, marginTop: SPACING.xl },
  doneIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, height: 52, paddingHorizontal: SPACING.lg },
  replace: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.lg },
  derm: { borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.lg, marginTop: SPACING.lg },
  dermHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginTop: SPACING.lg },
  tileGlass: { width: '47%', flexGrow: 1 },
  tile: { padding: SPACING.lg, gap: SPACING.md },
  tileIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sky: { position: 'absolute', top: 0, left: 0, right: 0 },
  moon: { position: 'absolute', right: SPACING.xxl, shadowColor: '#FFFFFF', shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } },
  seasonHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  seasonTitle: { fontFamily: SERIF, fontSize: 22 },
  seasonTip: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginTop: SPACING.md },
  seasonDot: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden', borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md },
  headerDate: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  headerTitle: { fontFamily: SERIF, fontSize: 20, marginTop: 2 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl },
  date: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  dateDot: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  dateWeather: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  glass: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.22)' },
  heroTop: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.xl },
  hello: { fontFamily: SERIF, fontSize: 24, fontStyle: 'italic', ...SHADOW },
  name: { fontFamily: SERIF, fontSize: 46, letterSpacing: -0.5, marginTop: 2, ...SHADOW },
  linePill: { alignSelf: 'flex-start', marginTop: SPACING.md },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: 5 },
  // Same voice as the greeting: serif italic.
  line: { fontFamily: SERIF, fontStyle: 'italic', fontSize: 14 },
  moods: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xl },
  mood: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  begin: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: SPACING.sm, height: 50, borderRadius: 25, paddingHorizontal: SPACING.xxl, marginTop: SPACING.xl },
  beginText: { fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  body: { paddingHorizontal: SPACING.xl },
  soft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.lg },
  card: { marginTop: SPACING.lg },
  cardIn: { padding: SPACING.xl },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rekodCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: '#33202E', borderRadius: 22, padding: SPACING.lg, marginTop: SPACING.lg },
  rekodKicker: { color: '#E2C6DA', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  rekodTitle: { color: '#FFFFFF', fontFamily: SERIF, fontSize: 17, marginTop: 2 },
  rekodText: { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 },
  overline: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  dots: { flexDirection: 'row', gap: 6, marginTop: SPACING.md },
  dot: { flex: 1, height: 3, borderRadius: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginTop: SPACING.xl },
  photo: { width: 64, height: 64, borderRadius: RADIUS.md, backgroundColor: '#FFFFFF' },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  product: { fontFamily: SERIF, fontSize: 19, marginTop: 4 },
  primary: { flexDirection: 'row', gap: SPACING.sm, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xl },
  primaryText: { fontSize: 15, fontWeight: '600' },
  dermActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md },
  quote: { marginTop: SPACING.xxl, paddingHorizontal: SPACING.xl },
  quoteText: { fontFamily: SERIF, fontStyle: 'italic', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  quoteRule: { width: 32, height: StyleSheet.hairlineWidth, alignSelf: 'center', marginBottom: SPACING.md },
  quoteBy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: SPACING.sm },
});
