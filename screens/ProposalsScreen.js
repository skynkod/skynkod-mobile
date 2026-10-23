import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet, Image, Alert, ScrollView, ActivityIndicator, Linking, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Screen, Card, Button, EmptyState, useColors } from '../components/ui'
import { useT } from '../utils/LanguageContext'
import { getProposalsToReview, acceptProposal, rejectProposal, isAdmin } from '../utils/contributions'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// Admin only: products users proposed after an unknown scan. Claude prepares
// each one (finds the product and its official ingredient list); here Lita
// accepts it into the catalogue or refuses it.
export default function ProposalsScreen() {
  const colors = useColors()
  const t = useT()
  const [allowed, setAllowed] = useState(null)
  const [items, setItems] = useState(null)
  const [busy, setBusy] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const ok = await isAdmin()
      setAllowed(ok)
      if (ok) setItems(await getProposalsToReview())
    } catch (error) {
      await logError('Proposals_load', error, {}, 'warn')
      setItems([])
    }
  }, [])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const decide = async (item, accept) => {
    setBusy(item.id)
    try {
      if (accept) await acceptProposal(item.id)
      else await rejectProposal(item.id)
      setItems(list => list.filter(x => x.id !== item.id))
    } catch (error) {
      await logError('Proposals_decide', error, { accept }, 'warn')
      Alert.alert(t('Couldn’t save'), error.message || t('Check your connection and try again.'))
    } finally {
      setBusy(null)
    }
  }

  const confirmReject = item => Alert.alert(t('Refuse this product?'), t('It won’t be added to Skynkod.'), [
    { text: t('Cancel'), style: 'cancel' },
    { text: t('Refuse'), style: 'destructive', onPress: () => decide(item, false) },
  ])

  if (allowed === false) return <Screen back title="Proposals"><EmptyState icon="lock-closed-outline" title={t('For the Skynkod team')} description={t('This page is only for the people who check new products.')} /></Screen>

  return (
    <Screen back title="Proposals" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} />}>
      {items === null ? <ActivityIndicator color={colors.primary} style={{ marginTop: SPACING.xxl }} /> : null}
      {items?.length === 0 ? <EmptyState icon="checkmark-done-outline" title={t('Nothing to check')} description={t('New proposals from the scanner will show here.')} /> : null}
      {(items || []).map(item => {
        const d = item.draft || {}
        const ready = item.status === 'ready'
        return (
          <Card key={item.id} style={{ marginBottom: SPACING.lg }}>
            <View style={styles.rowBetween}>
              <Text style={[TYPE.caption, { color: colors.muted }]}>{item.barcode}</Text>
              <Text style={[TYPE.caption, { color: colors.muted }]}>{t(item.people > 1 ? '{n} people' : '{n} person', { n: item.people })}</Text>
            </View>
            {item.photoUrls?.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm, marginTop: SPACING.sm }}>
                {item.photoUrls.map(url => <Image key={url} source={{ uri: url }} style={[styles.photo, { backgroundColor: colors.border }]} />)}
              </ScrollView>
            ) : null}
            {ready ? (
              <>
                <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.md }]}>
                  {d.product_id ? t('Barcode for a product already in Skynkod') : [d.brand, d.name].filter(Boolean).join(' · ')}
                </Text>
                {d.product_id ? <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>{d.label || `#${d.product_id}`}</Text> : null}
                {d.category ? <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>{t(d.category)}</Text> : null}
                {d.inci ? <Text numberOfLines={4} style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.sm, lineHeight: 17 }]}>{d.inci}</Text> : null}
                {d.source_url ? <Text onPress={() => Linking.openURL(d.source_url)} style={[TYPE.caption, { color: colors.primary, marginTop: SPACING.xs }]}>{t('Source')}</Text> : null}
                <View style={[styles.rowBetween, { marginTop: SPACING.lg, gap: SPACING.sm }]}>
                  <Button title={t('Refuse')} variant="secondary" onPress={() => confirmReject(item)} disabled={busy === item.id} style={{ flex: 1 }} />
                  <Button title={t('Accept')} icon="checkmark" loading={busy === item.id} onPress={() => decide(item, true)} style={{ flex: 1 }} />
                </View>
              </>
            ) : (
              <>
                <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.md }]}>
                  {[item.suggestion?.brand, item.suggestion?.name].filter(Boolean).join(' · ') || t('Unknown product')}
                </Text>
                <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>{t('Waiting: ask Claude to prepare it.')}</Text>
                <Button title={t('Refuse')} variant="secondary" onPress={() => confirmReject(item)} disabled={busy === item.id} style={{ marginTop: SPACING.md }} />
              </>
            )}
          </Card>
        )
      })}
    </Screen>
  )
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photo: { width: 110, height: 140, borderRadius: RADIUS.md },
})
