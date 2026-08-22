import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'

export default function EmergencyScreen() {
  const [showTips, setShowTips] = useState(false)

  const emergencyTips = [
    'Wash with cool water immediately',
    'Avoid touching your face',
    'Use a gentle moisturizer',
    'Apply calming serum (chamomile/aloe)',
    'Avoid hot showers for 24 hours',
    'Skip active ingredients today',
    'Drink plenty of water',
    'Get enough sleep'
  ]

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🆘 Emergency Mode</Text>
        <Text style={styles.subtitle}>Your skin needs help!</Text>
      </View>

      <View style={styles.alertCard}>
        <Text style={styles.alertTitle}>Immediate Actions</Text>
        <Text style={styles.alertText}>
          Experiencing a skin emergency? Follow these steps to calm your skin quickly.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.expandBtn}
        onPress={() => setShowTips(!showTips)}
      >
        <Text style={styles.expandBtnText}>
          {showTips ? 'Hide' : 'Show'} Emergency Tips
        </Text>
      </TouchableOpacity>

      {showTips && (
        <View style={styles.tipsContainer}>
          {emergencyTips.map((tip, idx) => (
            <View key={idx} style={styles.tipItem}>
              <Text style={styles.tipNumber}>{idx + 1}</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>When to See a Dermatologist</Text>
        <Text style={styles.cardText}>
          • Severe burning or swelling{'\n'}
          • Spreading rash{'\n'}
          • Signs of infection{'\n'}
          • Symptoms lasting more than 3 days
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What to Avoid</Text>
        <Text style={styles.cardText}>
          ❌ Touching or picking{'\n'}
          ❌ Hot water{'\n'}
          ❌ Strong products{'\n'}
          ❌ Sun exposure{'\n'}
          ❌ Heavy makeup
        </Text>
      </View>

      <TouchableOpacity
        style={styles.contactBtn}
        onPress={() => Alert.alert('Contact', 'Emergency contact info would go here')}
      >
        <Text style={styles.contactBtnText}>Contact Dermatologist</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SKYNKOD_COLORS.bg,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D84040',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: SKYNKOD_COLORS.muted,
  },
  alertCard: {
    backgroundColor: '#FFE5E5',
    borderLeftWidth: 4,
    borderLeftColor: '#D84040',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  alertTitle: {
    fontWeight: 'bold',
    color: '#D84040',
    marginBottom: 8,
  },
  alertText: {
    color: SKYNKOD_COLORS.text,
    fontSize: 14,
  },
  expandBtn: {
    backgroundColor: SKYNKOD_COLORS.primary,
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  expandBtnText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tipsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: SKYNKOD_COLORS.border,
  },
  tipNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: SKYNKOD_COLORS.primary,
    color: 'white',
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: 'bold',
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    color: SKYNKOD_COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: SKYNKOD_COLORS.text,
    marginBottom: 12,
  },
  cardText: {
    color: SKYNKOD_COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  contactBtn: {
    backgroundColor: '#D84040',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  contactBtnText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
})