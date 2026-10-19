import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from './ui';
import { useT } from '../utils/LanguageContext';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

// The blocks of a Skyncyclopedia article: paragraphs, headings, lists, steps,
// and tip / warning / dermatologist callouts.
export default function ArticleBody({ article }) {
  const colors = useColors();
  const t = useT();
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


  return <View style={{ marginTop: SPACING.md }}>{article.blocks.map(renderBlock)}</View>;
}

const styles = StyleSheet.create({
  h: { marginTop: SPACING.xl, marginBottom: SPACING.sm },
  p: { marginBottom: SPACING.md },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.sm },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 9 },
  num: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  callout: { flexDirection: 'row', gap: SPACING.md, borderRadius: RADIUS.md, padding: SPACING.md, marginVertical: SPACING.sm },
});
