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
  const [adding, setAdding] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [brandInput, setBrandInput] = useState('')
  const [categoryInput, setCategoryInput] = useState('')

  useEffect(() => {
    loadProducts()
  }, [userId])

  const loadProducts = async () => {
    try {
      const data = await getUserProducts(userId)
      setProducts(data || [])
    } catch (error) {
      console.error('Load products error:', error)
      Alert.alert('Error', 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async () => {
    if (!nameInput.trim() || !brandInput.trim() || !categoryInput.trim()) {
      Alert.alert('Error', 'Please fill all fields')
      return
    }

    setAdding(true)
    try {
      const newProduct = {
        user_id: userId,
        product_name: nameInput.trim(),
        brand: brandInput.trim(),
        category: categoryInput.trim(),
      }

      const result = await addUserProduct(newProduct)
      if (result) {
        setProducts([result, ...products])
        setNameInput('')
        setBrandInput('')
        setCategoryInput('')
        Alert.alert('Success', 'Product added!')
      }
    } catch (error) {
      console.error('Add product error:', error)
      Alert.alert('Error', 'Failed to add product')
    } finally {
      setAdding(false)
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
        <Text style={[styles.title, { color: colors.text }]}>My Products</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Track your skincare products</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* ADD PRODUCT SECTION */}
        <View style={[styles.addSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Add New Product</Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.primary,
                color: colors.text,
              },
            ]}
            placeholder="Product Name"
            placeholderTextColor={colors.muted}
            value={nameInput}
            onChangeText={setNameInput}
            editable={!adding}
          />

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.primary,
                color: colors.text,
              },
            ]}
            placeholder="Brand"
            placeholderTextColor={colors.muted}
            value={brandInput}
            onChangeText={setBrandInput}
            editable={!adding}
          />

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.primary,
                color: colors.text,
              },
            ]}
            placeholder="Category (Cleanser, Moisturizer, etc.)"
            placeholderTextColor={colors.muted}
            value={categoryInput}
            onChangeText={setCategoryInput}
            editable={!adding}
          />

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary, opacity: adding ? 0.6 : 1 }]}
            onPress={handleAddProduct}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.addBtnText}>+ Add Product</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* PRODUCTS LIST */}
        <View style={styles.listSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Products</Text>

          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🧴</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No products added yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.muted }]}>Add your skincare products to track them</Text>
            </View>
          ) : (
            products.map(product => (
              <View key={product.id} style={[styles.productCard, { backgroundColor: colors.card }]}>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]}>{product.product_name}</Text>
                  <Text style={[styles.productBrand, { color: colors.muted }]}>{product.brand}</Text>
                  <Text style={[styles.productCategory, { color: colors.primary, marginTop: 4 }]}>
                    {product.category}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteProduct(product.id)}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  addSection: { borderRadius: 12, padding: 16, marginBottom: 24 },
  listSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
  addBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  emptySubtext: { fontSize: 12 },
  productCard: { borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productInfo: { flex: 1 },
  productName: { fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  productBrand: { fontSize: 12, marginBottom: 2 },
  productCategory: { fontSize: 12, fontWeight: '600' },
  deleteBtn: { paddingLeft: 16 },
  deleteBtnText: { fontSize: 20 },
})