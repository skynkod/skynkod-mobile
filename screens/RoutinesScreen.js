import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'

export default function RoutinesScreen() {
  const [routines, setRoutines] = useState([
    { id: 1, name: 'Morning', steps: ['Cleanser', 'Toner', 'Serum', 'Moisturizer', 'SPF'] },
    { id: 2, name: 'Night', steps: ['Cleanser', 'Toner', 'Serum', 'Moisturizer'] }
  ])
  const [showForm, setShowForm] = useState(false)
  const [routineName, setRoutineName] = useState('')
  const [steps, setSteps] = useState('')

  const handleAddRoutine = () => {
    if (!routineName.trim() || !steps.trim()) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    const stepArray = steps.split(',').map(s => s.trim())
    const newRoutine = {
      id: Date.now(),
      name: routineName,
      steps: stepArray
    }
    setRoutines([...routines, newRoutine])
    setRoutineName('')
    setSteps('')
    setShowForm(false)
    Alert.alert('Success', 'Routine added!')
  }

  const handleDeleteRoutine = (id) => {
    setRoutines(routines.filter(r => r.id !== id))
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Routines</Text>

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setShowForm(!showForm)}
      >
        <Text style={styles.addBtnText}>
          {showForm ? 'Cancel' : 'Create Routine'}
        </Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Routine name (e.g. Morning)"
            value={routineName}
            onChangeText={setRoutineName}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Steps (comma separated: Cleanser, Toner, Serum)"
            value={steps}
            onChangeText={setSteps}
            multiline
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleAddRoutine}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      {routines.map(routine => (
        <View key={routine.id} style={styles.routineCard}>
          <View style={styles.routineHeader}>
            <Text style={styles.routineName}>{routine.name}</Text>
            <TouchableOpacity onPress={() => handleDeleteRoutine(routine.id)}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.stepsContainer}>
            {routine.steps.map((step, idx) => (
              <View key={idx} style={styles.stepItem}>
                <Text style={styles.stepNumber}>{idx + 1}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SKYNKOD_COLORS.bg,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: SKYNKOD_COLORS.text,
  },
  addBtn: {
    backgroundColor: SKYNKOD_COLORS.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addBtnText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: SKYNKOD_COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: SKYNKOD_COLORS.text,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: SKYNKOD_COLORS.primary,
    padding: 12,
    borderRadius: 8,
  },
  saveBtnText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  routineCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: SKYNKOD_COLORS.text,
  },
  deleteText: {
    fontSize: 20,
    color: SKYNKOD_COLORS.muted,
  },
  stepsContainer: {
    backgroundColor: SKYNKOD_COLORS.bg,
    borderRadius: 8,
    padding: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SKYNKOD_COLORS.primary,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
    marginRight: 12,
  },
  stepText: {
    color: SKYNKOD_COLORS.text,
    fontSize: 14,
  },
})