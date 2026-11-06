import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useColors } from './ui'
import { useT } from '../utils/LanguageContext'
import { SPACING } from '../utils/theme'
import IssuePicker from './IssuePicker'
import { GTYPE, GFW } from './glossy'

// One skin-quiz question (utils/skin-quiz.js), the same at sign-up and in
// "My skin profile". Single choice calls onPicked after the tap; multi choice
// toggles, where "None" clears the rest.
export default function QuizQuestion({ question: q, value, onChange, onPicked, compact, health }) {
  const colors = useColors()
  const t = useT()
  if (q.type === 'issues') {
    return (
      <View>
        <Text style={[compact ? styles.titleCompact : styles.title, { color: colors.text }]}>{t(q.title)}</Text>
        {q.subtitle ? <Text style={[GTYPE.body, { color: colors.muted, marginTop: SPACING.sm }]}>{t(q.subtitle)}</Text> : null}
        <IssuePicker value={Array.isArray(value) ? value : []} onChange={onChange} health={health} />
      </View>
    )
  }
  const selected = Array.isArray(value) ? value : value ? [value] : []

  const tap = (v) => {
    if (q.type === 'single') {
      onChange(v)
      onPicked?.(v)
      return
    }
    let next
    if (v === 'None') next = selected.includes('None') ? [] : ['None']
    else {
      const without = selected.filter(x => x !== 'None')
      next = without.includes(v) ? without.filter(x => x !== v) : q.max && without.length >= q.max ? without : [...without, v]
    }
    onChange(next)
  }

  const long = q.options.some(x => x.label.length > 28)
  return (
    <View>
      <Text style={[compact ? styles.titleCompact : styles.title, { color: colors.text }]}>{t(q.title)}</Text>
      {q.subtitle ? <Text style={[GTYPE.body, { color: colors.muted, marginTop: SPACING.sm }]}>{t(q.subtitle)}</Text> : null}
      <View style={q.type === 'multi' && !long ? styles.tags : styles.choices}>
        {q.options.map(x => {
          const on = selected.includes(x.value)
          return (
            <Pressable
              key={String(x.value)}
              onPress={() => tap(x.value)}
              accessibilityRole={q.type === 'multi' ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: on }}
              style={({ pressed }) => [
                q.type === 'multi' && !long ? styles.tag : styles.choice,
                { backgroundColor: on ? colors.primarySoft : colors.card, borderColor: on ? colors.primary : colors.border, transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <Text style={[q.type === 'multi' && !long ? styles.tagText : styles.choiceLabel, { color: on ? colors.primary : colors.text }]}>{t(x.label)}</Text>
              {x.hint ? <Text style={[GTYPE.caption, { color: colors.muted }]}>{t(x.hint)}</Text> : null}
            </Pressable>
          )
        })}
      </View>
      {q.max ? <Text style={[GTYPE.caption, { color: colors.muted, marginTop: SPACING.sm }]}>{selected.length}/{q.max}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 30, ...GFW('700'), letterSpacing: -0.7, lineHeight: 36 },
  titleCompact: { fontSize: 22, ...GFW('700'), letterSpacing: -0.4, lineHeight: 28 },
  choices: { marginTop: SPACING.xl, gap: SPACING.sm },
  choice: { borderRadius: 22, borderWidth: 1, paddingVertical: 15, paddingHorizontal: SPACING.xl, gap: 2 },
  choiceLabel: { fontSize: 16, ...GFW('600') },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xl },
  tag: { borderRadius: 999, borderWidth: 1, paddingVertical: 12, paddingHorizontal: SPACING.lg },
  tagText: { fontSize: 15, ...GFW('600') },
})
