import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { addExpense, deleteExpense, getExpenses, getMonthlyBudgetTotal } from '../utils/supabase'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function BudgetScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [expenses, setExpenses] = useState([])
  const [monthlyTotal, setMonthlyTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newExpense, setNewExpense] = useState({
    product_name: '',
    brand: '',
    category: 'Skincare',
    price: '',
  })

  const categories = ['Skincare', 'Supplements', 'Professional', 'Other']

  useEffect(() => {
    loadBudgetData()
  }, [userId])

  const loadBudgetData = async () => {
    try {
      const userExpenses = await getExpenses(userId)
      const total = await getMonthlyBudgetTotal(userId)
      setExpenses(userExpenses)
      setMonthlyTotal(total)
    } catch (error) {
      console.error('Error loading budget:', error)
      Alert.alert('Error', 'Failed to load budget data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async () => {
    if (!newExpense.product_name || !newExpense.price) {
      Alert.alert('Error', 'Please fill in product name and price')
      return
    }

    setSubmitting(true)
    try {
      const added = await addExpense(userId, {
        product_name: newExpense.product_name,
        brand: newExpense.brand,
        category: newExpense.category,
        price: newExpense.price,
      })

      if (added) {
        setExpenses([added, ...expenses])
        setMonthlyTotal(monthlyTotal + parseFloat(newExpense.price))
        setNewExpense({
          product_name: '',
          brand: '',
          category: 'Skincare',
          price: '',
        })
        setShowAddForm(false)
        Alert.alert('Success', 'Expense added!')
      } else {
        Alert.alert('Error', 'Failed to add expense')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteExpense = async (expenseId, price) => {
    Alert.alert('Delete Expense', 'Are you sure?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const success = await deleteExpense(expenseId)
            if (success) {
              setExpenses(expenses.filter(e => e.id !== expenseId))
              setMonthlyTotal(monthlyTotal - parseFloat(price))
              Alert.alert('Success', 'Expense deleted')
            } else {
              Alert.alert('Error', 'Failed to delete expense')
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete expense')
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
        <Text style={[styles.title, { color: colors.text }]}>{t('common_budget') || 'Budget'}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Track your skincare spending</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* MONTHLY TOTAL */}
        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.summaryLabel}>This Month Total</Text>
          <Text style={styles.summaryAmount}>${monthlyTotal.toFixed(2)}</Text>
          <Text style={styles.summaryDesc}>{expenses.length} expenses</Text>
        </View>

        {/* EXPENSES LIST */}
        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💰</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>No expenses yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>Start tracking your skincare budget</Text>
          </View>
        ) : (
          <View style={styles.expensesList}>
            {expenses.map(expense => (
              <View key={expense.id} style={[styles.expenseCard, { backgroundColor: colors.card }]}>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseInfo}>
                    <Text style={[styles.expenseName, { color: colors.text }]}>{expense.product_name}</Text>
                    <Text style={[styles.expenseBrand, { color: colors.muted }]}>
                      {expense.brand} • {expense.category}
                    </Text>
                  </View>
                  <Text style={[styles.expensePrice, { color: colors.primary }]}>${parseFloat(expense.price).toFixed(2)}</Text>
                </View>

                <View style={styles.expenseFooter}>
                  <Text style={[styles.expenseDate, { color: colors.muted }]}>
                    {new Date(expense.purchase_date).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteExpense(expense.id, expense.price)}
                  >
                    <Text style={styles.deleteLink}>Delete</Text>
                  </TouchableOpacity>
                </View>
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
          <Text style={styles.addBtnText}>+ Add Expense</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.formContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
            placeholder="Product name"
            placeholderTextColor={colors.muted}
            value={newExpense.product_name}
            onChangeText={(text) => setNewExpense({ ...newExpense, product_name: text })}
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
            placeholder="Brand"
            placeholderTextColor={colors.muted}
            value={newExpense.brand}
            onChangeText={(text) => setNewExpense({ ...newExpense, brand: text })}
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
            placeholder="Price ($)"
            placeholderTextColor={colors.muted}
            value={newExpense.price}
            onChangeText={(text) => setNewExpense({ ...newExpense, price: text })}
            keyboardType="decimal-pad"
          />

          <ScrollView horizontal style={styles.categoryScroll}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryBtn,
                  newExpense.category === cat && { backgroundColor: colors.primary }
                ]}
                onPress={() => setNewExpense({ ...newExpense, category: cat })}
              >
                <Text
                  style={[
                    styles.categoryBtnText,
                    newExpense.category === cat ? { color: 'white' } : { color: colors.text }
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
              onPress={handleAddExpense}
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
  summaryCard: { borderRadius: 12, padding: 20, marginBottom: 24 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  summaryAmount: { fontSize: 40, fontWeight: 'bold', color: 'white', marginVertical: 8 },
  summaryDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold' },
  emptySubtext: { fontSize: 14, marginTop: 4 },
  expensesList: { gap: 12 },
  expenseCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  expenseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  expenseInfo: { flex: 1 },
  expenseName: { fontSize: 16, fontWeight: 'bold' },
  expenseBrand: { fontSize: 12, marginTop: 4 },
  expensePrice: { fontSize: 18, fontWeight: 'bold' },
  expenseFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expenseDate: { fontSize: 12 },
  deleteLink: { color: '#FF6B6B', fontWeight: 'bold', fontSize: 12 },
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