import React, { useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { captureRef } from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'
import { useColors } from './ui'
import { useT } from '../utils/LanguageContext'
import { trendNote } from '../utils/trends'
import { track } from '../utils/analytics'
import { logError } from '../utils/errorLogger'
import { SPACING, TYPE } from '../utils/theme'

// "Seen on TikTok?" (Lita, 2026-10-25): the answer to a trend typed in the
// search bar, and a Share button that sends it as an image.

const VERDICT = {
  false: { label: 'False', icon: 'close-circle', tone: 'danger' },
  depends: { label: 'It depends', icon: 'alert-circle', tone: 'warning' },
  true: { label: 'True', icon: 'checkmark-circle', tone: 'success' },
}

export default function TrendCard({ trend, profile, style }) {
  const colors = useColors()
  const t = useT()
  const shot = useRef(null)
  const [sharing, setSharing] = useState(false)
  if (!trend) return null
  const v = VERDICT[trend.verdict]
  const tone = colors[v.tone] || colors.primary
  const note = trendNote(trend, profile)

  const share = async () => {
    if (sharing) return
    setSharing(true)
    try {
      const uri = await captureRef(shot, { format: 'png', quality: 1 })
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('Share') })
      track('trend_shared', { id: trend.id })
    } catch (error) {
      logError('Trend_share', error, { id: trend.id }, 'warn')
    } finally {
      setSharing(false)
    }
  }

  return (
    <View style={style}>
      {/* What the image shows: the trend, the verdict, why, and what to do instead */}
      <View ref={shot} collapsable={false} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.kicker, { color: colors.primary }]}>{t('SEEN ONLINE?')}</Text>
        <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.xs, fontSize: 17, lineHeight: 23 }]}>“{t(trend.title)}”</Text>
        <View style={[styles.verdict, { backgroundColor: colors[`${v.tone}Soft`] || colors.primarySoft }]}>
          <Ionicons name={v.icon} size={18} color={tone} />
          <Text style={[TYPE.bodyStrong, { color: tone }]}>{t(v.label)}</Text>
        </View>
        <Text style={[TYPE.body, { color: colors.text, marginTop: SPACING.md, lineHeight: 21 }]}>{t(trend.why)}</Text>
        <Text style={[TYPE.body, { color: colors.text, marginTop: SPACING.sm, lineHeight: 21 }]}>
          <Text style={{ fontWeight: '700' }}>{t('Instead: ')}</Text>{t(trend.instead)}
        </Text>
        {note ? (
          <View style={[styles.note, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="person-circle-outline" size={16} color={colors.primary} />
            <Text style={[TYPE.caption, { color: colors.text, flex: 1, lineHeight: 18 }]}>{t(note)}</Text>
          </View>
        ) : null}
        <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.md }]}>{t('Checked with Skynkod · skynkod.com')}</Text>
      </View>
      <Pressable onPress={share} disabled={sharing} hitSlop={6} style={styles.shareBtn}>
        <Ionicons name="share-outline" size={16} color={colors.primary} />
        <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Share')}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: SPACING.lg },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  verdict: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: SPACING.md },
  note: { flexDirection: 'row', gap: SPACING.sm, borderRadius: 12, padding: SPACING.md, marginTop: SPACING.md },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginTop: SPACING.sm },
})
