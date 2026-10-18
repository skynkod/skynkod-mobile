import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, RefreshControl, Pressable, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
import { getActivePlan, adjustForPlan } from '../utils/emergency-state';
import { getProductsByIds, getNewestProductId } from '../utils/catalog';
import { Screen, useColors } from '../components/ui';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

const LOGO = require('../assets/images/skynkod-logo.png');
const KODA = require('../assets/images/koda-logo.png');
const LOGO_RATIO = 1306 / 333;

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
  const { t } = useLanguage();
  const { user } = useAuth();
  const firstName = useFirstName(user?.id);
  const { isNight, updateLocation } = useTheme();
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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    updateLocation();
  }, []);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [routines, ticks, journal, dermHidden] = await Promise.all([
      getUserRoutines(user.id),
      AsyncStorage.getItem(doneKey(user.id, period)).catch(() => null),
      getJournalEntries(user.id, 14),
      AsyncStorage.getItem(`skynkod_derm_hidden_${user.id}`).catch(() => null),
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
  const derm = dermatologistAdvice(profile, entries);
  const showDerm = derm && (!dermHiddenUntil || Date.now() > dermHiddenUntil);
  const hideDerm = async () => {
    const until = Date.now() + (derm?.level === 'recommended' ? 7 : 30) * 86400000;
    setDermHiddenUntil(until);
    await AsyncStorage.setItem(`skynkod_derm_hidden_${user.id}`, String(until)).catch(() => {});
  };

  const build = () => navigation.navigate('RoutineBuilder', { period, startedAt: Date.now() });
  const greeting = isNight ? t('Good evening') : t('Good morning');

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      <View style={styles.topBar}>
        <View style={styles.topSide} />
        <Image source={LOGO} resizeMode="contain" style={styles.logo} accessibilityLabel="Skynkod" />
        <Pressable style={[styles.topSide, { alignItems: 'flex-end' }]} onPress={() => navigation.navigate('Alerts')} hitSlop={10} accessibilityLabel={t('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </Pressable>
      </View>

      <Text style={[styles.greeting, { color: colors.text }]}>
        {greeting}{firstName ? `, ${firstName}` : ''} {isNight ? '🌙' : '☀️'}
      </Text>

      {/* Search; the scan icon goes straight to the camera */}
      <Pressable
        onPress={() => navigation.navigate('Search')}
        style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
        accessibilityRole="search"
      >
        <Ionicons name="search" size={18} color={colors.muted} />
        <Text style={[TYPE.body, { color: colors.muted, flex: 1 }]}>{t('Search a product or ingredient')}</Text>
        <Pressable onPress={() => navigation.navigate('Scanner')} hitSlop={12} accessibilityLabel={t('Scan a product')}>
          <Ionicons name="scan-outline" size={22} color={colors.primary} />
        </Pressable>
      </Pressable>

      {plan ? (
        <Pressable onPress={() => navigation.navigate('Emergency')} style={[styles.planBanner, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="medkit-outline" size={18} color={colors.primary} />
          <Text style={[TYPE.bodyStrong, { color: colors.primary, flex: 1 }]}>
            {t('Day {n} of 7', { n: plan.dayIndex + 1 })} · {t(plan.situation.title)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </Pressable>
      ) : null}

      {/* The one big card: the routine for right now */}
      {loaded && !routine ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.accent }]}>
          <Text style={[styles.overline, { color: colors.primary }]}>{t('START HERE')}</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {period === 'morning' ? t('Build your morning routine') : t('Build your night routine')}
          </Text>
          <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.sm }]}>
            {t('3 quick steps. Tell us what you use, or let Koda help you choose.')}
          </Text>
          <Pressable onPress={build} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
            <Text style={[styles.primaryText, { color: colors.onPrimary }]}>{t('Start')}</Text>
          </Pressable>
        </View>
      ) : null}

      {routine ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHead}>
            <Text style={[styles.overline, { color: colors.primary }]}>{period === 'morning' ? t('THIS MORNING') : t('TONIGHT')}</Text>
            <Pressable onPress={() => navigation.navigate('Routines', { tab: period })} hitSlop={10}>
              <Text style={[TYPE.caption, { color: colors.textSecondary, fontWeight: '600' }]}>
                {t('{done} of {total}', { done: doneCount, total: steps.length })}
              </Text>
            </Pressable>
          </View>

          {adjusted.paused.length ? (
            <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 6 }]}>
              {t('Paused during your plan:')} {adjusted.paused.map(p => p.step.product).join(', ')}
            </Text>
          ) : null}

          {/* Progress dots, one per step */}
          <View style={styles.dots}>
            {steps.map((_, idx) => (
              <View key={idx} style={[styles.dot, { backgroundColor: done[idx] ? colors.accent : idx === currentIdx ? colors.primary : colors.border }]} />
            ))}
          </View>

          {current ? (
            <>
              <View style={styles.stepRow}>
                {current.image_url ? (
                  <Image source={{ uri: current.image_url }} style={styles.photo} resizeMode="contain" />
                ) : (
                  <View style={[styles.photo, styles.noPhoto, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name="water-outline" size={26} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '700' }]}>
                    {t('Step {n}', { n: currentIdx + 1 })} · {t(current.action).toUpperCase()}
                  </Text>
                  <Text style={[styles.product, { color: colors.text }]} numberOfLines={2}>{current.product}</Text>
                </View>
              </View>
              <Pressable onPress={markDone} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
                <Ionicons name="checkmark" size={20} color={colors.onPrimary} />
                <Text style={[styles.primaryText, { color: colors.onPrimary }]}>
                  {currentIdx === steps.length - 1 ? t('Done, routine finished') : t('Done, next step')}
                </Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.allDone}>
              <Text style={[styles.cardTitle, { color: colors.text, textAlign: 'center' }]}>{t('All done ✨')}</Text>
              <Text style={[TYPE.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>
                {period === 'morning' ? t('See you tonight.') : t('Sleep well, see you tomorrow.')}
              </Text>
            </View>
          )}

          {doneCount > 0 ? (
            <Pressable onPress={undoLast} hitSlop={10} style={{ alignSelf: 'center', marginTop: SPACING.md }}>
              <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '600' }]}>{t('Undo last step')}</Text>
            </Pressable>
          ) : null}
        </View>
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
          <Pressable
            key={s.to}
            onPress={() => navigation.navigate(s.to)}
            style={({ pressed }) => [styles.tile, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={[styles.tileIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name={s.icon} size={22} color={colors.primary} />
            </View>
            <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(s.label)}</Text>
          </Pressable>
        ))}
      </View>

      {/* One line from Koda */}
      <Pressable onPress={() => navigation.navigate('Koda')} style={[styles.koda, { backgroundColor: colors.primarySoft }]}>
        <Image source={KODA} style={styles.kodaIcon} />
        <Text style={[TYPE.body, { color: colors.text, flex: 1 }]}>{t(kodaTip(entries))}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  topSide: { width: 44 },
  logo: { flex: 1, height: 30, width: 30 * LOGO_RATIO },
  greeting: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, height: 52, borderRadius: 999, borderWidth: 1, paddingHorizontal: SPACING.lg, marginTop: SPACING.lg },
  card: { borderRadius: RADIUS.xl, borderWidth: 1, padding: SPACING.xl, marginTop: SPACING.xl },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overline: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  cardTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, marginTop: SPACING.sm },
  dots: { flexDirection: 'row', gap: 6, marginTop: SPACING.md },
  dot: { flex: 1, height: 4, borderRadius: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginTop: SPACING.xl },
  photo: { width: 72, height: 72, borderRadius: RADIUS.md, backgroundColor: '#FFFFFF' },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  product: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  primary: { flexDirection: 'row', gap: SPACING.sm, height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xl },
  primaryText: { fontSize: 16, fontWeight: '600' },
  allDone: { paddingVertical: SPACING.xl },
  derm: { borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.lg, marginTop: SPACING.lg },
  dermHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dermActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md },
  planBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginTop: SPACING.lg },
  tile: { width: '47%', flexGrow: 1, borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.lg, gap: SPACING.md },
  tileIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  koda: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.lg },
  kodaIcon: { width: 26, height: 26 },
});
