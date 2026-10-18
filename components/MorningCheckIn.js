import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useColors } from './ui'
import { useT } from '../utils/LanguageContext'
import { MOODS, TAGS, saveDay } from '../utils/journal-day'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// Home's morning check-in: one tap on a face, optional tags, then it folds
// into a slim line. Writes the same daily entry as the Journal.
export default function MorningCheckIn({ userId, entry, onSaved, onSkip, onOpenJournal }) {
  const colors = useColors()
  const t = useT()
  const [mood, setMood] = useState(entry?.mood || null)
  const [tags, setTags] = useState(entry?.skin_conditions || [])
  const [expanded, setExpanded] = useState(false)
  const entryId = useRef(entry?.id || null)

  useEffect(() => {
    entryId.current = entry?.id || null
  }, [entry?.id])

  const save = async (nextMood, nextTags) => {
    try {
      const id = await saveDay(userId, new Date(), { mood: nextMood, tags: nextTags, notes: entry?.notes || '' }, entryId.current)
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

  // Done: a slim line with today's answer.
  if (mood && !expanded) {
    const m = MOODS.find(x => x.value === mood)
    return (
      <Pressable onPress={onOpenJournal} style={[styles.line, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialCommunityIcons name={m?.icon || 'emoticon-neutral-outline'} size={22} color={colors.primary} />
        <Text style={[TYPE.caption, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
          {t('Skin today')}: <Text style={{ color: colors.text, fontWeight: '700' }}>{t(m?.label || '')}</Text>
          {tags.length ? ` · ${tags.map(x => t(x)).join(', ')}` : ''}
        </Text>
        <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Edit')}</Text>
      </Pressable>
    )
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.accent }]}>
      <View style={styles.head}>
        <Text style={[styles.overline, { color: colors.primary }]}>{t('MORNING CHECK-IN')}</Text>
        {!mood ? (
          <Pressable onPress={onSkip} hitSlop={10}>
            <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '600' }]}>{t('Skip today')}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.sm }]}>{t("How's your skin this morning?")}</Text>

      <View style={styles.moods}>
        {MOODS.map(m => {
          const on = mood === m.value
          return (
            <Pressable key={m.value} onPress={() => pickMood(m.value)} style={styles.mood} accessibilityLabel={t(m.label)}>
              <View style={[styles.face, on && { backgroundColor: colors.primarySoft }]}>
                <MaterialCommunityIcons name={m.icon} size={30} color={on ? colors.primary : colors.textSecondary} />
              </View>
              <Text style={[styles.moodLabel, { color: on ? colors.primary : colors.textSecondary, fontWeight: on ? '700' : '500' }]}>{t(m.label)}</Text>
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
                  style={[styles.tag, { backgroundColor: on ? colors.primarySoft : colors.surface, borderColor: on ? colors.primary : 'transparent' }]}
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
  card: { borderRadius: RADIUS.xl, borderWidth: 1, padding: SPACING.lg, marginTop: SPACING.xl },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overline: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  moods: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md },
  mood: { alignItems: 'center', gap: 4, width: 56 },
  face: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  moodLabel: { fontSize: 11 },
  tags: { gap: SPACING.sm, paddingVertical: SPACING.sm },
  tag: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  done: { alignSelf: 'flex-end', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8, marginTop: SPACING.sm },
  line: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 10, paddingHorizontal: SPACING.lg, marginTop: SPACING.xl },
})
