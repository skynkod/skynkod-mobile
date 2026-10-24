import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, EmptyState, Button, useColors } from '../components/ui';
import { getCondition } from '../utils/encyclopedia/conditions';
import ArticleBody from '../components/ArticleBody';
import { useT } from '../utils/LanguageContext';
import { useAuth } from '../utils/AuthContext';
import { trackArticle } from '../utils/journey';
import { getArticle, SECTIONS, ARTICLES } from '../utils/encyclopedia';
import { getIngredient } from '../utils/ingredients-guide';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

// One Skyncyclopedia article.
export default function ArticleScreen({ navigation, route }) {
  const colors = useColors();
  const t = useT();
  const article = getArticle(route?.params?.id);
  const { user } = useAuth();
  // An article read counts once for My Skin Journey.
  useEffect(() => { if (article && user?.id) trackArticle(user.id, article.id); }, [article?.id, user?.id]);

  if (!article) return <Screen back><EmptyState icon="alert-circle-outline" title={t('Article not found')} /></Screen>;

  const section = SECTIONS.find(s => s.id === article.section);
  const ingredients = (article.ingredients || []).map(getIngredient).filter(Boolean);
  const related = ARTICLES.filter(a => a.id !== article.id && a.section === article.section).slice(0, 3);

  return (
    <Screen back>
      <Text style={[TYPE.overline, { color: colors.primary }]}>{t(section?.label || '')}</Text>
      <Text style={[TYPE.title, { color: colors.text, marginTop: SPACING.xs }]}>{t(article.title)}</Text>
      {article.section !== 'myths' && article.subtitle ? (
        <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.xs }]}>{t(article.subtitle)}</Text>
      ) : null}
      <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.sm }]}>{t('{n} min read', { n: article.minutes })}</Text>

      {/* A skin issue: its full guide (illustrations, what skincare can and can't do, treatments) */}
      {getCondition(article.id) ? (
        <Pressable onPress={() => navigation.navigate('Condition', { id: article.id })} style={[styles.guideCard, { backgroundColor: colors.primarySoft }]}>
          <Text style={[TYPE.bodyStrong, { color: colors.primary }]}>{t('What skincare can do, the treatments, and when to see a dermatologist')} ›</Text>
        </Pressable>
      ) : null}

      <ArticleBody article={article} />

      {ingredients.length ? (
        <>
          <Text style={[styles.label, { color: colors.muted }]}>{t('INGREDIENTS IN THIS ARTICLE')}</Text>
          <View style={styles.chips}>
            {ingredients.map(i => (
              <Pressable key={i.id} onPress={() => navigation.navigate('Ingredient', { id: i.id })} style={[styles.chip, { backgroundColor: colors.primarySoft }]}>
                <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '600' }]}>{t(i.name)}</Text>
                <Ionicons name="chevron-forward" size={12} color={colors.primary} />
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <Button
        title={t('Ask Koda about this')}
        icon="koda"
        variant="secondary"
        style={{ marginTop: SPACING.xl }}
        onPress={() => navigation.navigate('Koda', {
          returnTo: 'Article',
          prefill: t('I just read "{title}" in the Skyncyclopedia. What does it mean for my skin?', { title: t(article.title) }),
        })}
      />

      {related.length ? (
        <>
          <Text style={[styles.label, { color: colors.muted }]}>{t('KEEP READING')}</Text>
          {related.map(a => (
            <Pressable key={a.id} onPress={() => navigation.navigate('Article', { id: a.id })} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name={a.icon} size={18} color={colors.primary} />
              <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]} numberOfLines={2}>{t(a.title)}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
          ))}
        </>
      ) : null}

      <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.xl }]}>
        {t('General information, not a diagnosis. For a persistent or painful problem, see a dermatologist.')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  guideCard: { borderRadius: 16, padding: SPACING.lg, marginTop: SPACING.lg },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, marginBottom: SPACING.sm },
});
