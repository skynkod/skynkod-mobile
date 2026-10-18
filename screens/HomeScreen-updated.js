import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, RefreshControl, Pressable, Image, ImageBackground, ScrollView, Platform, Dimensions } from 'react-native';
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
import { logStep } from '../utils/routine-log';
import { markOpenedIfNeeded, shelfLife } from '../utils/shelf-life';
import { getActivePlan, adjustForPlan } from '../utils/emergency-state';
import { situationFromCheckIn, MOODS, saveDay } from '../utils/journal-day';
import { logError } from '../utils/errorLogger';
import { getProductsByIds, getNewestProductId, getMyProducts } from '../utils/catalog';
import { useColors } from '../components/ui';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

const KODA = require('../assets/images/koda-logo.png');
// Photo: Unsplash (photo-1460411794035-42aac080490a, "cloudy sky"), Unsplash License.
const SKY = require('../assets/images/home-sky.jpg');
// Deep plum from the logo family, for text over the light clouds.
const INK = '#4A2F42';
const INK_SOFT = '#6E5266';

const SHORTCUTS = [
  { label: 'My routines', icon: 'water-outline', to: 'Routines' },
  { label: 'My products', icon: 'flask-outline', to: 'Products' },
  { label: 'My Skynbudget', icon: 'wallet-outline', to: 'Budget' },
  { label: 'Skyncyclopedia', icon: 'library-outline', to: 'Skyncyclopedia' },
];

// Same storage key as the Routines screen, so ticks are shared.
const doneKey = (userId, period) => `routine_done_${userId}_${period}_${new Date().toDateString()}`;

// Koda's one-line tip from the latest check-in (last 3 days).
const kodaTip = (entries) => {
  const latest = entries.find(e => e?.date && Date.now() - new Date(e.date).getTime() <= 3 * 86400000);
  if (!latest) return "Tell me how your skin feels today and I'll tailor my advice.";
  if ((latest.redness_level ?? 0) >= 6 || (latest.barrier_health ?? 10) <= 4) return 'Your skin looks a bit sensitized. Skip exfoliation tonight.';
  if ((latest.acne_level ?? 0) >= 6) return 'Breakouts are up. Keep it gentle and avoid picking.';
  if ((latest.hydration_level ?? 10) <= 4) return 'Your skin seems thirsty. Add a hydrating serum today.';
  return "Your skin is doing well. Stay consistent and don't skip SPF.";
};

