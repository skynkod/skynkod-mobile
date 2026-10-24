import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useColors } from './ui'
import { useT } from '../utils/LanguageContext'
import { SKIN_STATES } from '../utils/skin-state'
import { SPACING, TYPE } from '../utils/theme'

// "Your skin today": the current skin state, under the mood (Lita, 2026-10-24).
// Several can be true at once; "Balanced" clears the others.
export default function SkinStateChips({ value = [], onChange, style }) {
  const colors = useColors()
  const t = useT()
  const toggle = id => {
    if (id === 'balanced') return onChange(value.includes('balanced') ? [] : ['balanced'])
    const rest = value.filter(v => v !== 'balanced')
    onChange(rest.includes(id) ? rest.filter(v => v !== id) : [...rest, id])
  }
  return (
    <View style={style}>
      <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Your skin feels…')}</Text>
      <View style={styles.row}>
        {SKIN_STATES.map(s => {
          const on = value.includes(s.id)
          return (
            <Pressable key={s.id} onPress={() => toggle(s.id)} accessibilityLabel={t(s.label)}
              style={[styles.chip, { backgroundColor: on ? colors.primary : colors.primarySoft }]}>
              <Text style={{ fontSize: 13 }}>{s.emoji}</Text>
              <Text style={[TYPE.caption, { color: on ? colors.onPrimary : colors.primary, fontWeight: '700' }]}>{t(s.label)}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
})
