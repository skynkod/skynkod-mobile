import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { addUserProduct, deleteUserProduct, getUserProducts } from '../utils/supabase'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function ProductsScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', brand: '', category: 'Cleanser' })
  const [submitting, setSubmitting] = useState(false)

  const categories = ['Cleanser', 'Toner', 'Serum', 'Moisturizer', 'Sunscreen', 'Mask', 'Other']

  useEffect(() => {
    loadProducts()
  }, [userId])

  const loadProducts = async () => {
    try {
      const userProducts = await getUserProducts(userId)
      setProducts(userProducts)
    } catch (error) {
      console.error('Error loading products:', error)
      Alert.alert('Error', 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.brand) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      const added = await addUserProduct(userId, {
        name: newProduct.name,
        brand: newProduct.brand,
        category: newProduct.category,
      })

      if (added) {
        setProducts([added, ...products])
        setNewProduct({ name: '', brand: '', category: 'Cleanser' })
        setShowAddForm(false)
        Alert.alert('Success', 'Product added!')
      } else {
        Alert.alert('Error', 'Failed to add product')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProduct = async (productId) => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const success = await deleteUserProduct(productId)
            if (success) {
              setProducts(products.filter(p => p.id !== productId))
              Alert.alert('Success', 'Product deleted')
            } else {
              Alert.alert('Error', 'Failed to delete product')
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete product')
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('products_title')}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Track your skincare products</Text>
      </View>

      <ScrollView style={styles.content}>
        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧴</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>No products yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>Add products to track your routine</Text>
          </View>
        ) : (
          <View style={styles.productsList}>
            {products.map(product => (
              <View key={product.id} style={[styles.productCard, { backgroundColor: colors.card }]}>
                <View style={styles.productHeader}>
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: colors.text }]}>{product.product_name}</Text>
                    <Text style={[styles.productBrand, { color: colors.muted }]}>{product.brand}</Text>
                  </View>
                  <Text style={[styles.productCategory, { color: colors.primary }]}>{product.category}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteProduct(product.id)}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {!showAddForm ? (
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={styles.addBtnText}>+ Add Product</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.formContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
            placeholder="Product name"
            placeholderTextColor={colors.muted}
            value={newProduct.name}
            onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
            placeholder="Brand"
            placeholderTextColor={colors.muted}
            value={newProduct.brand}
            onChangeText={(text) => setNewProduct({ ...newProduct, brand: text })}
          />

          <ScrollView horizontal style={styles.categoryScroll}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryBtn,
                  newProduct.category === cat && { backgroundColor: colors.primary }
                ]}
                onPress={() => setNewProduct({ ...newProduct, category: cat })}
              >
                <Text
                  style={[
                    styles.categoryBtnText,
                    newProduct.category === cat ? { color: 'white' } : { color: colors.text }
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.formBtn, { backgroundColor: colors.border }]}
              onPress={() => setShowAddForm(false)}
              disabled={submitting}
            >
              <Text style={[styles.formBtnText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.formBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddProduct}
              disabled={submitting}
            >
              <Text style={styles.formBtnText}>{submitting ? 'Adding...' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 12, marginTop: 4 },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold' },
  emptySubtext: { fontSize: 14, marginTop: 4 },
  productsList: { gap: 12 },
  productCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: 'bold' },
  productBrand: { fontSize: 12, marginTop: 4 },
  productCategory: { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  deleteBtn: { backgroundColor: '#FF6B6B', padding: 8, borderRadius: 6 },
  deleteBtnText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 12 },
  addBtn: { margin: 16, padding: 16, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  formContainer: { padding: 16, borderTopWidth: 1, gap: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14 },
  categoryScroll: { flexGrow: 0, marginVertical: 8 },
  categoryBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginRight: 8, borderWidth: 1, borderColor: '#ccc' },
  categoryBtnText: { fontSize: 12, fontWeight: '600' },
  formButtons: { flexDirection: 'row', gap: 12 },
  formBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  formBtnText: { color: 'white', fontWeight: 'bold' },
})