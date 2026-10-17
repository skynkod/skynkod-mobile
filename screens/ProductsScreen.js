import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Alert, Keyboard, Modal, ScrollView } from 'react-native'
import { getUserProducts, addUserProduct, deleteUserProduct } from '../utils/supabase'
import { useFetchWithCache } from '../utils/useFetchWithCache'
import { logError } from '../utils/errorLogger'
import { PRODUCT_CATEGORIES } from '../utils/constants'
import { Screen, Card, Button, Input, Chip, BottomSheet, EmptyState, Banner, LoadingView, IconButton, IconCircle, SectionHeader, useColors } from '../components/ui'
import { SPACING, TYPE } from '../utils/theme'

const CATEGORY_ICONS = {
  Cleanser: 'water-outline',
  Toner: 'color-fill-outline',
  Essence: 'flask-outline',
  Serum: 'eyedrop-outline',
  Moisturizer: 'cloud-outline',
  'Eye Cream': 'eye-outline',
  Sunscreen: 'sunny-outline',
  Mask: 'happy-outline',
  Exfoliator: 'sparkles-outline',
  Treatment: 'medical-outline',
}

export default function ProductsScreen({ route }) {
  const { userId } = route.params
  const colors = useColors()
  const { data: products, loading, error, isOffline, fetch, retry } = useFetchWithCache('user_products', () => getUserProducts(userId), userId)

  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('Serum')
  const [addError, setAddError] = useState(null)

  useEffect(() => {
    fetch()
  }, [fetch])

  const handleAdd = async () => {
    if (!name.trim() || !brand.trim()) {
      setAddError('Please add a name and a brand')
      return
    }
    setAdding(true)
    setAddError(null)
    Keyboard.dismiss()
    try {
      const result = await addUserProduct({ user_id: userId, product_name: name.trim(), brand: brand.trim(), category })
      if (!result) throw new Error('Failed to add product')
      setName('')
      setBrand('')
      setShowAdd(false)
      await fetch()
    } catch (err) {
      await logError('ProductsScreen_add', err, { userId })
      setAddError(err.message || 'Failed to add product')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = (product) => {
    Alert.alert('Remove product?', `${product.product_name} will be removed from your shelf.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteUserProduct(product.id)
          if (ok) fetch()
          else Alert.alert('Error', 'Failed to delete product')
        },
      },
    ])
  }

  if (loading && !products) return <LoadingView />

  const list = Array.isArray(products) ? products.filter(p => p?.id) : []

  return (
    <Screen back title="My shelf" subtitle="Products you use" right={<IconButton icon="add" tone="primary" onPress={() => setShowAdd(true)} accessibilityLabel="Add product" />}>
      {error ? <Banner message={error} actionLabel="Retry" onAction={retry} /> : null}
      {isOffline && !error ? <Banner tone="info" message="Offline — showing saved data" /> : null}

      {list.length === 0 ? (
        <EmptyState icon="flask-outline" title="Your shelf is empty" description="Add the products you use to get better advice from Koda." action="Add a product" onAction={() => setShowAdd(true)} />
      ) : (
        <>
          <SectionHeader title={`${list.length} product${list.length > 1 ? 's' : ''}`} />
          <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
            {list.map((product, idx) => (
              <View key={product.id} style={[styles.row, idx < list.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <IconCircle name={CATEGORY_ICONS[product.category] || 'cube-outline'} />
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{product.product_name || 'Unknown'}</Text>
                  <Text style={[TYPE.caption, { color: colors.muted, marginTop: 2 }]}>
                    {[product.brand, product.category].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <IconButton icon="trash-outline" size={34} onPress={() => handleDelete(product)} accessibilityLabel="Remove product" />
              </View>
            ))}
          </Card>
        </>
      )}

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <BottomSheet title="Add a product" onClose={() => setShowAdd(false)}>
          {addError ? <Banner message={addError} /> : null}
          <Input label="Name" placeholder="e.g. Niacinamide 10%" value={name} onChangeText={setName} editable={!adding} />
          <Input label="Brand" placeholder="e.g. The Ordinary" value={brand} onChangeText={setBrand} editable={!adding} />
          <Text style={[TYPE.caption, { color: colors.textSecondary, fontWeight: '600', marginBottom: SPACING.sm }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm, paddingBottom: SPACING.lg }}>
            {PRODUCT_CATEGORIES.map(cat => (
              <Chip key={cat} label={cat} selected={category === cat} onPress={() => setCategory(cat)} />
            ))}
          </ScrollView>
          <Button title="Add to shelf" onPress={handleAdd} loading={adding} style={{ marginBottom: SPACING.xl }} />
        </BottomSheet>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },
})
