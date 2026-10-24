import React, { useCallback, useEffect, useRef, useState } from 'react';
import { syncSoon } from '../utils/journey';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import { useLanguage } from '../utils/LanguageContext';
import { getUserRoutines } from '../utils/routines-service';
import { todaySteps } from '../utils/routine-checks';
import { currentRoutine, todayStepsWithPauses } from '../utils/current-routine';
import { getDayProgress, getRecentRegularity, localDay, syncTodayTicks } from '../utils/routine-log';
import { MOODS, TAGS, MOOD_MESSAGES, getEntriesBetween, saveDay, getSkinPatterns, getProductReactions } from '../utils/journal-day';
import SkinStateChips from '../components/SkinStateChips';
import { getMyProducts } from '../utils/catalog';
import { getPausedProducts, setProductPaused } from '../utils/paused-products';
import { repauseAfterReaction } from '../utils/emergency-state';
import { logError } from '../utils/errorLogger';
import { issuesFromTags } from '../utils/sos-plan';
import { isPremiumUser } from '../utils/premium';
import { PremiumBlur } from '../components/PremiumLock';
import { skinDay, skinDayKey } from '../utils/skin-day';

// A ticked problem suggests the matching 7-day plan (Emergency mode).
const planFor = tags => {
  const red = tags.includes('Redness') || tags.includes('Itchiness / Sensitivity');
  if (tags.includes('Used new product') && red) return 'reaction';
  if (tags.includes('New pimple')) return 'breakout';
  if (red) return 'irritation';
  if (tags.includes('Peeling / Flaking')) return 'peeling';
  if (tags.includes('Dryness')) return 'barrier';
  return null;
};
// A short message for the mood, and simple, general tips for each problem
// ticked (free for everyone; the tailored 7-day plan is Emergency mode).
const TAG_TIPS = {
  'New pimple': 'Don’t pick it. A hydrocolloid patch helps it heal faster.',
  'Redness': 'Skip strong actives today and rinse with cool water.',
  'Dryness': 'Moisturize on damp skin and avoid hot water.',
  'Itchiness / Sensitivity': 'Use only fragrance-free products today.',
  'Oily': 'A gentle cleanse is enough: over-washing makes more oil.',
  'Peeling / Flaking': 'Don’t scrub the flakes. Moisturize and pause retinol and acids.',
  'Sun exposure': 'Soothe with a calming moisturizer, and wear SPF tomorrow.',
  'Poor sleep': 'Try to sleep 7 to 9 hours tonight: skin repairs itself at night.',
  'Stress': 'Stress shows on skin. Take 10 calm minutes before bed.',
  'Hormonal / Period': 'Breakouts around your period are common. Keep your routine gentle.',
  'Used new product': 'If it stings, stop the new product and go back to basics.',
};

// An okay day only offers the small everyday issues; the full list is for
// Bad and Terrible.
const OKAY_TAGS = ['Dryness', 'Oily', 'Poor sleep', 'Stress', 'Sun exposure', 'Hormonal / Period'];

// Several problems ticked: one message that covers them all.
const PROBLEM_TAGS = ['New pimple', 'Redness', 'Itchiness / Sensitivity', 'Peeling / Flaking', 'Dryness', 'Used new product'];
const planPrompt = tags => (tags.filter(tag => PROBLEM_TAGS.includes(tag)).length > 1
  ? 'Your skin is having a hard time? Start a 7-day plan to help it recover'
  : PLAN_PROMPTS[planFor(tags)]);
const PLAN_PROMPTS = {
  reaction: 'Reacting to a new product? Start a 7-day plan to reset your skin',
  breakout: 'A new pimple? Start a 7-day plan to calm your skin',
  irritation: 'Redness? Start a 7-day plan to calm your skin',
  peeling: 'Peeling skin? Start a 7-day plan to soothe it',
  barrier: 'Dry skin? Start a 7-day plan to repair your barrier',
};
import { Screen, useColors } from '../components/ui';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

