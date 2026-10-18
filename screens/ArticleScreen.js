import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, EmptyState, Button, useColors } from '../components/ui';
import { useT } from '../utils/LanguageContext';
import { getArticle, SECTIONS, ARTICLES } from '../utils/encyclopedia';
import { getIngredient } from '../utils/ingredients-guide';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

// One Skyncyclopedia article.
export default function ArticleScreen({ navigation, route }) {
  const colors = useColors();
  const t = useT();
  const article = getArticle(route?.params?.id);

  if (!article) return <Screen back><EmptyState icon="alert-circle-outline" title={t('Article not found')} /></Screen>;

  const section = SECTIONS.find(s => s.id === article.section);
  const ingredients = (article.ingredients || []).map(getIngredient).filter(Boolean);
  const related = ARTICLES.filter(a => a.id !== article.id && a.section === article.section).slice(0, 3);

  const Callout = ({ icon, bg, fg, text }) => (
    <View style={[styles.callout, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={18} color={fg} style={{ marginTop: 2 }} />
      <Text style={[TYPE.body, { color: colors.text, flex: 1 }]}>{t(text)}</Text>
    </View>
  );

  const renderBlock = (b, i) => {
    if (b.h) return <Text key={i} style={[TYPE.heading, styles.h, { color: colors.text }]}>{t(b.h)}</Text>;
    if (b.p) return <Text key={i} style={[TYPE.body, styles.p, { color: colors.text }]}>{t(b.p)}</Text>;
    if (b.list) return (
      <View key={i} style={styles.p}>
        {b.list.map((item, j) => (
          <View key={j} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={[TYPE.body, { color: colors.text, flex: 1 }]}>{t(item)}</Text>
          </View>
        ))}
      </View>
    );
    if (b.steps) return (
      <View key={i} style={styles.p}>
        {b.steps.map((item, j) => (
          <View key={j} style={styles.item}>
            <View style={[styles.num, { backgroundColor: colors.primarySoft }]}>
              <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '800' }]}>{j + 1}</Text>
            </View>
            <Text style={[TYPE.body, { color: colors.text, flex: 1 }]}>{t(item)}</Text>
          </View>
        ))}
      </View>
    );
    if (b.tip) return <Callout key={i} icon="bulb-outline" bg={colors.primarySoft} fg={colors.primary} text={b.tip} />;
    if (b.warn) return <Callout key={i} icon="warning-outline" bg={colors.dangerSoft} fg={colors.danger} text={b.warn} />;
    if (b.derm) return <Callout key={i} icon="medkit-outline" bg={colors.cautionSoft || colors.surface} fg={colors.caution || colors.text} text={b.derm} />;
    return null;
  };

  return (
    <Screen back>
      <Text style={[TYPE.overline, { color: colors.primary }]}>{t(section?.label || '')}</Text>
      <Text style={[TYPE.title, { color: colors.text, marginTop: SPACING.xs }]}>{t(article.title)}</Text>
      {article.section !== 'myths' && article.subtitle ? (
        <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.xs }]}>{t(article.subtitle)}</Text>
      ) : null}
      <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.sm }]}>{t('{n} min read', { n: article.minutes })}</Text>

      <View style={{ marginTop: SPACING.md }}>{article.blocks.map(renderBlock)}</View>

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
        icon="chatbubble-ellipses-outline"
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
  h: { marginTop: SPACING.xl, marginBottom: SPACING.sm },
  p: { marginBottom: SPACING.md },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.sm },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 9 },
  num: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  callout: { flexDirection: 'row', gap: SPACING.md, borderRadius: RADIUS.md, padding: SPACING.md, marginVertical: SPACING.sm },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, marginBottom: SPACING.sm },
});
