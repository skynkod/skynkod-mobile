import React from 'react'
import { View, Text, Pressable, Image, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useColors } from './ui'
import { useT } from '../utils/LanguageContext'
import { ZONES, issuesFor, getIssue } from '../utils/skin-issues'
import { CONDITION_IMAGES } from '../utils/encyclopedia/condition-images'
import { DOCTOR_NOTE } from '../utils/skin-quiz'
import { SPACING } from '../utils/theme'
import { GTYPE, GFW, glassCard } from './glossy'
import FeatureIcon from './FeatureIcon'

// Her skin issues on photos, by zone: tap as many as look like her skin
// (Lita, 2026-10-25). Conditions a doctor confirms show only with the health consent.
export default function IssuePicker({ value = [], onChange, health }) {
  const colors = useColors()
  const t = useT()
  const toggle = id => onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id])
  const doctor = value.map(getIssue).filter(i => i && (i.doctor || i.suspected))

  return (
    <View>
      {ZONES.map(zone => (
        <View key={zone.id} style={{ marginTop: SPACING.xl }}>
          <Text style={[GTYPE.overline, { color: colors.primary, marginBottom: SPACING.sm }]}>{t(zone.label)}</Text>
          <View style={styles.grid}>
            {issuesFor({ zone: zone.id, health }).map(issue => {
              const on = value.includes(issue.id)
              const image = CONDITION_IMAGES[issue.id]
              return (
                <Pressable key={issue.id} onPress={() => toggle(issue.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={t(issue.label)}
                  style={({ pressed }) => [styles.tile, { borderColor: on ? colors.primary : colors.border, ...glassCard(colors), transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                  {image ? <Image source={image} style={styles.photo} resizeMode="cover" />
                    : <View style={[styles.photo, styles.noPhoto, { backgroundColor: colors.primarySoft }]}><FeatureIcon name={issue.icon || 'ellipse-outline'} size={28} color={colors.primary} /></View>}
                  <Text style={[styles.label, { color: on ? colors.primary : colors.text }]} numberOfLines={2}>{t(issue.label)}</Text>
                  {on ? <View style={[styles.check, { backgroundColor: colors.primary }]}><Ionicons name="checkmark" size={14} color={colors.onPrimary} /></View> : null}
                </Pressable>
              )
            })}
          </View>
        </View>
      ))}
      {/* Safety stays: what only a doctor can confirm or treat */}
      {doctor.length ? (
        <View style={[styles.note, { backgroundColor: colors.primarySoft }]}>
          <FeatureIcon name="medkit-outline" size={16} color={colors.primary} />
          <Text style={[GTYPE.caption, { color: colors.text, flex: 1, lineHeight: 18 }]}>
            {doctor.map(i => t(i.label)).join(', ')}: {t(DOCTOR_NOTE)}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  tile: { width: '31.5%', borderWidth: 1.5, borderRadius: 16, overflow: 'hidden', paddingBottom: SPACING.sm },
  photo: { width: '100%', aspectRatio: 1 },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, ...GFW('600'), lineHeight: 15, paddingHorizontal: 6, marginTop: 6, minHeight: 30 },
  check: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  note: { flexDirection: 'row', gap: SPACING.sm, borderRadius: 14, padding: SPACING.md, marginTop: SPACING.lg },
})