const startOfWeek = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d;
};
const sameDay = (a, b) => a.toDateString() === b.toDateString();

// Journal from the mockup: pick a day of the week, a quick check-in (mood,
// what's going on, a note) saved automatically, and today's routines.
export default function JournalScreen({ route, navigation }) {
  const colors = useColors();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  // Today is the skin day (sunrise to sunrise), like on Home: at 1 am it is still yesterday.
  const today = skinDay();
  const [selected, setSelected] = useState(today);
  const [weekEntries, setWeekEntries] = useState([]);
  const [entryId, setEntryId] = useState(null);
  const [mood, setMood] = useState(null);
  const [tags, setTags] = useState([]);
  const [states, setStates] = useState([]);
  // "Used new product": which one(s), to spot reactions over the next days.
  const [newProducts, setNewProducts] = useState([]);
  const [owned, setOwned] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [paused, setPaused] = useState([]);
  useEffect(() => {
    if (!user?.id) return;
    getMyProducts(user.id).then(rows => setOwned(rows.filter(r => r.status === 'owned' && r.product_id).map(r => ({ id: r.product_id, name: [r.product?.brand || r.brand, r.product?.name || r.product_name].filter(Boolean).join(' ') })))).catch(() => {});
    getProductReactions(user.id).then(setReactions).catch(() => {});
    getPausedProducts(user.id).then(setPaused);
  }, [user?.id]);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('idle'); // idle | dirty | saving | saved
  const [routineLog, setRoutineLog] = useState(null);
  const [skinPatterns, setSkinPatterns] = useState(null);
  const dirty = useRef(false);
  const [premium, setPremiumState] = useState(false);
  useFocusEffect(useCallback(() => { if (user?.id) isPremiumUser(user.id).then(setPremiumState).catch(() => {}); }, [user?.id]));

  const weekStart = startOfWeek(selected);
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Entries of the visible week, then the selected day's answers.
  const loadWeek = useCallback(async () => {
    if (!user?.id) return;
    try {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 7);
      const rows = await getEntriesBetween(user.id, weekStart, end);
      // She moved to another day while this was loading: that day loads its own.
      if (entryDay.current !== selected.toDateString()) return;
      setWeekEntries(rows);
      const entry = rows.find(r => sameDay(new Date(r.date), selected));
      setEntryId(prev => entry?.id || prev);
      // The user already changed something while this was loading: keep it.
      if (dirty.current) return;
      setMood(MOODS.some(m => m.value === entry?.mood) ? entry.mood : null);
      setTags(entry?.skin_conditions || []);
      setStates(entry?.skin_state || []);
      setNewProducts(Array.isArray(entry?.products_used) ? entry.products_used : []);
      setNote(entry?.notes || '');
      setStatus('idle');
    } catch (error) {
      await logError('Journal_loadWeek', error, {}, 'warn');
    }
  }, [user?.id, selected.toDateString()]);

  // A new day starts without an entry until loadWeek finds one, so a save
  // never updates the entry of the day shown before.
  useEffect(() => {
    setEntryId(null);
  }, [selected.toDateString()]);

  // Routine progress for the selected day.
  const loadRoutines = useCallback(async () => {
    if (!user?.id) return;
    try {
      await syncTodayTicks(user.id);
      const [routines, progress, regularity] = await Promise.all([
        getUserRoutines(user.id),
        getDayProgress(user.id, sameDay(selected, today) ? skinDayKey() : localDay(selected)),
        getRecentRegularity(user.id, 7),
      ]);
      const list = routines.success ? routines.data || [] : [];
      // Today counts the steps exactly as Home shows them (paused products left out).
      const isToday = sameDay(selected, skinDay());
      const rows = (await Promise.all(['morning', 'evening'].map(async type => {
        const routine = currentRoutine(list, type);
        const steps = isToday ? await todayStepsWithPauses(user.id, routine) : todaySteps(routine?.steps || [], selected);
        return steps.length ? { type, total: steps.length, done: Math.min(progress[type].size, steps.length) } : null;
      }))).filter(Boolean);
      setRoutineLog({ rows, regularity });
    } catch (error) {
      await logError('Journal_loadRoutines', error, {}, 'warn');
    }
  }, [user?.id, selected.toDateString()]);

  useFocusEffect(
    useCallback(() => {
      loadWeek();
      loadRoutines();
      if (user?.id) getSkinPatterns(user.id).then(setSkinPatterns).catch(error => logError('Journal_patterns', error, {}, 'warn'));
    }, [loadWeek, loadRoutines, user?.id])
  );

  // Home's check-in shortcut lands on today.
  useEffect(() => {
    if (route?.params?.openNew) setSelected(skinDay());
  }, [route?.params?.openNew]);

  // From a Dekod scan: what it saw is pre-ticked, ready to check and save.
  useEffect(() => {
    const preset = route?.params?.presetTags;
    if (!route?.params?.presetAt || !preset?.length) return;
    dirty.current = true;
    // Okay only lists everyday issues: anything else needs the full Bad list.
    const needsFull = preset.some(tag => !OKAY_TAGS.includes(tag));
    const base = ['okay', 'bad', 'terrible'].includes(mood) ? mood : route.params.presetMood || 'okay';
    const m = base === 'okay' && needsFull ? 'bad' : base;
    setMood(m);
    setTags(prev => [...new Set([...prev, ...preset])]);
    setStatus('dirty');
  }, [route?.params?.presetAt]);

  // Nothing saves by itself: she taps Save, so she knows it's kept. Leaving
  // with unsaved changes asks whether to save them.
  const latest = useRef({ mood, tags, note, newProducts, states });
  latest.current = { mood, tags, note, newProducts, states };
  const entryRef = useRef(entryId);
  entryRef.current = entryId;
  const entryDay = useRef(selected.toDateString());
  if (entryDay.current !== selected.toDateString()) {
    entryDay.current = selected.toDateString();
    entryRef.current = null;
  }
  const noteTimer = useRef(null);

  // Saves run one after another, so quick taps never create two entries.
  const queue = useRef(Promise.resolve());
  const saveNow = () => {
    queue.current = queue.current.then(saveOnce);
    return queue.current;
  };
  const saveOnce = async () => {
    if (!dirty.current || !user?.id) return;
    setStatus('saving');
    try {
      const id = await saveDay(user.id, selected, { ...latest.current, notes: latest.current.note }, entryRef.current);
      // Gradual return after a 7-day plan: a reaction puts the last product back on pause.
      if ((latest.current.tags || []).some(tag => ['New pimple', 'Redness', 'Itchiness / Sensitivity', 'Peeling / Flaking'].includes(tag))) {
        repauseAfterReaction(user.id).then(id2 => { if (id2) Alert.alert(t('Back on pause'), t('Your skin reacted: the last product that came back is paused again for now.')) });
      }
      entryRef.current = id;
      setEntryId(id);
      syncSoon(user.id);
      dirty.current = false;
      setStatus('saved');
      setWeekEntries(prev => (prev.some(e => e.id === id) ? prev : [...prev, { id, date: selected.toISOString() }]));
    } catch (error) {
      setStatus('dirty');
      Alert.alert(t('Couldn’t save'), t('Check your connection and try again.'));
      await logError('Journal_save', error, {}, 'warn');
    }
  };

  useFocusEffect(
    useCallback(() => () => {
      clearTimeout(noteTimer.current);
      if (!dirty.current) return;
      Alert.alert(t('Save your check-in?'), t('You left the journal without saving.'), [
        { text: t("Don't save"), style: 'destructive', onPress: () => { dirty.current = false; setStatus('idle'); } },
        { text: t('Save'), onPress: () => saveNow() },
      ]);
    }, [selected.toDateString(), user?.id])
  );

  // Changing day with unsaved changes: ask first.
  const leaveDay = go => {
    if (!dirty.current) return go();
    Alert.alert(t('Save your check-in?'), t('You changed something on this day.'), [
      { text: t("Don't save"), style: 'destructive', onPress: () => { dirty.current = false; setStatus('idle'); go(); } },
      { text: t('Save'), onPress: async () => { await saveNow(); go(); } },
    ]);
  };
  const markDirty = () => { dirty.current = true; setStatus('dirty'); };

  // A new mood starts the details over: what was ticked before is cleared.
  const setMoodNow = value => {
    dirty.current = true;
    const changed = value !== mood;
    latest.current = { ...latest.current, mood: value, ...(changed ? { tags: [] } : {}) };
    setMood(value);
    if (changed) setTags([]);
    markDirty();
  };
  const toggleNewProduct = (p) => {
    const next = newProducts.some(x => x.id === p.id) ? newProducts.filter(x => x.id !== p.id) : [...newProducts, p];
    latest.current = { ...latest.current, newProducts: next };
    setNewProducts(next);
    markDirty();
  };
  const togglePause = async (product) => {
    const isPaused = paused.some(p => p.id === product.id);
    setPaused(await setProductPaused(user.id, product, !isPaused));
  };
  const toggleTag = (tag) => {
    const next = tags.includes(tag) ? tags.filter(x => x !== tag) : [...tags, tag];
    dirty.current = true;
    latest.current = { ...latest.current, tags: next };
    setTags(next);
    markDirty();
  };
  const setStatesNow = (next) => {
    dirty.current = true;
    latest.current = { ...latest.current, states: next };
    setStates(next);
    markDirty();
  };
  const setNoteLater = value => {
    setNote(value);
    markDirty();
  };

  const isToday = sameDay(selected, today);

  return (
    <Screen back title={t('Journal')} keyboard>
      {/* Week strip */}
      <View style={styles.week}>
        <Pressable
          onPress={() => leaveDay(() => setSelected(d => { const x = new Date(d); x.setDate(x.getDate() - 7); return x; }))}
          hitSlop={8}
          accessibilityLabel={t('Previous week')}
        >
          <Ionicons name="chevron-back" size={18} color={colors.muted} />
        </Pressable>
        {days.map(d => {
          const on = sameDay(d, selected);
          const future = d > today && !sameDay(d, today);
          const logged = weekEntries.some(e => sameDay(new Date(e.date), d));
          return (
            <Pressable
              key={d.toISOString()}
              disabled={future}
              onPress={() => leaveDay(() => setSelected(d))}
              style={[styles.day, on && { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.dayName, { color: on ? '#FFFFFF' : colors.textSecondary }]}>
                {d.toLocaleDateString(language, { weekday: 'short' }).replace('.', '')}
              </Text>
              <Text style={[styles.dayNum, { color: on ? '#FFFFFF' : future ? colors.muted : colors.text }]}>{d.getDate()}</Text>
              <View style={[styles.dot, { backgroundColor: logged ? (on ? '#FFFFFF' : colors.accent) : 'transparent' }]} />
            </Pressable>
          );
        })}
        <Pressable
          disabled={sameDay(weekStart, startOfWeek(today))}
          onPress={() => leaveDay(() => setSelected(d => { const x = new Date(d); x.setDate(x.getDate() + 7); return x > today ? skinDay() : x; }))}
          hitSlop={8}
          accessibilityLabel={t('Next week')}
        >
          <Ionicons name="chevron-forward" size={18} color={sameDay(weekStart, startOfWeek(today)) ? 'transparent' : colors.muted} />
        </Pressable>
      </View>

      {/* Check-in */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHead}>
          <Text style={[styles.overline, { color: colors.primary }]}>{t('CHECK-IN')}</Text>
          {status === 'dirty' ? <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '600' }]}>{t('Not saved yet')}</Text> : null}
        </View>
        <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.sm }]}>
          {isToday ? t('How is your skin today?') : t('How was your skin that day?')}
        </Text>
        <View style={styles.moods}>
          {MOODS.map(m => {
            const on = mood === m.value;
            return (
              <Pressable key={m.value} onPress={() => setMoodNow(on ? null : m.value)} style={styles.mood}>
                <View style={[styles.face, on && { backgroundColor: colors.primarySoft }]}>
                  <MaterialCommunityIcons name={m.icon} size={34} color={on ? colors.primary : colors.textSecondary} />
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[TYPE.caption, { color: on ? colors.primary : colors.textSecondary, fontWeight: on ? '700' : '500', textAlign: 'center' }]}>{t(m.label)}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Her skin state today, under the mood */}
        <SkinStateChips value={states} onChange={setStatesNow} style={{ marginTop: SPACING.lg }} />

        {/* Dekod, the skin scan (Premium) */}
        <Pressable onPress={() => navigation.navigate('Dekod')} style={[styles.planCard, { backgroundColor: '#33202E' }]}>
          <Ionicons name="scan-circle-outline" size={20} color="#E2C6DA" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#E2C6DA', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>{t('DEKOD · SKIN SCAN')}</Text>
            <Text style={[TYPE.caption, { color: '#FFFFFF', fontWeight: '700', lineHeight: 18, marginTop: 2 }]}>{t('Scan your skin with one selfie')}</Text>
          </View>
          <Ionicons name={premium ? 'diamond' : 'lock-closed'} size={15} color="#E2C6DA" />
        </Pressable>

        {mood && MOOD_MESSAGES[mood] ? (
          <View style={[styles.tipBox, { backgroundColor: colors.surface }]}>
            <Ionicons name="sparkles-outline" size={15} color={colors.primary} />
            <Text style={[TYPE.caption, { color: colors.text, flex: 1, lineHeight: 18 }]}>{t(MOOD_MESSAGES[mood])}</Text>
          </View>
        ) : null}

        {/* Only when the skin isn’t at its best: Okay, Not great or Tough day */}
        {['okay', 'bad', 'terrible'].includes(mood) ? (
          <>
        <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.xl }]}>{t("What's going on?")}</Text>
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>{t('Select all that apply')}</Text>
        <View style={styles.tags}>
          {(mood === 'okay' ? OKAY_TAGS : TAGS).map(tag => {
            const on = tags.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag)}
                style={[styles.tag, { backgroundColor: on ? colors.primarySoft : colors.card, borderColor: on ? colors.primarySoft : colors.border }]}
              >
                <Text style={[TYPE.caption, { color: on ? colors.primary : colors.text, fontWeight: '600' }]}>{t(tag)}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Which new product: the app can then spot reactions that follow it */}
        {tags.includes('Used new product') ? (
          <View style={{ marginTop: SPACING.md }}>
            <Text style={[TYPE.caption, { color: colors.text, fontWeight: '700' }]}>{t('Which new product?')}</Text>
            {owned.length ? (
              <View style={[styles.tags, { marginTop: SPACING.sm }]}>
                {owned.slice(0, 12).map(p => {
                  const on = newProducts.some(x => x.id === p.id);
                  return (
                    <Pressable key={p.id} onPress={() => toggleNewProduct(p)} style={[styles.tag, { backgroundColor: on ? colors.primarySoft : colors.card, borderColor: on ? colors.primarySoft : colors.border }]}>
                      <Text style={[TYPE.caption, { color: on ? colors.primary : colors.text, fontWeight: '600' }]} numberOfLines={1}>{p.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4 }]}>{t('Add it to My products to follow how your skin reacts.')}</Text>
            )}
          </View>
        ) : null}

        {tags.some(tag => TAG_TIPS[tag]) ? (
          <View style={[styles.tipBox, { backgroundColor: colors.surface, flexDirection: 'column', alignItems: 'stretch', gap: 6 }]}>
            {tags.filter(tag => TAG_TIPS[tag]).map(tag => (
              <Text key={tag} style={[TYPE.caption, { color: colors.text, lineHeight: 18 }]}>
                <Text style={{ fontWeight: '700' }}>{t(tag)} · </Text>{t(TAG_TIPS[tag])}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Offered as soon as the skin isn't great, even before ticking anything */}
        {['okay', 'bad', 'terrible'].includes(mood) ? (
          <Pressable
            onPress={() => navigation.navigate('Emergency', { issues: issuesFromTags(tags), openedAt: Date.now() })}
            style={[styles.planCard, { backgroundColor: '#33202E' }]}
          >
            <Ionicons name="diamond" size={16} color="#E2C6DA" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#E2C6DA', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>{t('EMERGENCY MODE')}</Text>
              <Text style={[TYPE.caption, { color: '#FFFFFF', fontWeight: '700', lineHeight: 18, marginTop: 2 }]}>{t(planFor(tags) ? planPrompt(tags) : 'Skin not at its best? Get a 7-day plan made for it')}</Text>
            </View>
            <Ionicons name={premium ? 'chevron-forward' : 'lock-closed'} size={16} color="#E2C6DA" />
          </Pressable>
        ) : null}
          </>
        ) : null}

        {/* Our own placeholder: iOS loses the built-in one once a note is erased */}
        <View>
          <TextInput
            value={note}
            onChangeText={setNoteLater}
            multiline
            accessibilityLabel={t('Add a note…')}
            style={[styles.note, { backgroundColor: colors.surface, color: colors.text }]}
          />
          {!note?.trim() ? (
            <Text pointerEvents="none" style={[styles.notePlaceholder, { color: colors.muted }]}>{t('Add a note…')}</Text>
          ) : null}
        </View>

        {/* Saved: a short "✓ Saved", then back to Home */}
        <Pressable onPress={async () => { await saveNow(); if (!dirty.current) setTimeout(() => navigation.navigate('Home'), 500); }} disabled={status !== 'dirty'}
          style={({ pressed }) => [styles.saveBtn, { backgroundColor: status === 'saved' ? colors.successSoft || colors.primarySoft : colors.primary, opacity: status === 'idle' ? 0.45 : pressed ? 0.85 : 1 }]}>
          {status === 'saving' ? <ActivityIndicator size="small" color={colors.onPrimary} /> : (
            <Text style={{ color: status === 'saved' ? colors.success : colors.onPrimary, fontWeight: '700', fontSize: 15 }}>
              {status === 'saved' ? `✓ ${t('Saved')}` : t('Save')}
            </Text>
          )}
        </Pressable>
      </View>

      {/* A product that keeps being followed by a reaction */}
      {reactions.slice(0, 2).map(r => {
        const isPaused = paused.some(p => p.id === r.product.id);
        return (
          <View key={r.product.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.overline, { color: colors.primary }]}>{t('A PRODUCT TO WATCH')}</Text>
            <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.sm, lineHeight: 21 }]}>
              {t('{tag} often appeared in the days after you started {product}.', { tag: t(r.tag), product: r.product.name })}
            </Text>
            <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4 }]}>{t('Seen {n} times in your journal. It may be a coincidence.', { n: r.count })}</Text>
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
              <Pressable onPress={() => togglePause(r.product)} style={[styles.smallBtn, { backgroundColor: isPaused ? colors.primarySoft : colors.primary }]}>
                <Text style={[TYPE.caption, { color: isPaused ? colors.primary : colors.onPrimary, fontWeight: '700' }]}>{t(isPaused ? 'Resume it' : 'Pause it')}</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Koda', { prefill: t('My skin often reacts after I use {product}. What should I do?', { product: r.product.name }) })} style={[styles.smallBtn, { backgroundColor: colors.surface }]}>
                <Text style={[TYPE.caption, { color: colors.text, fontWeight: '700' }]}>{t('Ask Koda')}</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {/* What your skin tells you: links that keep coming back (observations, no advice) */}
      {skinPatterns ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.overline, { color: colors.primary }]}>{t('WHAT YOUR SKIN TELLS YOU')}</Text>
          {!skinPatterns.ready ? (
            <>
              <Text style={[TYPE.body, { color: colors.text, marginTop: SPACING.md }]}>
                {t('Keep checking in: {n} of {total} days.', { n: skinPatterns.checkIns, total: skinPatterns.needed })}
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
                <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${Math.round((skinPatterns.checkIns / skinPatterns.needed) * 100)}%` }]} />
              </View>
              <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.sm }]}>
                {t("Then we'll tell you what makes your skin react.")}
              </Text>
            </>
          ) : skinPatterns.patterns.length ? (
            // Free: the first thing her skin tells her. Premium: all of it.
            (() => {
              const row = p => (
              <View key={p.id} style={styles.patternRow}>
                <View style={[styles.patternIcon, { backgroundColor: p.positive ? colors.successSoft : colors.primarySoft }]}>
                  <Ionicons name={p.icon} size={18} color={p.positive ? colors.success : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.body, { color: colors.text }]}>{t(p.text)}</Text>
                  <Text style={[TYPE.caption, { color: colors.muted, marginTop: 2 }]}>{t('Noticed {n} of {total} times', { n: p.times, total: p.total })}</Text>
                </View>
              </View>
              );
              const [first, ...rest] = skinPatterns.patterns;
              if (premium || !rest.length) return skinPatterns.patterns.map(row);
              return (
                <>
                  {row(first)}
                  <PremiumBlur locked title={t('{n} more things your skin tells you', { n: rest.length })} text="The patterns behind your good and bad skin days." style={{ marginTop: SPACING.sm }}>
                    {rest.slice(0, 3).map(row)}
                  </PremiumBlur>
                </>
              );
            })()
          ) : (
            <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.md }]}>
              {t('Nothing stands out yet. Keep checking in, it gets clearer over time.')}
            </Text>
          )}
          {skinPatterns.ready ? (
            <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.md }]}>{t('These are trends, not a diagnosis.')}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Routines of that day */}
      {routineLog?.rows.length ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.overline, { color: colors.primary }]}>{isToday ? t('LOG TODAY') : t('ROUTINES THAT DAY')}</Text>
          {routineLog.rows.map(row => {
            const complete = row.done >= row.total;
            return (
              <Pressable
                key={row.type}
                onPress={() => navigation?.navigate('Routines', { tab: row.type })}
                style={[styles.logRow, { backgroundColor: colors.surface }]}
              >
                <Ionicons name={row.type === 'morning' ? 'sunny' : 'moon-outline'} size={20} color={row.type === 'morning' ? '#E8B04A' : colors.secondary} />
                <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>{row.type === 'morning' ? t('Morning Routine') : t('Tonight Routine')}</Text>
                {complete ? <Ionicons name="checkmark" size={16} color={colors.success} /> : null}
                <Text style={[TYPE.caption, { color: complete ? colors.success : colors.textSecondary, fontWeight: '700' }]}>
                  {t('{done}/{total} steps', { done: row.done, total: row.total })}
                </Text>
              </Pressable>
            );
          })}
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.sm }]}>
            {t('Routine done {done} of the last {days} days', { done: routineLog.regularity.done, days: routineLog.regularity.days })}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.sm },
  day: { width: 40, alignItems: 'center', paddingVertical: 8, borderRadius: 14 },
  dayName: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  dayNum: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 4 },
  progressTrack: { height: 6, borderRadius: 3, marginTop: SPACING.md, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  patternRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginTop: SPACING.md },
  patternIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.lg },
  smallBtn: { flex: 1, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  tipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginTop: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.md },
  planCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg },
  card: { borderRadius: RADIUS.xl, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.xl, marginTop: SPACING.xl },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overline: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  moods: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.lg },
  notePlaceholder: { position: 'absolute', top: SPACING.xl + SPACING.lg, left: SPACING.lg, fontSize: 15, zIndex: 2, elevation: 2 },
  mood: { alignItems: 'center', gap: 6, width: 58 },
  face: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md },
  tag: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  note: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.xl, minHeight: 52, fontSize: 15 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.md, padding: SPACING.lg, marginTop: SPACING.md },
});
