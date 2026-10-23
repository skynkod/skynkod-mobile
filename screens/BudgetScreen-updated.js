import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, LoadingView, BottomSheet, useColors } from '../components/ui';
import { useAuth } from '../utils/AuthContext';
import { useT, useLanguage } from '../utils/LanguageContext';
import { getMyProducts, addToMyProducts, searchProducts } from '../utils/catalog';
import ProductThumb from '../components/ProductThumb';
import {
  getPurchasesBetween, getSixMonths, getYearTotal, addPurchase, updatePurchase, deletePurchase,
  getMonthlyBudget, setMonthlyBudget, budgetInsights, formatMAD, costPerUse,
} from '../utils/skynbudget';
import { recordPrice, requestProduct, getPriceStats, STORES } from '../utils/community-data';
import { logError } from '../utils/errorLogger';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

const firstOfMonth = d => new Date(d.getFullYear(), d.getMonth(), 1);
const sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const CATEGORY_LABELS = {
  cleanser: 'Cleansers', toner: 'Toners', serum: 'Serums', moisturizer: 'Moisturizers', sunscreen: 'SPF',
  exfoliant: 'Exfoliants', mask: 'Masks', 'eye care': 'Eye care', body: 'Body', 'hand care': 'Hand care', other: 'Other',
};
const perUse = (price, category) => `${(Math.round(costPerUse(price, category) * 10) / 10).toLocaleString('fr-MA')} MAD`;

