import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Badge, EmptyState, useColors } from '../components/ui';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

const INGREDIENTS_DATA = [
  { id: 1, name: 'Hyaluronic Acid', role: 'Hydrator', description: 'Humectant that holds up to 1000x its weight in water', benefits: { hydration: 5, plumping: 5, barrier_repair: 2 }, idealFor: ['Dehydrated', 'All skin types', 'Aging', 'Dry'], pairsWellWith: ['Glycerin', 'Ceramides', 'Vitamin E'], conflictsWith: [] },
  { id: 2, name: 'Niacinamide', role: 'Multi-tasking', description: 'Vitamin B3 that strengthens barrier and reduces sebum', benefits: { barrier_repair: 5, oil_control: 4, pore_minimizing: 3, anti_inflammatory: 4 }, idealFor: ['Oily', 'Acne-prone', 'Sensitive', 'Combination'], pairsWellWith: ['Retinol', 'Salicylic Acid', 'Azelaic Acid'], conflictsWith: [] },
  { id: 3, name: 'Retinol', role: 'Anti-aging', description: 'Vitamin A derivative that increases cell turnover and collagen', benefits: { anti_aging: 5, texture: 4, brightening: 4 }, idealFor: ['Aging', 'Dull skin', 'Texture'], pairsWellWith: ['Niacinamide', 'Peptides'], conflictsWith: ['Vitamin C', 'AHA/BHA'] },
];

export default function SkyncyclopediaScreen() {
  const colors = useColors();
  const [searchText, setSearchText] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return INGREDIENTS_DATA.filter(ing => ing.name.toLowerCase().includes(q) || ing.role.toLowerCase().includes(q));
  }, [searchText]);

  return (
    <Screen back title="Skyncyclopedia" subtitle="What each ingredient does for you">
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={[TYPE.body, { flex: 1, color: colors.text, paddingVertical: 12 }]}
          placeholder="Search ingredients…"
          placeholderTextColor={colors.muted}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
        />
      </View>

      {filtered.length === 0 ? (
        <EmptyState icon="library-outline" title="No match" description="Try another ingredient name." />
      ) : (
        filtered.map(item => {
          const open = selectedId === item.id;
          return (
            <Card key={item.id} style={{ marginBottom: SPACING.md }} onPress={() => setSelectedId(open ? null : item.id)}>
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.subheading, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700', marginTop: 2 }]}>{item.role}</Text>
                </View>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
              </View>
              {open ? (
                <View style={{ marginTop: SPACING.md }}>
                  <Text style={[TYPE.body, { color: colors.textSecondary }]}>{item.description}</Text>
                  <Text style={[TYPE.overline, { color: colors.muted, marginTop: SPACING.lg, marginBottom: SPACING.sm }]}>Best for</Text>
                  <View style={styles.tags}>{item.idealFor.map(t => <Badge key={t} label={t} />)}</View>
                  {item.pairsWellWith.length ? (
                    <>
                      <Text style={[TYPE.overline, { color: colors.muted, marginTop: SPACING.lg, marginBottom: SPACING.sm }]}>Pairs well with</Text>
                      <View style={styles.tags}>{item.pairsWellWith.map(t => <Badge key={t} label={t} tone="success" />)}</View>
                    </>
                  ) : null}
                  {item.conflictsWith.length ? (
                    <>
                      <Text style={[TYPE.overline, { color: colors.muted, marginTop: SPACING.lg, marginBottom: SPACING.sm }]}>Don't mix with</Text>
                      <View style={styles.tags}>{item.conflictsWith.map(t => <Badge key={t} label={t} tone="danger" />)}</View>
                    </>
                  ) : null}
                </View>
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
  head: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
});
