import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMonthlySpending, getBudgetStatus, getCategoryBreakdown, getMonthlyTrend } from '../utils/budget-tracker';

const COLORS = {
  background: '#F7F1F5',
  primary: '#B283AC',
  secondary: '#7A3E76',
  text: '#14121A',
  muted: '#9B97A0',
  border: '#E8E1ED',
  card: '#FFFFFF',
};

const CATEGORIES = ['Cleanser', 'Moisturizer', 'Serum', 'Sunscreen', 'Treatment', 'Mask', 'Other'];

export default function BudgetScreen() {
  const [budget, setBudget] = useState(100);
  const [expenses, setExpenses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: '', price: '', category: 'Other', brand: '' });

  const monthlySpending = parseFloat(getMonthlySpending(expenses));
  const budgetStatus = getBudgetStatus(monthlySpending, budget);
  const categoryBreakdown = getCategoryBreakdown(expenses);
  const monthlyTrend = getMonthlyTrend(expenses, 6);

  const handleAddExpense = () => {
    if (!newExpense.name || !newExpense.price) return;

    const expense = {
      id: Date.now(),
      ...newExpense,
      price: parseFloat(newExpense.price),
      date: new Date().toISOString(),
    };

    setExpenses([...expenses, expense]);
    setNewExpense({ name: '', price: '', category: 'Other', brand: '' });
    setShowAddModal(false);
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>💰 Budget Tracker</Text>
          <Text style={styles.subtitle}>PREMIUM Feature</Text>
        </View>

        <View style={styles.budgetCard}>
          <View style={styles.budgetTop}>
            <View>
              <Text style={styles.budgetLabel}>Monthly Budget</Text>
              <Text style={styles.budgetAmount}>${budget}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.statusBar, { backgroundColor: budgetStatus.color }]}>
            <View style={styles.statusText}>
              <Text style={styles.statusLabel}>{budgetStatus.status}</Text>
              <Text style={styles.statusMessage}>{budgetStatus.message}</Text>
            </View>
            <Text style={styles.statusPercentage}>{budgetStatus.percentage}%</Text>
          </View>

          <View style={styles.spendingInfo}>
            <View>
              <Text style={styles.infoLabel}>Spent This Month</Text>
              <Text style={styles.infoAmount}>${monthlySpending.toFixed(2)}</Text>
            </View>
            <View>
              <Text style={styles.infoLabel}>Remaining</Text>
              <Text style={styles.infoAmount}>${(budget - monthlySpending).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          {categoryBreakdown.map((cat, idx) => (
            <View key={idx} style={styles.categoryItem}>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <View style={styles.categoryBar}>
                <View
                  style={[
                    styles.categoryProgress,
                    {
                      width: `${(cat.amount / monthlySpending) * 100}%`,
                      backgroundColor: COLORS.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.categoryAmount}>${cat.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {expenses.length === 0 ? (
            <Text style={styles.emptyText}>No expenses yet. Add one to get started!</Text>
          ) : (
            expenses.slice(-5).reverse().map(exp => (
              <View key={exp.id} style={styles.expenseItem}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseName}>{exp.name}</Text>
                  <Text style={styles.expenseCategory}>{exp.category}</Text>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expensePrice}>${exp.price.toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => handleDeleteExpense(exp.id)}>
                    <Text style={styles.deleteText}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.trendSection}>
          <Text style={styles.sectionTitle}>6-Month Trend</Text>
          {monthlyTrend.map((month, idx) => (
            <View key={idx} style={styles.trendItem}>
              <Text style={styles.trendMonth}>{month.month}</Text>
              <View style={styles.trendBar}>
                <View
                  style={[
                    styles.trendProgress,
                    {
                      width: `${(month.amount / 200) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.trendAmount}>${month.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Expense</Text>

            <TextInput
              style={styles.input}
              placeholder="Product name"
              value={newExpense.name}
              onChangeText={name => setNewExpense({ ...newExpense, name })}
              placeholderTextColor={COLORS.muted}
            />

            <TextInput
              style={styles.input}
              placeholder="Price"
              value={newExpense.price}
              onChangeText={price => setNewExpense({ ...newExpense, price })}
              keyboardType="decimal-pad"
              placeholderTextColor={COLORS.muted}
            />

            <View style={styles.categoryPicker}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    newExpense.category === cat && styles.categoryOptionActive,
                  ]}
                  onPress={() => setNewExpense({ ...newExpense, category: cat })}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      newExpense.category === cat && styles.categoryOptionTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddExpense}
              >
                <Text style={styles.saveButtonText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 4 },
  budgetCard: { marginHorizontal: 16, marginBottom: 24, backgroundColor: COLORS.card, borderRadius: 16, padding: 16 },
  budgetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  budgetLabel: { fontSize: 12, color: COLORS.muted },
  budgetAmount: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  editButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary },
  editButtonText: { color: COLORS.primary, fontWeight: '600', fontSize: 12 },
  statusBar: { borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { flex: 1 },
  statusLabel: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  statusMessage: { color: '#FFF', fontSize: 12, marginTop: 2 },
  statusPercentage: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  spendingInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 12, color: COLORS.muted },
  infoAmount: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryItem: { marginBottom: 12 },
  categoryName: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  categoryBar: { height: 6, borderRadius: 3, backgroundColor: COLORS.border, marginBottom: 4 },
  categoryProgress: { height: '100%', borderRadius: 3 },
  categoryAmount: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  addButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.primary, borderRadius: 8 },
  addButtonText: { color: '#FFF', fontWeight: '600', fontSize: 12 },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', paddingVertical: 24 },
  expenseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  expenseInfo: { flex: 1 },
  expenseName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  expenseCategory: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  expenseRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  expensePrice: { fontSize: 14, fontWeight: 'bold', color: COLORS.secondary },
  deleteText: { fontSize: 20, color: COLORS.muted },
  trendSection: { paddingHorizontal: 16, marginBottom: 32 },
  trendItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  trendMonth: { width: 40, fontSize: 11, fontWeight: '600', color: COLORS.muted },
  trendBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  trendProgress: { height: '100%', borderRadius: 3, backgroundColor: COLORS.primary },
  trendAmount: { width: 50, textAlign: 'right', fontSize: 11, fontWeight: '600', color: COLORS.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14, color: COLORS.text },
  categoryPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  categoryOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryOptionText: { fontSize: 11, fontWeight: '600', color: COLORS.text },
  categoryOptionTextActive: { color: '#FFF' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelButtonText: { fontWeight: '600', color: COLORS.text },
  saveButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveButtonText: { fontWeight: '600', color: '#FFF' },
});
