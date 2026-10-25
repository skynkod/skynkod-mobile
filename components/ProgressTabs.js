import React from 'react'
import { View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SegmentedControl } from './ui'
import { usePremium } from './PremiumLock'
import { useT } from '../utils/LanguageContext'
import { SPACING } from '../utils/theme'

// My progress, with its three tabs (Lita's audit, 2026-10-24): one place to
// follow her skin instead of three pages in the profile.
const TABS = [
  { value: 'Progress', label: 'Progress' },
  { value: 'SkinTimeline', label: 'Skyn Timeline' },
  { value: 'SkinReport', label: 'Report', premium: true },
]

export default function ProgressTabs({ current }) {
  const t = useT()
  const navigation = useNavigation()
  // Premium tabs say so before the tap (full audit, 2026-10-25).
  const premium = usePremium()
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <SegmentedControl value={current} onChange={v => v !== current && navigation.navigate(v)}
        options={TABS.map(x => ({ value: x.value, label: `${t(x.label)}${x.premium && premium === false ? ' ◆' : ''}` }))} />
    </View>
  )
}
