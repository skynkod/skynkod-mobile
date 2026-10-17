import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildRoutine, adjustRoutineForWeather, getRoutineConsistencyScore } from '../utils/routine-builder';

const COLORS = {
  background: '#F7F1F5',
  primary: '#B283AC',
  secondary: '#7A3E76',
  text: '#14121A',
  muted: '#9B97A0',
  border: '#E8E1ED',
  card: '#FFFFFF',
};

export default function RoutinesScreen() {
  const [selectedTab, setSelectedTab] = useState('morning');
  const [routine, setRoutine] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});

  useEffect(() => {
    // Demo routine - in real app, fetch from Supabase
    const demoRoutine = buildRoutine('Combination', ['Oily', 'Sensitive']);
    setRoutine(demoRoutine);
  }, []);

  const toggleStepComplete = (stepId) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  if (!routine) return <Text>Loading...</Text>;

  const currentRoutine = routine[selectedTab];
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const totalSteps = currentRoutine.length;
  const completionPercentage = Math.round((completedCount / totalSteps) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🔄 My Routines</Text>
          <Text style={styles.subtitle}>Built by Koda for you</Text>
        </View>

        <View style={styles.tabContainer}>
          {['morning', 'evening'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab === 'morning' ? '🌅 Morning' : '🌙 Evening'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Today's Progress</Text>
            <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
          </View>
          <View style={[styles.progressBar, { width: `${completionPercentage}%` }]} />
          <Text style={styles.stepsText}>{completedCount} of {totalSteps} steps</Text>
        </View>

        <View style={styles.stepsContainer}>
          {currentRoutine.map((step, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.stepCard, completedSteps[idx] && styles.stepCardCompleted]}
              onPress={() => toggleStepComplete(idx)}
            >
              <View style={styles.stepCheckbox}>
                <Text style={styles.stepOrder}>{step.order}</Text>
                {completedSteps[idx] && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepAction}>{step.action}</Text>
                <Text style={styles.stepProduct}>{step.product}</Text>
                <Text style={styles.stepTime}>⏱ {step.time}</Text>
                <Text style={styles.stepTip}>💡 {step.tip}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.adaptationCard}>
          <Text style={styles.adaptationTitle}>💡 Tips for This Routine</Text>
          {routine.adaptationTips.map((tip, idx) => (
            <Text key={idx} style={styles.adaptationTip}>
              • {tip}
            </Text>
          ))}
        </View>

        <View style={styles.weatherCard}>
          <Text style={styles.weatherTitle}>🌤 Weather Adjustments</Text>
          <Text style={styles.weatherTip}>{adjustRoutineForWeather('summer')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontWeight: '600', color: COLORS.text, fontSize: 14 },
  tabTextActive: { color: '#FFF' },
  progressCard: { marginHorizontal: 16, marginBottom: 20, backgroundColor: COLORS.card, borderRadius: 12, padding: 16 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 14, color: COLORS.muted },
  progressPercentage: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginBottom: 8 },
  stepsText: { fontSize: 12, color: COLORS.muted, textAlign: 'right' },
  stepsContainer: { paddingHorizontal: 16, marginBottom: 20 },
  stepCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: COLORS.border },
  stepCardCompleted: { opacity: 0.6, backgroundColor: '#F0F0F0' },
  stepCheckbox: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  stepOrder: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  checkmark: { position: 'absolute', color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  stepContent: { flex: 1 },
  stepAction: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  stepProduct: { fontSize: 12, color: COLORS.secondary, marginBottom: 4 },
  stepTime: { fontSize: 11, color: COLORS.muted, marginBottom: 4 },
  stepTip: { fontSize: 11, color: COLORS.primary, fontStyle: 'italic' },
  adaptationCard: { marginHorizontal: 16, marginBottom: 20, backgroundColor: COLORS.card, borderRadius: 12, padding: 16 },
  adaptationTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  adaptationTip: { fontSize: 12, color: COLORS.muted, lineHeight: 18, marginBottom: 6 },
  weatherCard: { marginHorizontal: 16, marginBottom: 32, backgroundColor: COLORS.card, borderRadius: 12, padding: 16 },
  weatherTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  weatherTip: { fontSize: 12, color: COLORS.muted, lineHeight: 18 },
});
