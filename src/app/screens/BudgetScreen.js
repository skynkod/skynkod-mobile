import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'

export default function BudgetScreen() {
  const [expenses, setExpenses] = useState([
    { id: 1, name: 'Cleanser', cost: 12.99, date: '2026-08-20' },
    { id: 2, name: 'Serum', cost: 35.00, date: '2026-08-18' }
  ])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [cost, setCost] = useState('')

  const totalSpent = expenses.reduce((sum, e) => sum + e.cost, 0)
  const monthlyBudget = 100

  const handleAddExpense = () => {
    if (!name.trim() || !cost.trim()) {
      Alert.alert('Error', 'Please fill all fields')
      return
    }
    const newExpense = { id: Date.now(), name, cost: parseFloat(cost), date: new Date().toISOString().split('T')[0] }
    setExpenses([...expenses, newExpense])
    setName('')
    setCost('')
    setShowForm(false)
  }

  const handleDelete = (id) => {
    setExpenses(expenses.filter(e => e.id !== id))
  }

  const remaining = monthlyBudget - totalSpent
  const percentage = (totalSpent / monthlyBudget) * 100

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Budget Tracker</Text>

      <View style={styles.budgetCard}>
        <Text style={styles.budgetLabel}>Monthly Budget</Text>
        <Text style={styles.budgetAmount}>€{monthlyBudget.toFixed(2)}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: percentage > 80 ? '#D84040' : SKYNKOD_COLORS.primary }]} />
        </View>
        <View style={styles.budgetInfo}>
          <Text style={styles.budgetText}>Spent: €{totalSpent.toFixed(2)}</Text>
          <Text style={[styles.budgetText, { color: remaining < 0 ? '#D84040' : SKYNKOD_COLORS.primary }]}>Remaining: €{Math.max(remaining, 0).toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
        <Text style={styles.addBtnText}>{showForm ? 'Cancel' : 'Add Expense'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Product name" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Cost" value={cost} onChangeText={setCost} keyboardType="decimal-pad" />
          <TouchableOpacity style={styles.saveBtn} onPress={handleAddExpense}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      {expenses.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          {expenses.map(e => (
            <View key={e.id} style={styles.expenseRow}>
              <View>
                <Text style={styles.expenseName}>{e.name}</Text>
                <Text style={styles.expenseDate}>{e.date}</Text>
              </View>
              <View style={styles.expenseRight}>
                <Text style={styles.expenseCost}>€{e.cost.toFixed(2)}</Text>
                <TouchableOpacity onPress={() => handleDelete(e.id)}>
                  <Text style={styles.deleteBtn}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SKYNKOD_COLORS.bg, padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: SKYNKOD_COLORS.text },
  budgetCard: { backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20 },
  budgetLabel: { fontSize: 12, color: SKYNKOD_COLORS.muted, marginBottom: 8 },
  budgetAmount: { fontSize: 40, fontWeight: 'bold', color: SKYNKOD_COLORS.primary, marginBottom: 16 },
  progressBar: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%' },
  budgetInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetText: { fontSize: 12, color: SKYNKOD_COLORS.muted },
  addBtn: { backgroundColor: SKYNKOD_COLORS.primary, padding: 12, borderRadius: 8, marginBottom: 16 },
  addBtnText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  form: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: SKYNKOD_COLORS.border, borderRadius: 8, padding: 12, marginBottom: 12 },
  saveBtn: { backgroundColor: SKYNKOD_COLORS.primary, padding: 12, borderRadius: 8 },
  saveBtnText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: SKYNKOD_COLORS.text },
  expenseRow: { backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  expenseName: { fontWeight: 'bold', color: SKYNKOD_COLORS.text },
  expenseDate: { fontSize: 12, color: SKYNKOD_COLORS.muted, marginTop: 4 },
  expenseRight: { alignItems: 'flex-end' },
  expenseCost: { fontWeight: 'bold', color: SKYNKOD_COLORS.primary, marginBottom: 4 },
  deleteBtn: { fontSize: 12, color: '#D84040' },
})