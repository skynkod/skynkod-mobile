import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView, Image } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useColors } from './ui'
import { useT } from '../utils/LanguageContext'
import { MOODS, TAGS, saveDay } from '../utils/journal-day'
import { logError } from '../utils/errorLogger'
import { track } from '../utils/analytics'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

const KODA = require('../assets/images/koda-logo.png')

// Each mood's colour, from great (green) to terrible (red).
const moodColors = colors => ({
  great: { fg: colors.success, bg: colors.successSoft },
  good: { fg: colors.success, bg: colors.successSoft },
  okay: { fg: colors.caution, bg: colors.cautionSoft },
  bad: { fg: colors.warning, bg: colors.warningSoft },
  terrible: { fg: colors.danger, bg: colors.dangerSoft },
})

// Home's morning check-in: one tap on a face, optional tags, then it folds
// into a slim line. Writes the same daily entry as the Journal.
export default function MorningCheckIn({ userId, entry, streak = 0, onSaved, onSkip, onOpenJournal, startExpanded = false, glass = false }) {
  const colors = useColors()
  const t = useT()
  const [mood, setMood] = useState(entry?.mood || null)
  const [tags, setTags] = useState(entry?.skin_conditions || [])
  const [expanded, setExpanded] = useState(startExpanded)
  const palette = moodColors(colors)
  const entryId = useRef(entry?.id || null)

  // The answer may have changed in the Journal: follow it.
  useEffect(() => {
    entryId.current = entry?.id || null
    setMood(entry?.mood || null)
    setTags(entry?.skin_conditions || [])
  }, [entry?.id, entry?.mood, (entry?.skin_conditions || []).join('|')])

  const queue = useRef(Promise.resolve())
  const save = (nextMood, nextTags) => {
    queue.current = queue.current.then(() => saveOnce(nextMood, nextTags))
  }
  const saveOnce = async (nextMood, nextTags) => {
    try {
      const first = !entryId.current
      const id = await saveDay(userId, new Date(), { mood: nextMood, tags: nextTags, notes: entry?.notes || '' }, entryId.current)
      // Only that the check-in was done, never the mood or the tags.
      if (first) track('checkin_done')
      entryId.current = id
      onSaved?.({ id, date: new Date().toISOString(), mood: nextMood, skin_conditions: nextTags, notes: entry?.notes || '' })
    } catch (error) {
      await logError('MorningCheckIn_save', error, {}, 'warn')
    }
  }

  const pickMood = (value) => {
    setMood(value)
    setExpanded(true)
    save(value, tags)
  }

  const toggleTag = (tag) => {
    const next = tags.includes(tag) ? tags.filter(x => x !== tag) : [...tags, tag]
    setTags(next)
    save(mood, next)
  }

  // Done: a small card with today's answer and the check-in streak.
  if (mood && !expanded) {
    const m = MOODS.find(x => x.value === mood)
    const c = palette[mood] || palette.okay
    return (
      <Pressable onPress={onOpenJournal} style={[styles.doneCard, glass ? styles.inGlass : { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.doneFace, { backgroundColor: c.bg }]}>
          <MaterialCommunityIcons name={m?.icon || 'emoticon-neutral-outline'} size={28} color={c.fg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('Skin today')}</Text>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(m?.label || '')}</Text>
          {tags.length ? (
            <View style={styles.doneTags}>
              {tags.slice(0, 3).map(x => (
                <View key={x} style={[styles.doneTag, { backgroundColor: colors.primarySoft }]}>
                  <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>{t(x)}</Text>
                </View>
              ))}
              {tags.length > 3 ? <Text style={{ fontSize: 11, color: colors.muted }}>+{tags.length - 3}</Text> : null}
            </View>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          {streak >= 2 ? <Text style={[TYPE.caption, { color: colors.text, fontWeight: '700' }]}>🔥 {t('{n}-day streak', { n: streak })}</Text> : null}
          <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Edit')}</Text>
        </View>
      </Pressable>
    )
  }

  return (
    <View style={[styles.card, glass ? styles.inGlass : { backgroundColor: colors.primarySoft }]}>
      <View style={styles.head}>
        <View style={styles.asker}>
          <Image source={KODA} style={styles.koda} />
          <Text style={[styles.overline, { color: colors.primary }]}>{t('KODA ASKS')}</Text>
        </View>
        {!mood ? (
          <Pressable onPress={onSkip} hitSlop={10}>
            <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '600' }]}>{t('Skip today')}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={[styles.question, { color: colors.text }]}>{t("How's your skin this morning?")}</Text>
      {!mood ? (
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>
          {t('5 seconds. It helps Koda adapt your day.')}{streak >= 2 ? `  🔥 ${t('{n}-day streak', { n: streak })}` : ''}
        </Text>
      ) : null}

      <View style={styles.moods}>
        {MOODS.map(m => {
          const on = mood === m.value
          const c = palette[m.value]
          return (
            <Pressable key={m.value} onPress={() => pickMood(m.value)} style={styles.mood} accessibilityLabel={t(m.label)}>
              <View style={[styles.face, { backgroundColor: on ? c.bg : colors.card }, on && { transform: [{ scale: 1.08 }] }]}>
                <MaterialCommunityIcons name={m.icon} size={34} color={on ? c.fg : colors.textSecondary} />
              </View>
              <Text style={[styles.moodLabel, { color: on ? c.fg : colors.textSecondary, fontWeight: on ? '700' : '500' }]}>{t(m.label)}</Text>
            </Pressable>
          )
        })}
      </View>

      {mood ? (
        <>
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.lg }]}>{t('Anything going on? (optional)')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tags}>
            {TAGS.map(tag => {
              const on = tags.includes(tag)
              return (
                <Pressable
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[styles.tag, { backgroundColor: on ? colors.card : 'transparent', borderColor: on ? colors.primary : colors.border }]}
                >
                  <Text style={[TYPE.caption, { color: on ? colors.primary : colors.text, fontWeight: '600' }]}>{t(tag)}</Text>
                </Pressable>
              )
            })}
          </ScrollView>
          <Pressable onPress={() => setExpanded(false)} style={[styles.done, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.onPrimary, fontWeight: '600' }}>{t('Done')}</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.xl, padding: SPACING.xl, marginTop: SPACING.xl },
  // Inside a Glass card on Home: the glass gives the background and spacing.
  inGlass: { marginTop: 0, borderWidth: 0, backgroundColor: 'transparent' },
  asker: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  koda: { width: 18, height: 18 },
  question: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, marginTop: SPACING.md },
  doneCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, marginTop: SPACING.xl },
  doneFace: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  doneTags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 4 },
  doneTag: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overline: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  moods: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md },
  mood: { alignItems: 'center', gap: 6, width: 58 },
  face: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  moodLabel: { fontSize: 11 },
  tags: { gap: SPACING.sm, paddingVertical: SPACING.sm },
  tag: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  done: { alignSelf: 'flex-end', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8, marginTop: SPACING.sm },
  line: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 10, paddingHorizontal: SPACING.lg, marginTop: SPACING.xl },
})
