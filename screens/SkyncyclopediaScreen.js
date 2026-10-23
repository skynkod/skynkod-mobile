import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, useColors } from '../components/ui';
import { useAuth } from '../utils/AuthContext';
import { useT } from '../utils/LanguageContext';
import { useSkinProfile } from '../utils/useSkinProfile';
import { SECTIONS, articlesIn, searchArticles, articlesForProfile } from '../utils/encyclopedia';
import { HOWTO } from '../utils/encyclopedia/howto';
import { INGREDIENTS, searchIngredients, isPremiumIngredient } from '../utils/ingredients-guide';
import { usePremium } from '../components/PremiumLock';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

// Skyncyclopedia: where people learn how to look after their skin.
export default function SkyncyclopediaScreen({ navigation }) {
  const colors = useColors();
  const t = useT();
  const { user } = useAuth();
  const profile = useSkinProfile(user?.id);
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('basics');
  const premium = usePremium();

  const searching = query.trim().length >= 2;
  const foundArticles = useMemo(() => (searching ? searchArticles(query) : []), [query]);
  const foundIngredients = useMemo(() => (searching ? searchIngredients(query).slice(0, 8) : []), [query]);
  const forYou = useMemo(() => articlesForProfile(profile, 5), [profile]);

  const ingredientGroups = useMemo(() => [
    { title: 'Actives and essentials', list: INGREDIENTS.filter(i => HOWTO[i.id]) },
    { title: 'Also good to know', list: INGREDIENTS.filter(i => !HOWTO[i.id] && i.goodFor.length) },
    { title: 'Watch-outs', list: INGREDIENTS.filter(i => !HOWTO[i.id] && !i.goodFor.length) },
  ], []);

  const openArticle = id => navigation.navigate('Article', { id }, { merge: true });
  const openIngredient = id => navigation.navigate('Ingredient', { id });

  const ArticleRow = ({ a }) => (
    <Pressable onPress={() => openArticle(a.id)} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={a.icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[TYPE.bodyStrong, { color: colors.text }]} numberOfLines={2}>{t(a.title)}</Text>
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={2}>{t(a.subtitle)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );

  const IngredientRow = ({ i }) => (
    <Pressable onPress={() => openIngredient(i.id)} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(i.name)}</Text>
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={2}>{t(i.what)}</Text>
      </View>
      {premium === false && isPremiumIngredient(i.id) ? <Ionicons name="diamond" size={14} color="#33202E" /> : <Ionicons name="chevron-forward" size={16} color={colors.muted} />}
    </Pressable>
  );

  const current = SECTIONS.find(s => s.id === section);

  return (
    <Screen back title="Skyncyclopedia" subtitle={t('Learn to take care of your skin')}>
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={[TYPE.body, { flex: 1, color: colors.text, paddingVertical: 12 }]}
          placeholder={t('Search a topic or an ingredient…')}
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {searching ? (
        <>
          {!foundArticles.length && !foundIngredients.length ? (
            <Text style={[TYPE.body, { color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.xl }]}>
              {t('Nothing found. Try another word, or ask Koda.')}
            </Text>
          ) : null}
          {foundArticles.length ? <Text style={[styles.label, { color: colors.muted }]}>{t('ARTICLES')}</Text> : null}
          {foundArticles.map(a => <ArticleRow key={a.id} a={a} />)}
          {foundIngredients.length ? <Text style={[styles.label, { color: colors.muted }]}>{t('INGREDIENTS')}</Text> : null}
          {foundIngredients.map(i => <IngredientRow key={i.id} i={i} />)}
        </>
      ) : (
        <>
          {forYou.length ? (
            <>
              <Text style={[styles.label, { color: colors.muted, marginTop: 0 }]}>{t('FOR YOUR SKIN')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md, paddingRight: SPACING.xl }} style={{ marginHorizontal: -SPACING.xl, paddingLeft: SPACING.xl }}>
                {forYou.map(a => (
                  <Pressable key={a.id} onPress={() => openArticle(a.id)} style={[styles.feature, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name={a.icon} size={22} color={colors.primary} />
                    <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.sm }]} numberOfLines={3}>{t(a.title)}</Text>
                    <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 'auto' }]}>{t('{n} min read', { n: a.minutes })}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm, paddingRight: SPACING.xl }} style={{ marginHorizontal: -SPACING.xl, paddingLeft: SPACING.xl, marginTop: SPACING.xl }}>
            {SECTIONS.map(s => {
              const on = s.id === section;
              return (
                <Pressable key={s.id} onPress={() => setSection(s.id)} style={[styles.tab, { backgroundColor: on ? colors.primary : colors.surface }]}>
                  <Ionicons name={s.icon} size={15} color={on ? '#FFFFFF' : colors.textSecondary} />
                  <Text style={[TYPE.caption, { color: on ? '#FFFFFF' : colors.textSecondary, fontWeight: '700' }]}>{t(s.label)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.lg, marginBottom: SPACING.md }]}>{t(current.intro)}</Text>

          {section === 'ingredients'
            ? ingredientGroups.map(g => (
                <View key={g.title}>
                  <Text style={[styles.label, { color: colors.muted }]}>{t(g.title).toUpperCase()}</Text>
                  {g.list.map(i => <IngredientRow key={i.id} i={i} />)}
                </View>
              ))
            : articlesIn(section).map(a => <ArticleRow key={a.id} a={a} />)}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  feature: { width: 170, height: 150, borderRadius: RADIUS.lg, padding: SPACING.lg },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: RADIUS.pill, paddingHorizontal: 14, paddingVertical: 9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, marginBottom: SPACING.sm },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
