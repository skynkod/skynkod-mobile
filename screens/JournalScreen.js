import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import { useLanguage } from '../utils/LanguageContext';
import { getUserRoutines } from '../utils/routines-service';
import { todaySteps } from '../utils/routine-checks';
import { getDayProgress, getRecentRegularity, localDay, syncTodayTicks } from '../utils/routine-log';
import { MOODS, TAGS, getEntriesBetween, saveDay } from '../utils/journal-day';
import { logError } from '../utils/errorLogger';
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
  const today = new Date();
  const [selected, setSelected] = useState(today);
  const [weekEntries, setWeekEntries] = useState([]);
  const [entryId, setEntryId] = useState(null);
  const [mood, setMood] = useState(null);
  const [tags, setTags] = useState([]);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | saved
  const [routineLog, setRoutineLog] = useState(null);
  const dirty = useRef(false);

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
      setWeekEntries(rows);
      const entry = rows.find(r => sameDay(new Date(r.date), selected));
      setEntryId(prev => entry?.id || prev);
      // The user already changed something while this was loading: keep it.
      if (dirty.current) return;
      setMood(MOODS.some(m => m.value === entry?.mood) ? entry.mood : null);
      setTags(entry?.skin_conditions || []);
      setNote(entry?.notes || '');
      setStatus('idle');
    } catch (error) {
      await logError('Journal_loadWeek', error, {}, 'warn');
    }
  }, [user?.id, selected.toDateString()]);

  // Routine progress for the selected day.
  const loadRoutines = useCallback(async () => {
    if (!user?.id) return;
    try {
      await syncTodayTicks(user.id);
      const [routines, progress, regularity] = await Promise.all([
        getUserRoutines(user.id),
        getDayProgress(user.id, localDay(selected)),
        getRecentRegularity(user.id, 7),
      ]);
      const list = routines.success ? routines.data || [] : [];
      const rows = ['morning', 'evening']
        .map(type => {
          const steps = todaySteps(list.find(r => r.type === type)?.steps || [], selected);
          return steps.length ? { type, total: steps.length, done: Math.min(progress[type].size, steps.length) } : null;
        })
        .filter(Boolean);
      setRoutineLog({ rows, regularity });
    } catch (error) {
      await logError('Journal_loadRoutines', error, {}, 'warn');
    }
  }, [user?.id, selected.toDateString()]);

  useFocusEffect(
    useCallback(() => {
      loadWeek();
      loadRoutines();
    }, [loadWeek, loadRoutines])
  );

  // Home's check-in shortcut lands on today.
  useEffect(() => {
    if (route?.params?.openNew) setSelected(new Date());
  }, [route?.params?.openNew]);

  // Writes the current answers. Mood and tags save at once, the note after a
  // short pause; anything pending is saved when leaving the screen.
  const latest = useRef({ mood, tags, note });
  latest.current = { mood, tags, note };
  const entryRef = useRef(entryId);
  entryRef.current = entryId;
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
      entryRef.current = id;
      setEntryId(id);
      dirty.current = false;
      setStatus('saved');
      setWeekEntries(prev => (prev.some(e => e.id === id) ? prev : [...prev, { id, date: selected.toISOString() }]));
    } catch (error) {
      setStatus('idle');
      await logError('Journal_save', error, {}, 'warn');
    }
  };

  useFocusEffect(
    useCallback(() => () => {
      clearTimeout(noteTimer.current);
      saveNow();
    }, [selected.toDateString(), user?.id])
  );

  const setMoodNow = value => {
    dirty.current = true;
    latest.current = { ...latest.current, mood: value };
    setMood(value);
    saveNow();
  };
  const toggleTag = (tag) => {
    const next = tags.includes(tag) ? tags.filter(x => x !== tag) : [...tags, tag];
    dirty.current = true;
    latest.current = { ...latest.current, tags: next };
    setTags(next);
    saveNow();
  };
  const setNoteLater = value => {
    dirty.current = true;
    setNote(value);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(saveNow, 700);
  };

  const isToday = sameDay(selected, today);

  return (
    <Screen back title={t('Journal')} keyboard>
      {/* Week strip */}
      <View style={styles.week}>
        <Pressable
          onPress={() => setSelected(d => { const x = new Date(d); x.setDate(x.getDate() - 7); return x; })}
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
              onPress={async () => { await saveNow(); dirty.current = false; setSelected(d); }}
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
          onPress={() => setSelected(d => { const x = new Date(d); x.setDate(x.getDate() + 7); return x > today ? new Date() : x; })}
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
          {status === 'saving' ? <ActivityIndicator size="small" color={colors.muted} /> : null}
          {status === 'saved' ? <Text style={[TYPE.caption, { color: colors.success, fontWeight: '600' }]}>{t('Saved')}</Text> : null}
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
                <Text style={[TYPE.caption, { color: on ? colors.primary : colors.textSecondary, fontWeight: on ? '700' : '500' }]}>{t(m.label)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.xl }]}>{t("What's going on?")}</Text>
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>{t('Select all that apply')}</Text>
        <View style={styles.tags}>
          {TAGS.map(tag => {
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

        <TextInput
          value={note}
          onChangeText={setNoteLater}
          placeholder={t('Add a note…')}
          placeholderTextColor={colors.muted}
          multiline
          style={[styles.note, { backgroundColor: colors.surface, color: colors.text }]}
        />
      </View>

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
  card: { borderRadius: RADIUS.xl, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.xl, marginTop: SPACING.xl },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overline: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  moods: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.lg },
  mood: { alignItems: 'center', gap: 6, width: 58 },
  face: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md },
  tag: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  note: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.xl, minHeight: 52, fontSize: 15 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.md, padding: SPACING.lg, marginTop: SPACING.md },
});
