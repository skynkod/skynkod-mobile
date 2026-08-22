import AsyncStorage from '@react-native-async-storage/async-storage'
import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'

export default function SettingsScreen({ navigation }) {
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [reminders, setReminders] = useState(true)

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          await AsyncStorage.removeItem('skynkod_user')
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        },
      },
    ])
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Account</Text>
          <TouchableOpacity>
            <Text style={styles.settingValue}>View Profile</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Email</Text>
          <TouchableOpacity>
            <Text style={styles.settingValue}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Daily Reminders</Text>
          <Switch
            value={reminders}
            onValueChange={setReminders}
            trackColor={{ false: '#767577', true: SKYNKOD_COLORS.primary }}
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#767577', true: SKYNKOD_COLORS.primary }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#767577', true: SKYNKOD_COLORS.primary }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Version</Text>
          <Text style={styles.settingValue}>1.0.0</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Privacy Policy</Text>
          <TouchableOpacity>
            <Text style={styles.link}>Read</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Terms of Service</Text>
          <TouchableOpacity>
            <Text style={styles.link}>Read</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: SKYNKOD_COLORS.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: SKYNKOD_COLORS.primary,
    marginBottom: 12,
  },
  settingRow: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    color: SKYNKOD_COLORS.text,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: SKYNKOD_COLORS.muted,
  },
  link: {
    fontSize: 14,
    color: SKYNKOD_COLORS.primary,
    textDecorationLine: 'underline',
  },
  logoutBtn: {
    backgroundColor: '#D84040',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  logoutText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
})