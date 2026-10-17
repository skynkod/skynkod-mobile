import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { scoresFromJournal } from '../utils/skin-score-calculator';
import { getKodaSuggestion } from '../utils/koda-ai';
import { getJournalEntries } from '../utils/journal-service';
import { useAuth } from '../utils/AuthContext';
import { Screen, Card, SectionHeader, ProgressBar, IconCircle, IconButton, Button, Badge, useColors } from '../components/ui';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

const METRICS = [
  { key: 'hydration', label: 'Hydration', icon: 'water-outline' },
  { key: 'barrier', label: 'Barrier', icon: 'shield-checkmark-outline' },
  { key: 'acne', label: 'Clarity', icon: 'sparkles-outline' },
  { key: 'redness', label: 'Calm', icon: 'leaf-outline' },
];

const TREND = {
  improving: { label: 'Improving', icon: 'trending-up', tone: 'success' },
  worsening: { label: 'Needs care', icon: 'trending-down', tone: 'warning' },
  stable: { label: 'Stable', icon: 'remove', tone: 'primary' },
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function HomeScreen({ navigation }) {
  const colors = useColors();
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const result = await getJournalEntries(user.id, 30);
    if (result.success) setEntries(result.data || []);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const scores = scoresFromJournal(entries);
  const loggedToday = entries.some(e => e?.date && new Date(e.date).toDateString() === new Date().toDateString());
  const isEvening = new Date().getHours() >= 17;
  const scoreColor = v => (v >= 70 ? colors.success : v >= 45 ? colors.warning : colors.danger);
  const trend = TREND[scores?.trend] || TREND.stable;
  const firstName = (user?.email || '').split('@')[0];

  return (
    <Screen
      overline={new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
      title={`${greeting()}${firstName ? `,\n${firstName}` : ''}`}
      right={<IconButton icon="settings-outline" onPress={() => navigation.navigate('Settings')} accessibilityLabel="Settings" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Skin score */}
      <Card tone="primary" style={styles.hero}>
        {scores ? (
          <>
            <View style={styles.heroTop}>
              <View>
                <Text style={[TYPE.overline, { color: colors.onPrimary, opacity: 0.8 }]}>Skin score</Text>
                <Text style={[styles.heroScore, { color: colors.onPrimary }]}>{scores.overall}</Text>
              </View>
              <View style={[styles.trendPill, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <Ionicons name={trend.icon} size={14} color={colors.onPrimary} />
                <Text style={[TYPE.caption, { color: colors.onPrimary, fontWeight: '700' }]}>{trend.label}</Text>
              </View>
            </View>
            <View style={[styles.heroBar, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
              <View style={[styles.heroBarFill, { width: `${scores.overall}%`, backgroundColor: colors.onPrimary }]} />
            </View>
            <Text style={[TYPE.caption, { color: colors.onPrimary, opacity: 0.85, marginTop: SPACING.sm }]}>
              Based on {scores.entries} journal {scores.entries === 1 ? 'entry' : 'entries'} in the last 30 days
            </Text>
          </>
        ) : (
          <>
            <Text style={[TYPE.overline, { color: colors.onPrimary, opacity: 0.8 }]}>Skin score</Text>
            <Text style={[TYPE.heading, { color: colors.onPrimary, marginTop: SPACING.sm }]}>Log your first entry to unlock your score</Text>
            <Button
              title="Write today's entry"
              icon="create-outline"
              onPress={() => navigation.navigate('Journal', { openNew: Date.now() })}
              style={{ marginTop: SPACING.lg, backgroundColor: colors.card, borderColor: colors.card }}
              variant="ghost"
            />
          </>
        )}
      </Card>

      {/* Today */}
      <SectionHeader title="Today" />
      <View style={styles.todayRow}>
        <Card style={styles.todayCard} onPress={() => navigation.navigate('Routines', { tab: isEvening ? 'evening' : 'morning' })}>
          <IconCircle name={isEvening ? 'moon-outline' : 'sunny-outline'} />
          <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.md }]}>{isEvening ? 'Evening' : 'Morning'} routine</Text>
          <Text style={[TYPE.caption, { color: colors.muted, marginTop: 2 }]}>Tap to start</Text>
        </Card>
        <Card style={styles.todayCard} onPress={() => navigation.navigate('Journal', { openNew: Date.now() })}>
          <IconCircle
            name={loggedToday ? 'checkmark' : 'create-outline'}
            color={loggedToday ? colors.success : colors.primary}
            background={loggedToday ? colors.successSoft : colors.primarySoft}
          />
          <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.md }]}>Skin check-in</Text>
          <Text style={[TYPE.caption, { color: loggedToday ? colors.success : colors.muted, marginTop: 2 }]}>
            {loggedToday ? 'Done for today' : 'Not logged yet'}
          </Text>
        </Card>
      </View>

      {/* Metrics */}
      {scores ? (
        <>
          <SectionHeader title="Your skin" action="Analysis" onAction={() => navigation.navigate('Analysis')} style={{ marginTop: SPACING.xl }} />
          <Card>
            {METRICS.map((m, idx) => (
              <View key={m.key} style={[styles.metric, idx === METRICS.length - 1 && { marginBottom: 0 }]}>
                <View style={styles.metricHead}>
                  <Ionicons name={m.icon} size={16} color={colors.textSecondary} />
                  <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>{m.label}</Text>
                  <Text style={[TYPE.bodyStrong, { color: scoreColor(scores[m.key]) }]}>{scores[m.key]}</Text>
                </View>
                <ProgressBar value={scores[m.key] / 100} color={scoreColor(scores[m.key])} height={6} />
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {/* Koda */}
      <SectionHeader title="Koda's tip" style={{ marginTop: SPACING.xl }} />
      <Card tone="soft" onPress={() => navigation.navigate('Koda')}>
        <View style={{ flexDirection: 'row', gap: SPACING.md }}>
          <IconCircle name="sparkles" background={colors.card} />
          <View style={{ flex: 1 }}>
            <Text style={[TYPE.body, { color: colors.text }]}>{getKodaSuggestion().replace('💡 ', '')}</Text>
            <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700', marginTop: SPACING.sm }]}>Ask Koda →</Text>
          </View>
        </View>
      </Card>

      {/* Shortcuts */}
      <SectionHeader title="Shortcuts" style={{ marginTop: SPACING.xl }} />
      <View style={styles.shortcuts}>
        {[
          { label: 'Photos', icon: 'camera-outline', to: 'Photos' },
          { label: 'Products', icon: 'flask-outline', to: 'Products' },
          { label: 'Scanner', icon: 'barcode-outline', to: 'Scanner' },
          { label: 'SOS', icon: 'medkit-outline', to: 'Emergency' },
        ].map(s => (
          <Card key={s.to} style={styles.shortcut} onPress={() => navigation.navigate(s.to)}>
            <Ionicons name={s.icon} size={22} color={colors.primary} />
            <Text style={[TYPE.caption, { color: colors.text, fontWeight: '600', marginTop: 6 }]}>{s.label}</Text>
          </Card>
        ))}
      </View>

      {scores?.trend === 'worsening' ? (
        <View style={{ marginTop: SPACING.lg }}>
          <Badge label="Tip" tone="warning" />
          <Text style={[TYPE.caption, { color: colors.muted, marginTop: 6 }]}>
            Your skin looks more reactive this week. Emergency mode can help you build a gentle 7-day plan.
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { padding: SPACING.xl, marginBottom: SPACING.xl, borderRadius: RADIUS.xl },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroScore: { fontSize: 64, fontWeight: '800', letterSpacing: -2, marginTop: 2 },
  trendPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill },
  heroBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: SPACING.md },
  heroBarFill: { height: '100%', borderRadius: 4 },
  todayRow: { flexDirection: 'row', gap: SPACING.md },
  todayCard: { flex: 1 },
  metric: { marginBottom: SPACING.lg },
  metricHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  shortcuts: { flexDirection: 'row', gap: SPACING.sm },
  shortcut: { flex: 1, alignItems: 'center', paddingVertical: SPACING.lg, paddingHorizontal: 4 },
});
