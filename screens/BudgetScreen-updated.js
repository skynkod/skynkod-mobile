import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addExpense, getUserExpenses, deleteExpense } from '../utils/expenses-service';
import { getCategoryBreakdown } from '../utils/budget-tracker';
import { useAuth } from '../utils/AuthContext';
import { Screen, Card, Button, Input, Chip, BottomSheet, EmptyState, LoadingView, SectionHeader, ProgressBar, IconButton, useColors } from '../components/ui';
import { SPACING, TYPE } from '../utils/theme';

const CATEGORIES = ['Cleanser', 'Moisturizer', 'Serum', 'Sunscreen', 'Treatment', 'Mask', 'Other'];

// Prices come back from Postgres numeric columns as strings.
const toNumber = v => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const money = n => `$${n.toFixed(2)}`;

export default function BudgetScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [budget, setBudget] = useState(100);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sheet, setSheet] = useState(null); // 'expense' | 'budget'
  const [draft, setDraft] = useState({ name: '', price: '', category: 'Serum' });
  const [budgetDraft, setBudgetDraft] = useState('');

  const budgetKey = `budget_${user?.id}`;

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const [result, savedBudget] = await Promise.all([getUserExpenses(user.id, 31), AsyncStorage.getItem(budgetKey).catch(() => null)]);
    if (result.success) setExpenses((result.data || []).map(e => ({ ...e, price: toNumber(e.price) })));
    if (savedBudget) setBudget(toNumber(savedBudget) || 100);
    setLoading(false);
  }, [user?.id, budgetKey]);

  useEffect(() => {
    load();
  }, [load]);

  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const spent = thisMonth.reduce((sum, e) => sum + e.price, 0);
  const ratio = budget > 0 ? spent / budget : 0;
  const status = ratio >= 1 ? { color: colors.danger, label: 'Over budget' } : ratio >= 0.8 ? { color: colors.warning, label: 'Almost there' } : { color: colors.success, label: 'On track' };
  const breakdown = getCategoryBreakdown(thisMonth);

  const handleAdd = async () => {
    const price = toNumber(draft.price);
    if (!draft.name.trim() || price <= 0) {
      Alert.alert('Missing info', 'Please add a product name and a price.');
      return;
    }
    setSaving(true);
    const result = await addExpense(user.id, { ...draft, name: draft.name.trim(), price });
    setSaving(false);
    if (result.success) {
      setDraft({ name: '', price: '', category: 'Serum' });
      setSheet(null);
      load();
    } else {
      Alert.alert('Could not save', result.error || 'Please try again.');
    }
  };

  const handleSaveBudget = async () => {
    const value = toNumber(budgetDraft);
    if (value <= 0) return;
    setBudget(value);
    AsyncStorage.setItem(budgetKey, String(value)).catch(() => {});
    setSheet(null);
  };

  const handleDelete = (exp) => {
    Alert.alert('Delete expense?', exp.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteExpense(exp.id);
          if (result.success) load();
        },
      },
    ]);
  };

  if (loading) return <LoadingView />;

  return (
    <Screen back title="Budget" subtitle="Your skincare spending this month" right={<IconButton icon="add" tone="primary" onPress={() => setSheet('expense')} accessibilityLabel="Add expense" />}>
      <Card>
        <View style={styles.rowBetween}>
          <View>
            <Text style={[TYPE.overline, { color: colors.muted }]}>Spent</Text>
            <Text style={[TYPE.display, { color: colors.text }]}>{money(spent)}</Text>
          </View>
          <Button title={`of ${money(budget)}`} size="sm" variant="secondary" icon="create-outline" onPress={() => { setBudgetDraft(String(budget)); setSheet('budget'); }} />
        </View>
        <ProgressBar value={ratio} color={status.color} style={{ marginTop: SPACING.lg }} height={10} />
        <View style={[styles.rowBetween, { marginTop: SPACING.sm }]}>
          <Text style={[TYPE.caption, { color: status.color, fontWeight: '700' }]}>{status.label}</Text>
          <Text style={[TYPE.caption, { color: colors.muted }]}>
            {ratio >= 1 ? `${money(spent - budget)} over` : `${money(budget - spent)} left`}
          </Text>
        </View>
      </Card>

      {breakdown.length > 0 ? (
        <>
          <SectionHeader title="By category" style={{ marginTop: SPACING.xl }} />
          <Card>
            {breakdown.map((cat, idx) => (
              <View key={cat.name} style={{ marginBottom: idx === breakdown.length - 1 ? 0 : SPACING.lg }}>
                <View style={[styles.rowBetween, { marginBottom: 6 }]}>
                  <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{cat.name}</Text>
                  <Text style={[TYPE.caption, { color: colors.muted }]}>{money(cat.amount)}</Text>
                </View>
                <ProgressBar value={spent ? cat.amount / spent : 0} height={6} />
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <SectionHeader title="Recent" style={{ marginTop: SPACING.xl }} />
      {expenses.length === 0 ? (
        <EmptyState icon="wallet-outline" title="No expenses yet" description="Log what you buy to see where your skincare budget goes." action="Add an expense" onAction={() => setSheet('expense')} />
      ) : (
        <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
          {expenses.slice(0, 15).map((exp, idx, arr) => (
            <View key={exp.id} style={[styles.expense, idx < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{exp.name}</Text>
                <Text style={[TYPE.caption, { color: colors.muted }]}>
                  {exp.category} · {new Date(exp.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </Text>
              </View>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{money(exp.price)}</Text>
              <IconButton icon="trash-outline" size={32} onPress={() => handleDelete(exp)} accessibilityLabel="Delete expense" />
            </View>
          ))}
        </Card>
      )}

      <Modal visible={sheet === 'expense'} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <BottomSheet title="Add expense" onClose={() => setSheet(null)}>
          <Input label="Product" placeholder="e.g. SPF 50 fluid" value={draft.name} onChangeText={name => setDraft(d => ({ ...d, name }))} />
          <Input label="Price" placeholder="0.00" value={draft.price} onChangeText={price => setDraft(d => ({ ...d, price }))} keyboardType="decimal-pad" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm, paddingBottom: SPACING.lg }}>
            {CATEGORIES.map(cat => (
              <Chip key={cat} label={cat} selected={draft.category === cat} onPress={() => setDraft(d => ({ ...d, category: cat }))} />
            ))}
          </ScrollView>
          <Button title="Add expense" onPress={handleAdd} loading={saving} style={{ marginBottom: SPACING.xl }} />
        </BottomSheet>
      </Modal>

      <Modal visible={sheet === 'budget'} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <BottomSheet title="Monthly budget" onClose={() => setSheet(null)}>
          <Input label="Amount" value={budgetDraft} onChangeText={setBudgetDraft} keyboardType="decimal-pad" autoFocus />
          <Button title="Save budget" onPress={handleSaveBudget} style={{ marginBottom: SPACING.xl }} />
        </BottomSheet>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expense: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },
});
