import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateEmergencyPlan, calculateSeverity, getSOS_Tips } from '../utils/emergency-mode';
import { Screen, Card, Button, Chip, Stepper, SectionHeader, Badge, useColors } from '../components/ui';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

const ISSUES = [
  { value: 'acne', label: 'Breakout', icon: 'flame-outline' },
  { value: 'redness', label: 'Redness', icon: 'thermometer-outline' },
  { value: 'dryness', label: 'Dryness', icon: 'water-outline' },
];

const SEVERITY_TONE = { low: 'success', moderate: 'warning', high: 'danger' };

export default function EmergencyScreen() {
  const colors = useColors();
  const [issue, setIssue] = useState('acne');
  const [score, setScore] = useState(5);
  const [plan, setPlan] = useState(null);

  const generate = () => {
    const severity = calculateSeverity(score);
    setPlan({ days: generateEmergencyPlan(issue, severity) || {}, severity });
  };

  return (
    <Screen back title="Emergency mode" subtitle="A calm 7-day recovery plan">
      <Card>
        <Text style={[TYPE.bodyStrong, { color: colors.text, marginBottom: SPACING.md }]}>What's going on?</Text>
        <View style={styles.chips}>
          {ISSUES.map(i => (
            <Chip key={i.value} label={i.label} icon={i.icon} selected={issue === i.value} onPress={() => { setIssue(i.value); setPlan(null); }} />
          ))}
        </View>
        <View style={{ height: SPACING.xl }} />
        <Stepper label="How severe?" hint="1 = mild · 10 = very severe" value={score} min={1} max={10} onChange={v => { setScore(v); setPlan(null); }} />
        <Button title="Generate my plan" icon="medkit-outline" onPress={generate} />
      </Card>

      {plan ? (
        <>
          <View style={[styles.planHead]}>
            <SectionHeader title="Your recovery plan" style={{ marginBottom: 0, marginTop: 0 }} />
            <Badge label={plan.severity} tone={SEVERITY_TONE[plan.severity] || 'primary'} />
          </View>
          {Object.values(plan.days).map((steps, idx) => (
            <Card key={idx} style={styles.dayCard}>
              <View style={[styles.dayNum, { backgroundColor: colors.primarySoft }]}>
                <Text style={[TYPE.overline, { color: colors.primary, fontSize: 9 }]}>Day</Text>
                <Text style={[TYPE.subheading, { color: colors.primary }]}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                {(steps || []).map((step, i) => (
                  <Text key={i} style={[TYPE.body, { color: colors.text }]}>{step}</Text>
                ))}
              </View>
            </Card>
          ))}

          <Card tone="soft" style={{ marginTop: SPACING.md }}>
            <View style={styles.tipsHead}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.primary} />
              <Text style={[TYPE.subheading, { color: colors.text }]}>Important</Text>
            </View>
            {getSOS_Tips().map((tip, idx) => (
              <Text key={idx} style={[TYPE.body, { color: colors.textSecondary, marginTop: 6 }]}>{tip}</Text>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  planHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.xxl, marginBottom: SPACING.md },
  dayCard: { flexDirection: 'row', gap: SPACING.lg, marginBottom: SPACING.md },
  dayNum: { width: 48, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  tipsHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
});
