import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { addJournalEntry, getJournalEntries, deleteJournalEntry } from '../utils/journal-service';
import { useAuth } from '../utils/AuthContext';
import { Screen, Card, Button, Input, Stepper, BottomSheet, EmptyState, LoadingView, Banner, SectionHeader, IconButton, useColors } from '../components/ui';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

const MOODS = ['😭', '😕', '😐', '🙂', '😄'];

const EMPTY_ENTRY = {
  hydrationLevel: 5,
  barrierHealth: 5,
  acneLevel: 0,
  rednessLevel: 0,
  textureQuality: 5,
  mood: '🙂',
  routineCompleted: false,
  notes: '',
  overallSatisfaction: 5,
};

const formatDay = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
};

export default function JournalScreen({ route }) {
  const colors = useColors();
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [newEntry, setNewEntry] = useState(EMPTY_ENTRY);

  const loadEntries = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const result = await getJournalEntries(user.id);
    if (result.success) {
      setEntries(result.data || []);
      setError(null);
    } else {
      setError(result.error || 'Could not load your journal');
    }
    setLoading(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  // Home's "check-in" shortcut opens the new-entry sheet directly.
  useEffect(() => {
    if (route?.params?.openNew) setShowModal(true);
  }, [route?.params?.openNew]);

  const update = (patch) => setNewEntry(prev => ({ ...prev, ...patch }));

  const handleSaveEntry = async () => {
    if (!user?.id) return;
    setSaving(true);
    const result = await addJournalEntry(user.id, newEntry);
    setSaving(false);

    if (result.success) {
      setNewEntry(EMPTY_ENTRY);
      setShowModal(false);
      await loadEntries();
    } else {
      Alert.alert('Could not save', result.error || 'Please try again.');
    }
  };

  const handleDelete = (entry) => {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteJournalEntry(entry.id);
          if (result.success) loadEntries();
          else Alert.alert('Could not delete', result.error || 'Please try again.');
        },
      },
    ]);
  };

  if (loading) return <LoadingView label="Loading your journal…" />;

  return (
    <Screen
      title="Journal"
      subtitle="How is your skin feeling?"
      right={<IconButton icon="add" tone="primary" onPress={() => setShowModal(true)} accessibilityLabel="New entry" />}
    >
      {error ? <Banner message={error} actionLabel="Retry" onAction={loadEntries} /> : null}

      {entries.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="No entries yet"
          description="A quick daily check-in is the best way to understand what your skin needs."
          action="Write your first entry"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <>
          <SectionHeader title={`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} · last 30 days`} />
          {entries.map(entry => (
            <Card key={entry.id} style={styles.entryCard} onPress={() => handleDelete(entry)}>
              <View style={styles.entryHeader}>
                <View style={[styles.moodBubble, { backgroundColor: colors.primarySoft }]}>
                  <Text style={{ fontSize: 22 }}>{entry.mood || '🙂'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{formatDay(entry.date)}</Text>
                  <Text style={[TYPE.caption, { color: colors.muted }]}>
                    {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
              </View>

              <View style={styles.metrics}>
                {[
                  { label: 'Hydration', value: entry.hydration_level },
                  { label: 'Barrier', value: entry.barrier_health },
                  { label: 'Acne', value: entry.acne_level },
                  { label: 'Redness', value: entry.redness_level },
                ].map(m => (
                  <View key={m.label} style={[styles.metric, { backgroundColor: colors.surface }]}>
                    <Text style={[TYPE.subheading, { color: colors.primary }]}>{m.value ?? '–'}</Text>
                    <Text style={[TYPE.caption, { color: colors.muted, fontSize: 11 }]}>{m.label}</Text>
                  </View>
                ))}
              </View>

              {entry.notes ? (
                <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.md }]}>{entry.notes}</Text>
              ) : null}
            </Card>
          ))}
          <Text style={[TYPE.caption, { color: colors.muted, textAlign: 'center', marginTop: SPACING.sm }]}>
            Tap an entry to delete it
          </Text>
        </>
      )}

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <BottomSheet title="Today's check-in" onClose={() => setShowModal(false)}>
          <Text style={[TYPE.bodyStrong, { color: colors.text, marginBottom: SPACING.md }]}>Overall mood</Text>
          <View style={styles.moods}>
            {MOODS.map(mood => {
              const active = newEntry.mood === mood;
              return (
                <Pressable
                  key={mood}
                  onPress={() => update({ mood })}
                  style={[
                    styles.moodButton,
                    { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primarySoft : colors.card },
                  ]}
                >
                  <Text style={{ fontSize: 26 }}>{mood}</Text>
                </Pressable>
              );
            })}
          </View>

          <Stepper label="Hydration" hint="0 = very dry · 10 = plump" value={newEntry.hydrationLevel} onChange={v => update({ hydrationLevel: v })} />
          <Stepper label="Barrier health" hint="0 = stinging · 10 = resilient" value={newEntry.barrierHealth} onChange={v => update({ barrierHealth: v })} />
          <Stepper label="Acne" hint="0 = none · 10 = severe" value={newEntry.acneLevel} onChange={v => update({ acneLevel: v })} />
          <Stepper label="Redness" hint="0 = none · 10 = severe" value={newEntry.rednessLevel} onChange={v => update({ rednessLevel: v })} />

          <Input
            label="Notes"
            placeholder="New product, stress, sleep, weather…"
            value={newEntry.notes}
            onChangeText={notes => update({ notes })}
            multiline
          />

          <Button title="Save entry" onPress={handleSaveEntry} loading={saving} style={{ marginBottom: SPACING.xl }} />
        </BottomSheet>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  entryCard: { marginBottom: SPACING.md },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  moodBubble: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  metrics: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  metric: { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm, borderRadius: RADIUS.sm },
  moods: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xl },
  moodButton: { width: 54, height: 54, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
