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
  const [adding, setAdding] = useState(false)
  const [itemInput, setItemInput] = useState('')
  const [priceInput, setPriceInput] = useState('')
  const [categoryInput, setCategoryInput] = useState('Product')

  useEffect(() => {
    loadExpenses()
  }, [userId])

  const loadExpenses = async () => {
    try {
      const data = await getExpenses(userId)
      setExpenses(data || [])

      const total = await getMonthlyBudgetTotal(userId)
      setMonthlyTotal(total || 0)
    } catch (error) {
      console.error('Load expenses error:', error)
      Alert.alert('Error', 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async () => {
    if (!itemInput.trim() || !priceInput.trim()) {
      Alert.alert('Error', 'Please fill all fields')
      return
    }

    const price = parseFloat(priceInput)
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price')
      return
    }

    setAdding(true)
    try {
      const newExpense = {
        user_id: userId,
        item_name: itemInput.trim(),
        amount: price,
        category: categoryInput,
      }

      const result = await addExpense(newExpense)
      if (result) {
        setExpenses([result, ...expenses])
        setMonthlyTotal(monthlyTotal + price)
        setItemInput('')
        setPriceInput('')
        setCategoryInput('Product')
        Alert.alert('Success', 'Expense added!')
      }
    } catch (error) {
      console.error('Add expense error:', error)
      Alert.alert('Error', 'Failed to add expense')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteExpense = async (expenseId, amount) => {
    Alert.alert('Delete Expense', 'Are you sure?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const success = await deleteExpense(expenseId)
            if (success) {
              setExpenses(expenses.filter(e => e.id !== expenseId))
              setMonthlyTotal(Math.max(0, monthlyTotal - amount))
              Alert.alert('Success', 'Expense deleted')
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
        <Text style={[styles.title, { color: colors.text }]}>Budget</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Track skincare spending</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* TOTAL CARD */}
        <View style={[styles.totalCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.totalLabel}>This Month</Text>
          <Text style={styles.totalAmount}>${monthlyTotal.toFixed(2)}</Text>
        </View>

        {/* ADD EXPENSE SECTION */}
        <View style={[styles.addSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Expense</Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.primary,
                color: colors.text,
              },
            ]}
            placeholder="Item Name"
            placeholderTextColor={colors.muted}
            value={itemInput}
            onChangeText={setItemInput}
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
            placeholder="Price ($)"
            placeholderTextColor={colors.muted}
            value={priceInput}
            onChangeText={setPriceInput}
            keyboardType="decimal-pad"
            editable={!adding}
          />

          <View style={[styles.categorySelector, { borderColor: colors.primary }]}>
            {['Product', 'Service', 'Other'].map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryOption,
                  categoryInput === cat && { backgroundColor: colors.primary },
                ]}
                onPress={() => setCategoryInput(cat)}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    categoryInput === cat ? { color: 'white' } : { color: colors.text },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary, opacity: adding ? 0.6 : 1 }]}
            onPress={handleAddExpense}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.addBtnText}>+ Add Expense</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* EXPENSES LIST */}
        <View style={styles.listSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Expenses</Text>

          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💰</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No expenses tracked yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.muted }]}>Start tracking your spending</Text>
            </View>
          ) : (
            expenses.map(expense => (
              <View key={expense.id} style={[styles.expenseCard, { backgroundColor: colors.card }]}>
                <View style={styles.expenseInfo}>
                  <View style={styles.expenseHeader}>
                    <Text style={[styles.expenseName, { color: colors.text }]}>{expense.item_name}</Text>
                    <Text style={[styles.expenseAmount, { color: colors.primary, fontWeight: 'bold' }]}>
                      ${expense.amount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.expenseFooter}>
                    <Text style={[styles.expenseCategory, { color: colors.muted }]}>
                      {expense.category}
                    </Text>
                    <Text style={[styles.expenseDate, { color: colors.muted }]}>
                      {new Date(expense.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteExpense(expense.id, expense.amount)}
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
  totalCard: { borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 24 },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  totalAmount: { color: 'white', fontSize: 36, fontWeight: 'bold' },
  addSection: { borderRadius: 12, padding: 16, marginBottom: 24 },
  listSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
  categorySelector: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, marginBottom: 12, overflow: 'hidden' },
  categoryOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRightWidth: 1 },
  categoryOptionText: { fontSize: 12, fontWeight: '600' },
  addBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  emptySubtext: { fontSize: 12 },
  expenseCard: { borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expenseInfo: { flex: 1 },
  expenseHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  expenseName: { fontWeight: 'bold', fontSize: 14 },
  expenseAmount: { fontSize: 14 },
  expenseFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  expenseCategory: { fontSize: 12 },
  expenseDate: { fontSize: 12 },
  deleteBtn: { paddingLeft: 16 },
  deleteBtnText: { fontSize: 20 },
})