// Skynbudget: spending per month against a budget, history, where the money
// goes, smart insights, and purchases checked against real Moroccan prices.
export default function BudgetScreen({ navigation }) {
  const colors = useColors();
  const t = useT();
  const { language } = useLanguage();
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(firstOfMonth(now));
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [history, setHistory] = useState([]);
  const [yearTotal, setYearTotal] = useState(0);
  const [owned, setOwned] = useState([]);
  const [toBuy, setToBuy] = useState([]);
  const [budget, setBudget] = useState(null);
  const [allInsights, setAllInsights] = useState(false);
  const [budgetSheet, setBudgetSheet] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  // Add / edit purchase sheet
  const [sheet, setSheet] = useState(null); // null | { editing: purchase | null }
  const [pick, setPick] = useState(null);
  const [otherName, setOtherName] = useState('');
  const [price, setPrice] = useState('');
  const [store, setStore] = useState(null);
  const [date, setDate] = useState(new Date());
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [pickStats, setPickStats] = useState(null);
  const searchId = useRef(0);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
      const [rows, six, year, mine, b] = await Promise.all([
        getPurchasesBetween(user.id, month, end),
        getSixMonths(user.id, month),
        getYearTotal(user.id, month.getFullYear()),
        getMyProducts(user.id),
        getMonthlyBudget(user.id),
      ]);
      setPurchases(rows);
      setHistory(six);
      setYearTotal(year);
      setOwned(mine.filter(r => r.status === 'owned' && r.product).map(r => r.product));
      setToBuy(mine.filter(r => r.status === 'to_buy' && r.product).map(r => r.product));
      setBudget(b);
    } catch (error) {
      await logError('Budget_load', error, {}, 'warn');
    } finally {
      setLoading(false);
    }
  }, [user?.id, month.getTime()]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Catalogue search in the sheet
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return setResults([]);
    const id = ++searchId.current;
    const timer = setTimeout(async () => {
      const rows = await searchProducts(q).catch(() => []);
      if (id === searchId.current) setResults(rows.slice(0, 12));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Usual price of the picked product, shown while typing the price
  useEffect(() => {
    setPickStats(null);
    const id = pick?.id || sheet?.editing?.product_id;
    if (id) getPriceStats(id).then(setPickStats).catch(() => {});
  }, [pick?.id, sheet?.editing?.id]);

  if (loading) return <LoadingView />;

  const isCurrent = sameMonth(month, now);
  const spent = purchases.reduce((sum, p) => sum + Number(p.price || 0), 0);
  const ratio = budget ? Math.min(1, spent / budget) : 0;
  const insights = budgetInsights({ owned, toBuy, purchases, budget: isCurrent ? budget : null });
  const monthLabel = month.toLocaleDateString(language, { month: 'long', year: month.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
  const maxMonth = Math.max(1, ...history.map(h => h.total));
  const byCategory = Object.entries(
    purchases.reduce((acc, p) => ({ ...acc, [p.category || 'other']: (acc[p.category || 'other'] || 0) + Number(p.price || 0) }), {})
  ).sort((a, b) => b[1] - a[1]);

  const openAdd = () => {
    setPick(null); setOtherName(''); setPrice(''); setStore(null); setQuery('');
    setDate(isCurrent ? new Date() : new Date(month.getFullYear(), month.getMonth(), 15));
    setSheet({ editing: null });
  };
  const openEdit = (p) => {
    setPick(null); setOtherName(''); setQuery('');
    setPrice(String(Math.round(Number(p.price) * 100) / 100));
    setStore(p.store || null);
    setDate(new Date(p.date));
    setSheet({ editing: p });
  };
  const shiftDate = (days) => setDate(d => {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x > new Date() ? new Date() : x;
  });

  // Paid vs the usual price in Morocco.
  const priceVerdict = (paid, stats) => {
    if (!stats?.typical) return null;
    const diff = (paid - stats.typical) / stats.typical;
    if (diff <= -0.1) return { good: true, text: t('Good deal! {n}% under the usual price in Morocco (~{usual}).', { n: Math.round(-diff * 100), usual: formatMAD(stats.typical) }) };
    if (diff >= 0.1) {
      return {
        good: false,
        text: t('You paid {n}% more than the usual price (~{usual}).', { n: Math.round(diff * 100), usual: formatMAD(stats.typical) }) +
          (stats.top_store ? ` ${t('People often buy it at {store}.', { store: t(stats.top_store) })}` : ''),
      };
    }
    return { good: true, text: t('Fair price: right around the usual ~{usual}.', { usual: formatMAD(stats.typical) }) };
  };

  const savePurchase = async () => {
    const value = Number(String(price).replace(',', '.'));
    const editing = sheet?.editing;
    if (!editing && !pick && !otherName.trim()) return Alert.alert(t('Choose a product'), t('Search for it or type a name.'));
    if (!value || value <= 0) return Alert.alert(t('Enter the price'), t('How much did you pay, in MAD?'));
    try {
      if (editing) {
        await updatePurchase(editing.id, { price: value, store, date });
      } else {
        await addPurchase(user.id, pick ? { product: pick, price: value, store, date } : { name: otherName.trim(), price: value, store, date });
        if (pick) {
          recordPrice({ productId: pick.id, price: value, store }).catch(e => logError('Budget_recordPrice', e, {}, 'warn'));
          if (!owned.some(p => p.id === pick.id)) await addToMyProducts(user.id, pick, 'owned').catch(() => {});
        } else {
          requestProduct('name', otherName).catch(e => logError('Budget_requestProduct', e, {}, 'warn'));
        }
      }
      const verdict = priceVerdict(value, pickStats);
      setSheet(null);
      setMonth(firstOfMonth(date));
      load();
      if (verdict && !editing) Alert.alert(verdict.good ? t('Nice!') : t('Good to know'), verdict.text);
    } catch (error) {
      await logError('Budget_savePurchase', error, {}, 'warn');
      Alert.alert(t('Error'), t("Couldn't save this purchase. Try again."));
    }
  };

  const removePurchase = () => {
    const p = sheet?.editing;
    if (!p) return;
    Alert.alert(t('Delete this purchase?'), `${p.product_name || p.name} · ${formatMAD(p.price)}`, [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Delete'), style: 'destructive', onPress: async () => { await deletePurchase(p.id).catch(() => {}); setSheet(null); load(); } },
    ]);
  };

  const saveBudget = async () => {
    const value = Number(String(budgetInput).replace(',', '.'));
    if (!value || value <= 0) return Alert.alert(t('Enter an amount'), t('For example 500.'));
    setBudget(value);
    setBudgetSheet(false);
    const ok = await setMonthlyBudget(user.id, value);
    if (!ok) Alert.alert(t('Error'), t("Couldn't save your budget. Try again."));
  };

  const dateLabel = (() => {
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return t('Today');
    if (date.toDateString() === yesterday.toDateString()) return t('Yesterday');
    return date.toLocaleDateString(language, { weekday: 'short', day: 'numeric', month: 'short' });
  })();
  const typedPrice = Number(String(price).replace(',', '.'));
  const liveVerdict = typedPrice > 0 ? priceVerdict(typedPrice, pickStats) : null;
  const sheetCategory = pick?.category || sheet?.editing?.category;

  return (
    <Screen back>
      <Text style={[styles.brand, { color: colors.primary }]}>skynbudget</Text>

      {/* Month */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.monthNav}>
          <Pressable onPress={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} hitSlop={10} accessibilityLabel={t('Previous month')}>
            <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
          </Pressable>
          <Text style={[TYPE.caption, { color: colors.textSecondary, textTransform: 'capitalize', fontWeight: '700' }]}>
            {isCurrent ? `${t('This month')} · ` : ''}{monthLabel}
          </Text>
          <Pressable disabled={isCurrent} onPress={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} hitSlop={10} accessibilityLabel={t('Next month')}>
            <Ionicons name="chevron-forward" size={18} color={isCurrent ? 'transparent' : colors.textSecondary} />
          </Pressable>
        </View>
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

        {/* 6-month history */}
        <View style={styles.chart}>
          {history.map(h => {
            const on = sameMonth(h.month, month);
            return (
              <Pressable key={h.month.toISOString()} onPress={() => setMonth(h.month)} style={styles.barCol}>
                <View style={styles.barArea}>
                  <View style={[styles.bar, { height: `${Math.max(4, (h.total / maxMonth) * 100)}%`, backgroundColor: on ? colors.accent : colors.primarySoft }]} />
                </View>
                <Text style={[styles.barLabel, { color: on ? colors.primary : colors.muted }]}>
                  {h.month.toLocaleDateString(language, { month: 'short' }).replace('.', '')}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.sm }]}>
          {t('{year} so far: {total}', { year: month.getFullYear(), total: formatMAD(yearTotal) })}
        </Text>
      </View>

      {/* Where the money goes */}
      {byCategory.length ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Where it goes')}</Text>
          {byCategory.map(([cat, total]) => (
            <View key={cat} style={styles.catRow}>
              <Text style={[TYPE.caption, { color: colors.text, width: 92 }]}>{t(CATEGORY_LABELS[cat] || cat)}</Text>
              <View style={[styles.catTrack, { backgroundColor: colors.primarySoft }]}>
                <View style={[styles.catFill, { width: `${(total / spent) * 100}%`, backgroundColor: colors.accent }]} />
              </View>
              <Text style={[TYPE.caption, { color: colors.textSecondary, width: 70, textAlign: 'right' }]}>{formatMAD(total)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Collection */}
      <Pressable onPress={() => navigation.navigate('Products')} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHead}>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Collection')}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('{n} products', { n: owned.length })}</Text>
        </View>
        <View style={styles.thumbs}>
          {owned.slice(0, 6).map(p => (
            <ProductThumb key={p.id} product={p} style={styles.thumb} />
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

      {/* Purchases of the month */}
      <View style={styles.cardHead}>
        <Text style={[styles.section, { color: colors.muted }]}>{isCurrent ? t('PURCHASES THIS MONTH') : t('PURCHASES')}</Text>
        <Pressable onPress={openAdd} hitSlop={8}>
          <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>+ {t('Add purchase')}</Text>
        </Pressable>
      </View>
      {purchases.length ? purchases.map(p => (
        <Pressable key={p.id} onPress={() => openEdit(p)} style={[styles.purchase, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[TYPE.bodyStrong, { color: colors.text }]} numberOfLines={1}>{p.product_name || p.name}</Text>
            <Text style={[TYPE.caption, { color: colors.textSecondary }]}>
              {[
                new Date(p.date).toLocaleDateString(language, { day: 'numeric', month: 'short' }),
                p.store && t(p.store),
                t('≈ {cost} per use', { cost: perUse(p.price, p.category) }),
              ].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{formatMAD(p.price)}</Text>
        </Pressable>
      )) : (
        <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('No purchases this month.')}</Text>
      )}
      {purchases.length ? <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.sm }]}>{t('Tap a purchase to edit or delete it.')}</Text> : null}

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

      {/* Add / edit purchase sheet */}
      <Modal visible={!!sheet} transparent animationType="fade" onRequestClose={() => setSheet(null)}>
        <BottomSheet title={sheet?.editing ? t('Edit purchase') : t('Add purchase')} onClose={() => setSheet(null)}>
          {sheet?.editing ? (
            <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{sheet.editing.product_name || sheet.editing.name}</Text>
          ) : (
            <>
              <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('Which product?')}</Text>
              <View style={[styles.searchField, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Ionicons name="search" size={16} color={colors.muted} />
                <TextInput value={query} onChangeText={setQuery} placeholder={t('Search any product or brand')} placeholderTextColor={colors.muted} autoCorrect={false} style={[styles.searchInput, { color: colors.text }]} />
              </View>
              {query.trim().length >= 2 ? (
                <View style={{ marginTop: SPACING.sm }}>
                  {results.map(p => {
                    const on = pick?.id === p.id;
                    return (
                      <Pressable key={p.id} onPress={() => { setPick(p); setOtherName(''); }} style={[styles.resultRow, { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.card }]}>
                        <ProductThumb product={p} style={styles.resultImage} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: colors.textSecondary }} numberOfLines={1}>{p.brand}</Text>
                          <Text style={[TYPE.caption, { color: colors.text, fontWeight: '700' }]} numberOfLines={2}>{p.name}</Text>
                        </View>
                        {on ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                      </Pressable>
                    );
                  })}
                  {!results.length ? (
                    <Pressable onPress={() => { setPick(null); setOtherName(query.trim()); }} style={[styles.resultRow, { borderColor: otherName ? colors.primary : colors.border, backgroundColor: colors.card }]}>
                      <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                      <Text style={[TYPE.caption, { color: colors.text, flex: 1 }]}>{t('Not in our catalogue? Add "{name}" anyway', { name: query.trim() })}</Text>
                      {otherName ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <>
                  {[...toBuy, ...owned].length ? <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.md }]}>{t('Or one of yours')}</Text> : null}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm, paddingVertical: SPACING.sm }}>
                    {[...toBuy, ...owned].map(p => {
                      const on = pick?.id === p.id;
                      return (
                        <Pressable key={p.id} onPress={() => { setPick(on ? null : p); setOtherName(''); }} style={[styles.pickItem, { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.card }]}>
                          <ProductThumb product={p} style={styles.pickImage} />
                          <Text style={{ fontSize: 11, color: colors.text, fontWeight: '600', textAlign: 'center' }} numberOfLines={2}>{p.name}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              )}
            </>
          )}

          {/* Price, with the usual price in Morocco when we know it */}
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder={t('Price')} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text }]} />
            <Text style={[TYPE.bodyStrong, { color: colors.textSecondary }]}>MAD</Text>
          </View>
          {liveVerdict ? (
            <Text style={[TYPE.caption, { color: liveVerdict.good ? colors.success : colors.warning, marginTop: 6, lineHeight: 17 }]}>{liveVerdict.text}</Text>
          ) : pickStats ? (
            <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 6 }]}>{t('Usually ~{usual} in Morocco.', { usual: formatMAD(pickStats.typical) })}</Text>
          ) : null}
          {typedPrice > 0 && sheetCategory ? (
            <Text style={[TYPE.caption, { color: colors.muted, marginTop: 4 }]}>{t('About {cost} per use', { cost: perUse(typedPrice, sheetCategory) })}</Text>
          ) : null}

          {/* Date */}
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.md }]}>{t('When?')}</Text>
          <View style={styles.dateRow}>
            <Pressable onPress={() => shiftDate(-1)} hitSlop={8} style={[styles.dateBtn, { borderColor: colors.border }]} accessibilityLabel={t('Previous day')}>
              <Ionicons name="chevron-back" size={16} color={colors.text} />
            </Pressable>
            <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1, textAlign: 'center', textTransform: 'capitalize' }]}>{dateLabel}</Text>
            <Pressable onPress={() => shiftDate(1)} hitSlop={8} style={[styles.dateBtn, { borderColor: colors.border }]} accessibilityLabel={t('Next day')}>
              <Ionicons name="chevron-forward" size={16} color={colors.text} />
            </Pressable>
          </View>

          {/* Store */}
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.md }]}>{t('Where did you buy it? (optional)')}</Text>
          <View style={styles.storeRow}>
            {STORES.map(st => {
              const on = store === st;
              return (
                <Pressable key={st} onPress={() => setStore(on ? null : st)} style={[styles.storeChip, { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.card }]}>
                  <Text style={{ fontSize: 12, color: on ? colors.primary : colors.text, fontWeight: '600' }}>{t(st)}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={savePurchase} style={[styles.save, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.onPrimary, fontWeight: '600' }}>{sheet?.editing ? t('Save changes') : t('Add purchase')}</Text>
          </Pressable>
          {sheet?.editing ? (
            <Pressable onPress={removePurchase} style={{ alignSelf: 'center', marginTop: -SPACING.sm, marginBottom: SPACING.xl }}>
              <Text style={[TYPE.bodyStrong, { color: colors.danger }]}>{t('Delete purchase')}</Text>
            </Pressable>
          ) : null}
        </BottomSheet>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8, marginBottom: SPACING.sm },
  card: { borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.lg, marginTop: SPACING.md },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, marginTop: 4 },
  amount: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: SPACING.md },
  fill: { height: 8, borderRadius: 4 },
  setBudget: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginTop: SPACING.md },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 90, marginTop: SPACING.lg, gap: 8 },
  barCol: { flex: 1, alignItems: 'center', height: '100%' },
  barArea: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 10, fontWeight: '700', marginTop: 4, textTransform: 'capitalize' },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md },
  catTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  catFill: { height: 8, borderRadius: 4 },
  thumbs: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md, flexWrap: 'wrap' },
  thumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#FFFFFF' },
  more: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  insight: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginTop: SPACING.md },
  insightIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  viewAll: { height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.lg },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  purchase: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, marginTop: SPACING.md },
  input: { flex: 1, height: 50, fontSize: 18, fontWeight: '600' },
  save: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xl },
  searchField: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderWidth: 1, borderRadius: 999, paddingHorizontal: SPACING.lg, height: 46, marginTop: SPACING.sm },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: 6 },
  resultImage: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#FFFFFF' },
  pickItem: { width: 92, alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: RADIUS.md, padding: 8 },
  pickImage: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#FFFFFF' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.sm },
  dateBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  storeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm },
  storeChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
});
