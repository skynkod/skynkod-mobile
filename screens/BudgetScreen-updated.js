import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, LoadingView, BottomSheet, useColors } from '../components/ui';
import { useAuth } from '../utils/AuthContext';
import { useT, useLanguage } from '../utils/LanguageContext';
import { getMyProducts, addToMyProducts } from '../utils/catalog';
import { getMonthPurchases, addPurchase, deletePurchase, getMonthlyBudget, setMonthlyBudget, budgetInsights, formatMAD } from '../utils/skynbudget';
import { logError } from '../utils/errorLogger';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

// Skynbudget from the mockup: this month's spending against a budget, the
// collection, smart insights, and this month's purchases.
export default function BudgetScreen({ navigation }) {
  const colors = useColors();
  const t = useT();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [owned, setOwned] = useState([]);
  const [toBuy, setToBuy] = useState([]);
  const [budget, setBudget] = useState(null);
  const [allInsights, setAllInsights] = useState(false);
  const [budgetSheet, setBudgetSheet] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [addSheet, setAddSheet] = useState(false);
  const [pick, setPick] = useState(null);
  const [otherName, setOtherName] = useState('');
  const [price, setPrice] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [month, mine, b] = await Promise.all([getMonthPurchases(user.id), getMyProducts(user.id), getMonthlyBudget(user.id)]);
      setPurchases(month);
      setOwned(mine.filter(r => r.status === 'owned' && r.product).map(r => r.product));
      setToBuy(mine.filter(r => r.status === 'to_buy' && r.product).map(r => r.product));
      setBudget(b);
    } catch (error) {
      await logError('Budget_load', error, {}, 'warn');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <LoadingView />;

  const spent = purchases.reduce((sum, p) => sum + Number(p.price || 0), 0);
  const ratio = budget ? Math.min(1, spent / budget) : 0;
  const insights = budgetInsights({ owned, toBuy, purchases, budget });
  const monthName = new Date().toLocaleDateString(language, { month: 'long' });

  const saveBudget = async () => {
    const value = Number(String(budgetInput).replace(',', '.'));
    if (!value || value <= 0) return Alert.alert(t('Enter an amount'), t('For example 500.'));
    setBudget(value);
    setBudgetSheet(false);
    const ok = await setMonthlyBudget(user.id, value);
    if (!ok) Alert.alert(t('Error'), t("Couldn't save your budget. Try again."));
  };

  const savePurchase = async () => {
    const value = Number(String(price).replace(',', '.'));
    if (!pick && !otherName.trim()) return Alert.alert(t('Choose a product'), t('Pick one of your products or type a name.'));
    if (!value || value <= 0) return Alert.alert(t('Enter the price'), t('How much did you pay, in MAD?'));
    try {
      await addPurchase(user.id, pick ? { product: pick, price: value } : { name: otherName.trim(), price: value });
      // Bought something from the To buy list: it's now owned.
      if (pick && toBuy.some(p => p.id === pick.id)) await addToMyProducts(user.id, pick, 'owned').catch(() => {});
      setAddSheet(false);
      setPick(null);
      setOtherName('');
      setPrice('');
      load();
    } catch (error) {
      await logError('Budget_addPurchase', error, {}, 'warn');
      Alert.alert(t('Error'), t("Couldn't save this purchase. Try again."));
    }
  };

  const removePurchase = (p) =>
    Alert.alert(p.product_name || p.name, formatMAD(p.price), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Delete'), style: 'destructive', onPress: async () => { await deletePurchase(p.id).catch(() => {}); load(); } },
    ]);

  return (
    <Screen back>
      <Text style={[styles.brand, { color: colors.primary }]}>skynbudget</Text>

      {/* This month */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[TYPE.caption, { color: colors.textSecondary, textTransform: 'capitalize' }]}>{t('This month')} · {monthName}</Text>
        <View style={styles.amountRow}>
          <Text style={[styles.amount, { color: colors.text }]}>{formatMAD(spent)}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginBottom: 8 }]}>{t('spent')}</Text>
        </View>
        {budget ? (
          <>
            <View style={[styles.track, { backgroundColor: colors.primarySoft }]}>
              <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: spent > budget ? colors.danger : colors.accent }]} />
            </View>
            <Pressable onPress={() => { setBudgetInput(String(budget)); setBudgetSheet(true); }} style={{ alignSelf: 'flex-end', marginTop: 6 }} hitSlop={8}>
              <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{formatMAD(budget)} {t('budget')} <Ionicons name="pencil" size={11} color={colors.muted} /></Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={() => { setBudgetInput(''); setBudgetSheet(true); }} style={[styles.setBudget, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="wallet-outline" size={16} color={colors.primary} />
            <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Set a monthly budget')}</Text>
          </Pressable>
        )}
      </View>

      {/* Collection */}
      <Pressable onPress={() => navigation.navigate('Products')} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHead}>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Collection')}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('{n} products', { n: owned.length })}</Text>
        </View>
        <View style={styles.thumbs}>
          {owned.slice(0, 6).map(p => (
            p.image_url
              ? <Image key={p.id} source={{ uri: p.image_url }} style={styles.thumb} resizeMode="contain" />
              : <View key={p.id} style={[styles.thumb, styles.noThumb, { backgroundColor: colors.surface }]}><Ionicons name="water-outline" size={16} color={colors.muted} /></View>
          ))}
          {owned.length > 6 ? (
            <View style={[styles.more, { backgroundColor: colors.primarySoft }]}>
              <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>+{owned.length - 6}</Text>
            </View>
          ) : null}
          {!owned.length ? <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('Add the products you own in My products.')}</Text> : null}
        </View>
      </Pressable>

      {/* Smart insights */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Smart insights')}</Text>
        {(allInsights ? insights : insights.slice(0, 3)).map((ins, i) => (
          <View key={i} style={styles.insight}>
            <View style={[styles.insightIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name={ins.icon} size={15} color={colors.primary} />
            </View>
            <Text style={[TYPE.caption, { color: colors.text, flex: 1, lineHeight: 18 }]}>{t(ins.text)}</Text>
          </View>
        ))}
        {insights.length > 3 ? (
          <Pressable onPress={() => setAllInsights(!allInsights)} style={[styles.viewAll, { backgroundColor: colors.accent }]}>
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{allInsights ? t('Show less') : t('View all insights')}</Text>
          </Pressable>
        ) : null}
      </View>

      {/* This month's purchases */}
      <View style={styles.cardHead}>
        <Text style={[styles.section, { color: colors.muted }]}>{t('PURCHASES THIS MONTH')}</Text>
        <Pressable onPress={() => setAddSheet(true)} hitSlop={8}>
          <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>+ {t('Add purchase')}</Text>
        </Pressable>
      </View>
      {purchases.length ? purchases.map(p => (
        <Pressable key={p.id} onLongPress={() => removePurchase(p)} style={[styles.purchase, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[TYPE.bodyStrong, { color: colors.text }]} numberOfLines={1}>{p.product_name || p.name}</Text>
            <Text style={[TYPE.caption, { color: colors.textSecondary }]}>
              {[p.brand, new Date(p.date).toLocaleDateString(language, { day: 'numeric', month: 'short' })].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{formatMAD(p.price)}</Text>
        </Pressable>
      )) : (
        <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('No purchases yet this month.')}</Text>
      )}
      {purchases.length ? <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.sm }]}>{t('Long-press a purchase to delete it.')}</Text> : null}

      {/* Budget sheet */}
      <Modal visible={budgetSheet} transparent animationType="fade" onRequestClose={() => setBudgetSheet(false)}>
        <BottomSheet title={t('Monthly budget')} onClose={() => setBudgetSheet(false)}>
          <Text style={[TYPE.body, { color: colors.textSecondary }]}>{t('How much do you want to spend on skincare each month?')}</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <TextInput value={budgetInput} onChangeText={setBudgetInput} keyboardType="decimal-pad" placeholder="500" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text }]} autoFocus />
            <Text style={[TYPE.bodyStrong, { color: colors.textSecondary }]}>MAD</Text>
          </View>
          <Pressable onPress={saveBudget} style={[styles.save, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.onPrimary, fontWeight: '600' }}>{t('Save')}</Text>
          </Pressable>
        </BottomSheet>
      </Modal>

      {/* Add purchase sheet */}
      <Modal visible={addSheet} transparent animationType="fade" onRequestClose={() => setAddSheet(false)}>
        <BottomSheet title={t('Add purchase')} onClose={() => setAddSheet(false)}>
          <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('Which product?')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm, paddingVertical: SPACING.sm }}>
            {[...toBuy, ...owned].map(p => {
              const on = pick?.id === p.id;
              return (
                <Pressable key={p.id} onPress={() => { setPick(on ? null : p); setOtherName(''); }} style={[styles.pickItem, { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.card }]}>
                  {p.image_url ? <Image source={{ uri: p.image_url }} style={styles.pickImage} resizeMode="contain" /> : <Ionicons name="water-outline" size={22} color={colors.muted} />}
                  <Text style={{ fontSize: 11, color: colors.text, fontWeight: '600', textAlign: 'center' }} numberOfLines={2}>{p.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <TextInput
            value={otherName}
            onChangeText={v => { setOtherName(v); if (v) setPick(null); }}
            placeholder={t('Or type a product name')}
            placeholderTextColor={colors.muted}
            style={[styles.textField, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          />
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder={t('Price')} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text }]} />
            <Text style={[TYPE.bodyStrong, { color: colors.textSecondary }]}>MAD</Text>
          </View>
          <Pressable onPress={savePurchase} style={[styles.save, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.onPrimary, fontWeight: '600' }}>{t('Add purchase')}</Text>
          </Pressable>
        </BottomSheet>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8, marginBottom: SPACING.sm },
  card: { borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.lg, marginTop: SPACING.md },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, marginTop: 4 },
  amount: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: SPACING.md },
  fill: { height: 8, borderRadius: 4 },
  setBudget: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginTop: SPACING.md },
  thumbs: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md, flexWrap: 'wrap' },
  thumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#FFFFFF' },
  noThumb: { alignItems: 'center', justifyContent: 'center' },
  more: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  insight: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginTop: SPACING.md },
  insightIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  viewAll: { height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.lg },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  purchase: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, marginTop: SPACING.md },
  input: { flex: 1, height: 50, fontSize: 18, fontWeight: '600' },
  textField: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, height: 48, marginTop: SPACING.sm, fontSize: 15 },
  save: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xl },
  pickItem: { width: 92, alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: RADIUS.md, padding: 8 },
  pickImage: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#FFFFFF' },
});
