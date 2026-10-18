import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, RefreshControl, Pressable, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scoresFromJournal } from '../utils/skin-score-calculator';
import { getJournalEntries } from '../utils/journal-service';
import { getUserProfile } from '../utils/supabase';
import { buildRoutine } from '../utils/routine-builder';
import { useAuth } from '../utils/AuthContext';
import { useLanguage } from '../utils/LanguageContext';
import { useFirstName } from '../utils/useFirstName';
import { useTheme } from '../utils/ThemeContext';
import { Screen, useColors } from '../components/ui';
import ScoreRing from '../components/ScoreRing';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

const LOGO = require('../assets/images/skynkod-logo.png');
const LOGO_RATIO = 1306 / 333;

const METRICS = [
  { key: 'hydration', label: 'Hydration' },
  { key: 'barrier', label: 'Barrier' },
  { key: 'acne', label: 'Acne' },
  { key: 'redness', label: 'Redness' },
  { key: 'consistency', label: 'Consistency' },
];

// Short names for routine steps, as listed on the mockup's "Today's plan".
const STEP_NAMES = {
  'Remove makeup': 'Makeup remover',
  Cleanse: 'Cleanser',
  Balance: 'Toner',
  Treat: 'Treatment serum',
  Hydrate: 'Hydrating serum',
  Moisturize: 'Moisturizer',
  'Eye care': 'Eye cream',
  Protect: 'SPF 30+',
};

// Same storage key as the Routines screen, so ticks are shared.
const doneKey = (userId, period) => `routine_done_${userId}_${period}_${new Date().toDateString()}`;

const rating = (value, colors) => {
  if (value >= 85) return { label: 'Great', color: colors.success };
  if (value >= 70) return { label: 'Good', color: colors.success };
  if (value >= 50) return { label: 'Fair', color: colors.warning };
  return { label: 'Low', color: colors.danger };
};

// Koda's tip from the latest check-in (last 3 days).
const kodaTip = (entries) => {
  const latest = entries.find(e => e?.date && Date.now() - new Date(e.date).getTime() <= 3 * 86400000);
  if (!latest) return "Log today's check-in so Koda can tailor your routine to your skin.";
  if ((latest.redness_level ?? 0) >= 6 || (latest.barrier_health ?? 10) <= 4) {
    return 'Your skin looks slightly sensitized today. Skip exfoliation tonight and focus on barrier support.';
  }
  if ((latest.acne_level ?? 0) >= 6) {
    return 'Breakouts are up. Keep your routine gentle, avoid picking, and use a spot treatment tonight.';
  }
  if ((latest.hydration_level ?? 10) <= 4) {
    return 'Your skin seems dehydrated. Layer a hydrating serum under your moisturizer today.';
  }
  return "Your skin is doing well. Stay consistent with your routine and don't skip SPF.";
};

