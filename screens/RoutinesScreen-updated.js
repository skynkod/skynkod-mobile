import React, { useState, useEffect, useCallback } from 'react';
import { currentRoutine, withLipsStep } from '../utils/current-routine';
import { withTreatmentSteps } from '../utils/treatments';
import { getRekodPlan } from '../utils/rekod';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import FeatureIcon from '../components/FeatureIcon';
import { getUserRoutines } from '../utils/routines-service';
import { logStep } from '../utils/routine-log';
import { skinDay } from '../utils/skin-day';
import { markOpenedIfNeeded } from '../utils/shelf-life';
import { getUserProfile } from '../utils/supabase';
import { useAuth } from '../utils/AuthContext';
import { useT } from '../utils/LanguageContext';
import { useTheme } from '../utils/ThemeContext';
import { useSkinProfile } from '../utils/useSkinProfile';
import { useStopAdvice } from '../components/StopAdvice';
import { useExpectations } from '../components/ExpectationLine';
import RoutineProductLine from '../components/RoutineProductLine';
import { getProductsByIds, photoOf } from '../utils/catalog';
import YourWeek from '../components/YourWeek';
import { weekAudit } from '../utils/week-audit';
import { todaySteps, describeDays } from '../utils/routine-checks';
import { Screen, Card, SegmentedControl, ProgressBar, LoadingView, Badge, useColors } from '../components/ui';
import { SPACING, RADIUS, TYPE } from '../utils/theme';
import { GlossyScope, GTYPE, GFW } from '../components/glossy'

const todayKey = (userId, tab) => `routine_day_${userId}_${tab}_${skinDay().toDateString()}`;

