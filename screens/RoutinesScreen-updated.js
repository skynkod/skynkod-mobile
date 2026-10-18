import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getUserRoutines } from '../utils/routines-service';
import { logStep } from '../utils/routine-log';
import { markOpenedIfNeeded } from '../utils/shelf-life';
import { getUserProfile } from '../utils/supabase';
import { buildRoutine } from '../utils/routine-builder';
import { useAuth } from '../utils/AuthContext';
import { useT } from '../utils/LanguageContext';
import { useTheme } from '../utils/ThemeContext';
import { useSkinProfile } from '../utils/useSkinProfile';
import { getProductsByIds, photoOf } from '../utils/catalog';
import ProductVerdict from '../components/ProductVerdict';
import { todaySteps } from '../utils/routine-checks';
import { Screen, Card, SegmentedControl, ProgressBar, LoadingView, Badge, useColors } from '../components/ui';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

const todayKey = (userId, tab) => `routine_done_${userId}_${tab}_${new Date().toDateString()}`;

export default function RoutinesScreen({ route, navigation }) {
  const colors = useColors();
  const t = useT();
  const { user } = useAuth();
  const { isNight } = useTheme();
  const [tab, setTab] = useState(isNight ? 'evening' : 'morning');
  const [savedRoutines, setSavedRoutines] = useState([]);
  const [skinType, setSkinType] = useState(null);
  const [done, setDone] = useState({});
  const [loading, setLoading] = useState(true);
  const profile = useSkinProfile(user?.id);
  const [productsById, setProductsById] = useState({});

  useEffect(() => {
    if (route?.params?.tab) setTab(route.params.tab);
  }, [route?.params?.tab]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        if (!user?.id) {
          setLoading(false);
          return;
        }
        const [routinesResult, profile] = await Promise.all([getUserRoutines(user.id), getUserProfile(user.id)]);
        if (!active) return;
        if (routinesResult.success) setSavedRoutines(routinesResult.data || []);
        setSkinType(profile?.skin_type || null);
        setLoading(false);
      };
      load();
      return () => {
        active = false;
      };
    }, [user?.id])
  );

  // Checked steps are remembered for the current day only.
  useEffect(() => {
    if (!user?.id) return;
    AsyncStorage.getItem(todayKey(user.id, tab))
      .then(saved => setDone(saved ? JSON.parse(saved) : {}))
      .catch(() => setDone({}));
  }, [user?.id, tab]);

  const saved = savedRoutines.find(r => r.type === tab && Array.isArray(r.steps) && r.steps.length);

  // Full product records, to say whether each one suits the user's skin.
  const savedIds = (saved?.steps || []).map(s => s.product_id).filter(Boolean).join(',');
  useEffect(() => {
    if (!savedIds) return;
    getProductsByIds(savedIds.split(',').map(Number))
      .then(rows => setProductsById(Object.fromEntries(rows.map(p => [p.id, p]))))
      .catch(() => {});
  }, [savedIds]);
  const generated = buildRoutine(skinType || 'Combination', []);
  const steps = saved ? todaySteps(saved.steps) : generated[tab] || [];
  const completed = steps.filter((_, idx) => done[idx]).length;
  const progress = steps.length ? completed / steps.length : 0;

  const toggleStep = async (idx) => {
    const next = { ...done, [idx]: !done[idx] };
    setDone(next);
    AsyncStorage.setItem(todayKey(user.id, tab), JSON.stringify(next)).catch(() => {});
    if (saved) logStep({ userId: user.id, routineId: saved.id, type: tab, stepIndex: idx, done: !!next[idx] });
    if (next[idx]) markOpenedIfNeeded(user.id, steps[idx]?.product_id).catch(() => {});
  };

  if (loading) return <LoadingView />;

  const build = () => navigation.navigate('RoutineBuilder', { period: tab, startedAt: Date.now(), editSteps: saved?.steps || null });

  return (
    <Screen
      back
      right={saved ? (
        <Pressable onPress={build} hitSlop={10}>
          <Text style={[TYPE.bodyStrong, { color: colors.primary }]}>{t('Edit')}</Text>
        </Pressable>
      ) : null}
      title={t('Routines')} subtitle={saved ? saved.name : skinType ? t('Built by Koda for {type} skin', { type: t(skinType).toLowerCase() }) : t('Built by Koda for you')}>
      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'morning', label: t('Morning'), icon: 'sunny-outline' },
          { value: 'evening', label: t('Evening'), icon: 'moon-outline' },
        ]}
      />

      {!saved ? (
        <Card style={{ marginTop: SPACING.xl, padding: SPACING.xl }}>
          <Text style={[TYPE.overline, { color: colors.primary }]}>{t('Start here')}</Text>
          <Text style={[TYPE.heading, { color: colors.text, marginTop: SPACING.sm }]}>
            {tab === 'morning' ? t('Build your morning routine') : t('Build your night routine')}
          </Text>
          <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.sm }]}>
            {t('3 quick steps. Tell us what you use, or let Koda help you choose.')}
          </Text>
          <Pressable onPress={build} style={[styles.buildButton, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.onPrimary, fontSize: 16, fontWeight: '600' }}>{t('Start')}</Text>
          </Pressable>
        </Card>
      ) : null}

      {saved ? (
      <Card style={{ marginTop: SPACING.xl }}>
        <View style={styles.progressHead}>
          <View>
            <Text style={[TYPE.overline, { color: colors.muted }]}>{t('Today')}</Text>
            <Text style={[TYPE.heading, { color: colors.text, marginTop: 2 }]}>
              {completed === steps.length && steps.length ? t('All done ✨') : t('{done} of {total} steps', { done: completed, total: steps.length })}
            </Text>
          </View>
          <Text style={[TYPE.title, { color: colors.primary }]}>{Math.round(progress * 100)}%</Text>
        </View>
        <ProgressBar value={progress} style={{ marginTop: SPACING.md }} />
      </Card>
      ) : null}

      {!skinType && !saved ? (
        <Card tone="soft" style={{ marginTop: SPACING.md }} onPress={() => navigation.navigate('Quiz')}>
          <View style={styles.quizRow}>
            <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
            <Text style={[TYPE.caption, { color: colors.text, flex: 1, fontWeight: '600' }]}>
              {t('Take the skin type quiz to personalize this routine')}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </View>
        </Card>
      ) : null}

      {saved ? (
      <View style={{ marginTop: SPACING.xl }}>
        {steps.map((step, idx) => {
          const isDone = !!done[idx];
          const last = idx === steps.length - 1;
          return (
            <Pressable key={`${tab}-${idx}`} onPress={() => toggleStep(idx)} style={styles.stepRow}>
              <View style={styles.timeline}>
                <View
                  style={[
                    styles.check,
                    isDone
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={18} color={colors.onPrimary} />
                  ) : (
                    <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '700' }]}>{idx + 1}</Text>
                  )}
                </View>
                {!last ? <View style={[styles.line, { backgroundColor: colors.border }]} /> : null}
              </View>

              <Card style={[styles.stepCard, isDone && { opacity: 0.55 }]}>
                <View style={styles.stepHead}>
                  <Text style={[TYPE.subheading, { color: colors.text, textDecorationLine: isDone ? 'line-through' : 'none' }]}>
                    {t(step.action)}
                  </Text>
                  {step.time ? <Badge label={t(step.time)} /> : null}
                </View>
                {step.product ? (
                  <View style={styles.productRow}>
                    {photoOf(step) ? <Image source={{ uri: photoOf(step) }} style={styles.productPhoto} resizeMode="contain" /> : null}
                    <Text style={[TYPE.body, { color: colors.textSecondary, flex: 1 }]}>{t(step.product)}</Text>
                  </View>
                ) : null}
                {productsById[step.product_id] ? <ProductVerdict product={productsById[step.product_id]} profile={profile} /> : null}
                {step.tip ? (
                  <View style={styles.tipRow}>
                    <Ionicons name="bulb-outline" size={14} color={colors.primary} />
                    <Text style={[TYPE.caption, { color: colors.muted, flex: 1 }]}>{t(step.tip)}</Text>
                  </View>
                ) : null}
              </Card>
            </Pressable>
          );
        })}
      </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  buildButton: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xl },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 6 },
  productPhoto: { width: 36, height: 36, borderRadius: 6, backgroundColor: '#FFFFFF' },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  quizRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  stepRow: { flexDirection: 'row', gap: SPACING.md },
  timeline: { alignItems: 'center', width: 34 },
  check: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, flex: 1, marginVertical: 4, borderRadius: 1 },
  stepCard: { flex: 1, marginBottom: SPACING.md, borderRadius: RADIUS.md },
  stepHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.sm },
  tipRow: { flexDirection: 'row', gap: 6, marginTop: SPACING.sm, alignItems: 'flex-start' },
});