export default function HomeScreen({ navigation }) {
  const colors = useColors();
  const { t } = useLanguage();
  const { user } = useAuth();
  const firstName = useFirstName(user?.id);
  // Day and night follow the real sunrise/sunset, same as night mode.
  const { isNight, updateLocation } = useTheme();
  const [entries, setEntries] = useState([]);
  const [skinType, setSkinType] = useState(null);
  const [done, setDone] = useState({ morning: {}, evening: {} });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    updateLocation();
  }, []);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [journal, profile, morning, evening] = await Promise.all([
      getJournalEntries(user.id, 30),
      getUserProfile(user.id),
      AsyncStorage.getItem(doneKey(user.id, 'morning')).catch(() => null),
      AsyncStorage.getItem(doneKey(user.id, 'evening')).catch(() => null),
    ]);
    if (journal.success) setEntries(journal.data || []);
    setSkinType(profile?.skin_type || null);
    setDone({ morning: JSON.parse(morning || '{}'), evening: JSON.parse(evening || '{}') });
  }, [user?.id]);

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

  const scores = scoresFromJournal(entries);
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const yesterdayScores = scoresFromJournal(entries.filter(e => e?.date && new Date(e.date).getTime() < startOfToday));
  const delta = scores && yesterdayScores ? scores.overall - yesterdayScores.overall : null;

  const routine = buildRoutine(skinType || 'Combination', []);
  const plans = [
    { period: 'morning', title: 'Morning Routine', icon: 'sunny', iconColor: '#E8B04A', steps: routine.morning || [] },
    { period: 'evening', title: 'Tonight Routine', icon: 'moon-outline', iconColor: colors.secondary, steps: routine.evening || [] },
  ];
  const current = isNight ? 'evening' : 'morning';
  const currentPlan = plans.find(p => p.period === current);
  const currentDone = currentPlan.steps.length > 0 && currentPlan.steps.every((_, idx) => done[current][idx]);

  const completeRoutine = async () => {
    const all = Object.fromEntries(currentPlan.steps.map((_, idx) => [idx, true]));
    setDone(prev => ({ ...prev, [current]: all }));
    await AsyncStorage.setItem(doneKey(user.id, current), JSON.stringify(all)).catch(() => {});
  };

  const tip = kodaTip(entries);
  const greeting = isNight ? t('Good evening') : t('Good morning');

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      {/* Header: logo centred, bell on the right */}
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
      <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: 2 }]}>{t("Here's your skin overview")}</Text>

      {/* Search products and ingredients; the scan icon goes straight to the camera */}
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

      {/* Skin score */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: SPACING.xl }]}>
        <View style={styles.scoreRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardLabel, { color: colors.text }]}>{t('SKIN SCORE')}</Text>
            <View style={styles.scoreLine}>
              <Text style={[styles.score, { color: colors.text }]}>{scores ? scores.overall : '–'}</Text>
              <Text style={[TYPE.body, { color: colors.textSecondary, marginBottom: 10 }]}>/100</Text>
              {delta !== null && delta !== 0 ? (
                <View style={{ marginLeft: SPACING.lg, marginBottom: 6 }}>
                  <Text style={[TYPE.caption, { color: delta > 0 ? colors.success : colors.danger, fontWeight: '700' }]}>
                    {delta > 0 ? '↑' : '↓'} {t('{count} pts', { count: Math.abs(delta) })}
                  </Text>
                  <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('vs yesterday')}</Text>
                </View>
              ) : null}
            </View>
            {!scores ? (
              <Pressable onPress={() => navigation.navigate('Journal', { openNew: Date.now() })}>
                <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Log your first check-in to get your score →')}</Text>
              </Pressable>
            ) : null}
          </View>
          <ScoreRing value={scores?.overall || 0} size={92} stroke={12} color={colors.accent} trackColor={colors.primarySoft} />
        </View>

        <View style={styles.metrics}>
          {METRICS.map(m => {
            const value = scores ? scores[m.key] : null;
            const r = value !== null ? rating(value, colors) : null;
            return (
              <View key={m.key} style={[styles.metric, { borderColor: colors.border }]}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>{t(m.label)}</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>{value ?? '–'}</Text>
                <Text style={[styles.metricRating, { color: r ? r.color : colors.muted }]}>{r ? t(r.label) : ' '}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Today's plan */}
      <Text style={[styles.section, { color: colors.primary }]}>{t("TODAY'S PLAN")}</Text>
      <Pressable
        onPress={() => navigation.navigate('Routines', { tab: current })}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        {plans.map((plan, pIdx) => (
          <View key={plan.period} style={pIdx > 0 && [styles.planDivider, { borderTopColor: colors.border }]}>
            <View style={styles.planHead}>
              <Ionicons name={plan.icon} size={20} color={plan.iconColor} />
              <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>{t(plan.title)}</Text>
              <Text style={[TYPE.caption, { color: colors.textSecondary }]}>
                {t(plan.steps.length === 1 ? '1 step' : '{count} steps', { count: plan.steps.length })}
              </Text>
            </View>
            {plan.steps.map((step, idx) => {
              const ticked = !!done[plan.period][idx];
              return (
                <View key={idx} style={styles.stepRow}>
                  <View style={[styles.tick, { backgroundColor: ticked ? colors.accent : colors.primarySoft }]}>
                    <Ionicons name="checkmark" size={11} color={ticked ? '#FFFFFF' : colors.accent} />
                  </View>
                  <Text style={[TYPE.body, { color: ticked ? colors.muted : colors.text, textDecorationLine: ticked ? 'line-through' : 'none' }]}>
                    {t(STEP_NAMES[step.action] || step.action)}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </Pressable>

      {/* Koda recommends */}
      <View style={[styles.kodaCard, { backgroundColor: colors.primarySoft }]}>
        <Text style={[styles.cardLabel, { color: colors.primary }]}>{t('KODA RECOMMENDS')}</Text>
        <View style={styles.kodaRow}>
          <Text style={[TYPE.body, { color: colors.text, flex: 1 }]}>{t(tip)}</Text>
          <Pressable
            onPress={() => navigation.navigate('Koda', { prefill: t('Why do you recommend this: "{tip}"?', { tip: t(tip) }) })}
            style={[styles.whyPill, { backgroundColor: colors.accent }]}
          >
            <Text style={[TYPE.caption, { color: '#FFFFFF', fontWeight: '700' }]}>{t('Why?')}</Text>
          </Pressable>
        </View>
      </View>

      {/* Complete routine */}
      <Pressable
        onPress={completeRoutine}
        disabled={currentDone}
        style={({ pressed }) => [styles.completeButton, { backgroundColor: colors.accent, opacity: currentDone ? 0.6 : pressed ? 0.85 : 1 }]}
      >
        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        <Text style={styles.completeText}>{currentDone ? t('Routine completed') : t('Complete Routine')}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  topSide: { width: 44 },
  logo: { flex: 1, height: 30, width: 30 * LOGO_RATIO },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, height: 50, borderRadius: 999, borderWidth: 1, paddingHorizontal: SPACING.lg, marginTop: SPACING.lg },
  greeting: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  card: { borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.lg },
  cardLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  scoreLine: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 2 },
  score: { fontSize: 56, fontWeight: '700', letterSpacing: -2, lineHeight: 62 },
  metrics: { flexDirection: 'row', gap: 6, marginTop: SPACING.lg },
  metric: { flex: 1, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS.sm, paddingVertical: SPACING.sm, paddingHorizontal: 2 },
  metricLabel: { fontSize: 10, fontWeight: '500' },
  metricValue: { fontSize: 22, fontWeight: '700', marginTop: 2 },
  metricRating: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  planDivider: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: SPACING.lg, paddingTop: SPACING.lg },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: 5, paddingLeft: 2 },
  tick: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  kodaCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.lg },
  kodaRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.md, marginTop: SPACING.sm },
  whyPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  completeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, height: 52, borderRadius: RADIUS.md, marginTop: SPACING.lg, marginBottom: SPACING.md },
  completeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