function RoutinesScreenInner({ route, navigation }) {
  const colors = useColors();
  const t = useT();
  const { user } = useAuth();
  const { isNight } = useTheme();
  const [tab, setTab] = useState(isNight ? 'evening' : 'morning');
  const [savedRoutines, setSavedRoutines] = useState([]);
  // During Rekod, changes are made in Rekod, where they're kept (integration audit, 2026-10-25).
  const [inRekod, setInRekod] = useState(false);
  useEffect(() => { if (user?.id) getRekodPlan(user.id).then(p => setInRekod(!!p)).catch(() => {}); }, [user?.id]);
  const [skinType, setSkinType] = useState(null);
  const [done, setDone] = useState({});
  const [loading, setLoading] = useState(true);
  const profile = useSkinProfile(user?.id);
  const stopAdvice = useStopAdvice(user?.id, profile);
  const [productsById, setProductsById] = useState({});
  const expectations = useExpectations(user?.id, Object.keys(productsById));

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

  // A routine counts only if it has at least one product in it.
  const saved = currentRoutine(savedRoutines, tab);

  // Full product records, to say whether each one suits the user's skin.
  // Both routines' products: the week is looked at as a whole.
  const amRoutine = currentRoutine(savedRoutines, 'morning');
  const pmRoutine = currentRoutine(savedRoutines, 'evening');
  const savedIds = [...(amRoutine?.steps || []), ...(pmRoutine?.steps || [])].map(s => s.product_id).filter(Boolean).join(',');
  useEffect(() => {
    if (!savedIds) return;
    getProductsByIds(savedIds.split(',').map(Number))
      .then(rows => setProductsById(Object.fromEntries(rows.map(p => [p.id, p]))))
      .catch(() => {});
  }, [savedIds]);
  // No routine yet: nothing to tick (the old generic template is gone, 2026-10-27).
  const steps = saved ? todaySteps(withTreatmentSteps(withLipsStep(saved.steps), tab, profile)) : [];
  // An empty step (Lips in an older routine) can't be ticked: it doesn't count.
  // Optional steps (eyes and lips in Rekod, a spot treatment) don't count, as on Home.
  const filled = saved ? steps.filter(s => s.product && !s.optional) : steps;
  const completed = steps.filter((s, idx) => done[idx] && (!saved || (s.product && !s.optional))).length;
  const progress = filled.length ? completed / filled.length : 0;

  const toggleStep = async (idx) => {
    const next = { ...done, [idx]: !done[idx] };
    setDone(next);
    AsyncStorage.setItem(todayKey(user.id, tab), JSON.stringify(next)).catch(() => {});
    if (saved) logStep({ userId: user.id, routineId: saved.id, type: tab, stepIndex: idx, done: !!next[idx] });
    if (next[idx]) markOpenedIfNeeded(user.id, steps[idx]?.product_id).catch(() => {});
  };

  if (loading) return <LoadingView />;

  const build = () => (inRekod
    ? navigation.navigate('Rekod')
    : navigation.navigate('RoutineBuilder', { period: tab, startedAt: Date.now(), editSteps: saved ? withLipsStep(saved.steps) : null }));

  // Back skips the routine builder screens and returns to where she came
  // from (usually Home), never to the steps she just finished.
  const goBack = () => {
    const state = navigation.getState();
    const nameOf = key => state.routes.find(r => r.key === key)?.name;
    const passing = ['Routines', 'RoutineBuilder', 'ProductPicker', 'Scanner'];
    const history = (state.history || []).filter(entry => !passing.includes(nameOf(entry.key)));
    const last = history[history.length - 1];
    const target = last ? state.routes.findIndex(r => r.key === last.key) : -1;
    if (target < 0) return navigation.navigate('Home');
    navigation.dispatch(CommonActions.reset({ ...state, index: target, history }));
  };

  return (
    <Screen
      back
      onBack={goBack}
      right={saved ? (
        <Pressable onPress={build} hitSlop={10}>
          <Text style={[GTYPE.bodyStrong, { color: colors.primary }]}>{t('Edit')}</Text>
        </Pressable>
      ) : null}
      title={t('Routines')} subtitle={saved ? saved.name : t('Morning and evening')}>
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
          <Text style={[GTYPE.overline, { color: colors.primary }]}>{t('No products in this routine')}</Text>
          <Text style={[GTYPE.heading, { color: colors.text, marginTop: SPACING.sm }]}>
            {tab === 'morning' ? t('Build your morning routine') : t('Build your night routine')}
          </Text>
          <Text style={[GTYPE.body, { color: colors.textSecondary, marginTop: SPACING.sm }]}>
            {t('Add the products you already use, or let us build a routine made for your skin.')}
          </Text>
          <Pressable onPress={build} style={[styles.buildButton, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.onPrimary, fontSize: 16, ...GFW('600') }}>{t('Add my products')}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Rekod')} style={[styles.buildButton, styles.programmeButton]}>
            <FeatureIcon name="rekod" size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 16, ...GFW('600') }}>{t('Get a routine made for me')}</Text>
          </Pressable>
        </Card>
      ) : null}

      {saved ? (
      <Card style={{ marginTop: SPACING.xl }}>
        <View style={styles.progressHead}>
          <View>
            <Text style={[GTYPE.overline, { color: colors.muted }]}>{t('Today')}</Text>
            <Text style={[GTYPE.heading, { color: colors.text, marginTop: 2 }]}>
              {completed === filled.length && filled.length ? t('All done ✨') : t('{done} of {total} steps', { done: completed, total: filled.length })}
            </Text>
          </View>
          <Text style={[GTYPE.title, { color: colors.primary }]}>{Math.round(progress * 100)}%</Text>
        </View>
        <ProgressBar value={progress} style={{ marginTop: SPACING.md }} />
      </Card>
      ) : null}

      {/* Your week: each evening, and what adds up too much (Lita, 2026-10-24) */}
      {amRoutine || pmRoutine ? (
        <YourWeek style={{ marginTop: SPACING.md }} audit={weekAudit({ morning: amRoutine?.steps || [], evening: pmRoutine?.steps || [], productsById, profile })} />
      ) : null}

      {/* Premium: her products in the right order, how much and how */}
      {saved ? (
        <Card style={{ marginTop: SPACING.md }} onPress={() => navigation.navigate('Layering', { period: tab })}>
          <View style={styles.quizRow}>
            <Ionicons name="layers-outline" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[GTYPE.bodyStrong, { color: colors.text }]}>{t('How to apply, in order')}</Text>
              <Text style={[GTYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>{t('Which product first, how much and how')}</Text>
            </View>
            <Ionicons name="diamond" size={14} color="#33202E" />
          </View>
        </Card>
      ) : null}

      {!skinType && !saved ? (
        <Card tone="soft" style={{ marginTop: SPACING.md }} onPress={() => navigation.navigate('SkinProfile')}>
          <View style={styles.quizRow}>
            <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
            <Text style={[GTYPE.caption, { color: colors.text, flex: 1, ...GFW('600') }]}>
              {t('Complete your skin profile to personalize this routine')}
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
            <Pressable key={`${tab}-${idx}`} onPress={() => (step.product ? toggleStep(idx) : build())} style={styles.stepRow}>
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
                    <Text style={[GTYPE.caption, { color: colors.muted, ...GFW('700') }]}>{idx + 1}</Text>
                  )}
                </View>
                {!last ? <View style={[styles.line, { backgroundColor: colors.border }]} /> : null}
              </View>

              <Card style={[styles.stepCard, isDone && { opacity: 0.55 }]}>
                <View style={styles.stepHead}>
                  <Text style={[GTYPE.subheading, { color: colors.text, textDecorationLine: isDone ? 'line-through' : 'none' }]}>
                    {t(step.action)}
                  </Text>
                  {step.time ? <Badge label={t(step.time)} /> : null}
                </View>
                {step.product ? (
                  <Pressable
                    disabled={!step.product_id}
                    onPress={() => navigation.navigate('Product', { id: step.product_id })}
                    hitSlop={6}
                    style={({ pressed }) => [styles.productRow, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    {photoOf(step) ? <Image source={{ uri: photoOf(step) }} style={styles.productPhoto} resizeMode="contain" /> : null}
                    <Text style={[GTYPE.body, { color: step.product_id ? colors.primary : colors.textSecondary, flex: 1, fontWeight: step.product_id ? '600' : '400' }]}>{t(step.product)}</Text>
                    {step.product_id ? <Ionicons name="chevron-forward" size={16} color={colors.muted} /> : null}
                  </Pressable>
                ) : (
                  <Text style={[GTYPE.body, { color: colors.primary, ...GFW('600'), marginTop: SPACING.xs }]}>{t('Pick a product')} ›</Text>
                )}
                {productsById[step.product_id] ? (
                  <RoutineProductLine product={productsById[step.product_id]} profile={profile} stopAdvice={stopAdvice}
                    started={expectations.started[step.product_id]} verdict={expectations.verdicts[step.product_id]} canAsk={expectations.canAsk}
                    onAnswer={async value => { await expectations.answer(step.product_id, value); stopAdvice.reload(); }}
                    onStop={async () => { await stopAdvice.stop(productsById[step.product_id]); const r = await getUserRoutines(user.id); if (r.success) setSavedRoutines(r.data || []); }}
                    kodaPrefill={Array.isArray(step.days) && step.days.length && step.days.length < 7
                      ? t('Why do I use {product} only on these days ({days})?', { product: productsById[step.product_id].name, days: t(describeDays(step.days)) })
                      : t('How do I get the most out of {product} in my {period} routine?', { product: productsById[step.product_id].name, period: t(tab === 'morning' ? 'morning' : 'evening') })} />
                ) : null}
                {/* Her prescribed treatment: her doctor's times, and any alert (rulebook section 6). */}
                {step.rx ? (
                  <View style={{ marginTop: SPACING.xs, gap: 4 }}>
                    {Array.isArray(step.days) && step.days.length ? <Text style={[GTYPE.caption, { color: colors.muted }]}>{t(describeDays(step.days))}</Text> : null}
                    {(step.issues || []).map(issue => (
                      <Text key={issue.text} style={[GTYPE.caption, { color: issue.level === 'avoid' ? colors.warning : colors.textSecondary }]}>{t(issue.text)}. {t(issue.detail)}</Text>
                    ))}
                    <Text style={[GTYPE.caption, { color: colors.muted }]}>{t(step.why)}</Text>
                  </View>
                ) : null}
                {step.tip ? (
                  <View style={styles.tipRow}>
                    <Ionicons name="bulb-outline" size={14} color={colors.primary} />
                    <Text style={[GTYPE.caption, { color: colors.muted, flex: 1 }]}>{t(step.tip)}</Text>
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
  programmeButton: { backgroundColor: '#33202E', flexDirection: 'row', gap: 8, marginTop: SPACING.sm },
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


// The glossy universe (Lita, 2026-10-28): same screen, in pink glass by day and deep plum at night.
export default function RoutinesScreen(props) {
  return <GlossyScope><RoutinesScreenInner {...props} /></GlossyScope>
}