// Home keeps to the essentials: search, the routine for right now (by the
// real sunrise/sunset) one step at a time, and one tip from Koda.
export default function HomeScreen({ navigation }) {
  const colors = useColors();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const firstName = useFirstName(user?.id);
  const { isNight, isDark, updateLocation } = useTheme();
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(Dimensions.get('window').height * 0.72);
  const scrollRef = useRef(null);
  const [routineY, setRoutineY] = useState(0);
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
  const scrollToRoutine = () => scrollRef.current?.scrollTo({ y: Math.max(0, routineY - SPACING.xl), animated: true });

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
  } else if (routine && steps.length) {
    line = period === 'morning' ? t('Ritual done. See you tonight.') : t('Ritual done. Sleep well.');
  }

  // One alert at a time, the most useful first.
  const alert = !plan && suggestion ? 'sos' : showDerm ? 'derm' : toReplace ? 'replace' : !plan && loaded && !skinIsFine && !askMood ? 'invite' : null;

  const ink = isDark ? colors.text : INK;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING.xxxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
      >
        {/* The calm hero: the sky, the greeting, one thing to do */}
        <ImageBackground source={SKY} resizeMode="cover" style={{ height: heroHeight }}>
          {isDark ? <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(21,18,21,0.45)' }]} /> : null}
          <Svg style={styles.fade} width="100%" height={heroHeight * 0.55}>
            <Defs>
              <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.bg} stopOpacity="0" />
                <Stop offset="0.6" stopColor={colors.bg} stopOpacity="0.55" />
                <Stop offset="1" stopColor={colors.bg} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#fade)" />
          </Svg>

          <View style={[styles.topBar, { paddingTop: insets.top + SPACING.sm }]}>
            <Text style={styles.date}>
              {new Date().toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <Pressable onPress={() => navigation.navigate('Search')} style={styles.glass} accessibilityLabel={t('Search')}>
                <Ionicons name="search-outline" size={19} color="#FFFFFF" />
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Alerts')} style={styles.glass} accessibilityLabel={t('Notifications')}>
                <Ionicons name="notifications-outline" size={19} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          <View style={styles.heroBottom}>
            <Text style={[styles.hello, { color: ink }]}>{greeting}{firstName ? ',' : ''}</Text>
            {firstName ? <Text style={[styles.name, { color: ink }]}>{firstName}</Text> : null}
            {line ? <Text style={[styles.line, { color: isDark ? colors.textSecondary : INK_SOFT }]}>{line}</Text> : null}

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
                  <Text style={[TYPE.caption, { color: isDark ? colors.muted : INK_SOFT }]}>{t('Not now')}</Text>
                </Pressable>
              </>
            ) : null}

            {action ? (
              <Pressable onPress={action.onPress} style={({ pressed }) => [styles.begin, { backgroundColor: isDark ? colors.primary : INK, opacity: pressed ? 0.88 : 1 }]}>
                <Text style={[styles.beginText, { color: isDark ? colors.onPrimary : '#FFFFFF' }]}>{action.label}</Text>
                <Ionicons name="arrow-forward" size={16} color={isDark ? colors.onPrimary : '#FFFFFF'} />
              </Pressable>
            ) : null}

            {!askMood && todayEntry?.mood && ['bad', 'terrible'].includes(todayEntry.mood) && !(todayEntry.skin_conditions || []).length ? (
              <Pressable onPress={() => navigation.navigate('Journal')} hitSlop={8} style={{ marginTop: SPACING.md }}>
                <Text style={[TYPE.caption, { color: isDark ? colors.primary : colors.primary, fontWeight: '700' }]}>{t("Tell me what's going on")} →</Text>
              </Pressable>
            ) : null}
          </View>
        </ImageBackground>

        <View style={styles.body}>
          {plan ? (
            <Pressable onPress={() => navigation.navigate('Emergency')} style={[styles.soft, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="medkit-outline" size={18} color={colors.primary} />
              <Text style={[TYPE.bodyStrong, { color: colors.primary, flex: 1 }]}>
                {t('Day {n} of 7', { n: plan.dayIndex + 1 })} · {t(plan.situation.title)}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </Pressable>
          ) : null}

          {/* The routine, one step at a time */}
          {routine && current ? (
            <View onLayout={e => setRoutineY(e.nativeEvent.layout.y + heroHeight)} style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <View style={styles.cardHead}>
                <Text style={[styles.overline, { color: colors.primary }]}>{period === 'morning' ? t('THIS MORNING') : t('TONIGHT')}</Text>
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
                {current.image_url ? (
                  <Image source={{ uri: current.image_url }} style={styles.photo} resizeMode="contain" />
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
          ) : null}

          {/* One alert at a time */}
          {alert === 'sos' ? (
            <Pressable
              onPress={() => navigation.navigate('Emergency', { situation: suggestion.id, openedAt: Date.now() })}
              style={[styles.soft, { backgroundColor: colors.dangerSoft }]}
            >
              <Ionicons name="medkit-outline" size={20} color={colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(suggestion.text)}</Text>
                <Text style={[TYPE.caption, { color: colors.danger, fontWeight: '700', marginTop: 2 }]}>{t('Start a 7-day plan')} →</Text>
              </View>
            </Pressable>
          ) : null}

          {alert === 'derm' ? (
            <View style={[styles.soft, { backgroundColor: derm.level === 'recommended' ? colors.dangerSoft : colors.surface, alignItems: 'flex-start' }]}>
              <Ionicons name="medkit-outline" size={20} color={derm.level === 'recommended' ? colors.danger : colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[TYPE.bodyStrong, { color: colors.text }]}>
                  {derm.level === 'recommended' ? t("We'd recommend seeing a dermatologist") : t('Worth seeing a dermatologist')}
                </Text>
                <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>{t(derm.reasons[0])}</Text>
                {dermOpen
                  ? derm.reasons.slice(1).map((r, i) => (
                      <Text key={i} style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>{t(r)}</Text>
                    ))
                  : null}
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
            </View>
          ) : null}

          {alert === 'replace' ? (
            <Pressable onPress={() => navigation.navigate('Products')} style={[styles.soft, { backgroundColor: toReplace.life.status === 'expired' ? colors.dangerSoft : colors.warningSoft }]}>
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

          {alert === 'invite' ? (
            <Pressable onPress={() => navigation.navigate('Emergency')} style={[styles.soft, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="medkit-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Skin acting up?')}</Text>
                <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>{t('Get a 7-day plan to calm, repair or prepare your skin.')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </Pressable>
          ) : null}

          {/* Koda's word for today */}
          <Pressable onPress={() => navigation.navigate('Koda')} style={styles.quote}>
            <Text style={[styles.quoteText, { color: colors.text }]}>“{t(kodaTip(entries))}”</Text>
            <View style={styles.quoteBy}>
              <Image source={KODA} style={{ width: 16, height: 16, tintColor: colors.primary }} />
              <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>Koda</Text>
            </View>
          </Pressable>

          {/* The places the user comes back to */}
          <View style={styles.shortcuts}>
            {SHORTCUTS.map(s => (
              <Pressable key={s.to} onPress={() => navigation.navigate(s.to)} style={({ pressed }) => [styles.shortcut, { opacity: pressed ? 0.7 : 1 }]}>
                <View style={[styles.shortcutIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={s.icon} size={22} color={colors.primary} />
                </View>
                <Text style={[TYPE.caption, { color: colors.textSecondary, textAlign: 'center' }]} numberOfLines={2}>{t(s.label)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl },
  date: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase' },
  glass: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.22)' },
  heroBottom: { position: 'absolute', left: SPACING.xl, right: SPACING.xl, bottom: SPACING.xxl },
  hello: { fontFamily: SERIF, fontSize: 24, fontStyle: 'italic' },
  name: { fontFamily: SERIF, fontSize: 46, letterSpacing: -0.5, marginTop: 2 },
  line: { fontSize: 16, lineHeight: 23, marginTop: SPACING.sm },
  moods: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xl },
  mood: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  begin: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: SPACING.sm, height: 50, borderRadius: 25, paddingHorizontal: SPACING.xxl, marginTop: SPACING.xl },
  beginText: { fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  body: { paddingHorizontal: SPACING.xl },
  soft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.lg },
  card: { borderRadius: RADIUS.xl, padding: SPACING.xl, marginTop: SPACING.lg, shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  quote: { marginTop: SPACING.xxl, paddingHorizontal: SPACING.sm },
  quoteText: { fontFamily: SERIF, fontStyle: 'italic', fontSize: 19, lineHeight: 27, textAlign: 'center' },
  quoteBy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: SPACING.sm },
  shortcuts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xxl },
  shortcut: { width: '23%', alignItems: 'center', gap: SPACING.sm },
  shortcutIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
