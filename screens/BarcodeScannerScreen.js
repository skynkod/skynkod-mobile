import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analyzeProduct } from '../utils/product-scanner';
import { addUserProduct } from '../utils/supabase';
import { useAuth } from '../utils/AuthContext';
import { Screen, Card, Button, Input, SectionHeader, ListRow, Badge, EmptyState, useColors } from '../components/ui';
import { SPACING, TYPE } from '../utils/theme';

// Demo catalogue until a real product database / camera scanning is connected.
const DEMO_PRODUCTS = [
  {
    id: 1,
    name: 'Hyaluronic Serum',
    brand: 'Skincare Pro',
    barcode: '8801234567890',
    price: 25,
    category: 'Serum',
    ingredients: [
      { name: 'Hyaluronic Acid', benefitScore: 5 },
      { name: 'Glycerin', benefitScore: 4 },
      { name: 'Panthenol', benefitScore: 3 },
    ],
    benefits: ['hydration', 'plumping'],
    rating: 4.5,
    reviews: 324,
  },
  {
    id: 2,
    name: 'Retinol Night Cream',
    brand: 'Anti-Aging Inc',
    barcode: '8809876543210',
    price: 45,
    category: 'Moisturizer',
    ingredients: [
      { name: 'Retinol', benefitScore: 5 },
      { name: 'Ceramides', benefitScore: 4 },
      { name: 'Peptides', benefitScore: 4 },
    ],
    benefits: ['anti_aging', 'barrier_repair'],
    rating: 4.8,
    reviews: 512,
  },
];

export default function BarcodeScannerScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [adding, setAdding] = useState(false);

  const lookup = (value) => {
    const q = String(value || '').trim().toLowerCase();
    if (!q) return;
    const product = DEMO_PRODUCTS.find(p => p.barcode === q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    setResult(product ? analyzeProduct(product) : { found: false });
  };

  const addToShelf = async () => {
    if (!user?.id || !result?.found) return;
    setAdding(true);
    const ok = await addUserProduct({ user_id: user.id, product_name: result.name, brand: result.brand, category: result.category });
    setAdding(false);
    Alert.alert(ok ? 'Added' : 'Error', ok ? `${result.name} is now on your shelf.` : 'Could not add this product.');
  };

  return (
    <Screen back title="Scanner" subtitle="Check what's inside a product" keyboard>
      <Input
        placeholder="Barcode or product name"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => lookup(query)}
        returnKeyType="search"
        autoCapitalize="none"
      />
      <Button title="Search" icon="search" onPress={() => lookup(query)} />

      {result ? (
        result.found ? (
          <View style={{ marginTop: SPACING.xxl }}>
            <Card>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.heading, { color: colors.text }]}>{result.name}</Text>
                  <Text style={[TYPE.body, { color: colors.muted }]}>{result.brand}</Text>
                </View>
                <Text style={[TYPE.heading, { color: colors.primary }]}>${result.price}</Text>
              </View>
              <View style={[styles.row, { marginTop: SPACING.md }]}>
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text style={[TYPE.caption, { color: colors.text, fontWeight: '700' }]}>{result.rating}</Text>
                <Text style={[TYPE.caption, { color: colors.muted }]}>({result.reviews} reviews)</Text>
              </View>
            </Card>

            <SectionHeader title="Key ingredients" style={{ marginTop: SPACING.xl }} />
            <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
              {result.ingredientAnalysis.map((ing, idx, arr) => (
                <ListRow
                  key={ing.name}
                  icon="flask-outline"
                  title={ing.name}
                  subtitle={ing.concerns?.length ? `⚠️ ${ing.concerns[0]}` : ing.benefit}
                  last={idx === arr.length - 1}
                />
              ))}
            </Card>

            {result.compatibility.goodWith.length > 0 ? (
              <>
                <SectionHeader title="Pairs well with" style={{ marginTop: SPACING.xl }} />
                <View style={styles.tags}>
                  {result.compatibility.goodWith.slice(0, 4).map(i => <Badge key={i} label={i} tone="success" />)}
                </View>
              </>
            ) : null}

            {result.compatibility.avoidWith.length > 0 ? (
              <>
                <SectionHeader title="Avoid mixing with" style={{ marginTop: SPACING.xl }} />
                <View style={styles.tags}>
                  {result.compatibility.avoidWith.slice(0, 4).map(i => <Badge key={i} label={i} tone="danger" />)}
                </View>
              </>
            ) : null}

            <Button title="Add to my shelf" icon="add" variant="secondary" onPress={addToShelf} loading={adding} style={{ marginTop: SPACING.xxl }} />
          </View>
        ) : (
          <EmptyState icon="search-outline" title="Product not found" description="Try another barcode or name, or pick one of the demo products below." />
        )
      ) : null}

      <SectionHeader title="Try a demo product" style={{ marginTop: SPACING.xxl }} />
      <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
        {DEMO_PRODUCTS.map((p, idx) => (
          <ListRow key={p.id} icon="cube-outline" title={p.name} subtitle={p.brand} onPress={() => { setQuery(p.barcode); lookup(p.barcode); }} last={idx === DEMO_PRODUCTS.length - 1} />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: SPACING.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
});
